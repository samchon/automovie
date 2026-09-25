// Draft-stage audit of authored model dimensions. Mesh bounds remain unverified
// until reviewed modelSources exist; this checks the deterministic design inputs.
// Run from this production root: node src/review/model-design-audit.cjs
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
/** @type {Map<string, string>} */
const sections = new Map();
for (const name of ["000-representation", "001-seating-and-work", "002-storage-and-sleep", "003-service-fixtures", "004-decor-and-fixtures"]) {
  const source = fs.readFileSync(path.join(root, "docs/models", `${name}.md`), "utf8");
  const lines = source.split(/\r?\n/);
  let anchor = "";
  for (const line of lines) {
    const heading = /^## .*\{#([^}]+)\}/.exec(line);
    if (heading) {
      anchor = heading[1];
      if (sections.has(anchor)) throw Error(`duplicate model H2 ${anchor}`);
      sections.set(anchor, "");
    } else if (anchor) sections.set(anchor, `${sections.get(anchor)}\n${line}`);
  }
}

/** @type {string[]} */
const errors = [];
let assertions = 0;
/** @type {Set<string>} */
const measuredAnchors = new Set();
/** @param {boolean} passed @param {string} label */
function requireThat(passed, label) {
  assertions++;
  if (!passed) errors.push(label);
}
/** @param {number} a @param {number} b @param {string} label */
function equalLength(a, b, label) { requireThat(Math.abs(a - b) < 0.000001, `${label}: ${a} != ${b}`); }
/** @param {number} min @param {number} max @param {number} value */
function inBounds(min, max, value) { return value >= min - 0.000001 && value <= max + 0.000001; }
/** @param {number} min @param {number} max @param {number} value @param {string} label */
function contains(min, max, value, label) { requireThat(inBounds(min, max, value), `${label}: ${value} outside ${min}..${max}`); }
/** @param {string} anchor @param {string[]} required */
function hasDesign(anchor, required) {
  const source = sections.get(anchor);
  requireThat(source !== undefined, `${anchor}: H2 absent`);
  if (source === undefined) return;
  requireThat(/ref0[1-5]/.test(source) && source.includes("unverified"), `${anchor}: reference or limit absent`);
  for (const phrase of required) requireThat(source.includes(phrase), `${anchor}: reviewed input missing: ${phrase}`);
}

// Every prototype H2 is named here. Adding or removing an H2 changes the gate.
/** @type {Record<string, string[]>} */
const prototypes = {
  "living-sofa": ["2.70", "0.88", "0.96", "0.45..0.67"],
  "dining-table": ["1.80", "0.92", "0.74", "0..0.696"],
  "coffee-table": ["0.90", "1.25", "0.36", "0..0.32"],
  "dining-chair": ["0.48", "0.55", "0.84", "0.45..0.49"],
  "island-stool": ["0.36", "0.63", "0..0.585"],
  "work-desk": ["folded", "open", "0.70..1.00", "0..0.44"],
  "desk-chair": ["0.52", "0.55", "0.83", "z=−0.08·앞쪽 z=+0.18"],
  "work-equipment": ["0.50", "0.30", "0.025", "0.35"],
  "cabinet-and-shelf": ["0.60", "0.5252", "oven-sill", "shelf-1..n-1", "−0.9432"],
  "entry-bench": ["1.15", "0.49", "0.52", "0.08"],
  "entry-charging-shelf": ["0.32", "0.15", "z=0..0.025", "z=0..0.12"],
  "fixed-bed": ["2.18", "1.01", "0..0.08", "0.28..0.50"],
  "murphy-bed": ["work", "guest", "0..0.32", "0.32..0.44"],
  basin: ["basin/800", "bowl", "mirror"],
  toilet: ["0.42", "0.72", "0.465", "0.82"],
  shower: ["2.05", "1.45", "2.25", "x=−0.85"],
  bathtub: ["1.62", "0.76", "0.58", "0.12"],
  "kitchen-island": ["1.20", "2.82", "서비스 문 다섯 장", "0.93"],
  "cooking-appliances": ["0.014", "0.586", "개방 bay"],
  refrigerator: ["0.90", "2.65", "0.785", "0..0.08"],
  "laundry-appliances": ["0.66", "0.84", "controls-panel"],
  "potted-plant": ["0.18", "0.28", "0.60", "1.10"],
  books: ["180x30x120", "240x35x160", "300x50x200"],
  "folded-towels": ["0.08", "0.12", "0.16", "0.004"],
  "storage-basket": ["0.40", "0.65", "0.28", "0.012"],
  "entry-charger": ["0.07", "0.12", "0.015", "0.010"],
  rugs: ["2.80", "3.65", "0.016", "0.012", "round-rug/1200"],
  "wall-art": ["0.60", "0.42", "0.035", "0.010"],
  "tabletop-props": ["0.22", "0.36", "0.085", "0.095"],
  "living-display": ["1.43", "0.80", "0.045", "0.039..0.042"],
  "recessed-light": ["0.12", "0.04", "−0.025..0"],
  "dining-pendant": ["1.00", "0.045", "−1.00..−0.62"],
  "portable-lamps": ["1.24", "0.29", "0.42", "z=+0.09"]
};
const common = ["model-address-and-scale", "model-uv-and-topology", "model-articulation-ownership", "model-bounds-and-states", "model-neutral-observation"];
for (const anchor of common) hasDesign(anchor, []);
hasDesign("model-address-and-scale", ["0=(−X,−Z)", "1=(−X,+Z)", "2=(+X,−Z)", "3=(+X,+Z)"]);
for (const [anchor, required] of Object.entries(prototypes)) hasDesign(anchor, required);
requireThat(sections.size === common.length + Object.keys(prototypes).length,
  `model H2 census ${sections.size} != ${common.length + Object.keys(prototypes).length}`);

