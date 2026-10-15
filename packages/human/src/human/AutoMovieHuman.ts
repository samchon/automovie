import {
  IAutoMovieExpression,
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { IValidation } from "typia";
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import { generateAutoMovieHumanCages } from "./generateAutoMovieHumanCages";
import { inspectAutoMovieHumanConstruction } from "./inspectAutoMovieHumanConstruction";

import { dressAutoMovieHumanNails } from "../appearance/dressAutoMovieHumanNails";
import { dressAutoMovieHumanSkin } from "../appearance/dressAutoMovieHumanSkin";
import { emitAutoMovieHumanHair } from "../appearance/emitAutoMovieHumanHair";
import { validateAutoMovieHumanAppearance } from "../appearance/validateAutoMovieHumanAppearance";
import { AutoMovieHumanAdmissionError } from "../measure/AutoMovieHumanAdmissionError";
import { AutoMovieHumanConverter } from "../measure/AutoMovieHumanConverter";
import { IAutoMovieHumanConverter } from "../measure/IAutoMovieHumanConverter";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeletalMeasurements } from "../measure/IAutoMovieHumanSkeletalMeasurements";
import { resolveAutoMovieHumanMeasurements } from "../measure/resolveAutoMovieHumanMeasurements";
import { validateAutoMovieHumanIdentity } from "../measure/validateAutoMovieHumanIdentity";
import { validateAutoMovieHumanTraits } from "../measure/validateAutoMovieHumanTraits";
import { convertAutoMovieHumanPose } from "../rig/convertAutoMovieHumanPose";
import { validateAutoMovieHumanExpression } from "../rig/validateAutoMovieHumanExpression";
import { validateAutoMovieHumanPose } from "../rig/validateAutoMovieHumanPose";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { emitAutoMovieHumanSkeleton } from "../skeleton/emitAutoMovieHumanSkeleton";
import { emitAutoMovieHumanStick } from "../skeleton/emitAutoMovieHumanStick";
import { generateAutoMovieHumanSkeleton } from "../skeleton/generateAutoMovieHumanSkeleton";
import { measureAutoMovieHumanSkeleton } from "../skeleton/measureAutoMovieHumanSkeleton";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanExpression } from "../structures/IAutoMovieHumanExpression";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPose } from "../structures/IAutoMovieHumanPose";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";
import { AUTOMOVIE_HUMAN_PART_GENERATORS } from "./AUTOMOVIE_HUMAN_PART_GENERATORS";
import { AUTOMOVIE_HUMAN_SKIN_MATERIAL } from "./AUTOMOVIE_HUMAN_SKIN_MATERIAL";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { emitAutoMovieHumanAttachments } from "./emitAutoMovieHumanAttachments";
import { emitAutoMovieHumanSkin } from "./emitAutoMovieHumanSkin";
import { emitAutoMovieHumanSkinParts } from "./emitAutoMovieHumanSkinParts";

/**
 * One person, generated from a detailed identity by code: the skeleton, the model films use, posing and expression.
 *
 * Construction admits the identity, resolves its measurements and generates the skeleton once; every later call reads those, so a person never changes after it is built and a host keeps the previous person when a new identity is refused. A different identity is a new instance. The instance holds all its state; the package keeps no module state.
 *
 * The package is laid out as layers, each importing only those below it, so generation runs one way from parameters to geometry:
 *
 * - `structures`: the public input documents, identity, traits, pose, expression and appearance.
 * - `measure`: admission of identities and traits, the traits-to-identity converter, and resolved measurements.
 * - `skeleton`: joint centres, axes and range of motion on the shared humanoid bones, in the canonical T-pose.
 * - `junction`: the control cage, boundary rings and the joining of two parts' rings before one subdivision.
 * - `parts/<part>`: one generator per skin part, emitting a cage with rings; parts never import each other.
 * - `rig`: skin weights, posing and facial articulation.
 * - `appearance`: skin, hair, brows and lashes materials and geometry.
 * - `garment`: binding garments to the skin, underwear first.
 * - `export`: static glTF and GLB.
 * - `human`: this class, which composes them.
 *
 * The output contract with films is `IAutoMovieModel` alone, with `origin: "generated"`; Human never enters films through archetype recipes or their string-keyed parameters. Every method takes one object argument, so the class can be exposed as function-calling tools.
 *
 * Stages not generated yet: the model is the stick figure of the skeleton, a capsule per bone and a marker per joint, instead of the joined, skinned skin. Methods refuse inadmissible documents with {@link AutoMovieHumanAdmissionError}, naming each field, bound and cause.
 *
 * @author Samchon
 */
