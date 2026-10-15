import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Grow the upper and lower lashes of both eyes as cards rooted along the lid margins, each card a cluster of three lashes from the strand atlas.
 *
 * The margins are laid out in the frontal plane from the eye's centre of rotation, the eye joint, and each root is projected straight back onto the head's surface, so the lashes sit on the lids the head generator built. In millimetres for an adult, scaled by the eye's distance from the midline over 31 mm: the palpebral fissure is 29 wide, its lateral canthus 1.5 higher than the medial; the upper margin peaks 4.5 above the eye's centre and the lower margin lies 5 below it (conventional, near the clinical margin-to-reflex distances).
 *
 * Upper lashes, in two rows, curve forward and up and lower lashes, in one row, forward and down, so they do not interlace when the lids close (Gray 1918); every lash curves from the bulb (Aumond and Bitton 2018). The upper lashes take the appearance's length at the middle of the lid, three fifths of it at the canthi; the lower ones half of that.
 *
 * @param props.surface The head's surface
 * @param props.skeleton The skeleton at rest
 * @param props.length Longest upper lash, millimetres
 * @returns All lashes as one mesh, millimetres, model frame at rest; null for zero length
 * @throws {Error} When the skeleton lacks an eye bone
 */
export function growAutoMovieHumanLashes(props: {
  surface: AutoMovieHumanHeadSurface;
  skeleton: IAutoMovieHumanSkeleton;
  length: number;
}): IAutoMovieMesh | null {
  if (props.length <= 0) return null;
  const builder: AutoMovieHumanCardBuilder = new AutoMovieHumanCardBuilder();
  for (const side of ["left", "right"] as const) {
    const joint: IAutoMovieHumanSkeleton.IJoint | undefined = props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === `${side}Eye`,
    );
    if (joint === undefined) throw new Error(`the skeleton lacks ${side}Eye`);
    const E = joint.position;
    const s: number = side === "left" ? 1 : -1;
    const k: number = Math.abs(E.x) / 31;
    for (const lid of [
      { upper: true, row: 0, count: 22, from: -0.85, to: 0.95, scale: 1 },
      { upper: true, row: 1, count: 18, from: -0.75, to: 0.92, scale: 0.85 },
      { upper: false, row: 0, count: 14, from: -0.55, to: 0.95, scale: 0.5 },
    ]) {
      const margin = (c: number): [number, number] => [
        E.x + s * 14.5 * k * c,
        E.y + 0.75 * k * c + (lid.upper ? 4.5 * k * Math.pow(1 - c * c, 0.7) : -5 * k * Math.pow(1 - c * c, 0.8)),
      ];
      for (let i: number = 0; i < lid.count; ++i) {
        const c: number = lid.from + ((i + 0.5 + 0.3 * lid.row) / lid.count) * (lid.to - lid.from);
        const [x, y] = margin(c);
        const hit: AutoMovieHumanHeadSurface.IHit | null = props.surface.cast([x, y, E.z + 60], [0, 0, -1]);
        if (hit === null) continue;
        const [x1, y1] = margin(Math.min(1, c + 0.03));
        const [x0, y0] = margin(Math.max(-1, c - 0.03));
        const along: number[] = normalize([x1 - x0, y1 - y0, 0]);
        const up: number = lid.upper ? 1 : -1;
        const length: number = props.length * lid.scale * (0.6 + 0.4 * Math.pow(1 - Math.min(1, Math.abs(c - 0.15)), 1.5));
        const points: Array<[number, number, number]> = [];
        let p: number[] = add(hit.position, [0, -up * 0.3 * k, 0.2]);
        let d: number[] = normalize([0.15 * s * c, up * 0.35, 1]);
        const segments: number = 4;
        points.push(p as [number, number, number]);
        for (let j: number = 0; j < segments; ++j) {
          p = add(p, scale(d, length / segments));
          points.push(p as [number, number, number]);
          // each lash curls from its bulb toward the brow or the cheek
          d = normalize(add(d, [0, up * 0.32, -0.08]));
        }
        const width: number = (1.6 * ((lid.to - lid.from) * 14.5 * k)) / lid.count;
        const normal: [number, number, number] = [0, 0, 1];
        builder.card({
          points,
          sides: points.map((): [number, number, number] => along as [number, number, number]),
          normals: points.map((): [number, number, number] => normal),
          widths: points.map((_: unknown, j: number): number => width * (1 - 0.3 * (j / segments))),
          column: paintAutoMovieHumanHairStrands.COLUMNS.lashes,
          v: [0, 1],
        });
      }
    }
  }
  return builder.build();
}

function add(a: readonly number[], b: readonly number[]): number[] {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}

function scale(a: readonly number[], s: number): number[] {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}

function normalize(a: readonly number[]): number[] {
  const length: number = Math.hypot(a[0]!, a[1]!, a[2]!);
  return length === 0 ? [0, 1, 0] : scale(a, 1 / length);
}
