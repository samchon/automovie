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
import { AutoMovieArchetypeDogBody } from "./AutoMovieArchetypeDogBody";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "./AutoMovieArchetypeQuadrupedHeadAttachment";
import { AutoMovieArchetypeQuadrupedLead } from "./AutoMovieArchetypeQuadrupedLead";
import { QuadrupedAnimal } from "./QuadrupedAnimal";

/**
 * A coarse Husky prototype from one published Pet, Show or Sled cohort mean.
 *
 * The measured surface proportions are AutoMovieArchetypeDogBody's, not a validated skeletal
 * model. Mass is authored because that morphometric table reports no weights;
 * it is the whole model's mass, including any authored collar/lead. Segment
 * density is uniform and paw friction/restitution remain unknown. The optional
 * collar is a solid cylindrical drawing proxy whose dimensions the author
 * supplies; its straight lead offers one real rein contact. Without a named
 * cohort its width must fit every selectable neck, so acceptance never depends
 * on the seed. Naming a cohort admits that cohort's own neck length. No saddle exists.
 *
 * @param params Required positive mass in kilograms, optional cohort, tempo and authored collar.
 * @param seed Picks one whole cohort and the tempo; absent, Pet and mean tempo.
 * @returns The dog, including its parts and optional lead affordance.
 * @throws {AutoMovieArchetypeRefusal} For invalid mass, cohort, tempo or collar dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States source scope, authored mass, contact, units and remaining physical gaps.
 * @evidence contracts/development/implementation.md#principled-implementation One whole-cohort model draw feeds the shared quadruped builder. The head capsule contains each complete ear root disk through the shared radius-aware attachment owner, preserving measured ear length and its authored upright direction; no equine weight law or changed head size is used.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit mass and tack, select the cohort, record dimensions and build the body with ears and optional collar.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No independent trait bands, invented canine mass shares, paw friction or rider contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-size coarse rig and at most five added parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One draw session owns the selected cohort and every dimension.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns an independently owned model without external resources.
 */
export function createDog(
  params: createDog.IParams,
  seed?: number | string,
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
    AutoMovieArchetypeDogBody.Cohort,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = draw.model("cohort", params.cohort, createDog.MODELS);

  // The nonempty model catalogue guarantees a named cohort.
  const cohort: AutoMovieArchetypeDogBody.Cohort = model.name!;
  const measures: AutoMovieArchetypeDogBody.IMeasures =
    AutoMovieArchetypeDogBody.MEASURES[cohort];
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
    body: AutoMovieArchetypeDogBody(cohort),
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

/**
 * The Husky catalogue and authored tack contract of createDog.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states whether it is a measured model or an authored dimension.
 * @evidence contracts/development/design.md#principled-representation Closed cohorts with whole measured height/girth pairs, plus positive authored mass and tack lengths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only createDog's inputs and the shared quadruped dimensions are exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Tack dimensions have no invented default or breed-size law.
 */
export namespace createDog {
  /** A lead is a rein contact, never a rider's seat. */
  export type Affordance = "lead";

  /** Authored dimensions, all metres, of the solid collar and straight lead. */
  export interface ICollar extends AutoMovieArchetypeQuadrupedLead.IParams {}

  /** The author supplies total model mass; absent tack means a bare dog. */
  export interface IParams {
    /** Optional instance id. */
    id?: string;
    /** Positive finite kilograms, including any drawn tack. */
    mass: number;
    /** One whole morphometric cohort; selected from seed when absent. */
    cohort?: AutoMovieArchetypeDogBody.Cohort;
    /** Stride-time displacement in standard deviations, from -1 to 1. */
    tempo?: number;
    /** Explicit collar/lead dimensions; no maker or physiological claim. */
    collar?: ICollar;
  }

  /** An explicitly authored 22 kg specimen for the gallery's reference view. This mass is a presentation choice; the morphometric cohort table supplies no mass. Callers still provide mass to createDog, and the seed still selects a whole cohort. */
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
      AutoMovieArchetypeDogBody.Cohort,
      Readonly<
        Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
      >
    >
  > = {
    pet: figures("pet"),
    show: figures("show"),
    sled: figures("sled"),
  };

  /** The existing one-standard-deviation authoring range, applied to Light et al. 2010's canine pooled stride-time SD of 0.13 s. */
  export const TEMPO: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    -1,
    1,
    "one standard deviation around the pooled Labrador stride time: Light et al. 2010, AJVR 71:997, doi:10.2460/ajvr.71.9.997",
  );

  /** Constructed neck lengths, metres; the narrowest limits a collar when any cohort may be drawn. */
  export const NECK_LENGTHS: Readonly<
    Record<AutoMovieArchetypeDogBody.Cohort, number>
  > = {
    pet: neckLength("pet"),
    show: neckLength("show"),
    sled: neckLength("sled"),
  };

  /** Every authored collar length checked before geometry is made. */
  export const COLLAR_DIMENSIONS: readonly (keyof ICollar)[] = [
    "width",
    "thickness",
    "leadLength",
    "leadRadius",
  ];

  /** Convert one complete cohort's measured dimensions from centimetres. */
  function figures(
    cohort: AutoMovieArchetypeDogBody.Cohort,
  ): Readonly<
    Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
  > {
    const m: AutoMovieArchetypeDogBody.IMeasures =
      AutoMovieArchetypeDogBody.MEASURES[cohort];
    return {
      withersHeight: m.withers * AutoMovieArchetypeUnits.CENTIMETRE,
      girth: m.girth * AutoMovieArchetypeUnits.CENTIMETRE,
    };
  }

  /** Read the constructed neck from the same rig owner that builds it. */
  function neckLength(cohort: AutoMovieArchetypeDogBody.Cohort): number {
    const rig: AutoMovieArchetypeQuadrupedBody.IRig =
      AutoMovieArchetypeQuadrupedBody.rig(
        AutoMovieArchetypeDogBody(cohort),
        MODELS[cohort],
      );
    return Vector3.length(Vector3.subtract(rig.poll, rig.neck));
  }

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
    if (
      !(
        Number.isFinite(value) &&
        value > 0 &&
        (maximum === undefined || value <= maximum)
      )
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
   * Lay one collar within the neck and put the rein frame on its lead.
   *
   * @param builder The model under construction.
   * @param rig Its rest landmarks.
   * @param tack The admitted positive authored lengths, metres.
   * @throws {AutoMovieArchetypeRefusal} When the collar is longer than the neck.
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
