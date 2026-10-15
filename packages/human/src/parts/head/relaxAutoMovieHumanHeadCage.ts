import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Settle the free vertices of the head cage over the skin between its anchored vertices.
 *
 * Each sweep moves every free vertex to the mean of its edge neighbours and back onto the skin along the ray from the head's centre: Laplacian smoothing constrained to the surface, so the grid spreads evenly between the anchors and its loops run where the anchors lead them. Mirror pairs are averaged after each sweep and midline vertices held on the midline, so the head stays exactly symmetric whatever order the sweep visits them in. Sweeps are Jacobi steps over the previous sweep's positions, a fixed number of them, so the result is the same on every host.
 *
 * The cage vertices lie on the skin and the limit surface of one Catmull-Clark subdivision lies slightly inside its convex cage; at this cage's density the difference is under a millimetre on the vault, which the measurement checks bound.
 *
 * @param props Initial positions, faces, anchors, mirror image of each vertex, the field and its projection centre, and the number of sweeps
 * @returns Cage positions in the head frame
 */
export function relaxAutoMovieHumanHeadCage(props: {
  positions: IAutoMovieVector3[];
  faces: Array<[number, number, number, number]>;
  anchors: Map<number, IAutoMovieVector3>;
  mirror: number[];
  field: AutoMovieHumanHeadField;
  centre: IAutoMovieVector3;
  sweeps: number;
}): IAutoMovieVector3[] {
  const neighbours: Array<Set<number>> = props.positions.map(
    (): Set<number> => new Set<number>(),
  );
  for (const f of props.faces)
    for (let k: number = 0; k < 4; ++k) {
      neighbours[f[k]!]!.add(f[(k + 1) % 4]!);
      neighbours[f[(k + 1) % 4]!]!.add(f[k]!);
    }
  let p: IAutoMovieVector3[] = props.positions.map(
    (q: IAutoMovieVector3, i: number): IAutoMovieVector3 =>
      props.anchors.get(i) ?? q,
  );
  for (let sweep: number = 0; sweep < props.sweeps; ++sweep) {
    const previous: IAutoMovieVector3[] = p;
    const moved: IAutoMovieVector3[] = previous.map(
      (q: IAutoMovieVector3, i: number): IAutoMovieVector3 => {
        if (props.anchors.has(i)) return q;
        const around: Set<number> = neighbours[i]!;
        let x: number = 0;
        let y: number = 0;
        let z: number = 0;
        for (const j of around) {
          x += previous[j]!.x;
          y += previous[j]!.y;
          z += previous[j]!.z;
        }
        const mean: IAutoMovieVector3 = AutoMovieHumanVector.of(
          x / around.size,
          y / around.size,
          z / around.size,
        );
        const ray: IAutoMovieVector3 = AutoMovieHumanVector.offset(mean, [
          props.centre,
          -1,
        ]);
        return props.field.project(
          props.centre,
          ray,
          AutoMovieHumanVector.distance(q, props.centre),
        );
      },
    );
    p = moved.map((a: IAutoMovieVector3, i: number): IAutoMovieVector3 => {
      const m: number = props.mirror[i]!;
      if (m === i) return AutoMovieHumanVector.of(0, a.y, a.z);
      const b: IAutoMovieVector3 = moved[m]!;
      return AutoMovieHumanVector.of(
        (a.x - b.x) / 2,
        (a.y + b.y) / 2,
        (a.z + b.z) / 2,
      );
    });
  }
  return p;
}
