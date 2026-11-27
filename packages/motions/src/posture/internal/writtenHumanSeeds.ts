import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanLimbFit } from "../HumanLimbFit";
import { resolveHumanPosture } from "./resolveHumanPosture";

/**
 * The placement a resolve of a posture's limb goals takes where no fit of an
 * earlier second is at hand: each goal limb at the swivel and bend branch the
 * posture's own joints give it (`HumanLimbFit.seed`, in closed form on the
 * posture resolved without its goals), prescribed, so the limb is placed on its
 * goal at that swivel in closed form and refined from it only where that
 * placement does not stand (Tolani, Goswami and Badler 2000, section 3.2.4: the
 * swivel is the limb's one free coordinate on its goal, and the law's own
 * written limb states the one it means). A law that reads its own posture's
 * bones at every second (a seated hand laid on the thigh its leg's goal places)
 * then pays a closed-form placement a limb per read instead of a sweep, and the
 * bones it reads are a function of the posture alone, the same in any reading
 * order.
 *
 * @param body The body.
 * @param posture The posture, its joints written and its goals unread.
 * @returns Each goal limb's prescribed swivel and branch; none for a limb whose
 *   written chain gives no seed.
 */
export function writtenHumanSeeds(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> {
  const out: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>> = {};
  // A goal that carries its law's planned seed (`IAutoMovieHumanLimbGoal.seed`)
  // is placed there in closed form by every reader, whatever seed is handed
  // (`refitHumanPosture`), so it needs no written one; a posture whose every
  // goal carries one is not resolved here at all.
  const limbs: AutoMovieHumanLimb[] = (
    Object.keys(posture.limbs) as AutoMovieHumanLimb[]
  ).filter(
    (limb: AutoMovieHumanLimb): boolean =>
      posture.limbs[limb] !== undefined &&
      posture.limbs[limb]!.seed === undefined,
  );
  if (limbs.length === 0) return out;
  const written: IAutoMoviePose = resolveHumanPosture(body, {
    ...posture,
    limbs: {},
  });
  for (const limb of limbs) {
    const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
      body,
      written,
      limb,
    );
    if (seed !== null)
      out[limb] = {
        ...seed,
        tolerance: hingedArmSwivel.RESOLUTION,
        prescribed: true,
      };
  }
  return out;
}
