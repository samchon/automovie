import { type AutoMovieArchetype } from "../core/index";
import { createCraftTool as createCraftToolImplementation } from "./internal/createCraftTool";

/** Public operations for Auto Movie Archetype Craft Tool. */
export namespace AutoMovieArchetypeCraftTool {
  /**
   * A slender hand tool worked by its tip: an artist's paintbrush, a conductor's
   * baton, a sewing needle or a knitting needle.
   *
   * The tool runs along `+Z` from its butt at the origin to its tip at its
   * length. `grip` is where the hand holds it, a power grip round a baton's bulb
   * at the butt, a precision grip elsewhere; `tip` is its working point, a
   * brush's bristles, a baton's point, a needle's point, touching over the rod's
   * end of the shaft's radius (`radius`); `stitch` is the flat just behind a
   * knitting needle's tip where a stitch sits, the surface the other needle's tip
   * enters, facing `+Y`.
   *
   * @param params The kind and the optional scene id.
   * @returns The tool and its contacts, metres.
   * @throws {AutoMovieArchetypeRefusal} For a kind outside the set.
   */
  export function create(params: AutoMovieArchetypeCraftTool.IParams): AutoMovieArchetype<AutoMovieArchetypeCraftTool.Affordance, AutoMovieArchetypeCraftTool.Dimension> {
    return createCraftToolImplementation(params);
  }

  /** The four tools. */
  export type Kind = "paintbrush" | "baton" | "needle" | "knittingNeedle";

  /** Every kind. */
  export const KINDS: readonly Kind[] = [
    "paintbrush",
    "baton",
    "needle",
    "knittingNeedle",
  ];

  /** The hold, the working point and a knitting needle's stitch. */
  export type Affordance = "grip" | "tip" | "stitch";

  /** The length, the radius and the mass. */
  export type Dimension = "length" | "radius" | "mass";

  /** The kind and the scene id. */
  export interface IParams {
    /** Which tool. */
    kind: Kind;

    /** The model's id, unique in a scene; the kind when absent. */
    id?: string;
  }

  /** A tool's size, metres and kilograms. */
  export interface ISize {
    /** Butt to tip. */
    length: number;

    /** The shaft's radius. */
    radius: number;

    /** The held span from the butt. */
    grip: number;

    /** The mass. */
    mass: number;
  }}
