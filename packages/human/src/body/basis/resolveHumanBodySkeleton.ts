import {
  DEFAULT_JOINT_AXES,
  type IAutoMovieJointAxes,
  type IAutoMovieRestFrame,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HUMAN_BODY_DISTAL_TWIST_BONES } from "../constants/HUMAN_BODY_DISTAL_TWIST_BONES";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBoneWorldRest } from "../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * Project the basis joints onto a rest skeleton from the shaped landmarks.
 *
 * Each bone's world frame follows the rule the basis was extracted under: Y from head to tail, X equal to `Y x F` where F is the flexion reference with its component along Y removed, Z equal to `X x Y`. That frame is the engine's default clinical basis, so `resolvePose` needs no per-bone axis table for non-humeral joints; what it needs is the per-side sign of abduction and twist and the clinical angle each axis rests at, which the basis hands over as `IAutoMovieRestFrame`s. The upper-arm Euler axes are held and its bone frame serves as the skin's rest orientation; the separate TT shoulder resolver computes its clinical goal after the girdle moves. A joint that declares `flexionAxis` flexes about that landmark line read in its rest frame instead of the frame's X, with the abduction axis the frame's Z made perpendicular to it and the twist axis completing the right-handed basis, and those joints' axes are returned for `resolvePose`. A bone whose twist is distal (`HUMAN_BODY_DISTAL_TWIST_BONES`, the forearms) returns its axes with that placement, so the forearm pronates about its own long axis at any elbow flexion; its swing-and-twist split in the skin (`distributeTwist`) is the same composition.
 *
 * The rest transform of a bone is its world frame expressed in its parent's: the root keeps its world frame and head as translation. Because the landmarks are read after the shape, the joint centres follow the body they sit in, which is what the source's joint cubes were for. A shaped zero/nonfinite bone direction or unavailable projected flexion reference refuses here, before a quaternion is constructed. Normalizing an arbitrary quaternion from a missing axis would not define the promised frame. Every nonzero finite projected reference retains the existing rule; no replacement direction or angular tolerance is introduced. The same precondition applies to the computed transverse basis and declared flexion/abduction/twist axes. A rounded nonzero projection parallel to Y still supplies no transverse frame, even if quaternion normalization could manufacture a unit rotation from those degenerate columns.
 *
 * @evidence contracts/common.md#principled-implementation Shaped landmark head/tail and projected flexion reference construct source-rule world frames, then parent-relative rest transforms and declared clinical signs/axes feed the shared engine skeleton.
 * @evidence contracts/common.md#clear-and-simple-design One parent-first joint traversal returns world rest records, optional axes, clinical frames and the ordinary skeleton consumed by all pose readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing finite nonzero computed directions refuse before invented replacement axes or quaternion normalization can disguise a degenerate frame; source-rule rig coordinates establish no independently measured anatomical frame.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre landmarks, frame construction, parent-relative rest, declared flexion lines, distal forearm twist, TT ownership and shaped degeneracy refusal.
 * @evidence contracts/performance.md#efficient-algorithms Each of J parent-ordered joints performs bounded vector/quaternion operations and map accesses, with fixed distal-bone membership work; retained skeleton/rest/frame data uses O(J) storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The world-rest map supplies already constructed parent frames, existing engine basis/quaternion primitives are reused, and callers may retain this complete shaped rig for a preparation instead of constructing a second skeleton.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned skeleton, rest map and frame/axis records belong to the caller and may share source landmark vectors under immutable-input ownership; local vectors expire and no external handles or pending tasks are acquired.
 */
