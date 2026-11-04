import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * The web ring: the body's first section, in the oblique plane along the
 * clefts' line, shared out to the toes. Each cleft's across place meets the
 * ring's upper and lower boundaries at its two pinches; the hallux takes the
 * arc round the medial side, toes two to four a dorsal and a plantar arc
 * between their webs, the fifth toe the arc round the lateral side. The skin
 * from the ring to each toe's first section, a saddle at every web, is the web
 * surface (`AutoMovieHumanBodyWeb`, event `web: true`), the blend between the
 * body and the toes; each toe places its first section from its own anatomy
 * (`AutoMovieHumanFootToeRoot`), so the blend adapts to the toes.
 */
export namespace AutoMovieHumanFootWebRing {
  /** Each toe's arcs of the ring. */
  export interface IWebRing {
    /** Each toe's arcs of the body's ring, left phases, hallux first. */
    arcs: [number, number][][];
  }

  /** The web ring's arcs from the clefts' places across it. */
  export function of(k: AutoMovieHumanFootFrame.IFrame, body: AutoMovieHumanFootBody.IBody): IWebRing {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const ring: AutoMovieHumanFootBody.ISection = body.section(0);
    const pinches: { dorsal: number; plantar: number }[] = prior.clefts.map(
      (c: readonly [number, number]): { dorsal: number; plantar: number } =>
        ring.pinches(G.dot(G.sub(k.at(c[0], c[1], 0), ring.frame.origin), ring.frame.v)),
    );
    const count: number = prior.toes.length;
    const arcs: [number, number][][] = prior.toes.map((_: AutoMovieHumanFootPrior.IToe, i: number): [number, number][] => {
      if (i === 0) return [[pinches[0]!.plantar, pinches[0]!.dorsal]];
      if (i === count - 1) return [[pinches[i - 1]!.dorsal, pinches[i - 1]!.plantar]];

      return [
        [pinches[i - 1]!.dorsal, pinches[i]!.dorsal],
        [pinches[i]!.plantar, pinches[i - 1]!.plantar],
      ];
    });

    return { arcs };
  }
}
