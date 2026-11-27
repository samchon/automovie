import { type AutoMovieArchetype } from "../core/index";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { createDog as createDogImplementation } from "./internal/createDog";
import { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";
import { type DogCohort } from "./dog/internal/typings/DogCohort";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand, AutoMovieArchetypeRefusal, type AutoMovieArchetypeBuilder } from "../core";
import { dogModelDimensions } from "./dog/internal/dogModelDimensions";
import { measureDogNeckLength } from "./dog/internal/measureDogNeckLength";

/** Public operations for Auto Movie Archetype Dog. */
export namespace AutoMovieArchetypeDog {
  /**
   * A coarse Husky prototype from one published Pet, Show or Sled cohort mean.
   *
   * The coarse surface proportions follow measured cohort means. Skeletal
   * controls are authored from those measurements. The author supplies mass
   * because that morphometric table reports no weights; it is the whole model's
   * mass, including any authored collar/lead. Segment density is uniform and paw
   * friction/restitution remain unknown. The optional collar is a finite annular
   * fitting whose dimensions the author supplies; its straight lead offers one
   * real rein contact. Without a named cohort its width must fit every selectable
   * neck, so acceptance never depends on the seed. Naming a cohort admits that
   * cohort's own neck length. No saddle exists.
   *
   * @param params Required positive mass in kilograms, optional cohort, tempo and
   *   authored collar.
   * @param seed Picks one whole cohort and the tempo; absent, Pet and mean tempo.
   * @returns The dog, including its parts and optional lead affordance.
   * @throws {AutoMovieArchetypeRefusal} For invalid mass, cohort, tempo or collar
   *   dimensions.
   */
  export function create(params: AutoMovieArchetypeDog.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeDog.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
    return createDogImplementation(params, seed);
  }

  /** A lead is a rein contact, never a rider's seat. */
  export type Affordance = "lead";

  /** Authored dimensions, all metres, of the collar and straight lead. */
  export interface ICollar extends AutoMovieArchetypeQuadrupedLead.IParams {}

  /** The author supplies total model mass; absent tack means a bare dog. */
  export interface IParams {
    /** Optional instance id. */
    id?: string;
    /** Positive finite kilograms, including any drawn tack. */
    mass: number;
    /** One whole morphometric cohort; selected from seed when absent. */
    cohort?: DogCohort;
    /** Stride-time displacement in standard deviations, from -1 to 1. */
    tempo?: number;
    /** Explicit collar/lead dimensions; no maker or physiological claim. */
    collar?: ICollar;
  }

  /**
   * An explicitly authored 22 kg specimen for the gallery's reference view.
   * This mass is a presentation choice; the morphometric cohort table supplies
   * no mass. Callers still provide mass to createDog, and the seed still
   * selects a whole cohort.
   */
  export const REFERENCE: Readonly<Pick<IParams, "mass">> = { mass: 22 };

  /** The shared dimensions and their physical units. */
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

  /** Whole height/girth pairs from Huson et al. 2025 Table 1, metres. */
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
   * The existing one-standard-deviation authoring range, applied to Light et
   * al. 2010's canine pooled stride-time SD of 0.13 s.
   */
  export const TEMPO: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    -1,
    1,
    "one standard deviation around the pooled Labrador stride time: Light et al. 2010, AJVR 71:997, doi:10.2460/ajvr.71.9.997",
  );

  /**
   * Constructed neck lengths, metres; the narrowest limits a collar when any
   * cohort may be drawn.
   */
  export const NECK_LENGTHS: Readonly<Record<DogCohort, number>> = {
    pet: measureDogNeckLength("pet", MODELS.pet),
    show: measureDogNeckLength("show", MODELS.show),
    sled: measureDogNeckLength("sled", MODELS.sled),
  };

  /** Every authored collar length checked before geometry is made. */
  export const COLLAR_DIMENSIONS: readonly (keyof ICollar)[] = [
    "width",
    "thickness",
    "leadLength",
    "leadRadius",
  ];

  /**
   * Admit a positive authored physical dimension, with no numerical repair.
   *
   * @param axis The authored parameter named in a refusal.
   * @param value The given value in the stated unit.
   * @param unit Its physical unit.
   * @param maximum Optional inclusive geometric limit, in the same unit.
   * @throws {AutoMovieArchetypeRefusal} For nonfinite or nonpositive values.
   */
  export function positive(
    axis: string,
    value: number,
    unit: string,
    maximum?: number,
  ): void {
    if (!(value > 0 && (maximum === undefined || value <= maximum)))
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
   * Lay one collar within the neck and put the rein frame on its lead.
   *
   * @param builder The model under construction.
   * @param rig Its rest landmarks.
   * @param tack The admitted positive authored lengths, metres.
   * @throws {AutoMovieArchetypeRefusal} When the collar is longer than the
   *   neck.
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
