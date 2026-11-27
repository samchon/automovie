import { type AutoMovieArchetype } from "../core/index";
import { createStageFittedCarrier as createStageFittedCarrierImplementation } from "./internal/createStageFittedCarrier";
import { AutoMovieArchetypeStageTwoHandedSwordProp } from "./AutoMovieArchetypeStageTwoHandedSwordProp";

/** Public operations for Auto Movie Archetype Stage Fitted Carrier. */
export namespace AutoMovieArchetypeStageFittedCarrier {
  /**
   * Fit a hollow digital carrier to a separate padded two-handed display model.
   *
   * The carrier stands on its closed base, with its channel open along +Y. The
   * display faces down at both root frames. At "seated" its cap is above the base
   * and its guard sits above the physical mouth. At "opening" the whole display
   * clears the mouth. The "belt" hook faces the wearer along −X.
   *
   * @param params A generated padded display model and optional carrier id.
   * @returns The carrier and its model-space contact frames, in metres.
   * @throws {AutoMovieArchetypeRefusal} If the display model or the proposed
   *   identity cannot be fitted.
   */
  export function create(params: AutoMovieArchetypeStageFittedCarrier.IParams): AutoMovieArchetype<
  AutoMovieArchetypeStageFittedCarrier.Affordance,
  AutoMovieArchetypeStageFittedCarrier.Dimension
> {
    return createStageFittedCarrierImplementation(params);
  }

  /** The wear hook, the physical mouth and the two pose frames. */
  export type Affordance = "belt" | "mouth" | "opening" | "seated";

  /** The outer length along +Y and square clear channel width, metres. */
  export type Dimension = "length" | "opening";

  /** The separately modelled padded display and carrier identity. */
  export interface IParams {
    /** The generated digital display that fits this carrier. */
    display: ReturnType<typeof AutoMovieArchetypeStageTwoHandedSwordProp.create>;
    /** The carrier model's own id, distinct from the display's id. */
    id?: string;
  }

  /**
   * A gallery reference with one independent canonical padded display.
   *
   * @returns A fresh display input for standalone carrier inspection.
   */
  export function REFERENCE(): Readonly<IParams> {
    return {
      display: AutoMovieArchetypeStageTwoHandedSwordProp.create({
        id: "fitted-carrier-reference-display",
      }),
    };
  }}
