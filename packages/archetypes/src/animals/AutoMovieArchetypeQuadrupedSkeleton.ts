import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
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

/** The animal's bars as an engine-readable named rigid skeleton. */
export namespace AutoMovieArchetypeQuadrupedSkeleton {
  /**
   * Read the built links into the shared generic rig representation.
   *
   * @param animal An animal built from the closed quadruped bone vocabulary.
   * @returns Independent parent-local neutral data with explicitly unknown
   *   anatomical limits.
   * @throws {RangeError} For a missing bone part or transform.
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

    /**
     * The part owns its link frame; missing geometry is not rebuilt from
     * defaults.
     */
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
   * Pose an animal's real links and explicitly attached parts/contacts by
   * generic FK.
   *
   * @param animal The independent rest animal; it is not changed.
   * @param joints Current degree rotations by quadruped bone; absent bones stay
   *   at neutral.
   * @param parts A carrier for every non-bone part, such as ears, tack or a
   *   hump.
   * @param contacts A carrier for every affordance; no contact is left behind
   *   by inference.
   * @param root Optional rigid model-space placement of the complete rig.
   * @returns A new model with moved links, accessories and contact frames.
   * @throws {RangeError} For incomplete/unknown carriers or an inadmissible
   *   rig/query.
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
      AutoMovieEngineKinematics.prepareArticulatedRig(rig);
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
   * @param animal Source model, unchanged; null accessory transforms mean
   *   identity.
   * @param rest Complete neutral frames of this source's quadruped tree.
   * @param posed Complete current frames of that same admitted tree.
   * @param parts Explicit carrier for every non-bone part.
   * @param contacts Explicit carrier for every original affordance.
   * @returns A model owning new part geometry/transforms and current contact
   *   frames.
   * @throws {RangeError} For incomplete vocabularies, missing/unknown carriers
   *   or non-rigid/nonfinite frames.
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
