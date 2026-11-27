import { Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieFitHumanPhysicalStandingPose,
  IAutoMoviePhysicalJoint,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The widest foot turn searched when planting the hull soles, degrees. */
const PLANT_RANGE: number = 45;

/** The planting turn's resolution, degrees. */
const PLANT_RESOLUTION: number = 1e-9;

/** Below this gap between a knee's shank reach and the planted ankle, metres, the leg keeps its thigh. */
const REACH_ROUNDOFF: number = 1e-9;

/** Segment frames borrowed for one standing transfer. */
type Poses = Readonly<Record<string, IAutoMovieRigidTransform>>;

/**
 * Planting a standing Human's collider soles at the physics handoff
 * (`AutoMovieHumanPhysicalStandingPose.fit`): the turn that sets a foot's heel and
 * forefoot hulls on the floor, the drop that lets the legs reach the planted
 * ankles, and the shank swing that seeds the native fit.
 *
 * @evidence contracts/development/design.md#principled-representation Each reader takes the canonical profile's joints, world segment frames in metres and the foot's own hull vertices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Internal to the Human standing transfer; not exported from the package.
 */
export namespace HumanPhysicalSolePlant {
  /** One actual collider vertex in its carrier frame. */
  export interface IVertex {
    /** The segment which moves the vertex. */
    bone: string;

    /** The vertex relative to the carrier, metres. */
    local: IAutoMovieVector3;

    /** The supporting part of the foot when the profile names it. */
    region?: "heel" | "forefoot";
  }

  /**
   * The foot turned in the direction of the given axis (the ankle's flexion
   * axis) about its forefoot's bearing point until the lowest heel and
   * forefoot hull points share a height, then set down so they lie on the
   * floor. The bearing point keeps its horizontal place.
   */
  export function plant(
    pose: IAutoMovieRigidTransform,
    own: readonly IVertex[],
    floor: number,
    axis: IAutoMovieVector3,
  ): IAutoMovieRigidTransform | undefined {
    const at = (
      placed: IAutoMovieRigidTransform,
      region: NonNullable<IVertex["region"]>,
    ): number =>
      Math.min(
        ...own
          .filter((point: IVertex): boolean => point.region === region)
          .map(
            (point: IVertex): number =>
              AutoMovieEnginePhysics.physicalSupportPoint(placed, point.local).y,
          ),
      );
    const pivot: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalSupportPoint(
      pose,
      lowest(own, { [own[0]!.bone]: pose }, "forefoot")!.local,
    );
    const turned = (degrees: number): IAutoMovieRigidTransform => {
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        axis,
        degrees,
      );
      return {
        position: Vector3.add(
          pivot,
          Quaternion.rotateVector(turn, Vector3.subtract(pose.position, pivot)),
        ),
        rotation: Quaternion.multiply(turn, pose.rotation),
      };
    };
    const gap = (degrees: number): number => {
      const placed: IAutoMovieRigidTransform = turned(degrees);
      return at(placed, "heel") - at(placed, "forefoot");
    };

    // The heel's height over the forefoot changes sign within the searched
    // turn for a foot whose two regions both lie under the ankle.
    const start: number = gap(0);
    const end: number =
      [-PLANT_RANGE, PLANT_RANGE].find(
        (degrees: number): boolean =>
          Math.sign(gap(degrees)) !== Math.sign(start),
      ) ?? Number.NaN;
    if (!Number.isFinite(end)) return start === 0 ? pose : undefined;
    let near: number = 0;
    let far: number = end;
    while (Math.abs(far - near) > PLANT_RESOLUTION) {
      const middle: number = (near + far) / 2;
      if (Math.sign(gap(middle)) === Math.sign(start)) near = middle;
      else far = middle;
    }
    const placed: IAutoMovieRigidTransform = turned(far);
    const lift: number =
      floor - Math.min(at(placed, "heel"), at(placed, "forefoot"));
    return {
      position: { ...placed.position, y: placed.position.y + lift },
      rotation: placed.rotation,
    };
  }

  /**
   * How far a body must be set straight down for its knee to stand a shank's
   * length from the ankle of a planted foot, metres: the smaller root, so the
   * shank stays as near its authored line as the planted ankle allows; NaN
   * when no drop reaches it.
   */
  export function lowering(
    profile: IAutoMovieFitHumanPhysicalStandingPose.IInput["profile"],
    poses: Poses,
    side: "left" | "right",
    foot: IAutoMovieRigidTransform,
  ): number {
    const knee: IAutoMovieVector3 = anchor(profile, poses, `${side}LowerLeg`);
    const ankle: IAutoMovieVector3 = anchor(profile, poses, `${side}Foot`);
    const target: IAutoMovieVector3 = anchor(
      profile,
      { ...poses, [`${side}Foot`]: foot },
      `${side}Foot`,
    );
    const shank: number = Vector3.length(Vector3.subtract(knee, ankle));
    const offset: IAutoMovieVector3 = Vector3.subtract(knee, target);

    // |offset - drop ŷ| = shank.
    const discriminant: number =
      offset.y * offset.y - (Vector3.dot(offset, offset) - shank * shank);
    return discriminant < 0 ? Number.NaN : offset.y - Math.sqrt(discriminant);
  }

  /** A joint's place in the world, read on its child segment. */
  function anchor(
    profile: IAutoMovieFitHumanPhysicalStandingPose.IInput["profile"],
    poses: Poses,
    child: string,
  ): IAutoMovieVector3 {
    return AutoMovieEnginePhysics.physicalSupportPoint(
      poses[child]!,
      profile.joints.find(
        (joint: IAutoMoviePhysicalJoint): boolean => joint.child === child,
      )!.childFrame.position,
    );
  }

  /**
   * Seed one leg to a planted foot from a lowered body: the thigh kept where
   * the knee still stands a shank's length from the planted ankle, which the
   * body's drop gives the leg that needed it most; a leg the drop brought
   * nearer bends its knee forward, in the plane of its current bend, by the
   * law of cosines. The shank then turns by its shortest arc to the ankle and
   * the toes ride with the foot. False when the hip cannot reach the ankle.
   */
  export function swing(
    profile: IAutoMovieFitHumanPhysicalStandingPose.IInput["profile"],
    poses: Record<string, IAutoMovieRigidTransform>,
    side: "left" | "right",
    foot: IAutoMovieRigidTransform,
  ): boolean {
    const upper: string = `${side}UpperLeg`;
    const lower: string = `${side}LowerLeg`;
    const ankleBone: string = `${side}Foot`;
    const toes: string = `${side}Toes`;
    const hip: IAutoMovieVector3 = anchor(profile, poses, upper);
    let knee: IAutoMovieVector3 = anchor(profile, poses, lower);
    let ankle: IAutoMovieVector3 = anchor(profile, poses, ankleBone);
    const target: IAutoMovieVector3 = anchor(
      profile,
      { ...poses, [ankleBone]: foot },
      ankleBone,
    );
    const thigh: number = Vector3.length(Vector3.subtract(knee, hip));
    const shank: number = Vector3.length(Vector3.subtract(ankle, knee));
    if (
      Math.abs(Vector3.length(Vector3.subtract(target, knee)) - shank) >
      REACH_ROUNDOFF
    ) {
      const reach: IAutoMovieVector3 = Vector3.subtract(target, hip);
      const distance: number = Vector3.length(reach);
      if (!(distance > 0) || distance > thigh + shank) return false;
      const axis: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
      const bend: IAutoMovieVector3 = Vector3.subtract(knee, hip);
      const lift: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(bend, Vector3.scale(axis, Vector3.dot(bend, axis))),
      );
      const angle: number = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (thigh * thigh + distance * distance - shank * shank) /
              (2 * thigh * distance),
          ),
        ),
      );
      const bent: IAutoMovieVector3 = Vector3.add(
        hip,
        Vector3.add(
          Vector3.scale(axis, thigh * Math.cos(angle)),
          Vector3.scale(lift, thigh * Math.sin(angle)),
        ),
      );
      const turnUpper: IAutoMovieQuaternion = AutoMovieEngineMath.rotationBetween(
        bend,
        Vector3.subtract(bent, hip),
      );
      poses[upper] = {
        position: Vector3.add(
          hip,
          Quaternion.rotateVector(
            turnUpper,
            Vector3.subtract(poses[upper]!.position, hip),
          ),
        ),
        rotation: Quaternion.multiply(turnUpper, poses[upper]!.rotation),
      };
      poses[lower] = {
        position: Vector3.add(
          bent,
          Quaternion.rotateVector(
            turnUpper,
            Vector3.subtract(poses[lower]!.position, knee),
          ),
        ),
        rotation: Quaternion.multiply(turnUpper, poses[lower]!.rotation),
      };
      ankle = Vector3.add(
        bent,
        Quaternion.rotateVector(turnUpper, Vector3.subtract(ankle, knee)),
      );
      knee = bent;
    }
    const turnLower: IAutoMovieQuaternion = AutoMovieEngineMath.rotationBetween(
      Vector3.subtract(ankle, knee),
      Vector3.subtract(target, knee),
    );
    const toesLocal: IAutoMovieRigidTransform = {
      position: Quaternion.rotateVector(
        Quaternion.inverse(poses[ankleBone]!.rotation),
        Vector3.subtract(poses[toes]!.position, poses[ankleBone]!.position),
      ),
      rotation: Quaternion.multiply(
        Quaternion.inverse(poses[ankleBone]!.rotation),
        poses[toes]!.rotation,
      ),
    };
    poses[lower] = {
      position: Vector3.add(
        knee,
        Quaternion.rotateVector(
          turnLower,
          Vector3.subtract(poses[lower]!.position, knee),
        ),
      ),
      rotation: Quaternion.multiply(turnLower, poses[lower]!.rotation),
    };
    poses[ankleBone] = foot;
    poses[toes] = {
      position: Vector3.add(
        foot.position,
        Quaternion.rotateVector(foot.rotation, toesLocal.position),
      ),
      rotation: Quaternion.multiply(foot.rotation, toesLocal.rotation),
    };
    return true;
  }

  /** Choose one actual lowest vertex in the given anatomical region. */
  export function lowest(
    points: readonly IVertex[],
    poses: Poses,
    region: NonNullable<IVertex["region"]>,
  ): IVertex | undefined {
    let result: IVertex | undefined;
    let height: number = Infinity;
    for (const point of points) {
      if (point.region !== region) continue;
      const pose: IAutoMovieRigidTransform = poses[point.bone]!;
      const y: number =
        pose.position.y + Quaternion.rotateVectorY(pose.rotation, point.local);
      if (y < height) {
        result = point;
        height = y;
      }
    }
    return result;
  }
}
