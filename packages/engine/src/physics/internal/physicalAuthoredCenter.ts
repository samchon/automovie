import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/*
 * The authored pose's centre of mass and its velocity, world: each segment's
 * centre of mass carried by its sampled authored pose, p + R c, and moving with
 * its sampled linear and angular velocity, v + w x (R c), weighted by the
 * segment's share of the body's mass.
 * Parameter profile: The body's provider profile.
 * Parameter goals: The authored targets sampled this substep, by bone.
 * Returns: The centre, metres, and its velocity, metres per second.
 */
export function physicalAuthoredCenter(
  profile: IAutoMoviePhysicalProfile,
  goals: Readonly<Record<string, IAutoMovieSamplePhysicalTarget.IResult>>,
): { center: IAutoMovieVector3; velocity: IAutoMovieVector3 } {
  let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of profile.segments) {
    const goal: IAutoMovieSamplePhysicalTarget.IResult = goals[segment.bone]!;
    const arm: IAutoMovieVector3 = Quaternion.rotateVector(
      goal.pose.rotation,
      segment.centerOfMass,
    );
    const share: number = segment.mass / profile.mass;
    center = Vector3.add(
      center,
      Vector3.scale(Vector3.add(goal.pose.position, arm), share),
    );
    velocity = Vector3.add(
      velocity,
      Vector3.scale(
        Vector3.add(goal.velocity, Vector3.cross(goal.angularVelocity, arm)),
        share,
      ),
    );
  }
  return { center, velocity };
}