export class AutoMovieHuman {
  private readonly id_: string;
  private readonly measurements_: IAutoMovieHumanMeasurements;
  private readonly skeleton_: IAutoMovieHumanSkeleton;
  private readonly generators_: IAutoMovieHumanPartGenerators;

  /**
   * Build a person from a detailed identity.
   *
   * @param props Model id and identity; neither is retained by reference
   * @throws {AutoMovieHumanAdmissionError} When the identity is refused
   */
  public constructor(props: AutoMovieHuman.IProps) {
    const admitted: IValidation<IAutoMovieHumanIdentity> =
      validateAutoMovieHumanIdentity(props.identity);
    if (admitted.success === false)
      throw new AutoMovieHumanAdmissionError("identity", admitted.errors);
    this.id_ = props.id;
    this.measurements_ = resolveAutoMovieHumanMeasurements(admitted.data);
    this.skeleton_ = generateAutoMovieHumanSkeleton(this.measurements_);
    this.generators_ = { ...AUTOMOVIE_HUMAN_PART_GENERATORS, ...props.parts };
  }

  /**
   * Build a person from beginner traits through a converter.
   *
   * The traits are admitted, expanded into an identity by the converter, and the identity is admitted like any authored one; a refusal of the converted identity names the converter's output fields. Keep the returned person's identity as the saved state and the traits as editing history.
   *
   * @param props Model id, traits and an optional converter, by default {@link AutoMovieHumanConverter}
   * @returns The person
   * @throws {AutoMovieHumanAdmissionError} When the traits, or the identity converted from them, are refused
   */
  public static fromTraits(props: AutoMovieHuman.ITraitsProps): AutoMovieHuman {
    const admitted: IValidation<IAutoMovieHumanTraits> =
      validateAutoMovieHumanTraits(props.traits);
    if (admitted.success === false)
      throw new AutoMovieHumanAdmissionError("traits", admitted.errors);
    const converter: IAutoMovieHumanConverter =
      props.converter ?? new AutoMovieHumanConverter();
    return new AutoMovieHuman({
      id: props.id,
      identity: converter.toIdentity(admitted.data),
      parts: props.parts,
    });
  }

  /**
   * The admitted identity this person was built from.
   *
   * @returns A copy, safe to edit into the identity of a new person
   */
  public getIdentity(): IAutoMovieHumanIdentity {
    return structuredClone(this.measurements_.identity);
  }

  /**
   * The person's skeleton as films pose it, in metres.
   *
   * @returns Skeleton with id `${id}.skeleton`
   */
  public getSkeleton(): IAutoMovieSkeleton {
    return emitAutoMovieHumanSkeleton(this.skeleton_, this.skeletonId());
  }

  /**
   * The construction net of every lofted part, for inspecting how its surface was built: each sweep's spine, stations, guides and features, the network's curves, the part's rings and its control cage, in the model frame at rest, metres. It is a debug output, never part of the model.
   *
   * @returns One net per lofted part instance
   */
  public inspect(): IAutoMovieHumanConstructionNet[] {
    return inspectAutoMovieHumanConstruction(
      generateAutoMovieHumanCages(
        this.measurements_,
        this.skeleton_,
        this.generators_,
      ),
    );
  }

