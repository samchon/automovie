import {
  Quaternion,
  Vector3,
  prepareArticulatedRig,
  validateModel,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieArticulatedRig,
  IAutoMovieArticulatedRigReader,
  IAutoMovieConstraintViolation,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeSpan } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedPoseAngles } from "./QuadrupedPoseAngles";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";
import { QuadrupedSkeleton } from "./QuadrupedSkeleton";

/** A private actual part and its already admitted explicit carrier. */
interface IBinding {
  /** Private geometry/frame snapshot; never returned or mutated by support queries. */
  part: IAutoMovieModelPart;

  /** Actual bone whose rigid delta carries this part. */
  bone: QuadrupedBody.Bone;
}

/**
 * Prepare one actual animal for shared solved-world-chain pose emission.
 *
 * @param animal Actual source geometry and original contact identities; never changed.
 * @param parts Carrier of every actual non-bone part.
 * @param contacts Carrier of every actual source affordance.
 * @returns Reusable root/axial preview, exact non-limb floor support and complete-limb sampling.
 * @throws {RangeError} For invalid models, non-rigid frames, incomplete carriers, broken neutral chains or a current solved chain the actual source cannot close.
 * @evidence contracts/development/common.md#meaningful-documentation States actual source/contact ownership, one-time rigid preparation, complete world-point chains, included root placement, independent geometry/frames and refusal of unsupported geometry or closure.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the actual model, prepare its named generic rig once, snapshot actual parts/contact frames and verify neutral bar adjacency. Shared basis-aware lowering computes current FK; every requested origin and endpoint must agree with those actual fixed-length bars before one rigid carrier delta emits the model.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns admission, private source measurements/bindings and reusable graph/lowering metadata. read previews actual parents; bodyFloor uses shared carrier deltas and exact primitive/span owners without model emission; sample verifies achieved chains and delegates actual emission to QuadrupedSkeleton.apply.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species case, human bone, scaled geometry, per-limb root shift, stretched bar, stale contact, completed-frame cache or silent partial chain is accepted. The only positional budget is scale-dependent binary64 arithmetic error, not an authored goal gap.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and sampling cost O(B+P+A+V); preview costs O(B+G). Body floor costs O(B+P) without spans and O(B+P+A+S(P+A)) with the existing span locator, using shallow current records and span-only geometry. B/P/A/V/G/S count bones, parts, contacts, copied geometry values, goals and spans; four fixed chains add constant closure checks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One admitted rig/reader, neutral state, private source geometry/span records, actual lengths and explicit carrier copies serve every query. Model emission and body floor share the same rigid-delta owner; current frames and bounds are never cached by sampled time.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared owner retains O(B+P+A+V) independent source data for its lifetime; returned models/frames own their mutable geometry/transforms. No caller goal map, prior sample, process, file or global resource is retained.
 */
