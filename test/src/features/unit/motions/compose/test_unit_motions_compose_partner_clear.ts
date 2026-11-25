import type {
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { AutoMovieMotionHumanPartnerClear } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A placed segment, by its bone only (the merge reads nothing else). */
function segment(
  bone: "head" | "chest" | "hips",
): IAutoMovieMotionHumanColliders.IPlaced {
  return {
    bone,
    from: { x: 0, y: 0, z: 0 },
    to: { x: 0, y: 1, z: 0 },
    radius: 0.1,
  };
}

/** A posture with a left arm goal that already keeps clear of its hips. */
const POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {
    leftArm: {
      point: { x: 0.3, y: 1.2, z: 0.3 },
      bend: { x: 0.4, y: 1.1, z: 0 },
      clear: [segment("hips")],
    },
  },
};

/**
 * `AutoMovieMotionHumanPartnerClear.onto` lays a partner's posed segments on an
 * arm goal: after the goal's own `clear` segments, and `rests` after its own, a
 * goal with neither rests nor new ones left without `rests`; a posture without
 * that limb's goal is returned as it is.
 *
 * Scenarios:
 *
 * 1. The partner's head and chest appended to the goal's hips, no rests added.
 * 2. With the partner's chest to rest on, `rests` holds it.
 * 3. A posture with no right arm goal is returned unchanged.
 */
export function test_unit_motions_compose_partner_clear(): void {
  // 1. Clear.
  const cleared: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanPartnerClear.onto(POSTURE, "leftArm", [
      segment("head"),
      segment("chest"),
    ]);
  TestValidator.predicate(
    "the partner's segments after the goal's own",
    cleared.limbs
      .leftArm!.clear!.map(
        (s: IAutoMovieMotionHumanColliders.IPlaced): string => s.bone,
      )
      .join() === "hips,head,chest" &&
      cleared.limbs.leftArm!.rests === undefined &&
      POSTURE.limbs.leftArm!.clear!.length === 1,
  );

  // 2. Rests.
  const rested: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanPartnerClear.onto(
      POSTURE,
      "leftArm",
      [],
      [segment("chest")],
    );
  TestValidator.predicate(
    "a rest segment",
    rested.limbs.leftArm!.rests?.length === 1 &&
      rested.limbs.leftArm!.rests[0]!.bone === "chest",
  );

  // 3. No goal.
  TestValidator.predicate(
    "no goal, unchanged",
    AutoMovieMotionHumanPartnerClear.onto(POSTURE, "rightArm", [
      segment("head"),
    ]) === POSTURE,
  );
}
