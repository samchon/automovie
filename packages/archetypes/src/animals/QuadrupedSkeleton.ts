import {
  type IArticulatedRigReader,
  Quaternion,
  Vector3,
  prepareArticulatedRig,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieArticulatedRig,
  IAutoMovieJointPose,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";

/** Local degree rotations without borrowing a humanoid bone slot. */
type Rotation = Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">;

/**
 * The animal's actual bars as an engine-readable named rigid skeleton.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the actual-part source, parent-local rig, explicit accessory/contact carriers and independent pose operation.
 * @evidence contracts/development/design.md#principled-representation The closed QuadrupedBody vocabulary is represented by the generic interface tree and resolved by the engine's species-independent FK.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The animal owner supplies its anatomy and attachments; the engine supplies admission and transform composition, while existing horse construction and ride serialization remain unchanged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No humanoid fingers stand in for animal bones and no unmeasured anatomical ROM is invented; every accessory and contact needs an explicit carrier when posed.
 */
export namespace QuadrupedSkeleton {
  /**
   * Read the actual built links into the shared generic rig representation.
   *
   * @param animal An animal built from the closed quadruped bone vocabulary.
   * @returns Independent parent-local neutral data with explicitly unknown anatomical limits.
   * @throws {RangeError} For a missing bone part or transform.
   * @evidence contracts/development/common.md#meaningful-documentation States actual model-part ownership, neutral parent frames, units and unknown anatomical limits.
   * @evidence contracts/development/implementation.md#principled-implementation Each actual bar's upper endpoint defines the joint origin and its rotation defines the local frame; inverse rigid composition expresses that joint relative to its parent. Thus articulation turns about the shared bar endpoint instead of the mesh centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Index actual parts, enumerate the closed hierarchy, and convert each current frame to one local rest frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No proportion table rebuilds a different animal, no humanoid slot or species branch is used, and unknown limits are null rather than copied human or horse measurements.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P+B) indexing and rigid conversions for P parts and B bones, with O(P+B) temporary/output storage.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each actual part is indexed once and every conversion uses the shared quaternion/vector owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned scalar transforms and axes are independent copies and retain no model, geometry array or resource handle.
   */
  export function of(
    animal: Pick<Archetype, "id" | "parts">,
  ): IAutoMovieArticulatedRig<QuadrupedBody.Bone> {
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const bones: readonly QuadrupedBody.Bone[] = [
      "trunk",
      "hindquarters",
      "neck",
      "head",
      "tail",
      ...QuadrupedBody.LIMBS.flatMap(
        (limb: QuadrupedBody.Limb): QuadrupedBody.Bone[] => [
          ...QuadrupedBody.BONES[limb],
        ],
      ),
    ];
    const parents: Map<QuadrupedBody.Bone, QuadrupedBody.Bone | null> = new Map(
      [
        ["trunk", null],
        ["hindquarters", "trunk"],
        ["neck", "trunk"],
        ["head", "neck"],
        ["tail", "hindquarters"],
      ],
    );
    for (const limb of QuadrupedBody.LIMBS) {
      const chain: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
      for (let index: number = 0; index < chain.length; index++)
        parents.set(
          chain[index]!,
          index === 0
            ? limb.endsWith("Fore")
              ? "trunk"
              : "hindquarters"
            : chain[index - 1]!,
        );
    }
    return {
      id: `${animal.id}/quadruped`,
      bones: bones.map(
        (
          bone: QuadrupedBody.Bone,
        ): IAutoMovieArticulatedRig<QuadrupedBody.Bone>["bones"][number] => {
          const parent: QuadrupedBody.Bone | null = parents.get(bone)!;
          const frame: IAutoMovieTransform = frameOf(bone);
          const base: IAutoMovieTransform =
            parent === null
              ? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 })
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

    /** The actual part owns its link frame; missing geometry is not rebuilt from defaults. */
    function frameOf(bone: QuadrupedBody.Bone): IAutoMovieTransform {
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
   * @returns A new actual model with moved links, accessories and contact frames.
   * @throws {RangeError} For incomplete/unknown carriers or an inadmissible rig/query.
   * @evidence contracts/development/common.md#meaningful-documentation States local degree input, explicit accessory/contact ownership, optional root placement and independent posed output.
   * @evidence contracts/development/implementation.md#principled-implementation Shared generic FK resolves the named tree; each accessory and contact receives newCarrier times inverseOldCarrier, so its rigid coordinates relative to that carrier are invariant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the actual rig, resolve neutral/current frames, form carrier rigid deltas, and apply them to the actual parts and affordances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every non-bone part and contact has an explicit valid carrier; no nearest-bone heuristic, species case, modified source model, dummy humanoid bone or static stale contact substitutes for the pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P+A+J) rigid work for bones, parts, affordances and named input joints; maps avoid repeated hierarchy traversal. Preparation occurs once per operation and no fitted pose cache is retained.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One admitted tree supplies both neutral/current frames and one rigid delta per bone serves every attached accessory/contact.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Maps and the prepared reader are call-local; the returned archetype owns new transform/contact records and shares immutable geometry/material/rest mass data under reposed's contract.
   */
  export function pose<Id extends string, Dimension extends string>(
    animal: Archetype<Id, Dimension>,
    joints: ReadonlyMap<QuadrupedBody.Bone, Rotation>,
    parts: Readonly<Record<string, QuadrupedBody.Bone>>,
    contacts: Readonly<Record<string, QuadrupedBody.Bone>>,
    root?: IAutoMovieTransform,
  ): Archetype<Id, Dimension> {
    const rig: IAutoMovieArticulatedRig<QuadrupedBody.Bone> = of(animal);
    const reader: IArticulatedRigReader<QuadrupedBody.Bone> =
      prepareArticulatedRig(rig);
    const rest: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
      reader.read();
    const posed: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
      reader.read(joints, root);
    const deltas: Map<QuadrupedBody.Bone, ArchetypeFrame.IMotion> = new Map();
    for (const bone of reader.bones) {
      const old: IAutoMovieTransform = rest.get(bone)!;
      const current: IAutoMovieTransform = posed.get(bone)!;
      const rotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
        current.rotation,
        Quaternion.inverse(old.rotation),
      );
      deltas.set(bone, {
        rotation,
        translation: Vector3.subtract(
          current.translation,
          Quaternion.rotateVector(rotation, old.translation),
        ),
      });
    }
    const moved: IAutoMovieModelPart[] = animal.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const bone: QuadrupedBody.Bone | undefined = posed.has(
          part.id as QuadrupedBody.Bone,
        )
          ? (part.id as QuadrupedBody.Bone)
          : parts[part.id];
        return {
          ...part,
          transform: ArchetypeFrame.move(
            carrier(bone, part.id),
            part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
          ),
        };
      },
    );
    const affordances: IAutoMovieAffordance[] = animal.affordances.map(
      (contact: IAutoMovieAffordance): IAutoMovieAffordance => ({
        ...contact,
        frame: ArchetypeFrame.move(
          carrier(contacts[contact.id], contact.id),
          contact.frame,
        ),
      }),
    );
    return animal.reposed(moved, affordances);

    /** An incomplete declared binding must refuse instead of leaving a rigid object at rest. */
    function carrier(
      bone: QuadrupedBody.Bone | undefined,
      id: string,
    ): ArchetypeFrame.IMotion {
      const delta: ArchetypeFrame.IMotion | undefined =
        bone === undefined ? undefined : deltas.get(bone);
      if (delta === undefined)
        throw new RangeError(`Missing quadruped carrier for ${id}`);
      return delta;
    }
  }
}
