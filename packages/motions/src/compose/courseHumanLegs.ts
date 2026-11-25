import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanLimbFit } from "../posture/HumanLimbFit";
import { courseLimbSwivels } from "./courseLimbSwivels";

/**
 * A law's leg goals coursed once over its action, so every reader of its
 * posture places the legs at one configuration
 * (`IAutoMovieHumanLimbGoal.seed`): the legs' swivel-and-branch course on the
 * frame grid and at the law's instants (`courseLimbSwivels`, on the legs
 * alone), its first knot placed at each leg as the action was entered and every
 * later knot continuing the one before (Tolani, Goswami and Badler 2000,
 * section 3.2.4: the swivel is the limb's one free coordinate on its goal). The
 * law stamps each second's seeds on its leg goals before anything reads its
 * posture's bones (a seated hand laid on the thigh its leg places), so the
 * display, the arm planner's base and the law itself read one thigh, and no
 * reader searches a leg's swivel.
 *
 * @param props The legs' posture, the span, its instants and the entry.
 * @returns The stamp of a second's seeds on a posture's leg goals.
 */
export function courseHumanLegs(
  props: courseHumanLegs.IProps,
): courseHumanLegs.Seeded {
  const entered: Map<AutoMovieHumanLimb, IAutoMovieSwivelSeed> = new Map();
  for (const limb of LEGS) {
    const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
      props.body,
      props.entry,
      limb,
    );
    if (seed !== null) entered.set(limb, seed);
  }
  const swivels: courseLimbSwivels.Swivels = courseLimbSwivels.swivels({
    body: props.body,
    // The legs' goals alone, with the root and the trunk that carry them: a
    // knot fits no arm, and reads no bone an arm goal places.
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const posture: IAutoMovieMotionHumanPosture = props.posture(seconds);
      return { ...posture, limbs: legsOf(posture) };
    },
    limbs: LEGS,
    span: props.span,
    ...(props.instants === undefined ? {} : { instants: props.instants }),
    entry: entered,
  });

  return (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    if (
      LEGS.every(
        (limb: AutoMovieHumanLimb): boolean =>
          posture.limbs[limb] === undefined,
      )
    )
      return posture;
    const seeds: ReadonlyMap<AutoMovieHumanLimb, IAutoMovieSwivelSeed> =
      swivels(seconds);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const limb of LEGS) {
      const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
      const seed: IAutoMovieSwivelSeed | undefined = seeds.get(limb);
      if (goal !== undefined && seed !== undefined)
        limbs[limb] = { ...goal, seed };
    }
    return { ...posture, limbs };
  };
}

/** The companion types of a law's leg course (`courseHumanLegs`). */
export namespace courseHumanLegs {
  /** What a law's legs are coursed from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The law's posture at a second since its start, its leg goals, root and
     * trunk as it writes them; its other goals are not read.
     */
    posture(seconds: number): IAutoMovieMotionHumanPosture;

    /** The seconds the course covers, from the law's start. */
    span: courseLimbSwivels.ISpan;

    /** Seconds inside the span the course keeps a knot at; none when absent. */
    instants?: readonly number[];

    /** The displayed pose the action is entered with. */
    entry: IAutoMoviePose;
  }

  /**
   * A posture at a second with its leg goals carrying the course's seeds there;
   * a posture with no leg goal unchanged.
   */
  export type Seeded = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture;
}

/** The legs a course fits. */
const LEGS: readonly AutoMovieHumanLimb[] = ["leftLeg", "rightLeg"];

/** A posture's leg goals alone. */
function legsOf(
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanPosture["limbs"] {
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const limb of LEGS) {
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
    if (goal !== undefined) limbs[limb] = goal;
  }
  return limbs;
}
