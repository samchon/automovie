import { type AutoMovieArchetype } from "../core/index";
import { createStageBladeCarrier as createStageBladeCarrierImplementation } from "./internal/createStageBladeCarrier";
import { createHolster } from "./createHolster";

/** Public operations for Auto Movie Archetype Stage Blade Carrier. */
export namespace AutoMovieArchetypeStageBladeCarrier {
  /**
   * Worn blade carrier silhouette.
   *
   * The classic digitized sheath forms stand upright from the base, with a
   * visible throat and wearer-facing hook. Both share legacy opening placement.
   *
   * @param params The scene id, optional display dimensions and this carrier's
   *   own fit options.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeStageBladeCarrier.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageBladeCarrier.Affordance,
  AutoMovieArchetypeStageBladeCarrier.Dimension
> {
    return createStageBladeCarrierImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness" | "width";

  /**
   * The createHolster contact set its shared construction types. This producer
   * builds belt, mouth.
   */
  export type Affordance = createHolster.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["scabbard", "sheath"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createHolster.IParams,
    "id" | "length" | "width" | "thickness" | "mass"
  > {
    /** The profile with the required outline. */
    kind: Kind;
    /** A compatible historical display profile identifier. */
    blade?: createHolster.Blade;
  }}
