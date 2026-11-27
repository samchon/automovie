import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEnginePhysicalTracking as Tracking } from "../AutoMovieEnginePhysicalTracking";
import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";

/*
 * The root's demand under an external wrench: the servo toward the root's goal
 * (`AutoMovieEnginePhysicalTracking.force`), with the body's weight compensated and
 * the total held within the strength's share of the maximum root force; and the
 * trunk servo's moment with the gravity compensation moment, each axis held
 * within the strength's share of the maximum root torque.
 * Parameter input: The simulation's settings, the simulated body, its root body,
 * the root's goal and intent, the tracking strength, the trunk servo's
 * moment, the gravity compensation moment about the root and the integration
 * duration, seconds.
 * Returns: The force, world newtons, and moment, world N m, to apply.
 */
export function physicalRootExternal(input: {
  settings: Pick<IAutoMoviePhysicalSimulationInput.IInput, "gravity" | "floor">;
  body: IAutoMoviePhysicalSimulationInput.IBody;
  base: AutoMovieEngineXpbdBody;
  rootGoal: IAutoMovieVector3;
  rootIntent: IAutoMovieSamplePhysicalTarget.IResult;
  strength: number;
  orientation: IAutoMovieVector3;
  gravity: IAutoMovieVector3;
  dt: number;
}): { force: IAutoMovieVector3; torque: IAutoMovieVector3 } {
  const { body, base, strength } = input;
  let force: IAutoMovieVector3 = Tracking.force(
    AutoMovieEngineVector3.subtract(input.rootGoal, base.translation()),
    AutoMovieEngineVector3.subtract(
      base.velocityAtPoint(base.translation()),
      input.rootIntent.velocity,
    ),
    body.profile.mass,
    body.rootStiffness * strength,
    body.rootDamping * strength,
    body.maximumRootForce * strength,
    input.dt,
  );
  if (body.compensateGravity) {
    force = AutoMovieEngineVector3.subtract(
      force,
      AutoMovieEngineVector3.scale(
        input.settings.gravity,
        body.profile.mass *
          strength *
          (body.mode.kind === "exaggerated" ? body.mode.gravity : 1),
      ),
    );
    const magnitude: number = AutoMovieEngineVector3.length(force);
    if (magnitude > body.maximumRootForce * strength)
      force = AutoMovieEngineVector3.scale(
        force,
        (body.maximumRootForce * strength) / magnitude,
      );
  }
  if (!body.rootTorque || !(strength > 0))
    return { force, torque: { x: 0, y: 0, z: 0 } };
  const torque: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    input.orientation,
    AutoMovieEngineVector3.scale(input.gravity, strength),
  );
  const limit: number = body.rootTorque.maximumTorque * strength;
  return {
    force,
    torque: {
      x: Math.max(-limit, Math.min(limit, torque.x)),
      y: Math.max(-limit, Math.min(limit, torque.y)),
      z: Math.max(-limit, Math.min(limit, torque.z)),
    },
  };
}
