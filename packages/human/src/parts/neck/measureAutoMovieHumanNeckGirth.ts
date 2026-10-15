import {
  IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";

/**
 * Measure a neck cage's girth the way the tape takes it: the perimeter of the subdivided limit surface's section in a plane, with the tape spanning concavities, so the convex hull of the section.
 *
 * @param cage The neck's cage, millimetres
 * @param origin A point of the section plane
 * @param normal Unit normal of the section plane
 * @returns Girth in millimetres
 */
export function measureAutoMovieHumanNeckGirth(
  cage: IAutoMovieHumanCage,
  origin: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): number {
  const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
    cage: {
      positions: cage.vertices.flatMap(
        (v: IAutoMovieHumanCage.IVertex): number[] => [
          v.position.x,
          v.position.y,
          v.position.z,
        ],
      ),
      faces: cage.faces.map((f: IAutoMovieHumanCage.IFace): number[] => [
        ...f.vertices,
      ]),
    },
    levels: 3,
  });
  const p: number[] = surface.limitPositions;
  const at = (i: number): IAutoMovieVector3 =>
    AutoMovieHumanVector.of(p[3 * i]!, p[3 * i + 1]!, p[3 * i + 2]!);
  const side = (i: number): number =>
    AutoMovieHumanVector.dot(
      AutoMovieHumanVector.offset(at(i), [origin, -1]),
      normal,
    );
  const u: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.cross(normal, AutoMovieHumanVector.of(0, 0, 1)),
  );
  const w: IAutoMovieVector3 = AutoMovieHumanVector.cross(normal, u);
  const points: Array<[number, number]> = [];
  const f: number[] = surface.faces;
  for (let i: number = 0; i < f.length; i += 4)
    for (let k: number = 0; k < 4; ++k) {
      const a: number = f[i + k]!;
      const b: number = f[i + ((k + 1) % 4)]!;
      const da: number = side(a);
      const db: number = side(b);
      if (da * db >= 0) continue;
      const q: IAutoMovieVector3 = AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [at(a), db / (db - da)],
        [at(b), da / (da - db)],
        [origin, -1],
      );
      points.push([
        AutoMovieHumanVector.dot(q, u),
        AutoMovieHumanVector.dot(q, w),
      ]);
    }
  return hull(points);
}

/** Perimeter of the convex hull of planar points (Andrew's monotone chain). */
const hull = (input: Array<[number, number]>): number => {
  const p: Array<[number, number]> = [...input].sort(
    (a: [number, number], b: [number, number]): number =>
      a[0] - b[0] || a[1] - b[1],
  );
  if (p.length < 3) return 0;
  const cross = (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const chain = (points: Array<[number, number]>): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (const q of points) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2]!, out[out.length - 1]!, q) <= 0
      )
        out.pop();
      out.push(q);
    }
    return out.slice(0, -1);
  };
  const ring: Array<[number, number]> = [
    ...chain(p),
    ...chain([...p].reverse()),
  ];
  let sum: number = 0;
  ring.forEach((a: [number, number], i: number): void => {
    const b: [number, number] = ring[(i + 1) % ring.length]!;
    sum += Math.hypot(a[0] - b[0], a[1] - b[1]);
  });
  return sum;
};
