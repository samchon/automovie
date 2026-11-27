import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTravelCarExit,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import type { HumanMount } from "./HumanMount";

/**
 * Admit a rear car exit's feet through the doorway: each ankle crosses the sill
 * where its straight course from the seated start to its landing meets the
 * opening's plane, both feet must start inside and land outside, and the
 * crossing ankles must keep the clearance from both jambs.
 *
 * @param input The seated feet, the landing posture, the opening, the clearance
 *   and the opening's outward and lateral readers.
 * @returns Each ankle's sill crossing, world metres.
 * @throws {HumanRefusal} When a foot starts outside, a landing foot is not
 *   outside, or a crossing ankle lies nearer a jamb than the clearance allows.
 */
export function admitCarExitSill(
  input: admitCarExitSill.IInput,
): admitCarExitSill.IAnkles {
  const { starts, landing, through, gap, outward, along } = input;
  const acrossSill = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
    const ankle: IAutoMovieVector3 = starts[side].ankle;
    const inside: number = -outward(ankle);
    const landed: IAutoMovieVector3 = landing.limbs[`${side}Leg`]!.point;
    return Vector3.lerp(ankle, landed, inside / (inside + outward(landed)));
  };
  if (outward(starts.left.ankle) >= 0 || outward(starts.right.ankle) >= 0)
    throw new HumanRefusal({
      kind: "base",
      axis: "aperture",
      value: through.id,
      reason: "the seated turn starts with both feet inside the doorway",
      fix: "enter from the seated posture before either foot has left",
    });
  if (
    outward(landing.limbs.leftLeg!.point) <= 0 ||
    outward(landing.limbs.rightLeg!.point) <= 0
  )
    throw new HumanRefusal({
      kind: "base",
      axis: "aperture",
      value: through.id,
      reason: "both landing feet must be outside before rising",
      fix: "use a freer exterior stance",
    });
  const sill: admitCarExitSill.IAnkles = {
    left: acrossSill("left"),
    right: acrossSill("right"),
  };
  const footRoom: number =
    2 *
    (gap + Math.max(Math.abs(along(sill.left)), Math.abs(along(sill.right))));
  if (footRoom > through.width)
    throw new HumanRefusal({
      kind: "reach",
      axis: "aperture",
      value: through.width,
      feasible: {
        kind: "range",
        unit: "m",
        minimum: footRoom,
        maximum: null,
      },
      reason: "an ankle waypoint lies too near a door jamb",
      fix: "author the seated entry nearer the center of the rear opening",
    });
  return sill;
}

/** Companion types of `admitCarExitSill`. */
export namespace admitCarExitSill {
  /**
   * The doorway, the feet and the readers a sill admission needs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The law's own opening and clearance, its seated feet and landing posture, and the opening's signed distance readers in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by HumanTravelCarExit and read only here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only what the admission reads.
   */
  export interface IInput {
    /** Each foot as the seated turn starts. */
    starts: Record<AutoMovieHumanSide, HumanMount.IFoot>;

    /** The rise's first posture, whose leg goals are the landings. */
    landing: IAutoMovieMotionHumanPosture;

    /** The rear opening. */
    through: IAutoMovieMotionHumanTravelCarExit.IParams["through"];

    /** The clearance kept from each jamb, metres. */
    gap: number;

    /** A point's signed distance out of the opening's plane, metres. */
    outward(point: IAutoMovieVector3): number;

    /** A point's signed distance along the opening from its centre, metres. */
    along(point: IAutoMovieVector3): number;
  }

  /** Each ankle's sill crossing, world metres. */
  export type IAnkles = Record<AutoMovieHumanSide, IAutoMovieVector3>;
}
