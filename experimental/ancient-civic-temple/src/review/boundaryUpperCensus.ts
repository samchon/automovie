import { Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import type { RoofPatch } from "../geometry/RoofPatch";
import { BoundaryUpperRow } from "./BoundaryUpperRow";
import { localUpperBand } from "./localUpperBand";
import { cap } from "./cap";

const hostTopAt = (outline: readonly { x: number; y: number; }[], u: number): number | null => {
  const hits = outline.flatMap((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    if (Math.abs(a.x - b.x) < 1e-9 || u < Math.min(a.x, b.x) || u > Math.max(a.x, b.x)) return [];
    return [a.y + (u - a.x) * (b.y - a.y) / (b.x - a.x)];
  });
  return hits.length === 0 ? null : Math.max(...hits);
};
/** A two-space boundary fails when its host rises above one side's cap into the other side's volume. */

export const boundaryUpperCensus = (environment: IAutoMovieBuiltEnvironment, roof: readonly RoofPatch[]): BoundaryUpperRow[] => environment.boundaries.map((boundary) => {
  const face = boundary.face;
  if (face === undefined || boundary.spaces.length !== 2) return { id: boundary.id, sampled: 0, tested: 0, exposed: 0, maxBand: 0, maxAt: null };
  const [first, second] = boundary.spaces.map((id) => environment.spaces.find((space) => space.id === id));
  if (first === undefined || second === undefined) throw new Error(`boundary ${boundary.id}: missing adjacent space`);
  const min = Math.min(...face.outline.map((point) => point.x));
  const max = Math.max(...face.outline.map((point) => point.x));
  const normal = Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 });
  const samples: Array<{ u: number; top: number; first: { physical: number; volume: number; }; second: { physical: number; volume: number; }; }> = [];
  let exposed = 0;
  let maxBand = 0;
  let maxAt: BoundaryUpperRow["maxAt"] = null;
  const count = Math.max(41, Math.ceil((max - min) / 0.01));
  for (let i = 0; i < count; i++) {
    const u = min + (max - min) * (i + 0.5) / count;
    const top = hostTopAt(face.outline, u);
    if (top === null) continue;
    const along = Quaternion.rotateVector(face.rotation, { x: u, y: 0, z: 0 });
    const center: IAutoMovieVector3 = { x: face.origin.x + along.x, y: 0, z: face.origin.z + along.z };
    const distance = face.thickness / 2 + 0.08;
    const plus = { x: center.x + normal.x * distance, z: center.z + normal.z * distance };
    const minus = { x: center.x - normal.x * distance, z: center.z - normal.z * distance };
    const a = cap(first, plus.x, plus.z, roof) ?? cap(first, minus.x, minus.z, roof);
    const b = cap(second, plus.x, plus.z, roof) ?? cap(second, minus.x, minus.z, roof);
    if (a === null || b === null) continue;
    samples.push({ u, top, first: a, second: b });
  }
  if (samples.length === 0) throw new Error(`boundary ${boundary.id}: no adjacent-volume stations on two-space host`);
  for (const { u, top, first, second } of samples) {
    const band = localUpperBand(top, first, second);
    if (band > 0.02) {
      exposed++;
      if (band > maxBand) {
        maxBand = band;
        maxAt = { u, hostTop: top, firstCap: first.physical, secondCap: second.physical };
      }
    }
  }
  return { id: boundary.id, sampled: count, tested: samples.length, exposed, maxBand, maxAt };
});
