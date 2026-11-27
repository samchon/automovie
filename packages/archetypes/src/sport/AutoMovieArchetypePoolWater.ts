import { type AutoMovieArchetype } from "../core/index";
import { createPoolWater as createPoolWaterImplementation } from "./internal/createPoolWater";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Pool Water. */
export namespace AutoMovieArchetypePoolWater {
  /**
   * A rectangular pool water surface at local Y = 0, with positive Y up. The
   * translucent material shows limbs below the swimming plane. The `water`
   * affordance gives a placement reader the same plane and extents.
   *
   * @param params Optional fixed surface dimensions, in metres, and model id.
   * @param seed The seed for omitted dimensions. With no seed, use each band's
   *   midpoint.
   * @returns A visual archetype with water geometry, dimensions and a placement
   *   reference.
   * @throws {AutoMovieArchetypeRefusal} When a fixed dimension is nonfinite or
   *   outside its band.
   */
  export function create(params?: AutoMovieArchetypePoolWater.IParams, seed?: number): AutoMovieArchetype<"water", AutoMovieArchetypePoolWater.Dimension, null> {
    return createPoolWaterImplementation(params, seed);
  }

  /** The separate width and length axes of the rectangle. */
  export type Dimension = "width" | "length";

  /** Positive spans of the water surface and its optional model id. */
  export interface IParams {
    /** Span along local X, in metres. Drawn when absent. */
    width?: number;
    /** Span along local Z, in metres. Drawn when absent. */
    length?: number;
    /** Model id. Defaults to `poolWater`. */
    id?: string;
  }

  /** Both horizontal spans are measured in metres. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    length: "m",
  };

  /** Provisional authoring spans from one lane to a full pool surface. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(
      2.5,
      25,
      "Pool water staging span",
      true,
    ),
    length: AutoMovieArchetypeBand.metres(
      5,
      50,
      "Pool water staging span",
      true,
    ),
  };}
