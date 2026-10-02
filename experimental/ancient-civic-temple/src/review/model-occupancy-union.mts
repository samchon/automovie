import type { ITemplePartBound as PartBound } from "./ITemplePartBound.mjs";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { near, axes, scalar, escape } = templeBoundSyntax;
import { modelParts } from "./modelParts.mjs";
import { partBounds } from "./partBounds.mjs";
/** Compare independently reconstructed part and variant unions with authored
 * occupancy claims. Bounds remain parser-owned; comparisons report unresolved,
 * containment, summary and union rows without silently filling missing axes. */
/**
 * Every resolved part participates in the same axis/union comparison,
 * including alternate shapes of a multi-variant prototype.
 * @param  id
 * @param  parts
 * @param  box
 * @param  tolerance
 * @param  [options]
 */
const compareBounds = (id: string, parts: Record<string, PartBound>, box: number[], tolerance: number[], options: {ground?:boolean;backOrigin?:boolean;conservative?:boolean;zeroSurfaces?:Set<string>} = {}) => {
  const { ground = false, backOrigin = false, conservative = false,
    zeroSurfaces = new Set() } = options;
    const zeroSurface = (part: string, points: number[]) => zeroSurfaces.has(part) && points.length >= 2 &&
    near(Math.min(...points), Math.max(...points));
    const rows: { id:string;part:string;axis:string;kind:string;box:number;union:number;pass:boolean }[] = [];
  for (const [part, bounds] of Object.entries(parts)) for (let i = 0; i < 3; i++) {
    const axis = axes[i], points = bounds[axis];
    if ((points.length < 2 || near(Math.min(...points), Math.max(...points))) && !zeroSurface(part, points)) {
      rows.push({ id, part, axis, kind: "unresolved part axis", box: box[i], union: NaN, pass: false });
      continue;
    }
    const lo = Math.min(...points), hi = Math.max(...points);
    rows.push({
      id, part, axis, kind: "containment", box: box[i], union: hi - lo,
      pass: axis === "Y" && ground ? lo >= -tolerance[i] && hi <= box[i] + tolerance[i]
        : axis === "Z" && backOrigin ? lo >= -tolerance[i] && hi <= box[i] + tolerance[i]
          : hi - lo <= box[i] + tolerance[i],
    });
    for (const [a, b] of bounds.summary[axis]) rows.push({
      id, part, axis, kind: "summary", box: box[i], union: b - a,
      pass: near(lo, a) && near(hi, b),
    });
  }
  for (let i = 0; i < 3; i++) {
    const axis = axes[i], all = Object.entries(parts);
    if (!all.length || all.some(([key, part]) => part[axis].length < 2 ||
      (near(Math.max(...part[axis]), Math.min(...part[axis])) && !zeroSurface(key, part[axis])))) continue;
    const points = all.flatMap(([, part]) => part[axis]);
    const extent = Math.max(...points) - Math.min(...points);
    rows.push({
      id, part: "all", axis, kind: "union", box: box[i], union: extent,
      pass: conservative ? extent <= box[i] + tolerance[i] :
        Math.abs(extent - box[i]) <= tolerance[i],
    });
  }
  return rows;
};

const prism = (x: number[], y: number[], z: number[]): PartBound => ({ X: x, Y: y, Z: z, summary: { X: [], Y: [], Z: [] } });

