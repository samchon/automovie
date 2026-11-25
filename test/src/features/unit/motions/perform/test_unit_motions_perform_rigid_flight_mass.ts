import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { poseBones, prepareRigidFlightMass } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../../internal/fixtures/standingPerformanceState";

/**
 * How far a combined mass or centre may stand from the hand-summed one: sums of
 * some twenty segment masses and metre offsets, far above their rounding.
 */
const SUM: number = 1e-9;

/**
 * `prepareRigidFlightMass` folds every mass segment below joints that do not
 * move into its nearest moving ancestor, in that ancestor's frame, and admits a
 * later pose only while every fixed joint keeps its coordinates.
 *
 * Scenarios, on a stored person's standing pose:
 *
 * 1. With every bone moving nothing folds, and nothing is prepared.
 * 2. With the hips alone moving, every segment folds into the hips: one segment
 *    of the whole mass, its centre the mass-weighted mean of the segments'
 *    world centres taken into the hips' frame.
 * 3. With the left hand and everything below it fixed, they fold into the left
 *    forearm: the other segments are kept as they were, the forearm's mass
 *    gains theirs, and the total is unchanged.
 * 4. Without the carrier's frame nothing is prepared.
 * 5. The pose itself matches; a fixed joint's flexion changed, a joint dropped or
 *    two joints swapped do not; a moving joint's change does.
 */
export async function test_unit_motions_perform_rigid_flight_mass(): Promise<void> {
  const { context } = await standingPerformanceState();
  const body: IAutoMovieMotionHumanBody = context.body;
  const pose: IAutoMoviePose = context.entry.pose;
  const frames: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, pose);
  const bones: AutoMovieHumanoidBone[] = body.skeleton.bones.map(
    (bone) => bone.bone,
  );
  const total: number = body.massModel.segments.reduce(
    (sum: number, segment): number => sum + segment.mass,
    0,
  );

  // 1. Nothing folds.
  TestValidator.predicate(
    "every bone moving",
    prepareRigidFlightMass(body, pose, frames, new Set(bones)) === undefined,
  );

  // 2. Everything folds into the hips.
  const hips: prepareRigidFlightMass.IPrepared = prepareRigidFlightMass(
    body,
    pose,
    frames,
    new Set<AutoMovieHumanoidBone>(["hips"]),
  )!;
  const carrier: IAutoMovieResolvedBone = frames.get("hips")!;
  let weighted: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const segment of body.massModel.segments) {
    const frame: IAutoMovieResolvedBone = frames.get(segment.bone)!;
    weighted = Vector3.add(
      weighted,
      Vector3.scale(
        Vector3.add(
          frame.worldPosition,
          Quaternion.rotateVector(frame.worldRotation, segment.point),
        ),
        segment.mass,
      ),
    );
  }
  const centre: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(carrier.worldRotation),
    Vector3.subtract(Vector3.scale(weighted, 1 / total), carrier.worldPosition),
  );
  const only = hips.model.segments[0]!;
  TestValidator.predicate(
    "the whole body folds into the hips",
    hips.model.segments.length === 1 &&
      only.bone === "hips" &&
      Math.abs(only.mass - total) <= SUM &&
      Math.abs(hips.model.mass - total) <= SUM &&
      Vector3.distance(only.point, centre) <= SUM,
  );

  // 3. The left hand folds into the forearm.
  const parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map(body.skeleton.bones.map((bone) => [bone.bone, bone.parent]));
  const below = (bone: AutoMovieHumanoidBone): boolean => {
    for (
      let at: AutoMovieHumanoidBone | null | undefined = bone;
      at !== null && at !== undefined;
      at = parents.get(at)
    )
      if (at === "leftHand") return true;
    return false;
  };
  const hand: prepareRigidFlightMass.IPrepared = prepareRigidFlightMass(
    body,
    pose,
    frames,
    new Set(bones.filter((bone) => !below(bone))),
  )!;
  const folded = body.massModel.segments.filter((segment) =>
    below(segment.bone),
  );
  const forearm = body.massModel.segments.find(
    (segment) => segment.bone === "leftLowerArm",
  )!;
  const kept = body.massModel.segments.filter(
    (segment) => !below(segment.bone) && segment.bone !== "leftLowerArm",
  );
  const combined = hand.model.segments.find(
    (segment) => segment.bone === "leftLowerArm",
  )!;
  TestValidator.predicate(
    "the hand folds into the forearm",
    folded.length > 0 &&
      hand.model.segments.length === kept.length + 1 &&
      kept.every((segment) => hand.model.segments.includes(segment)) &&
      Math.abs(
        combined.mass -
          forearm.mass -
          folded.reduce((sum: number, segment): number => sum + segment.mass, 0),
      ) <= SUM &&
      Math.abs(hand.model.mass - total) <= SUM,
  );

  // 4. A missing carrier frame.
  const blind: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    frames,
  );
  blind.delete("hips");
  TestValidator.predicate(
    "no carrier frame",
    prepareRigidFlightMass(
      body,
      pose,
      blind,
      new Set<AutoMovieHumanoidBone>(["hips"]),
    ) === undefined,
  );

  // 5. Matching poses.
  const fixedAt: number = pose.joints.findIndex(
    (joint) => joint.bone !== "hips",
  );
  const bent: IAutoMoviePose = {
    ...pose,
    joints: pose.joints.map((joint, i) =>
      i === fixedAt ? { ...joint, flexion: (joint.flexion ?? 0) + 0.1 } : joint,
    ),
  };
  const swapped: IAutoMoviePose = {
    ...pose,
    joints: [pose.joints[1]!, pose.joints[0]!, ...pose.joints.slice(2)],
  };
  const movingAt: number = pose.joints.findIndex(
    (joint) => joint.bone === "hips",
  );
  TestValidator.predicate(
    "admitted poses keep the fixed coordinates",
    hips.matches(pose) &&
      !hips.matches(bent) &&
      !hips.matches({ ...pose, joints: pose.joints.slice(1) }) &&
      !hips.matches(swapped) &&
      (movingAt < 0 ||
        hips.matches({
          ...pose,
          joints: pose.joints.map((joint, i) =>
            i === movingAt ? { ...joint, twist: (joint.twist ?? 0) + 0.2 } : joint,
          ),
        })),
  );
}
