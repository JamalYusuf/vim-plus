#!/usr/bin/env node
/**
 * Build a Chrome Web Store–ready package of Vim+.
 *
 * Output:
 *   build/extension/          unpacked extension (manifest.json at this root)
 *   build/vim-plus-<ver>-chrome.zip   zip with files at archive root (not nested)
 *
 * Usage:
 *   node scripts/package-extension.js
 *   npm run package
 *   npm run package -- --skip-tsc   # if JS already compiled
 *   npm run package -- --keep-key   # keep manifest "key" (dev ID); default strips for CWS
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BUILD = path.join(ROOT, "build");
const EXT = path.join(BUILD, "extension");

const args = new Set(process.argv.slice(2));
const skipTsc = args.has("--skip-tsc");
const keepKey = args.has("--keep-key");
const quiet = args.has("-q") || args.has("--quiet");

function log(...m) {
  if (!quiet) console.log(...m);
}
function fail(msg) {
  console.error("package-extension:", msg);
  process.exit(1);
}

function rimraf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function shouldSkipName(name) {
  if (name === ".DS_Store" || name === "Thumbs.db") return true;
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return true;
  if (name.endsWith(".map")) return true;
  if (name.endsWith(".md")) return true;
  if (name === "tsconfig.json") return true;
  if (name.endsWith(".d.ts")) return true;
  return false;
}

/** Copy runtime files from a directory (non-recursive filter on files). */
function copyTree(relDir, { extensions = null, recursive = true } = {}) {
  const srcRoot = path.join(ROOT, relDir);
  if (!fs.existsSync(srcRoot)) {
    log("  skip missing:", relDir);
    return 0;
  }
  let count = 0;
  const walk = (abs, rel) => {
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      if (shouldSkipName(ent.name)) continue;
      const absPath = path.join(abs, ent.name);
      const relPath = path.join(rel, ent.name);
      if (ent.isDirectory()) {
        if (recursive) walk(absPath, relPath);
        continue;
      }
      if (extensions) {
        const ext = path.extname(ent.name).toLowerCase();
        if (!extensions.has(ext)) continue;
      }
      copyFile(absPath, path.join(EXT, relPath));
      count++;
    }
  };
  walk(srcRoot, relDir);
  return count;
}

function copyOne(rel) {
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) fail("required file missing: " + rel);
  copyFile(src, path.join(EXT, rel));
}