  /**
   * The skeleton's measurements, taken in the anthropometric posture.
   *
   * The T-pose rest is lowered back to arms hanging and its landmarks are measured by their survey definitions; for every person they return the identity's stature, heights, breadths and segment lengths, which is the check that generation honoured them.
   *
   * @returns Skeletal measurements in millimetres
   */
  public measure(): IAutoMovieHumanSkeletalMeasurements {
    return measureAutoMovieHumanSkeleton(this.skeleton_);
  }

  /**
   * The person as a model films place and pose like any other.
   *
   * The model holds the stick figure of the skeleton, a capsule from each joint centre to the bone's end and a sphere at each joint, every bone including fingers, eyes and jaw, coloured grey on the midline, red on the person's left and blue on the right, and the skin. With `assembly: "parts"`, the default while the parts are being built, the skin is every part's own cage subdivided alone, one static model part each with id `skin.<part>` or `skin.<part>.<side>`, so the viewer can isolate a part and judge it before joining. With `assembly: "joined"` the skin is the person: every part's cage joined through its rings, subdivided once as one surface, and emitted as one skinned mesh `skin` with limit normals and the published UV layout. Separate meshes a part carries, such as the nail plates and the eyeballs, are their own parts riding one bone each, id `<part>[.<side>].<name>`, and the model carries the images their materials sample, such as each iris. The skin's material follows the identity's pigmentation and the appearance's finish and samples a generated relief image the model carries. Nail plates show the nail bed of the person's pigmentation with a pale free edge. Scalp hair, brows and lashes are cards grown on the emitted head's surface, parts `hair`, `brows` and `lashes` riding the head bone; teeth and underwear follow as their generators land. The appearance is admitted already, so a document that will be refused later is refused now.
   *
   * @param props The appearance to wear, and how the skin is assembled
   * @returns Model with `origin: "generated"`
   * @throws {AutoMovieHumanAdmissionError} When the appearance is refused
   */
  public getModel(props: {
    appearance: IAutoMovieHumanAppearance;
    assembly?: "parts" | "joined";
  }): IAutoMovieModel {
    const admitted: IValidation<IAutoMovieHumanAppearance> =
      validateAutoMovieHumanAppearance(props.appearance);
    if (admitted.success === false)
      throw new AutoMovieHumanAdmissionError("appearance", admitted.errors);
    const stick: emitAutoMovieHumanStick.IOutput = emitAutoMovieHumanStick(
      this.skeleton_,
      this.measurements_.identity.body.stature,
    );
    const skin: ReturnType<typeof emitAutoMovieHumanSkinParts> =
      props.assembly === "joined"
        ? {
            parts: [
              emitAutoMovieHumanSkin(
                this.measurements_,
                this.skeleton_,
                2,
                this.generators_,
              ),
            ],
            materials: [AUTOMOVIE_HUMAN_SKIN_MATERIAL],
          }
        : emitAutoMovieHumanSkinParts(
            this.measurements_,
            this.skeleton_,
            2,
            this.generators_,
          );
    const attachments: ReturnType<typeof emitAutoMovieHumanAttachments> =
      emitAutoMovieHumanAttachments(
        this.measurements_,
        this.skeleton_,
        2,
        this.generators_,
      );
    // the appearance decides the skin's material in place of the parts' placeholder
    const dressed: ReturnType<typeof dressAutoMovieHumanSkin> =
      dressAutoMovieHumanSkin({
        parts: skin.parts,
        measurements: this.measurements_,
        skeleton: this.skeleton_,
        skin: admitted.data.skin,
      });
    const hair: ReturnType<typeof emitAutoMovieHumanHair> =
      emitAutoMovieHumanHair({
        measurements: this.measurements_,
        skeleton: this.skeleton_,
        appearance: admitted.data,
        skin: skin.parts,
      });
    const nails: ReturnType<typeof dressAutoMovieHumanNails> =
      dressAutoMovieHumanNails({
        parts: attachments.parts,
        measurements: this.measurements_,
        skeleton: this.skeleton_,
      });
    const images: IAutoMovieImage[] = [
      ...attachments.images,
      ...dressed.images,
      ...hair.images,
    ];
    return {
      id: this.id_,
      name: null,
      origin: "generated",
      parts: [...dressed.parts, ...nails.parts, ...hair.parts, ...stick.parts],
      skeleton: this.getSkeleton(),
      body: null,
      materials: [
        ...skin.materials.map(
          (m: IAutoMovieMaterial): IAutoMovieMaterial =>
            m.id === dressed.material.id ? dressed.material : m,
        ),
        // the nail plates now cite the appearance's nail material instead of the tissue placeholder
        ...attachments.materials.filter((m: IAutoMovieMaterial): boolean =>
          nails.parts.some((p): boolean => p.material === m.id),
        ),
        nails.material,
        ...hair.materials,
        ...stick.materials,
      ],
      ...(images.length === 0 ? {} : { images }),
      asset: null,
    };
  }