// Contact and occupied-bound equations below use the named values in the H2s.
// They check the eleven concrete contradictions in v-115 plus cabinet leaf scale.
/** @param {string} anchor @param {RegExp} pattern @param {number} [group] */
function numeric(anchor, pattern, group = 1) {
  const match = pattern.exec(sections.get(anchor) || "");
  if (!match) throw Error(`${anchor}: cannot measure ${pattern}`);
  const value = Number(match[group].replace("−", "-"));
  if (!Number.isFinite(value)) throw Error(`${anchor}: non-finite ${pattern}`);
  measuredAnchors.add(anchor);
  return value;
}
function checkSeating() {
  const sofaSeatTop = numeric("living-sofa", /z=−0\.30\.\.\+0\.48, y=0\.31\.\.([\d.]+)다/);
  const pillowBottom = numeric("living-sofa", /베개 셋은.*?y=([\d.]+)\.\.0\.67/);
  equalLength(sofaSeatTop, pillowBottom, "sofa pillow-to-seat contact");
  const sofaRear = numeric("living-sofa", /본체는 x=±1\.35, z=±([\d.]+)/);
  const pillowRear = numeric("living-sofa", /베개 Z 점유를 바깥으로 반올림한 선언 범위는 ([−\d.]+)\.\.[−\d.]+m/);
  contains(-sofaRear, sofaRear, pillowRear, "sofa pillow rear Z");
  const diningBackBottom = numeric("dining-chair", /등판은.*?y=([\d.]+)\.\.0\.84/);
  const diningRearLegTop = numeric("dining-chair", /y=0\.45\.\.([\d.]+)에서 중심선을/);
  equalLength(diningBackBottom, diningRearLegTop, "dining back-to-rear-leg contact");
  const chairSeatRear = numeric("desk-chair", /좌면 셸은.*?z=([−\d.]+)\.\.\+0\.28/);
  const chairLegRear = numeric("desk-chair", /뒤쪽 z=([−\d.]+)·앞쪽/);
  const chairLegRadius = numeric("desk-chair", /지름 ([\d.]+)m, y=0\.\./) / 2;
  contains(chairSeatRear, 0.28, chairLegRear - chairLegRadius, "desk-chair rear leg inside shell");
  const chairSeatBottom = numeric("desk-chair", /좌면 셸은.*?y=([\d.]+)\.\.0\.415/);
  const chairLegTop = numeric("desk-chair", /지름 0\.025m, y=0\.\.([\d.]+)로 둔다/);
  equalLength(chairSeatBottom, chairLegTop, "desk-chair leg-to-shell Y contact");
}
function checkDeskAndMurphy() {
  requireThat((sections.get("work-desk") || "").includes("flex는 `folded`와 `open` 중 하나의 명시 상태를 반드시 받으며 상태 없는 호출을 거부한다"),
    "flex desk requires an explicit state key");
  const foldedMax = numeric("work-desk", /`folded` 상태 전체 메시 AABB는 x=−0\.70\.\.\+([\d.]+)/);
  const foldedPanelMax = numeric("work-desk", /`folded` 상태는 x=0\.70\.\.([\d.]+)/);
  const openMax = numeric("work-desk", /`open` 상태는.*?x=0\.70\.\.([\d.]+)/);
  const openEnvelopeMax = numeric("work-desk", /`open` 상태는.*?전체 메시 AABB는 x=−0\.70\.\.\+([\d.]+)/);
  contains(-0.70, foldedMax, foldedPanelMax, "folded desk occupied X");
  contains(-0.70, openEnvelopeMax, openMax, "open desk occupied X");
  const lowerBottom = numeric("work-desk", /기둥은 y=([\d.]+)\.\.0\.44의 외경/);
  equalLength(lowerBottom, 0, "telescopic lower-to-floor contact");
  const frameBottom = numeric("murphy-bed", /수평 프레임은.*?y=([\d.]+)\.\.0\.44/);
  const supportTop = numeric("murphy-bed", /지지 다리.*?y=0\.\.([\d.]+)에 세워/);
  equalLength(frameBottom, supportTop, "murphy support-to-frame contact");
}
function checkWetAndAppliances() {
  const showerWidth = numeric("shower", /X 폭 ([\d.]+)/);
  const showerHeadX = numeric("shower", /head는 x=([-−\d.]+)를 중심으로/);
  const showerHeadHalfWidth = numeric("shower", /head는.*?폭 ([\d.]+)m/) / 2;
  contains(-showerWidth / 2, showerWidth / 2, showerHeadX - showerHeadHalfWidth, "shower head occupied X");
  const declaredCooktopHeight = numeric("cooking-appliances", /`cooktop`\(0\.65×0\.50×([\d.]+)m\)/);
  const cooktopBottom = numeric("cooking-appliances", /cooktop 본체는 y=([\d.]+)\.\./);
  const cooktopTop = numeric("cooking-appliances", /cooktop 본체는 y=[\d.]+\.\.([\d.]+)로/);
  const rimTop = numeric("cooking-appliances", /rim만 y=0\.925\.\.([\d.]+)로/);
  equalLength(rimTop - cooktopBottom, declaredCooktopHeight, "cooktop declared height");
  equalLength(cooktopTop, 0.925, "cooktop body flush with worktop");
  const cabinetBottomTop = numeric("cabinet-and-shelf", /하판은 y=0\.08\.\.([\d.]+)/);
  const ovenSillBottom = numeric("cabinet-and-shelf", /`oven-sill`\(x=±0\.32,y=([\d.]+)\.\./);
  const ovenSillTop = numeric("cabinet-and-shelf", /`oven-sill`\(x=±0\.32,y=[\d.]+\.\.([\d.]+)/);
  const ovenBottom = numeric("cooking-appliances", /oven은 cabinet.*?y=([\d.]+)\.\.0\.74/);
  equalLength(cabinetBottomTop, ovenSillBottom, "oven sill-to-cabinet bottom contact");
  equalLength(ovenSillTop, ovenBottom, "oven-to-sill contact");
  const ovenBodyRear = numeric("cooking-appliances", /몸체는 z=([−\d.]+)\.\.\+0\.292/);
  const ovenBodyFront = numeric("cooking-appliances", /몸체는 z=[−\d.]+\.\.\+([\d.]+)에서/);
  const ovenHandleFront = numeric("cooking-appliances", /바깥 끝 z=([\d.]+)/);
  const ovenBodyDepth = numeric("cooking-appliances", /오븐 몸체 깊이는 ([\d.]+)m/);
  const ovenTotalDepth = numeric("cooking-appliances", /손잡이 포함 깊이 ([\d.]+)×높이/);
  equalLength(ovenBodyFront - ovenBodyRear, ovenBodyDepth, "oven body depth");
  equalLength(ovenHandleFront - ovenBodyRear, ovenTotalDepth, "oven total depth");
}
function checkShelvesAndLamps() {
  const shelfWallZ = numeric("entry-charging-shelf", /선반 아래 중앙\(z=([\d.]+)\)/);
  const shelfCleatRearZ = numeric("entry-charging-shelf", /cleat는.*?z=([\d.]+)\.\.0\.025/);
  const shelfBoardY = numeric("entry-charging-shelf", /판은.*?y=([\d.]+)\.\.0\.045/);
  const cleatTopY = numeric("entry-charging-shelf", /cleat는.*?y=-0\.030\.\.([\d.]+)/);
  equalLength(shelfWallZ, shelfCleatRearZ, "charging shelf cleat-to-wall contact");
  equalLength(shelfBoardY, cleatTopY, "charging shelf cleat-to-board contact");
  const bracketRearZ = numeric("entry-charging-shelf", /각 브래킷은 z=([\d.]+)에서 평벽/);
  equalLength(shelfWallZ, bracketRearZ, "charging shelf bracket-to-wall contact");
  const headMaxZ = numeric("portable-lamps", /z=0\.\.([\d.]+)의 `task-head/);
  const diffuserZ = numeric("portable-lamps", /헤드 아래 중심 z=\+([\d.]+)/);
  const diffuserRadius = numeric("portable-lamps", /아래쪽 diffuser 지름 ([\d.]+)m/) / 2;
  contains(0, headMaxZ, diffuserZ + diffuserRadius, "task lamp diffuser inside head Z");
  const leafCap = numeric("cabinet-and-shelf", /leaf 수는 `n=max\(2,ceil\(\(W−0\.006\)\/([\d.]+)\)\)`/);
  for (const width of [0.50, 0.60, 0.90, 1.15, 2.72, 2.90]) {
    const count = Math.max(2, Math.ceil((width - 0.006) / leafCap));
    const leafWidth = (width - (count + 1) * 0.003) / count;
    contains(0, 0.60, leafWidth, `cabinet ${width} m leaf width`);
  }
  requireThat(Math.max(2, Math.ceil((2.90 - 0.006) / leafCap)) === 5, "ref03 wall overhead has five leaves");
  const hingeInset = numeric("cabinet-and-shelf", /짝수 leaf는 왼쪽 edge에서 ([\d.]+)m 안쪽/);
  const hingeRadius = numeric("cabinet-and-shelf", /문마다 지름 ([\d.]+)m·축 길이/) / 2;
  requireThat(hingeInset + 0.003 >= hingeRadius, "cabinet hinge stays inside declared width");
  const hingeZInset = numeric("cabinet-and-shelf", /일반형 힌지 축 z=D\/2−([\d.]+)와 반경/);
  requireThat(hingeZInset >= hingeRadius && 0.018 - hingeZInset >= hingeRadius,
    "cabinet hinge stays within both faces of door thickness");
  const islandHingeX = numeric("cabinet-and-shelf", /섬 문은 x=−0\.44\.\.−0\.422이고 축은 x=([−\d.]+)/);
  requireThat(islandHingeX - hingeRadius >= -0.44, "island hinge stays inside declared width");
  const islandOpenMinX = numeric("cabinet-and-shelf", /`x=([−\d.]+)\.\.\+0\.440,y=0\.\.0\.87/);
  equalLength(islandOpenMinX, islandHingeX - (0.5252 - 0.009), "island open-state X bound");
}
function checkRemainingPrototypes() {
  const diningTop = numeric("dining-table", /상판은 y=([\d.]+)\.\.0\.740/);
  equalLength(0.74 - diningTop, 0.044, "dining tabletop thickness");
  const coffeeTop = numeric("coffee-table", /y=([\d.]+)\.\.0\.36/);
  equalLength(0.36 - coffeeTop, 0.04, "coffee tabletop thickness");
  const stoolTop = numeric("island-stool", /상면 y=([\d.]+)/);
  const stoolSeatThickness = numeric("island-stool", /좌판은 두께 ([\d.]+)/);
  equalLength(stoolTop - stoolSeatThickness, 0.585, "stool leg-to-seat contact");
  const stoolLegCenter = numeric("island-stool", /x\/z=±([\d.]+) 중심/);
  const stoolLegHalf = numeric("island-stool", /다리 네 개는 ([\d.]+)m 사각 단면/) / 2;
  const footrestCenter = numeric("island-stool", /중심선 x\/z=±([\d.]+)를 따르는/);
  const footrestHalf = numeric("island-stool", /([\d.]+)×0\.018m 사각 단면의 네 수평 막대/) / 2;
  equalLength(footrestCenter, stoolLegCenter - stoolLegHalf,
    "stool footrest bar end meets inner leg face");
  requireThat(footrestCenter + footrestHalf > stoolLegCenter - stoolLegHalf,
    "stool footrest has positive face-contact area");
  const keyboardBodyTop = numeric("work-equipment", /본체는 y=0\.\.([\d.]+)/);
  const keyboardCapTop = numeric("work-equipment", /key cap은.*?y=0\.012\.\.([\d.]+)/);
  equalLength(keyboardCapTop - keyboardBodyTop, 0.003, "keyboard cap height");
  const benchBaseH = numeric("entry-bench", /bench-base\/1150x(\d+)x480/) / 1000;
  const benchCushionH = numeric("entry-bench", /두께 ([\d.]+)m 방석/);
  equalLength(benchBaseH + benchCushionH, 0.52, "bench total height");
  const bedFrameBottom = numeric("fixed-bed", /측면 rail은.*?y=([\d.]+)\.\.0\.28/);
  const bedLegTop = numeric("fixed-bed", /네 다리는.*?y=0\.\.([\d.]+)/);
  equalLength(bedFrameBottom, bedLegTop, "fixed bed leg-to-frame contact");
  const basinRimBottom = numeric("basin", /rim은 y=([\d.]+)\.\.0\.85/);
  equalLength(basinRimBottom + 0.05, 0.85, "basin rim-to-vanity contact");
  const toiletSeatBottom = numeric("toilet", /seat는.*?y=([\d.]+)\.\.0\.465/);
  equalLength(toiletSeatBottom + 0.035, 0.465, "toilet seat height");
  const tubShellWidth = numeric("bathtub", /바닥 점유 1\.62×([\d.]+)m/);
  const tubInsideWidth = numeric("bathtub", /내벽 간 치수는 길이 1\.53×폭 ([\d.]+)m/);
  equalLength(tubShellWidth - tubInsideWidth, 2 * 0.04, "tub side-wall thickness");
  const tubWallBottom = numeric("bathtub", /네 외벽이 y=([\d.]+)\.\.0\.58에서 바닥에 닿는다/);
  const tubFloorUnderside = numeric("bathtub", /내부 바닥판의 아래면 y=([\d.]+)m/);
  equalLength(tubWallBottom, 0, "tub outer wall-to-floor contact");
  requireThat(tubFloorUnderside > tubWallBottom && tubFloorUnderside < 0.58,
    "tub floor underside is supported inside outer wall");
  const islandWidth = numeric("kitchen-island", /X 폭 ([\d.]+)/);
  const islandBaseWidth = numeric("kitchen-island", /X 점유 -0\.48\.\.\+([\d.]+)/) - (-0.48);
  equalLength(islandWidth - islandBaseWidth, 0.32, "island total overhang");
  const fridgeRear = numeric("refrigerator", /body는.*?z=([-−\d.]+)\.\.\+0\.29/);
  const fridgeHandleFront = numeric("refrigerator", /z=\+0\.38\.\.\+([\d.]+)/);
  equalLength(fridgeHandleFront - fridgeRear, 0.785, "refrigerator depth incl handle");
  const laundryRear = numeric("laundry-appliances", /본체는 z=([-−\d.]+)\.\.\+0\.30/);
  equalLength(0.33 - laundryRear, 0.66, "laundry depth incl drum");
  const plantPotFraction = numeric("potted-plant", /화분 높이는 ([\d.]+)H/);
  contains(0, 1, plantPotFraction, "plant pot within total H");
  const bookMinThickness = numeric("books", /허용 조합은 `\d+x(\d+)x\d+`/) / 1000;
  const bookCoverThickness = numeric("books", /표지 두 장은 두께 ([\d.]+)m/);
  requireThat(bookMinThickness > 2 * bookCoverThickness, "book has positive page width");
  const towelGap = numeric("folded-towels", /두 ([\d.]+)m 음영 틈의/);
  equalLength(2 * towelGap, 0.008, "towel fold-gap contribution");
  const basketWall = numeric("storage-basket", /네 벽 두께 ([\d.]+)m/);
  requireThat(basketWall > 0 && basketWall < 0.40 / 2, "basket cavity width positive");
  const chargerPortDepth = numeric("entry-charger", /깊이 ([\d.]+)m 단자 구멍/);
  contains(0, 0.12, 0.05 + chargerPortDepth, "charger port within depth");
  const rugBase = numeric("rugs", /base 높이는 living ([\d.]+)m/);
  const rugPile = numeric("rugs", /pile 높이는 두 변종 모두 ([\d.]+)m/);
  equalLength(rugBase + rugPile, 0.016, "living rug pile height");
  const artworkAirGap = numeric("wall-art", /z=0\.021\.\.0\.031은 ([\d.]+)m/);
  equalLength(artworkAirGap, 0.031 - 0.021, "wall art air gap");
  const bowlOuter = numeric("tabletop-props", /`decor-bowl`은 외경 ([\d.]+)/);
  const bowlInner = numeric("tabletop-props", /상단 개구 내경 ([\d.]+)m/);
  equalLength(bowlOuter - bowlInner, 2 * 0.008, "decor bowl wall thickness");
  const cupHandleOuter = numeric("tabletop-props", /외경 ([\d.]+)m 손잡이/);
  const cupTubeDiameter = numeric("tabletop-props", /튜브 지름 ([\d.]+)m/);
  requireThat(cupTubeDiameter > 0 && cupTubeDiameter < cupHandleOuter,
    "decor cup handle tube fits within outside diameter");
  const cupHandleCenterZ = numeric("tabletop-props", /중심 y=0\.050,z=\+([\d.]+)/);
  const cupBoundFrontZ = numeric("tabletop-props", /z=−0\.0425\.\.\+([\d.]+)m다/);
  equalLength(cupHandleCenterZ + cupHandleOuter / 2, cupBoundFrontZ,
    "decor cup handle within declared Z bound");
  const displayMountDepth = numeric("living-display", /mount는.*?깊이 ([\d.]+)m/);
  const displayHousingDepth = numeric("living-display", /뒤판 housing은.*?깊이 ([\d.]+)m/);
  const displayBezelDepth = numeric("living-display", /bezel의 ([\d.]+)m 깊이/);
  equalLength(displayMountDepth + displayHousingDepth + displayBezelDepth, 0.045, "display total depth");
  const recessedTrimBottom = numeric("recessed-light", /trim은.*?y=([-−\d.]+)\.\.0/);
  const recessedHousingBottom = numeric("recessed-light", /housing-body는.*?y=([−\d.]+)\.\.−0\.028/);
  const recessedFlangeTop = numeric("recessed-light", /housing-flange는.*?y=−0\.028\.\.([−\d.]+)/);
  equalLength(-recessedHousingBottom, 0.04, "surface light total depth");
  equalLength(recessedTrimBottom, recessedFlangeTop, "surface light trim meets flange");
  const pendantShadeBottom = numeric("dining-pendant", /shade는 y=([-−\d.]+)\.\.−0\.62/);
  equalLength(-pendantShadeBottom, 1.00, "pendant downward length");
}
checkSeating();
checkDeskAndMurphy();
checkWetAndAppliances();
checkShelvesAndLamps();
checkRemainingPrototypes();
for (const anchor of Object.keys(prototypes)) requireThat(measuredAnchors.has(anchor), `${anchor}: no numeric measurement`);

// Mutate the in-memory authored H2 and rerun the same checks. A missing or
// non-failing mutation is a broken gate, not a successful audit.
const verifiedAssertions = assertions;
/** @type {{ label: string, errors: string[] }[]} */
const mutation = [];
/** @param {string} anchor @param {string} before @param {string} after @param {() => void} check @param {string} label */
function exerciseMutation(anchor, before, after, check, label) {
  const original = sections.get(anchor);
  if (!original || !original.includes(before)) throw Error(`${label}: mutation input absent`);
  const start = errors.length;
  sections.set(anchor, original.replace(before, after));
  try { check(); } catch (error) { errors.push(`${label}: ${String(error)}`); }
  sections.set(anchor, original);
  if (errors.length === start) throw Error(`${label}: mutated H2 incorrectly passed`);
  mutation.push({ label, errors: errors.splice(start) });
}
exerciseMutation("shower", "head는 x=−0.85를", "head는 x=−0.95를",
  checkWetAndAppliances, "shower head outside declared X");
exerciseMutation("desk-chair", "뒤쪽 z=−0.08·앞쪽", "뒤쪽 z=−0.18·앞쪽",
  checkSeating, "desk-chair rear legs miss seat");
exerciseMutation("cooking-appliances", "`cooktop`(0.65×0.50×0.014m)",
  "`cooktop`(0.65×0.50×0.012m)", checkWetAndAppliances, "cooktop declared height misses rim");
exerciseMutation("portable-lamps", "헤드 아래 중심 z=+0.09", "헤드 아래 중심 z=+0.14",
  checkShelvesAndLamps, "task lamp diffuser exits head");
exerciseMutation("work-desk", "flex는 `folded`와 `open` 중 하나의 명시 상태를 반드시 받으며 상태 없는 호출을 거부한다",
  "flex는 상태 없는 호출을 받는다", checkDeskAndMurphy, "flex desk loses required state");
exerciseMutation("dining-chair", "y=0.45..0.49에서 중심선을", "y=0.45..0.45에서 중심선을",
  checkSeating, "dining-chair rear leg misses back");
exerciseMutation("living-sofa", "높이 0.22·깊이 0.16m로 y=0.45..0.67", "높이 0.22·깊이 0.16m로 y=0.55..0.67",
  checkSeating, "sofa pillow misses seat");
exerciseMutation("work-desk", "기둥은 y=0..0.44의 외경", "기둥은 y=0.05..0.44의 외경",
  checkDeskAndMurphy, "flex desk lower post misses floor");
exerciseMutation("cabinet-and-shelf", "`oven-sill`(x=±0.32,y=0.098..0.15", "`oven-sill`(x=±0.32,y=0.15..0.15",
  checkWetAndAppliances, "oven sill misses cabinet bottom");
exerciseMutation("murphy-bed", "z=2.08, y=0..0.32에 세워", "z=2.08, y=0..0.44에 세워",
  checkDeskAndMurphy, "murphy supports penetrate bed frame");
exerciseMutation("entry-charging-shelf", "각 브래킷은 z=0에서 평벽", "각 브래킷은 z=0.02에서 평벽",
  checkShelvesAndLamps, "charging brackets miss wall");
exerciseMutation("cabinet-and-shelf", "leaf 수는 `n=max(2,ceil((W−0.006)/0.60))`",
  "leaf 수는 `n=max(2,ceil((W−0.006)/2.90))`", checkShelvesAndLamps,
  "overhead single leaf exceeds 0.60 m");
exerciseMutation("bathtub", "네 외벽이 y=0..0.58", "네 외벽이 y=0.12..0.58",
  checkRemainingPrototypes, "bathtub outer wall misses floor");
exerciseMutation("tabletop-props", "z=−0.0425..+0.0825m다", "z=−0.0425..+0.0755m다",
  checkRemainingPrototypes, "decor cup handle exceeds Z bound");
exerciseMutation("island-stool", "중심선 x/z=±0.1175", "중심선 x/z=±0.13",
  checkRemainingPrototypes, "stool ring penetrates legs");
console.log(JSON.stringify({ h2: sections.size, prototypes: Object.keys(prototypes).length,
  h2WithTargetedNumericCheck: measuredAnchors.size, assertions: verifiedAssertions, errors, mutation }, null, 2));
if (errors.length) process.exitCode = 1;
