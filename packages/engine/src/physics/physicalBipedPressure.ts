import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalIcpController } from "./physicalIcpController";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";

/**
 * The biped's centre of pressure and centroidal moment pivot this update, from
 * IHMC's capture-point feedback controller (`physicalIcpController`, Zulu's
 * parameters) in the stance's demand (`physicalStanceBalance.demand`).
 *
 * The controller's inputs are IHMC's (`LinearMomentumRateControlModule
 * .computeICPController` l.540-571): the support polygon of the feet in
 * contact, their planted outlines joined; the plain capture point xi = c + v /
 * omega, the angular capture point being off by default
 * (`WalkingControllerParameters.useAngularCapturePointForFeedback`); and the
 * plan's capture point and rate, which the biped's plan phase writes
 * (`physicalBipedPlan`): the recovery plan's while one runs, else the authored
 * motion's, the authored motion playing the planner's role. A demand given no
 * plan, as a recording made before the plan existed, takes the authored centre
 * of mass's capture point at rest. Its pivot sets the linear momentum and its
 * centre of pressure the support's moment about it; the trunk's servo is left
 * to the root task's spin row, as IHMC leaves the chest to the whole-body
 * solve.
 *
 * Points are mapped to the controller's frame as (world x, world z), which a
 * rotation and reflection of the floor leave valid: the controller's tasks are
 * symmetric and its rows are built from a hull in the same coordinates.
 *
 * @param input The controller's state, the planted stance feet's outlines,
 *   world metres, the plan's capture point and rate, world x and z, if any, the
 *   authored centre of mass and velocity, the actual centre of mass and its
 *   velocity, the pendulum's rate, per second, the controller's update period,
 *   seconds, and the floor's height.
 * @returns The centre of pressure and pivot on the floor, world metres, whether
 *   the program was solved, and the controller's next state.
 */
export function physicalBipedPressure(input: {
  state: physicalIcpController.IState;
  outlines: readonly (readonly IAutoMovieVector3[])[];
  desired?: {
    position: { x: number; z: number };
    velocity: { x: number; z: number };
  };
  authored: { center: IAutoMovieVector3; velocity: IAutoMovieVector3 };
  center: IAutoMovieVector3;
  velocity: IAutoMovieVector3;
  omega: number;
  dt: number;
  floor: number;
}): physicalBipedPressure.IResult {
  const map = (p: { x: number; z: number }): Polygon.IPoint => ({
    x: p.x,
    y: p.z,
  });
  const support: Polygon.IPoint[] = Polygon.hull(
    input.outlines.flatMap(
      (outline: readonly IAutoMovieVector3[]): Polygon.IPoint[] =>
        outline.map(map),
    ),
  );
  const result: physicalIcpController.IResult = physicalIcpController({
    state: input.state,
    support,
    desired: input.desired
      ? map(input.desired.position)
      : {
          x: input.authored.center.x + input.authored.velocity.x / input.omega,
          y: input.authored.center.z + input.authored.velocity.z / input.omega,
        },
    desiredVelocity: input.desired
      ? map(input.desired.velocity)
      : { x: 0, y: 0 },
    capture: {
      x: input.center.x + input.velocity.x / input.omega,
      y: input.center.z + input.velocity.z / input.omega,
    },
    center: map(input.center),
    omega: input.omega,
    dt: input.dt,
  });
  return {
    pressure: { x: result.cop.x, y: input.floor, z: result.cop.y },
    pivot: { x: result.cmp.x, y: input.floor, z: result.cmp.y },
    converged: result.converged,
    state: result.state,
  };
}

/** What {@link physicalBipedPressure} returns. */
export namespace physicalBipedPressure {
  /** The controller's command and next state. */
  export interface IResult {
    /** The commanded centre of pressure, world metres, on the floor. */
    pressure: IAutoMovieVector3;

    /** The commanded centroidal moment pivot, world metres, on the floor. */
    pivot: IAutoMovieVector3;

    /** Whether the controller's program was solved this update. */
    converged: boolean;

    /** The controller's next state. */
    state: physicalIcpController.IState;
  }
}
