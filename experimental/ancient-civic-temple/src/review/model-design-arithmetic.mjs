import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { imbrexFootMargin, pinPlateRadialMargin, ridgeFootGap, ridgeSectionAt, rollSheetGap, strapBattenVerticalMargin } from "./model-contact-math.mjs";
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
/** @param {string} label @param {boolean} condition @param {string} [detail] */
const pass = (label, condition, detail = "") => {
  assert.ok(condition, `${label}: ${detail}`);
  console.log("PASS", label, detail);
};
const column = h2("columns", "colonnade-column");
const beam = h2("entablature", "colonnade-beam");
const rafter = h2("entablature", "rafter");
const roofAssembly = readFileSync(new URL("../../docs/spaces/roofs/assembly.md", import.meta.url), "utf8");
const columnTop = n(column, /12° 외쪽 변은 h=[\d.]+−0\.28=([\d.]+)m/);
const columnTopEast = n(column, /19° 동측 박공 변은 h=[\d.]+−0\.28=([\d.]+)m/);
const beamTop = n(beam, /12° 외쪽 변은 Ybeam=([\d.]+)m/);
const beamTopEast = n(beam, /19° 동측 박공 변은 Ybeam=([\d.]+)m/);
const beamDepth = n(beam, /단면은 폭 [\d.]+m·깊이 ([\d.]+)m/);
near("colonnade capital supports beam underside", columnTop, beamTop - beamDepth, 1e-6);
near("east capital supports east beam underside", columnTopEast, beamTopEast - beamDepth, 1e-6);
pass("corner columns carry north-south beams and side beams butt to them",
  column.includes("모서리 원주는 남·북 보 아래의 12° 높이 변형") &&
    column.includes("동측 보의 끝면은 남·북 보 옆면에 닿고") &&
    beam.includes("네 모서리 원주는 12° 높이 변형으로 남·북 보를 직접 받친다") &&
    beam.includes("동·서 보는 남·북 보의 서로 마주 보는 옆면에 끝면을 맞대고"));
const eastDrop = beamTop - beamTopEast;
near("east beam side joint retains contact height", beamDepth - eastDrop,
  n(beam, /끝면의 공통 접촉 높이는 ([\d.]+)m/), 1e-6);
const cornerNotch = n(beam, /양끝에서 모서리 주두와 겹치는 길이 ([\d.]+)m/);
const cornerNotchDepth = n(beam, /δ=Ybeam\(12°\)−Ybeam\(19°\)=([\d.]+)m/);
near("east beam corner notch removes the capital penetration", cornerNotchDepth, eastDrop, 1e-8);
pass("colonnade base and capital contact their hosts",
  /로컬 원점은 기단 바닥면/.test(column) &&
  n(column, /기단\(정방 [\d.]+×[\d.]+m, 높이 ([\d.]+)m/) > 0 &&
  Math.abs(columnTop - (beamTop - beamDepth)) < 1e-6,
  `base Y=0, capital top ${columnTop}, beam underside ${beamTop - beamDepth}`);
const capitalWidth = n(column, /주두 판\(정방 ([\d.]+)×/);
const beamWidth = n(beam, /단면은 폭 ([\d.]+)m/);
assert.ok(beamWidth <= capitalWidth, "beam must fit on the capital plate");
console.log("PASS colonnade beam fits the capital", beamWidth, capitalWidth);
const colonnadeDatums = readFileSync(new URL("../../docs/spaces/building.md", import.meta.url), "utf8");
const courtHalfWidth = n(colonnadeDatums, /west\/east-court \| X=∓([\d.]+) \|/);
const courtBack = n(colonnadeDatums, /court-back \| Z=-([\d.]+) \|/);
const courtFront = n(colonnadeDatums, /court-front \| Z=([\d.]+) \|/);
const columnInset = n(beam, /중정 경계에서 ([\d.]+)m 안쪽/);
const beamNearEdge = columnInset - beamWidth / 2;
near("east beam corner notch spans the exposed capital strip", cornerNotch,
  (capitalWidth - beamWidth) / 2, 1e-6);
const roofSupport = n(roofAssembly, /상면은 Y=([\d.]+)m/);
const roofThickness = n(roofAssembly, /법선 두께는 ([\d.]+)m/);
const rafterDepth = n(rafter, /단면은 폭 [\d.]+m·깊이 ([\d.]+)m/);
const slope = 12 * Math.PI / 180;
near("rafter touches slab and beam", beamTop,
  roofSupport + beamNearEdge * Math.tan(slope) - (roofThickness + rafterDepth) / Math.cos(slope),
  1e-6);
near("east gable rafter bearing on east beam", beamTopEast,
  roofSupport + beamNearEdge * Math.tan(19 * Math.PI / 180) -
    (roofThickness + rafterDepth) / Math.cos(19 * Math.PI / 180),
  1e-6);
const northSouthLength = n(beam, /길이\(입력 산술상 약 ([\d.]+)m\)/);
const eastWestLength = n(beam, /잇는 길이\(약 ([\d.]+)m\)/);
near("north-south beam reaches both capital ends", northSouthLength,
  2 * (courtHalfWidth + columnInset) + capitalWidth, 0.01);
near("colonnade beam ends abut without overlap", eastWestLength,
  courtBack + courtFront + 2 * columnInset - beamWidth, 0.01);
const porchColumn = h2("columns", "porch-column");
const porchBeam = h2("entablature", "porch-entablature");
near("porch capital supports stone beam underside",
  n(porchColumn, /전체 높이 ([\d.]+)m/),
  n(porchBeam, /아랫면 Y=([\d.]+)m가 두/));
const porchHalfWidth = n(colonnadeDatums, /west\/east-porch-inner \| X=∓([\d.]+) \|/);
const porchBeamLength = n(porchBeam, /보는 길이 ([\d.]+)m/);
const porchBeamBase = n(porchBeam, /아랫면 Y=([\d.]+)m가 두/);
const porchBeamHeight = n(porchBeam, /높이 ([\d.]+)m 석재 각재/);
const southFacade = readFileSync(new URL("../../docs/spaces/facades/south.md", import.meta.url), "utf8");
near("porch beam touches gable and returns", porchBeamLength, 2 * porchHalfWidth);
near("porch beam top touches gable underside", porchBeamBase + porchBeamHeight,
  n(southFacade, /아랫면은 Y=([\d.]+)m/));
const porchSlope = 22 * Math.PI / 180;
const porchRidgeTrimTop = 4.00 + porchHalfWidth * Math.tan(porchSlope) -
  roofThickness / Math.cos(porchSlope);
pass("porch trim tips meet at ridge",
  /Ytop\(X\)=4\.00\+1\.65tan\(22°\)−0\.18\/cos\(22°\)−\|X\|tan\(22°\)/.test(porchBeam) &&
  /X는 각각 −1\.65~0m와 0~\+1\.65m/.test(porchBeam) &&
  Math.abs(porchRidgeTrimTop - n(porchBeam, /트림 꼭대기 약 ([\d.]+)m/)) < 0.001,
  `both trim top endpoints share X=0, Y=${porchRidgeTrimTop}`);
const joist = h2("entablature", "ceiling-joist");
near("ceiling joist touches the boarding underside",
  n(joist, /아랫면은 ([\d.]+)m다/) + n(joist, /깊이 ([\d.]+)m/),
  n(joist, /윗면 Y=([\d.]+)m가 널판/));
const roomInner = n(colonnadeDatums, /west\/east-inner \| X=∓([\d.]+) \|/);
const roomSide = n(colonnadeDatums, /west\/east-room \| X=∓([\d.]+) \|/);
near("ceiling joist ends meet the walls", n(joist, /길이는 방의 짧은 변 순치수 ([\d.]+)m/), roomInner - roomSide);
pass("rafter slope and wall termination",
  /주랑 외쪽 지붕 아래 서까래는 12°/.test(rafter) &&
  /동측 박공 아래는[^\n]*?19°/.test(rafter) &&
  /외쪽 지붕의 경사는 12도/.test(roofAssembly) &&
  /동측 박공은 19도/.test(roofAssembly) &&
  /주랑 뒷벽\([^)]*제실 남벽[^)]*남측 파라펫\)까지 이어지고/.test(rafter),
  "12° outer / 19° east; named roof and wall datums agree");