/** Resolve the single, bundled, and open variants of rolled sheet geometry. */
const rolledSheetRows = (id: string, body: string) => {
  const mapping = modelParts(body);
  if (!/말린 한 개, 세 개 묶음, 펼친 한 장/.test(body) ||
    !mapping.some(({ noun }) => noun === "종이") || !mapping.some(({ noun }) => noun === "끈")) return null;
  const fail = () => [{ id, part: "all", axis: "XYZ", kind: "unresolved rolled variants",
    box: NaN, union: NaN, pass: false }];
  const cylinder = body.match(/반지름 ([\d.]+)m·길이 ([\d.]+)m 원통의 양끝 면에 반지름 [\d.]+m의 말림 심이 ([\d.]+)m씩/);
  const ring = body.match(/중심선 반지름 ([\d.]+)m·관 반지름 ([\d.]+)m인 원환/);
  const triangle = body.match(/YZ 중심을 \(0,−([\d.]+)\),\(0,\+([\d.]+)\),\(([\d.]+)√3,0\)m/);
  const flat = body.match(/로컬 X 폭 ([\d.]+)m·Z 길이 ([\d.]+)m·두께 ([\d.]+)m 판으로 Y=([\d.]+)~([\d.]+)m/);
  const endRoll = body.match(/X축 반지름 ([\d.]+)m·길이 ([\d.]+)m 원통이며 그 중심은 `\(Y,Z\)=\(([\d.]+),±\(([\d.]+)\+√\(([\d.]+)²−([\d.]+)²\)\)\)m`/);
  const singleBox = body.match(/말린 것 ([\d.]+)×([\d.]+)×([\d.]+)m/);
  const bundleBox = body.match(/묶음 ([\d.]+)×\(([\d.]+)√3\+([\d.]+)\)×([\d.]+)m/);
  const flatBox = body.match(/펼친 것 `([\d.]+)×([\d.]+)×\(2×\(([\d.]+)\+√\(([\d.]+)²−([\d.]+)²\)\+([\d.]+)\)\)m`/);
  if (!cylinder || !ring || !triangle || !flat || !endRoll || !singleBox || !bundleBox || !flatBox) return fail();
  const [radius, length, core] = cylinder.slice(1).map(Number);
  const [major, tube] = ring.slice(1).map(Number);
  const [sideLo, sideHi, peak] = triangle.slice(1).map(Number);
  const [sheetWidth, sheetLength, thickness, y0, y1] = flat.slice(1).map(Number);
  const [rollRadius, rollLength, rollY, z0, rootA, rootB] = endRoll.slice(1).map(Number);
  const ringRadius = major + tube;
  const bundlePeak = peak * Math.sqrt(3);
  const endOffset = z0 + Math.sqrt(rootA ** 2 - rootB ** 2);
  const sheet = mapping.find(({ noun }) => noun === "종이")?.key;
  const tie = mapping.find(({ noun }) => noun === "끈")?.key;
  const bundle = mapping.filter(({ noun }) => /종이 원통/.test(noun)).map(({ key }) => key);
  if (!sheet || !tie || bundle.length !== 3 || ![radius, length, core, major, tube,
    sideLo, sideHi, peak, sheetWidth, sheetLength, thickness, y0, y1, rollRadius,
    rollLength, rollY, endOffset].every(Number.isFinite)) return fail();
  const single = {
    [sheet]: prism([-length / 2 - core, length / 2 + core], [-radius, radius], [-radius, radius]),
    [tie]: prism([-tube, tube], [-ringRadius, ringRadius], [-ringRadius, ringRadius]),
  };
  const bundled = Object.fromEntries(bundle.map((key, i) => {
    const [y, z] = i === 0 ? [0, -sideLo] : i === 1 ? [0, sideHi] : [bundlePeak, 0];
    return [key, prism([-length / 2 - core, length / 2 + core], [y - radius, y + radius],
      [z - radius, z + radius])];
  }));
  bundled[tie] = prism([-tube, tube], [-ringRadius, bundlePeak + ringRadius],
    [-sideLo - ringRadius, sideHi + ringRadius]);
  const open = {
    [sheet]: prism([-Math.max(sheetWidth, rollLength) / 2, Math.max(sheetWidth, rollLength) / 2],
      [Math.min(y0, rollY - rollRadius), Math.max(y1, rollY + rollRadius)],
      [-Math.max(sheetLength / 2, endOffset + rollRadius),
        Math.max(sheetLength / 2, endOffset + rollRadius)]),
  };
  const singleSize = singleBox.slice(1).map(Number);
  const bundleSize = [Number(bundleBox[1]), Number(bundleBox[2]) * Math.sqrt(3) + Number(bundleBox[3]), Number(bundleBox[4])];
  const openSize = [Number(flatBox[1]), Number(flatBox[2]), 2 * (Number(flatBox[3]) +
    Math.sqrt(Number(flatBox[4]) ** 2 - Number(flatBox[5]) ** 2) + Number(flatBox[6]))];
  return [
    ...compareBounds(`${id}:single`, single, singleSize, [1e-6, 1e-6, 1e-6]),
    ...compareBounds(`${id}:bundle`, bundled, bundleSize, [1e-6, 1e-6, 1e-6]),
    ...compareBounds(`${id}:open`, open, openSize, [1e-6, 1e-6, 1e-6]),
  ];
};

