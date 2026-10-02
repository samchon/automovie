import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { scalar, axes } = templeBoundSyntax;
/** Resolve ellipsoid crowns, branch endpoints and repeated leaf envelopes.
 * Runs after all clause measurements so relative supports use their resolved
 * heights. Mutates only the caller's bound map; no source or filesystem IO. */
export function completeTempleLandscapeBounds(context: ITemplePartBoundsContext): void {
  const { parts, result, construction } = context;
  const crown = parts.find(({ noun }) => noun === "수관");
  if (crown) {
        const ellipsoids: number[][] = [];
    for (const row of construction.matchAll(/\|[^|\n]+\|\s*\(([^)]+)\)\s*\|\s*\(([^)]+)\)\s*\|/g)) {
      const centre = row[1].split(",").map(scalar), half = row[2].split(",").map(scalar);
      if (centre.length === 3 && half.length === 3 && [...centre, ...half].every(Number.isFinite))
        ellipsoids.push([centre[0] - half[0], centre[0] + half[0],
          centre[1] - half[1], centre[1] + half[1], centre[2] - half[2], centre[2] + half[2]]);
    }
    if (!ellipsoids.length) for (const shape of construction.matchAll(/\(([+−-]?[\d.]+),([+−-]?[\d.]+),([+−-]?[\d.]+)\)m[,·]\s*(?:수평 )?반지름 ([\d.]+)m[,·]\s*(?:전체 )?높이 ([\d.]+)m/g)) {
      const [x, y, z] = shape.slice(1, 4).map(scalar), r = Number(shape[4]), h = Number(shape[5]) / 2;
      ellipsoids.push([x - r, x + r, y - h, y + h, z - r, z + r]);
    }
    if (ellipsoids.length) {
      result[crown.key].X = [Math.min(...ellipsoids.map((e) => e[0])), Math.max(...ellipsoids.map((e) => e[1]))];
      result[crown.key].Y = [Math.min(...ellipsoids.map((e) => e[2])), Math.max(...ellipsoids.map((e) => e[3]))];
      result[crown.key].Z = [Math.min(...ellipsoids.map((e) => e[4])), Math.max(...ellipsoids.map((e) => e[5]))];
    }
  }
  const branch = parts.find(({ noun }) => noun === "가지");
  const branchSource = construction.match(/반지름 ([\d.]+)m인 세 가지는[^\n]*?중심 \(([^)]+)\)m에서 각각 ([^\n]*?)로 뻗으며/);
  if (branch && branchSource) {
    const r = Number(branchSource[1]);
    const endpoints = [branchSource[2], ...[...branchSource[3].matchAll(/\(([^)]+)\)m/g)].map((m) => m[1])]
      .map((tuple) => tuple.split(",").map(scalar)).filter((tuple) => tuple.length === 3 && tuple.every(Number.isFinite));
    if (endpoints.length >= 2) for (let i = 0; i < 3; i++) {
      const axis = axes[i], values = endpoints.map((point) => point[i]);
      result[branch.key][axis] = [Math.min(...values) - r, Math.max(...values) + r];
    }
  }
  const fan = construction.match(/잎 너비는 `([\d.]+)\+([\d.]+)×\(i mod (\d+)\)`m/);
  const leaves = construction.match(/i는 0~(\d+)의 정수/);
  const baseRadius = construction.match(/바닥 중심은 원점에서 θ 방향 ([\d.]+)m/);
  const tipOffset = construction.match(/`([\d.]+)\+([\d.]+)×\(\(i mod (\d+)\)\/(\d+)\)`m/);
  const tipHeight = construction.match(/끝 높이는 `([\d.]+)\+([\d.]+)×\(\((\d+)i mod (\d+)\)\/(\d+)\)`m/);
  const blade = parts.find(({ noun }) => noun === "잎");
  if (fan && leaves && baseRadius && tipOffset && tipHeight && blade) {
    const count = Number(leaves[1]) + 1, base = Number(baseRadius[1]);
    const xs = [], zs = [], ys = [0];
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / count, c = Math.cos(theta), s = Math.sin(theta);
      const half = (Number(fan[1]) + Number(fan[2]) * (i % Number(fan[3]))) / 2;
      const tip = base + Number(tipOffset[1]) + Number(tipOffset[2]) *
        (i % Number(tipOffset[3])) / Number(tipOffset[4]);
      xs.push(base * c - half * s, base * c + half * s, tip * c);
      zs.push(base * s - half * c, base * s + half * c, tip * s);
      ys.push(Number(tipHeight[1]) + Number(tipHeight[2]) *
        ((Number(tipHeight[3]) * i) % Number(tipHeight[4])) / Number(tipHeight[5]));
    }
    result[blade.key].X = [Math.min(...xs), Math.max(...xs)];
    result[blade.key].Y = [0, Math.max(...ys)];
    result[blade.key].Z = [Math.min(...zs), Math.max(...zs)];
  }

}
