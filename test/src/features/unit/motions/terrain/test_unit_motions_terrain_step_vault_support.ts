import type {
  IAutoMovieMotionHumanStepVault,
  IAutoMovieMotionHumanSupport,
} from "@automovie/interface";
import {
  climbStairsPrints,
  stepVaultSupport,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `stepVaultSupport` lays a step vault's four stances: the palm comes down
 * beside both entry feet (`palmBearing`), the stepping foot takes the ledge
 * (`stepBearing`), the through foot lands beyond it (`throughLanded`), and both
 * feet stand at the exit (`vaultStood`), the through foot on the vaulting
 * hand's side. `climbStairsPrints.schedule` orders a flight's steps: step over
 * step alternates from the lead and closes with the other foot on the top
 * tread; step by step brings each foot to every tread.
 *
 * Scenarios, a right-hand vault over a ledge `l` with entry and exit points:
 *
 * 1. The four stances name their contacts in order, the left foot stepping.
 * 2. Three treads step over step from the right: right 1, left 2, right 3, left 3;
 *    step by step from the left: left 1, right 1, left 2, right 2.
 */
export function test_unit_motions_terrain_step_vault_support(): void {
  const point: (z: number) => IAutoMovieMotionHumanStepVault.Target = (
    z: number,
  ): IAutoMovieMotionHumanStepVault.Target => ({
    kind: "point",
    frame: "world",
    at: { x: 0, y: 0, z },
  });
  const route: IAutoMovieMotionHumanStepVault = {
    hand: "right",
    entry: { left: point(0), right: point(0.1) },
    palm: { kind: "prop", subject: "l", point: "top" },
    step: { kind: "prop", subject: "l", point: "edge" },
    exit: { left: point(1), right: point(1.1) },
  };
  const support: IAutoMovieMotionHumanSupport.IParams = stepVaultSupport(route);
  TestValidator.equals(
    "the stances",
    support.stances.map(
      (s: IAutoMovieMotionHumanSupport.IStance): unknown[] => [
        s.event,
        s.contacts.map(
          (c: IAutoMovieMotionHumanSupport.IContact): string => c.part,
        ),
      ],
    ),
    [
      ["palmBearing", ["rightFoot", "leftFoot", "rightHand"]],
      ["stepBearing", ["rightFoot", "rightHand", "leftFoot"]],
      ["throughLanded", ["rightFoot", "rightHand", "leftFoot"]],
      ["vaultStood", ["rightFoot", "leftFoot"]],
    ],
  );
  TestValidator.equals(
    "the targets",
    [
      support.stances[1]!.contacts[2]!.target,
      support.stances[2]!.contacts[0]!.target,
      support.stances[3]!.contacts[1]!.target,
    ],
    [route.step, route.exit.right, route.exit.left],
  );
  const steps: (
    pattern: "stepOverStep" | "stepByStep",
    lead: "left" | "right",
    count: number,
  ) => string[] = (
    pattern: "stepOverStep" | "stepByStep",
    lead: "left" | "right",
    count: number,
  ): string[] =>
    climbStairsPrints
      .schedule(pattern, count, lead)
      .map((s: climbStairsPrints.IStep): string => `${s.side}${s.level}`);
  TestValidator.equals(
    "the schedules",
    [steps("stepOverStep", "right", 3), steps("stepByStep", "left", 2)],
    [
      ["right1", "left2", "right3", "left3"],
      ["left1", "right1", "left2", "right2"],
    ],
  );
}
