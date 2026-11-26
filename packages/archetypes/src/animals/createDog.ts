import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "./AutoMovieArchetypeQuadrupedHeadAttachment";
import { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";
import { QuadrupedAnimal } from "./QuadrupedAnimal";
import { buildDogBody } from "./dog/internal/buildDogBody";
import { DOG_BODY_MEASURES } from "./dog/internal/constants/DOG_BODY_MEASURES";
import { dogModelDimensions } from "./dog/internal/dogModelDimensions";
import { measureDogNeckLength } from "./dog/internal/measureDogNeckLength";
import type { IDogBodyMeasures } from "./dog/internal/structures/IDogBodyMeasures";
import type { DogCohort } from "./dog/internal/typings/DogCohort";

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
export function createDog(
  params: createDog.IParams,
  seed?: number,
): AutoMovieArchetype<
  createDog.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  createDog.positive("mass", params.mass, "kg");
  if (params.collar !== undefined)
    for (const key of createDog.COLLAR_DIMENSIONS)
      createDog.positive(`collar.${key}`, params.collar[key], "m");
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeQuadrupedBody.Dimension> =
    new AutoMovieArchetypeDrawSession("dog", createDog.UNITS, seed, params);
  const model: AutoMovieArchetypeDrawSession.IModel<
    DogCohort,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = draw.model("cohort", params.cohort, createDog.MODELS);

  // The nonempty model catalogue guarantees a named cohort.
  const cohort: DogCohort = model.name!;
  const measures: Readonly<IDogBodyMeasures> = DOG_BODY_MEASURES[cohort];
  if (params.collar !== undefined)
    createDog.positive(
      "collar.width",
      params.collar.width,
      "m",
      params.cohort === undefined
        ? Math.min(...Object.values(createDog.NECK_LENGTHS))
        : createDog.NECK_LENGTHS[cohort],
    );
  draw.dimensions({ tempo: createDog.TEMPO });
  draw.derive("mass", params.mass);
  return QuadrupedAnimal({
    id: params.id,
    name: `${cohort} Husky prototype`,
    body: buildDogBody(cohort),
    draw,
    add: (
      builder: AutoMovieArchetypeBuilder<
        createDog.Affordance,
        AutoMovieArchetypeQuadrupedBody.Dimension
      >,
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
    ): void => {
      const radius: number =
        (measures.foreCircumference / (2 * Math.PI)) *
        AutoMovieArchetypeUnits.CENTIMETRE;
      for (const side of ["left", "right"] as const) {
        const base: IAutoMovieVector3 =
          AutoMovieArchetypeQuadrupedHeadAttachment(
            rig,
            Vector3.create(
              ((side === "left" ? 1 : -1) *
                measures.eyes *
                AutoMovieArchetypeUnits.CENTIMETRE) /
                2,
              rig.poll.y + rig.headRadius,
              rig.poll.z,
            ),
            radius,
          );
        builder.rod(
          `${side}Ear`,
          radius,
          base,
          {
            ...base,
            y: base.y + measures.ear * AutoMovieArchetypeUnits.CENTIMETRE,
          },
          { color: "#8a8c90" },
        );
      }
      if (params.collar !== undefined)
        createDog.collar(builder, rig, params.collar);
    },
  });
}

/** The Husky catalogue and authored tack contract of createDog. */
export namespace createDog {
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
    AutoMovieArchetypeQuadrupedLead(builder, rig, "lead", tack, "dog");
  }
}
