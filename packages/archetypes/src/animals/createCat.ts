import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { CatBody } from "./CatBody";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * Build one bare adult domestic-cat prototype for ordinary walking shots.
 *
 * The shared body and limb geometry carry the actual ground contacts through
 * the quadruped ride. The rig's circular solids and two coarse pinna plates
 * are construction proxies, with mass allocated by the shared volume rule.
 *
 * @param params Optional model identity, bare mass in kilograms and timing coordinate.
 * @param seed Draws timing when it was omitted. The shape is fixed.
 * @returns The independent untacked quadruped model.
 * @throws {AutoMovieArchetypeRefusal} For unsupported mass or timing values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the fixed shape, seeded time coordinate, explicitly bare mass and shared ground contact ownership.
 * @evidence contracts/development/implementation.md#principled-implementation One complete reference uses the existing non-equid producer and name-based species admission in rideQuadruped.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pass the single declared reference and its body owner to the cohort builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No other morphology, tack, clinical mass fractions or foot coefficients are inferred.
 * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size profile plan and one actual model are built.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The common model builder owns dimensions, part solids and mass; the common ride owns contact motion.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The producer returns independent records without retaining the caller parameters or any external resource.
 */
export function createCat(
  params: createCat.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  return createCohortQuadruped({
    archetype: "cat",
    name: (): string => "adult domestic cat prototype",
    names: ["adult"],
    choices: ["adult"],
    reference: "adult",
    references: { adult: CatBody.REFERENCE },
    body: CatBody,
    params: { id: params.id, mass: params.mass, tempo: params.tempo },
    seed,
  });
}

/**
 * Authored inputs for the single bare domestic-cat reference.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the identity, bare mass and stride-time units and defaults.
 * @evidence contracts/development/design.md#principled-representation Optional mass and timing use the same runtime admission as other untacked quadrupeds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface No breed, tack or alternate mass law is exposed for the one reference.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts There is no invented morphological variation or anatomical control.
 */
export namespace createCat {
  /**
   * Optional independently authored instance data.
   */
  export interface IParams {
    /** Model id used by ordinary staging and motion APIs. */
    id?: string;

    /** Positive finite bare mass in kilograms. The fixed reference supplies 4.5 kg when absent. */
    mass?: number;

    /** Stride displacement in standard-deviation units from -1 to 1; seedless defaults to zero. */
    tempo?: number;
  }
}
