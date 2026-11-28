import { type AutoMovieArchetype } from "../core/index";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { createDog as createDogImplementation } from "./dog/createDog";
import { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";
import { type DogCohort } from "./dog/typings/DogCohort";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand, AutoMovieArchetypeRefusal, type AutoMovieArchetypeBuilder } from "../core";
import { dogModelDimensions } from "./dog/dogModelDimensions";
import { measureDogNeckLength } from "./dog/measureDogNeckLength";

/** Creates Husky stock bodies from Pet, Show and Sled cohort measurements. */
export namespace AutoMovieArchetypeDog {
  /**
   * Creates a coarse Husky rig from one complete morphometric cohort.
   *
   * Pet, Show and Sled supply distinct body proportions. Tack is optional.
   * A collar surrounds the neck and adds one straight lead with a grasp.
   * An omitted cohort limits collar width to the shortest selectable neck.
   * A named cohort admits that cohort's own width limit.
   *
   * @param params Required whole-model mass, plus optional ID, cohort, tempo
   *   and collar dimensions.
   * @param seed Draws an omitted cohort and tempo. Omit the seed for Pet and
   *   zero tempo displacement.
   * @returns The dog body with its authored mass and optional `lead` contact.
   * @throws {AutoMovieArchetypeRefusal} If a cohort, tempo, size or collar
   *   setting falls outside its admitted choices.
   */
  export function create(params: AutoMovieArchetypeDog.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeDog.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
    return createDogImplementation(params, seed);
  }

  /** Available contact `lead`, a rein grasp on the shaft of the fitted lead. */
  export type Affordance = "lead";

  /** Dimensions in metres of the optional collar and straight lead. */
  export interface ICollar extends AutoMovieArchetypeQuadrupedLead.IParams {}

  /**
   * Sets the required mass and optional provenance, timing and tack.
   *
   * Choose a named cohort to fit that neck. Omit the collar to build a bare
   * dog.
   */
  export interface IParams {
    /** Scene-unique model ID. Defaults to `dog`. */
    id?: string;
    /** Finite positive whole-model kilograms, including tack when fitted. */
    mass: number;
    /**
     * Morphometric cohort. An omitted cohort is drawn, with Pet as the
     * seedless default.
     */
    cohort?: DogCohort;
    /**
     * Stride-time displacement from the nominal clock, in standard deviations
     * from −1 to 1.
     */
    tempo?: number;
    /** Authored neck fitting and straight lead. Omit it for a bare dog. */
    collar?: ICollar;
  }

  /**
   * A 22 kg authoring preset for the gallery's specimen.
   *
   * Pass that mass explicitly to `create`. The cohort measurement table
   * supplies separate heights and girths.
   */
  export const REFERENCE: Readonly<Pick<IParams, "mass">> = { mass: 22 };

  /**
   * Metres for withers height and girth, kilograms for mass, no unit for
   * tempo.
   */
  export const UNITS: Readonly<
    Record<
      AutoMovieArchetypeQuadrupedBody.Dimension,
      AutoMovieArchetypeDrawSession.Unit
    >
  > = {
    withersHeight: "m",
    girth: "m",
    mass: "kg",
    tempo: "",
  };

  /**
   * Preserves each cohort's measured withers-height and girth pair in metres.
   *
   * The draw takes both measurements from one row. Pet first supplies the
   * seedless pair 0.5692 m and 0.6723 m.
   */
  export const MODELS: Readonly<
    Record<
      DogCohort,
      Readonly<
        Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
      >
    >
  > = {
    pet: dogModelDimensions("pet"),
    show: dogModelDimensions("show"),
    sled: dogModelDimensions("sled"),
  };

  /**
   * Inclusive authored range from −1 to 1 stride-time standard deviations.
   *
   * The seedless midpoint is zero. The provenance retains the pooled
   * canine stride-time standard deviation of 0.13 s.
   */
  export const TEMPO: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    -1,
    1,
    "one standard deviation around the pooled Labrador stride time: Light et al. 2010, AJVR 71:997, doi:10.2460/ajvr.71.9.997",
  );

  /**
   * Distances from neck to poll on the three generated neutral rigs, in metres.
   *
   * A named cohort uses its own clearance. An unrestricted cohort draw uses
   * the shortest of these measured rig lengths.
   */
  export const NECK_LENGTHS: Readonly<Record<DogCohort, number>> = {
    pet: measureDogNeckLength("pet", MODELS.pet),
    show: measureDogNeckLength("show", MODELS.show),
    sled: measureDogNeckLength("sled", MODELS.sled),
  };

  /** Admission checks `width`, `thickness`, `leadLength` and `leadRadius`. */
  export const COLLAR_DIMENSIONS: readonly (keyof ICollar)[] = [
    "width",
    "thickness",
    "leadLength",
    "leadRadius",
  ];

  /**
   * Admits a finite positive dimension against an optional upper limit.
   *
   * @param axis Authoring field shown in a refusal.
   * @param value Dimension to admit, in `unit`.
   * @param unit Display unit for the admitted interval.
   * @param maximum Inclusive upper bound when supplied.
   * @throws {AutoMovieArchetypeRefusal} If the input is nonfinite, nonpositive or
   *   exceeds the supplied maximum.
   */
  export function positive(
    axis: string,
    value: number,
    unit: string,
    maximum?: number,
  ): void {
    if (
      !Number.isFinite(value) ||
      !(value > 0 && (maximum === undefined || value <= maximum))
    )
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "dog",
        axis,
        value,
        feasible: { kind: "range", minimum: 0, maximum: maximum ?? null, unit },
        reason: `${axis} must be finite and positive${maximum === undefined ? "" : ` and fit within ${maximum} ${unit}`}`,
        fix: `supply a ${axis} in the stated range${axis === "collar.width" ? ", or name a cohort with a longer neck" : ""}`,
      });
  }

  /**
   * Fits a collar and its `lead` contact to a dog's neutral neck.
   *
   * @param builder Dog under construction.
   * @param rig Neutral neck endpoints and radius.
   * @param tack Authored collar and lead lengths, in metres.
   * @throws {AutoMovieArchetypeRefusal} If an authored length is invalid or
   *   the collar exceeds the available neck length.
   */
  export function collar(
    builder: AutoMovieArchetypeBuilder<
      Affordance,
      AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    rig: AutoMovieArchetypeQuadrupedBody.IRig,
    tack: ICollar,
  ): void {
    AutoMovieArchetypeQuadrupedLead.lay(builder, rig, "lead", tack, "dog");
  }}
