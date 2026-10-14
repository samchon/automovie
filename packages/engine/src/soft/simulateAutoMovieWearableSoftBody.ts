import {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieSoftAnchor,
  IAutoMovieSoftAnchorBinding,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftCollider,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieSoftBodyBoundarySample } from "./IAutoMovieSoftBodyBoundarySample";
import { IAutoMovieSoftNodeTransform } from "./IAutoMovieSoftNodeTransform";
import { IAutoMovieWearableSoftActorPose } from "./IAutoMovieWearableSoftActorPose";
import { IAutoMovieWearableSoftFrame } from "./IAutoMovieWearableSoftFrame";
import { IAutoMovieWearableSoftResult } from "./IAutoMovieWearableSoftResult";
import { simulateSoftBodyWithBoundaries } from "./simulateSoftBodyWithBoundaries";

/** Resolve admitted node/bone moving anchors and body capsules from complete absolute primary-motion snapshots, then replay cloth. This exported resolver currently has portable test consumers and no production/viewer live host.
 *
 * @evidence contracts/common.md#principled-implementation Budget slot admission, unique keyed frame subjects, unique required bone lookup, finite offsets and unit rotations resolve world targets before complete-boundary admission and the shared solver. Bone/node scale is not applied to anchor offsets by this representation; supplied snapshots and domain validity remain caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Primary motion stays with its supplying host; this resolver owns boundary translation and delegates completeness and integration to their canonical owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/duplicate subjects and bones throw rather than become an origin; no animation cursor, inferred garment subject or automatically enlarged live-subject budget hides absent author data.
 * @evidence contracts/common.md#meaningful-documentation States snapshot coverage, budget choice, rigid offset semantics, failures and actual unwired runtime reach.
 * @evidence contracts/performance.md#efficient-algorithms For K frames with N nodes, R actors, A moving anchors, B capsules and J scanned bone rows per query, resolution costs O(K*(N+R+(A+B)*J)); boundary storage O(K*(A+B)) precedes the shared P-particle solver replay cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Node/actor indexes are built once per frame and reused for all targets; required bone scans preserve duplicate detection. Snapshots, domain and budget are not assumed equivalent across calls for a retained solve cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Frame maps and resolved histories are local; only fresh solved arrays and budget scalars transfer, without retaining subject maps, rig callbacks or a host task.
 *
 * @author Samchon
 */
