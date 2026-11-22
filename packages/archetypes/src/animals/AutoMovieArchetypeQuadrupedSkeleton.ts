import { Quaternion, Vector3, prepareArticulatedRig } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieArticulatedRigReader,
  IAutoMovieJointPose,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { ApplyQuadrupedCarrierPose } from "./ApplyQuadrupedCarrierPose";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { QuadrupedScapula } from "./QuadrupedScapula";

/** Local degree rotations without borrowing a humanoid bone slot. */
type Rotation = Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">;

/**
 * The animal's bars as an engine-readable named rigid skeleton.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the part source, parent-local rig, explicit accessory/contact carriers and independent pose operation.
 * @evidence contracts/development/design.md#principled-representation The closed AutoMovieArchetypeQuadrupedBody vocabulary is represented by the generic interface tree and resolved by the engine's species-independent FK.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The animal owner supplies anatomy and explicit attachments; the engine supplies admission and transform composition, preserving producer-owned construction and the serialized model/contact vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No humanoid fingers stand in for animal bones and no unmeasured anatomical ROM is invented; every accessory and contact needs an explicit carrier when posed.
 */
export namespace AutoMovieArchetypeQuadrupedSkeleton {
  /**
   * Read the built links into the shared generic rig representation.
   *
   * @param animal An animal built from the closed quadruped bone vocabulary.
   * @returns Independent parent-local neutral data with explicitly unknown anatomical limits.
   * @throws {RangeError} For a missing bone part or transform.
   * @evidence contracts/development/common.md#meaningful-documentation States model-part ownership, neutral parent frames, units and unknown anatomical limits.
   * @evidence contracts/development/implementation.md#principled-implementation Each bar's upper endpoint defines the joint origin and its rotation defines the local frame; inverse rigid composition expresses that joint relative to its parent. Thus articulation turns about the shared bar endpoint instead of the mesh centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Index parts, enumerate the closed hierarchy, and convert each current frame to one local rest frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No proportion table rebuilds a different animal, no humanoid slot or species branch is used, and unknown limits are null rather than copied human or horse measurements.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P+B) indexing and rigid conversions for P parts and B bones, with O(P+B) temporary/output storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each part is indexed once and every conversion uses the shared quaternion/vector owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned scalar transforms and axes are independent copies and retain no model, geometry array or resource handle.
   */
  export function of(
    animal: Pick<AutoMovieArchetype, "id" | "parts">,
  ): IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone> {
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const bones: readonly AutoMovieArchetypeQuadrupedBody.Bone[] = [
      "trunk",
      "hindquarters",
      "neck",
      "head",
      "tail",
      ...Object.values(QuadrupedScapula.BONES),
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
        ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
          ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
        ],
      ),
    ];
    const parents: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      AutoMovieArchetypeQuadrupedBody.Bone | null
    > = new Map([
      ["trunk", null],
      ["hindquarters", "trunk"],
      ["neck", "trunk"],
      ["head", "neck"],
      ["tail", "hindquarters"],
      ["leftForeScapula", "trunk"],
      ["rightForeScapula", "trunk"],
    ]);
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const chain: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
        AutoMovieArchetypeQuadrupedBody.BONES[limb];
      for (let index: number = 0; index < chain.length; index++)
        parents.set(
          chain[index]!,
          index === 0
            ? limb === "leftFore" || limb === "rightFore"
              ? QuadrupedScapula.BONES[limb]
              : "hindquarters"
            : chain[index - 1]!,
        );
    }
    return {
      id: `${animal.id}/quadruped`,
      bones: bones.map(
        (
          bone: AutoMovieArchetypeQuadrupedBody.Bone,
        ): IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone>["bones"][number] => {
          const parent: AutoMovieArchetypeQuadrupedBody.Bone | null =
            parents.get(bone)!;
          const frame: IAutoMovieTransform = frameOf(bone);
          const base: IAutoMovieTransform =
            parent === null
              ? AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 })
              : frameOf(parent);
          const inverse: IAutoMovieTransform["rotation"] = Quaternion.inverse(
            base.rotation,
          );
          return {
            bone,
            parent,
            rest: {
              translation: Quaternion.rotateVector(
                inverse,
                Vector3.subtract(frame.translation, base.translation),
              ),
              rotation: Quaternion.multiply(inverse, frame.rotation),
              scale: { ...frame.scale },
            },
            axes: {
              flexion: { x: 1, y: 0, z: 0 },
              abduction: { x: 0, y: 0, z: 1 },
              twist: { x: 0, y: 1, z: 0 },
            },
            limits: null,
          };
        },
      ),
    };

    /** The part owns its link frame; missing geometry is not rebuilt from defaults. */
    function frameOf(
      bone: AutoMovieArchetypeQuadrupedBody.Bone,
    ): IAutoMovieTransform {
      const part: IAutoMovieModelPart | undefined = parts.get(bone);
      if (part?.transform === undefined || part.transform === null)
        throw new RangeError(`The quadruped has no transformed ${bone} part`);
      const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
      if (
        geometry.type !== "primitive" ||
        (geometry.shape.type !== "cylinder" &&
          geometry.shape.type !== "capsule")
      )
        throw new RangeError(
          `The quadruped ${bone} is not an actual rigid bar`,
        );
      return {
        translation: Vector3.subtract(
          part.transform.translation,
          Quaternion.rotateVector(part.transform.rotation, {
            x: 0,
            y: geometry.shape.height / 2,
            z: 0,
          }),
        ),
        rotation: { ...part.transform.rotation },
        scale: { ...part.transform.scale },
      };
    }
  }

  /**
   * Pose an animal's real links and explicitly attached parts/contacts by generic FK.
   *
   * @param animal The independent rest animal; it is not changed.
   * @param joints Current degree rotations by quadruped bone; absent bones stay at neutral.
   * @param parts A carrier for every non-bone part, such as ears, tack or a hump.
   * @param contacts A carrier for every affordance; no contact is left behind by inference.
   * @param root Optional rigid model-space placement of the complete rig.
   * @returns A new model with moved links, accessories and contact frames.
   * @throws {RangeError} For incomplete/unknown carriers or an inadmissible rig/query.
   * @evidence contracts/development/common.md#meaningful-documentation States local degree input, explicit accessory/contact ownership, optional root placement and independent posed output.
   * @evidence contracts/development/implementation.md#principled-implementation Shared generic FK resolves the named tree; each accessory and contact receives newCarrier times inverseOldCarrier, so its rigid coordinates relative to that carrier are invariant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the rig and resolve neutral/current frames, then delegate part/contact emission to apply, which prepared ride/Rest samplers reuse directly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every non-bone part and contact has an explicit valid carrier; no nearest-bone heuristic, species case, modified source model, dummy humanoid bone or static stale contact substitutes for the pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P+A+J+V) work for bones, parts, affordances, named input joints and independently copied geometry values; maps avoid repeated hierarchy traversal. Preparation occurs once per operation and no fitted pose cache is retained.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One admitted tree supplies both neutral/current frames and one rigid delta per bone serves every attached accessory/contact.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader is call-local; apply returns independently copied part geometry/transforms and contact frames while the producer retains ownership of immutable material/rest mass metadata.
   */
  export function pose<Id extends string, Dimension extends string>(
    animal: AutoMovieArchetype<Id, Dimension>,
    joints: ReadonlyMap<AutoMovieArchetypeQuadrupedBody.Bone, Rotation>,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    root?: IAutoMovieTransform,
  ): AutoMovieArchetype<Id, Dimension> {
    const rig: IAutoMovieArticulatedRig<AutoMovieArchetypeQuadrupedBody.Bone> =
      of(animal);
    const reader: IAutoMovieArticulatedRigReader<AutoMovieArchetypeQuadrupedBody.Bone> =
      prepareArticulatedRig(rig);
    return apply(
      animal,
      reader.read(),
      reader.read(joints, root),
      parts,
      contacts,
    );
  }

  /**
   * Emit parts and source contacts from two complete admitted FK states.
   *
   * @param animal Source model, unchanged; null accessory transforms mean identity.
   * @param rest Complete neutral frames of this source's quadruped tree.
   * @param posed Complete current frames of that same admitted tree.
   * @param parts Explicit carrier for every non-bone part.
   * @param contacts Explicit carrier for every original affordance.
   * @returns A model owning new part geometry/transforms and current contact frames.
   * @throws {RangeError} For incomplete vocabularies, missing/unknown carriers or non-rigid/nonfinite frames.
   * @evidence contracts/development/common.md#meaningful-documentation States same-tree complete frame ownership, null accessory identity, explicit carriers, rigid admission, independent geometry and preserved contact semantics.
   * @evidence contracts/development/implementation.md#principled-implementation Each carrier receives current times inverse-neutral, a rigid delta preserving all source-local coordinates. Applying that same delta to the part and contact frames preserves attachment invariants without rebuilding geometry or changing source identities.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared QuadrupedRigDelta owner admits complete frames and computes carrier maps; copy and move parts and original contact frames through that same owner. pose and prepared samplers share this emission operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No nearest-bone guess, ignored nonunit scale, uncarried part/contact, invented identity or stretched primitive is accepted. Null accessories retain the model contract's identity interpretation.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P+A+V) work/output for bones, parts, affordances and copied geometry values; one delta map prevents repeated rigid inversion per attachment.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's already computed FK states, with one shared rigid delta per carrier; no graph preparation or completed-pose cache is created here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All maps are call-local. Returned parts own independent geometry records/buffers and transforms, returned contacts own new frames, and no frame map, process or external handle is retained.
   */
  export function apply<Id extends string, Dimension extends string>(
    animal: AutoMovieArchetype<Id, Dimension>,
    rest: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    posed: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    >,
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  ): AutoMovieArchetype<Id, Dimension> {
    return ApplyQuadrupedCarrierPose.emit(animal, rest, posed, parts, contacts);
  }
}