function runTsc() {
  log("→ compiling TypeScript (npm run tsc)…");
  const r = spawnSync("npm", ["run", "tsc"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) fail("tsc failed");
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  return pkg.version || "0.0.0";
}

function writeStoreManifest() {
  const raw = fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8");
  const manifest = JSON.parse(raw);
  if (!keepKey && manifest.key) {
    delete manifest.key;
    log("→ stripped manifest.key (stable ID is assigned by Chrome Web Store)");
  }
  // Ensure version fields present
  if (!manifest.version) fail("manifest.json missing version");
  fs.writeFileSync(
    path.join(EXT, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );
}

function assertRuntimePresent() {
  const required = [
    "manifest.json",
    "background/worker.js",
    "content/frontend.js",
    "pages/options.html",
    "pages/sidepanel.html",
    "front/vomnibar.html",
    "front/vomnibar.js",
    "icons/icon128.png",
    "settings-template.json",
    "_locales/en/messages.json",
  ];
  const missing = required.filter((f) => !fs.existsSync(path.join(EXT, f)));
  if (missing.length) {
    fail(
      "package incomplete, missing:\n  " +
        missing.join("\n  ") +
        "\nRun without --skip-tsc, or compile first."
    );
  }
}

function createZip(version) {
  const zipName = `vim-plus-${version}-chrome.zip`;
  const zipPath = path.join(BUILD, zipName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // Prefer system zip so archive root = contents of build/extension (manifest.json at root)
  const zipBin = spawnSync("which", ["zip"], { encoding: "utf8" });
  if (zipBin.status === 0) {
    log("→ zipping with system zip…");
    execFileSync(
      "zip",
      ["-r", "-q", "-X", zipPath, ".", "-x", "*.DS_Store", "-x", "**/.DS_Store"],
      { cwd: EXT, stdio: "inherit" }
    );
  } else {
    // Fallback: Python zipfile (available on macOS)
    log("→ zipping with Python…");
    const py = `
import os, zipfile
root = ${JSON.stringify(EXT)}
out = ${JSON.stringify(zipPath)}
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f == ".DS_Store":
                continue
            abs = os.path.join(dirpath, f)
            rel = os.path.relpath(abs, root)
            z.write(abs, rel.replace(os.sep, "/"))
print("wrote", out)
`;
    execFileSync("python3", ["-c", py], { stdio: "inherit" });
  }

  // Validate zip root
  let listing = "";
  try {
    listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
  } catch {
    listing = execFileSync("python3", ["-c", `
import zipfile
z=zipfile.ZipFile(${JSON.stringify(zipPath)})
print("\\n".join(z.namelist()[:30]))
`], { encoding: "utf8" });
  }
  const names = listing.split(/\r?\n/).filter(Boolean);
  if (!names.includes("manifest.json")) {
    // sometimes listed with ./manifest.json
    const has = names.some((n) => n === "manifest.json" || n === "./manifest.json");
    if (!has) {
      console.error("First zip entries:\n" + names.slice(0, 20).join("\n"));
      fail(
        "manifest.json is NOT at the zip root. Chrome Web Store requires the zip root to contain manifest.json directly (not inside a subfolder)."
      );
    }
  }
  // Detect common mistake: single top-level folder
  const tops = new Set(
    names.map((n) => n.replace(/^\.\//, "").split("/")[0]).filter(Boolean)
  );
  if (tops.size === 1 && !tops.has("manifest.json") && names.every((n) => n.includes("/"))) {
    fail(
      "zip appears nested under a single folder: " +
        [...tops][0] +
        " — Chrome will reject this."
    );
  }

  return { zipPath, zipName, fileCount: names.length };
}

function writeBuildReadme(version, zipName) {
  const text = `# Vim+ store package

Generated by \`npm run package\` (or \`node scripts/package-extension.js\`).

## Artifacts

| Path | Purpose |
|------|---------|
| \`extension/\` | Unpacked extension — load this folder in \`chrome://extensions\` |
| \`${zipName}\` | Upload this file to the Chrome Web Store |

## Chrome Web Store

1. Run \`npm run package\` from the repo root (not from an arbitrary archive of the whole monorepo).
2. Upload **only** \`${zipName}\` (or the zip under \`build/\`).
3. Do **not** zip the entire git repo / \`site/\` / \`docs/\` / \`node_modules\`.

The zip is built so **\`manifest.json\` is at the archive root**.

## Version

Package version: **${version}**

## Flags

\`\`\`bash
npm run package                 # tsc + build/extension + zip
npm run package -- --skip-tsc   # reuse existing compiled JS
npm run package -- --keep-key   # keep manifest.key (local stable ID)
\`\`\`
`;
  fs.writeFileSync(path.join(BUILD, "README.md"), text, "utf8");
}

function main() {
  process.chdir(ROOT);
  log("Vim+ Chrome package");
  log("root:", ROOT);

  if (!skipTsc) runTsc();
  else log("→ skipping tsc (--skip-tsc)");

  // Clean previous package tree only (keep other build artifacts if any)
  rimraf(EXT);
  mkdirp(EXT);

  log("→ copying extension files into build/extension/…");
  let n = 0;
  n += copyTree("background", { extensions: new Set([".js"]) });
  n += copyTree("content", { extensions: new Set([".js"]) });
  n += copyTree("lib", {
    extensions: new Set([".js", ".css"]),
  });
  n += copyTree("front", {
    extensions: new Set([".js", ".html", ".css", ".txt", ".png", ".svg"]),
  });
  n += copyTree("pages", {
    extensions: new Set([".js", ".html", ".css", ".png", ".svg", ".jpg", ".jpeg", ".webp"]),
  });
  n += copyTree("icons", {
    extensions: new Set([".png", ".svg", ".jpg"]),
  });
  n += copyTree("_locales", { extensions: new Set([".json"]) });
  n += copyTree("i18n", { extensions: new Set([".json"]) });
  copyOne("settings-template.json");
  writeStoreManifest();
  n += 2;
  log("  copied ~" + n + " files");

  assertRuntimePresent();

  const version = readVersion();
  // Align package version with manifest if different
  const man = JSON.parse(fs.readFileSync(path.join(EXT, "manifest.json"), "utf8"));
  const ver = man.version || version;

  const { zipPath, zipName, fileCount } = createZip(ver);
  writeBuildReadme(ver, zipName);

  const st = fs.statSync(zipPath);
  log("");
  log("Done.");
  log("  Unpacked:  build/extension/   (" + fileCount + " files in zip listing)");
  log("  Store zip: build/" + zipName + "  (" + (st.size / 1024).toFixed(1) + " KB)");
  log("");
  log("Upload build/" + zipName + " to the Chrome Web Store.");
  log("Or load unpacked: chrome://extensions → Load unpacked → build/extension");
}

main();