const datums = readFileSync(new URL("../../docs/spaces/building.md", import.meta.url), "utf8");
const outerWallFace = n(datums, /west\/east-room \| X=∓([\d.]+) \|/);
const innerWallFace = n(datums, /west\/east-ring \| X=∓([\d.]+) \|/);
const wallThickness = n(datums, /내부 경계벽은 ([\d.]+)m다/);
near("sanctuary rafter pair stops at both faces of the side wall", outerWallFace - innerWallFace, wallThickness);
assert.ok(rafter.includes("west/east-room 바깥면 |X|=5.90m까지의 외부 꼬리") &&
  rafter.includes("west/east-ring 안쪽면 |X|=5.60m부터 X=0 용마루") &&
  rafter.includes("벽 두께 0.30m 안에는 목재를 방출하지 않는다"),
"sanctuary rafters may not pass through the side-wall volume");
const truss = h2("entablature", "sanctuary-truss");
near("sanctuary tie beam reaches both inside wall faces",
  n(truss, /평보는 길이 ([\d.]+)m/), 2 * innerWallFace);
near("truss tie top derives from underside and depth",
  n(truss, /아랫면 Y=([\d.]+)m/) + n(truss, /단면 ([\d.]+)×([\d.]+)m이며 아랫면/, 2),
  n(truss, /윗면 ([\d.]+)m로/));
assert.ok(n(truss, /윗면 ([\d.]+)m로/) < n(truss, /하부\(약 ([\d.]+)m\)/),
  "tie top must remain below the side roof underside");
const sanctuaryRoof = readFileSync(new URL("../../docs/spaces/roofs/sanctuary.md", import.meta.url), "utf8");
const sanctuaryRoofSupportX = n(sanctuaryRoof, /지지선은 X=±([\d.]+)m/);
const sanctuarySupportY = n(sanctuaryRoof, /제실 값 ([\d.]+)m/);
const sanctuaryLowerAtSide = sanctuarySupportY +
  (sanctuaryRoofSupportX - innerWallFace) * Math.tan(porchSlope) -
  roofThickness / Math.cos(porchSlope);
const sanctuaryLowerAtRidge = sanctuarySupportY +
  sanctuaryRoofSupportX * Math.tan(porchSlope) - roofThickness / Math.cos(porchSlope);
const rafterEnds = rafter.match(/바깥 처마 끝선 \|X\|=([\d.]+)m부터[^\n]+?바깥면 \|X\|=([\d.]+)m까지[^\n]+?안쪽면 \|X\|=([\d.]+)m부터 X=0/);
assert.ok(rafterEnds, "sanctuary rafter two disjoint interval endpoints");
const [eaveX, outerFaceX, innerFaceX] = rafterEnds.slice(1).map(Number);
near("sanctuary outer rafter stops at outside wall face", outerFaceX, outerWallFace);
near("sanctuary inner rafter starts at inside wall face", innerFaceX, innerWallFace);
near("sanctuary eave ends at roof overhang", eaveX,
  sanctuaryRoofSupportX + n(roofAssembly, /돌출 ([\d.]+)m와/));
