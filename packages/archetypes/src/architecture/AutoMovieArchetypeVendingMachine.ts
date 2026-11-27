import { type AutoMovieArchetype } from "../core/index";
import { createVendingMachine as createVendingMachineImplementation } from "./internal/createVendingMachine";
import { type AutoMovieArchetypeMachine } from "./AutoMovieArchetypeMachine";

/** Public operations for Auto Movie Archetype Vending Machine. */
export namespace AutoMovieArchetypeVendingMachine {
  /**
   * A snack vending machine with the front and right side of its standing cabinet
   * available for actor contacts.
   *
   * The Merchant 4 and Merchant 6 figures choose the cabinet width as a whole
   * model, while mass comes from the measured band. The cabinet rests on the
   * floor at the origin and faces +Z.
   *
   * @param params The scene identifier, measured model and inside-band dimension
   *   overrides.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeVendingMachine.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeVendingMachine.Affordance,
  AutoMovieArchetypeVendingMachine.Dimension
> {
    return createVendingMachineImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "front" | "side";

  /** The dimensions an author may fix, in the same units. */
  export type Fixed = "height" | "depth" | "mass";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /**
   * The numeric overrides and optional scene identifier. The model selects the
   * manufacturer's fixed width.
   */
  export interface IParams extends Partial<Record<Fixed, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;

    /** The measured model, drawn by seed when omitted. */
    model?: AutoMovieArchetypeMachine.Model;
  }}
