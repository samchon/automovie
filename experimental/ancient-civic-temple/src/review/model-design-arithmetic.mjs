import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
// Fail on the source prose itself if a reviewed contact, section, or bound drifts.
const root = new URL("../../docs/models/", import.meta.url);
/** @param {string} file @param {string} anchor */
const h2 = (file, anchor) => {
  const source = readFileSync(new URL(file + ".md", root), "utf8");
  const body = source.split(/^## /m).find((s) => s.split("\n", 1)[0].includes("{#" + anchor + "}"));
  assert.ok(body, file + "#" + anchor);
  return body.replace(/<!--[\s\S]*?-->/g, "");
};
/** @param {string} body @param {RegExp} pattern @param {number} [group] */
const n = (body, pattern, group = 1) => {
  const found = body.match(pattern);
  assert.ok(found, "missing: " + pattern);
  return Number(found[group]);
};
/** @param {string} label @param {number} actual @param {number} expected @param {number} [eps] */
const near = (label, actual, expected, eps = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= eps, label + ": " + actual + " vs " + expected);
  console.log("PASS", label, actual, expected);
};
const d = h2("openings", "double-door-leaf");
near("double ring to upper pin", n(d, /받침판 중심은[^\n]*?Y=([\d.]+)m/) + n(d, /중심선 반지름 ([\d.]+)m/), n(d, /연결 핀 두 개는[^\n]*?\(X,Y\)=\(손잡이 중심 X,([\d.]+)m\)/));
near("double front pin to ring Z", n(d, /앞핀은 Z=\+[\d.]+~\+([\d.]+)m/), n(d, /고리 중심면은 Z=\+([\d.]+)m/));
near("double back pin to ring Z", n(d, /뒷핀은 Z=−[\d.]+~−([\d.]+)m/), n(d, /고리 중심면은 Z=\+[\d.]+m\/−([\d.]+)m/));
const single = h2("openings", "single-door-leaf");
near("single ring to upper pin", n(single, /중심 X=\([^\n]+?Y=([\d.]+)m/) + n(single, /중심선 반지름은 ([\d.]+)m/), n(single, /연결 핀은[^\n]*?Y\)=\([^,]+,([\d.]+)m\)/));
const jar = h2("wares", "storage-jar");
const jarOuter = n(jar, /바깥 윤곽은[^\n]*?\(0\.64,([\d.]+)\)/);
const jarInner = n(jar, /입 안쪽은[^\n]*?\(0\.64,([\d.]+)\)/);
assert.ok(jarOuter - jarInner >= 0.02);
console.log("PASS storage neck wall", jarOuter - jarInner);
for (const [anchor, outerHeight, innerHeight, minimum] of /** @type {[string,string,string,number][]} */ ([["carry-jar", "0.45", "0.45", 0.015], ["small-vessel", "0.16", "0.16", 0.01]])) {
  const body = h2("wares", anchor);
  const outer = n(body, new RegExp("바깥 윤곽은[^\\n]*?\\(" + outerHeight + ",([\\d.]+)\\)"));
  const inner = n(body, new RegExp("입 안쪽은[^\\n]*?\\(" + innerHeight + ",([\\d.]+)\\)"));
  assert.ok(outer - inner >= minimum);
  console.log("PASS", anchor, "neck wall", outer - inner);
}
const lamp = h2("fixtures", "lampstand");
near("lamp rim top", n(lamp, /접시는[^\n]*?바닥 Y=([\d.]+)m/) + n(lamp, /바닥 두께 ([\d.]+)m/) + n(lamp, /안쪽 깊이 ([\d.]+)m/), n(lamp, /테 윗끝 Y=([\d.]+)m/));
assert.ok(n(lamp, /바깥 수직 벽 반지름은 ([\d.]+)m/) > n(lamp, /안쪽 수직 벽 반지름은 ([\d.]+)m/));
console.log("PASS lamp side-wall thickness");
const chest = h2("fixtures", "chest");
near("chest lid/body seam", n(chest, /몸체 윗면 Y=([\d.]+)m/) + 0.005, n(chest, /뚜껑은[^\n]*?몸체 위 Y=([\d.]+)~/));
assert.ok(chest.includes("몸체 쪽 띠는 Z=−0.255~−0.25m") && chest.includes("뚜껑 쪽 띠는 Z=−0.265~−0.26m"));
console.log("PASS chest hinge on both back faces");
const desk = h2("fixtures", "desk");
assert.ok(/아랫면[^\n]*?Y=0\.15m/.test(desk));
console.log("PASS desk stretcher bottom datum");
const fountain = h2("fixtures", "fountain");
assert.ok(/8등분한 9정점/.test(fountain));
console.log("PASS fountain ripple division");
const bowl = h2("wares", "offering-bowl");
assert.ok(!/반구에 가까운/.test(bowl));
const rim = bowl.match(/안쪽[^\n]*?\(([\d.]+),([\d.]+)\)m와 바깥쪽 \(([\d.]+),([\d.]+)\)/);
assert.ok(rim, "bowl inner/outer rim section");
near("offering bowl rim height", Number(rim[2]), Number(rim[4]));
near("offering bowl rim thickness", Number(rim[3]) - Number(rim[1]), n(bowl, /테두리의 수평 두께는 ([\d.]+)m/));
assert.ok(/여덟 선형 구간/.test(bowl));
console.log("PASS offering bowl explicit profile");
const tile = h2("cladding", "roof-tile");
near("tegula raised lower to preceding upper", n(tile, /바닥과 윗면을 각각 Y=([\d.]+)\/([\d.]+)m/), n(tile, /아래 단위의 윗면 Y=([\d.]+)m/));
near("tegula raised thickness", n(tile, /바닥과 윗면을 각각 Y=[\d.]+\/([\d.]+)m/) - n(tile, /바닥과 윗면을 각각 Y=([\d.]+)\/[\d.]+m/), n(tile, /두께 ([\d.]+)m 판/));
const basket = h2("wares", "basket");
near("basket torus top", n(basket, /중심 높이 Y=([\d.]+)m/) + n(basket, /관 반지름 ([\d.]+)m인 원환/), n(basket, /맨 위가 Y=([\d.]+)m/));
const scroll = h2("wares", "scroll");
assert.ok(scroll.includes("(0,−0.03),(0,+0.03),(0.03√3,0)") && scroll.includes("0.03√3+0.07"));
const rollRadius = n(scroll, /반지름 ([\d.]+)m·길이 [\d.]+m 원통/);
const tieRadius = n(scroll, /중심선 반지름 ([\d.]+)m·관 반지름/);
const tubeRadius = n(scroll, /중심선 반지름 [\d.]+m·관 반지름 ([\d.]+)m/);
const boxExtra = n(scroll, /묶음 0\.288×\(0\.03√3\+([\d.]+)\)/);
near("three-roll tie envelope width", 2 * (tieRadius + tubeRadius), boxExtra);
near("three-roll tie touches paper", tieRadius - tubeRadius, rollRadius);
console.log("checked source H2 arithmetic and contact claims");\n