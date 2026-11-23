import type { AutoMovieArchetype } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/**
 * An upright tablet with a full-height grasp and a front touchscreen.
 *
 * The model stands on its bottom edge at the origin with its front toward `+Z`.
 * @param params The identifier and a choice among this device's measured models.
 * @param seed The seed for the device's remaining choices.
 * @returns The device and its named contacts.
 * @throws {AutoMovieArchetypeRefusal} For a refused dimension or producer input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the device, its frame and the exposed contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Build the shared upright case with a grip across its thickness and a full-size touchscreen.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw case dimensions using the saved device namespace and build the named contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use the device's measured model or recorded bands. Keep the existing distinctions between part geometry and its contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one case and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer uses the common device draw and case geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns a complete model and retains no inputs.
 */
export function createTablet(
  params: createTablet.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createTablet.Affordance, createTablet.Dimension> {
  return HandheldDevice.fullFace("tablet", "tablet", params, seed, "screen");
}

/**
 * The parameters and affordance identifiers of {@link createTablet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer's typed choice and contacts.
 * @evidence contracts/development/design.md#principled-representation The type lists this device's contact identifiers and its admitted manufacturer models. Outside dimensions use metres and mass uses kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The caller supplies an identifier and only this device's recorded model choices.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The identifier union covers the contacts this producer builds.
 */
export namespace createTablet {
  /** The `model` choices this producer admits. */
  export type Model = "wifi" | "cellular";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "grip" | "screen";

  /** Parameters for this tablet. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /** The manufacturer model, drawn from the seed when absent. */
    model?: Model;
  }
}