export function resolveHumanBodySkeleton(
  basis: IAutoMovieHumanBodyBasis,
  landmarks: Record<string, IAutoMovieVector3>,
): IAutoMovieHumanBodySkeletonRig {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneWorldRest> =
    new Map<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneWorldRest>();
  const frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> =
    {};
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> = {};
  const bones: IAutoMovieHumanBodySkeletonRig["skeleton"]["bones"] =
    basis.joints.map(
      (
        joint: IAutoMovieHumanBodyBasis["joints"][number],
      ): IAutoMovieHumanBodySkeletonRig["skeleton"]["bones"][number] => {
        const head: IAutoMovieVector3 = landmarks[joint.head];
        const tail: IAutoMovieVector3 = landmarks[joint.tail];
        const direction: IAutoMovieVector3 = Vector3.subtract(tail, head);
        assertFrameDirection(direction, "bone direction", joint.bone);
        const y: IAutoMovieVector3 = Vector3.normalize(direction);
        const reference: IAutoMovieVector3 = Vector3.create(...joint.reference);
        const projected: IAutoMovieVector3 = Vector3.subtract(
          reference,
          Vector3.scale(y, Vector3.dot(reference, y)),
        );
        assertFrameDirection(
          projected,
          "projected flexion reference",
          joint.bone,
        );
        const f: IAutoMovieVector3 = Vector3.normalize(projected);
        const x: IAutoMovieVector3 = Vector3.cross(y, f);
        assertFrameDirection(x, "X frame direction", joint.bone);
        const z: IAutoMovieVector3 = Vector3.cross(x, y);
        assertFrameDirection(z, "Z frame direction", joint.bone);
        const rotation: ReturnType<typeof quaternionFromAutoMovieBasis> =
          quaternionFromAutoMovieBasis(x, y, z);
        rest.set(joint.bone, { position: head, rotation });
        if (joint.flexionAxis !== undefined) {
          // the declared line in the bone's rest frame, turned to flex the same
          // way as the frame's X; abduction keeps as close to Z as it can
          const declaredLine: IAutoMovieVector3 = Vector3.subtract(
            landmarks[joint.flexionAxis[1]],
            landmarks[joint.flexionAxis[0]],
          );
          assertFrameDirection(
            declaredLine,
            "declared flexion line",
            joint.bone,
          );
          const line: IAutoMovieVector3 = Quaternion.rotateVector(
            Quaternion.inverse(rotation),
            Vector3.normalize(declaredLine),
          );
          const flexion: IAutoMovieVector3 =
            line.x < 0 ? Vector3.scale(line, -1) : line;
          const transverse: IAutoMovieVector3 = Vector3.subtract(
            Vector3.create(0, 0, 1),
            Vector3.scale(flexion, flexion.z),
          );
          assertFrameDirection(transverse, "abduction projection", joint.bone);
          const abduction: IAutoMovieVector3 = Vector3.normalize(transverse);
          const twist: IAutoMovieVector3 = Vector3.cross(abduction, flexion);
          assertFrameDirection(twist, "twist direction", joint.bone);
          axes[joint.bone] = {
            flexion,
            abduction,
            twist,
          };
        }
        if (HUMAN_BODY_DISTAL_TWIST_BONES.includes(joint.bone))
          axes[joint.bone] = {
            ...(axes[joint.bone] ?? DEFAULT_JOINT_AXES),
            twistPlacement: "distal",
          };
        // The engine reads a document's clinical angle and turns the rig by
        // `(clinical - neutral) / sign`, so the measured rest angle travels here
        // and the empty pose is exactly the rest.
        const frame: IAutoMovieRestFrame = {
          flexion: {
            sign: joint.signs.flexion,
            neutral: joint.neutral.flexion,
          },
        };
        if (joint.signs.abduction !== null)
          frame.abduction = {
            sign: joint.signs.abduction,
            neutral: joint.neutral.abduction,
          };
        if (joint.signs.twist !== null)
          frame.twist = {
            sign: joint.signs.twist,
            neutral: joint.neutral.twist,
          };
        frames[joint.bone] = frame;
        const parent: IAutoMovieHumanBodyBoneWorldRest | null =
          joint.parent === null ? null : rest.get(joint.parent)!;
        const inverse: ReturnType<typeof Quaternion.inverse> =
          parent === null
            ? Quaternion.identity()
            : Quaternion.inverse(parent.rotation);
        return {
          bone: joint.bone,
          parent: joint.parent,
          rest: {
            translation:
              parent === null
                ? head
                : Quaternion.rotateVector(
                    inverse,
                    Vector3.subtract(head, parent.position),
                  ),
            rotation: Quaternion.multiply(inverse, rotation),
            scale: Vector3.create(1, 1, 1),
          },
          constraint: joint.constraint,
        };
      },
    );
  return {
    skeleton: { id: basis.id + "/skeleton", bones },
    rest,
    frames,
    axes,
  };
}

/** A computed frame direction must exist before normalization or quaternion construction. */
function assertFrameDirection(
  vector: IAutoMovieVector3,
  role: string,
  bone: AutoMovieHumanoidBone,
): void {
  if (
    ![vector.x, vector.y, vector.z].every(Number.isFinite) ||
    (vector.x === 0 && vector.y === 0 && vector.z === 0)
  )
    throw new Error(
      `Body shaped joint needs a finite nonzero ${role}: ${bone}`,
    );
}
