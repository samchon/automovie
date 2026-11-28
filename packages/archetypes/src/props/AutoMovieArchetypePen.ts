import { type AutoMovieArchetype } from "../core/index";
import { type StationeryDraw } from "./internal/StationeryDraw";
import { createPen as createPenImplementation } from "./internal/createPen";

/** Constructs a pen with a precision grasp and an axial tip. */
export namespace AutoMovieArchetypePen {
  /**
   * Build a cylindrical pen with its base at Z zero and tip toward `+Z`.
   *
   * @param params Optional scene ID and finite length, diameter or mass
   *   within their respective bands. The default ID is `stationery`.
   * @param seed Numeric seed for omitted values. Without it the barrel
   *   is 0.14675 metres long and 0.0095 metres in diameter.
   * @returns A precision grip 0.03 metres behind the tip and an axial `face` at the tip.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    StationeryDraw.IParams,
    "id" | "length" | "thickness" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypePen.Affordance, AutoMovieArchetypePen.Dimension> {
    return createPenImplementation(params, seed);
  }

  /**
   * Precision `grip` on the barrel and axial `face` at the `+Z` writing tip.
   */
  export type Affordance = "face" | "grip";

  /**
   * Barrel length along Z and diameter as `thickness`, in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "thickness";}