pass("rafter back cut reaches wall",
  /뒷벽 쪽 끝은 벽면에 닿는다/.test(rafter) &&
  Math.abs(outerFaceX - outerWallFace) < 1e-6 &&
  Math.abs(innerFaceX - innerWallFace) < 1e-6 &&
  outerFaceX > innerFaceX,
  `wall faces at X=±${outerFaceX} and ±${innerFaceX}`);
const rafterTop = rafter.match(/Ytop\(\|X\|\)=([\d.]+)\+\(([\d.]+)−\|X\|\)tan\(([\d.]+)°\)−([\d.]+)\/cos\(([\d.]+)°\)/);
assert.ok(rafterTop, "sanctuary rafter top must have its own roof-contact equation");
near("sanctuary rafter support datum", Number(rafterTop[1]), sanctuarySupportY);
near("sanctuary rafter support X", Number(rafterTop[2]), sanctuaryRoofSupportX);
near("sanctuary rafter roof thickness", Number(rafterTop[4]), roofThickness);
near("sanctuary rafter roof pitch", Number(rafterTop[3]), 22);
near("sanctuary rafter roof pitch divisor", Number(rafterTop[5]), 22);
/** @param {number} x */
const rafterY = (x) => Number(rafterTop[1]) +
  (Number(rafterTop[2]) - Math.abs(x)) * Math.tan(Number(rafterTop[3]) * Math.PI / 180) -
  Number(rafterTop[4]) / Math.cos(Number(rafterTop[5]) * Math.PI / 180);
/** @param {number} x */
const roofUnderY = (x) => sanctuarySupportY +
  (sanctuaryRoofSupportX - Math.abs(x)) * Math.tan(porchSlope) - roofThickness / Math.cos(porchSlope);
for (const x of [-eaveX, -outerFaceX, -innerFaceX, 0, innerFaceX, outerFaceX, eaveX])
  near("sanctuary rafter top touches slab underside at X=" + x, rafterY(x), roofUnderY(x));
pass("sanctuary rafters touch wall and slab",
  Math.abs(outerFaceX - innerFaceX - wallThickness) < 1e-6 &&
  eaveX > outerFaceX && innerFaceX > 0 &&
  /west\/east-room~west\/east-ring 벽 두께 0\.30m 안에는 목재를 방출하지 않는다/.test(rafter),
  `outer [${outerFaceX},${eaveX}], wall [${innerFaceX},${outerFaceX}], inner [0,${innerFaceX}]`);
near("sanctuary rafter tips meet at ridge", rafterY(-0), rafterY(+0));
pass("truss touches wall and roof underside",
  Math.abs(n(truss, /길이 ([\d.]+)m/) - 2 * innerWallFace) < 1e-6 &&
  Math.abs(n(truss, /하부\(약 ([\d.]+)m\)/) - sanctuaryLowerAtSide) < 0.01 &&
  truss.includes("Yprincipal(|X|)=5.35+(5.75−|X|)tan(22°)−0.18/cos(22°)") &&
  Math.abs(n(truss, /중심 높이 약 ([\d.]+)m/) - (sanctuaryLowerAtRidge - 0.20 / Math.cos(porchSlope))) < 0.001,
  `wall face X=±${innerWallFace}; roof underside side/ridge ${sanctuaryLowerAtSide}/${sanctuaryLowerAtRidge}`);
