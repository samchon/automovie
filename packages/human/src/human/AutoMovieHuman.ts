import {
  IAutoMovieExpression,
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { IValidation } from "typia";

import { dressAutoMovieHumanNails } from "../appearance/dressAutoMovieHumanNails";
import { dressAutoMovieHumanSkin } from "../appearance/dressAutoMovieHumanSkin";
import { emitAutoMovieHumanHair } from "../appearance/emitAutoMovieHumanHair";
import { paintAutoMovieHumanSkinFeatures } from "../appearance/paintAutoMovieHumanSkinFeatures";
import { paintAutoMovieHumanSkinRelief } from "../appearance/paintAutoMovieHumanSkinRelief";
import { validateAutoMovieHumanAppearance } from "../appearance/validateAutoMovieHumanAppearance";
import { AutoMovieHumanCurveDesign } from "../curves/AutoMovieHumanCurveDesign";
import { inspectAutoMovieHumanCurveDesign } from "../curves/inspectAutoMovieHumanCurveDesign";
import { IAutoMovieHumanEyeHairHost } from "../junction/IAutoMovieHumanEyeHairHost";
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
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import { IAutoMovieHumanCurveSupplement } from "../structures/IAutoMovieHumanCurveSupplement";
import { IAutoMovieHumanExpression } from "../structures/IAutoMovieHumanExpression";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanPose } from "../structures/IAutoMovieHumanPose";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";
import type { IAutoMovieHumanSurfaceMeasurements } from "../structures/IAutoMovieHumanSurfaceMeasurements";
import { AutoMovieHumanRestSurface } from "../surface/AutoMovieHumanRestSurface";
import { AUTOMOVIE_HUMAN_PART_GENERATORS } from "./AUTOMOVIE_HUMAN_PART_GENERATORS";
import { AUTOMOVIE_HUMAN_SKIN_MATERIAL } from "./AUTOMOVIE_HUMAN_SKIN_MATERIAL";
import { IAutoMovieHumanPartGenerators } from "./IAutoMovieHumanPartGenerators";
import { emitAutoMovieHumanAttachments } from "./emitAutoMovieHumanAttachments";
import { emitAutoMovieHumanSkinParts } from "./emitAutoMovieHumanSkinParts";
import { generateAutoMovieHumanCages } from "./generateAutoMovieHumanCages";
import { generateAutoMovieHumanRest } from "./generateAutoMovieHumanRest";

/**
 * One person, generated from a detailed identity by code: the skeleton, the model films use, posing and expression.
 *
 * Construction admits an immutable identity and resolves its measurements and skeleton once. Explicit physical rest targets are separate request documents; successful model emission selects their corresponding inspection state. A different identity creates a new instance. The instance owns its caches, and a host keeps the previous display when input admission or generation is refused.
 *
 * The output contract with films is `IAutoMovieModel`, with `origin: "generated"`. The generated rest-field route uses detailed identity, the common skeleton and optional physical observations for both skin and construction. Automatic support planes and unmeasured aspects remain qualified rest conventions. Its current anatomical layout is partial; `inspectSurface` reports actual open boundaries and missing regions. Without that explicit selection, the previous cage assembly remains a separately identified route.
 *
 * The model includes the generated skin and a stick inspection figure. Skin finish and seeded surface marks follow the admitted appearance; teeth and underwear remain incomplete. Methods refuse inadmissible documents with {@link AutoMovieHumanAdmissionError}, naming each field, bound and cause.
 *
 * @author Samchon
 */