  /**
   * Admit a pose for this person and convert it into the engine pose films play.
   *
   * @param props The pose
   * @returns Engine pose on this person's skeleton, root left to the scene
   * @throws {AutoMovieHumanAdmissionError} When the pose names a bone this person lacks, repeats a bone, or exceeds this person's range of motion
   */
  public pose(props: { pose: IAutoMovieHumanPose }): IAutoMoviePose {
    const skeleton: IAutoMovieSkeleton = this.getSkeleton();
    const admitted: IValidation<IAutoMovieHumanPose> =
      validateAutoMovieHumanPose(props.pose, skeleton);
    if (admitted.success === false)
      throw new AutoMovieHumanAdmissionError("pose", admitted.errors);
    return convertAutoMovieHumanPose(admitted.data, skeleton.id);
  }

  /**
   * Admit an expression for this person and convert it into the engine expression films play.
   *
   * Films drive faces by the 52 ARKit channel names, and this person's face will carry those channels as morph targets generated from its own action-unit articulation. Until the face carries them, every admitted expression converts to the neutral face, which is what a model without morph targets displays in any case.
   *
   * @param props The expression
   * @returns Engine expression
   * @throws {AutoMovieHumanAdmissionError} When the expression is refused
   */
  public express(props: {
    expression: IAutoMovieHumanExpression;
  }): IAutoMovieExpression {
    const admitted: IValidation<IAutoMovieHumanExpression> =
      validateAutoMovieHumanExpression(props.expression);
    if (admitted.success === false)
      throw new AutoMovieHumanAdmissionError("expression", admitted.errors);
    return { preset: "neutral", intensity: 0, blendshapes: null };
  }

  /**
   * Id of this person's skeleton, derived from the model id.
   *
   * @returns Skeleton id
   */
  private skeletonId(): string {
    return `${this.id_}.skeleton`;
  }
}
export namespace AutoMovieHuman {
  /**
   * What a person is built from.
   *
   * @author Samchon
   */
  export interface IProps {
    /** Model id films cite; the skeleton id is derived from it. */
    id: string;

    /** The detailed identity; it is admitted and copied. */
    identity: IAutoMovieHumanIdentity;

    /**
     * Generators replacing the human profile's for some parts, such as another species' ear; omitted parts keep `AUTOMOVIE_HUMAN_PART_GENERATORS`. A replacement opens the same rings, so it joins without any other part changing.
     */
    parts?: Partial<IAutoMovieHumanPartGenerators>;
  }

  /**
   * What a person is built from when starting from beginner traits.
   *
   * @author Samchon
   */
  export interface ITraitsProps {
    /** Model id films cite; the skeleton id is derived from it. */
    id: string;

    /** Beginner traits; they are admitted and copied. */
    traits: IAutoMovieHumanTraits;

    /** Converter from traits to identity; omitted, {@link AutoMovieHumanConverter}. */
    converter?: IAutoMovieHumanConverter;

    /** Generators replacing the human profile's for some parts, as in {@link IProps.parts}. */
    parts?: Partial<IAutoMovieHumanPartGenerators>;
  }
}
