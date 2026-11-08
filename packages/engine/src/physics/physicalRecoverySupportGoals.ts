import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { advancePhysicalBalance as Balance } from "./advancePhysicalBalance";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";

/** Recover original declared world endpoints at a single clock. Accepted recovery offsets translate the declaration; a fitted, unmet output never becomes a new promise. */
export function physicalRecoverySupportGoals(
  body: Simulation.IBody,
  target: Simulation.ITarget,
  pattern: IAutoMovieFootfallPattern,
  state: Balance.IState | undefined,
  seconds: number,
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
        if (state?.swing?.bone === limb.bone && owner && body.balance) {
          const original: IAutoMovieVector3 = physicalSupportPoint(
            target.segments[owner.bone]!,
            owner.localPoint,
          );
          const moved: IAutoMovieVector3 = samplePhysicalRecoveryGoal({
            swing: state.swing,
            point: original,
            velocity: { x: 0, y: 0, z: 0 },
            height: body.balance.height,
            seconds,
          }).point;
          return [
            limb.bone,
            Vector3.add(point, Vector3.subtract(moved, original)),
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
