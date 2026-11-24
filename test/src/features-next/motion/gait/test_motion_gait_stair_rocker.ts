import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { motionHumanSignature as M } from "../../../features/internal/motionHumanSignature";

/**
 * A stair foot rocks on the same material point until it leaves the tread.
 *
 * Scenarios:
 * 1. Read stance and the subsequent swing while ascending on the average body.
 * 2. Read the same phases while descending on the average body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tread pivot, stance and swing cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reconstructs the forefoot material point from ankle position, rotation and contact offset.
 * @evidence contracts/development/testing.md#independent-expectations A rigid material pivot stays fixed to numerical precision in stance and travels with the foot during swing.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both stair directions and requests times in an order independent of the action clock.
 * @evidence contracts/development/testing.md#execution-ownership Uses the public placed performance and authored goal reader in memory.
 */
export function test_motion_gait_stair_rocker(): void {
  for (const direction of ["up", "down"] as const) {
    const staged: M.IStaged = M.stage(
      "climbStairs",
      `direction=${direction}`,
      "m-average",
    );
    const plan = staged.film.segments("a")[0]!.plan;
    const stance = plan.contacts.find(
      (contact) =>
        contact.kind === "plant" && contact.from > 0 && contact.to < 1,
    )!;
    const side: AutoMovieHumanSide =
      stance.part === "leftFoot" ? "left" : "right";
    const pin = (share: number): IAutoMovieVector3 => {
      const goal = staged.film.performance.posture("a", share * plan.duration)
        .limbs[`${side}Leg`]!;
      return Vector3.add(
        goal.point,
        Quaternion.rotateVector(goal.rotation!, goal.contact!),
      );
    };
    const lo: number = stance.from;
    const hi: number = stance.to;
    const origin: IAutoMovieVector3 = pin(lo + (hi - lo) / 2);
    const slip: number = Math.max(
      ...[0.8, 0.1, 0.6, 0.2].map((phase: number): number =>
        Vector3.distance(origin, pin(lo + (hi - lo) * phase)),
      ),
    );
    TestValidator.predicate(
      `${direction}: pinned forefoot slip ${slip} m`,
      slip < 1e-9,
    );
    const landing = plan.contacts.find(
      (contact) => contact.part === stance.part && contact.from > hi,
    )!;
    const moving: number = Vector3.distance(
      origin,
      pin((hi + landing.from) / 2),
    );
    TestValidator.predicate(
      `${direction}: swinging forefoot travels ${moving} m`,
      moving > 0.025,
    );
  }
}
