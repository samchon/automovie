import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";

/** Domain points of model-frame millimetre positions, and their `u` values. */
export const locateAutoMovieHumanHeadRing: (
  domain: AutoMovieHumanHeadDomain,
  positions: IAutoMovieVector3[],
) => { u: number; v: number; us: number[] } = (
  domain: AutoMovieHumanHeadDomain,
  positions: IAutoMovieVector3[],
): { u: number; v: number; us: number[] } => {
  const points: { u: number; v: number }[] = positions.map(
    (p: IAutoMovieVector3): { u: number; v: number } =>
      domain.locate(
        domain.toHead({ x: p.x / 1000, y: p.y / 1000, z: p.z / 1000 }),
      ),
  );
  const v0: number = points[0]!.v;
  const vs: number[] = points.map(
    (p: { u: number; v: number }): number => p.v + Math.round(v0 - p.v),
  );
  return {
    u:
      points.reduce(
        (a: number, p: { u: number; v: number }): number => a + p.u,
        0,
      ) / points.length,
    v:
      (((vs.reduce((a: number, x: number): number => a + x, 0) / vs.length) %
        1) +
        1) %
      1,
    us: points.map((p: { u: number; v: number }): number => p.u),
  };
};
