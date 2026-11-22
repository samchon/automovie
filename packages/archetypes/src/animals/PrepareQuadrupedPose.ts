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

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeSpan,
} from "../core";
import { ApplyQuadrupedCarrierPose } from "./ApplyQuadrupedCarrierPose";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedSkeleton } from "./AutoMovieArchetypeQuadrupedSkeleton";
import { QuadrupedPoseAngles } from "./QuadrupedPoseAngles";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";

/** Only the actual current public skeleton emitter authorizes private copying. */
const NATIVE_APPLY: typeof AutoMovieArchetypeQuadrupedSkeleton.apply =
  AutoMovieArchetypeQuadrupedSkeleton.apply;

/** A private actual part and its already admitted explicit carrier. */
interface IBinding {
  /** Private geometry/frame snapshot; never returned or mutated by support queries. */
  part: IAutoMovieModelPart;

  /** Actual bone whose rigid delta carries this part. */
  bone: AutoMovieArchetypeQuadrupedBody.Bone;
}

/** Build the actual owned rig, source, floor and achieved output operations. */
function prepare<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
): QuadrupedPosePlan.IPrepared<Id, Dimension>;
function prepare<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  nativeCourse: boolean,
): PrepareQuadrupedPose.IPrepared<Id, Dimension>;
function prepare<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  nativeCourse?: boolean,
):
  | QuadrupedPosePlan.IPrepared<Id, Dimension>
  | PrepareQuadrupedPose.IPrepared<Id, Dimension> {
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
  const rig: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone> =
    AutoMovieArchetypeQuadrupedSkeleton.of(animal);
  const reader: IAutoMovieArticulatedRigReader<AutoMovieArchetypeQuadrupedBody.Bone> =
    prepareArticulatedRig(rig);
  const neutral: ReadonlyMap<
    AutoMovieArchetypeQuadrupedBody.Bone,
    IAutoMovieTransform
  > = reader.read();
  const partCarriers: Readonly<
    Record<string, AutoMovieArchetypeQuadrupedBody.Bone>
  > = {
    ...parts,
  };
  const contactCarriers: Readonly<
    Record<string, AutoMovieArchetypeQuadrupedBody.Bone>
  > = {
    ...contacts,
  };

  // Neutral emission admits all actual carrier bindings and makes a private
  // source geometry/frame snapshot before any caller-owned data can change.
  let nativeSource: boolean = false;
  const source: AutoMovieArchetype<Id, Dimension> =
    nativeCourse === true && originalEmitter()
      ? ApplyQuadrupedCarrierPose.emit(
          animal,
          neutral,
          neutral,
          partCarriers,
          contactCarriers,
          undefined,
          (owned: boolean): void => {
            nativeSource = owned;
          },
        )
      : AutoMovieArchetypeQuadrupedSkeleton.apply(
          animal,
          neutral,
          neutral,
          partCarriers,
          contactCarriers,
        );
  let primitiveCopy: ApplyQuadrupedCarrierPose.CopyPart | null | undefined;
  const sourceParts: Map<string, IAutoMovieModelPart> = new Map(
    source.parts.map(
      (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
        part.id,
        part,
      ],
    ),
  );
  const identities: ReadonlyMap<string, AutoMovieArchetypeQuadrupedBody.Bone> =
    new Map(
      reader.bones.map(
        (
          bone: AutoMovieArchetypeQuadrupedBody.Bone,
        ): [string, AutoMovieArchetypeQuadrupedBody.Bone] => [bone, bone],
      ),
    );
  const bindings: readonly IBinding[] = source.parts.map(
    (part: IAutoMovieModelPart): IBinding => {
      const bone: AutoMovieArchetypeQuadrupedBody.Bone | undefined =
        identities.get(part.id) ?? partCarriers[part.id];
      if (bone === undefined)
        throw new RangeError(`Missing quadruped carrier for ${part.id}`);
      return { part, bone };
    },
  );
  const limbParts: ReadonlySet<string> = new Set(
    AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
      (
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
      ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
        ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
      ],
    ),
  );
  const bodyBindings: readonly IBinding[] = bindings.filter(
    (binding: IBinding): boolean => !limbParts.has(binding.part.id),
  );
  const spans: readonly AutoMovieArchetypeSpan.ISpan[] = source.spans;
  const lengths: Map<AutoMovieArchetypeQuadrupedBody.Bone, number> = new Map();
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
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
    const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
      AutoMovieArchetypeQuadrupedBody.BONES[limb];
    for (let index: number = 0; index < chain.length - 1; index++) {
      const bone: AutoMovieArchetypeQuadrupedBody.Bone = chain[index]!;
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
  if (nativeCourse === undefined) return { read, bodyFloor, sample };
  return { read, bodyFloor, sample, position };

  /** Preview current parent frames with the same source and actual axial lowering as sampling. */
  function read(
    root?: IAutoMovieTransform,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): QuadrupedPosePlan.IState {
    return lower(root, undefined, axial);
  }

  /** Exact current body/accessory support reuses actual TRS and span owners, never another model sample. */
  function bodyFloor(
    frames: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
  ): number {
    const deltas: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      AutoMovieArchetypeFrame.IMotion
    > = QuadrupedRigDelta.between(neutral, frames);
    const selected: readonly IBinding[] =
      spans.length === 0 ? bodyBindings : bindings;
    let current: IAutoMovieModelPart[] = selected.map(
      (binding: IBinding): IAutoMovieModelPart => ({
        ...binding.part,
        transform: QuadrupedRigDelta.move(
          binding.part.transform ??
            AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
          binding.bone,
          deltas,
          binding.part.id,
        ),
      }),
    );
    if (spans.length !== 0) {
      if (nativeSource) retire();
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
      current = AutoMovieArchetypeSpan.lay(
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

  /** Emit the admitted limbs and root as a fresh archetype. */
  function sample(
    limbs: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Limb,
      readonly IAutoMovieVector3[]
    >,
    root?: IAutoMovieTransform,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): QuadrupedPosePlan.ISample<Id, Dimension> {
    const posed: ReturnType<typeof position> = position(limbs, root, axial);
    return { animal: posed.emit(), joints: posed.joints, frames: posed.frames };
  }

  /** Complete actual FK must realize every supplied chain before model emission. */
  function position(
    limbs: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Limb,
      readonly IAutoMovieVector3[]
    >,
    root?: IAutoMovieTransform,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): PrepareQuadrupedPose.IPosition<Id, Dimension> {
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
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const points: readonly IAutoMovieVector3[] = limbs.get(limb)!;
      const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
        AutoMovieArchetypeQuadrupedBody.BONES[limb];
      for (let index: number = 0; index < chain.length; index++) {
        const bone: AutoMovieArchetypeQuadrupedBody.Bone = chain[index]!;
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
      ...state,
      emit: (ode?: boolean): AutoMovieArchetype<Id, Dimension> =>
        emit(state.frames, ode),
    };
  }

  /** Emit via the original public override or the exact native owner. */
  function emit(
    frames: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    ode?: boolean,
  ): AutoMovieArchetype<Id, Dimension> {
    if (
      nativeSource &&
      (!originalEmitter() ||
        !ApplyQuadrupedCarrierPose.nativeRepose() ||
        !ApplyQuadrupedCarrierPose.nativeClone())
    )
      retire();
    if (!nativeSource)
      return AutoMovieArchetypeQuadrupedSkeleton.apply(
        source,
        neutral,
        frames,
        partCarriers,
        contactCarriers,
      );
    if (ode === true && primitiveCopy === undefined)
      primitiveCopy =
        ApplyQuadrupedCarrierPose.primitiveCopy(source.parts) ?? null;
    return ApplyQuadrupedCarrierPose.emit(
      source,
      neutral,
      frames,
      partCarriers,
      contactCarriers,
      ode === true ? (primitiveCopy ?? undefined) : undefined,
      undefined,
      retire,
    );
  }

  /** A source passed to an alternate observer is no longer exclusively owned. */
  function retire(): void {
    nativeSource = false;
    primitiveCopy = null;
  }
}

/** Read no changed method or accessor while deciding whether to use the native owner. */
function originalEmitter(): boolean {
  return (
    Object.getOwnPropertyDescriptor(
      AutoMovieArchetypeQuadrupedSkeleton,
      "apply",
    )?.value === NATIVE_APPLY
  );
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

/**
 * The private ride owner's achieved-geometry emission surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates native ride emission from the public prepared reader.
 * @evidence contracts/development/design.md#principled-representation The original prepared FK owns an achieved private emission capability.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the native quadruped ride can request the ODE part-copy mode.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new public option, unachieved pose or cached emitted model.
 */
export namespace PrepareQuadrupedPose {
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns admission, private source measurements/bindings and reusable graph/lowering metadata. read previews actual parents; bodyFloor uses shared carrier deltas and exact primitive/span owners without model emission; sample verifies achieved chains and delegates actual emission to the shared carrier owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species case, human bone, scaled geometry, per-limb root shift, stretched bar, stale contact, completed-frame cache or silent partial chain is accepted. The only positional budget is scale-dependent binary64 arithmetic error, not an authored goal gap.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and sampling cost O(B+P+A+V); preview costs O(B+G). Body floor costs O(B+P) without spans and O(B+P+A+S(P+A)) with the existing span locator, using shallow current records and span-only geometry. B/P/A/V/G/S count bones, parts, contacts, copied geometry values, goals and spans; four fixed chains add constant closure checks.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One admitted rig/reader, neutral state, private source geometry/span records, actual lengths and explicit carrier copies serve every query. Model emission and body floor share the same rigid-delta owner; current frames and bounds are never cached by sampled time.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared owner retains O(B+P+A+V) independent source data for its lifetime; returned models/frames own their mutable geometry/transforms. No caller goal map, prior sample, process, file or global resource is retained.
   */
  export function ordinary<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  ): QuadrupedPosePlan.IPrepared<Id, D> {
    return prepare(animal, parts, contacts);
  }

  /**
   * Prepare the same actual pose with the private native ride emission surface.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the native course authority and achieved ride geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Share ordinary admission and offer exact achieved-state reuse only to the private ride.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegate the same source inputs to the sole geometry preparer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Native emissions still use actual closure, source parts, contacts and floor tests.
   * @evidence contracts/development/implementation.md#efficient-algorithms Same preparation work and bounded source data as ordinary preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Leaves the actual FK and physical checks with the single shared preparer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The private prepared owner retains source data only for its lifetime.
   */
  export function ride<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    nativeCourse: boolean,
  ): IPrepared<Id, D> {
    return prepare(animal, parts, contacts, nativeCourse);
  }

  /**
   * The internal ride reader adds achieved geometry to ordinary public preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the internal exact source and achieved geometry.
   * @evidence contracts/development/design.md#principled-representation Public preparation and ride preparation share one admitted FK.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Kept at the two true prepared consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No new public prepared result field or completed model history.
   */
  export interface IPrepared<
    Id extends string,
    Dimension extends string,
  > extends QuadrupedPosePlan.IPrepared<Id, Dimension> {
    /**
     * Admit exact achieved geometry for independent emission by its owning operation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Separates complete achieved FK from fresh model emission.
     * @evidence contracts/development/implementation.md#principled-implementation This admission validates all four achieved chains before creating an emission capability.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The ordinary sample and the exact same-operation witness use this same lowering.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Incomplete or approximate geometry cannot issue an emission capability.
     * @evidence contracts/development/implementation.md#efficient-algorithms Lowering takes O(B) for B admitted bones and emits independently on demand.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work An owning operation can retain the admitted lowering without sharing emitted models.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned capability keeps only its own FK state and prepared owner.
     */
    position(
      limbs: ReadonlyMap<
        AutoMovieArchetypeQuadrupedBody.Limb,
        readonly IAutoMovieVector3[]
      >,
      root?: IAutoMovieTransform,
      axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
    ): IPosition<Id, Dimension>;
  }

  /**
   * Achieved joint geometry that can emit a fresh model on demand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes admitted FK from model ownership.
   * @evidence contracts/development/design.md#principled-representation A prepared FK result owns the exact frames that drive model emission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The existing tow and sample paths share the same model emission.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No emitted model lives in the shared geometry.
   */
  export interface IPosition<Id extends string, Dimension extends string>
    extends QuadrupedPosePlan.IState {
    /**
     * Apply admitted frames to actual parts and contacts in a fresh model.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the actual geometry and fresh model ownership.
     * @evidence contracts/development/implementation.md#principled-implementation Apply the original carrier deltas and repose the native source from the achieved FK.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegate to the existing skeleton emitter.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fresh parts, contacts and live model metadata are emitted on each call.
     * @evidence contracts/development/implementation.md#efficient-algorithms Emission does the original O(B+P+A+V) carrier and copy work for bones, parts, contacts and geometry values, plus span relaying when present.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuse the admitted FK and preparation while executing the original repose.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The capability retains its achieved frames, and each emitted model belongs to its caller.
     */
    emit(ode?: boolean): AutoMovieArchetype<Id, Dimension>;
  }
}
