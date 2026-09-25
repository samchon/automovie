import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** @param {string} body @param {RegExp} pattern @param {number} [group] */
const n = (body, pattern, group = 1) => {
  const match = body.match(pattern);
  assert.ok(match, `missing design datum ${pattern}`);
  return Number(match[group]);
};
/** @param {string} file */
const diskSource = (file) => readFileSync(new URL(`../../docs/models/${file}.md`, import.meta.url), "utf8");
/** @param {(file:string)=>string} read @param {string} file @param {string} anchor */
const h2 = (read, file, anchor) => {
  const block = read(file).split(/^## /m).find((section) => section.split("\n", 1)[0].includes(`{#${anchor}}`));
  assert.ok(block, `${file}#${anchor}`);
  return block.replace(/<!--[\s\S]*?-->/g, "");
};

/**
 * Check geometry claims outside the contact-word census. Each expression reads
 * authored defining inputs and compares them to another independently authored
 * bound or interface, so changing a definition is observable.
 * @param {(file:string)=>string} [read]
 * @returns {string[]}
 */
export const modelGeometryFailures = (read = diskSource) => {
  /** @type {string[]} */
  const failures = [];
  /** @param {string} label @param {()=>boolean} condition */
  const check = (label, condition) => {
    try { if (!condition()) failures.push(label); }
    catch (error) { failures.push(`${label}: ${String(error)}`); }
  };
  const fountain = h2(read, "fixtures", "fountain");
  check("fountain ripple clears its pedestal from the defining centre and width", () => {
    const centre = n(fountain, /중심선 반지름 ([\d.]+)m의 낮은 파문/);
    const width = n(fountain, /파문 단면은 수평 폭 ([\d.]+)m/);
    const pedestal = n(fountain, /노즐 받침은 반지름 ([\d.]+)m/);
    const statedInner = n(fountain, /파문 안쪽 반지름 ([\d.]+)m/);
    return Math.abs(statedInner - (centre - width / 2)) < 1e-6 && centre - width / 2 > pedestal;
  });
  check("fountain jet starts at nozzle top", () => {
    const floor = n(fountain, /안쪽 바닥은 바닥 위 ([\d.]+)m/);
    const water = n(fountain, /물면은[^\n]*?바닥 위 ([\d.]+)m/);
    const above = n(fountain, /노즐 받침은[^\n]*?물면 위 ([\d.]+)m/);
    const jet = n(fountain, /물줄기는 노즐 윗면 Y=([\d.]+)m에서/);
    return floor < water && Math.abs(jet - (water + above)) < 1e-6;
  });
  const porch = h2(read, "entablature", "porch-entablature");
  check("porch cornice projection fits declared depth", () => {
    const beam = n(porch, /앞뒤 폭 ([\d.]+)m/);
    const projection = n(porch, /수평 코니스는[^\n]*?\+Z로 ([\d.]+)m 돌출/);
    const bound = n(porch, /상자는 [\d.]+×약 [\d.]+×([\d.]+)m/);
    return Math.abs(bound - beam - projection) < 1e-6;
  });
  const niche = h2(read, "fixtures", "niche");
  check("niche body, plinth and cap fit depth bound", () => {
    const base = n(niche, /받침은 폭 [\d.]+m·깊이 ([\d.]+)m/);
    const body = n(niche, /몸체는 폭 [\d.]+m·깊이 ([\d.]+)m/);
    const cap = n(niche, /꼭대기에는 폭 [\d.]+m·깊이 ([\d.]+)m/);
    const bound = n(niche, /점유 상자는 [\d.]+×[\d.]+×([\d.]+)m/);
    return Math.abs(Math.max(base, body, cap) - bound) < 1e-6;
  });
  const basket = h2(read, "wares", "basket");
  check("basket slat and rim fit radial occupancy", () => {
    const topRadius = n(basket, /위 ([\d.]+)m, 벽 두께/);
    const slat = n(basket, /바깥 돌출은 ([\d.]+)m, 높이 범위/);
    const rimTube = n(basket, /관 반지름 ([\d.]+)m인 원환/);
    const width = n(basket, /점유 상자는 ([\d.]+)×/);
    return Math.max(topRadius + slat, topRadius + rimTube) <= width / 2 + 1e-6;
  });
  const lamp = h2(read, "fixtures", "lampstand");
  check("lamp stem nodes remain below cup", () => {
    const node = n(lamp, /Y=[\d.]+m와 ([\d.]+)m/);
    const nodeHeight = n(lamp, /높이 ([\d.]+)m 원통이다/);
    const cup = n(lamp, /바닥 Y=([\d.]+)m·바닥 두께/);
    return node + nodeHeight / 2 < cup;
  });
  const display = h2(read, "fixtures", "display-shelf");
  check("display shelf highest board closes at declared height", () => {
    const underside = n(display, /Y=0\.10m·0\.55m·1\.00m·([\d.]+)m/);
    const board = n(display, /두께 ([\d.]+)m인 선반 판 네 장/);
    const height = n(display, /폭 [\d.]+m·깊이 [\d.]+m·높이 ([\d.]+)m/);
    return Math.abs(underside + board - height) < 1e-6;
  });
  const scroll = h2(read, "wares", "scroll");
  check("open scroll roll uses its defining radius at the sheet tangent", () => {
    const radius = n(scroll, /말린 끝은 X축 반지름 ([\d.]+)m/);
    const sheetTop = n(scroll, /두께 ([\d.]+)m 판으로/);
    const formula = scroll.match(/\(Y,Z\)=\(([\d.]+),±\(([\d.]+)\+√\(([\d.]+)²−([\d.]+)²\)\)\)/);
    assert.ok(formula, "scroll centre expression");
    const [, centreY, , formulaRadius, vertical] = formula.map(Number);
    const distance = Math.hypot(centreY - sheetTop, Math.sqrt(formulaRadius ** 2 - vertical ** 2));
    return Number.isFinite(distance) && Math.abs(distance - radius) < 1e-6;
  });
  const ridge = h2(read, "cladding", "ridge-tile");
  check("east ridge nose clears coping from defining radius", () => {
    const rise = n(ridge, /Y0=([\d.]+)m\/cos\(α\)/);
    const foot = n(ridge, /cos\(α\)−([\d.]+)m×tan\(α\)/);
    const radius = n(ridge, /겹침 코는 바깥 반지름 ([\d.]+)m/);
    const slab = n(ridge, /slab 용마루 상면 약 ([\d.]+)m에 19°/);
    const coping = n(ridge, /코핑 아랫면 ([\d.]+)m까지/);
    const clearance = n(ridge, /([\d.]+)m 여유를 확보한다/);
    const angle = 19 * Math.PI / 180;
    return slab + rise / Math.cos(angle) - foot * Math.tan(angle) + radius <= coping - clearance + 1e-6;
  });
  const double = h2(read, "openings", "double-door-leaf");
  check("double hinge barrel rotates on axis outside stone lining", () => {
    const axisX = n(double, /회전축은 이 원점에서 X=\+([\d.]+)m·Z=0m/);
    const barrelX = n(double, /원통 중심은 회전축과 같은 X=\+([\d.]+)m·Z=0m/);
    const barrelRadius = n(double, /핀 경첩\(반지름 ([\d.]+)m/);
    const closedZMax = n(double, /Z=−[\d.]+~\+([\d.]+)m다/);
    const closedZMin = n(double, /Z=−([\d.]+)~\+[\d.]+m다/);
    const width = n(double, /door-entry`\(유효 ([\d.]+)×/);
    return Math.abs(axisX - barrelX) < 1e-6 && axisX - barrelRadius >= 0 &&
      axisX - closedZMax >= 0 && width - 2 * (axisX + closedZMin) >= 1.4;
  });
  const single = h2(read, "openings", "single-door-leaf");
  check("single hinge offset clears lining and leaves minimum passage", () => {
    const pivotZ = n(single, /축은 이 원점에서 X=0·Z=\+([\d.]+)m/);
    const maxZ = n(single, /Z=−[\d.]+~\+([\d.]+)m다/);
    const minZ = n(single, /Z=−([\d.]+)~\+[\d.]+m다/);
    const narrowestDoor = n(single, /door-administration`·`door-records`·`door-yard`\(([\d.]+)×/);
    return pivotZ - maxZ >= -1e-9 && narrowestDoor - (pivotZ + minZ) >= 0.9;
  });
  return failures;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const failures = modelGeometryFailures();
  console.log(`model geometry bounds: ${failures.length} failures`);
  for (const failure of failures) console.error(failure);
  process.exitCode = failures.length ? 1 : 0;
}
