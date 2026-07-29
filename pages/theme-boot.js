/**
 * Early theme class bootstrap for extension pages (CSP-safe external script).
 * Prefer forced dark/light from gn / vomnibar (vpUiDark), then autoDarkMode, then system.
 */
(function () {
  try {
    var root = document.documentElement
    var apply = function (dark) {
      if (dark) {
        root.classList.add("vp-dark", "dark")
        root.classList.remove("no-dark", "vp-light")
      } else {
        root.classList.remove("vp-dark", "dark")
        root.classList.add("no-dark", "vp-light")
      }
    }
    var systemDark = function () {
      try {
        return matchMedia("(prefers-color-scheme: dark)").matches
            || !matchMedia("(prefers-color-scheme: light)").matches
      } catch (e) {
        return true
      }
    }
    // Instant paint before storage returns
    apply(systemDark())
    if (!chrome || !chrome.storage || !chrome.storage.local) { return }
    chrome.storage.local.get(["vpUiDark", "autoDarkMode"], function (res) {
      void chrome.runtime.lastError
      res = res || {}
      var forced = res.vpUiDark
      if (forced === 1 || forced === true || forced === "1") {
        apply(true)
        return
      }
      if (forced === 0 || forced === false || forced === "0") {
        apply(false)
        return
      }
      var mode = res.autoDarkMode
      if (mode === 0 || mode === false || mode === "0") {
        apply(false)
      } else if (mode === 1 || mode === true || mode === "1") {
        apply(true)
      } else {
        apply(systemDark())
      }
    })
  } catch (e) { /* empty */ }
})()
