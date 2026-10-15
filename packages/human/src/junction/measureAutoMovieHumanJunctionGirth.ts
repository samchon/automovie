import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanRingCurve } from "./AutoMovieHumanRingCurve";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "./IAutoMovieHumanCage";
import { IAutoMovieHumanRing } from "./IAutoMovieHumanRing";

/**
 * Girth of the joined limit surface along one junction ring, from the two parts' cages before they are joined.
 *
 * Each ring vertex is averaged with the loops either side of it by the stencil (1, 4, 1) / 6, its neighbour off the ring in the proximal cage and in the distal cage, and the girth is the length of the closed cubic B-spline of those averages: the limit section along the ring when the neighbourhood is regular, as `AutoMovieHumanRingCurve` states. A ring vertex with more than one neighbour off the ring in a part, next to an extraordinary vertex, takes their mean, an approximation there.
 *
 * @param props.site The junction site
 * @param props.side Side of a bilateral site, null for the neck sites
 * @param props.proximal The proximal part's cage, opening the ring
 * @param props.distal The distal part's cage, opening the ring
 * @param props.only Count only that part's neighbouring loop, standing the other's on the ring itself, to tell each part's share of a difference; omitted, both
 * @returns Girth, millimetres
 * @throws {Error} When a cage opens no ring at the site, or the rings differ in count
 */
export const measureAutoMovieHumanJunctionGirth = (props: {
  site: AutoMovieHumanJunctionSite;
  side: AutoMovieHumanSide | null;
  proximal: IAutoMovieHumanCage;
  distal: IAutoMovieHumanCage;
  only?: "proximal" | "distal";
}): number => {
  const ring = (
    cage: IAutoMovieHumanCage,
    role: string,
  ): IAutoMovieHumanRing => {
    const found: IAutoMovieHumanRing | undefined = cage.rings.find(
      (r: IAutoMovieHumanRing): boolean =>
        r.site === props.site && r.side === props.side,
    );
    if (found === undefined)
      throw new Error(`${role} cage opens no ${props.site} ring`);
    return found;
  };
  const proximal: IAutoMovieHumanRing = ring(props.proximal, "proximal");
  const distal: IAutoMovieHumanRing = ring(props.distal, "distal");
  const n: number = proximal.vertices.length;
  if (distal.vertices.length !== n)
    throw new Error(`${props.site} rings differ in count`);
  const across = (
    cage: IAutoMovieHumanCage,
    vertices: number[],
    v: number,
  ): IAutoMovieVector3 => {
    const on: Set<number> = new Set(vertices);
    const off: Set<number> = new Set();
    for (const face of cage.faces) {
      const k: number = face.vertices.indexOf(v);
      if (k === -1) continue;
      for (const w of [
        face.vertices[(k + 1) % 4]!,
        face.vertices[(k + 3) % 4]!,
      ])
        if (!on.has(w)) off.add(w);
    }
    const points: IAutoMovieVector3[] = [...off].map(
      (w: number) => cage.vertices[w]!.position,
    );
    return AutoMovieHumanVector.offset(
      AutoMovieHumanVector.of(0, 0, 0),
      ...points.map((p: IAutoMovieVector3): [IAutoMovieVector3, number] => [
        p,
        1 / points.length,
      ]),
    );
  };
  const averaged: IAutoMovieVector3[] = proximal.vertices.map(
    (p: number, k: number) => {
      const d: number = distal.vertices[(n - k) % n]!;
      return AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(0, 0, 0),
        [
          props.only === "distal"
            ? props.proximal.vertices[p]!.position
            : across(props.proximal, proximal.vertices, p),
          1 / 6,
        ],
        [props.proximal.vertices[p]!.position, 4 / 6],
        [
          props.only === "proximal"
            ? props.proximal.vertices[p]!.position
            : across(props.distal, distal.vertices, d),
          1 / 6,
        ],
      );
    },
  );
  return AutoMovieHumanRingCurve.perimeter(
    AutoMovieHumanRingCurve.spline(averaged),
  );
};
