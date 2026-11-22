import type { Archetype } from "../core";
import { KeyboardHardware } from "./KeyboardHardware";

/**
 * A full-size desktop keyboard with a level key field and a marked home row.
 *
 * The base rests centered at the origin with its typing edge toward `+Z`.
 * @param params The manufacturer's model and optional model identifier.
 * @param seed The seed used to select a model when omitted.
 * @returns The input device and its named contacts.
 * @throws {ArchetypeRefusal} When the requested input is inadmissible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the input device, its frame and contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Draw the original model figures and place the standard key field and home row.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build only the shared base and key field.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original key field is a surface rather than individual key caps.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one part and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The original draw and the key field construction serve both input devices.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The producer retains nothing.
 */
export function createDesktopKeyboard(
  params: createDesktopKeyboard.IParams = {},
  seed?: number | string,
): Archetype<
  createDesktopKeyboard.Affordance,
  createDesktopKeyboard.Dimension
> {
  const { builder, d }: ReturnType<typeof KeyboardHardware.draw<never>> =
    KeyboardHardware.draw<never>("keyboard", params, seed);
  return builder.build(d.mass);
}

/**
 * The parameters and contact identifiers of {@link createDesktopKeyboard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names its admitted models and contacts.
 * @evidence contracts/development/design.md#principled-representation The closed model names select the corresponding recorded manufacturer figures.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Inputs carry the optional identifier and this device's model choice.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This producer exposes only its built contacts and supported manufacturer models.
 */
export namespace createDesktopKeyboard {
  /** The `model` choices this producer admits. */
  export type Model = "numericKeypad" | "touchId";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
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
