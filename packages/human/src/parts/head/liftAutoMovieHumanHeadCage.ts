import { subdivideAutoMovieSurface } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Lift a cage whose vertices lie on the skin so that its limit surface lies on the skin too, instead of inside it.
 *
 * A Catmull-Clark limit surface lies inside a convex cage (Halstead, Kass and DeRose 1993, SIGGRAPH '93, pp. 35-44), so a cage sampled on the skin renders a shrunken head. Each round refines the cage once with the engine, takes the limit point of every refined vertex (one per cage vertex, edge and face), finds the skin on the ray from the head's centre through it, and moves each free cage vertex by a share of the gaps around it: its own, and the gaps at the midpoints of its edges and the centres of its faces at half and a quarter weight, the transposed weights of the refinement's edge and face points. That is a damped least-squares step over four times as many samples as cage vertices, so the lift follows the skin's broad forms without echoing the uneven spacing of the samples. Ring vertices stay on the shared boundary, anchored feature vertices keep their designed places, and mirror pairs stay mirrored.
 *
 * @param props Cage positions on the skin, faces, vertices to keep, mirror image of each vertex, the field and its centre, rounds and share
 * @returns The lifted positions
 */
export function liftAutoMovieHumanHeadCage(props: {
  positions: IAutoMovieVector3[];
  faces: Array<[number, number, number, number]>;
  fixed: Set<number>;
  mirror: number[];
  field: AutoMovieHumanHeadField;
  centre: IAutoMovieVector3;
  rounds: number;
  share: number;
}): IAutoMovieVector3[] {
  const n: number = props.positions.length;
  // edge numbering of the engine's refinement: by first appearance walking faces and corners in order
  const edgeIndex: Map<string, number> = new Map();
  const edges: Array<[number, number]> = [];
  for (const f of props.faces)
    for (let k: number = 0; k < 4; ++k) {
      const a: number = f[k]!;
      const b: number = f[(k + 1) % 4]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      if (!edgeIndex.has(key)) {
        edgeIndex.set(key, edges.length);
        edges.push([a, b]);
      }
    }
  // a refined point steers the lift only where none of its cage vertices is kept
  const free = (vs: number[]): boolean => vs.every((v: number): boolean => !props.fixed.has(v));
  let cage: IAutoMovieVector3[] = props.positions.map((q: IAutoMovieVector3) => ({ ...q }));
  for (let round: number = 0; round < props.rounds; ++round) {
    const limit: number[] = subdivideAutoMovieSurface({
      cage: {
        positions: cage.flatMap((q: IAutoMovieVector3): number[] => [q.x, q.y, q.z]),
        faces: props.faces,
      },
      levels: 1,
    }).limitPositions;
    const gap = (j: number): IAutoMovieVector3 => {
      const p: IAutoMovieVector3 = AutoMovieHumanVector.of(limit[3 * j]!, limit[3 * j + 1]!, limit[3 * j + 2]!);
      const ray: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [props.centre, -1]);
      const skin: IAutoMovieVector3 = props.field.project(
        props.centre,
        ray,
        AutoMovieHumanVector.distance(p, props.centre),
      );
      return AutoMovieHumanVector.offset(skin, [p, -1]);
    };
    const sum: IAutoMovieVector3[] = cage.map(() => AutoMovieHumanVector.of(0, 0, 0));
    const weight: number[] = new Array<number>(n).fill(0);
    const add = (v: number, g: IAutoMovieVector3, w: number): void => {
      sum[v] = AutoMovieHumanVector.offset(sum[v]!, [g, w]);
      weight[v] += w;
    };
    for (let v: number = 0; v < n; ++v) if (free([v])) add(v, gap(v), 1);
    edges.forEach(([a, b]: [number, number], e: number): void => {
      if (!free([a, b])) return;
      const g: IAutoMovieVector3 = gap(n + e);
      add(a, g, 0.5);
      add(b, g, 0.5);
    });
    props.faces.forEach((f: [number, number, number, number], i: number): void => {
      if (!free(f)) return;
      const g: IAutoMovieVector3 = gap(n + edges.length + i);
      for (const v of f) add(v, g, 0.25);
    });
    const moved: IAutoMovieVector3[] = cage.map((q: IAutoMovieVector3, i: number): IAutoMovieVector3 =>
      props.fixed.has(i) || weight[i] === 0
        ? q
        : AutoMovieHumanVector.offset(q, [sum[i]!, props.share / weight[i]!]),
    );
    cage = moved.map((a: IAutoMovieVector3, i: number): IAutoMovieVector3 => {
      if (props.fixed.has(i)) return a;
      const m: number = props.mirror[i]!;
      if (m === i) return AutoMovieHumanVector.of(0, a.y, a.z);
      const b: IAutoMovieVector3 = moved[m]!;
      return AutoMovieHumanVector.of((a.x - b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    });
  }
  return cage;
}