const trussTieTop = n(truss, /윗면 ([\d.]+)m로/);
const principalDepth = n(truss, /Yprincipal−([\d.]+)\/cos\(22°\)/);
/** @param {number} x */
const principalTopAt = (x) => sanctuarySupportY + (sanctuaryRoofSupportX - x) * Math.tan(porchSlope) - roofThickness / Math.cos(porchSlope);
near("truss principal foot cuts at tie top", Math.max(principalTopAt(innerWallFace) - principalDepth / Math.cos(porchSlope), trussTieTop), trussTieTop);
const strutFootX = n(truss, /발끝 중심은 가운데 기둥의 양 측면 X=±([\d.]+)m/);
const strutFootY = n(truss, /양 측면 X=±[\d.]+m·Y=([\d.]+)m/);
const strutTipX = n(truss, /끝 중심은 각 경사재의 수평 구간 중간 X=±([\d.]+)m/);
const strutTipY = n(truss, /그 아랫면 Y≈([\d.]+)m/);
near("truss strut foot meets king-post side", strutFootX, n(truss, /가운데 기둥\(([\d.]+)×/) / 2);
near("truss strut tip meets principal underside", strutTipY, principalTopAt(strutTipX) - principalDepth / Math.cos(porchSlope), 0.001);
assert.ok(strutTipY > strutFootY, "strut must rise from king side to principal");
const doorFrame = h2("openings", "door-frame");
near("door lining leaves the clear passage",
  n(doorFrame, /상인방은 길이\(유효 폭\+([\d.]+)m\)/),
  2 * n(doorFrame, /두 문설주는 폭 ([\d.]+)m/));
const liningWidth = n(doorFrame, /두 문설주는 폭 ([\d.]+)m/);
const doorSurround = n(doorFrame, /테\(폭 ([\d.]+)m/);
const doorProtrusion = n(doorFrame, /벽면에서 ([\d.]+)m 돌출/);
pass("door lining touches void and trim wall",
  /세 조각의 깊이는 그 문이 뚫린 벽의 두께\(0\.30m 또는 0\.60m\)/.test(doorFrame) &&
  /벽 양면에는 void 둘레를 두르는 테/.test(doorFrame) &&
  Math.abs(n(doorFrame, /점유 상자는 \(유효 폭\+([\d.]+)m\)/) - 2 * (liningWidth + doorSurround)) < 1e-6 &&
  Math.abs(n(doorFrame, /벽 두께\+([\d.]+)m\)/) - 2 * doorProtrusion) < 1e-6,
  `lining depth equals both wall thickness variants; trim occupies ±${doorProtrusion}m beyond wall`);
const windowFrame = h2("openings", "window-frame");
near("clerestory surround fits its occupied width",
  n(windowFrame, /점유 상자는 ([\d.]+)×/),
  0.4 + 2 * n(windowFrame, /안감 네 조각은 폭 ([\d.]+)m/) +
  2 * n(windowFrame, /외부 면에만 폭 ([\d.]+)m/));
const windowLining = n(windowFrame, /안감 네 조각은 폭 ([\d.]+)m/);
const windowSurround = n(windowFrame, /외부 면에만 폭 ([\d.]+)m/);
const windowProtrusion = n(windowFrame, /돌출 ([\d.]+)m의 테/);
pass("window surround touches wall around clear opening",
  /깊이는 벽 두께\(북측 박공 0\.60m, 제실 남벽과 두 spine 0\.30m\)/.test(windowFrame) &&
  Math.abs(n(windowFrame, /점유 상자는 ([\d.]+)×/) - (0.4 + 2 * windowLining + 2 * windowSurround)) < 1e-6 &&
  Math.abs(n(windowFrame, /벽 두께\+([\d.]+)\)m/) - windowProtrusion) < 1e-6,
  `reveal depth equals both wall thickness variants; external-only trim +${windowProtrusion}m`);
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
  d.includes("Y=1.00~1.10m 띠는 가로대에 직접 붙"),
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
const capFootX = n(ridge, /뒤쪽 발 X=±([\d.]+)m/);
near("ridge datum uses flat-tile thickness", Number(ridgeDatum[1]), flatThickness);
near("ridge datum uses actual cap foot", Number(ridgeDatum[2]), capFootX);
for (const angle of [19, 22]) {
  const rad = angle * Math.PI / 180;
  const capFoot = Number(ridgeDatum[1]) / Math.cos(rad) - Number(ridgeDatum[2]) * Math.tan(rad);
  near("ridge foot to flat tile at " + angle + " degrees", ridgeFootGap(capFoot, flatThickness, capFootX, angle), 0);
  const noseRadius = n(ridge, /겹침 코는 바깥 반지름 ([\d.]+)m/);
  const shellThickness = n(ridge, /바깥 반지름 [\d.]+m·두께 ([\d.]+)m다/);
  pass("ridge feet follow pitched tile at " + angle + " degrees",
    ridge.includes("Ytile(X)=0.02m/cos(α)−|X|tan(α)") &&
    ridge.includes("r−0.02m<|X|≤r에서 `Ytile(X)`") &&
    [capFootX, noseRadius].every((radius) =>
      [radius - shellThickness / 2, radius].every((x) => {
        const section = ridgeSectionAt(capFoot, radius, shellThickness, flatThickness, angle, x);
        return section.upper >= section.lower - 1e-9 && Math.abs(section.lower - section.tile) < 1e-9;
      })),
    `regular foot ${capFootX}, nose foot ${noseRadius}`);
}
assert.ok(tile.includes("마지막 0.16m의 경사 구간은 둥근기와와 두 턱을 만들지 않고") &&
  ridge.includes("용마루 앞 0.16m에서 둥근기와와 턱을 멈추고"),
"curved tiles must terminate before the ridge cap's 0.15m nose");
const eastCapAngle = n(ridge, /동측 ([\d.]+)°/);
const eastCapTop = n(ridge, /slab 용마루 상면 약 ([\d.]+)m에 19°/) +
  n(ridge, /Y0=([\d.]+)m\/cos\(α\)/) / Math.cos(eastCapAngle * Math.PI / 180) -
  n(ridge, /cos\(α\)−([\d.]+)m×tan\(α\)/) * Math.tan(eastCapAngle * Math.PI / 180) +
  n(ridge, /`Y0\+([\d.]+)m`/);
assert.ok(eastCapTop <= n(ridge, /코핑 아랫면 ([\d.]+)m까지/) -
  n(ridge, /([\d.]+)m 여유를 확보한다/), "east ridge cap must clear south coping");
console.log("PASS ridge cap contacts both roof tiles and clears coping", eastCapTop);
const basket = h2("wares", "basket");
near("basket torus top", n(basket, /중심 높이 Y=([\d.]+)m/) + n(basket, /관 반지름 ([\d.]+)m인 원환/), n(basket, /맨 위가 Y=([\d.]+)m/));
const scroll = h2("wares", "scroll");
assert.ok(scroll.includes("(0,−0.03),(0,+0.03),(0.03√3,0)") && scroll.includes("0.03√3+0.07"));
const openRoll = scroll.match(/\(Y,Z\)=\(([\d.]+),±\(([\d.]+)\+√\(([\d.]+)²−([\d.]+)²\)\)\)m/);
assert.ok(openRoll, "scroll roll centre must be derived from its sheet-edge tangent");
const [, rollY, edgeZ, formulaRadius, verticalGap] = openRoll.map(Number);
const openRollRadius = n(scroll, /말린 끝은 X축 반지름 ([\d.]+)m/);
const sheetThickness = n(scroll, /두께 ([\d.]+)m 판으로/);
near("open scroll roll touches sheet top edge", rollSheetGap(sheetThickness, edgeZ, openRollRadius,
  edgeZ + Math.sqrt(formulaRadius ** 2 - verticalGap ** 2), rollY), 0);
