import { Quaternion, Vector3, integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanMountOffSupports } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * A mounted root and planted toe ball inherit their respective moving material
 * until their own release seconds.
 *
 * Scenarios:
 * 1. A translating, banking support carries the root and the foot's knee and
 *    actual rotation; the ball and hinge seed stay in the foot's coordinates.
 * 2. The foot leaves from its exact world pose while the seat keeps moving.
 * 3. The flight inherits both velocities and its destination stays fixed.
 * 4. Playback after either departure reads the prepared release only.
 */
export function test_motions_mounted_dismount_supports(): void {
  const start: number = 10;
  const reads: number[] = [];
  const material = (film: number): IAutoMovieRigidTransform => {
    reads.push(film);
    const t: number = film - start;
    return {
      position: { x: t, y: 0, z: 2 * t },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90 * t),
    };
  };
  const root: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 2 },
    rotation: Quaternion.identity(),
  };
  const seat: HumanMountOffSupports.IFrame = HumanMountOffSupports.frame(
    material,
    start,
    3,
    root,
  );
  const ankle: IAutoMovieVector3 = { x: 1, y: 2, z: 0 };
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    30,
  );
  const contact: IAutoMovieVector3 = { x: 0, y: 0, z: 0.1 };
  const seed: IAutoMovieSwivelSeed = { swivel: 17, branch: 1 };
  const foot: HumanMountOffSupports.IFoot = HumanMountOffSupports.foot(
    {
      point: ankle,
      rotation,
      bend: { x: 1, y: 2.5, z: 0 },
      contact,
      planted: true,
      seed,
    },
    HumanMountOffSupports.frame(material, start, 2, {
      position: ankle,
      rotation,
    }),
  );

  // A +90-degree bank sends (x,y,z) to (-y,x,z), then translates by (1,0,2).
  const halfway: HumanMountOffSupports.IFoot["end"] = foot.at(1);
  const toe: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const toeDirection: IAutoMovieVector3 = { x: 0.5, y: 0, z: Math.sqrt(3) / 2 };
  TestValidator.predicate(
    "seat and held foot keep the complete rigid placement and limb branch",
    seat.at(0) === root &&
      vclose(seat.at(1).position, { x: 0, y: 0, z: 4 }) &&
      vclose(halfway.point, { x: -1, y: 1, z: 2 }) &&
      vclose(halfway.bend, { x: -1.5, y: 1, z: 2 }) &&
      vclose(Quaternion.rotateVector(halfway.rotation, toe), toeDirection) &&
      vclose(
        Vector3.add(
          halfway.point,
          Quaternion.rotateVector(halfway.rotation, contact),
        ),
        { x: -0.95, y: 1, z: 2 + 0.05 * Math.sqrt(3) },
      ) &&
      halfway.contact === contact && halfway.seed === seed,
  );
  const count: number = reads.length;
  TestValidator.predicate(
    "the 180-degree bank is captured only at the real foot departure",
    vclose(foot.end.point, { x: 1, y: -2, z: 4 }) &&
      vclose(seat.end.position, { x: 4, y: 0, z: 8 }) &&
      foot.at(2) === foot.end && foot.at(3) === foot.end &&
      seat.at(3) === seat.end && seat.at(4) === seat.end &&
      reads.length === count,
  );

  // The ankle's release velocity is the translation plus omega cross the
  // rotated local ankle (-1,-2,0). A three-point backward derivative has
  // error at most h²/3 times the circular orbit's third derivative bound.
  const angular: number = Math.PI / 2;
  const velocity: IAutoMovieVector3 = { x: 1 + 2 * angular, y: -angular, z: 2 };
  const error: number =
    (angular ** 3 * Math.sqrt(5) * integrateMotionTrajectory.STEP ** 2) / 3;
  TestValidator.predicate(
    "departure reads the incoming linear and angular movement",
    vclose(foot.velocity, velocity, error) &&
      vclose(foot.spin, { x: 0, y: 0, z: angular }, 1e-9) &&
      reads.every((film: number): boolean => film <= start + 3),
  );
  const airborne: HumanMountOffSupports.Offset =
    HumanMountOffSupports.departure(foot, 1)!;
  const middle: IAutoMovieRigidTransform = airborne(0.5);
  const turn: number = (5 / 32) * angular;
  const forward: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  TestValidator.predicate(
    "the Hermite departure sends its motion forward and leaves the landing fixed",
    vclose(middle.position, Vector3.scale(velocity, 5 / 32), error) &&
      vclose(Quaternion.rotateVector(middle.rotation, forward), {
        x: Math.cos(turn),
        y: Math.sin(turn),
        z: 0,
      }) &&
      vclose(airborne(1).position, { x: 0, y: 0, z: 0 }) &&
      vclose(Quaternion.rotateVector(airborne(1).rotation, forward), forward) &&
      reads.length === count,
  );
}
