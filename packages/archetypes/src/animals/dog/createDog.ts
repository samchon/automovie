import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
} from "../../core";
import { AutoMovieArchetypeDog } from "../AutoMovieArchetypeDog";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "../AutoMovieArchetypeQuadrupedHeadAttachment";
import "../AutoMovieArchetypeQuadrupedLead";
import { QuadrupedAnimal } from "../quadruped/QuadrupedAnimal";
import { buildDogBody } from "./buildDogBody";
import { DOG_BODY_MEASURES } from "./constants/DOG_BODY_MEASURES";
import "./dogModelDimensions";
import "./measureDogNeckLength";
import type { IDogBodyMeasures } from "./structures/IDogBodyMeasures";
import type { DogCohort } from "./typings/DogCohort";

/*
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
 * Parameter params: Required positive mass in kilograms, optional cohort, tempo and
 * authored collar.
 * Parameter seed: Picks one whole cohort and the tempo; absent, Pet and mean tempo.
 * Returns: The dog, including its parts and optional lead affordance.
 * For invalid mass, cohort, tempo or collar
 * dimensions.
 */
export function createDog(
  params: AutoMovieArchetypeDog.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeDog.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  AutoMovieArchetypeDog.positive("mass", params.mass, "kg");
  if (params.collar !== undefined)
    for (const key of AutoMovieArchetypeDog.COLLAR_DIMENSIONS)
      AutoMovieArchetypeDog.positive(`collar.${key}`, params.collar[key], "m");
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeQuadrupedBody.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "dog",
      AutoMovieArchetypeDog.UNITS,
      seed,
      params,
    );
  const model: AutoMovieArchetypeDrawSession.IModel<
    DogCohort,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = draw.model("cohort", params.cohort, AutoMovieArchetypeDog.MODELS);

  // The nonempty model catalogue guarantees a named cohort.
  const cohort: DogCohort = model.name!;
  const measures: Readonly<IDogBodyMeasures> = DOG_BODY_MEASURES[cohort];
  if (params.collar !== undefined)
    AutoMovieArchetypeDog.positive(
      "collar.width",
      params.collar.width,
      "m",
      params.cohort === undefined
        ? Math.min(...Object.values(AutoMovieArchetypeDog.NECK_LENGTHS))
        : AutoMovieArchetypeDog.NECK_LENGTHS[cohort],
    );
  draw.dimensions({ tempo: AutoMovieArchetypeDog.TEMPO });
  draw.derive("mass", params.mass);
  return QuadrupedAnimal({
    id: params.id,
    name: `${cohort} Husky prototype`,
    body: buildDogBody(cohort),
    draw,
    add: (
      builder: AutoMovieArchetypeBuilder<
        AutoMovieArchetypeDog.Affordance,
        AutoMovieArchetypeQuadrupedBody.Dimension
      >,
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
    ): void => {
      const radius: number =
        (measures.foreCircumference / (2 * Math.PI)) *
        AutoMovieArchetypeUnits.CENTIMETRE;
      for (const side of ["left", "right"] as const) {
        const base: IAutoMovieVector3 =
          AutoMovieArchetypeQuadrupedHeadAttachment.attach(
            rig,
            AutoMovieEngineVector3.create(
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
        AutoMovieArchetypeDog.collar(builder, rig, params.collar);
    },
  });
}
