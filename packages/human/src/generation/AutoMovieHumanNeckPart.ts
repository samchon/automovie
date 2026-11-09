import { AutoMovieConstructionViews, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionParallelAxis } from "@automovie/interface";

import { AutoMovieHumanHeadMassPart } from "./head/AutoMovieHumanHeadMassPart";
import { AutoMovieHumanConstructionView } from "./limb/AutoMovieHumanConstructionView";

/** The shared native neck part author consumes numeric controls directly, without closing another source or evaluating a completed part. */
export namespace AutoMovieHumanNeckPart {
  /** Both the unresolved normal band and the closed full family consume the same control-to-native definition. */
  export function create(
    radius: IAutoMovieViewPart.IOutline,
    centre: IAutoMovieViewPart.IOutline,
    extents: readonly [number, number, number, number],
    lateral: number,
    domain: readonly [number, number],
  ): IAutoMovieViewPart {
    const identity: IAutoMovieViewPart.IOutline = {
      knots: domain.map((station: number): IAutoMovieViewPart.IKnot => ({ site: "neck.height", station, value: station })),
    };
    const axis: IAutoMovieConstructionParallelAxis = {
      type: "parallel",
      origin: {
        x: AutoMovieHumanConstructionView.length(centre),
        y: AutoMovieHumanConstructionView.length(identity),
        z: AutoMovieHumanConstructionView.length({ knots: identity.knots.map((knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({ ...knot, value: 0 })) }),
      },
      u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 },
    };
    const frame: ReturnType<typeof AutoMovieConstructionViews.frame> = AutoMovieConstructionViews.frame(axis);
    if (typeof frame === "string") throw new Error(frame);
    return {
      name: "neck.shared-original", axis: frame,
      stations: radius.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station),
      front: { positive: AutoMovieViewOutline.scale(radius, 1, extents[0] / lateral), negative: AutoMovieViewOutline.scale(radius, 1, -extents[2] / lateral) },
      side: { positive: radius, negative: AutoMovieViewOutline.scale(radius, 1, -1) },
      fullness: { kind: "shoulder", shoulder: { knots: domain.map((station: number): IAutoMovieViewPart.IKnot => ({ site: "neck.constant-template", station, value: AutoMovieViewSection.ELLIPSE })) } },
      order: AutoMovieHumanHeadMassPart.ORDER, samples: AutoMovieHumanHeadMassPart.SAMPLES,
    };
  }
}
