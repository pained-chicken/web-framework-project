/* =====================================================================
   variableProximity.js
   React Bits "Variable Proximity" 효과의 바닐라 JS 포트.
   - 텍스트를 글자 단위 <span>으로 분할
   - pointermove 좌표만 저장, 스타일 갱신은 RAF 루프 1곳에서 처리
   - 글자 중심 ↔ 커서 유클리드 거리 → radius 내에서 falloff로 from↔to 보간
   - 접근성: 원문은 sr-only 1회, 시각용 글자 span은 aria-hidden
   - (pointer: fine) 아닐 때 / prefers-reduced-motion: reduce → 정적(기본 from 상태)

   사용 (HTML):
   <h1 class="vp-hero"
       data-from="'wght' 300"
       data-to="'wght' 900"
       data-radius="140"
       data-falloff="gaussian">하루예약</h1>
   ===================================================================== */
(function () {
  "use strict";

  // 'wght' 300, 'opsz' 9  ->  { wght: 300, opsz: 9 }
  function parseSettings(str) {
    var out = {};
    if (!str) return out;
    var re = /['"]?([a-zA-Z]{2,4})['"]?\s+([-\d.]+)/g, m;
    while ((m = re.exec(str)) !== null) out[m[1]] = parseFloat(m[2]);
    return out;
  }
  function stringifySettings(map) {
    return Object.keys(map)
      .map(function (k) { return "'" + k + "' " + (Math.round(map[k] * 100) / 100); })
      .join(", ");
  }

  function falloffValue(distance, radius, mode) {
    var norm = Math.min(Math.max(1 - distance / radius, 0), 1);
    switch (mode) {
      case "exponential": return norm * norm;
      case "gaussian":    return Math.exp(-Math.pow(distance / (radius / 2), 2) / 2);
      case "linear":
      default:            return norm;
    }
  }

  function initOne(el) {
    var fromMap   = parseSettings(el.dataset.from || "'wght' 400");
    var toMap     = parseSettings(el.dataset.to   || "'wght' 900");
    var radius    = parseFloat(el.dataset.radius) || 120;
    var falloff   = el.dataset.falloff || "linear";
    var container = el.dataset.containerSelector
      ? document.querySelector(el.dataset.containerSelector)
      : el; // 기본: 헤드라인 자신을 좌표 기준 컨테이너로

    var label = el.textContent;
    var fromStr = stringifySettings(fromMap);

    // ---- 글자 단위 분할 (단어 inline-block 유지 + 원문 sr-only) ----
    el.textContent = "";
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = label;
    el.appendChild(sr);

    var chars = [];
    var words = label.split(" ");
    words.forEach(function (word, wi) {
      var wspan = document.createElement("span");
      wspan.className = "vp-word";
      wspan.setAttribute("aria-hidden", "true");
      for (var i = 0; i < word.length; i++) {
        var c = document.createElement("span");
        c.className = "vp-char";
        c.textContent = word[i];
        c.style.fontVariationSettings = fromStr;
        wspan.appendChild(c);
        chars.push(c);
      }
      el.appendChild(wspan);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
    });

    // ---- 정적 모드 (터치/거친 포인터 · 모션 최소화 선호) ----
    var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return; // from 상태 그대로 정적 렌더

    // ---- 좌표 저장 (이벤트) → 스타일 갱신 (RAF) ----
    var mouse = { x: -9999, y: -9999 };
    var inside = false;
    var rafId = null;

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      inside = true;
    }
    function onLeave() { inside = false; }

    function frame() {
      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var r = ch.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var d = Math.hypot(mouse.x - cx, mouse.y - cy);

        var t = inside ? falloffValue(d, radius, falloff) : 0;
        if (t <= 0.001) {
          ch.style.fontVariationSettings = fromStr;
          continue;
        }
        var merged = {};
        for (var k in fromMap) {
          var to = (k in toMap) ? toMap[k] : fromMap[k];
          merged[k] = fromMap[k] + (to - fromMap[k]) * t;
        }
        ch.style.fontVariationSettings = stringifySettings(merged);
      }
      rafId = requestAnimationFrame(frame);
    }

    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("pointerleave", onLeave, { passive: true });
    rafId = requestAnimationFrame(frame);

    // SPA/페이지 전환 cleanup 훅
    el._vpCleanup = function () {
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
    };
  }

  function initAll() {
    var nodes = document.querySelectorAll(".vp-hero, .vp-text");
    for (var i = 0; i < nodes.length; i++) initOne(nodes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
