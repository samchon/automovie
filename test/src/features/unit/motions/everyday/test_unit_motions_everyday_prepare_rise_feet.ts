import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { prepareRiseFeet } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a few minimum-jerk products, metres. */
const ROUNDING: number = 1e-12;

/**
 * `prepareRiseFeet` draws a seated body's feet beneath it before it rises: a
 * foot with a swing travels from its entry ankle to its drawn one by minimum
 * jerk over the draw's seconds, lifted by a sine clearance, and is unplanted
 * while it moves; before and after its swing, and a foot with none, it stands
 * planted where it is; the leg goals are the standing law's at the current
 * root.
 *
 * Scenarios, the left foot drawn 0.2 m back from (0.1, 0.08, 0.4) over 0.2 to
 * 0.7 s with a 4 cm clearance, the right foot staying, and a leg builder that
 * puts each leg's goal on its ankle:
 *
 * 1. At 0.1 s both legs stand on the entry ankles, the left planted.
 * 2. Half way, at 0.45 s, the left ankle is half way back and 4 cm up, and
 *    unplanted; the right stands.
 * 3. From 0.7 s the left stands on its drawn ankle.
 */
export function test_unit_motions_everyday_prepare_rise_feet(): void {
  const entry: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: { x: 0.1, y: 0.08, z: 0.4 },
    right: { x: -0.1, y: 0.08, z: 0.4 },
  };
  const drawn: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: { x: 0.1, y: 0.08, z: 0.2 },
    right: entry.right,
  };
  const feet: ReturnType<typeof prepareRiseFeet> = prepareRiseFeet({
    feet: entry,
    drawn,
    swings: { left: [0.2, 0.7] },
    draw: 0.5,
    lift: 0.04,
    legged: (
      root: IAutoMovieVector3,
      at: Record<AutoMovieHumanSide, IAutoMovieVector3>,
    ): IAutoMovieMotionHumanPosture["limbs"] => ({
      leftLeg: { point: at.left, bend: root },
      rightLeg: { point: at.right, bend: root },
    }),
  });
  const root: IAutoMovieVector3 = { x: 0, y: 0.5, z: 0.1 };
  const early: IAutoMovieMotionHumanPosture["limbs"] = feet(root, 0.1);
  const middle: IAutoMovieMotionHumanPosture["limbs"] = feet(root, 0.45);
  const late: IAutoMovieMotionHumanPosture["limbs"] = feet(root, 0.9);
  TestValidator.predicate(
    "the feet",
    vclose(early.leftLeg!.point, entry.left, ROUNDING) &&
      early.leftLeg!.planted === undefined &&
      vclose(middle.leftLeg!.point, { x: 0.1, y: 0.12, z: 0.3 }, ROUNDING) &&
      middle.leftLeg!.planted === false &&
      vclose(middle.rightLeg!.point, entry.right, ROUNDING) &&
      vclose(late.leftLeg!.point, drawn.left, ROUNDING) &&
      middle.leftLeg!.bend === root,
  );
}