export const simulateAutoMovieWearableSoftBody: (props: {
  domain: IAutoMovieSoftBodyDomain;
  step: number;
  frames: readonly IAutoMovieWearableSoftFrame[];
  subjectIndex: number;
  maxSubjects: number;
  state?: string | null | undefined;
}) => IAutoMovieWearableSoftResult = (props: {
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

  const movingAnchors: IAutoMovieSoftAnchor[] = props.domain.anchors.filter(
    (anchor: IAutoMovieSoftAnchor): boolean => anchor.binding !== undefined,
  );
  const bodyCapsules: IAutoMovieSoftCollider.IBodyCapsule[] =
    props.domain.colliders.filter(
      (
        collider: IAutoMovieSoftCollider,
      ): collider is IAutoMovieSoftCollider.IBodyCapsule =>
        collider.kind === "body-capsule",
    );
  if (movingAnchors.length === 0 && bodyCapsules.length === 0)
    throw new Error(
      `soft body "${props.domain.id}" declares no moving boundary; use the static solver`,
    );

  const boundaries: IAutoMovieSoftBodyBoundarySample[] = props.frames.map(
    (
      frame: IAutoMovieWearableSoftFrame,
      index: number,
    ): {
      step: number;
      anchors: { particle: number; position: IAutoMovieVector3 }[];
      capsules: {
        id: string;
        from: { x: number; y: number; z: number };
        to: { x: number; y: number; z: number };
        radius: number;
      }[];
    } => {
      if (frame.step !== index)
        throw new Error(
          `wearable soft frame[${index}] must name absolute step ${index}`,
        );
      const nodes: ReadonlyMap<string, IAutoMovieSoftNodeTransform> = keyed(
        frame.nodes,
        (node: IAutoMovieSoftNodeTransform): string => node.node,
        "node",
        index,
      );
      const actors: ReadonlyMap<string, IAutoMovieWearableSoftActorPose> =
        keyed(
          frame.actors,
          (actor: IAutoMovieWearableSoftActorPose): string => actor.actor,
          "actor",
          index,
        );
      return {
        step: index,
        anchors: movingAnchors.map(
          (
            anchor: IAutoMovieSoftAnchor,
          ): { particle: number; position: IAutoMovieVector3 } => {
            const binding: IAutoMovieSoftAnchorBinding = anchor.binding!;
            if (binding.kind === "node") {
              const node: IAutoMovieSoftNodeTransform | undefined = nodes.get(
                binding.node,
              );
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
            const actor: IAutoMovieWearableSoftActorPose | undefined =
              actors.get(binding.actor);
            if (actor === undefined)
              throw new Error(
                `wearable soft frame[${index}] is missing actor "${binding.actor}"`,
              );
            const bone: IAutoMovieResolvedBone = resolvedBone(
              actor.bones,
              binding.bone,
              index,
            );
            return {
              particle: anchor.particle,
              position: resolveLocalPoint(
                bone.worldPosition,
                bone.worldRotation,
                binding.offset,
              ),
            };
          },
        ),
        capsules: bodyCapsules.map(
          (
            collider: IAutoMovieSoftCollider.IBodyCapsule,
          ): {
            id: string;
            from: { x: number; y: number; z: number };
            to: { x: number; y: number; z: number };
            radius: number;
          } => {
            const actor: IAutoMovieWearableSoftActorPose | undefined =
              actors.get(collider.actor);
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
          },
        ),
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

/** Index caller-owned frame subject references by nonblank unique ids; duplicate admission preserves named frame diagnostics. */

const keyed: <Entry>(
  entries: readonly Entry[],
  key: (entry: Entry) => string,
  label: string,
  step: number,
) => ReadonlyMap<string, Entry> = <Entry>(
  entries: readonly Entry[],
  key: (entry: Entry) => string,
  label: string,
  step: number,
): ReadonlyMap<string, Entry> => {
  const output: Map<string, Entry> = new Map<string, Entry>();
  for (const entry of entries) {
    const id: string = key(entry);
    if (id.trim().length === 0 || output.has(id))
      throw new Error(
        `wearable soft frame[${step}] ${label} ids must be non-blank and unique`,
      );
    output.set(id, entry);
  }
  return output;
};

/** Scan all supplied bone rows to refuse duplicate or missing required names, returning the unique caller-owned pose reference. */

const resolvedBone: (
  bones: readonly IAutoMovieResolvedBone[],
  name: AutoMovieHumanoidBone,
  step: number,
) => IAutoMovieResolvedBone = (
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

/** Validate a rigid world placement and local metre offset, rotate the offset without scale, and allocate its translated target. */

const resolveLocalPoint: (
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  offset: IAutoMovieVector3,
) => IAutoMovieVector3 = (
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
  offset: IAutoMovieVector3,
): IAutoMovieVector3 => {
  assertVector(position, "moving subject position");
  assertVector(offset, "moving subject local offset");
  assertQuaternion(rotation, "moving subject rotation");
  const rotated: IAutoMovieVector3 = Quaternion.rotateVector(rotation, offset);
  return {
    x: position.x + rotated.x,
    y: position.y + rotated.y,
    z: position.z + rotated.z,
  };
};

/** Refuse nonfinite components and squared unit-length error above 1e-6 before rotating a moving anchor offset. */

const assertQuaternion: (value: IAutoMovieQuaternion, label: string) => void = (
  value: IAutoMovieQuaternion,
  label: string,
): void => {
  if ([value.x, value.y, value.z, value.w].every(Number.isFinite) === false)
    throw new Error(`${label} must contain finite coordinates`);
  const squaredLength: number =
    value.x * value.x +
    value.y * value.y +
    value.z * value.z +
    value.w * value.w;
  if (Math.abs(squaredLength - 1) > 1e-6)
    throw new Error(`${label} must be unit length`);
};

/** Admit nonnegative safe subject/budget integers and refuse a slot at or beyond its declared live-subject ceiling. */

const assertAdmission: (subjectIndex: number, maxSubjects: number) => void = (
  subjectIndex: number,
  maxSubjects: number,
): void => {
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

/** Refuse nonfinite target components without substituting a world origin. */

const assertVector: (value: IAutoMovieVector3, label: string) => void = (
  value: IAutoMovieVector3,
  label: string,
): void => {
  if ([value.x, value.y, value.z].every(Number.isFinite) === false)
    throw new Error(`${label} must contain finite coordinates`);
};