export function QuadrupedPose<Id extends string, Dimension extends string>(
  animal: Archetype<Id, Dimension>,
  parts: Readonly<Record<string, QuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, QuadrupedBody.Bone>>,
): QuadrupedPosePlan.IPrepared<Id, Dimension> {
  const validation: ReturnType<typeof validateModel> = validateModel({
    model: animal,
  });
  if (!validation.success)
    throw new RangeError(
      `Quadruped pose requires an admitted model: ${validation.violations
        .slice(0, 3)
        .map(
          (violation: IAutoMovieConstraintViolation): string =>
            `${violation.path} ${violation.expected}`,
        )
        .join("; ")}`,
    );
  const rig: IAutoMovieArticulatedRig<QuadrupedBody.Bone> =
    QuadrupedSkeleton.of(animal);
  const reader: IAutoMovieArticulatedRigReader<QuadrupedBody.Bone> =
    prepareArticulatedRig(rig);
  const neutral: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
    reader.read();
  const partCarriers: Readonly<Record<string, QuadrupedBody.Bone>> = {
    ...parts,
  };
  const contactCarriers: Readonly<Record<string, QuadrupedBody.Bone>> = {
    ...contacts,
  };

  // Neutral emission admits all actual carrier bindings and makes a private
  // source geometry/frame snapshot before any caller-owned data can change.
  const source: Archetype<Id, Dimension> = QuadrupedSkeleton.apply(
    animal,
    neutral,
    neutral,
    partCarriers,
    contactCarriers,
  );
  const sourceParts: Map<string, IAutoMovieModelPart> = new Map(
    source.parts.map(
      (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
        part.id,
        part,
      ],
    ),
  );
  const identities: ReadonlyMap<string, QuadrupedBody.Bone> = new Map(
    reader.bones.map(
      (bone: QuadrupedBody.Bone): [string, QuadrupedBody.Bone] => [bone, bone],
    ),
  );
  const bindings: readonly IBinding[] = source.parts.map(
    (part: IAutoMovieModelPart): IBinding => {
      const bone: QuadrupedBody.Bone | undefined =
        identities.get(part.id) ?? partCarriers[part.id];
      if (bone === undefined)
        throw new RangeError(`Missing quadruped carrier for ${part.id}`);
      return { part, bone };
    },
  );
  const limbParts: ReadonlySet<string> = new Set(
    QuadrupedBody.LIMBS.flatMap(
      (limb: QuadrupedBody.Limb): QuadrupedBody.Bone[] => [
        ...QuadrupedBody.BONES[limb],
      ],
    ),
  );
  const bodyBindings: readonly IBinding[] = bindings.filter(
    (binding: IBinding): boolean => !limbParts.has(binding.part.id),
  );
  const spans: readonly ArchetypeSpan.ISpan[] = source.spans;
  const lengths: Map<QuadrupedBody.Bone, number> = new Map();
  for (const bone of reader.bones) {
    const part: IAutoMovieModelPart | undefined = sourceParts.get(bone);
    if (
      part?.geometry.type !== "primitive" ||
      (part.geometry.shape.type !== "cylinder" &&
        part.geometry.shape.type !== "capsule")
    )
      throw new RangeError(
        `Quadruped ${bone} is not actual rigid bar geometry`,
      );
    lengths.set(bone, part.geometry.shape.height);
  }
  const sourceScale: number = Math.max(
    1,
    ...lengths.values(),
    ...[...neutral.values()].map((frame: IAutoMovieTransform): number =>
      magnitude(frame.translation),
    ),
  );
  if (!Number.isFinite(sourceScale))
    throw new RangeError(
      "Quadruped neutral geometry has an unrepresentable coordinate scale",
    );
  for (const limb of QuadrupedBody.LIMBS) {
    const chain: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
    for (let index: number = 0; index < chain.length - 1; index++) {
      const bone: QuadrupedBody.Bone = chain[index]!;
      const gap: number = magnitude(
        Vector3.subtract(
          endpoint(neutral.get(bone)!, lengths.get(bone)!),
          neutral.get(chain[index + 1]!)!.translation,
        ),
      );
      if (!Number.isFinite(gap) || gap > 256 * Number.EPSILON * sourceScale)
        throw new RangeError(
          `Quadruped neutral ${bone} misses its child joint by ${gap} m`,
        );
    }
  }
  const lower: QuadrupedPosePlan.Lowering = QuadrupedPoseAngles(rig, reader);
  return { read, bodyFloor, sample };

  /** Preview current parent frames with the same source and actual axial lowering as sampling. */
  function read(
    root?: IAutoMovieTransform,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): QuadrupedPosePlan.IState {
    return lower(root, undefined, axial);
  }

  /** Exact current body/accessory support reuses actual TRS and span owners, never another model sample. */
  function bodyFloor(
    frames: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform>,
  ): number {
    const deltas: ReadonlyMap<QuadrupedBody.Bone, ArchetypeFrame.IMotion> =
      QuadrupedRigDelta.between(neutral, frames);
    const selected: readonly IBinding[] =
      spans.length === 0 ? bodyBindings : bindings;
    let current: IAutoMovieModelPart[] = selected.map(
      (binding: IBinding): IAutoMovieModelPart => ({
        ...binding.part,
        transform: QuadrupedRigDelta.move(
          binding.part.transform ??
            ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
          binding.bone,
          deltas,
          binding.part.id,
        ),
      }),
    );
    if (spans.length !== 0) {
      const affordances: IAutoMovieAffordance[] = source.affordances.map(
        (contact: IAutoMovieAffordance): IAutoMovieAffordance => ({
          ...contact,
          frame: QuadrupedRigDelta.move(
            contact.frame,
            contactCarriers[contact.id],
            deltas,
            contact.id,
          ),
        }),
      );
      current = ArchetypeSpan.lay(
        source.archetype,
        spans,
        current,
        affordances,
      );
    }
    let lowest: number = Infinity;
    for (const part of current) {
      if (limbParts.has(part.id)) continue;
      const floor: number = QuadrupedRestFloor(part);
      if (
        floor === Infinity &&
        part.geometry.type === "primitive" &&
        part.geometry.shape.type === "plane"
      )
        continue;
      if (!Number.isFinite(floor))
        throw new RangeError(
          `Quadruped ${part.id} has an unrepresentable body floor`,
        );
      lowest = Math.min(lowest, floor);
    }
    if (!Number.isFinite(lowest))
      throw new RangeError(
        "Quadruped body floor requires actual finite non-limb solids",
      );
    return lowest;
  }

  /** Complete actual FK must realize every supplied chain before model emission. */
  function sample(
    limbs: ReadonlyMap<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>,
    root?: IAutoMovieTransform,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): QuadrupedPosePlan.ISample<Id, Dimension> {
    if (limbs === undefined || limbs === null)
      throw new RangeError("A quadruped sample requires all four solved limbs");
    const state: QuadrupedPosePlan.IState = lower(root, limbs, axial);
    const scale: number = Math.max(
      sourceScale,
      ...[...state.frames.values()].map((frame: IAutoMovieTransform): number =>
        magnitude(frame.translation),
      ),
      ...[...limbs.values()].flatMap(
        (points: readonly IAutoMovieVector3[]): number[] =>
          points.map((point: IAutoMovieVector3): number => magnitude(point)),
      ),
    );
    if (!Number.isFinite(scale))
      throw new RangeError(
        "Quadruped current goals have an unrepresentable coordinate scale",
      );

    // Fixed graph depth and rigid/circle arithmetic accumulate binary64 error.
    // This is the existing rest observation's coordinate-scaled budget; a
    // physical gap, changed source length or relocated root is not a tolerance.
    const roundoff: number = 256 * Number.EPSILON * scale;
    for (const limb of QuadrupedBody.LIMBS) {
      const points: readonly IAutoMovieVector3[] = limbs.get(limb)!;
      const chain: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
      for (let index: number = 0; index < chain.length; index++) {
        const bone: QuadrupedBody.Bone = chain[index]!;
        const frame: IAutoMovieTransform = state.frames.get(bone)!;
        const originError: number = magnitude(
          Vector3.subtract(frame.translation, points[index]!),
        );
        const endError: number = magnitude(
          Vector3.subtract(
            endpoint(frame, lengths.get(bone)!),
            points[index + 1]!,
          ),
        );
        if (
          !Number.isFinite(originError) ||
          !Number.isFinite(endError) ||
          originError > roundoff ||
          endError > roundoff
        )
          throw new RangeError(
            `Quadruped ${bone} cannot close its actual chain: origin ${originError} m, endpoint ${endError} m`,
          );
      }
    }
    return {
      animal: QuadrupedSkeleton.apply(
        source,
        neutral,
        state.frames,
        partCarriers,
        contactCarriers,
      ),
      joints: state.joints,
      frames: state.frames,
    };
  }
}

/** A bone frame sits at its upper joint and its actual bar runs along local +Y. */
function endpoint(
  frame: IAutoMovieTransform,
  length: number,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.translation,
    Quaternion.rotateVector(frame.rotation, { x: 0, y: length, z: 0 }),
  );
}

/** Hypot preserves a finite representable coordinate norm without squaring huge components first. */
function magnitude(point: IAutoMovieVector3): number {
  return Math.hypot(point.x, point.y, point.z);
}
