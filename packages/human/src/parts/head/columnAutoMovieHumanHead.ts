import { interpolateAutoMovieMonotone } from "@automovie/engine";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";

/**
 * The face's column lines either side of the midline: the turn from the midline, in turns of `v`, of the line `k` columns out, spaced smoothly through the edges of the openings. Each edge is set where the face's surface reaches its feature's offset at the feature's own level: the eye opening's medial edge inside endocanthion and its lateral edge beyond exocanthion at the eyes' centre, the mouth opening's edges beyond cheilion at stomion. Edges that would cross keep at least half a uniform column between them.
 */
export const columnAutoMovieHumanHead: (
  domain: AutoMovieHumanHeadDomain,
  head: IAutoMovieHumanIdentity.IHead,
  layout: IAutoMovieHumanHeadForm.ILayout,
  half: number,
  counts: {
    front: number;
    eye: { medial: number; lateral: number };
    mouth: number;
  },
) => (k: number) => number = (
  domain: AutoMovieHumanHeadDomain,
  head: IAutoMovieHumanIdentity.IHead,
  layout: IAutoMovieHumanHeadForm.ILayout,
  half: number,
  counts: {
    front: number;
    eye: { medial: number; lateral: number };
    mouth: number;
  },
): ((k: number) => number) => {
  const f: IAutoMovieHumanIdentity.IFeatures = head.features;
  const frame: AutoMovieHumanHeadDomain["frame"] = domain.frame;
  // the turn at which the face's surface on row `u` lies `x` from the midline, by bisection
  const turnAt: (u: number, x: number) => number = (
    u: number,
    x: number,
  ): number => {
    let lo: number = 0;
    let hi: number = half;
    for (let i: number = 0; i < 40; ++i) {
      const m: number = (lo + hi) / 2;
      if (Math.abs(domain.point(u, 0.5 + m).x) < x) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const eyeU: number = domain.front(frame.eye.y);
  const mouthU: number = domain.front(frame.stomion.y);
  const endocanthion: number = f.intercanthalWidth / 2;
  const knots: number[] = [
    0,
    counts.eye.medial,
    counts.mouth,
    counts.eye.lateral,
    counts.front / 2,
  ];
  const wanted: number[] = [
    0,
    turnAt(
      eyeU,
      endocanthion - layout.eyeOpening.medial * f.palpebralFissureLength,
    ),
    turnAt(mouthU, (f.mouthWidth / 2) * (1 + layout.mouthOpening.lateral)),
    turnAt(
      eyeU,
      endocanthion + (1 + layout.eyeOpening.lateral) * f.palpebralFissureLength,
    ),
    half,
  ];
  const step: number = half / (counts.front / 2);
  const values: number[] = [0];
  for (let i: number = 1; i < knots.length; ++i)
    values.push(
      i === knots.length - 1
        ? half
        : Math.min(
            Math.max(
              wanted[i]!,
              values[i - 1]! + 0.5 * step * (knots[i]! - knots[i - 1]!),
            ),
            half - 0.5 * step * (counts.front / 2 - knots[i]!),
          ),
    );
  return interpolateAutoMovieMonotone({ knots, values });
};
