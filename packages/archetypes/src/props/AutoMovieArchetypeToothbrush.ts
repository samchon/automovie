import { type AutoMovieArchetype } from "../core/index";
import { type GroomingPropDraw } from "./internal/GroomingPropDraw";
import { createToothbrush as createToothbrushImplementation } from "./internal/createToothbrush";

/** Constructs a toothbrush with an upward bristle contact and a handle grip. */
export namespace AutoMovieArchetypeToothbrush {
  /**
   * Build a toothbrush with its butt at Z zero and bristles toward `+Z`.
   *
   * The 0.028 metre bristle head sits at the far end with its working
   * face toward `+Y`.
   *
   * @param params Optional scene ID and finite length, handle diameter as `width` or mass
   *   admitted by the bands. The ID defaults to `careItem`.
   * @param seed Numeric seed for omitted values. Omit it for
   *   0.1885 metres long, 0.011 metres
   *   in handle diameter and 0.02 kilograms.
   * @returns The central handle grip and upward bristle surface.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  >, seed?: number): AutoMovieArchetype<AutoMovieArchetypeToothbrush.Affordance, AutoMovieArchetypeToothbrush.Dimension> {
    return createToothbrushImplementation(params, seed);
  }

  /**
   * Power `grip` at the handle midpoint and upward `face` on the bristle head.
   */
  export type Affordance = "face" | "grip";

  /**
   * Overall length along Z and handle diameter as `width`, in metres. Mass is in kilograms.
   */
  export type Dimension = "length" | "mass" | "width";}
