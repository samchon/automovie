import { type AutoMovieArchetype } from "../core/index";
import { createBathtub as createBathtubImplementation } from "./internal/createBathtub";

/** Public operations for Auto Movie Archetype Bathtub. */
export namespace AutoMovieArchetypeBathtub {
  /**
   * A wall-backed bathtub with a front rim and a well floor.
   *
   * The well's floor and front rim retain their measured support locations. A
   * separate room control supplies the plumbing action. The fixture is centred on
   * X, with its back at Z = 0 and its front towards +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeBathtub.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBathtub.Affordance, AutoMovieArchetypeBathtub.Dimension> {
    return createBathtubImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance =
    | "bottom"
    | "rim"
    | "edge"
    | "top"
    | "seat"
    | "backrest";

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension =
    | "length"
    | "mass"
    | "rim"
    | "waterDepth"
    | "wellLength"
    | "wellWidth"
    | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