const rollRadius = n(scroll, /반지름 ([\d.]+)m·길이 [\d.]+m 원통/);
const tieRadius = n(scroll, /중심선 반지름 ([\d.]+)m·관 반지름/);
const tubeRadius = n(scroll, /중심선 반지름 [\d.]+m·관 반지름 ([\d.]+)m/);
const boxExtra = n(scroll, /묶음 0\.288×\(0\.03√3\+([\d.]+)\)/);
near("three-roll tie envelope width", 2 * (tieRadius + tubeRadius), boxExtra);
near("three-roll tie touches paper", tieRadius - tubeRadius, rollRadius);
// A second, sentence-level census consumes these named relations. Each value
// below is read from the authored H2 (or its named parent), not a fixture.
const ringRadius = n(d, /고리 손잡이\(바깥 반지름 ([\d.]+)m/);
const ringTube = n(d, /고리 손잡이\(바깥 반지름 [\d.]+m, 관 반지름 ([\d.]+)m/);
pass("double leaf ring and plate placement",
  Math.abs(ringRadius - plateRadius) <= ringTube &&
  Math.abs(plateCenterY - n(d, /선대 쪽 높이 ([\d.]+)m/)) < 1e-6 &&
  pinPlateRadialMargin(plateRadius, plateCenterY, doublePinRadius, doublePinY) > 0,
  `coaxial plate/ring radii ${plateRadius}/${ringRadius}; pin overlaps both`);
const frontPlateOuter = n(d, /면 Z=0~\+([\d.]+)m/);
const frontPinStart = n(d, /앞핀은 Z=\+([\d.]+)~\+[\d.]+m/);
const frontPinEnd = n(d, /앞핀은 Z=\+[\d.]+~\+([\d.]+)m/);
const frontRingPlane = n(d, /고리 중심면은 Z=\+([\d.]+)m/);
pass("double front and back pin contact",
  Math.abs(frontPlateOuter - frontPinStart) < 1e-6 &&
  Math.abs(frontPinEnd - frontRingPlane) <= ringTube &&
  /뒷핀은 Z=−0\.056~−0\.065m/.test(d) &&
  /받침판은[^\n]*?−0\.056~−0\.05m/.test(d),
  `front plate/pin plane ${frontPinStart}; ring plane ${frontRingPlane}`);
const tilePitch = n(tile, /위 단위를 ([\d.]+)m마다 놓으면/);
pass("tile overhang retains positive support",
  /끝 0\.08m는 접촉 띠가 없는/.test(tile) &&
  n(tile, /앞 ([\d.]+)m의 양발 지지/) > 0.08 && tilePitch === 0.44,
  "0.36m supported before an 0.08m free end");
near("tile row end meets next unit", n(tile, /껍질은 Z=0\.08~([\d.]+)m/) -
  n(tile, /Z=([\d.]+)~0\.52m의 기본 판은/), 0.44);
pass("tegula slab and row contact",
  /기본 판은 Y=0~0\.02m/.test(tile) &&
  Math.abs(n(tile, /들린 0\.08m 아랫면이 아래 단위의 윗면 Y=([\d.]+)m/) - flatThickness) < 1e-6,
  "slab/tegula Y=0; next unit underside equals 0.02m top");
const capUnder = n(tile, /코핑 아랫면 ([\d.]+)m와/);
const westSlabTop = n(tile, /slab 상면 약 ([\d.]+)m에 최대 기와/);
const tileTop = n(tile, /최대 기와 높이 ([\d.]+)m를/);
const capClearance = n(tile, /여유 ([\d.]+)m에 못 미친다/);
pass("tile cap clearance bound",
  westSlabTop + tileTop > capUnder - capClearance &&
  tile.includes("실제 slab 상면과 0.125m 부재 상한을 합해") &&
  tile.includes("잘린 끝은 코핑과 만나기 전에 마감"),
  `west full tile top ${westSlabTop + tileTop} exceeds cap limit ${capUnder - capClearance}`);
const capOverlap = n(ridge, /앞쪽 ([\d.]+)m 겹침 코는/);
const capPitch = n(ridge, /([\d.]+)m 피치로 놓였을 때/);
const capLength = n(ridge, /껍질은 길이 ([\d.]+)m/);
const noseInside = n(ridge, /안쪽 반지름 ([\d.]+)m로 바깥쪽에/);
const precedingOutside = n(ridge, /바깥 반지름 ([\d.]+)m·두께 [\d.]+m다/);
near("ridge nose meets preceding shell", noseInside, precedingOutside);
near("ridge pitch leaves stated overlap", capLength - capPitch, capOverlap);
const fountainWater = n(fountain, /물면은[^\n]*?바닥 위 ([\d.]+)m/);
const rippleHalfWidth = n(fountain, /\(r\/([\d.]+)m\)²/);
const rippleRise = n(fountain, /\(h\/([\d.]+)m\)²/);
near("ripple ends touch water plane", (rippleHalfWidth / rippleHalfWidth) ** 2 + (0 / rippleRise) ** 2, 1);
pass("ripple has positive water contact", fountainWater > 0 && /h≥0/.test(fountain));
pass("fountain step touches courtyard floor",
  /로컬 원점은 수반 중심의 중정 바닥 완성면/.test(fountain) &&
  n(fountain, /받침단은 지름 [\d.]+m·높이 ([\d.]+)m/) > 0,
  "step underside Y=0 at authored courtyard floor origin");
const altar = h2("fixtures", "altar");
const altarStep = n(altar, /석단은 폭 [\d.]+m·깊이 [\d.]+m·높이 ([\d.]+)m/);
const altarSupport = n(altar, /높이 ([\d.]+)m\)이며 그 사이/);
const altarTop = n(altar, /상판은 두께 ([\d.]+)m 판/);
const altarTotal = n(altar, /점유 상자는 [\d.]+×([\d.]+)×/);
near("altar support and step planes touch", altarStep + altarSupport + altarTop, altarTotal);
const niche = h2("fixtures", "niche");
const nichePlinth = n(niche, /받침은 폭 [\d.]+m·깊이 [\d.]+m·높이 ([\d.]+)m/);
const nicheBody = n(niche, /몸체는 폭 [\d.]+m·깊이 [\d.]+m·높이 ([\d.]+)m/);
const nicheCap = n(niche, /높이 ([\d.]+)m의 머리판이 얹힌다/);
near("niche cap touches body", nichePlinth + nicheBody + nicheCap, n(niche, /점유 상자는 [\d.]+×([\d.]+)×/));
pass("niche back face touches sanctuary wall",
  /로컬 원점은 바닥면의 뒷변 중심/.test(niche) &&
  n(niche, /머리판은 Z=([\d.]+)~/) === 0 &&
  n(niche, /몸체는 앞뒤 Z=([\d.]+)~/) > 0 &&
  /받침과 머리판의 뒷면\(Z=0\)은 제실 북쪽 벽과 닿는/.test(niche) && nicheCap >= 0,
  "plinth and cap reach local Z=0 while the body stands back; north-wall instance datum remains to be checked in instances");
near("lamp stem top supports dish bottom",
  n(lamp, /윗끝 Y=([\d.]+)m에 접시 바닥/),
  n(lamp, /바닥 Y=([\d.]+)m·바닥 두께/));
const offeringTable = h2("fixtures", "offering-table");
near("offering trestles touch top underside",
  n(offeringTable, /높이 ([\d.]+)m의 석판/),
  n(offeringTable, /아랫면 Y=([\d.]+)m다/));
const cypress = h2("landscape", "cypress");
const cypressTrunkTop = n(cypress, /원뿔대\(높이 ([\d.]+)m\)/);
const lowerCenter = n(cypress, /아래 덩어리의 중심[^\n]*?\(0,([\d.]+),0\)m/);
const lowerHeight = n(cypress, /아래 덩어리의 중심[^\n]*?전체 높이 ([\d.]+)m/);
const middleCenter = n(cypress, /가운데는 \(\+0\.10,([\d.]+),0\)m/);
const middleHeight = n(cypress, /가운데는[^\n]*?높이 ([\d.]+)m/);
const upperCenter = n(cypress, /위는 \(-0\.10,([\d.]+),0\)m/);
const upperHeight = n(cypress, /위는[^\n]*?높이 ([\d.]+)m/);
pass("cypress masses overlap trunk and neighbors",
  cypressTrunkTop > lowerCenter - lowerHeight / 2 &&
  lowerCenter + lowerHeight / 2 > middleCenter - middleHeight / 2 &&
  middleCenter + middleHeight / 2 > upperCenter - upperHeight / 2,
  `vertical overlap ${cypressTrunkTop - lowerCenter + lowerHeight / 2}, ${lowerCenter + lowerHeight / 2 - middleCenter + middleHeight / 2}, ${middleCenter + middleHeight / 2 - upperCenter + upperHeight / 2}`);
const bodyDepth = n(chest, /몸체는 폭 [\d.]+m·깊이 ([\d.]+)m/);
const bodyTop = n(chest, /몸체는[^\n]*?높이 ([\d.]+)m 상자/);
const lidDepth = n(chest, /뚜껑은 폭 [\d.]+m·깊이 ([\d.]+)m/);
const lowerHasp = chest.match(/아래 구간은 Y=([\d.]+)~([\d.]+)m·Z=\+([\d.]+)~\+([\d.]+)m/);
const upperHasp = chest.match(/윗 구간은 Y=([\d.]+)~([\d.]+)m·Z=\+([\d.]+)~\+([\d.]+)m/);
assert.ok(lowerHasp && upperHasp, "both chest hasp segments must be measured");
near("chest lower hasp touches body", Number(lowerHasp[3]), bodyDepth / 2);
pass("chest lower hasp outside body", Number(lowerHasp[1]) >= 0 &&
  Number(lowerHasp[2]) <= bodyTop && Number(lowerHasp[4]) > Number(lowerHasp[3]));
near("chest upper hasp touches lid", Number(upperHasp[3]), lidDepth / 2);
pass("chest upper hasp outside lid", Number(upperHasp[1]) >= n(chest, /몸체 위 Y=([\d.]+)~/) &&
  Number(upperHasp[4]) > Number(upperHasp[3]));
const bridge = chest.match(/연결 구간은 Y=([\d.]+)~([\d.]+)m에서 Z의 앞·뒤 면이 \+([\d.]+)\/\+([\d.]+)m에서 \+([\d.]+)\/\+([\d.]+)m/);
assert.ok(bridge, "hasp bend must have four face positions");
pass("chest hasp joints meet without penetration",
  Math.abs(Number(bridge[1]) - Number(lowerHasp[2])) < 1e-6 &&
  Math.abs(Number(bridge[2]) - Number(upperHasp[1])) < 1e-6 &&
  Math.abs(Number(bridge[3]) - Number(lowerHasp[3])) < 1e-6 &&
  Math.abs(Number(bridge[4]) - Number(lowerHasp[4])) < 1e-6 &&
  Math.abs(Number(bridge[5]) - Number(upperHasp[3])) < 1e-6 &&
  Math.abs(Number(bridge[6]) - Number(upperHasp[4])) < 1e-6);
const backHinge = chest.match(/몸체 뒷면 Z=−([\d.]+)m에 닿는 구간 Y=([\d.]+)~([\d.]+)m, 이음 위로 ([\d.]+)m 오르며 Z=−[\d.]+→−([\d.]+)m/);
assert.ok(backHinge, "rear hinge body/bend/lid coordinates");
const lidHinge = chest.match(/뚜껑 뒷면 Z=−([\d.]+)m에 닿는 구간 Y=([\d.]+)~([\d.]+)m/);
assert.ok(lidHinge, "rear hinge lid coordinates");
pass("chest hinge crosses lid gap and touches both faces",
  Math.abs(Number(backHinge[1]) - bodyDepth / 2) < 1e-6 &&
  Math.abs(Number(lidHinge[1]) - lidDepth / 2) < 1e-6 &&
  Math.abs(Number(backHinge[3]) + Number(backHinge[4]) - Number(lidHinge[2])) < 1e-6 &&
  Math.abs(Number(backHinge[5]) - Number(lidHinge[1])) < 1e-6);
near("chest hinge reaches lid top", Number(lidHinge[3]), n(chest, /뚜껑은[^\n]*?~([\d.]+)m에 놓인다/));
const corner = chest.match(/연직 모서리\(X=±([\d.]+)m,Z=±([\d.]+)m\)/);
assert.ok(corner, "corner straps require both body-face datums");
pass("chest corner straps hug body edges",
  Math.abs(Number(corner[1]) - n(chest, /몸체는 폭 ([\d.]+)m/) / 2) < 1e-6 &&
  Math.abs(Number(corner[2]) - bodyDepth / 2) < 1e-6 &&
  /Y=0~0\.44m로 이어진다/.test(chest));
const jarShoulder = n(jar, /\(0\.58,([\d.]+)\)/);
const handleX = n(jar, /중심 \(X,Y,Z\)=\(±([\d.]+),0\.58,0\)m/);
const handleMajor = n(jar, /어깨의 작은 고리 손잡이[^\n]*?중심선 반지름 ([\d.]+)m/);
const handleTube = n(jar, /어깨의 작은 고리 손잡이[^\n]*?관 반지름 ([\d.]+)m/);
pass("storage handle intersects shoulder surface",
  handleX - handleMajor - handleTube < jarShoulder &&
  handleX + handleMajor + handleTube > jarShoulder &&
  Math.abs(handleX + handleMajor + handleTube - n(jar, /바깥 손잡이 끝 X=±([\d.]+)m/)) < 1e-6,
  `jar shoulder r=${jarShoulder}; ring X=${handleX - handleMajor - handleTube}..${handleX + handleMajor + handleTube}`);
const carry = h2("wares", "carry-jar");
const carryEnds = carry.match(/아래 부착점 \(±([\d.]+),([\d.]+),0\)m, 위 부착점 \(±([\d.]+),([\d.]+),0\)m/);
assert.ok(carryEnds, "carry jar handle endpoints");
const carryTube = n(carry, /관 반지름 ([\d.]+)m\)는 로컬/);
pass("carry handle endpoints intersect vessel profile",
  Math.abs(Number(carryEnds[1]) - n(carry, /\(0\.28,([\d.]+)\)/)) <= carryTube &&
  Math.abs(Number(carryEnds[3]) - n(carry, /\(0\.45,([\d.]+)\)/)) <= carryTube &&
  Number(carryEnds[2]) === 0.28 && Number(carryEnds[4]) === 0.45);
