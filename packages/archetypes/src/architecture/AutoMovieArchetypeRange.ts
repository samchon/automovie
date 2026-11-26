import { type AutoMovieArchetype } from "../core/index";
import { createRange as createRangeImplementation } from "./internal/createRange";

/** Public operations for Auto Movie Archetype Range. */
export namespace AutoMovieArchetypeRange {
  /**
   * A freestanding range with a cooktop and four pan landing surfaces.
   *
   * The hob and its four load surfaces remain in `ApplianceConstruction.cooker`;
   * the visible oven door and knobs carry no motion contacts. The fixture is
   * centred on X, with its back at Z = 0 and its front towards +Z.
   *
   * @param params The scene identifier and any dimensions to fix inside their
   *   bands.
   * @param seed The seed for the draws the author leaves open.
   * @returns The fixed model with its typed contacts.
   * @throws {AutoMovieArchetypeRefusal} If a supplied override lies outside the
   *   selected profile.
   */
  export function create(params?: AutoMovieArchetypeRange.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeRange.Affordance, AutoMovieArchetypeRange.Dimension> {
    return createRangeImplementation(params, seed);
  }

  /** The named contacts built by this producer. */
  export type Affordance = "top" | `zone${number}`;

  /** The dimensions the author may fix inside the producer's bands. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The numeric overrides and optional scene identifier. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** A unique scene identifier, defaulting to the saved family name. */
    id?: string;
  }}
