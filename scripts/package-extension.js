#!/usr/bin/env node
/**
 * Build a Chrome Web Store–ready package of Vim+.
 *
 * Output:
 *   build/extension/          unpacked extension only (manifest.json here)
 *   build/vim-plus-<ver>-chrome.zip   zip with files at archive root (not nested)
 *
 * Usage:
 *   node scripts/package-extension.js
 *   npm run package
 *   npm run extension               # unpacked folder only (keeps manifest.key)
 *   npm run package -- --skip-tsc   # if JS already compiled
 *   npm run package -- --keep-key   # keep manifest "key" (dev ID); default strips for CWS
 *   npm run package -- --no-zip     # skip the store zip
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
const noZip = args.has("--no-zip");
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
  // CWS assigns the item ID. A leftover local `key` (or self-host update_url)
  // makes the store reject the upload: "key field value doesn't match".
  if (!keepKey) {
    if (manifest.key) {
      delete manifest.key;
      log("→ stripped manifest.key (Chrome Web Store owns the item ID)");
    }
    if (manifest.update_url) {
      delete manifest.update_url;
      log("→ stripped update_url (Chrome Web Store serves updates)");
    }
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

function dirSize(dir) {
  let total = 0;
  const walk = (abs) => {
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      const p = path.join(abs, ent.name);
      if (ent.isDirectory()) walk(p);
      else total += fs.statSync(p).size;
    }
  };
  walk(dir);
  return total;
}

function formatBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

function writeBuildReadme(version, zipName) {
  const zipRow = zipName
    ? `| \`${zipName}\` | Upload this file to the Chrome Web Store |\n`
    : "";
  const text = `# Vim+ extension build

Generated by \`npm run extension\` / \`npm run package\`.

This directory is **not** the git repo. It has no \`node_modules\`, TypeScript sources,
docs site, or tests.

## Artifacts

| Path | Purpose |
|------|---------|
| \`extension/\` | Unpacked extension — **Load unpacked** this folder |
${zipRow}
## Load in Chrome

1. \`chrome://extensions\` → Developer mode
2. **Load unpacked** → choose \`build/extension\` (this folder’s \`extension/\` directory)
3. Do **not** load the repository root (that tree is 100MB+ because of \`node_modules\`)

## Rebuild

\`\`\`bash
npm run extension               # unpacked only, keeps local extension id
npm run package                 # unpacked + store zip (strips manifest.key)
npm run package -- --skip-tsc   # reuse existing compiled JS
\`\`\`

Package version: **${version}**
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
  if (fs.existsSync(path.join(ROOT, "LICENSE.txt"))) {
    copyOne("LICENSE.txt");
    n += 1;
  }
  writeStoreManifest();
  n += 2;
  log("  copied ~" + n + " files");

  assertRuntimePresent();

  const version = readVersion();
  const man = JSON.parse(fs.readFileSync(path.join(EXT, "manifest.json"), "utf8"));
  const ver = man.version || version;

  const extBytes = dirSize(EXT);
  log("");
  log("Done.");
  log("  Unpacked:  build/extension/   (" + formatBytes(extBytes) + ")");
  log("  Load this folder in chrome://extensions → Load unpacked");

  if (noZip) {
    writeBuildReadme(ver, null);
    return;
  }

  const { zipPath, zipName, fileCount } = createZip(ver);
  writeBuildReadme(ver, zipName);
  const st = fs.statSync(zipPath);
  log("  Store zip: build/" + zipName + "  (" + (st.size / 1024).toFixed(1) + " KB, " + fileCount + " files)");
  log("");
  log("Upload build/" + zipName + " to the Chrome Web Store.");
}

main();