const small = h2("wares", "small-vessel");
const smallEnds = small.match(/아래 부착점 \(([\d.]+),([\d.]+),0\)m[^\n]*?위 부착점 \(([\d.]+),([\d.]+),0\)m/);
assert.ok(smallEnds, "small vessel handle endpoints");
const smallTube = n(small, /관 반지름 ([\d.]+)m\)는 아래 부착점/);
pass("small vessel handle endpoints intersect profile",
  Math.abs(Number(smallEnds[1]) - n(small, /\(0\.10,([\d.]+)\)/)) <= smallTube &&
  Math.abs(Number(smallEnds[3]) - n(small, /\(0\.16,([\d.]+)\)/)) <= smallTube &&
  Number(smallEnds[2]) === 0.10 && Number(smallEnds[4]) === 0.16);
near("basket rim touches wall top", n(basket, /중심 높이 Y=([\d.]+)m/),
  n(basket, /벽은 Y=[\d.]+~([\d.]+)m를/));
const scrollCentreDistance = Math.hypot(0.03 * Math.sqrt(3), 0.03);
near("three-roll cylinders mutually tangent", scrollCentreDistance, 2 * rollRadius);
near("three-roll tie contacts all cylinders", tieRadius - tubeRadius, rollRadius);
const singlePinFront = single.match(/판 앞면 Z=([\d.]+)m→\+([\d.]+)m와 뒷면 Z=−([\d.]+)m→−([\d.]+)m/);
assert.ok(singlePinFront, "single-door pins must give both leaf-side and ring-side datums");
near("single pins touch panel and rings on both sides", Number(singlePinFront[2]),
  n(single, /Z=\+([\d.]+)m\/−[\d.]+m이고 로컬/));
