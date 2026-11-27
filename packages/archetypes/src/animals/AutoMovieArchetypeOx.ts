import { type AutoMovieArchetype } from "../core/index";
import { createCohortQuadruped } from "./quadruped/createCohortQuadruped";
import { type AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { createOx as createOxImplementation } from "./ox/createOx";
import { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";

/** Public operations for Auto Movie Archetype Ox. */
export namespace AutoMovieArchetypeOx {
  /**
   * A coarse Kathani working-ox reference with horns and authored equipment,
   * declaring the roper's targets: `head` at the poll, `horns` between the horns'
   * bases and `hind` between the hocks.
   *
   * @param params Authored whole-model kilograms, optional lead and yoke/pack
   *   dimensions.
   * @param seed Independent construction seed and declared timing-spread
   *   coordinate.
   * @returns The shared quadruped model; mass/foot coefficients are not inferred.
   * @throws {AutoMovieArchetypeRefusal} For invalid mass, tempo or equipment
   *   dimensions.
   */
  export function create(params: AutoMovieArchetypeOx.IParams, seed?: number): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
    return createOxImplementation(params, seed);
  }

  /**
   * Authored gallery/test mass only, not a measured Kathani weight or a
   * constructor default.
   */
  export const REFERENCE: Readonly<Pick<IParams, "mass">> = { mass: 300 };

  /**
   * Positive total mass is authored; no live weight was read for the source
   * cohort.
   */
  export interface IParams extends createCohortQuadruped.IParams {
    /** Required authored complete kilograms; no working-ox mass was measured. */
    mass: number;

    /** Yoke or pack, each with its explicitly authored physical dimensions. */
    equipment?: AutoMovieArchetypeQuadrupedEquipment.IParams;
  }

  /**
   * Radius/length ratios of coarse identifying rods; not anatomical
   * measurements.
   */
  export const CONSTRUCTION: Readonly<{
    hornRadius: number;
    earRadius: number;
  }> = { hornRadius: 0.06, earRadius: 0.07 };}
