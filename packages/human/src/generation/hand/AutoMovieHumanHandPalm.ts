import type { AutoMovieLoftFrame, IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanHandForm } from "./IAutoMovieHumanHandForm";
import { AutoMovieHumanArmPrior } from "../AutoMovieHumanArmPrior";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import { AutoMovieHumanPalmRelief } from "./AutoMovieHumanPalmRelief";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { scale, dot, mean }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;
const { sidedFrame, reflect }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * The palm's chain, its sections square to the hand's axis, each carrying the
 * palm's reliefs (`AutoMovieHumanPalmRelief`).
 */
export namespace AutoMovieHumanHandPalm {
  /** The palm's chain, its sections square to the hand's axis. */
  export function palmOf(
    hand: IAutoMovieHumanHandForm,
    map: (q: readonly [number, number, number]) => Vec3,
    side: "left" | "right",
    sign: 1 | -1,
  ): IAutoMovieLoftChain {
    const prior: AutoMovieHumanArmPrior.IHandPrior = AutoMovieHumanArmPrior.PRIOR.hand;
    const along: Vec3 = [...prior.along];
    const normal: Vec3 = scale(along, -1);

    // Each section carries the palm's reliefs in the form's axes before the
    // hand's map; the palm starts at its most proximal section.
    const start: number = Math.min(...hand.palmRings.map((ring: readonly Vec3[]): number => ring[0]![0]));
    const samples: AutoMovieHumanLimbFrame.ISample[] = hand.palmRings.map(
      (ring: readonly Vec3[]): AutoMovieHumanLimbFrame.ISample => {
        const points: Vec3[] = AutoMovieHumanPalmRelief.ring(hand.digits, ring, start).map((q: Vec3): Vec3 => map(q));
        const c: Vec3 = [mean(points, 0), mean(points, 1), mean(points, 2)];
        const frame: AutoMovieLoftFrame.IFrame = AutoMovieHumanLimbFrame.frame(
          c,
          normal,
          [...prior.through],
        );
        return { station: -dot(c, along), frame: sidedFrame(frame, sign), ring: reflect(points, sign) };
      },
    );
    const first: number = samples[0]!.station;
    return {
      name: `hand.${side}.1`,
      basis: "spline",
      order: prior.palmSection.order,
      samples: prior.palmSection.samples,
      rule: "arclength",
      layers: AutoMovieHumanLimbFrame.layers(
        samples.map((s: AutoMovieHumanLimbFrame.ISample): AutoMovieHumanLimbFrame.ISample => ({
          ...s,
          station: s.station - first,
        })),
        prior.palmSection.order,
      ),
    };
  }
}
