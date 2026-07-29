/**
 * Internal Vim+ wiki content.
 * Add pages by appending to WIKI_PAGES — no external network required.
 */
export interface WikiPage {
  id: string
  title: string
  subtitle?: string
  /** Sidebar group label */
  group?: string
  /** Related page ids */
  related?: string[]
  /** Simple HTML (no scripts). Use headings, p, ul, table, pre, code, kbd, a[href^="#"] or relative .html */
  html: string
}

export const WIKI_PAGES: WikiPage[] = [
  {
    id: "home",
    title: "Vim+ Wiki",
    subtitle: "Keyboard-first Chrome · docs live inside the extension",
    group: "Start",
    related: ["getting-started", "vim-concepts", "modes", "options-overview", "architecture", "keys"],
    html: `
<div class="hero">
  <p><strong>Vim+</strong> is a keyboard navigation extension for Google Chrome by
  <strong>Jamal Yusuf</strong> (<a href="https://jamal.dev" target="_blank" rel="noopener">jamal.dev</a>).
  This wiki is the product + developer handbook: how to use it, why it is designed this way,
  and how pieces fit together under Manifest V3.</p>
</div>
<div class="card-grid">
  <a class="card" href="#getting-started"><h3>Getting started</h3><p>Install, first keys, daily loop.</p></a>
  <a class="card" href="#vim-concepts"><h3>Vim concepts</h3><p>Modes, counts, maps — theory.</p></a>
  <a class="card" href="#modes"><h3>Modes &amp; how to use</h3><p>What to press when.</p></a>
  <a class="card" href="#options-overview"><h3>Options tour</h3><p>Tabs, save, reset, backup.</p></a>
  <a class="card" href="#key-mappings"><h3>Key mappings</h3><p>map / unmap + keystroke pipeline.</p></a>
  <a class="card" href="#exclusions"><h3>Excluded sites</h3><p>When not to capture keys.</p></a>
  <a class="card" href="#architecture"><h3>Architecture</h3><p>MV3, content vs background.</p></a>
  <a class="card" href="#message-flow"><h3>Message flow</h3><p>Ports, keys → commands.</p></a>
  <a class="card" href="#page-enhance"><h3>Page enhance</h3><p>Progress, reader, FX internals.</p></a>
  <a class="card" href="#omnibar"><h3>Omnibar &amp; palette</h3><p>History, :commands, engines.</p></a>
  <a class="card" href="#permissions"><h3>Permissions</h3><p>Why each Chrome permission is requested.</p></a>
</div>
<div class="callout tip"><strong>Open anytime:</strong>
  Side panel Wiki · Options gear · <kbd>?</kbd> · omnibar <code>:wiki</code>.</div>
<p><strong>Options deep dives:</strong>
  <a href="#keyboard-layout">layouts</a> ·
  <a href="#site-maps">site maps</a> ·
  <a href="#user-css">user CSS</a> ·
  <a href="#clip-sub">clipSub</a> ·
  <a href="#vomnibar-options">vomnibar JSON</a> ·
  <a href="#newtab-url">new tab URL</a> ·
  <a href="#chrome-shortcuts">global shortcuts</a> ·
  <a href="#test-keys">key testing</a> ·
  <a href="#inject-extensions">inject into extensions</a> ·
  <a href="#reading-view">reading tools</a> ·
  <a href="#hashbangs">AI hashbangs</a> ·
  <a href="#permissions">permissions (Web Store)</a>.</p>
`
  },
  {
    id: "getting-started",
    title: "Getting started",
    subtitle: "From install to comfortable daily use",
    group: "Start",
    related: ["vim-concepts", "modes", "keys", "side-panel"],
    html: `
<ol class="steps">
  <li><strong>Install.</strong> <code>chrome://extensions</code> → Developer mode →
    <strong>Load unpacked</strong> → this folder. Pin the icon.</li>
  <li><strong>Command center.</strong> Click the icon or <kbd>Alt+Shift+V</kbd> / <kbd>gS</kbd>.
    Use the gear <strong>Options</strong>, <strong>Help</strong>, <strong>Wiki</strong>, and
    <strong>Off for this site</strong> when a page fights keyboard control.</li>
  <li><strong>First keys on a normal webpage</strong> (not <code>chrome://</code>):
    <table>
      <tr><td><kbd>j</kbd> <kbd>k</kbd></td><td>Scroll down / up</td></tr>
      <tr><td><kbd>f</kbd></td><td>Link hints — type the letters that appear</td></tr>
      <tr><td><kbd>o</kbd></td><td>Omnibar (search history / type URLs)</td></tr>
      <tr><td><kbd>:</kbd></td><td>Command palette (e.g. <code>:hl</code> <code>:read</code> <code>:zen</code>)</td></tr>
      <tr><td><kbd>?</kbd></td><td>Help overlay</td></tr>
      <tr><td><kbd>i</kbd> then <kbd>Esc</kbd></td><td>Insert mode (type in page) · back to Normal</td></tr>
    </table>
  </li>
  <li><strong>Tabs.</strong> <kbd>t</kbd> tab picker · <kbd>J</kbd>/<kbd>K</kbd> or mapped next/prev ·
    side panel → Tabs / Closed to restore sessions.</li>
  <li><strong>Customize lightly.</strong> Options tabs: Start · Keys · Search · Look · Advanced.
    Change one thing at a time. Full walkthrough: <a href="#vim-concepts">Vim concepts</a>.</li>
</ol>
<div class="callout"><strong>chrome:// pages:</strong> content scripts cannot run there.
  Use Chrome’s <code>chrome://extensions/shortcuts</code> + the side panel.</div>
<div class="callout tip"><strong>Stuck on a site?</strong> Side panel → <strong>Off for this site</strong>
  adds an exclusion rule. Undo under Options → Excluded URLs.</div>
`
  },
  {
    id: "vim-concepts",
    title: "Vim concepts (plain English)",
    subtitle: "What “vim-like” means in Vim+",
    group: "Start",
    related: ["modes", "getting-started", "keys", "advanced"],
    html: `
<p>Vim+ is not a full Vim editor. It borrows a few powerful ideas so the browser stays keyboard-first.</p>
<h3>1. Modes</h3>
<p>You are usually in <strong>Normal</strong> mode: keys are commands (scroll, hints, open omnibar),
  not letters into the page. When you focus an input, you enter <strong>Insert</strong>-like behavior
  so typing works. Press <kbd>Esc</kbd> to leave inputs and return to commands.</p>
<h3>2. Counts</h3>
<p>Many actions accept a number prefix: <kbd>5</kbd><kbd>j</kbd> scrolls several steps.
  Think “do this N times.”</p>
<h3>3. Operators + targets (simplified)</h3>
<p>Classic Vim uses operator + motion (e.g. delete word). Vim+ mostly uses
  <strong>single keys</strong> and <strong>hints</strong> (<kbd>f</kbd>) instead of full operators —
  faster for browsing.</p>
<h3>4. Mappings</h3>
<p>Keys are not hard-coded forever. Options → <strong>Custom key mappings</strong> lets you
  <code>map</code>, <code>unmap</code>, and chain commands. Start from the author template if unsure.</p>
<h3>5. Exclusions</h3>
<p>Some sites need the mouse or their own shortcuts (Gmail, Figma, games).
  Exclude them so Vim+ stays out of the way — side panel <strong>Off for this site</strong>
  or Options → Excluded URLs.</p>
<div class="callout tip">Next: <a href="#modes">Modes &amp; how to use</a> · <a href="#advanced">Advanced</a></div>
`
  },
  {
    id: "modes",
    title: "Modes & how to use",
    subtitle: "What mode you’re in and what to press",
    group: "Start",
    related: ["vim-concepts", "keys", "omnibar", "link-hints"],
    html: `
<table>
  <tr><th>Mode</th><th>How you get there</th><th>What to do</th></tr>
  <tr>
    <td><strong>Normal</strong></td>
    <td>Default on pages · <kbd>Esc</kbd> from inputs</td>
    <td>Scroll <kbd>j</kbd>/<kbd>k</kbd>, hints <kbd>f</kbd>, omnibar <kbd>o</kbd>, palette <kbd>:</kbd></td>
  </tr>
  <tr>
    <td><strong>Insert / typing</strong></td>
    <td>Click or <kbd>i</kbd> / focus a field</td>
    <td>Type as usual · <kbd>Esc</kbd> or <kbd>Ctrl+[</kbd> to leave</td>
  </tr>
  <tr>
    <td><strong>Link hints</strong></td>
    <td><kbd>f</kbd> / <kbd>F</kbd></td>
    <td>Type the label on the link · Esc cancels</td>
  </tr>
  <tr>
    <td><strong>Find</strong></td>
    <td><kbd>/</kbd></td>
    <td>Search page text · <kbd>n</kbd>/<kbd>N</kbd> next/prev</td>
  </tr>
  <tr>
    <td><strong>Visual</strong></td>
    <td><kbd>v</kbd> (if mapped)</td>
    <td>Select text with motions · yank/copy as configured</td>
  </tr>
  <tr>
    <td><strong>Omnibar</strong></td>
    <td><kbd>o</kbd> <kbd>O</kbd> <kbd>b</kbd> <kbd>T</kbd>…</td>
    <td>Search open/history · <kbd>:</kbd> commands · arrows + Enter</td>
  </tr>
  <tr>
    <td><strong>Highlighter</strong></td>
    <td><code>:hl</code></td>
    <td>Pick color · select text · click mark to comment · Done</td>
  </tr>
  <tr>
    <td><strong>Reader View</strong></td>
    <td><code>:read</code></td>
    <td>Clutter-free article · Close to restore</td>
  </tr>
  <tr>
    <td><strong>Zen window</strong></td>
    <td><code>:zen</code></td>
    <td>App-style window without browser URL bar · again to exit</td>
  </tr>
</table>
<div class="callout"><strong>Rule of thumb:</strong> if keys type into the page instead of commanding,
  you’re not in Normal — press <kbd>Esc</kbd>.</div>
`
  },
  {
    id: "advanced",
    title: "Advanced customization",
    subtitle: "Keys, exclusions, palette, power workflows",
    group: "Start",
    related: ["omnibar", "keys", "side-panel", "permissions"],
    html: `
<h3>Command palette (<kbd>:</kbd>)</h3>
<p>Type <kbd>o</kbd> then <kbd>:</kbd> (or map a direct open). Categories:
  <code>:view</code> <code>:read</code> <code>:tab</code> <code>:hist</code> <code>:priv</code>…
  Short cmds: <code>:hl</code> <code>:read</code> <code>:zen</code> <code>:prog</code> <code>:gray</code>.</p>
<h3>Key mappings</h3>
<p>Options → Keys. Use <code>map</code>, <code>unmap</code>, <code>mapKey</code>.
  Keep a backup of your mappings. Prefer additive maps over rewriting everything.</p>
<h3>Search engines &amp; hashbangs</h3>
<p><code>!g query</code> style engines live in Options → Search.
  Lines starting with <code>!</code> in some configs are comments — see Hashbangs wiki page.</p>
<h3>Exclusions</h3>
<p>Empty passKeys on a pattern = Vim+ fully off on that URL.
  Side panel <strong>Off for this site</strong> adds <code>:https://host/</code> rules for you.</p>
<h3>Look &amp; reading</h3>
<p>Reading progress bar, dark mode, custom CSS, HUD — Options → Look.
  Highlighter comments and marks persist per URL in local storage.</p>
<div class="callout tip">When something breaks after a map change, temporarily
  <code>unmapAll</code> is nuclear — prefer commenting one line at a time.</div>
`
  },
  {
    id: "options-overview",
    title: "Options page tour",
    subtitle: "How the Options UI is organized",
    group: "Options",
    related: ["key-mappings", "exclusions", "search-engines", "reading-view", "customization"],
    html: `
<p>Open Options from the side panel gear, <code>:opts</code>, or this wiki link:
  <a href="options.html">options.html</a>.</p>
<h3>Section tabs</h3>
<table>
  <tr><th>Tab</th><th>What lives there</th></tr>
  <tr><td><strong>Start</strong></td><td>Welcome, excluded sites, first-run tips</td></tr>
  <tr><td><strong>Keys</strong></td><td>Custom key mappings, key layout, link-hint characters, find mode</td></tr>
  <tr><td><strong>Search</strong></td><td>Search engines, hashbangs, new-tab URL, omnibar sizes</td></tr>
  <tr><td><strong>Look</strong></td><td>Dark mode, HUD, CSS, reading progress, icons, motion</td></tr>
  <tr><td><strong>Advanced</strong></td><td>Everything else + power-user toggles</td></tr>
</table>
<h3>Footer actions</h3>
<ul>
  <li><strong>Save</strong> — write all dirty fields (or <kbd>Ctrl+Enter</kbd>)</li>
  <li><strong>Reset to defaults</strong> — author template after confirm (export a backup first)</li>
  <li><strong>Import / Export</strong> — JSON backup and restore</li>
</ul>
<div class="callout tip">Prefer small edits: change one section, Save, test on a tab, then continue.</div>
<p>Related deep dives:
  <a href="#key-mappings">mappings</a> ·
  <a href="#exclusions">exclusions</a> ·
  <a href="#keyboard-layout">keyboard layout</a> ·
  <a href="#user-css">user CSS</a> ·
  <a href="#architecture">architecture</a>.</p>
`
  },
  {
    id: "key-mappings",
    title: "Key mappings deep dive",
    subtitle: "Theory, map / unmap / mapKey, and safe customization",
    group: "Options",
    related: ["options-overview", "keyboard-layout", "site-maps", "keys", "architecture"],
    html: `
<p>Options → <strong>Keys</strong> → Custom key mappings.</p>
<h3>Motivation</h3>
<p>Browsers only expose a few OS-level shortcuts. Everything else must be handled by an extension
  content script that sees key events <em>before</em> the page (when possible). Vim+ keeps a
  <strong>key → command</strong> table so you can rebind without rewriting code. That is the same
  idea as Vim’s <code>.vimrc</code>: declarative maps, not hard-coded if/else for every site.</p>
<h3>Basics</h3>
<pre>map j scrollDown
map k scrollUp
unmap F
map &lt;a-f&gt; LinkHints.activate
mapKey &lt;c-s-e&gt; &lt;esc&gt;
# comment line</pre>
<ul>
  <li><code>map KEY command [options]</code> — bind a command (optional command options)</li>
  <li><code>unmap KEY</code> — remove a binding from the map</li>
  <li><code>unmapAll</code> — clear defaults + previous lines (use carefully)</li>
  <li><code>mapKey from to</code> — rewrite a physical key to another key token before lookup</li>
  <li><code>shortcut name …</code> — configure Chrome extension command slots</li>
</ul>
<h3>How a keystroke is resolved (theory)</h3>
<ol class="steps">
  <li>Browser delivers a DOM keydown to the content script (if the frame is injected).</li>
  <li><strong>mapKey</strong> may rewrite the key (layout / ergonomics).</li>
  <li>The key is looked up in the current mode’s FSM (normal / insert / hints / visual…).</li>
  <li>If matched, the mapped command runs (content or background). Else the event may pass to the page.</li>
  <li>Exclusions can short-circuit the whole chain for a URL.</li>
</ol>
<p>That is why maps “only work inside Vim+” — they never replace OS shortcuts like
  <kbd>Cmd+T</kbd> unless Chrome’s shortcut API is used separately
  (<a href="chrome://extensions/shortcuts" target="_blank" rel="noopener">chrome://extensions/shortcuts</a>).</p>
<h3>Counts</h3>
<p>Digits accumulate a count, then a command: <kbd>5</kbd><kbd>j</kbd> ≈ scroll five steps.
  Motivation: match Vim’s “do N times” without needing a mouse wheel.</p>
<h3>Safety tips</h3>
<ol class="steps">
  <li><strong>Export</strong> settings before large rewrites.</li>
  <li>Append lines; don’t delete the whole template unless you mean to.</li>
  <li>Prefer <strong>Reset to defaults</strong> over guessing when things break.</li>
  <li>Use <a href="#exclusions">exclusions</a> on form-heavy sites instead of unmapping everything.</li>
</ol>
<div class="callout">Command names: side panel → <strong>Cmds</strong> · on-page <kbd>?</kbd> help.</div>
`
  },
  {
    id: "keyboard-layout",
    title: "Keyboard layouts & mapKey",
    subtitle: "How non-US layouts stay usable",
    group: "Options",
    related: ["key-mappings", "options-overview", "architecture"],
    html: `
<p>Options → <strong>Keys</strong> / keyboard layout rules, plus <code>mapKey</code> in mappings.</p>
<h3>Motivation</h3>
<p>Physical keys and the character a layout produces are different. On AZERTY or Dvorak,
  the key that Vim users think of as “j” may emit another character. If Vim+ only listened to
  character codes, maps would break when users switch layouts.</p>
<p>Chrome exposes both <strong>code</strong> (physical) and <strong>key</strong> (character).
  Vim+ can ignore layout for navigation keys so <kbd>hjkl</kbd>-style maps stay stable, or
  honor layout when typing into the page.</p>
<h3>Layout toggles (Options)</h3>
<ul>
  <li><strong>Always ignore keyboard layout</strong> — navigation uses physical positions</li>
  <li><strong>Ignore if not ASCII</strong> — reduce conflict with dead keys / IME</li>
  <li><strong>Ignore CapsLock</strong> — treat Caps as not shifting letter commands</li>
  <li><strong>Map modifier</strong> — advanced remaps of modifier behavior</li>
</ul>
<h3>mapKey examples</h3>
<pre>mapKey &lt;c-s-e&gt; &lt;esc&gt;
mapKey &lt;ø&gt; &lt;;>   # example: layout-specific char to semicolon</pre>
<p><code>mapKey</code> runs early: after that, normal <code>map</code> lines see the rewritten key.</p>
<div class="callout tip">If a map works on QWERTY but not on your layout, try enabling
  “Always ignore keyboard layout” or add a targeted <code>mapKey</code>.</div>
<p>Chrome keyboard events:
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code" target="_blank" rel="noopener">KeyboardEvent.code</a>
  ·
  <a href="https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key" target="_blank" rel="noopener">KeyboardEvent.key</a></p>
`
  },
  {
    id: "site-maps",
    title: "Site-specific mappings",
    subtitle: "Different keys on different websites",
    group: "Options",
    related: ["key-mappings", "exclusions", "architecture"],
    html: `
<p>You often want global maps <em>and</em> site exceptions. Vim+ approaches this in layers:</p>
<ol class="steps">
  <li><strong>Exclusions</strong> — disable Vim+ or pass some keys on a URL pattern
    (Options → Start, or side panel power toggle). Best when the site owns the keyboard.</li>
  <li><strong>Pass keys</strong> on an exclusion rule — keep Vim+ mostly on, but let the site
    receive listed keys (e.g. pass <code>j k</code> to a web reader).</li>
  <li><strong>Command options / env</strong> — some advanced maps use host conditions
    (see command help in <kbd>?</kbd> and <code>run</code> / env lines in templates).</li>
</ol>
<h3>Recommended pattern</h3>
<pre># Global
map j scrollDown
# On Gmail you often want almost no Vim+ interception:
# exclusion pattern  :https://mail.google.com/
# passKeys           (empty = fully off)</pre>
<div class="callout">There is no separate “per-site map file” UI — exclusions + passKeys cover
  90% of real cases without a second mapping language.</div>
`
  },
  {
    id: "exclusions",
    title: "Excluded sites",
    subtitle: "Theory: when not to capture keys",
    group: "Options",
    related: ["options-overview", "site-maps", "side-panel", "architecture"],
    html: `
<p>Options → <strong>Start</strong> → Excluded URLs and keys.</p>
<h3>Motivation</h3>
<p>A keyboard extension is in tension with rich web apps. If Vim+ always eats <kbd>j</kbd>/<kbd>k</kbd>,
  Gmail, Figma, and games feel broken. Exclusions are the escape hatch: declare where Vim+ should
  step aside so the page (or only some keys) stay in control.</p>
<h3>Patterns</h3>
<ul>
  <li><code>:https://mail.google.com/</code> — URL prefix (simplest, recommended)</li>
  <li><code>^https://example\\.com/app/</code> — JS regular expression (starts with <code>^</code>)</li>
  <li><code>\`…\`</code> — <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLPattern" target="_blank" rel="noopener">URLPattern</a>
    when supported (Chrome)</li>
</ul>
<h3>Pass keys column</h3>
<ul>
  <li><strong>Empty</strong> — wholly disable Vim+ on matches (power-toggle style)</li>
  <li><strong>List of keys</strong> — those keys go to the page; others still command Vim+</li>
  <li><strong>Starts with ^</strong> — inverted: only listed keys stay as Vim+ commands</li>
</ul>
<h3>Side panel power toggle</h3>
<p>ON/OFF next to the logo adds/removes full-host rules for the current site
  (<code>:https://host/</code> + http twin). Default for new sites is <strong>ON</strong>
  (no exclusion).</p>
<div class="callout tip">Also see Chrome site settings for permissions:
  <a href="chrome://settings/content" target="_blank" rel="noopener">chrome://settings/content</a></div>
`
  },
  {
    id: "reading-view",
    title: "Reading, progress & highlighter",
    subtitle: "Look tab options and :read / :hl / :prog",
    group: "Options",
    related: ["options-overview", "omnibar", "modes", "page-enhance"],
    html: `
<p>Options → <strong>Look</strong> → Reading &amp; View.</p>
<table>
  <tr><th>Option / command</th><th>Effect</th></tr>
  <tr><td>Reading progress</td><td><strong>Default on</strong> for all pages — gray track + red fill while scrolling</td></tr>
  <tr><td>Progress color / height</td><td>Built-in fill color and 1–12 px height</td></tr>
  <tr><td>Progress bar CSS</td><td>Optional extra CSS for <code>#vp-read-progress-track</code> / <code>-fill</code></td></tr>
  <tr><td>∞ mark</td><td>Hint when a page keeps growing near the bottom (infinite scroll)</td></tr>
  <tr><td><code>:prog</code></td><td>Toggle progress on the current page (session override)</td></tr>
  <tr><td><code>:read</code></td><td>Firefox-style Reader View (Mozilla Readability)</td></tr>
  <tr><td><code>:hl</code></td><td>Highlighter — select text; click mark for comments</td></tr>
  <tr><td><code>:yart</code></td><td>Copy article as markdown</td></tr>
  <tr><td><code>:zen</code></td><td>App window without browser URL bar</td></tr>
</table>
<h3>What you should see</h3>
<ol class="steps">
  <li>Leave progress checked (default) and <strong>Save</strong> if you changed anything.</li>
  <li>Open a long article and scroll — the red fill tracks position.</li>
  <li>Uncheck the option and save to hide the bar on all pages.</li>
  <li>Use Progress bar CSS for custom gradients, height, or glow.</li>
  <li><code>:prog</code> toggles for the current tab only.</li>
</ol>
<p>Highlights &amp; comments persist per URL and restore on page load.
  Internals: <a href="#page-enhance">Page enhance</a>.</p>
`
  },
  {
    id: "customization",
    title: "Look, CSS & power settings",
    subtitle: "Dark mode, HUD, user CSS, icons, sync",
    group: "Options",
    related: ["options-overview", "advanced", "permissions"],
    html: `
<p>Most of these sit under Options → <strong>Look</strong> and <strong>Advanced</strong>.</p>
<ul>
  <li><strong>Auto dark mode</strong> — follow system or force dark</li>
  <li><strong>Hide HUD</strong> — quieter insert-mode tips</li>
  <li><strong>User-defined CSS</strong> — style Vim+ UI (vomnibar, HUD, hints)</li>
  <li><strong>Action icon</strong> — toolbar icon on/off</li>
  <li><strong>Context menus</strong> — right-click entries</li>
  <li><strong>Smooth scroll / scroll step</strong> — feel of <kbd>j</kbd>/<kbd>k</kbd></li>
</ul>
<h3>Backup workflow</h3>
<ol class="steps">
  <li>Export settings (footer) after a good config.</li>
  <li>Experiment freely.</li>
  <li>Import the JSON file or use <strong>Reset to defaults</strong> if needed.</li>
</ol>
<div class="callout">User CSS can break layout if overly aggressive — scope selectors carefully.</div>
`
  },
  {
    id: "user-css",
    title: "User-defined CSS",
    subtitle: "Style hints, HUD, and omnibar scopes",
    group: "Options",
    related: ["customization", "architecture", "options-overview"],
    html: `
<p>Options → Look / Advanced → <strong>User-defined CSS</strong>.</p>
<h3>Motivation</h3>
<p>Vim+ UI is injected into pages and into extension pages (vomnibar iframe, help dialog).
  One global stylesheet cannot see every shadow root the same way. Scoped comments in the CSS
  field tell the injector which “document” a rule targets.</p>
<h3>Common scopes</h3>
<pre>/* default / content UI */
.LH { outline-color: #e11d48; }

/* find bar */
/* #find */
* { --find-bg: #111; }

/* omnibar document */
/* #omni */
body { font-size: 15px; }
.item.s { border-left-color: #fb7185; }</pre>
<p>Rules under a scope block apply to that UI surface. Prefer specific classes
  (hint markers, selection, HUD) over broad <code>*</code> resets.</p>
<div class="callout tip">After editing CSS, Save options and reopen the omnibar / hints to see changes.</div>
`
  },
  {
    id: "clip-sub",
    title: "Clipboard substitution (clipSub)",
    subtitle: "Sed-like rewrite of copy/paste text",
    group: "Options",
    related: ["options-overview", "omnibar", "advanced"],
    html: `
<p>Options → Advanced → <strong>Auto substitution of various text</strong> (<code>clipSub</code>).</p>
<h3>Motivation</h3>
<p>URLs from search engines, tracking redirects, and mail clients are often noisy.
  clipSub rewrites text <em>inside Vim+ copy/paste commands</em> so what lands on the clipboard
  is clean — without changing the page DOM.</p>
<h3>Prefix letters</h3>
<ul>
  <li><kbd>c</kbd> — when copying</li>
  <li><kbd>p</kbd> — when pasting</li>
  <li><kbd>s</kbd> — both</li>
  <li>Other letters may appear for specialized contexts (see examples in the option placeholder)</li>
</ul>
<pre>c/regexp-to-replace/target/g
p:regexp:target:i</pre>
<p>Syntax is a simplified sed: delimiter can be <code>/</code> or another character after the prefix.</p>
<div class="callout">clipSub does not affect native <kbd>Cmd/Ctrl+C</kbd> outside Vim+ commands.</div>
`
  },
  {
    id: "vomnibar-options",
    title: "Vomnibar JSON settings",
    subtitle: "maxMatches, queryInterval, sizes, styles",
    group: "Options",
    related: ["omnibar", "options-overview", "architecture"],
    html: `
<p>Options → Look/Advanced → <strong>Vomnibar settings</strong> (JSON object).</p>
<table>
  <tr><th>Field</th><th>Meaning</th></tr>
  <tr><td><code>maxMatches</code></td><td>How many suggestions to compute (typically 3–25)</td></tr>
  <tr><td><code>queryInterval</code></td><td>Debounce ms before querying (lower = snappier, more CPU)</td></tr>
  <tr><td><code>sizes</code></td><td>Geometry hints used to size the iframe height</td></tr>
  <tr><td><code>styles</code></td><td>Tokens like <code>dark</code>, <code>mono-url</code>, <code>time</code></td></tr>
  <tr><td><code>actions</code></td><td>Behavior flags such as <code>opener</code>, <code>icase</code></td></tr>
</table>
<h3>Motivation</h3>
<p>The omnibar lives in a separate iframe for isolation and security. Height and query rate
  cannot be “auto CSS only” — the parent page must be told an explicit pixel height.
  These JSON fields are the knobs for that contract.</p>
`
  },
  {
    id: "newtab-url",
    title: "New tab URL & Cmd/Ctrl+T",
    subtitle: "What opens when Vim+ creates tabs — and why Chrome still owns T",
    group: "Options",
    related: ["options-overview", "chrome-shortcuts", "architecture", "keys"],
    html: `
<p>Options → Advanced → <strong>New tab URL</strong>.</p>
<p>When a <em>Vim+ command</em> creates a tab (e.g. <code>createTab</code>, open-in-new-tab from hints),
  this URL is used. It does <strong>not</strong> replace Chrome’s built-in new-tab gesture by itself.</p>
<h3>Useful values</h3>
<ul>
  <li><code>pages/blank.html</code> — blank extension page (fast, no network)</li>
  <li><code>chrome://newtab</code> — browser NTP (Chrome may rewrite / restrict)</li>
  <li>Any <code>https://…</code> URL — open that page as your “new tab”</li>
  <li>Default search / homepage URL you prefer</li>
</ul>
<h3>Why can’t I focus the page on Cmd+T / Ctrl+T?</h3>
<p>Chrome owns <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>T</kbd>. Extensions cannot remap OS-level browser chrome
  shortcuts or fully hijack the real new-tab page without Chrome’s limited NTP APIs.
  Third-party “NewTab Adapter” style Web Store tools often go stale or disappear — Vim+ does
  <strong>not</strong> depend on them.</p>
<h3>Practical workarounds (no extra extension)</h3>
<ol class="steps">
  <li><strong>Use Vim+ to open tabs:</strong> map a key to <code>createTab</code> so you control the URL
    (Options → Custom key mappings). Example: <code>map nt createTab</code>.</li>
  <li><strong>Omnibar:</strong> <kbd>O</kbd> opens a new tab then omnibar — type a URL or hashbang.</li>
  <li><strong>Link hints:</strong> <kbd>F</kbd> opens links in a new tab (focus follows Chrome’s usual rules).</li>
  <li><strong>Side panel:</strong> keep the command center open so you rarely need the NTP.</li>
  <li><strong>Chrome settings:</strong> set On startup / home page under
    <code>chrome://settings/onStartup</code> if you want a fixed landing site for browser chrome actions.</li>
</ol>
<div class="callout tip"><strong>Focus after open:</strong> many open-in-new-tab commands accept
  options like <code>active</code> / switch-to-new-tab behavior in key maps. Prefer mapping what you need
  instead of fighting Chrome’s <kbd>T</kbd>.</div>
<div class="callout"><strong>Developer note:</strong> <code>chrome.tabs.create({ url })</code> uses this setting
  via the background open-URL path. The browser’s own new-tab command never goes through that path.</div>
<div class="callout tip">API reference:
  <a href="https://developer.chrome.com/docs/extensions/reference/api/tabs" target="_blank" rel="noopener">chrome.tabs</a>
  · related: <a href="#chrome-shortcuts">Global shortcuts</a></div>
`
  },
  {
    id: "inject-extensions",
    title: "Injecting into other extensions",
    subtitle: "Allow list of extension IDs + web_accessible resources",
    group: "Options",
    related: ["architecture", "permissions", "options-overview"],
    html: `
<p>Options → Advanced → <strong>Allow list of other extension IDs</strong>.</p>
<h3>Motivation</h3>
<p>Chrome isolates extensions. Another extension can only load Vim+ scripts if:</p>
<ol class="steps">
  <li>Its ID is listed here (allow list), and</li>
  <li>Vim+ exposes the needed files via <code>web_accessible_resources</code> in the manifest, and</li>
  <li>The other extension cooperates (loads the script into its pages)</li>
</ol>
<p>This is intentionally opt-in — otherwise any extension could ride Vim+’s privileges.</p>
<p>See Chrome docs:
  <a href="https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/"
     target="_blank" rel="noopener">web_accessible_resources</a>.</p>
`
  },
  {
    id: "architecture",
    title: "Architecture & design theory",
    subtitle: "How Vim+ is built — for developers and curious users",
    group: "Developers",
    related: ["key-mappings", "permissions", "extending", "omnibar", "devtools",
      "message-flow", "settings-pipeline", "page-enhance"],
    html: `
<p>Vim+ is a <strong>Manifest V3</strong> Chrome extension: service worker background, content scripts
  on web pages, and extension pages (options, wiki, vomnibar, side panel).</p>
<h3>Core idea</h3>
<p>Keyboard navigation is a <strong>mode machine</strong> plus a <strong>command registry</strong>:</p>
<ul>
  <li><strong>Content scripts</strong> own key events, scrolling, hints, visual/find, HUD, page enhance</li>
  <li><strong>Background (service worker)</strong> owns tabs/windows/history/bookmarks APIs,
    completions for the omnibar, settings, exclusions, quick-action injects</li>
  <li><strong>Omnibar iframe</strong> is a privileged UI surface that talks to background for
    suggestions, then asks content/background to navigate</li>
  <li><strong>Side panel</strong> is a durable command center that does not depend on page focus</li>
</ul>
<h3>Why this split?</h3>
<p>Chrome gives different APIs to different contexts. Content scripts can see the DOM and key events
  but cannot freely call <code>chrome.tabs</code> / history. The service worker can call those APIs
  but has no page DOM. The design is therefore a <strong>ports + messages</strong> system:
  content asks background to “do privileged work”; background asks content to “run page-local work”.</p>
<h3>Why MV3 matters</h3>
<p>Service workers can sleep; long-lived state must be rehydrated from
  <code>chrome.storage</code>. That is why settings are saved explicitly and why some actions
  re-inject content scripts after navigation. Do not assume a warm worker forever.</p>
<h3>Security model</h3>
<ul>
  <li>Content scripts run in an isolated world (page JS cannot call Vim+ internals directly)</li>
  <li><code>chrome://</code> pages are mostly off-limits — use OS shortcuts + side panel</li>
  <li>Host permissions and optional permissions gate bookmarks, cookies, etc.</li>
  <li>Injected page tools must be self-contained or load known bundled scripts (e.g. Readability)</li>
</ul>
<h3>Repo map</h3>
<pre>background/   service worker (settings, completion, quick_actions, ports)
content/      page key handlers, hints, scroller, page_enhance
front/        vomnibar UI (iframe)
pages/        options, wiki, sidepanel, action popup
lib/          shared utils, Readability bundle
typings/      TypeScript contracts for messages / settings
</pre>
<p>Deep dives:
  <a href="#message-flow">Message flow</a> ·
  <a href="#settings-pipeline">Settings pipeline</a> ·
  <a href="#page-enhance">Page enhance</a> ·
  <a href="#devtools">Developer handbook</a>
</p>
<p>Chrome docs:
  <a href="https://developer.chrome.com/docs/extensions/mv3/" target="_blank" rel="noopener">MV3</a>
  ·
  <a href="https://developer.chrome.com/docs/extensions/mv3/content_scripts/" target="_blank" rel="noopener">content scripts</a>
  ·
  <a href="https://developer.chrome.com/docs/extensions/reference/api/sidePanel" target="_blank" rel="noopener">sidePanel</a>
</p>
`
  },
  {
    id: "message-flow",
    title: "Message & port flow",
    subtitle: "How keys become actions across processes",
    group: "Developers",
    related: ["architecture", "settings-pipeline", "omnibar", "devtools"],
    html: `
<p>Understanding ports is the difference between “it works on my tab” and “I can change the product safely.”</p>
<h3>Typical key → action path</h3>
<ol class="steps">
  <li>User presses a key on a normal webpage.</li>
  <li><strong>Content</strong> <code>key_handler</code> maps the event through the key FSM
    (counts, multi-key sequences, insert vs normal).</li>
  <li>If the command is page-local (scroll, hints), content runs it immediately.</li>
  <li>If the command needs Chrome APIs (tabs, windows, history), content sends a message
    over the long-lived <strong>port</strong> to the service worker.</li>
  <li>Background <code>run_commands</code> / request handlers execute and may reply
    (status text for HUD, completion data, etc.).</li>
</ol>
<h3>Omnibar path</h3>
<ol class="steps">
  <li>Content (or a command) asks to open the vomnibar iframe.</li>
  <li>User types; vomnibar messages background for <strong>completions</strong>
    (history, domains, engines, quick actions).</li>
  <li>On Enter, background/content open URLs or run palette commands
    (sometimes via <code>chrome.scripting.executeScript</code> injects).</li>
</ol>
<h3>Why not “just call chrome.* from content”?</h3>
<p>Many APIs are background-only. Even when available, centralizing policy (exclusions,
  incognito, permissions) in one place avoids divergent bugs. Ports also survive short-lived
  message one-shots better for streaming completion updates.</p>
<div class="callout warn"><strong>Gotcha:</strong> after a worker restart, ports reconnect.
  Content must tolerate a brief “not ready” window. Do not store irreplaceable state only in SW memory.</div>
<div class="callout tip">Message type contracts live under <code>typings/</code> and
  <code>background/page_messages.d.ts</code> — extend those when adding request kinds.</div>
`
  },
  {
    id: "settings-pipeline",
    title: "Settings pipeline",
    subtitle: "Defaults → storage → caches → live update hooks",
    group: "Developers",
    related: ["architecture", "message-flow", "options-overview", "hashbangs"],
    html: `
<p>Settings look simple in the Options UI. Internally they pass through several layers.</p>
<h3>Layers</h3>
<table>
  <tr><th>Layer</th><th>Role</th></tr>
  <tr><td><code>defaults_</code> in <code>background/settings.ts</code></td>
    <td>Author defaults (hashbangs, key maps, reading progress…)</td></tr>
  <tr><td><code>chrome.storage.local</code> (+ optional sync)</td>
    <td>Persistence across restarts</td></tr>
  <tr><td><code>settingsCache_</code></td>
    <td>In-memory snapshot for the worker</td></tr>
  <tr><td><code>updateHooks_</code></td>
    <td>Recompute derived state (search engine map, CSS, icons…)</td></tr>
  <tr><td>Content payload / storage listeners</td>
    <td>Page scripts re-apply UI (progress color, exclusions)</td></tr>
</table>
<h3>Important details</h3>
<ul>
  <li><strong>Save is explicit</strong> on Options — dirty fields write on Save (or reset).</li>
  <li><strong>Hashbangs</strong> merge into the same engine map as search engines
    (parser order matters; leading <code>!</code> alone is a comment).</li>
  <li><strong>Empty field + save</strong> often means “restore default” for NonEmptyText models.</li>
  <li><strong>autoDarkMode</strong> values: <code>0</code> light, <code>1</code> dark, <code>2</code> system —
    Options, wiki, and HUD theming all read this.</li>
  <li>Content features that only read storage (progress bar) listen to
    <code>storage.onChanged</code> so Options saves apply without reloading the tab when possible.</li>
</ul>
<div class="callout tip">When adding a setting: default + type in <code>index.d.ts</code> + Options control
  + (if needed) update hook + wiki note + content listener.</div>
`
  },
  {
    id: "page-enhance",
    title: "Page enhance subsystem",
    subtitle: "Progress bar, reader, FX, highlighter — how content injects work",
    group: "Developers",
    related: ["architecture", "reading-view", "omnibar", "devtools"],
    html: `
<p><code>content/page_enhance.ts</code> owns in-page overlays that are not classic Vim keys:
  reading progress, spotlight/lens, hide images, device frames, highlighter restore, zen CSS.</p>
<h3>Design choices</h3>
<ul>
  <li><strong>Top frame only</strong> — avoid duplicate bars in every iframe.</li>
  <li><strong>Fixed overlays</strong> with high z-index and <code>pointer-events: none</code>
    so they never steal clicks.</li>
  <li><strong>Styles injected as a &lt;style&gt; tag</strong> with a stable id so re-apply replaces cleanly.</li>
  <li><strong>Command palette path</strong> (<code>:prog</code>, <code>:spot</code>…) may inject via
    background <code>quick_actions</code> when the content global is missing — both paths must stay compatible.</li>
</ul>
<h3>Reading progress (implementation note)</h3>
<p>The fill uses <code>transform: scaleX(p)</code> on a full-width child inside a fixed track.
  Do <em>not</em> drive the fill with CSS <code>width: 0 !important</code> plus JS width —
  <code>!important</code> wins over normal inline styles and freezes the bar as a gray track only.</p>
<pre>// good
fill.style.setProperty("transform", "scaleX(" + p + ")", "important")
// bad (historical bug)
/* #fill { width: 0 !important } */  el.style.width = p*100 + "%"</pre>
<p>Scroll metrics: prefer <code>documentElement.scrollHeight</code> and <code>pageYOffset</code>.
  Short pages (no overflow) stay at 0 until any scroll, then full.</p>
<h3>Reader View</h3>
<p>Uses Mozilla Readability bundled as an IIFE (<code>lib/vp_readability.js</code>), loaded and
  evaluated carefully so it is available inside the page isolate used by injectors.</p>
<div class="callout tip">If a page tool “does nothing,” check: top frame? CSP blocking inline style?
  content script excluded? service worker inject error in SW DevTools?</div>
`
  },
  {
    id: "keys",
    title: "Keyboard map",
    subtitle: "Common defaults — customize in Options → Custom key mappings",
    group: "Core",
    related: ["omnibar", "link-hints", "side-panel", "chrome-pages", "key-mappings"],
    html: `
<div class="callout tip">Live list: side panel → <strong>Keys</strong> / <strong>Cmds</strong>, or press <kbd>?</kbd>.</div>
<h3>Essentials</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td class="keys-row"><kbd>?</kbd></td><td>Help dialog (this menu’s cousin)</td></tr>
  <tr><td class="keys-row"><kbd>f</kbd> / <kbd>F</kbd></td><td>Link hints — current tab / new tab</td></tr>
  <tr><td class="keys-row"><kbd>o</kbd> / <kbd>O</kbd></td><td>Omnibar — current / new tab</td></tr>
  <tr><td class="keys-row"><kbd>j</kbd> <kbd>k</kbd> <kbd>h</kbd> <kbd>l</kbd></td><td>Scroll down / up / left / right</td></tr>
  <tr><td class="keys-row"><kbd>d</kbd> / <kbd>u</kbd></td><td>Page down / up</td></tr>
  <tr><td class="keys-row"><kbd>gg</kbd> / <kbd>G</kbd></td><td>Top / bottom</td></tr>
  <tr><td class="keys-row"><kbd>r</kbd></td><td>Reload</td></tr>
  <tr><td class="keys-row"><kbd>i</kbd></td><td>Insert mode (pass keys to page)</td></tr>
  <tr><td class="keys-row"><kbd>Esc</kbd></td><td>Exit mode / blur</td></tr>
</table>
<h3>Tabs &amp; windows</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td class="keys-row"><kbd>J</kbd> / <kbd>K</kbd> or <kbd>c</kbd>/<kbd>v</kbd></td><td>Previous / next tab</td></tr>
  <tr><td class="keys-row"><kbd>x</kbd> / <kbd>X</kbd></td><td>Close / restore tab</td></tr>
  <tr><td class="keys-row"><kbd>T</kbd></td><td>Tab switcher (omnibar)</td></tr>
  <tr><td class="keys-row"><kbd>gS</kbd></td><td>Command center (side panel)</td></tr>
  <tr><td class="keys-row"><kbd>gW</kbd></td><td>Cycle browser windows</td></tr>
  <tr><td class="keys-row"><kbd>gA</kbd></td><td>Omnibar: switch windows (filter &amp; Enter)</td></tr>
  <tr><td class="keys-row"><kbd>Alt</kbd>+← / → / ↑ / ↓</td><td>Dock window (repeat shrinks)</td></tr>
  <tr><td class="keys-row"><kbd>Alt+Shift+M</kbd></td><td>Maximize window</td></tr>
  <tr><td class="keys-row"><kbd>co</kbd> <kbd>c&gt;</kbd> <kbd>c&lt;</kbd></td><td>Close other / right / left tabs</td></tr>
  <tr><td class="keys-row"><kbd>zd</kbd></td><td>Discard (sleep) tab</td></tr>
</table>
<h3>Chrome power features</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td class="keys-row"><kbd>yg</kbd> / <kbd>yG</kbd></td><td>Tab group toggle / collapse</td></tr>
  <tr><td class="keys-row"><kbd>yr</kbd> / <kbd>ym</kbd></td><td>Reading list / bookmark</td></tr>
  <tr><td class="keys-row"><kbd>yy</kbd> / <kbd>yY</kbd></td><td>Copy URL / title</td></tr>
  <tr><td class="keys-row"><kbd>yp</kbd></td><td>Picture-in-Picture</td></tr>
  <tr><td class="keys-row"><kbd>gD</kbd> / <kbd>yl</kbd></td><td>Downloads page / last download</td></tr>
  <tr><td class="keys-row"><kbd>gH</kbd></td><td>History (omnibar)</td></tr>
</table>
`
  },
  {
    id: "hashbangs",
    title: "Hashbangs",
    subtitle: "Omnibar shortcuts — web search + AI prompt send",
    group: "Core",
    related: ["omnibar", "search-engines", "keys"],
    html: `
<p>Hashbangs are short keywords that expand to search (or chat) URLs in the omnibar —
  the same idea as Chrome keyword search engines.</p>
<h3>Usage</h3>
<ol class="steps">
  <li>Press <kbd>o</kbd> (current tab) or <kbd>O</kbd> (new tab).</li>
  <li>Type <code>!g cats</code>, <code>g cats</code>, <code>!grok explain async</code>, or
    start a prefix and pick an engine row.</li>
  <li>Enter to open. Matching engines appear as you type.</li>
</ol>
<h3>Built-in web search</h3>
<table>
  <tr><th>Keys</th><th>Engine</th></tr>
  <tr><td><code>g</code> · <code>!g</code></td><td>Google</td></tr>
  <tr><td><code>w</code> · <code>!w</code></td><td>Wikipedia</td></tr>
  <tr><td><code>gh</code> · <code>!gh</code></td><td>GitHub</td></tr>
  <tr><td><code>yt</code> · <code>!yt</code></td><td>YouTube</td></tr>
  <tr><td><code>d</code> · <code>!d</code></td><td>DuckDuckGo</td></tr>
  <tr><td><code>mdn</code> · <code>!mdn</code></td><td>MDN</td></tr>
  <tr><td><code>npm</code> · <code>!npm</code></td><td>npm</td></tr>
  <tr><td><code>so</code> · <code>!so</code></td><td>Stack Overflow</td></tr>
  <tr><td><code>t</code> · <code>!t</code></td><td>X (Twitter)</td></tr>
  <tr><td><code>hn</code> · <code>!hn</code></td><td>Hacker News</td></tr>
</table>
<h3>Built-in AI prompt send</h3>
<p>Type a bang, space, then your prompt. The site opens with the query filled when the provider supports it.</p>
<table>
  <tr><th>Keys</th><th>Service</th><th>Example</th></tr>
  <tr><td><code>grok</code> · <code>!grok</code> · <code>think</code></td><td>Grok (xAI)</td>
    <td><code>!grok summarize this PR strategy</code></td></tr>
  <tr><td><code>gpt</code> · <code>!gpt</code> · <code>chatgpt</code></td><td>ChatGPT (OpenAI)</td>
    <td><code>!gpt write a regex for emails</code></td></tr>
  <tr><td><code>claude</code> · <code>!claude</code></td><td>Claude (Anthropic)</td>
    <td><code>!claude explain monads simply</code></td></tr>
  <tr><td><code>gemini</code> · <code>!gemini</code></td><td>Gemini (via Google)</td>
    <td><code>!gemini compare rust vs go</code></td></tr>
  <tr><td><code>pplx</code> · <code>!pplx</code> · <code>perplexity</code></td><td>Perplexity</td>
    <td><code>!pplx latest chrome mv3 changes</code></td></tr>
  <tr><td><code>copilot</code> · <code>!copilot</code></td><td>Microsoft Copilot</td>
    <td><code>!copilot draft an email</code></td></tr>
  <tr><td><code>ph</code> · <code>!ph</code> · <code>phind</code></td><td>Phind</td>
    <td><code>!ph debug TypeScript error</code></td></tr>
  <tr><td><code>poe</code> · <code>!poe</code></td><td>Poe</td>
    <td><code>!poe brainstorm names</code></td></tr>
  <tr><td><code>you</code> · <code>!you</code></td><td>You.com chat</td>
    <td><code>!you what is CRDT</code></td></tr>
</table>
<div class="callout tip"><strong>Login:</strong> AI sites usually require you to be signed in.
  Query parameters can change over time; edit Options → Hashbangs if a provider renames its URL.</div>
<div class="callout warn"><strong>Format rule:</strong> do <em>not</em> start a rule line with
<code>!</code> alone — the parser treats that as a comment. Put a plain alias first:</div>
<pre>g|!g|google: https://www.google.com/search?q=%s Google
grok|!grok|think: https://grok.com/?q=%s Grok
gpt|!gpt|chatgpt: https://chatgpt.com/?q=%s ChatGPT
# this is a comment</pre>
<p><code>%s</code> / <code>$s</code> is the query (URL-encoded). Clear the Hashbangs field and save to restore defaults
  (including AI engines).</p>
<h3>Motivation</h3>
<p>One keyboard surface for “search the web” and “send this thought to an AI” keeps you out of
  the mouse and out of browser keyword settings. Hashbangs merge into the same engine map as
  classic Search engines so completion ranking stays consistent.</p>
`
  },
  {
    id: "omnibar",
    title: "Omnibar",
    subtitle: "History, domains, tabs, windows, engines — one keyboard UI",
    group: "Core",
    related: ["hashbangs", "keys", "window-dock", "search-engines"],
    html: `
<p>The omnibar is Vim+’s address bar. Open with <kbd>o</kbd> / <kbd>O</kbd> (or history/bookmark/window modes).</p>
<h3>What it searches</h3>
<ul>
  <li><strong>History</strong> — titles and URLs you visited</li>
  <li><strong>Domains</strong> — host autocomplete while typing</li>
  <li><strong>Bookmarks</strong> — when mode or engines include them</li>
  <li><strong>Open tabs</strong> — tab-selection mode (<kbd>T</kbd>)</li>
  <li><strong>Windows</strong> — <kbd>gA</kbd> / <code>Vomnibar.activateWindows</code>; filter and Enter to focus</li>
  <li><strong>Search engines / hashbangs</strong> — keyword + query</li>
  <li><strong>Quick actions</strong> — type <kbd>:</kbd> for the command palette (below)</li>
</ul>
<div class="callout tip"><strong>Chrome-like tips:</strong>
  type a few letters of a site you visit often; use <code>!g </code> for Google;
  <kbd>↓</kbd>/<kbd>↑</kbd> move the selection (list <strong>scrolls</strong> when there are many hits);
  Enter opens; Esc closes. Hold <kbd>⌘</kbd>/<kbd>Alt</kbd> for numbered 1–9 picks.</div>
<h3>Command palette (<kbd>:</kbd>)</h3>
<p>Power-user palette (VS Code–style). Type <kbd>:</kbd> alone for <strong>categories</strong>, then drill in.
Selecting a row keeps the short form (e.g. <code>:gray</code>) in the bar.</p>
<table>
  <tr><th>Browse</th><th>Opens</th></tr>
  <tr><td><code>:view</code></td><td>FX, spotlight, zen, device frames, hide images…</td></tr>
  <tr><td><code>:read</code></td><td>Readability, progress bar, highlighter</td></tr>
  <tr><td><code>:tab</code></td><td>Pin, mute, close, sleep, bookmark, groups…</td></tr>
  <tr><td><code>:hist</code></td><td>Clear / pause history</td></tr>
  <tr><td><code>:priv</code></td><td>Shred domain / cookies</td></tr>
  <tr><td><code>:win</code></td><td>Dock, maximize, cycle windows</td></tr>
  <tr><td><code>:nav</code></td><td>Back, forward, top/bottom, zoom</td></tr>
  <tr><td><code>:clip</code></td><td>URL, title, article MD, headings, tables…</td></tr>
  <tr><td><code>:chrome</code></td><td>Downloads, flags, settings, shortcuts…</td></tr>
  <tr><td><code>:vim</code></td><td>Side panel, options, wiki, help</td></tr>
</table>
<table>
  <tr><th>Hot cmds</th><th>Does</th></tr>
  <tr><td><code>:sc</code> · <code>:sh domain</code></td><td>Shred site data</td></tr>
  <tr><td><code>:h1</code> · <code>:ph</code></td><td>Clear 1h history / pause recording</td></tr>
  <tr><td><code>:spot</code> · <code>:lens</code> · <code>:zen</code></td><td>Spotlight / focus lens / zen chrome</td></tr>
  <tr><td><code>:read</code> · <code>:prog</code> · <code>:hl</code></td><td>Reader View / progress bar / highlighter</td></tr>
  <tr><td><code>:yart</code> · <code>:noimg</code></td><td>Copy article markdown / hide images</td></tr>
  <tr><td><code>:iphone</code> · <code>:pixel</code> · <code>:ipad</code></td><td>Device viewport frames</td></tr>
  <tr><td><code>:gray</code> · <code>:jumble</code> · <code>:clear</code></td><td>View filters</td></tr>
  <tr><td><code>:pin</code> · <code>:mute</code> · <code>:xo</code></td><td>Tab power moves</td></tr>
  <tr><td><code>:yy</code> · <code>:ym</code> · <code>:yhead</code></td><td>Copy URL / markdown link / headings</td></tr>
  <tr><td><code>:dlft</code> · <code>:max</code> · <code>:cw</code></td><td>Dock left / maximize / cycle windows</td></tr>
  <tr><td><code>:sp</code> · <code>:a</code></td><td>Side panel / category index</td></tr>
</table>
<p><strong>Key bindings (author template):</strong>
  <kbd>zS</kbd> spotlight · <kbd>zL</kbd> lens · <kbd>zZ</kbd> zen · <kbd>zH</kbd> highlighter ·
  <kbd>zI</kbd> hide images · <kbd>yA</kbd> article markdown · <kbd>yH</kbd> headings ·
  <kbd>yP</kbd> paragraphs · <kbd>yT</kbd> tables. Options → Reading &amp; View for progress bar.</p>
<div class="callout"><strong>Scrolling long palettes:</strong>
  Categories like <code>:view</code> or <code>:tab</code> can list many commands.
  Use <kbd>↓</kbd>/<kbd>↑</kbd> to move through the full list (the result pane scrolls),
  or the thin scrollbar. <kbd>PgDn</kbd>/<kbd>PgUp</kbd> page when not on a search-engine row.</div>
<h3>Modes (defaults)</h3>
<table>
  <tr><th>Key</th><th>Mode</th></tr>
  <tr><td><kbd>o</kbd> / <kbd>O</kbd></td><td>Omni (mixed)</td></tr>
  <tr><td><kbd>T</kbd></td><td>Tabs</td></tr>
  <tr><td><kbd>gA</kbd></td><td>Windows</td></tr>
  <tr><td><kbd>b</kbd></td><td>Bookmarks</td></tr>
  <tr><td><kbd>gH</kbd></td><td>History</td></tr>
  <tr><td><kbd>o</kbd> then <kbd>:</kbd></td><td>Command palette</td></tr>
</table>
`
  },
  {
    id: "window-dock",
    title: "Window docking",
    subtitle: "Snap to edges with progressive shrink",
    group: "Chrome",
    related: ["keys", "omnibar", "side-panel"],
    html: `
<p>Dock the current browser window to a display edge. Works across monitors via the work area.</p>
<h3>Defaults</h3>
<table>
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td><kbd>Alt</kbd>+<kbd>←</kbd></td><td>Dock left</td></tr>
  <tr><td><kbd>Alt</kbd>+<kbd>→</kbd></td><td>Dock right</td></tr>
  <tr><td><kbd>Alt</kbd>+<kbd>↑</kbd></td><td>Dock top</td></tr>
  <tr><td><kbd>Alt</kbd>+<kbd>↓</kbd></td><td>Dock bottom</td></tr>
  <tr><td><kbd>Alt+Shift+M</kbd></td><td>Maximize</td></tr>
  <tr><td><kbd>gW</kbd></td><td>Cycle windows</td></tr>
  <tr><td><kbd>gA</kbd></td><td>Pick a window in the omnibar</td></tr>
</table>
<h3>Progressive shrink</h3>
<ol class="steps">
  <li>First press: <strong>half</strong> of the work area on that side.</li>
  <li><strong>Alt+↑ again</strong> → <strong>full screen</strong> (maximize).</li>
  <li>Left/right/down again: keep <strong>Window dock step</strong>% of the previous size
    (Options default <strong>50</strong> → quarter, eighth…).</li>
  <li>When size would go under a minimum, it wraps back to half.</li>
  <li>Change direction to start a fresh half-size dock on the new edge.</li>
</ol>
<div class="callout tip">Tune left/right/down shrink under <strong>Options → Window dock step</strong> (25–90%).</div>
<pre>map &lt;a-left&gt; dockWindowLeft
map &lt;c-a-left&gt; dockWindow direction="left" step=40</pre>
`
  },
  {
    id: "side-panel",
    title: "Command center",
    subtitle: "Persistent keyboard UI in Chrome’s side panel",
    group: "Core",
    related: ["keys", "chrome-pages", "getting-started", "advanced"],
    html: `
<p>Open via <strong>toolbar icon</strong>, <kbd>Alt+Shift+V</kbd> (if assigned), context menu, or page <kbd>gS</kbd>.</p>
<h3>Header controls</h3>
<ul>
  <li><strong>Options</strong> (gear) — full options page</li>
  <li><strong>Off for this site</strong> — excludes the current host (Vim+ off there)</li>
  <li><strong>Wiki</strong> / <strong>Help</strong> — docs and on-page help</li>
</ul>
<h3>Modes</h3>
<ol>
  <li><strong>Keys</strong> — filter bound keys; Enter runs the command</li>
  <li><strong>Cmds</strong> — full command catalog</li>
  <li><strong>Tabs</strong> — filter and activate tabs</li>
  <li><strong>Closed</strong> — restore sessions</li>
  <li><strong>Later</strong> — Reading List</li>
  <li><strong>Page</strong> — bookmark, pin, mute, disable site, options…</li>
</ol>
<p>Inside the panel: <kbd>j</kbd>/<kbd>k</kbd> move · <kbd>Enter</kbd> activate ·
  <kbd>1</kbd>–<kbd>6</kbd> modes · type to filter.</p>
<div class="callout"><strong>Gesture note:</strong> Chrome requires a user gesture to open the side panel.
  Toolbar click, context menu, and keyboard commands count; background-only open may fail.</div>
`
  },
  {
    id: "link-hints",
    title: "Link hints",
    subtitle: "Click anything without the mouse",
    group: "Core",
    related: ["keys", "omnibar"],
    html: `
<p>Press <kbd>f</kbd> to label clickable elements. Type the hint letters to activate.</p>
<ul>
  <li><kbd>F</kbd> — open in a new tab</li>
  <li><kbd>yf</kbd> — copy link URL</li>
  <li>Active target shows a <strong>red outline</strong> plus bottom underline</li>
</ul>
<p>Hint characters are under Options → Link hint characters. Advanced variants (hover, download, image)
  appear in the <kbd>?</kbd> help list when advanced commands are shown.</p>
`
  },
  {
    id: "search-engines",
    title: "Search engines",
    subtitle: "Advanced URL builders (beyond hashbangs)",
    group: "Core",
    related: ["hashbangs", "omnibar"],
    html: `
<p>Custom search engines use the classic rule format:</p>
<pre>key|alias: https://example.com/?q=%s Name
blank=https://example.com/ Homepage</pre>
<p>Hashbangs are merged <em>before</em> this list so short bangs stay predictable.
Both feed the same omnibar keyword map.</p>
`
  },
  {
    id: "chrome-pages",
    title: "Chrome pages & shortcuts",
    subtitle: "Mouse-free system surfaces",
    group: "Chrome",
    related: ["getting-started", "side-panel", "keys", "chrome-shortcuts"],
    html: `
<p>Many <code>chrome://</code> pages block extension content scripts. Use these instead:</p>
<table>
  <tr><th>Surface</th><th>How</th></tr>
  <tr><td>Keyboard shortcuts manager</td>
    <td><code>chrome://extensions/shortcuts</code> — see <a href="#chrome-shortcuts">Global shortcuts</a></td></tr>
  <tr><td>Downloads</td><td><kbd>gD</kbd> or side panel → Page</td></tr>
  <tr><td>History</td><td><kbd>gH</kbd> / omnibar history</td></tr>
  <tr><td>Extensions</td><td>command / Page actions</td></tr>
  <tr><td>Settings</td><td>command openSettings</td></tr>
  <tr><td>This wiki</td><td><code>:wiki</code> · Options · side panel Wiki · help → Wiki</td></tr>
</table>
<div class="callout tip"><strong>Recommended global shortcut:</strong>
  assign <strong>Open side panel</strong> to <kbd>Alt+Shift+V</kbd> so it works even on chrome:// pages.</div>
`
  },
  {
    id: "chrome-shortcuts",
    title: "Global shortcuts (More shortcuts?)",
    subtitle: "chrome://extensions/shortcuts — no companion extension required",
    group: "Options",
    related: ["chrome-pages", "keys", "side-panel", "newtab-url", "architecture"],
    html: `
<p>Options links <strong>More shortcuts?</strong> here. Older builds pointed at a third-party
  “Shortcut Forwarding Tool” Web Store listing that often goes dead. Vim+ documents the
  <strong>built-in Chrome path</strong> instead.</p>
<h3>What Chrome allows</h3>
<p>Manifest V3 extensions declare a small set of <code>commands</code> in <code>manifest.json</code>.
  Users bind those commands under:</p>
<pre>chrome://extensions/shortcuts</pre>
<p>Those bindings work on <code>chrome://</code> pages and when no content script is focused —
  unlike normal Vim+ maps, which only run where content scripts inject.</p>
<h3>What to assign</h3>
<ol class="steps">
  <li>Open <code>chrome://extensions/shortcuts</code> (link also in Options → Keys help text).</li>
  <li>Find <strong>Vim+</strong>.</li>
  <li>Assign keys for commands you need globally, especially:
    <ul>
      <li><strong>Open side panel / command center</strong> — recommended <kbd>Alt+Shift+V</kbd></li>
      <li>Any other listed Vim+ browser actions</li>
    </ul>
  </li>
  <li>Avoid collisions with system or Chrome reserved chords when possible.</li>
</ol>
<h3>Why not another extension?</h3>
<p>Companion “forward more OS shortcuts into the page” extensions add attack surface, break when
  Chrome changes APIs, and are out of Vim+’s control when the Web Store entry dies.
  Prefer:</p>
<ul>
  <li><strong>In-page maps</strong> for browsing (Options → Custom key mappings)</li>
  <li><strong>Chrome commands</strong> for chrome:// and empty new tabs</li>
  <li><strong>Side panel</strong> as a durable UI that does not depend on the active page</li>
</ul>
<div class="callout tip"><strong>Developer:</strong> add new global actions via the extension
  <code>commands</code> key + a background command handler — not by shipping a second extension.</div>
<div class="callout">Related: <a href="#newtab-url">New tab URL &amp; Cmd/Ctrl+T</a> ·
  <a href="#test-keys">Key testing guide</a> ·
  <a href="#architecture">Architecture</a></div>
`
  },
  {
    id: "test-keys",
    title: "Key testing guide",
    subtitle: "What Options → Test a key shows — and what it does not",
    group: "Options",
    related: ["keyboard-layout", "key-mappings", "chrome-shortcuts", "architecture"],
    html: `
<p>Options → Keys → <strong>Test a key</strong> shows the <em>raw</em> key event Chrome delivers
  to the options page. It is the in-extension replacement for old external “online key tester” links.</p>
<h3>How to use it</h3>
<ol class="steps">
  <li>Enable <strong>Test a key</strong>.</li>
  <li>Click the test box and press combinations (letters, <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> chords, media keys if any).</li>
  <li>Compare the printed name with what you put in <code>map</code> lines
    (e.g. <code>&lt;c-a&gt;</code>, <code>&lt;a-s-j&gt;</code>).</li>
</ol>
<h3>What it does <em>not</em> include</h3>
<ul>
  <li>Exclusion rules (sites where Vim+ is off)</li>
  <li><code>mapKey</code> remaps</li>
  <li>Insert vs Normal mode on a real webpage</li>
  <li>OS-level shortcuts that never reach the page (e.g. some media / system chords)</li>
</ul>
<div class="callout tip">If a key never appears in the tester, Chrome/OS ate it — map a different chord
  or bind a <a href="#chrome-shortcuts">global command</a>.</div>
<h3>Layouts</h3>
<p>Physical vs character layout issues are covered in
  <a href="#keyboard-layout">Keyboard layout</a>. The tester helps confirm what the browser reports
  on <em>your</em> machine.</p>
`
  },
  {
    id: "permissions",
    title: "Permissions (Chrome Web Store)",
    subtitle: "Single source of truth for why every permission is requested",
    group: "Chrome",
    related: ["privacy", "about", "architecture", "devtools"],
    html: `
<div class="hero">
  <p>This page is written for <strong>users</strong>, <strong>reviewers</strong>, and the
  <strong>Chrome Web Store listing</strong>. It mirrors what Vim+ declares in
  <code>manifest.json</code> and explains the product need for each access.</p>
</div>
<div class="callout tip"><strong>Principle:</strong> permissions exist so keyboard commands can do what
  the mouse already can in Chrome UI — navigate tabs, search history, restore sessions, dock windows,
  and run on normal web pages. Vim+ does <em>not</em> sell data or run remote analytics.</div>

<h2>Store-facing summary (short)</h2>
<p>Use this block in the Web Store “permission justification” fields or privacy questionnaire:</p>
<pre>Vim+ is a keyboard navigation extension. It needs broad site access to inject content scripts
(link hints, scrolling, find, reading tools) on web pages. It uses tabs/history/bookmarks/sessions
for the omnibar and tab commands; storage for settings; sidePanel for the command center;
scripting for page tools; and related Chrome APIs (downloads, readingList, clipboard, etc.) only
to implement matching keyboard features. No browsing data is uploaded to Vim+ servers.</pre>

<h2>What users see Chrome ask for</h2>
<p>Chrome groups permissions into human-readable categories. Rough mapping:</p>
<table>
  <tr><th>Chrome wording (approx.)</th><th>Maps to</th></tr>
  <tr><td>Read and change all your data on websites you visit</td>
    <td><code>host_permissions: &lt;all_urls&gt;</code> + content scripts + <code>scripting</code></td></tr>
  <tr><td>Read your browsing history</td><td><code>history</code>, <code>webNavigation</code> (related)</td></tr>
  <tr><td>Display notifications</td><td><code>notifications</code></td></tr>
  <tr><td>Manage downloads / bookmarks / etc.</td>
    <td>matching API permissions below</td></tr>
</table>

<h2>Host access</h2>
<table>
  <tr><th>Declaration</th><th>Why it is required</th><th>What we do <em>not</em> do</th></tr>
  <tr>
    <td><code>host_permissions</code><br><code>&lt;all_urls&gt;</code></td>
    <td>Keyboard navigation must work on arbitrary https/http pages the user opens.
      Content scripts (hints, scroll, find, visual, reading progress, Reader View, FX) inject
      at <code>document_start</code> on matching frames. Without broad host access, the product
      only works on a tiny allowlist and fails as a general browser navigator.</td>
    <td>No remote exfiltration of page content. No third-party trackers injected into sites.</td>
  </tr>
  <tr>
    <td>Content script matches<br><code>&lt;all_urls&gt;</code></td>
    <td>Same as above — declarative injection so keys work without a per-site click-to-enable flow.</td>
    <td>Users can exclude sites (Options → Excluded URLs / side panel “Off for this site”).</td>
  </tr>
  <tr>
    <td><code>web_accessible_resources</code></td>
    <td>Vomnibar, shared libs, and content assets must be loadable in extension frames and
      (when opted-in) cooperating extension pages.</td>
    <td>Not a blanket “expose everything to the web”; resources are limited to listed paths.</td>
  </tr>
</table>
<div class="callout warn"><strong>chrome:// and store pages:</strong> Chrome still blocks content scripts on
  most browser-internal URLs. That is why global shortcuts + the side panel exist —
  not because we need extra host permissions for chrome://.</div>

<h2>Required API permissions</h2>
<p>From <code>manifest.json</code> → <code>permissions</code>:</p>
<table>
  <tr><th>Permission</th><th>Product feature</th><th>Justification (detailed)</th></tr>
  <tr>
    <td><code>tabs</code></td>
    <td>Open / close / reload / pin / mute / move / focus tabs; query titles &amp; URLs for omnibar and side panel</td>
    <td>Core of a keyboard tab manager. Required to implement create/remove/update/query without the mouse.</td>
  </tr>
  <tr>
    <td><code>tabGroups</code></td>
    <td>Create / toggle / collapse Chrome tab groups (<kbd>yg</kbd>, palette)</td>
    <td>Chrome isolates group APIs; without this permission, group commands cannot run.</td>
  </tr>
  <tr>
    <td><code>history</code></td>
    <td>Omnibar history suggestions; clear / pause history quick actions</td>
    <td>Match typed queries against local history for Chrome-like address-bar completion. Deletes only on explicit user commands.</td>
  </tr>
  <tr>
    <td><code>bookmarks</code></td>
    <td>Omnibar bookmarks; toggle bookmark commands</td>
    <td>Search and create/remove bookmarks from the keyboard.</td>
  </tr>
  <tr>
    <td><code>sessions</code></td>
    <td>Restore closed tab / window (palette + side panel Closed)</td>
    <td>Uses Chrome’s recently-closed session list — same data the History UI uses.</td>
  </tr>
  <tr>
    <td><code>webNavigation</code></td>
    <td>Know when frames navigate; re-apply exclusions / inject state after loads</td>
    <td>Needed to keep “enabled / disabled on this URL” accurate across SPA navigations and multi-frame pages.</td>
  </tr>
  <tr>
    <td><code>storage</code></td>
    <td>Settings, key maps, hashbangs, highlights persistence, UI theme flags</td>
    <td>Local (and optional sync) persistence. Sync is off until the user enables account sync in Options.</td>
  </tr>
  <tr>
    <td><code>scripting</code></td>
    <td>Inject page tools (Reader View, FX, progress helpers, quick-action scripts)</td>
    <td>MV3 replacement for legacy executeScript. Used for same-origin page enhancements the user triggers or enables.</td>
  </tr>
  <tr>
    <td><code>sidePanel</code></td>
    <td>Command center side panel (keys, cmds, tabs, closed, reading list)</td>
    <td>Chrome requires this permission to open and control the side panel UI.</td>
  </tr>
  <tr>
    <td><code>contextMenus</code></td>
    <td>Right-click entry points (open panel / common actions)</td>
    <td>Discovery for users who have not learned keys yet; no background network use.</td>
  </tr>
  <tr>
    <td><code>clipboardRead</code></td>
    <td>Paste / open-copied-URL style commands</td>
    <td>Read clipboard only when a user-run command needs the current clipboard text.</td>
  </tr>
  <tr>
    <td><code>clipboardWrite</code></td>
    <td>Copy URL, title, markdown, article, tables, headings…</td>
    <td>Write clipboard only for explicit copy commands.</td>
  </tr>
  <tr>
    <td><code>downloads</code></td>
    <td>Show last download; open downloads; some download-link hint modes</td>
    <td>Query/open items the user already downloaded; not bulk scraping of the web.</td>
  </tr>
  <tr>
    <td><code>downloads.shelf</code></td>
    <td>Control download shelf UI where supported</td>
    <td>Companion to download commands so keyboard workflows can hide/show the shelf.</td>
  </tr>
  <tr>
    <td><code>readingList</code></td>
    <td>Add / list Chrome Reading List (“Later” in side panel)</td>
    <td>Keyboard access to the same Reading List feature as the browser UI.</td>
  </tr>
  <tr>
    <td><code>favicon</code></td>
    <td>Site icons in the omnibar suggestion list</td>
    <td>Display-only; improves scanability of history/bookmark rows.</td>
  </tr>
  <tr>
    <td><code>search</code></td>
    <td>“Prefer browser’s default search engine” path</td>
    <td>Optional product path: hand a query to Chrome’s configured search provider.</td>
  </tr>
  <tr>
    <td><code>browsingData</code></td>
    <td>Shred site data / clear cookies-cache for current origin (privacy palette)</td>
    <td>Only when the user runs an explicit purge command; scoped to the chosen domain/types.</td>
  </tr>
  <tr>
    <td><code>notifications</code></td>
    <td>Upgrade / important status notifications</td>
    <td>Local OS notifications; not used for marketing spam.</td>
  </tr>
  <tr>
    <td><code>alarms</code></td>
    <td>Scheduled wakeups (e.g. temporary history-pause windows, maintenance ticks)</td>
    <td>Timer API for features that must fire after a delay while the service worker sleeps.</td>
  </tr>
  <tr>
    <td><code>offscreen</code></td>
    <td>MV3 offscreen documents for clipboard / DOM helpers when required by Chrome</td>
    <td>Technical requirement under MV3 for some clipboard/media operations without a visible tab.</td>
  </tr>
  <tr>
    <td><code>system.display</code></td>
    <td>Accurate multi-monitor work areas for window docking</td>
    <td>Reads display geometry only (not screen capture) so dock-left/right lands on the correct monitor.</td>
  </tr>
</table>

<h2>Optional permissions</h2>
<p>Declared under <code>optional_permissions</code> — requested only when the user enables related features:</p>
<table>
  <tr><th>Permission</th><th>When requested</th><th>Why</th></tr>
  <tr>
    <td><code>cookies</code></td>
    <td>Privacy / site-data tools that need cookie access beyond browsingData helpers</td>
    <td>Fine-grained site cookie clearing when the user opts into those commands.</td>
  </tr>
  <tr>
    <td><code>contentSettings</code></td>
    <td>Toggle images / JavaScript (and similar) for a site from Vim+</td>
    <td>Mirrors Chrome site settings without opening the settings UI.</td>
  </tr>
</table>
<div class="callout"><strong>Incognito:</strong> Manifest uses <code>"incognito": "spanning"</code>.
  Users still control “Allow in Incognito” in <code>chrome://extensions</code>. Incognito find-history is kept
  only while private windows exist (see Privacy).</div>

<h2>Other manifest capabilities (not “permissions” but store-relevant)</h2>
<table>
  <tr><th>Field</th><th>Why</th></tr>
  <tr><td><code>commands</code> (global shortcuts)</td>
    <td>OS-level chords (e.g. open side panel) that work on chrome:// pages where content scripts cannot.</td></tr>
  <tr><td><code>omnibox</code> keyword <code>v</code></td>
    <td>Optional address-bar keyword that behaves like a lightweight omnibar.</td></tr>
  <tr><td><code>options_ui</code></td>
    <td>Standard options page entry in Chrome’s extension UI.</td></tr>
  <tr><td><code>side_panel.default_path</code></td>
    <td>Registers the command center document.</td></tr>
  <tr><td>CSP <code>extension_pages</code></td>
    <td>Strict script policy for options/wiki/side panel (no remote scripts).</td></tr>
</table>

<h2>Data handling (privacy, for the same reviewers)</h2>
<ul>
  <li><strong>Local-first.</strong> History/bookmark queries run inside Chrome APIs on-device.</li>
  <li><strong>No Vim+ backend.</strong> There is no product analytics channel that receives your URLs or keystrokes.</li>
  <li><strong>Sync is opt-in.</strong> Browser account sync of settings only if the user enables it in Options.</li>
  <li><strong>Destructive data APIs</strong> (history delete, browsingData) run only on explicit commands.</li>
  <li><strong>Clipboard</strong> is read/written only for paste/copy commands the user invokes.</li>
</ul>
<p>Longer privacy notes: <a href="#privacy">Privacy</a> · package file <code>PRIVACY-POLICY.md</code>.</p>

<h2>What is intentionally out of scope</h2>
<ul>
  <li>Native messaging to random desktop apps</li>
  <li>Debugger / proxy / webRequest blocking permissions</li>
  <li>Identity / OAuth “sign in with Google” for the extension itself</li>
  <li>Enterprise policy management APIs</li>
</ul>

<h2>For developers editing the manifest</h2>
<ol class="steps">
  <li>Add a permission only when a user-facing command cannot work without it.</li>
  <li>Update <strong>this wiki page</strong> in the same change (Store text + table row).</li>
  <li>Prefer <code>optional_permissions</code> for rare power features.</li>
  <li>Document user-visible exclusion paths (site off, optional revoke) when possible.</li>
</ol>
<div class="callout tip">Chrome docs:
  <a href="https://developer.chrome.com/docs/extensions/mv3/declare_permissions/" target="_blank" rel="noopener">Declare permissions</a>
  ·
  <a href="https://developer.chrome.com/docs/extensions/mv3/permission_warnings/" target="_blank" rel="noopener">Permission warnings</a>
  ·
  <a href="https://developer.chrome.com/docs/webstore/program-policies/" target="_blank" rel="noopener">Program policies</a>
</div>
`
  },
  {
    id: "privacy",
    title: "Privacy",
    subtitle: "Local-first — what leaves your machine",
    group: "About",
    related: ["permissions", "about"],
    html: `
<p>Vim+ does not send browsing data to a remote analytics server.
Settings sync only if you enable browser sync in Options.
Clipboard and page content stay on your machine unless you copy or open external URLs yourself.</p>
<p>For a permission-by-permission breakdown suitable for the Chrome Web Store, see
  <a href="#permissions">Permissions (Chrome Web Store)</a>.</p>
<ul>
  <li>History / bookmarks / sessions are read via Chrome APIs for omnibar and restore — not uploaded.</li>
  <li>Find-mode queries may be stored locally; Incognito find history is temporary.</li>
  <li>Site shred / history clear commands only run when you invoke them.</li>
</ul>
`
  },
  {
    id: "about",
    title: "About Vim+",
    subtitle: "Motivation, author, license",
    group: "About",
    related: ["privacy", "license", "permissions", "getting-started", "vim-concepts"],
    html: `
<div class="hero">
  <p><strong>Vim+</strong> is a keyboard-first navigation extension for Google Chrome,
  built by <strong>Jamal Yusuf</strong>
  (<a href="https://jamal.dev" target="_blank" rel="noopener">jamal.dev</a>).</p>
</div>
<h3>Why it exists</h3>
<p>The mouse is precise but slow for the loop most people live in: open tabs, scan pages,
  jump links, switch windows, search history, copy a URL, dock a window, then do it again.
  Vim+ keeps that loop on the home row.</p>
<ul>
  <li><strong>Navigate without pointing.</strong> Scroll, link hints, find, and visual select
    like a modal editor — so your hands stay on the keyboard.</li>
  <li><strong>One command surface.</strong> The omnibar, <kbd>:</kbd> palette, and side panel
    command center cover tabs, privacy, reading tools, window docking, and Chrome pages.</li>
  <li><strong>Stay local.</strong> Settings, highlights, and page tools run on your machine.
    No analytics backend; optional browser sync only if you turn it on.</li>
  <li><strong>Docs that ship with the product.</strong> This wiki is inside the extension so
    help never depends on a dead website or a third-party store listing.</li>
</ul>
<h3>What it does (in one screen)</h3>
<table>
  <tr><th>Area</th><th>You get</th></tr>
  <tr><td>Page</td><td>Hints, scroll, find, visual mode, reading progress, Reader View, highlights</td></tr>
  <tr><td>Omnibar</td><td>History, domains, engines, AI hashbangs, command palette</td></tr>
  <tr><td>Tabs &amp; windows</td><td>Pin, mute, restore closed, dock, maximize, cycle windows</td></tr>
  <tr><td>Chrome power</td><td>Downloads, groups, Reading List, PiP, side panel, OS shortcuts</td></tr>
  <tr><td>Privacy</td><td>Shred domain, pause history, clear site data from the palette</td></tr>
</table>
<h3>Author</h3>
<p><strong>Jamal Yusuf</strong> · <a href="https://jamal.dev" target="_blank" rel="noopener">https://jamal.dev</a></p>
<p>License: Apache-2.0 — full text in <code>LICENSE.txt</code> inside the extension package.</p>
<div class="callout tip">Start here if you are new:
  <a href="#getting-started">Getting started</a> ·
  <a href="#vim-concepts">Vim concepts</a> ·
  <a href="#keys">Keyboard map</a> ·
  <a href="#permissions">Permissions (why Chrome asks)</a>.</div>
`
  },
  {
    id: "license",
    title: "License",
    group: "About",
    related: ["about"],
    html: `<p>Apache License 2.0. Full text is in <code>LICENSE.txt</code> inside the extension directory.</p>`
  },
  {
    id: "devtools",
    title: "Developer handbook",
    subtitle: "Build, debug, and ship changes to Vim+",
    group: "Developers",
    related: ["architecture", "extending", "hashbangs", "key-mappings", "permissions"],
    html: `
<p>This page is for people hacking on the extension (or teaching others how it works).</p>
<h3>Build loop</h3>
<ol class="steps">
  <li>Install deps: <code>npm install</code></li>
  <li>Typecheck / emit: <code>npm run tsc</code> (or project gulp task)</li>
  <li><code>chrome://extensions</code> → reload the unpacked Vim+ package</li>
  <li>Hard-refresh Options / wiki / open a fresh tab for content scripts</li>
</ol>
<h3>Where to put work</h3>
<table>
  <tr><th>Area</th><th>Path</th><th>Notes</th></tr>
  <tr><td>Settings defaults</td><td><code>background/settings.ts</code></td>
    <td>Hashbangs, key maps, feature flags</td></tr>
  <tr><td>Quick actions / palette</td><td><code>background/quick_actions.ts</code></td>
    <td><code>:</code> commands, page tools</td></tr>
  <tr><td>Content inject</td><td><code>content/</code> · <code>page_enhance.ts</code></td>
    <td>In-page FX, reader hooks</td></tr>
  <tr><td>Omnibar UI</td><td><code>front/vomnibar.*</code></td>
    <td>Height, list scroll, icons</td></tr>
  <tr><td>Options UX</td><td><code>pages/options*.ts/html</code></td>
    <td>Tabs, reset, dead-link hygiene</td></tr>
  <tr><td>Wiki</td><td><code>pages/wiki-content.ts</code></td>
    <td>Docs only — no runtime deps</td></tr>
  <tr><td>Side panel</td><td><code>pages/sidepanel.*</code></td>
    <td>Command center</td></tr>
  <tr><td>Page enhance</td><td><code>content/page_enhance.ts</code></td>
    <td>Progress, FX, hl restore</td></tr>
</table>
<h3>Debugging tips</h3>
<ul>
  <li><strong>Service worker:</strong> Extensions page → Vim+ → “service worker” link (DevTools for background)</li>
  <li><strong>Content script:</strong> page DevTools → Sources → Content scripts → Vim+</li>
  <li><strong>Omnibar:</strong> inspect the vomnibar iframe document separately</li>
  <li><strong>Storage:</strong> Application → Extension storage, or <code>chrome.storage.local.get(null)</code> in SW console</li>
  <li><strong>Theme:</strong> Options <code>autoDarkMode</code> 0/1/2 — wiki and Options both honor it</li>
  <li><strong>Progress bar stuck gray:</strong> inspect <code>#vp-read-progress-fill</code> transform;
    see <a href="#page-enhance">Page enhance</a></li>
</ul>
<h3>Must-read internals</h3>
<ul>
  <li><a href="#architecture">Architecture</a> — process split</li>
  <li><a href="#message-flow">Message flow</a> — ports and command path</li>
  <li><a href="#settings-pipeline">Settings pipeline</a> — defaults to live hooks</li>
  <li><a href="#page-enhance">Page enhance</a> — overlays and progress math</li>
</ul>
<h3>Design constraints (do not fight these)</h3>
<ul>
  <li>MV3 workers sleep — persist important state; rehydrate on wake</li>
  <li><code>chrome://</code> is mostly off-limits to content scripts</li>
  <li>OS shortcuts for browser chrome ≠ in-page key maps</li>
  <li>No remote wiki CMS — ship docs in the package</li>
  <li>Prefer internal wiki links over Web Store companion extensions</li>
  <li>Never drive animated UI with CSS <code>width: 0 !important</code> + JS width</li>
</ul>
<div class="callout tip">When you add a user-facing option, add a wiki deep-dive and link it from Options help text
  in the same change. Future-you will thank present-you.</div>
`
  },
  {
    id: "extending",
    title: "Extending this wiki",
    subtitle: "Add pages without a CMS",
    group: "Developers",
    related: ["home", "about", "devtools", "architecture"],
    html: `
<p>All articles live in <code>pages/wiki-content.ts</code> as <code>WIKI_PAGES</code>.</p>
<pre>export const WIKI_PAGES: WikiPage[] = [
  {
    id: "my-topic",
    title: "My topic",
    group: "Core",
    related: ["keys"],
    html: \`&lt;p&gt;HTML body…&lt;/p&gt;\`
  },
]</pre>
<ol class="steps">
  <li>Copy an existing entry and give it a unique <code>id</code>.</li>
  <li>Optional <code>group</code> for the sidebar and <code>related</code> for footer chips.</li>
  <li>Write safe HTML only (no scripts). In HTML bodies, escape ampersands as <code>&amp;amp;</code>.</li>
  <li>In <code>title</code> / <code>subtitle</code> strings use a real <code>&amp;</code> character
    (they are assigned with <code>textContent</code>). If you write <code>&amp;amp;</code> by habit,
    the wiki runtime decodes it so the TOC never shows a literal entity.</li>
  <li><code>npm run tsc</code> and reload the extension.</li>
</ol>
<p>Link with <code>&lt;a href="#other-id"&gt;</code>. Link to Options with <code>options.html</code>.</p>
<p>Theme: wiki follows Options <strong>Auto switch between light and dark mode</strong>
  (<code>autoDarkMode</code> in <code>chrome.storage</code>) — no separate theme toggle to maintain.</p>
`
  }
]

export const wikiPageById = (id: string): WikiPage => {
  const found = WIKI_PAGES.find(p => p.id === id)
  return found || WIKI_PAGES[0]
}
