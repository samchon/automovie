/** How deep is a crossing, and which way is out.
 *
 * The corrective solver pushes a crossed vertex to the nearest point of the
 * surface it has entered, along that surface's normal. Whether that is the way
 * out depends on how deep the vertex is: a lip vertex a millimetre into the
 * labial face of an incisor is nearest to that face and leaves by it, but one
 * four millimetres in is nearer the lingual face and is pushed into the mouth,
 * where it is still inside the mouth and now behind the teeth. So before the
 * budget is blamed for a pair the solver cannot clear, this asks of each
 * crossed vertex how far it is from the nearest firm surface, whether that
 * surface's normal agrees with the vertex's own outward normal, and how far
 * the vertex would have to travel along its own normal to leave the firm
 * surface entirely.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-crossing-depth.ts <channel[+channel]> [...]
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

const pairs = process.argv.slice(2).filter((one) => !one.startsWith("--"));
if (pairs.length === 0) throw new Error("name at least one channel+channel");

const sub = (a: number[], b: number[]) => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const dot = (a: number[], b: number[]) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Signed distance along a ray to a triangle, or null when it misses. */
const rayHits = (
  origin: number[],
  direction: number[],
  tri: number[][],
): number | null => {
  const e1 = sub(tri[1], tri[0]);
  const e2 = sub(tri[2], tri[0]);
  const p = cross(direction, e2);
  const det = dot(e1, p);
  if (Math.abs(det) < 1e-15) return null;
  const inv = 1 / det;
  const s = sub(origin, tri[0]);
  const u = dot(s, p) * inv;
  if (u < 0 || u > 1) return null;
  const q = cross(s, e1);
  const v = dot(direction, q) * inv;
  if (v < 0 || u + v > 1) return null;
  return dot(e2, q) * inv;
};

const trianglesOf = (mesh: IAutoMovieMesh) => {
  const rows = mesh.indices!;
  const out: number[][][] = [];
  for (let at = 0; at < rows.length; at += 3)
    out.push(
      [rows[at], rows[at + 1], rows[at + 2]].map((row) =>
        [0, 1, 2].map((k) => mesh.positions[row * 3 + k]),
      ),
    );
  return out;
};

for (const pair of pairs) {
  const document: IAutoMovieHumanFaceBasisDocument = {
    id: "neutral",
    name: "neutral",
    basis: basis.id,
    shape: {},
    expression: Object.fromEntries(pair.split("+").map((one) => [one, 1])),
  };
  const parts = new Map<string, IAutoMovieMesh>();
  for (const part of build(document).parts)
    parts.set(
      part.id,
      (part.geometry as { type: "mesh"; mesh: IAutoMovieMesh }).mesh,
    );
  const teeth = parts.get("Human.teeth_base/Human.teeth_base")!;
  const firm = trianglesOf(teeth);
  for (const soft of ["Human/lips", "Human/skin"]) {
    const mesh = parts.get(soft)!;
    const rows = mesh.indices!;
    const hit = new Set<number>();
    for (const crossing of measureAutoMovieMeshCrossings(mesh, teeth))
      for (let c = 0; c < 3; c++) hit.add(rows[crossing.triangle * 3 + c]);
    if (hit.size === 0) continue;
    const exits: number[] = [];
    let agree = 0;
    const nearestMm: number[] = [];
    for (const vertex of hit) {
      const point = [0, 1, 2].map((k) => mesh.positions[vertex * 3 + k]);
      const normal = [0, 1, 2].map((k) => mesh.normals![vertex * 3 + k]);
      // Travel along the vertex's own outward normal until the last exit from
      // the teeth: the outermost hit in front of it.
      let last = 0;
      for (const tri of firm) {
        const t = rayHits(point, normal, tri);
        if (t !== null && t > last) last = t;
      }
      exits.push(last * 1000);
      // Nearest firm triangle by its plane, and whether its normal faces the
      // same way as the vertex's own.
      let nearest = Infinity;
      let nearestNormal = [0, 0, 0];
      for (const tri of firm) {
        const n = cross(sub(tri[1], tri[0]), sub(tri[2], tri[0]));
        const size = Math.hypot(n[0], n[1], n[2]);
        if (size === 0) continue;
        const centroid = [0, 1, 2].map(
          (k) => (tri[0][k] + tri[1][k] + tri[2][k]) / 3,
        );
        const d = Math.hypot(...sub(point, centroid));
        if (d < nearest) {
          nearest = d;
          nearestNormal = n.map((one) => one / size);
        }
      }
      nearestMm.push(nearest * 1000);
      if (dot(nearestNormal, normal) > 0) agree++;
    }
    exits.sort((x, y) => x - y);
    nearestMm.sort((x, y) => x - y);
    const q = (list: number[], f: number) =>
      list[Math.min(list.length - 1, Math.floor(f * list.length))];
    console.log(
      `${pair.padEnd(34)} ${soft.padEnd(12)} crossed ${String(hit.size).padStart(4)}` +
        `  exit along own normal mm: median ${q(exits, 0.5).toFixed(2)} p90 ${q(exits, 0.9).toFixed(2)} max ${exits[exits.length - 1].toFixed(2)}` +
        `  (${exits.filter((one) => one === 0).length} never exit)` +
        `  nearest-face normal agrees ${agree}/${hit.size}` +
        `  nearest centroid mm median ${q(nearestMm, 0.5).toFixed(2)}`,
    );
  }
}
