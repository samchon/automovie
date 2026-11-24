import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/**
 * Recover original declared world endpoints at a single clock. Accepted
 * recovery offsets translate the declaration; a fitted, unmet output never
 * becomes a new promise. A lifted swing follows its drive's path when given
 * (`IAutoMovieAdvancePhysicalBalance.IResult.swing`): the clearance its stance
 * can carry and its lowest point's hang, so the joints' reference and the drive
 * share one path; else the policy's clearance.
 */
export function physicalRecoverySupportGoals(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  target: IAutoMoviePhysicalSimulationInput.ITarget,
  pattern: IAutoMovieFootfallPattern,
  state: IAutoMoviePhysicalRecoveryState | undefined,
  seconds: number,
  path?: {
    height: number;
    hang: number;
    pair?: { height: number; hang: number };
  },
): Record<string, IAutoMovieVector3> {
  return Object.fromEntries(
    pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
      ): [string, IAutoMovieVector3] => {
        const point: IAutoMovieVector3 = physicalSupportPoint(
          target.segments[limb.bone]!,
          limb.localPoint,
        );
        const owner: IAutoMovieFootfallPattern["limbs"][number] | undefined =
          body.balance?.pattern.limbs.find(
            (candidate: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
              candidate.bone === limb.bone,
          );
        // A limb keeps its planted goal until it lifts; a second lifted swing
        // follows its own path (`physicalBalanceSwing`).
        const swing: IAutoMovieStepPlanner.IStep | undefined =
          physicalRecoverySwing.of(state, limb.bone);
        const own: { height: number; hang: number } | undefined =
          physicalRecoverySwing(state).filter(
            (step: IAutoMovieStepPlanner.IStep): boolean =>
              !state?.seating?.[step.bone],
          )[1]?.bone === limb.bone
            ? path?.pair
            : path;
        if (swing && !state?.seating?.[limb.bone] && owner && body.balance) {
          const original: IAutoMovieVector3 = physicalSupportPoint(
            target.segments[owner.bone]!,
            owner.localPoint,
          );
          const moved: IAutoMovieVector3 = samplePhysicalRecoveryGoal({
            swing,
            point: original,
            velocity: { x: 0, y: 0, z: 0 },
            height: own?.height ?? body.balance.height,
            seconds,
          }).point;
          return [
            limb.bone,
            Vector3.add(Vector3.add(point, Vector3.subtract(moved, original)), {
              x: 0,
              y: own?.hang ?? 0,
              z: 0,
            }),
          ];
        }
        return [
          limb.bone,
          Vector3.add(point, state?.offsets[limb.bone] ?? { x: 0, y: 0, z: 0 }),
        ];
      },
    ),
  );
}
