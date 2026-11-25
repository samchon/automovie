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
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeSpan,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedSkeleton } from "./AutoMovieArchetypeQuadrupedSkeleton";
import { QuadrupedPoseAngles } from "./QuadrupedPoseAngles";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedRigDelta } from "./QuadrupedRigDelta";

/** A private part and its already admitted explicit carrier. */
interface IBinding {
  /**
   * Private geometry/frame snapshot; never returned or mutated by support
   * queries.
   */
  part: IAutoMovieModelPart;

  /** Bone whose rigid delta carries this part. */
  bone: AutoMovieArchetypeQuadrupedBody.Bone;
}

/** Build the owned rig, source, floor and achieved output operations. */
function prepare<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
): QuadrupedPosePlan.IPrepared<Id, Dimension>;
function prepare<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  ride: true,
): PrepareQuadrupedPose.IPrepared<Id, Dimension>;
function prepare<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  ride?: true,
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

  // Neutral emission admits all carrier bindings and makes a private
  // source geometry/frame snapshot before any caller-owned data can change.
  const source: AutoMovieArchetype<Id, Dimension> =
    AutoMovieArchetypeQuadrupedSkeleton.apply(
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
  const cells: AutoMovieArchetypeConvexCell.Table = source.convexCells;
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
      if (gap > 256 * Number.EPSILON * sourceScale)
        throw new RangeError(
          `Quadruped neutral ${bone} misses its child joint by ${gap} m`,
        );
    }
  }
  const lower: QuadrupedPosePlan.Lowering = QuadrupedPoseAngles(rig, reader);
  if (ride === undefined) return { read, bodyFloor, sample };
  return { read, bodyFloor, sample, position };

  /**
   * Preview current parent frames with the same source and axial lowering as
   * sampling.
   */
  function read(
    root?: IAutoMovieTransform,
    axial?: ReadonlyMap<QuadrupedPosePlan.Axial, QuadrupedPosePlan.Goal>,
  ): QuadrupedPosePlan.IState {
    return lower(root, undefined, axial);
  }

  /**
   * Exact current body/accessory support reuses TRS and span owners, never
   * another model sample.
   */
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
      const floor: number = QuadrupedRestFloor(part, cells);
      if (
        floor === Infinity &&
        part.geometry.type === "primitive" &&
        part.geometry.shape.type === "plane"
      )
        continue;
      lowest = Math.min(lowest, floor);
    }
    if (lowest === Infinity)
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

  /** Complete FK must realize every supplied chain before model emission. */
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
        if (originError > roundoff || endError > roundoff)
          throw new RangeError(
            `Quadruped ${bone} cannot close its actual chain: origin ${originError} m, endpoint ${endError} m`,
          );
      }
    }
    return {
      ...state,
      emit: (): AutoMovieArchetype<Id, Dimension> =>
        AutoMovieArchetypeQuadrupedSkeleton.apply(
          source,
          neutral,
          state.frames,
          partCarriers,
          contactCarriers,
        ),
    };
  }
}

/** A bone frame sits at its upper joint and its bar runs along local +Y. */
function endpoint(
  frame: IAutoMovieTransform,
  length: number,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.translation,
    Quaternion.rotateVector(frame.rotation, { x: 0, y: length, z: 0 }),
  );
}

/**
 * Hypot preserves a finite representable coordinate norm without squaring huge
 * components first.
 */
function magnitude(point: IAutoMovieVector3): number {
  return Math.hypot(point.x, point.y, point.z);
}

/** The private ride owner's achieved-geometry emission surface. */
export namespace PrepareQuadrupedPose {
  /**
   * Prepare one animal for shared solved-world-chain pose emission.
   *
   * @param animal Source geometry and original contact identities; never
   *   changed.
   * @param parts Carrier of every non-bone part.
   * @param contacts Carrier of every source affordance.
   * @returns Reusable root/axial preview, exact non-limb floor support and
   *   complete-limb sampling.
   * @throws {RangeError} For invalid models, non-rigid frames, incomplete
   *   carriers, broken neutral chains or a current solved chain the source
   *   cannot close.
   */
  export function ordinary<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  ): QuadrupedPosePlan.IPrepared<Id, D> {
    return prepare(animal, parts, contacts);
  }

  /** Prepare the same pose with the private native ride emission surface. */
  export function ride<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  ): IPrepared<Id, D> {
    return prepare(animal, parts, contacts, true);
  }

  /**
   * The internal ride reader adds achieved geometry to ordinary public
   * preparation.
   */
  export interface IPrepared<
    Id extends string,
    Dimension extends string,
  > extends QuadrupedPosePlan.IPrepared<Id, Dimension> {
    /**
     * Admit exact achieved geometry for independent emission by its owning
     * operation.
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

  /** Achieved joint geometry that can emit a fresh model on demand. */
  export interface IPosition<Id extends string, Dimension extends string>
    extends QuadrupedPosePlan.IState {
    /** Apply admitted frames to parts and contacts in a fresh model. */
    emit(): AutoMovieArchetype<Id, Dimension>;
  }
}
