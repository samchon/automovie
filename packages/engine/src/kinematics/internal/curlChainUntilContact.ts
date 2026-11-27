import type {
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieJointPose,
  IAutoMoviePhysicalShape,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { bracketedCrossing } from "../../math/internal/bracketedCrossing";
import { AutoMovieEnginePhysics } from "../../physics/AutoMovieEnginePhysics";
import { physicalShapeHull } from "../../physics/internal/physicalShapeHull";
import { ROM_TOLERANCE } from "../../rom/constants/ROM_TOLERANCE";
import { AutoMovieEngineKinematics } from "../AutoMovieEngineKinematics";
import type { prepareSkeletonPoseResolution } from "./prepareSkeletonPoseResolution";
import { resolvePose } from "./resolvePose";

/**
 * Close articulated chains (fingers and thumb) around an object: each joint,
 * proximal first, flexes until a capsule of its chain first touches the
 * object's colliders or its flexion reaches the rig's range of motion, and the
 * next joint then continues from there.
 *
 * This is the closing rule of kinematic grasp execution in grasp planners: the
 * auto-grasp of Miller and Allen closes every joint of a hand at a set rate and
 * stops the joints proximal to a link once that link touches the object, while
 * the distal ones keep closing (Miller and Allen 2004, IEEE Robot. Autom. Mag.
 * 11(4):110). Here the joints of a chain close one at a time, proximal to
 * distal, which is the same stopping rule evaluated sequentially: joint `k`
 * turns its phalanx and every phalanx after it as a rigid unit, so it stops at
 * the first contact of any of them, and the joints after it close from that
 * state.
 *
 * Each phalanx is a capsule of the chain's `radius` from its joint to the next
 * joint of the chain, the last one to `tip` (a point in the distal bone's rest
 * frame relative to its joint). The gap of a phalanx is the exact signed
 * distance from its segment to each collider less the radius: the
 * segment-to-segment distance for spheres and capsules
 * (`closestPointsBetweenSegments`), and for boxes the minimum of the box's
 * signed distance along the segment, a convex function of the segment
 * parameter, found by golden-section search to 1e-9 of the segment. Contact is
 * a gap of zero or less.
 *
 * Every joint's flexion is searched from its current value upward in steps of
 * `step` degrees, the first step whose gap is not positive is bracketed and the
 * bracket closed to the width 30 bisections leave (`HALVINGS`), by false
 * position on the gap, which is continuous in the angle (`bracketedCrossing`),
 * and by bisection for whatever width that leaves; the joint keeps the
 * bracket's lower end, the last angle read with a positive gap, so a phalanx
 * stops touching the collider within that resolution and never inside it. A
 * joint already in contact does not move. A joint that meets nothing stops at
 * the flexion the skeleton's range of motion allows (`clampJointToSkeleton`),
 * so the result never needs a later clamp. Forward kinematics is the engine's
 * `resolvePose` with the same axes and rest frames, so the angles read the same
 * everywhere.
 *
 * The search is deterministic: a fixed step, a fixed bracket resolution and a
 * fixed chain and joint order. A step larger than the thinnest part of an
 * object can step a phalanx past it; the default of 1 degree moves a 0.1 m
 * phalanx tip less than 2 mm.
 *
 * @param input The rig, the pose to curl, the chains and the colliders.
 * @returns The curled pose and each chain's final angles and gap.
 * @throws {Error} When a chain names a bone the pose cannot resolve, the radius
 *   or step is not positive, or a collider is malformed.
 */
export namespace curlChainUntilContact {
  /** Execute proximal-first contact closure across the requested chains. */
  export function run(
    input: IAutoMovieCurlChainUntilContact.IInput,
  ): IAutoMovieCurlChainUntilContact.IResult {
    const step: number = input.step ?? 1;
    if (!(step > 0)) throw new Error("A curl step must be positive");
    for (const collider of input.colliders) validate(collider.shape);
    const distances: ReturnType<
      typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance
    >[] = input.colliders.map(
      (
        collider: IAutoMovieCurlChainUntilContact.ICollider,
      ): ReturnType<
        typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance
      > =>
        AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(
          collider.frame,
          collider.shape,
        ),
    );
    const operation: ReturnType<
      typeof AutoMovieEngineKinematics.preparePoseResolution
    > = AutoMovieEngineKinematics.preparePoseResolution();
    const joints: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
      input.pose.joints.map(
        (
          j: IAutoMovieJointPose,
        ): [AutoMovieHumanoidBone, IAutoMovieJointPose] => [j.bone, j],
      ),
    );
    const pose: () => IAutoMoviePose = (): IAutoMoviePose => ({
      ...input.pose,
      joints: [...joints.values()],
    });
    const reports: IAutoMovieCurlChainUntilContact.IChainResult[] = [];

    for (const chain of input.chains) {
      if (!(chain.radius > 0))
        throw new Error("A curled chain's radius must be positive");
      const flexion: number[] = [];
      const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
        chain.bones,
      );
      let fixed:
        | ReturnType<prepareSkeletonPoseResolution.IRig["preparePose"]>
        | undefined;
      const edited: AutoMovieHumanoidBone[] = [];

      // The gap of the phalanges from the k-th onward under the current angles
      // with joint k at a trial flexion.
      const gap: (k: number, angle: number) => number = (
        k: number,
        angle: number,
      ): number => {
        const bone: AutoMovieHumanoidBone = chain.bones[k]!;
        const previous: IAutoMovieJointPose | undefined = joints.get(bone);
        joints.set(bone, {
          bone,
          flexion: angle,
          abduction: previous?.abduction ?? 0,
          twist: previous?.twist ?? 0,
        });
        let resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
        if (input.resolution === undefined) {
          const frames: IAutoMovieResolvedBone[] = resolvePose(
            pose(),
            input.skeleton,
            input.jointAxes,
            input.restFrames,
            input.topology,
            operation,
          );
          resolved = new Map();
          for (const frame of frames) resolved.set(frame.bone, frame);
        } else if (fixed === undefined) {
          // Admit the first actual trial, after its original overwrite. Earlier
          // admission could expose an initial record that this trial replaces.
          fixed = input.resolution.preparePose(pose(), requested, operation);
          for (const name of joints.keys())
            if (requested.has(name)) edited.push(name);
          resolved = fixed.resolveMap([]);
        } else {
          // Existing records keep their global map positions; newly encountered
          // chain joints append there. Never manufacture absent future records.
          if (!edited.includes(bone)) edited.push(bone);
          const edits: IAutoMovieJointPose[] = [];
          for (const name of edited) {
            const joint: IAutoMovieJointPose | undefined = joints.get(name);
            if (joint !== undefined) edits.push(joint);
          }
          resolved = fixed.resolveMap(edits);
        }
        if (previous === undefined) joints.delete(bone);
        else joints.set(bone, previous);
        let least: number = Infinity;
        for (let i: number = k; i < chain.bones.length; i++) {
          const from: IAutoMovieResolvedBone | undefined = resolved.get(
            chain.bones[i]!,
          );
          if (from === undefined)
            throw new Error(
              `A curled chain needs the resolvable bone ${chain.bones[i]}`,
            );
          const next: AutoMovieHumanoidBone | undefined = chain.bones[i + 1];
          const to: IAutoMovieVector3 =
            next === undefined
              ? Vector3.add(
                  from.worldPosition,
                  Quaternion.rotateVector(from.worldRotation, chain.tip),
                )
              : (resolved.get(next)?.worldPosition ?? from.worldPosition);
          for (const distance of distances)
            least = Math.min(
              least,
              distance(from.worldPosition, to) - chain.radius,
            );
        }
        return least;
      };

      for (let k: number = 0; k < chain.bones.length; k++) {
        const bone: AutoMovieHumanoidBone = chain.bones[k]!;
        const current: IAutoMovieJointPose = joints.get(bone) ?? {
          bone,
          flexion: 0,
          abduction: 0,
          twist: 0,
        };
        const start: number = current.flexion ?? 0;
        // A bone without a declared range turns at most half a revolution, past
        // which a phalanx would fold back through its own parent.
        const limit: number = Math.min(
          start + 180,
          AutoMovieEngineKinematics.clampJointToSkeleton(
            { ...current, flexion: start + 180 },
            input.skeleton,
          ).flexion ?? start,
        );
        let angle: number = start;
        let open: number = gap(k, start);
        if (open > 0) {
          let lo: number = start;
          let hi: number | undefined;
          let closed: number = 0;
          for (
            let a: number = Math.min(limit, start + step);
            ;
            a = Math.min(limit, a + step)
          ) {
            const here: number = gap(k, a);
            if (here <= 0) {
              hi = a;
              closed = here;
              break;
            }
            lo = a;
            open = here;
            if (a >= limit) break;
          }
          if (hi !== undefined) {
            // The bracket [lo, hi] holds a positive gap at lo and a
            // non-positive one at hi, and is closed to the width `HALVINGS`
            // bisections would leave. The gap is continuous in the angle, so
            // false position closes it in fewer readings and bisection
            // whatever width that leaves (`bracketedCrossing`); the scan's two
            // end readings are not read again.
            lo = bracketedCrossing({
              f: (a: number): number => gap(k, a),
              past: (here: number): boolean => here <= 0,
              low: lo,
              high: hi,
              known: { low: open, high: closed },
              tolerance: (hi - lo) * 2 ** -HALVINGS,
            }).low;
          }
          angle = lo;
        }
        joints.set(bone, { ...current, bone, flexion: angle });
        flexion.push(angle);
      }
      const final: number = gap(0, joints.get(chain.bones[0]!)!.flexion ?? 0);
      reports.push({ bones: chain.bones, flexion, gap: final });
    }
    return { pose: pose(), chains: reports };
  }

  /** Companion types of {@link curlChainUntilContact}. */

  /**
   * How far a curled digit's angle may move with the limb that carries it,
   * degrees: a point the limb carries moves by no more than the limb's reach
   * times the joints' tolerance (`ROM_TOLERANCE`, in radians) when the limb's
   * chain is resolved to it, and a digit that closes on a contact follows the
   * hand by about as far at its tip, which at its lever (the length from the
   * joint to the digit's tip) turns it by this angle. A curl solves its own
   * contact far finer (a step bisected 30 times); this is the change a curled
   * digit shows when the limb's resolution moves the hand, not the curl's
   * precision.
   *
   * @param reach The limb's reach, metres: its two segments' lengths.
   * @param lever The joint's lever, metres: its length to the digit's tip.
   * @returns Degrees.
   */
  export function resolution(reach: number, lever: number): number {
    return (ROM_TOLERANCE * reach) / lever;
  }
}

/** Refuse a shape whose dimensions cannot give a distance. */
function validate(shape: IAutoMoviePhysicalShape): void {
  let ok: boolean;
  if (shape.kind === "sphere") ok = shape.radius > 0;
  else if (shape.kind === "capsule")
    ok = shape.radius > 0 && shape.halfLength >= 0;
  else if (shape.kind === "box")
    ok =
      shape.halfExtents.x > 0 &&
      shape.halfExtents.y > 0 &&
      shape.halfExtents.z > 0;
  else if (shape.kind === "hull")
    ok = physicalShapeHull(shape).faces.length >= 4;
  else {
    shape satisfies never;
    ok = false;
  }
  if (!ok)
    throw new Error(`A collider ${shape.id} has non-positive dimensions`);
}

/**
 * The bisections whose final bracket width a joint's contact search closes to:
 * a step of one degree to under a billionth of a degree, far finer than a
 * joint's tolerance, so the positive side kept is the contact's own angle.
 */
const HALVINGS: number = 30;
