import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Grow both eyebrows as single-hair cards lying on the brow's skin.
 *
 * Each brow is laid out in the frontal plane from its eye's centre of rotation, the eye joint the skeleton places, and every hair is then projected straight back onto the head's surface, so the brow sits on whatever brow ridge the head generator built. The layout, in millimetres for an adult and scaled by the eye's distance from the midline over 31 mm for anyone else:
 *
 * - The brow runs from its head above the medial canthus, 13 mm medial of the eye's centre, to its tail 33 mm lateral of it, beyond the lateral canthus; its peak lies over the lateral limbus, the brow's peak in every action (Park et al. 2017).
 * - The lower margin stands 11 mm above the eye's centre at the head, 16 at the peak and 10 at the tail, which leaves 9.5 to 11 mm of lid between it and the upper lid margin at the pupil (Gao et al. 2025, measured); the brow is 11 mm tall at its head, thinning to 3 at the tail.
 * - Hair direction follows the brow's three parts (Rajput 2021, conventional): in the head, the first 12 percent, hairs point up; in the body upper-border hairs point down and outward and lower-border hairs up and outward, crossing at the axis; in the tail they run outward, sloping down. Hairs lie nearly flush with the skin, "directed obliquely on the surface" (Gray 1918), lifted 8 degrees.
 * - Density falls toward the tail and toward the upper and lower borders, so the brow has no hard outline; hairs are 6 to 10 mm long.
 *
 * @param props.surface The head's surface
 * @param props.skeleton The skeleton at rest
 * @returns Both brows as one mesh, millimetres, model frame at rest
 * @throws {Error} When the skeleton lacks an eye bone
 */
export function growAutoMovieHumanBrows(props: {
  surface: AutoMovieHumanHeadSurface;
  skeleton: IAutoMovieHumanSkeleton;
}): IAutoMovieMesh {
  const builder: AutoMovieHumanCardBuilder = new AutoMovieHumanCardBuilder();
  for (const side of ["left", "right"] as const) {
    const joint: IAutoMovieHumanSkeleton.IJoint | undefined = props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === `${side}Eye`,
    );
    if (joint === undefined) throw new Error(`the skeleton lacks ${side}Eye`);
    const E = joint.position;
    const s: number = side === "left" ? 1 : -1;
    const k: number = Math.abs(E.x) / 31;
    const peak: number = 0.41;
    const lower = (u: number): number =>
      k * (u <= peak ? 11 + 5 * Math.sin((Math.PI / 2) * (u / peak)) : 16 - 6 * ((u - peak) / (1 - peak)) ** 2);
    const tall = (u: number): number => k * (11 - 3 * u - 5 * u ** 4);
    const x = (u: number): number => E.x + s * k * (-13 + 46 * u);
    const rows: number = 9;
    const cols: number = 52;
    for (let i: number = 0; i < rows; ++i)
      for (let j: number = 0; j < cols; ++j) {
        const u: number = (j + hash(side, i, j, 0)) / cols;
        const w: number = (i + hash(side, i, j, 1)) / rows;
        if (hash(side, i, j, 2) > (1 - 0.55 * u) * (1 - 0.6 * Math.abs(2 * w - 1) ** 2)) continue;
        const px: number = x(u);
        const py: number = E.y + lower(u) + w * tall(u);
        const hit: AutoMovieHumanHeadSurface.IHit | null = props.surface.cast([px, py, E.z + 80], [0, 0, -1]);
        if (hit === null) continue;
        // direction in the frontal plane: the brow's axis turned by the part's angle
        const ax: number = x(Math.min(1, u + 0.02)) - x(Math.max(0, u - 0.02));
        const ay: number = lower(Math.min(1, u + 0.02)) + 0.5 * tall(Math.min(1, u + 0.02)) - lower(Math.max(0, u - 0.02)) - 0.5 * tall(Math.max(0, u - 0.02));
        const axis: number = Math.atan2(ay, s * ax);
        const v: number = 2 * w - 1;
        const angle: number =
          u < 0.12 ? (75 * Math.PI) / 180 : u < 0.8 ? (-28 * v * Math.PI) / 180 : (-10 * Math.PI) / 180;
        const theta: number = axis + angle + (hash(side, i, j, 3) - 0.5) * 0.25;
        const planar: number[] = [s * Math.cos(theta), Math.sin(theta), 0];
        const n: number[] = hit.normal;
        const t: number[] = normalize(sub(planar, scale(n, dot(planar, n))));
        const lift: number = (8 * Math.PI) / 180;
        const d: number[] = normalize(add(scale(t, Math.cos(lift)), scale(n, Math.sin(lift))));
        const length: number = k * (u < 0.12 ? 6 : 7 + 3 * hash(side, i, j, 4));
        const root: number[] = add(hit.position, scale(n, 0.15));
        const mid: number[] = add(add(root, scale(d, length / 2)), scale(n, 0.25));
        const tip: number[] = add(add(root, scale(t, length)), scale(n, 0.3));
        const across: number[] = normalize(cross(n, d));
        builder.card({
          points: [root, mid, tip] as Array<[number, number, number]>,
          sides: [across, across, across] as Array<[number, number, number]>,
          normals: [n, n, n] as Array<[number, number, number]>,
          widths: [0.9 * k, 0.8 * k, 0.5 * k],
          column: paintAutoMovieHumanHairStrands.COLUMNS.single,
          v: [0, 1],
        });
      }
  }
  return builder.build();
}

/** Integer hash to `[0, 1)`. */
function hash(side: "left" | "right", i: number, j: number, k: number): number {
  let h: number = Math.imul(side === "left" ? 11 : 13, 0x27d4eb2d) ^ Math.imul(i + 1, 0x165667b1) ^ Math.imul(j + 1, 0x9e3779b9) ^ Math.imul(k + 5, 0x85ebca77);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function add(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}

function sub(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

function scale(a: readonly number[], s: number): number[] {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
}

function normalize(a: readonly number[]): number[] {
  const length: number = Math.hypot(a[0]!, a[1]!, a[2]!);
  return length === 0 ? [0, 1, 0] : scale(a, 1 / length);
}
