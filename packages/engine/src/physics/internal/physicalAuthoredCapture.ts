import type { AutoMovieEnginePhysicalBalanceTypes } from "../AutoMovieEnginePhysicalBalanceTypes";
import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { physicalSupportPoint } from "./physicalSupportPoint";

/*
 * The authored capture point and its rate, the command the plan phase follows
 * where IHMC follows its planner's (`physicalBalancePlan`): xi_a = c_a + c_a' /
 * omega, rate c_a' + c_a'' / omega, from the authored centre of mass
 * (`physicalAuthoredCapture.center`), its velocity and acceleration
 * (`trackPhysicalWorld`); without them, as in a recording made before they were
 * read, the centre at rest.
 * Parameter sense: The body's readings.
 * Parameter state: The recovery's state.
 * Parameter omega: The pendulum's rate, per second.
 * Returns: The capture point and its rate, world x and z.
 */
export function physicalAuthoredCapture(
  sense: physicalAuthoredCapture.ISense,
  state: Readonly<IAutoMoviePhysicalRecoveryState>,
  omega: number,
): physicalAuthoredCapture.IDesired {
  const center: IAutoMovieVector3 = physicalAuthoredCapture.center(
    sense,
    state,
  );
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const velocity: IAutoMovieVector3 = sense.command?.velocity ?? zero;
  const acceleration: IAutoMovieVector3 = sense.command?.acceleration ?? zero;
  return {
    position: {
      x: center.x + velocity.x / omega,
      z: center.z + velocity.z / omega,
    },
    velocity: {
      x: velocity.x + acceleration.x / omega,
      z: velocity.z + acceleration.z / omega,
    },
  };
}

/*
 * The authored command's types and its centre.
 */
export namespace physicalAuthoredCapture {
  /*
   * A planned capture point and its rate.
   */
  export type IDesired = NonNullable<
    IAutoMoviePhysicalRecoveryState["desired"]
  >;

  /*
   * What the capture reads of the body's readings.
   */
  export type ISense = Pick<
    AutoMovieEnginePhysicalBalanceTypes.ISense,
    "command" | "targets"
  > & {
    profile: Pick<AutoMovieEnginePhysicalBalanceTypes.ISense["profile"], "segments" | "mass">;
  };

  /*
   * The authored centre of mass moved by the landed root offset, as the
   * authored goals are: the command's (`trackPhysicalWorld`), else the authored
   * segments' centre.
   * Parameter sense: The body's readings.
   * Parameter state: The recovery's state.
   * Returns: The centre, world metres.
   */
  export function center(
    sense: ISense,
    state: Readonly<IAutoMoviePhysicalRecoveryState>,
  ): IAutoMovieVector3 {
    const offset: IAutoMovieVector3 = state.rootOffset ?? { x: 0, y: 0, z: 0 };
    const authored: IAutoMovieVector3 =
      sense.command?.center ??
      sense.profile.segments.reduce(
        (
          sum: IAutoMovieVector3,
          segment: IAutoMoviePhysicalSegment,
        ): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(
            sum,
            AutoMovieEngineVector3.scale(
              physicalSupportPoint(
                sense.targets[segment.bone]!,
                segment.centerOfMass,
              ),
              segment.mass / sense.profile.mass,
            ),
          ),
        { x: 0, y: 0, z: 0 },
      );
    return AutoMovieEngineVector3.add(authored, offset);
  }
}
