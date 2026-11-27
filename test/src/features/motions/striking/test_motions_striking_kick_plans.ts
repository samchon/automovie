import type {
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  KickPlans
} from "../../../../../packages/motions/src/striking/internal/KickPlans";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A plan whose carriage turns ten degrees a metre of goal, its ankle at the
 * goal.
 */
const plan = (goal: IAutoMovieVector3): KickPlans.IPlan => ({
  goal,
  carriage: { turn: 10 * goal.x, lean: 0, pitch: 0, step: goal.x, drive: 0 },
  leg: (): IAutoMovieMotionHumanKickGeometry.ILeg => ({
    ankle: goal,
    hint: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  }),
});

/** Standing at the origin. */
const BASE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * A corrected kick's plans (`KickPlans.create`): each correction unit replans
 * the kick from the last plan toward its moved goal, and the carriage and leg
 * shown blend each replan in on its unit's minimum-jerk share; a unit that
 * moves nothing keeps its plan.
 *
 * Scenario: a correction of 1 m along +X over a second, started at the kick's
 * origin, shows half the turn, 5 degrees, and the ankle at (0.5, 0, 0) halfway,
 * replanning once; a second correction of nothing changes neither.
 */
export function test_motions_striking_kick_plans(): void {
  let replans: number = 0;
  const units = [
    { displacement: { x: 1, y: 0, z: 0 }, start: 0, duration: 1 },
    { displacement: { x: 0, y: 0, z: 0 }, start: 0, duration: 1 },
  ];
  const plans: KickPlans.IPlans = KickPlans.create({
    first: plan({ x: 0, y: 0, z: 0 }),
    next: (
      _previous: KickPlans.IPlan,
      goal: IAutoMovieVector3,
    ): KickPlans.IPlan => {
      ++replans;
      return plan(goal);
    },
    units: () => units,
    t0: 0,
  });
  TestValidator.predicate(
    "the blend",
    nclose(plans.shown(0.5).turn, 5, 1e-12) &&
      nclose(plans.shown(1).turn, 10, 1e-12) &&
      vclose(
        plans.leg(0.5, BASE, { x: 0, y: 0, z: 0 }).ankle,
        { x: 0.5, y: 0, z: 0 },
        1e-12,
      ) &&
      replans === 1,
  );
}