/** Resolve families whose occupancy dimensions are functions of placement inputs. */
const parameterFamilyRows = (id: string, body: string) => {
  const line = body.match(/점유 상자는[^\n]*/)?.[0] ?? "";
  if (!/[×]/.test(line) || !/(?:길이×|L\/cos|유효 폭|벽 두께)/.test(line)) return null;
  const fail = () => [{ id, part: "all", axis: "XYZ", kind: "unresolved parameter family",
    box: NaN, union: NaN, pass: false }];
  const parts = modelParts(body);
  if (/길이×/.test(line)) {
    const section = body.match(/단면은 폭 ([\d.]+)m·깊이 ([\d.]+)m/);
    const box = line.match(/길이×([\d.]+)×([\d.]+)m/);
    const lengths = [...body.matchAll(/(?:약 |길이\()([\d.]+)m/g)].map((m) => Number(m[1]))
      .filter((length) => length > 1);
    if (!section || !box || !lengths.length || parts.length !== 1) return fail();
    const [width, depth] = section.slice(1).map(Number);
    return lengths.map((length, index) => compareBounds(`${id}:length-${index + 1}`,
      { [parts[0].key]: prism([-length / 2, length / 2], [0, depth], [-width / 2, width / 2]) },
      [length, Number(box[1]), Number(box[2])], [1e-6, 1e-6, 1e-6])).flat();
  }
  if (/L\/cos/.test(line)) {
    const section = body.match(/단면은 폭 ([\d.]+)m·깊이 ([\d.]+)m/);
    const box = line.match(/([\d.]+)×([\d.]+)×\(L\/cos\(α\)\+([\d.]+)tan\(α\)\)m/);
    const angles = [...new Set([...body.matchAll(/(\d+)°/g)].map((m) => Number(m[1])))]
      .filter((angle) => angle > 0 && angle < 90);
    if (!section || !box || !angles.length || parts.length !== 1) return fail();
    const [width, depth] = section.slice(1).map(Number);
    return angles.flatMap((degrees) => [1, 2].flatMap((length) => {
      const radians = degrees * Math.PI / 180;
      const extent = length / Math.cos(radians) + depth * Math.tan(radians);
      const claimed = length / Math.cos(radians) + Number(box[3]) * Math.tan(radians);
      return compareBounds(`${id}:L${length}-a${degrees}`,
        { [parts[0].key]: prism([-width / 2, width / 2], [0, depth], [0, extent]) },
        [Number(box[1]), Number(box[2]), claimed], [1e-6, 1e-6, 1e-6]);
    }));
  }
  if (/유효 폭|벽 두께/.test(line)) {
    const aperture = body.match(/유효 ([\d.]+)×([\d.]+)m/);
    const lining = body.match(/(?:각 가장자리|안감 네 조각은 폭) ([\d.]+)m/);
    const surround = body.match(/(?:테\(폭 |외부 면에만 폭 )([\d.]+)m/);
    const projection = body.match(/(?:벽면에서 |돌출 )([\d.]+)m 돌출|돌출 ([\d.]+)m의 테/);
    const box = line.match(/(?:\(유효 폭\+([\d.]+)m\)|([\d.]+))×(?:\(유효 높이\+([\d.]+)m\)|([\d.]+))×\(벽 두께\+([\d.]+)m?\)/);
    const liningPart = parts.find(({ noun }) => noun === "안감");
    const rimPart = parts.find(({ noun }) => noun === "테");
    const frameWidth = Number(lining?.[1]), rim = Number(surround?.[1]);
    const project = Number(projection?.[1] ?? projection?.[2]);
    if (!liningPart || !rimPart || !box || !Number.isFinite(frameWidth) || !Number.isFinite(rim) ||
      !Number.isFinite(project)) return fail();
    const samples = aperture ? [[Number(aperture[1]), Number(aperture[2]), .3],
      [Number(aperture[1]), Number(aperture[2]), .6]] : [[1, 2.2, .3], [1.2, 2.3, .6]];
    return samples.flatMap(([width, height, wall]) => {
      const outerX = width / 2 + frameWidth + rim;
      const aroundAll = /안감 네 조각/.test(body);
      const outerY = height + (aroundAll ? 2 : 1) * (frameWidth + rim);
      const bothSides = /벽 양면/.test(body);
      const partsBounds = {
        [liningPart.key]: prism([-width / 2 - frameWidth, width / 2 + frameWidth],
          [0, height + (aroundAll ? 2 : 1) * frameWidth], [-wall / 2, wall / 2]),
        [rimPart.key]: prism([-outerX, outerX], [0, outerY],
          [-wall / 2 - (bothSides ? project : 0), wall / 2 + project]),
      };
      const claimed = [Number(box[1] ?? box[2]) + (box[1] ? width : 0),
        Number(box[3] ?? box[4]) + (box[3] ? height : 0), wall + Number(box[5])];
      return compareBounds(`${id}:w${width}-h${height}-d${wall}`, partsBounds, claimed,
        [1e-6, 1e-6, 1e-6]);
    });
  }
  return fail();
};

/** Each recoverable part must fit; if all parts resolve, their union must fill. */
export const occupancyUnionRows = (id: string, body: string) => {
  const rolled = rolledSheetRows(id, body);
  if (rolled) return rolled;
  const parameterFamily = parameterFamilyRows(id, body);
  if (parameterFamily) return parameterFamily;
  const prose = body.split(/^부재 대응:/m)[0].replace(/<!--[\s\S]*?-->/g, "");
  const hasBox = /점유 상자/.test(prose);
  if (!hasBox) return [];
  if (!modelParts(body).length) return [];
  const boxLine = prose.slice(prose.indexOf("점유 상자는")).split("\n")[0];
  let match = boxLine.match(/([\d.]+)×(?:약 )?([\d.]+)×([\d.]+)m/);
  const symbolicBox = boxLine.match(/([\d.]+)×([A-Za-z])×([\d.]+)m/);
  if (!match && symbolicBox) {
    const assignment = prose.match(new RegExp("\\b" + symbolicBox[2] + "=([^m\\n]+)m"))?.[1];
    const parameter = assignment?.match(/=([\d.]+)$/)?.[1] ?? assignment?.match(/^([\d.]+)/)?.[1];
    if (parameter) match = [symbolicBox[0], symbolicBox[1], parameter, symbolicBox[3]];
  }
  if (!match && /폭×높이×깊이/.test(boxLine)) {
    const dimensions = prose.match(/폭 ([\d.]+)m·깊이 ([\d.]+)m·높이 ([\d.]+)m/);
    if (dimensions) match = [dimensions[0], dimensions[1], dimensions[3], dimensions[2]];
  }
  if (!match) {
    const ranges = boxLine.match(/X ([+−-]?[\d.]+)~([+−-]?[\d.]+)m, Y ([+−-]?[\d.]+)~([+−-]?[\d.]+)m, Z ([+−-]?[\d.]+)~([+−-]?[\d.]+)m/);
    if (ranges) match = [ranges[0], String(scalar(ranges[2]) - scalar(ranges[1])),
      String(scalar(ranges[4]) - scalar(ranges[3])), String(scalar(ranges[6]) - scalar(ranges[5]))];
  }
  if (!match) return [{ id, part: "all", axis: "XYZ", kind: "unresolved box grammar", box: NaN, union: NaN, pass: false }];
  const box = match.slice(1).map(Number);
  const tolerance = boxLine.includes("약")
    ? match.slice(1).map((value) => 0.5 * 10 ** -(value.split(".")[1]?.length ?? 0) + 1e-6)
    : [1e-6, 1e-6, 1e-6];
  const ground = /원점[^.\n]*(?:바닥|지면|아래면)/.test(body);
  const backOrigin = /원점[^.\n]*뒷변/.test(body) && /앞은[^.\n]*\+Z/.test(body);
  const width = Number(body.match(/기본 폭 W=([\d.]+)m/)?.[1]);
  // A variant paragraph can state several boxes. The first box governs only
  // the construction before the second named variant begins.
  const lineEnd = body.indexOf("\n", body.indexOf(match[0]));
  const boxSentence = body.slice(body.indexOf(match[0]), lineEnd < 0 ? undefined : lineEnd);
  const nextVariant = boxSentence.match(/,\s*([가-힣 ]+?)\s+[\d.]+×/);
  let construction = body;
  if (nextVariant) {
    const beforeBox = body.slice(0, match.index);
    const variant = new RegExp("(?:^|[.!?]\\s+)[^\\n]*?" + escape(nextVariant[1].trim()) + "(?:은|는)", "gm").exec(beforeBox);
    const mapping = body.match(/^부재 대응:.*$/m)?.[0] ?? "";
    if (variant && mapping) construction = beforeBox.slice(0, variant.index) + "\n" + mapping;
  }
  if (/\bA [\d.]+×/.test(boxLine) && /\bB [\d.]+×/.test(boxLine) && !/벽 바닥(?:은|이) X=±/.test(prose)) {
    const marker = prose.search(/변형 B는|\bB는/);
    const mapping = body.match(/^부재 대응:.*$/m)?.[0] ?? "";
    if (marker >= 0 && mapping) construction = prose.slice(0, marker) + "\n" + mapping;
  }
  const parts = partBounds(construction, width);
  const zeroSurfaces = new Set(Object.keys(parts).filter((part) =>
    new RegExp("`" + escape(part) + "`[^\\n]*두께 없는 면").test(construction)));
  const rows = compareBounds(id, parts, box, tolerance, {
    ground, backOrigin, conservative: /여유 있게 감싸는/.test(boxLine), zeroSurfaces,
  });
  const second = boxLine.match(/\bB ([\d.]+×[\d.]+×[\d.]+m)/);
  if (second && /벽 바닥(?:은|이) X=±/.test(prose)) {
    const start = body.indexOf("변형 B는");
    const end = body.indexOf("부재 대응:");
    const mapping = body.slice(end).split("\n")[0];
    if (start >= 0 && end > start) {
      const source = body.slice(start, end).replace(/점유 상자는 A [^\n]+/,
        `점유 상자는 ${second[1]}다.`);
      rows.push(...occupancyUnionRows(`${id}:B`, `${source}\n${mapping}`));
    }
  }
  return rows;
};
