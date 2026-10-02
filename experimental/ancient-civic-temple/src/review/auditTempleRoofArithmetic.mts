import assert from "node:assert/strict";
import type { ITempleArithmeticIo } from "./ITempleArithmeticIo.mjs";

/** Check authored roof, colonnade, rafter and truss contacts in their original
 * assertion order. Metres and degrees retain the prose's existing tolerances.
 * No shared state escapes; the CLI continues with openings only after success.
 */
export const auditTempleRoofArithmetic = (io: ITempleArithmeticIo): void => {
  const { h2, n, near, pass } = io;
  const column = h2("columns", "colonnade-column");
  const beam = h2("entablature", "colonnade-beam");
  const rafter = h2("entablature", "rafter");
  const roofAssembly = io.space("roofs/assembly");
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
  io.log("PASS colonnade beam fits the capital", beamWidth, capitalWidth);
  const colonnadeDatums = io.space("building");
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
  const southFacade = io.space("facades/south");
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
  const datums = io.space("building");
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
  const sanctuaryRoof = io.space("roofs/sanctuary");
  const sanctuaryRoofSupportX = n(sanctuaryRoof, /지지선은 X=±([\d.]+)m/);
  const sanctuarySupportY = n(sanctuaryRoof, /제실 값 ([\d.]+)m/);
  const sanctuaryLowerAtSide = sanctuarySupportY +
    (sanctuaryRoofSupportX - innerWallFace) * Math.tan(porchSlope) -
    roofThickness / Math.cos(porchSlope);
  const sanctuaryLowerAtRidge = sanctuarySupportY +
    sanctuaryRoofSupportX * Math.tan(porchSlope) - roofThickness / Math.cos(porchSlope);
  const rafterEnds = rafter.match(/바깥 처마 끝 \|X\|=([\d.]+)m에서 지붕 지지선 \|X\|=([\d.]+)m와 측벽 바깥면 \|X\|=([\d.]+)m의 차이 ([\d.]+)m만큼 안쪽인 \|X\|=([\d.]+)m에서[^\n]+?바깥면 \|X\|=([\d.]+)m까지[^\n]+?안쪽면 \|X\|=([\d.]+)m부터 X=0/);
  assert.ok(rafterEnds, "sanctuary rafter two disjoint interval endpoints");
  const [roofEdgeX, supportX, outerFaceDatumX, inset, eaveX, outerFaceX, innerFaceX] = rafterEnds.slice(1).map(Number);
  near("sanctuary outer rafter stops at outside wall face", outerFaceX, outerWallFace);
  near("sanctuary inner rafter starts at inside wall face", innerFaceX, innerWallFace);
  near("sanctuary roof edge starts at outer wall", roofEdgeX,
    outerWallFace + n(roofAssembly, /돌출 ([\d.]+)m와/));
  near("sanctuary rafter cut uses the reviewed support", supportX, sanctuaryRoofSupportX);
  near("sanctuary rafter cut uses the reviewed wall", outerFaceDatumX, outerWallFace);
  near("sanctuary rafter inset is the support setback", inset, outerFaceDatumX-supportX);
  near("sanctuary rafter cut stays inside the eave", eaveX, roofEdgeX-inset);
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
  const rafterY = (x: number) => Number(rafterTop[1]) +
    (Number(rafterTop[2]) - Math.abs(x)) * Math.tan(Number(rafterTop[3]) * Math.PI / 180) -
    Number(rafterTop[4]) / Math.cos(Number(rafterTop[5]) * Math.PI / 180);
  const roofUnderY = (x: number) => sanctuarySupportY +
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
  const principalTopAt = (x: number) => sanctuarySupportY + (sanctuaryRoofSupportX - x) * Math.tan(porchSlope) - roofThickness / Math.cos(porchSlope);
  near("truss principal foot cuts at tie top", Math.max(principalTopAt(innerWallFace) - principalDepth / Math.cos(porchSlope), trussTieTop), trussTieTop);
  const strutFootX = n(truss, /발끝 중심은 가운데 기둥의 양 측면 X=±([\d.]+)m/);
  const strutFootY = n(truss, /양 측면 X=±[\d.]+m·Y=([\d.]+)m/);
  const strutTipX = n(truss, /끝 중심은 각 경사재의 수평 구간 중간 X=±([\d.]+)m/);
  const strutTipY = n(truss, /그 아랫면 Y≈([\d.]+)m/);
  near("truss strut foot meets king-post side", strutFootX, n(truss, /가운데 기둥\(([\d.]+)×/) / 2);
  near("truss strut tip meets principal underside", strutTipY, principalTopAt(strutTipX) - principalDepth / Math.cos(porchSlope), 0.001);
  assert.ok(strutTipY > strutFootY, "strut must rise from king side to principal");
  }
