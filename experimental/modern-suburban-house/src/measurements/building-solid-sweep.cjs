/** Compares authored model solids and their stated contacts with emitted
 * spaces solids. A dimension without a corresponding measured contact fails. */
const fs = require("node:fs");
const path = require("node:path");
require(require.resolve("tsx/cjs"));
const { buildHouse } = require("../spaces/house.ts");

const directory = process.env.MODEL_DOCS_DIR || path.resolve(__dirname, "../../docs/models");
const number = "([−-]?\\d+(?:\\.\\d+)?)";
/** @param {string} value */
const n = (value) => Number(value.replace("−", "-"));
/** @param {string} text @param {RegExp} pattern @param {string} label */
function values(text, pattern, label) {
  const match = pattern.exec(text);
  if (!match) throw Error(`missing ${label}`);
  return match.slice(1).map(n);
}
/** @param {number[]} positions */
function bounds(positions) {
  const b = [[Infinity, -Infinity], [Infinity, -Infinity], [Infinity, -Infinity]];
  for (let i = 0; i < positions.length; i += 3) for (let a = 0; a < 3; a++) {
    b[a][0] = Math.min(b[a][0], positions[i + a]);
    b[a][1] = Math.max(b[a][1], positions[i + a]);
  }
  return { x: b[0], y: b[1], z: b[2] };
}
/** @param {number[]} a @param {number[]} b */
const overlap = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
/** @param {string} file @param {string} anchor */
function section(file, anchor) {
  const source = fs.readFileSync(path.join(directory, file), "utf8");
  const h2 = source.split(/^## /m).find((part) => part.split("\n", 1)[0].includes(`{#${anchor}}`));
  if (!h2) throw Error(`missing model H2 ${file}#${anchor}`);
  return h2.replace(/<!--[\s\S]*?-->/g, "");
}
/** @param {{role:string;mesh:{positions:number[]}}[]} parts */
function scan(parts) {
  const failures = [];
  const boxes = parts.map((part) => ({ role: part.role, box: bounds(part.mesh.positions) }));
  let contacts = 0, balusters = 0, depthAssertions = 0, glassSolids = 0, axisWitnesses = 0, handleProjections = 0;

  // Rectangular exterior plates must actually meet the structural weather face.
  for (const file of ["02-exterior-doors.md"]) {
    const source = fs.readFileSync(path.join(directory, file), "utf8");
    for (const h2 of source.split(/^## /m).slice(1)) {
      const body = h2.replace(/<!--[\s\S]*?-->/g, "");
      const plate = body.slice(body.indexOf("`exterior-trim`은 구조 날씨 면"));
      if (!body.includes("`exterior-trim`은 구조 날씨 면") || !plate.includes("Z=[")) continue;
      const [x0, x1, x2, x3] = values(plate, new RegExp(`X=\\[${number},${number}\\]·\\[${number},${number}\\] m`), "exterior plate ends");
      const [y0, y1, z0, z1] = values(plate, new RegExp(`Y=\\[${number},${number}\\] m, Z=\\[${number},${number}\\] m`), "exterior plate section");
      for (const x of [[x0, x1], [x2, x3]]) {
        const possible = boxes.filter((part) => part.role === "wall" && overlap(part.box.x, x) > 0.01 && overlap(part.box.y, [y0, y1]) > 0.1);
        const gap = Math.min(...possible.map((part) => Math.abs(part.box.z[1] - z0)));
        contacts++;
        if (!Number.isFinite(gap) || gap > 0.001) failures.push(`exterior plate back face floats ${gap.toFixed(4)} m from structural wall`);
        if (z1 <= z0) failures.push("exterior plate has no outward thickness");
      }
    }
  }

  // For every exterior leaf whose jambs meet a separately owned threshold,
  // compare its authored start with the emitted floor solid under that opening.
  const exteriorDoors = fs.readFileSync(path.join(directory, "02-exterior-doors.md"), "utf8");
  for (const h2 of exteriorDoors.split(/^## /m).slice(1)) {
    const body = h2.replace(/<!--[\s\S]*?-->/g, "");
    if (!body.includes("문턱 상면") || !body.includes("세로 문설주")) continue;
    const [openingX0, openingX1] = values(body, new RegExp(`(?:거친 개구부\\s*)?X\\s*=\\s*\\[${number},\\s*${number}\\]`), "exterior door opening interval");
    const jamb = /세로 문설주[^\n]{0,220}/.exec(body)?.[0];
    if (!jamb) throw Error("missing vertical jamb statement");
    const [jamb0] = values(jamb, new RegExp(`Y\\s*=\\s*(?:\\[)?${number}`), "jamb start height");
    const threshold = boxes.filter((part) => part.role === "floor" && part.box.x[0] <= openingX0 + 1e-6 && part.box.x[1] >= openingX1 - 1e-6 && part.box.y[1] > 0 && part.box.y[1] < 0.1)
      .sort((a, b) => b.box.y[1] - a.box.y[1])[0];
    if (!threshold) throw Error("missing reviewed threshold solid");
    contacts++;
    if (Math.abs(jamb0 - threshold.box.y[1]) > 1e-4)
      failures.push(`jamb bottom ${jamb0} misses threshold top ${threshold.box.y[1]}`);
  }

  // Nosing-relative vertical members stop before the nearest wall begins.
  const stair = section("04-stair-members.md", "stair-balusters");
  const [firstJ, lastJ] = values(stair, /디딤 j=(\d+)…(\d+)은/, "vertical-member tread population");
  const [firstK, lastK] = values(stair, /중심은 k=(\d+)…(\d+)에/, "vertical-member count per tread");
  const [firstX, stepX] = values(stair, new RegExp(`a_j=${number}\\+${number}\\(j−1\\) m`), "tread X progression");
  const [firstOffset, pitch] = values(stair, new RegExp(`X=a_j\\+${number}\\+${number}k m`), "vertical-member placement");
  const [halfWidth] = values(stair, new RegExp(`X=\\[중심−${number},중심\\+${number}\\]`), "vertical-member half width");
  const [, zHigh] = values(stair, new RegExp(`Z=\\[${number},${number}\\] m다`), "vertical-member depth interval");
  const topLine = stair.split("\n").find((line) => line.includes("아래 Y=h_j, 위 Y="));
  if (!topLine) throw Error("missing vertical-member top rule");
  const cap = /위 Y=min\(([^,]+),/.exec(topLine)?.[1];
  const capHeight = cap === undefined ? Infinity : n(cap);
  const xInterval = [firstX, firstX + stepX * lastJ];
  const wall = boxes.filter((part) => part.role === "floor" && part.box.y[0] > 2.5 && overlap(part.box.x, xInterval) > 1 && part.box.z[0] >= zHigh && part.box.z[0] - zHigh < 0.05)
    .sort((a, b) => a.box.y[0] - b.box.y[0])[0];
  if (!wall) throw Error("missing reviewed stair edge wall solid");
  const [topStart, xOffset, topRise, topRun, topBelow] = values(topLine, new RegExp(`위 Y=(?:min\\([^,]+, )?${number}\\+\\(X\\+${number}\\)×${number}\\/${number}−${number}`), "sloping top rule");
  for (let j = firstJ; j <= lastJ; j++) for (let k = firstK; k <= lastK; k++) {
    const x = firstX + stepX * (j - 1) + firstOffset + pitch * k;
    const freeTop = topStart + (x + xOffset) * topRise / topRun - topBelow;
    const actualTop = Math.min(capHeight, freeTop);
    balusters++;
    if (overlap([x - halfWidth, x + halfWidth], wall.box.x) > 0 && wall.box.z[0] - zHigh < 0.05 && actualTop > wall.box.y[0] + 1e-5)
      failures.push(`vertical member at X=${x.toFixed(3)} passes wall start by ${(actualTop - wall.box.y[0]).toFixed(4)} m`);
  }

  // Compare each stated depth relationship with the authored intervals. A
  // placement word cannot override inconsistent numeric margins or midpoints.
  const windows = fs.readFileSync(path.join(directory, "01-windows.md"), "utf8");
  const [frameLo, frameHi] = values(windows, new RegExp(`frame Z=\\[${number},${number}\\]`), "window frame depth");
  for (const h2 of windows.split(/^## /m).slice(1)) {
    const body = h2.replace(/<!--[\s\S]*?-->/g, "");
    const centred = /sash[^\n]{0,100}frame 깊이[^\n]{0,30}(?:가운데|중앙)/.test(body);
    const margins = new RegExp(`날씨 쪽 여백 ${number} m·실내 쪽 여백 ${number} m`).exec(body);
    if (!centred && !margins) continue;
    const [sashLo, sashHi] = values(body, new RegExp(`sash[^\n]*?Z=\\[${number},${number}\\]`), "sash depth");
    if (centred) {
      depthAssertions++;
      if (Math.abs((sashLo + sashHi) - (frameLo + frameHi)) > 1e-6)
        failures.push("sash depth contradicts stated centered placement");
    }
    if (margins) {
      depthAssertions += 2;
      if (Math.abs(frameHi - sashHi - n(margins[1])) > 1e-6)
        failures.push("weather-side sash margin contradicts authored depth");
      if (Math.abs(sashLo - frameLo - n(margins[2])) > 1e-6)
        failures.push("interior-side sash margin contradicts authored depth");
    }
  }

  // A glass infill stated as an X/Y panel must carry a real thickness and fit
  // within the surrounding sash, rather than leave depth for source code.
  for (const chunk of exteriorDoors.split(/^## /m).slice(1)) {
    const body = chunk.replace(/<!--[\s\S]*?-->/g, "");
    for (const sentence of body.split(/(?<=다\.)\s+/)) {
      if (!sentence.includes("`muntin`") || !sentence.includes("X=[") || !sentence.includes("Y=[")) continue;
      axisWitnesses++;
      if (!sentence.includes("Z=[")) failures.push("muntin has plan/elevation extents without authored depth");
    }
    const sentence = /각 `glass`는([^\n]*?판이다\.)/.exec(body)?.[1];
    if (!sentence || !sentence.includes("X=[") || !sentence.includes("Y=[")) continue;
    const depth = new RegExp(`Z=\\[${number},${number}\\] m`).exec(sentence);
    if (!depth) {
      failures.push("glass panel has X/Y extents without an authored depth interval");
      continue;
    }
    const [glassZ0, glassZ1] = depth.slice(1).map(n);
    const sashText = /`sash`는[^\n]*?`glass`는/.exec(body)?.[0];
    if (!sashText) throw Error("glass panel has no local sash context");
    const [sashZ0, sashZ1] = values(sashText, new RegExp(`Z=\\[${number},${number}\\] m`), "sash depth");
    glassSolids++;
    if (!(sashZ0 <= glassZ0 && glassZ0 < glassZ1 && glassZ1 <= sashZ1))
      failures.push("glass depth escapes sash solid");
  }

  // Every outward round-handle projection in the instance table must be
  // obtainable from an authored plate thickness and sphere diameter.
  const interior = section("03-interior-doors.md", "interior-door-members") + "\n" + section("03-interior-doors.md", "interior-door-hinges");
  const supported = new Set([0]);
  for (const match of interior.matchAll(new RegExp(`원판 두께 ${number} m, 구형 knob 지름 ${number} m`, "g"))) supported.add(Number((n(match[1]) + n(match[2])).toFixed(3)));
  for (const match of interior.matchAll(new RegExp(`두께 ${number} m·지름 ${number} m 받침 원판과 지름 ${number} m 구형 knob`, "g"))) supported.add(Number((n(match[1]) + n(match[3])).toFixed(3)));
  for (const row of interior.split("\n")) {
    const match = /^\| `[^`]+` \| [^|]+ \| [^|]+ \| ([0-9.]+) \|/.exec(row);
    if (!match) continue;
    handleProjections++;
    if (!supported.has(Number(match[1]))) failures.push(`door handle projection ${match[1]} m has no matching plate/sphere solid`);
  }
  return { contacts, balusters, depthAssertions, glassSolids, axisWitnesses, handleProjections, failures };
}
if (require.main === module) {
  try {
    const result = scan(buildHouse().parts);
    console.log(JSON.stringify(result));
    if (result.failures.length) process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
module.exports = { scan };