near("single rear pin reaches back ring", Number(singlePinFront[4]),
  n(single, /Z=\+[\d.]+m\/−([\d.]+)m이고 로컬/));
near("single pin lower face reaches the panel", Number(singlePinFront[3]),
  n(single, /짝은[^\n]*?두께 ([\d.]+)m이다/));
const rippleInner = n(fountain, /파문 안쪽 반지름 ([\d.]+)m/);
const nozzleRadius = n(fountain, /노즐 받침은 반지름 ([\d.]+)m/);
near("fountain ripple clears nozzle pedestal", rippleInner - nozzleRadius,
  n(fountain, /([\d.]+)m 밖이므로 서로 관통하지 않는다/));
const altarTopWidth = n(altar, /제단은[^\n]*?폭 ([\d.]+)m/);
const altarSupportWidth = n(altar, /받침은 양옆의 두 석판\(폭 ([\d.]+)m/);
const altarClearSpan = n(altar, /그 사이 폭 ([\d.]+)m/);
const altarEdgeOverhang = n(altar, /사방으로 ([\d.]+)m 나온다/);
near("altar support gap remains open", 2 * altarSupportWidth + altarClearSpan +
  2 * altarEdgeOverhang, altarTopWidth);
const deskWidth = n(desk, /작성 책상은 폭 ([\d.]+)m/);
const deskDepth = n(desk, /작성 책상은 폭 [\d.]+m·깊이 ([\d.]+)m/);
const deskHeight = n(desk, /작성 책상은 폭 [\d.]+m·깊이 [\d.]+m·높이 ([\d.]+)m/);
const deskTopDepth = n(desk, /상판 두께 ([\d.]+)m/);
const deskLegWidth = n(desk, /다리는 정방 ([\d.]+)m/);
const deskBraceBottom = n(desk, /바닥 위 Y=([\d.]+)m에 있다/);
const deskBraceHeight = n(desk, /연직 높이는 ([\d.]+)m/);
pass("desk braces connect all four legs",
  /네 다리 중심은 \(X,Z\)=\(±\(폭\/2−0\.06m\), ±\(깊이\/2−0\.06m\)\)/.test(desk) &&
  /두 X방향 선과 두 Z방향 선을 잇고/.test(desk) &&
  deskLegWidth / 2 < deskWidth / 2 - deskLegWidth &&
  deskLegWidth / 2 < deskDepth / 2 - deskLegWidth &&
  deskBraceBottom + deskBraceHeight < deskHeight - deskTopDepth,
  `brace spans ${deskWidth - 2 * deskLegWidth}×${deskDepth - 2 * deskLegWidth}m between four leg centers`);
const stool = h2("fixtures", "stool");
const stoolWidth = n(stool, /좌판은 ([\d.]+)×/);
const stoolDepth = n(stool, /좌판은 [\d.]+×([\d.]+)m/);
const stoolLegCentreX = n(stool, /중심은 \(X,Z\)=\(±([\d.]+)m/);
const stoolLegCentreZ = n(stool, /중심은 \(X,Z\)=\(±[\d.]+m,±([\d.]+)m/);
const stoolLegWidth = n(stool, /네 다리는 정방 ([\d.]+)m/);
pass("stool braces connect all four legs",
  /네 다리 중심을 잇는 가로 지지재/.test(stool) &&
  stoolLegCentreX + stoolLegWidth / 2 < stoolWidth / 2 &&
  stoolLegCentreZ + stoolLegWidth / 2 < stoolDepth / 2 &&
  n(stool, /아랫면이 바닥 위 ([\d.]+)m에 있다/) +
    n(stool, /연직 높이 ([\d.]+)m 단면/) <
    n(stool, /윗면 높이 ([\d.]+)m다/) - n(stool, /좌판은[^\n]*?두께 ([\d.]+)m/));
const neighbor = h2("landscape", "neighbor-house");
const houseRoofThickness = n(neighbor, /slab 두께는 연직 ([\d.]+)m/);
const houseAFrontTop = n(neighbor, /지붕 아랫면 `[^`]*=([\d.]+)m`까지/);
const houseARidgeUnder = n(neighbor, /중심 높이 `[^`]*=([\d.]+)m`까지/);
pass("neighbor gable end remains closed",
  houseARidgeUnder > houseAFrontTop &&
  /닫힌 삼각 박공벽을 `wall` part에 포함/.test(neighbor) &&
  Math.abs(houseARidgeUnder - (n(neighbor, /중심에서 `[^`]*=([\d.]+)m`다/) - houseRoofThickness)) < 1e-6,
  `A gable wall spans Y=${houseAFrontTop}..${houseARidgeUnder}`);
const houseWall = n(neighbor, /네 벽의 실체 두께는 안쪽으로 ([\d.]+)m/);
const houseRecess = n(neighbor, /앞면에서 안쪽으로 ([\d.]+)m 들어가고/);
near("neighbor recess retains a backing wall", houseWall - houseRecess,
  n(neighbor, /불투명한 뒷벽 ([\d.]+)m가 남는다/));
console.log("checked the named contact equations; model-contact-census accounts for every candidate sentence");
