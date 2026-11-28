import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createLipstick as createLipstickImplementation } from "./internal/createLipstick";

/** Constructs an exposed lipstick tip and a precision grip on its case. */
export namespace AutoMovieArchetypeLipstick {
  /**
   * Build a horizontal lipstick case with its exposed bullet facing `+Z`.
   *
   * The case starts at Z zero. The bullet extends the final 0.015 metres
   * and its tip is the axial `face`.
   *
   * @param params Optional scene ID and finite length, case diameter as `width` or mass
   *   admitted by the bands. The ID defaults to `careItem`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.074 metres long, 0.021 metres in
   *   case diameter and 0.02 kilograms.
   * @returns The case's round precision grip and axial tip contact.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeLipstick.Affordance, AutoMovieArchetypeLipstick.Dimension> {
    return createLipstickImplementation(params, seed);
  }

  /**
   * Precision `grip` across the case and axial `face` at the exposed bullet tip.
   */
  export type Affordance = "face" | "grip";

  /**
   * Overall length and case diameter as `width` in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "width";}
