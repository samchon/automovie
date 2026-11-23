import type { AutoMovieArchetype } from "../core";
import { KeyboardHardware } from "./KeyboardHardware";

/**
 * A full-size desktop keyboard with a level key field and a marked home row.
 *
 * The base rests centered at the origin with its typing edge toward `+Z`.
 *
 * @param params The manufacturer's model and optional model identifier.
 * @param seed The seed used to select a model when omitted.
 * @returns The input device and its named contacts.
 * @throws {AutoMovieArchetypeRefusal} When the requested input is inadmissible.
 */
export function createDesktopKeyboard(
  params: createDesktopKeyboard.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createDesktopKeyboard.Affordance,
  createDesktopKeyboard.Dimension
> {
  const { builder, d }: ReturnType<typeof KeyboardHardware.draw<never>> =
    KeyboardHardware.draw<never>("keyboard", params, seed);
  return builder.build(d.mass);
}

/** The parameters and contact identifiers of {@link createDesktopKeyboard}. */
export namespace createDesktopKeyboard {
  /** The `model` choices this producer admits. */
  export type Model = "numericKeypad" | "touchId";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The identifiers of contacts this producer builds. */
  export type Affordance = "homeRow" | "keys";

  /** The constructor input. */
  export interface IParams {
    /** The identifier the scene uses. */
    id?: string;

    /** The manufacturer model, selected with the seed when omitted. */
    model?: Model;
  }
}
