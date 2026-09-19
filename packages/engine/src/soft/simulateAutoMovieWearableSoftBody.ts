import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieSoftBodyDomain, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../math/Quaternion";
import { simulateSoftBodyWithBoundaries } from "./simulateSoftBodyWithBoundaries";
import { IAutoMovieSoftBodyBoundarySample } from "./IAutoMovieSoftBodyBoundarySample";
import { IAutoMovieWearableSoftFrame } from "./IAutoMovieWearableSoftFrame";
import { IAutoMovieWearableSoftResult } from "./IAutoMovieWearableSoftResult";

/**
 * Resolve and simulate one explicitly admitted moving soft-body domain.
 *
 * Authored moving anchors and body capsules come directly from the domain. The
 * caller supplies an immutable primary-motion snapshot for every absolute soft
 * step; this function never samples an animation cursor, selects a subject, or
 * substitutes an origin for a missing target. Calling this API is the explicit
 * `live deterministic` choice. The existing {@link simulateSoftBody} path is
 * still the byte-compatible static choice.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Drives soft state from same-clock primary motion.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Implements the explicit live deterministic boundary path.
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-author-solver Consumes the author-selected live deterministic solver tier.
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-claim-boundary Reports only bounded proxy state and cost.
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-static-compatibility Leaves the established static solver as a separate explicit path.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Projects contacts after each fixed-step primary boundary is resolved.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Resolves explicit node and actor-bone attachment targets.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-determinism-compatibility Consumes complete immutable boundary snapshots for deterministic seek.
 */
export const simulateAutoMovieWearableSoftBody = (props: {
  /** Authored domain carrying static or moving anchors and colliders. */
  domain: IAutoMovieSoftBodyDomain;
  /** Absolute target step. */
  step: number;
  /** Complete primary-motion snapshots from zero through the target step. */
  frames: readonly IAutoMovieWearableSoftFrame[];
  /** Zero-based selected expensive-subject slot. */
  subjectIndex: number;
  /** Declared maximum simultaneous wearable subjects. */
  maxSubjects: number;
  /** Optional named static boundary state. */
  state?: string | null;
}): IAutoMovieWearableSoftResult => {
  assertAdmission(props.subjectIndex, props.maxSubjects);
  if (!Number.isSafeInteger(props.step) || props.step < 0)
    throw new Error("wearable soft step must be a non-negative integer");
  if (props.frames.length !== props.step + 1)
    throw new Error(
      `wearable soft solve needs primary-motion frames 0 through ${props.step}`,
    );

  const movingAnchors = props.domain.anchors.filter(
    (anchor) => anchor.binding !== undefined,
  );
  const bodyCapsules = props.domain.colliders.filter(
    (collider) => collider.kind === "body-capsule",
  );
  if (movingAnchors.length === 0 && bodyCapsules.length === 0)
    throw new Error(
      `soft body "${props.domain.id}" declares no moving boundary; use the static solver`,
    );

  const boundaries: IAutoMovieSoftBodyBoundarySample[] = props.frames.map(
    (frame, index) => {
      if (frame.step !== index)
        throw new Error(
          `wearable soft frame[${index}] must name absolute step ${index}`,
        );
      const nodes = keyed(frame.nodes, (node) => node.node, "node", index);
      const actors = keyed(
        frame.actors,
        (actor) => actor.actor,
        "actor",
        index,
      );
      return {
        step: index,
        anchors: movingAnchors.map((anchor) => {
          const binding = anchor.binding!;
          if (binding.kind === "node") {
            const node = nodes.get(binding.node);
            if (node === undefined)
              throw new Error(
                `wearable soft frame[${index}] is missing node "${binding.node}"`,
              );
            return {
              particle: anchor.particle,
              position: resolveLocalPoint(
                node.worldPosition,
                node.worldRotation,
                binding.offset,
              ),
            };
          }
          const actor = actors.get(binding.actor);
          if (actor === undefined)
            throw new Error(
              `wearable soft frame[${index}] is missing actor "${binding.actor}"`,
            );
          const bone = resolvedBone(actor.bones, binding.bone, index);
          return {
            particle: anchor.particle,
            position: resolveLocalPoint(
              bone.worldPosition,
              bone.worldRotation,
              binding.offset,
            ),
          };
        }),
        capsules: bodyCapsules.map((collider) => {
          const actor = actors.get(collider.actor);
          if (actor === undefined)
            throw new Error(
              `wearable soft frame[${index}] is missing capsule actor "${collider.actor}"`,
            );
          return {
            id: collider.id,
            from: {
              ...resolvedBone(actor.bones, collider.capsule.from, index)
                .worldPosition,
            },
            to: {
              ...resolvedBone(actor.bones, collider.capsule.to, index)
                .worldPosition,
            },
            radius: collider.capsule.radius,
          };
        }),
      };
    },
  );
  return {
    state: simulateSoftBodyWithBoundaries(
      props.domain,
      props.step,
      boundaries,
      props.state ?? null,
    ),
    budget: {
      subjectIndex: props.subjectIndex,
      maxSubjects: props.maxSubjects,
      anchorsPerStep: movingAnchors.length,
      capsulesPerStep: bodyCapsules.length,
      boundaryRecords:
        boundaries.length * (movingAnchors.length + bodyCapsules.length),
    },
  };
};

