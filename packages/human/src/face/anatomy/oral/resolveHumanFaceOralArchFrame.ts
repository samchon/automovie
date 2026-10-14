import type { IHumanFaceOralArchFrame } from "./IHumanFaceOralArchFrame";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";
import { measureHumanFaceOralRingDistance } from "./measureHumanFaceOralRingDistance";

/**
 * Resolve one registered dental arch using vertical-residual regression through cervical-ring centres. The head-aligned regression and projected anterior axis are numerical source conventions, with singular systems refused. ISO identity orders stations without spatial reordering. Maxillary/mandibular apical signs retain declared handedness. The maximum nearest-ring distance at 65 uniform midline positions sets a sampled vault-width proxy, not a certified continuous maximum or clinical palatal measurement.
 *
 * @evidence contracts/common.md#principled-implementation Vertical-residual cervical-centre regression derives the arch plane and ISO order fixes station chronology.
 * @evidence contracts/common.md#clear-and-simple-design Declared lateral/forward/apical directions preserve maxillary/mandibular handedness instead of reordering axes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Head-aligned regression is a numerical source premise and singular systems refuse; 65 vault samples are a proxy rather than an exact continuous maximum.
 * @evidence contracts/common.md#meaningful-documentation Origin/stations use head or arch metres and directions are unit vectors; no tooth long axis is inferred.
 * @evidence contracts/performance.md#efficient-algorithms For C crowns and E cervical vertices, sorting costs O(C log C), centre/frame construction costs O(C + E), and 65 O(E) edge scans determine the vault proxy; returned stations occupy O(C + E) space.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved frame/station population serves all lining and assembly reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned vectors/station copies are owned and temporary regression arrays are call-local, with no cross-source frame cache.
 */
export function resolveHumanFaceOralArchFrame(
  members: readonly IHumanFaceOralCrown[],
  dental: readonly number[],
  mandibular: boolean,
): IHumanFaceOralArchFrame {
  if (members.length < 3)
    throw new Error("Oral arch frame needs at least three registered crowns.");
  const order: (crown: IHumanFaceOralCrown) => number = (
    crown: IHumanFaceOralCrown,
  ): number => {
    const quadrant: number = Number(crown.id[0]);
    const position: number = Number(crown.id[1]);
    return quadrant === 1 || quadrant === 4 ? -position : position;
  };
  const ordered: IHumanFaceOralCrown[] = [...members].sort(
    (a: IHumanFaceOralCrown, b: IHumanFaceOralCrown): number =>
      order(a) - order(b),
  );
  const point: (vertex: number) => number[] = (vertex: number): number[] => [
    dental[3 * vertex],
    dental[3 * vertex + 1],
    dental[3 * vertex + 2],
  ];
  const centres: number[][] = ordered.map(
    (crown: IHumanFaceOralCrown): number[] => {
      const ring: number[][] = crown.cervical.map(point);
      return [0, 1, 2].map(
        (axis: number): number =>
          ring.reduce((sum: number, p: number[]): number => sum + p[axis], 0) /
          ring.length,
      );
    },
  );
  const origin: number[] = [0, 1, 2].map(
    (axis: number): number =>
      centres.reduce((sum: number, p: number[]): number => sum + p[axis], 0) /
      centres.length,
  );
  // Centred normal equations of y = α + βx + γz.
  let xx: number = 0;
  let xz: number = 0;
  let zz: number = 0;
  let xy: number = 0;
  let zy: number = 0;
  for (const centre of centres) {
    const x: number = centre[0] - origin[0];
    const y: number = centre[1] - origin[1];
    const z: number = centre[2] - origin[2];
    xx += x * x;
    xz += x * z;
    zz += z * z;
    xy += x * y;
    zy += z * y;
  }
  const determinant: number = xx * zz - xz * xz;
  if (!(Math.abs(determinant) > Number.EPSILON * xx * zz))
    throw new Error("Oral arch ring centres do not span a plane.");
  const beta: number = (xy * zz - zy * xz) / determinant;
  const gamma: number = (zy * xx - xy * xz) / determinant;
  const unit: (vector: number[]) => number[] = (vector: number[]): number[] => {
    const length: number = Math.hypot(...vector);
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error("Oral arch frame has a degenerate direction.");
    return vector.map((value: number): number => value / length);
  };
  const normal: number[] = unit([-beta, 1, -gamma]);
  const forward: number[] = unit(
    [0, 0, 1].map(
      (value: number, axis: number): number => value - normal[2] * normal[axis],
    ),
  );
  const lateral: number[] = [
    normal[1] * forward[2] - normal[2] * forward[1],
    normal[2] * forward[0] - normal[0] * forward[2],
    normal[0] * forward[1] - normal[1] * forward[0],
  ];
  const apical: number[] = mandibular
    ? normal.map((value: number): number => -value)
    : normal;
  const local: (p: readonly number[]) => number[] = (
    p: readonly number[],
  ): number[] => {
    const delta: number[] = p.map(
      (value: number, axis: number): number => value - origin[axis],
    );
    const dot: (direction: readonly number[]) => number = (
      direction: readonly number[],
    ): number =>
      delta[0] * direction[0] +
      delta[1] * direction[1] +
      delta[2] * direction[2];
    return [dot(lateral), dot(forward), dot(apical)];
  };
  const stations: IHumanFaceOralToothStation[] = ordered.map(
    (
      crown: IHumanFaceOralCrown,
      at: number,
    ): {
      id:
        | "11"
        | "12"
        | "13"
        | "18"
        | "14"
        | "16"
        | "15"
        | "17"
        | "21"
        | "22"
        | "23"
        | "28"
        | "24"
        | "26"
        | "25"
        | "27"
        | "31"
        | "32"
        | "33"
        | "38"
        | "34"
        | "36"
        | "35"
        | "37"
        | "41"
        | "42"
        | "43"
        | "48"
        | "44"
        | "46"
        | "45"
        | "47";
      centre: number[];
      cervical: number[];
      vertices: number[];
    } => ({
      id: crown.id,
      centre: local(centres[at]),
      cervical: crown.cervical.flatMap((vertex: number): number[] =>
        local(point(vertex)),
      ),
      vertices: [...crown.cervical],
    }),
  );
  const midline: number =
    stations.reduce(
      (sum: number, station: IHumanFaceOralToothStation): number =>
        sum + station.centre[0],
      0,
    ) / stations.length;
  const rear: number = Math.min(
    ...stations.map(
      (station: IHumanFaceOralToothStation): number => station.centre[1],
    ),
  );
  const front: number = Math.max(
    ...stations.map(
      (station: IHumanFaceOralToothStation): number => station.centre[1],
    ),
  );
  const samples: number = 64;
  let vaultSpanMetres: number = 0;
  for (let k: number = 0; k <= samples; k++)
    vaultSpanMetres = Math.max(
      vaultSpanMetres,
      measureHumanFaceOralRingDistance(
        stations,
        midline,
        rear + ((front - rear) * k) / samples,
      ),
    );
  if (!(vaultSpanMetres > 0) || !Number.isFinite(vaultSpanMetres))
    throw new Error("Oral arch frame has no finite vault span.");
  return {
    mandibular,
    origin,
    lateral,
    forward,
    apical,
    stations,
    vaultSpanMetres,
  };
}