export class AutoMovieHuman {
  private readonly id_: string;
  private readonly measurements_: IAutoMovieHumanMeasurements;
  private readonly skeleton_: IAutoMovieHumanSkeleton;
  private readonly generators_: IAutoMovieHumanPartGenerators;
  private surface_: AutoMovieHumanRestSurface | undefined;
  private inspectionSurface_: IAutoMovieHumanSurfaceMeasurements | undefined;
  /** Independent curve inspection cache sharing this person's resolved measurements and rest skeleton. */
  private curveDesign_: AutoMovieHumanCurveDesign | undefined;
  private rest_: Partial<
    Record<"parts" | "joined", ReturnType<typeof generateAutoMovieHumanRest>>
  > = {};
  private cages_: ReturnType<typeof generateAutoMovieHumanCages> | undefined;
  private inspectionAssembly_: "parts" | "joined" = "parts";
  /** At most one current feature atlas per assembly, owned by this immutable person's rest surfaces. */
  private skinTextures_: Partial<
    Record<
      "parts" | "joined",
      { key: string; value: paintAutoMovieHumanSkinFeatures.IOutput | null }
    >
  > = {};
  /** One current physical normal bake per rest assembly; equivalent wrinkle depths reuse it without retaining earlier states. */
  private skinRelief_: Partial<
    Record<
      "parts" | "joined",
      { furrows: number; value: paintAutoMovieHumanSkinRelief.IOutput }
    >
  > = {};
  /** Latest successfully emitted hair construction per assembly; before getModel there is none. */
  private hairInspection_: Partial<
    Record<"parts" | "joined", () => IAutoMovieHumanConstructionNet[]>
  > = {};
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
   * Generate the neutral curve design from additional named physical measurements.
   *
   * The design reads this instance's already resolved skeleton before constructing its regional families. It does not replace the existing skin, generate a new surface, or reinterpret a refused design as an invalid identity. Exact primitives and physical transverse fields retain millimetres; inspection nets alone use metres. A failed edit preserves the worker's last valid cache without returning it as the failed edit's result.
   *
   * @param props.detailed Additional measured dimensions; missing dimensions produce explicit findings instead of source calibration defaults
   * @param props.pelvisRepresentation Explicit representation selection; omitted, the external R6b baseline remains selected
   * @returns Exact regional operators and display nets, or scoped design findings
   */
  public inspectCurveDesign(
    props: {
      detailed?: IAutoMovieHumanCurveSupplement;
      pelvisRepresentation?: "external-r6b" | "pants-r6";
    } = {},
  ): inspectAutoMovieHumanCurveDesign.Result {
    this.curveDesign_ ??= new AutoMovieHumanCurveDesign({
      measurements: this.measurements_,
      skeleton: this.skeleton_,
    });
    return this.curveDesign_.inspectCurveDesign(props);
  }
  /**
   * The construction net of every generated part, for inspecting how its surface was built: each sweep's spine, stations, guides and features, the network's curves, the part's rings and its control cage, in the model frame at rest, metres. It is a debug output, never part of the model.
   *
   * Hair construction, when available, is the same latest successful getModel emission for the selected assembly. Before its first model there is no hair net; another assembly does not borrow that appearance's cards.
   *
   * @param props.assembly Previous cage assembly; omitted, the last selected assembly. surfaceMeasurements instead inspects the generated physical field, as does the last successful generated model.
   * @returns One net per lofted part instance
   */
  public inspect(
    props: { assembly?: "parts" | "joined"; surfaceMeasurements?: IAutoMovieHumanSurfaceMeasurements } = {},
  ): IAutoMovieHumanConstructionNet[] {
    const surface: IAutoMovieHumanSurfaceMeasurements | undefined =
      props.surfaceMeasurements ?? (props.assembly === undefined ? this.inspectionSurface_ : undefined);
    if (surface !== undefined) return this.inspectSurface({measurements: surface}).construction;
    const assembly: "parts" | "joined" =
      props.assembly ?? this.inspectionAssembly_;
    return structuredClone([
      ...this.rest(assembly).construction,
      ...(this.hairInspection_[assembly]?.() ?? []),
    ]);
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
  /** Generate/inspect the same explicit physical rest definition as getModel's surfaceMeasurements selection. Missing charts remain partial; a refused input throws without replacing the last successful cache. */
  public inspectSurface(props: {
    measurements: IAutoMovieHumanSurfaceMeasurements;
  }): AutoMovieHumanRestSurface.Result {
    this.surface_ ??= new AutoMovieHumanRestSurface({
      measurements: this.measurements_, skeleton: this.skeleton_,
    });
    return this.surface_.inspect(props.measurements);
  }
  /**
   * The person as a model films place and pose like any other.
   *
   * The model holds the stick figure of the skeleton, a capsule from each joint centre to the bone's end and a sphere at each joint, every bone including fingers, eyes and jaw, coloured grey on the midline, red on the person's left and blue on the right, and the skin. With `assembly: "parts"`, the default while the parts are being built, the skin is every part's own cage subdivided alone, one static model part each with id `skin.<part>` or `skin.<part>.<side>`, so the viewer can isolate a part and judge it before joining. With `assembly: "joined"` the skin is the person: every part's cage joined through its rings, subdivided once as one surface, and emitted as one skinned mesh `skin` with limit normals and the published UV layout. Separate meshes a part carries, such as the nail plates and the eyeballs, are their own parts riding one bone each, id `<part>[.<side>].<name>`, and the model carries the images their materials sample, such as each iris. The skin's material follows the identity's pigmentation and the appearance's finish and samples a generated relief image the model carries. Nail plates show the nail bed of the person's pigmentation with a pale free edge. Scalp hair, brows and lashes are cards grown on the emitted head's surface, parts `hair`, `brows` and `lashes` riding the head bone; teeth and underwear follow as their generators land. The appearance is admitted already, so a document that will be refused later is refused now.
   *
   * surfaceMeasurements selects the parameter-generated partial field and its plain material. Missing charts emit no old skin or attachments. inspectSurface reports its open boundaries and limitations. Otherwise plain finish skips only the previous skin's normal/mark bakers.
   *
   * @param props The appearance to wear, skin assembly and optional provisional finish
   * @returns Model with `origin: "generated"`
   * @throws {AutoMovieHumanAdmissionError} When the appearance is refused
   * @throws {Error} When the selected head does not supply the eye-hair appearance capability for this person; brows are currently always enabled, even with zero scalp/lash length
   */
  public getModel(props: {
    appearance: IAutoMovieHumanAppearance;
    assembly?: "parts" | "joined";
    /** Authored finish retains the normal/mark atlas path; plain keeps pigmentation and coarse material only, skipping those bakers. */
    skinFinish?: "authored" | "plain";
    /** Explicit physical T-rest surface route. It emits implemented charts only, with plain finish and no attachment from missing charts; inspectSurface reports its partial state. */
    surfaceMeasurements?: IAutoMovieHumanSurfaceMeasurements;
  }): IAutoMovieModel {
    if (
      props.skinFinish !== undefined &&
      props.skinFinish !== "authored" &&
      props.skinFinish !== "plain"
    )
      throw new Error("Skin finish must be authored or plain");
    const admitted: IValidation<IAutoMovieHumanAppearance> =
      validateAutoMovieHumanAppearance(props.appearance);
    if (admitted.success === false)
      throw new AutoMovieHumanAdmissionError("appearance", admitted.errors);
    if (props.surfaceMeasurements !== undefined) {
      const selected: IAutoMovieHumanSurfaceMeasurements = structuredClone(props.surfaceMeasurements);
      this.surface_ ??= new AutoMovieHumanRestSurface({
        measurements: this.measurements_, skeleton: this.skeleton_,
      });
      const model: IAutoMovieModel = this.surface_.model({
        id: this.id_, input: selected,
        appearance: admitted.data, skeleton: this.getSkeleton(),
      });
      this.inspectionSurface_ = selected;
      return model;
    }
    const eyeHairHost: IAutoMovieHumanEyeHairHost | undefined =
      this.generators_.head.eyeHairHost?.({
        measurements: this.measurements_,
        skeleton: this.skeleton_,
        side: null,
      });
    if (eyeHairHost === undefined)
      throw new Error(
        "The selected head does not support the required eye-hair appearance capability; brows are enabled even when lash length is zero.",
      );
    if (
      eyeHairHost.context.measurements !== this.measurements_ ||
      eyeHairHost.context.skeleton !== this.skeleton_
    )
      throw new Error(
        "The selected head returned an eye-hair appearance capability for another person context.",
      );
    const stick: emitAutoMovieHumanStick.IOutput = emitAutoMovieHumanStick(
      this.skeleton_,
      this.measurements_.identity.body.stature,
    );
    const skin: Pick<
      ReturnType<typeof emitAutoMovieHumanSkinParts>,
      "parts" | "materials"
    > = {
      parts: structuredClone(this.rest(props.assembly ?? "parts").parts),
      materials: [AUTOMOVIE_HUMAN_SKIN_MATERIAL],
    };
    const attachments: ReturnType<typeof emitAutoMovieHumanAttachments> =
      emitAutoMovieHumanAttachments(
        this.measurements_,
        this.skeleton_,
        2,
        this.generators_,
        skin.parts,
      );
    // the appearance decides the skin's material in place of the parts' placeholder
    const dressed: ReturnType<typeof dressAutoMovieHumanSkin> =
      dressAutoMovieHumanSkin({
        parts: skin.parts,
        measurements: this.measurements_,
        skeleton: this.skeleton_,
        skin: admitted.data.skin,
        features:
          props.skinFinish === "plain"
            ? null
            : this.skinTextures(admitted.data.skin, props.assembly ?? "parts"),
        relief:
          props.skinFinish === "plain"
            ? null
            : this.skinRelief(
                admitted.data.skin.wrinkles,
                props.assembly ?? "parts",
              ),
      });
    const hair: ReturnType<typeof emitAutoMovieHumanHair> =
      emitAutoMovieHumanHair({
        measurements: this.measurements_,
        skeleton: this.skeleton_,
        appearance: admitted.data,
        skin: skin.parts,
        eyeHairHost,
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
    this.inspectionAssembly_ = props.assembly ?? "parts";
    this.inspectionSurface_ = undefined;
    this.hairInspection_[this.inspectionAssembly_] = hair.inspect;
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
          nails.parts.some(
            (p: IAutoMovieModelPart): boolean => p.material === m.id,
          ),
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
  /** Immutable source cages and at most two assembly-specific rest results, retained by this person; failures are not cached. */
  private rest(
    assembly: "parts" | "joined",
  ): ReturnType<typeof generateAutoMovieHumanRest> {
    this.cages_ ??= generateAutoMovieHumanCages(
      this.measurements_,
      this.skeleton_,
      this.generators_,
    );
    this.rest_[assembly] ??= generateAutoMovieHumanRest(
      this.measurements_,
      this.skeleton_,
      this.generators_,
      assembly,
      this.cages_,
    );
    return this.rest_[assembly]!;
  }

  /** Cache only the current mark state; sheen/wrinkle/hair edits reuse the equivalent actual rest atlas. Failure does not replace a successful cache entry. */
  private skinTextures(
    skin: IAutoMovieHumanAppearance.ISkin,
    assembly: "parts" | "joined",
  ): paintAutoMovieHumanSkinFeatures.IOutput | null {
    const key: string = JSON.stringify([
      skin.seed,
      skin.freckles?.density,
      skin.freckles?.diameterMm,
      skin.freckles?.contrast,
      skin.acne?.density,
      skin.acne?.diameterMm,
      skin.acne?.severity,
    ]);
    const saved:
      | { key: string; value: paintAutoMovieHumanSkinFeatures.IOutput | null }
      | undefined = this.skinTextures_[assembly];
    if (saved?.key === key) return saved.value;
    const rest: ReturnType<typeof generateAutoMovieHumanRest> =
      this.rest(assembly);
    const value: paintAutoMovieHumanSkinFeatures.IOutput | null =
      paintAutoMovieHumanSkinFeatures({
        parts: rest.parts,
        domains: rest.domains,
        skin,
        pigmentation: this.measurements_.identity.pigmentation,
      });
    this.skinTextures_[assembly] = { key, value };
    return value;
  }

  /** Reuse the current physical normal bake for this actual immutable rest assembly and quantized depth; dressing copies image records. */
  private skinRelief(
    wrinkles: number,
    assembly: "parts" | "joined",
  ): IAutoMovieImage {
    const furrows: number = Math.round(wrinkles * 100) / 100;
    const saved:
      | { furrows: number; value: paintAutoMovieHumanSkinRelief.IOutput }
      | undefined = this.skinRelief_[assembly];
    if (saved?.furrows === furrows) return saved.value.image;
    const rest: ReturnType<typeof generateAutoMovieHumanRest> =
      this.rest(assembly);
    const value: paintAutoMovieHumanSkinRelief.IOutput =
      paintAutoMovieHumanSkinRelief({
        parts: rest.parts,
        domains: rest.domains,
        furrows,
      });
    this.skinRelief_[assembly] = { furrows, value };
    return value.image;
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
    /** Overrides of the previous cage route; the explicit generated physical field does not consume these generators. */
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