const keyed = <Entry>(
  entries: readonly Entry[],
  key: (entry: Entry) => string,
  label: string,
  step: number,
): ReadonlyMap<string, Entry> => {
  const output = new Map<string, Entry>();
  for (const entry of entries) {
    const id = key(entry);
    if (id.trim().length === 0 || output.has(id))
      throw new Error(
        `wearable soft frame[${step}] ${label} ids must be non-blank and unique`,
      );
    output.set(id, entry);
  }
  return output;
};

const resolvedBone = (
  bones: readonly IAutoMovieResolvedBone[],
  name: AutoMovieHumanoidBone,
  step: number,
): IAutoMovieResolvedBone => {
  let resolved: IAutoMovieResolvedBone | undefined;
  for (const bone of bones)
    if (bone.bone === name) {
      if (resolved !== undefined)
        throw new Error(`wearable soft frame[${step}] repeats bone "${name}"`);
      resolved = bone;
    }
  if (resolved === undefined)
    throw new Error(`wearable soft frame[${step}] is missing bone "${name}"`);
  return resolved;
};

const resolveLocalPoint = (
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  offset: IAutoMovieVector3,
): IAutoMovieVector3 => {
  assertVector(position, "moving subject position");
  assertVector(offset, "moving subject local offset");
  assertQuaternion(rotation, "moving subject rotation");
  const rotated = Quaternion.rotateVector(rotation, offset);
  return {
    x: position.x + rotated.x,
    y: position.y + rotated.y,
    z: position.z + rotated.z,
  };
};

const assertQuaternion = (value: IAutoMovieQuaternion, label: string): void => {
  if ([value.x, value.y, value.z, value.w].every(Number.isFinite) === false)
    throw new Error(`${label} must contain finite coordinates`);
  const squaredLength =
    value.x * value.x +
    value.y * value.y +
    value.z * value.z +
    value.w * value.w;
  if (Math.abs(squaredLength - 1) > 1e-6)
    throw new Error(`${label} must be unit length`);
};

const assertAdmission = (subjectIndex: number, maxSubjects: number): void => {
  if (!Number.isSafeInteger(maxSubjects) || maxSubjects < 0)
    throw new Error(
      "wearable soft max subjects must be a non-negative integer",
    );
  if (!Number.isSafeInteger(subjectIndex) || subjectIndex < 0)
    throw new Error(
      "wearable soft subject index must be a non-negative integer",
    );
  if (subjectIndex >= maxSubjects)
    throw new Error(
      `wearable soft subject index ${subjectIndex} exceeds the declared ${maxSubjects}-subject budget`,
    );
};

const assertVector = (value: IAutoMovieVector3, label: string): void => {
  if ([value.x, value.y, value.z].every(Number.isFinite) === false)
    throw new Error(`${label} must contain finite coordinates`);
};
