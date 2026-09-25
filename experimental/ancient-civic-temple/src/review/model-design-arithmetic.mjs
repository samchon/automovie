import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { imbrexFootMargin, pinPlateRadialMargin, ridgeFootGap, rollSheetGap, strapBattenVerticalMargin } from "./model-contact-math.mjs";
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
const column = h2("columns", "colonnade-column");
const beam = h2("entablature", "colonnade-beam");
const columnTop = n(column, /전체 높이는 약 ([\d.]+)m/);
const beamTop = n(beam, /보 윗면 높이는[^\n]*?약 ([\d.]+)m/);
const beamDepth = n(beam, /단면은 폭 [\d.]+m·깊이 ([\d.]+)m/);
near("colonnade capital supports beam underside", columnTop, beamTop - beamDepth);
const capitalWidth = n(column, /주두 판\(정방 ([\d.]+)×/);
const beamWidth = n(beam, /단면은 폭 ([\d.]+)m/);
assert.ok(beamWidth <= capitalWidth, "beam must fit on the capital plate");
console.log("PASS colonnade beam fits the capital", beamWidth, capitalWidth);
const porchColumn = h2("columns", "porch-column");
const porchBeam = h2("entablature", "porch-entablature");
near("porch capital supports stone beam underside",
  n(porchColumn, /전체 높이 ([\d.]+)m/),
  n(porchBeam, /아랫면 Y=([\d.]+)m가 두/));
const joist = h2("entablature", "ceiling-joist");
near("ceiling joist touches the boarding underside",
  n(joist, /아랫면은 ([\d.]+)m다/) + n(joist, /깊이 ([\d.]+)m/),
  n(joist, /윗면 Y=([\d.]+)m가 널판/));
const d = h2("openings", "double-door-leaf");
near("double ring to upper pin", n(d, /받침판 중심은[^\n]*?Y=([\d.]+)m/) + n(d, /중심선 반지름 ([\d.]+)m/), n(d, /연결 핀 두 개는[^\n]*?\(X,Y\)=\(손잡이 중심 X,([\d.]+)m\)/));
near("double front pin to ring Z", n(d, /앞핀은 Z=\+[\d.]+~\+([\d.]+)m/), n(d, /고리 중심면은 Z=\+([\d.]+)m/));
near("double back pin to ring Z", n(d, /뒷핀은 Z=−[\d.]+~−([\d.]+)m/), n(d, /고리 중심면은 Z=\+[\d.]+m\/−([\d.]+)m/));
const plateRadius = n(d, /받침판\(반지름 ([\d.]+)m, 두께/);
const plateCenterY = n(d, /손잡이와 받침판 중심은[^\n]*?Y=([\d.]+)m/);
const doublePinY = n(d, /연결 핀 두 개는[^\n]*?\(X,Y\)=\(손잡이 중심 X,([\d.]+)m\)/);
const doublePinRadius = n(d, /반지름 ([\d.]+)m의 연결 핀 두 개/);
assert.ok(pinPlateRadialMargin(plateRadius, plateCenterY, doublePinRadius, doublePinY) > 0,
  "double pin must overlap plate disk; detached at its circumference");
assert.ok(plateRadius > doublePinRadius && Math.abs(doublePinY - plateCenterY) < plateRadius,
  "double pin axis must penetrate the plate disk, not merely touch its rim");
assert.ok(d.includes("받침판은 문 중앙 가로대의 면 Z=0~+0.006m/−0.056~−0.05m에서 판문과 면 접촉") &&
  d.includes("Y=1.00~1.10m 띠는 가로대 위에 직접 붙"),
"double plate must have a positive-area connection to the door rail");
console.log("PASS double plate, pin, rail connected", plateRadius, doublePinY - plateCenterY);
const single = h2("openings", "single-door-leaf");
near("single ring to upper pin", n(single, /중심 X=\([^\n]+?Y=([\d.]+)m/) + n(single, /중심선 반지름은 ([\d.]+)m/), n(single, /연결 핀은[^\n]*?Y\)=\([^,]+,([\d.]+)m\)/));
near("single lower strap centred on batten", n(single, /Y 중심은 아래 띠 ([\d.]+)m/),
  n(single, /아랫면 높이 ([\d.]+)m와 유효 높이/) + n(single, /가로 띠 두 줄\(연직 폭 ([\d.]+)m/) / 2);
assert.ok(strapBattenVerticalMargin(
  n(single, /아랫면 높이 ([\d.]+)m와 유효 높이/),
  n(single, /가로 띠 두 줄\(연직 폭 ([\d.]+)m/),
  n(single, /Y 중심은 아래 띠 ([\d.]+)m/),
  n(single, /연직 폭 ([\d.]+)m·두께 [\d.]+m이고 앞면/)) > 0,
"single lower steel strap must intersect the batten's height interval");
assert.ok(single.includes("X=0에서 시작해 X=0.6×유효 폭에서 끝나며") &&
  single.includes("위 띠 유효 높이−0.34m") &&
  single.includes("앞면 Z=+0.025~+0.031m에 놓여 두 가로 띠의 앞면과 면 접촉"),
"single door steel strap needs a hinge-side start and batten-face datum");
console.log("PASS single steel straps have both axes and face contact");
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
const imbrexCentre = n(tile, /둥근기와의 X 중심은[^\n]*?X=\+([\d.]+)m/);
const imbrexOuter = n(tile, /바깥 반지름은 Z=0\.08m에서 ([\d.]+)m/);
const imbrexThickness = n(tile, /두께는 ([\d.]+)m, 반원은/);
const ribMatch = tile.match(/\+([\d.]+)~\+([\d.]+)m에는 Z=0\.08~0\.44m 구간/);
assert.ok(ribMatch, "raised rib needs a positive X interval");
/** @type {[number, number]} */
const leftRib = [Number(ribMatch[1]), Number(ribMatch[2])];
const pitch = n(tile, /X 줄 간격 ([\d.]+)m/);
/** @type {[number, number]} */
const rightRib = [pitch - leftRib[1], pitch - leftRib[0]];
assert.ok(imbrexFootMargin(imbrexCentre, imbrexOuter, imbrexThickness, leftRib, rightRib) > 0,
  "both imbrex feet must sit inside the adjacent raised ribs");
near("tile unit occupancy includes seam cover", 0.20 + imbrexCentre + imbrexOuter,
  n(tile, /상자 ([\d.]+)×0\.125×0\.52m/));
assert.ok(tile.includes("Z=0.08~0.44m 구간에 한해") &&
  tile.includes("마지막 Z=0.44~0.52m에서는 다음 평기와의 들린 앞끝") &&
  tile.includes("Z=0.08~0.44m에서 왼발"),
"tile rib must stop before the following tile's lifted 0.08m overlap");
console.log("PASS tile feet land on ribs without overlap", imbrexCentre, imbrexOuter);
const ridge = h2("cladding", "ridge-tile");
const ridgeDatum = ridge.match(/Y0=([\d.]+)m\/cos\(α\)−([\d.]+)m×tan\(α\)/);
assert.ok(ridgeDatum, "ridge datum needs both tile thickness and cap foot offset");
const flatThickness = n(tile, /기본 판은 Y=0~([\d.]+)m/);
const capFootX = n(ridge, /아랫 가장자리 X=±([\d.]+)m/);
near("ridge datum uses flat-tile thickness", Number(ridgeDatum[1]), flatThickness);
near("ridge datum uses actual cap foot", Number(ridgeDatum[2]), capFootX);
for (const angle of [19, 22]) {
  const rad = angle * Math.PI / 180;
  const capFoot = Number(ridgeDatum[1]) / Math.cos(rad) - Number(ridgeDatum[2]) * Math.tan(rad);
  near("ridge foot to flat tile at " + angle + " degrees", ridgeFootGap(capFoot, flatThickness, capFootX, angle), 0);
}
assert.ok(tile.includes("마지막 0.16m의 경사 구간은 둥근기와와 두 턱을 만들지 않고") &&
  ridge.includes("용마루 앞 0.16m에서 둥근기와와 턱을 멈추고"),
"curved tiles must terminate before the ridge cap's 0.15m nose");
const eastCapTop = 4.53 + 0.02 / Math.cos(19 * Math.PI / 180) -
  0.13 * Math.tan(19 * Math.PI / 180) + 0.15;
assert.ok(eastCapTop <= 4.69 - 0.01, "east ridge cap must clear south coping by 0.01m");
console.log("PASS ridge cap contacts both roof tiles and clears coping", eastCapTop);
const basket = h2("wares", "basket");
near("basket torus top", n(basket, /중심 높이 Y=([\d.]+)m/) + n(basket, /관 반지름 ([\d.]+)m인 원환/), n(basket, /맨 위가 Y=([\d.]+)m/));
const scroll = h2("wares", "scroll");
assert.ok(scroll.includes("(0,−0.03),(0,+0.03),(0.03√3,0)") && scroll.includes("0.03√3+0.07"));
assert.ok(scroll.includes("(Y,Z)=(0.02,±(0.175+√(0.02²−0.018²)))m"),
  "scroll roll centre must be derived from its sheet-edge tangent");
near("open scroll roll touches sheet top edge", rollSheetGap(0.002, 0.175, 0.02,
  0.175 + Math.sqrt(0.02 ** 2 - 0.018 ** 2), 0.02), 0);
const rollRadius = n(scroll, /반지름 ([\d.]+)m·길이 [\d.]+m 원통/);
const tieRadius = n(scroll, /중심선 반지름 ([\d.]+)m·관 반지름/);
const tubeRadius = n(scroll, /중심선 반지름 [\d.]+m·관 반지름 ([\d.]+)m/);
const boxExtra = n(scroll, /묶음 0\.288×\(0\.03√3\+([\d.]+)\)/);
near("three-roll tie envelope width", 2 * (tieRadius + tubeRadius), boxExtra);
near("three-roll tie touches paper", tieRadius - tubeRadius, rollRadius);
console.log("checked the arithmetic and contact claims explicitly named above; a whole-H2 contact census remains outstanding");
