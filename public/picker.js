(function () {
  "use strict";

  var pickerActive = false;
  var hoveredEl = null;
  var highlightBox = null;

  function createHighlightBox() {
    var box = document.createElement("div");
    box.id = "__onboardflow_picker_highlight__";
    box.style.position = "fixed";
    box.style.pointerEvents = "none";
    box.style.zIndex = "2147483647";
    box.style.border = "2px solid #6366f1";
    box.style.borderRadius = "4px";
    box.style.background = "rgba(99, 102, 241, 0.15)";
    box.style.transition = "all 60ms ease-out";
    box.style.display = "none";
    document.documentElement.appendChild(box);
    return box;
  }

  function updateHighlight(el) {
    if (!highlightBox) highlightBox = createHighlightBox();
    var rect = el.getBoundingClientRect();
    highlightBox.style.display = "block";
    highlightBox.style.top = rect.top + "px";
    highlightBox.style.left = rect.left + "px";
    highlightBox.style.width = rect.width + "px";
    highlightBox.style.height = rect.height + "px";
  }

  function hideHighlight() {
    if (highlightBox) highlightBox.style.display = "none";
  }

  /** Builds a reasonably stable, reasonably short CSS selector for an element. */
  function generateSelector(el) {
    if (el.id) return "#" + CSS.escape(el.id);

    var parts = [];
    var node = el;
    var depth = 0;

    while (node && node.nodeType === 1 && depth < 6) {
      var part = node.tagName.toLowerCase();

      if (node.id) {
        parts.unshift("#" + CSS.escape(node.id));
        break;
      }

      var stableClasses = Array.prototype.filter
        .call(node.classList, function (c) {
          return !/^(js-|ng-|css-|_[a-z0-9]{5,})/i.test(c);
        })
        .slice(0, 2);

      if (stableClasses.length > 0) {
        part += "." + stableClasses.map(CSS.escape).join(".");
      } else {
        var parent = node.parentElement;
        if (parent) {
          var siblings = Array.prototype.filter.call(parent.children, function (sib) {
            return sib.tagName === node.tagName;
          });
          if (siblings.length > 1) {
            var index = Array.prototype.indexOf.call(siblings, node) + 1;
            part += ":nth-of-type(" + index + ")";
          }
        }
      }

      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }

    return parts.join(" > ");
  }

  function postToParent(type, payload) {
    if (window.parent === window) return;
    window.parent.postMessage(
      Object.assign({ source: "onboardflow-picker", type: type }, payload || {}),
      "*",
    );
  }

  function onMouseOver(e) {
    if (!pickerActive) return;
    var el = e.target;
    if (el === hoveredEl || el === highlightBox) return;
    hoveredEl = el;
    updateHighlight(el);
  }

  function onClick(e) {
    if (!pickerActive) return;
    e.preventDefault();
    e.stopPropagation();
    var el = e.target;
    var selector = generateSelector(el);
    postToParent("element-picked", { selector: selector });
    stopPicker();
  }

  function onKeyDown(e) {
    if (!pickerActive) return;
    if (e.key === "Escape") {
      postToParent("picker-cancelled", {});
      stopPicker();
    }
  }

  function startPicker() {
    if (pickerActive) return;
    pickerActive = true;
    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "crosshair";
    postToParent("picker-started", {});
  }

  function stopPicker() {
    pickerActive = false;
    hoveredEl = null;
    hideHighlight();
    document.removeEventListener("mouseover", onMouseOver, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.body.style.cursor = "";
  }

  var locateSelector = null;
  var locateTimer = null;
  var lastLocateRect = null;

  function rectsEqual(a, b) {
    if (!a || !b) return a === b;
    return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
  }

  function tickLocate() {
    if (!locateSelector) return;
    var el = null;
    try {
      el = document.querySelector(locateSelector);
    } catch (e) {
      postToParent("locate-result", { selector: locateSelector, found: false, invalidSelector: true });
      locateSelector = null;
      return;
    }

    if (!el) {
      if (lastLocateRect !== null) {
        lastLocateRect = null;
        postToParent("locate-result", { selector: locateSelector, found: false });
      }
      return;
    }

    var rect = el.getBoundingClientRect();
    var next = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    if (!rectsEqual(next, lastLocateRect)) {
      lastLocateRect = next;
      postToParent("locate-result", {
        selector: locateSelector,
        found: true,
        rect: next,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
    }
  }

  function startLocate(selector) {
    locateSelector = selector;
    lastLocateRect = null;
    if (locateTimer) clearInterval(locateTimer);
    locateTimer = setInterval(tickLocate, 150);
    tickLocate();
  }

  function stopLocate() {
    locateSelector = null;
    lastLocateRect = null;
    if (locateTimer) {
      clearInterval(locateTimer);
      locateTimer = null;
    }
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.target !== "onboardflow-target-page") return;

    if (data.type === "start-picker") {
      startPicker();
    } else if (data.type === "stop-picker") {
      stopPicker();
    } else if (data.type === "locate-element") {
      startLocate(data.selector);
    } else if (data.type === "stop-locate") {
      stopLocate();
    }
  });

  postToParent("picker-ready", {});
})();
