import type { IAutoMovieMotionHumanSustainedForce } from "@automovie/interface";
import { HumanForceExchange } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanForceExchange.pull` spreads a pull equally over its grip sites as
 * sustained forces constant over the window.
 *
 * Scenarios:
 *
 * 1. 100 N toward +X through two grips is 50 N on each, over the window.
 * 2. No grip carries no force.
 */
export function test_unit_motions_grappling_force_exchange_pull(): void {
  TestValidator.equals(
    "an equal share per grip",
    HumanForceExchange.pull({
      subject: "uke",
      sites: ["chest", { bone: "leftLowerArm", point: { x: 0, y: 0, z: 0 } }],
      direction: { x: 1, y: 0, z: 0 },
      force: 100,
      from: 1,
      to: 2,
    }),
    [
      {
        kind: "sustained",
        subject: "uke",
        at: "chest",
        from: 1,
        to: 2,
        force: { x: 50, y: 0, z: 0 },
      },
      {
        kind: "sustained",
        subject: "uke",
        at: { bone: "leftLowerArm", point: { x: 0, y: 0, z: 0 } },
        from: 1,
        to: 2,
        force: { x: 50, y: 0, z: 0 },
      },
    ] satisfies IAutoMovieMotionHumanSustainedForce[],
  );
  TestValidator.equals(
    "no grip",
    HumanForceExchange.pull({
      subject: "uke",
      sites: [],
      direction: { x: 1, y: 0, z: 0 },
      force: 100,
      from: 1,
      to: 2,
    }),
    [],
  );
}
