import type { Archetype } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/**
 * An upright remote control with a shallow case and a front thumb contact.
 *
 * The model stands on its bottom edge at the origin with its front toward `+Z`.
 * @param params The identifier, fixed outside dimensions and mass.
 * @param seed The seed for the device's remaining choices.
 * @returns The device and its named contacts.
 * @throws {ArchetypeRefusal} For a refused dimension or producer input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the device, its frame and the exposed contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Add the shared shallow case and two grips, then place the front thumb contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw case dimensions using the saved device namespace and build the named contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use the device's measured model or recorded bands. Keep the existing distinctions between part geometry and its contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds at most one case and four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer uses the common device draw and case geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns a complete model and retains no inputs.
 */
export function createRemote(
  params: createRemote.IParams = {},
  seed?: number | string,
): Archetype<createRemote.Affordance, HandheldDevice.Dimension> {
  const {
    builder,
    size,
  }: ReturnType<typeof HandheldDevice.draw<createRemote.Affordance>> =
    HandheldDevice.draw<createRemote.Affordance>(
      "remote",
      "remote control",
      params,
      seed,
    );
  const {
    width,
    height,
    thickness: depth,
  }: Record<HandheldDevice.Dimension, number> = size;
  HandheldDevice.caseBody(builder, width, height, depth);
  for (const affordance of HandheldDevice.smallGrips(width, height, depth))
    builder.affordance(affordance);

  builder.affordance({
    id: "button",
    kind: "button",
    frame: HandheldDevice.front(height * 0.75, depth),
    extent: null,
  });
  return builder.build(size.mass);
}

/**
 * The parameters and affordance identifiers of {@link createRemote}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer's typed choice and contacts.
 * @evidence contracts/development/design.md#principled-representation The type lists this device's contact identifiers. Outside dimensions use metres and mass uses kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs share the existing handheld dimensions and identifier.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The identifier union covers the contacts this producer builds.
 */
export namespace createRemote {
  /** The identifiers of contacts built by this producer. */
  export type Affordance = "grip" | "pinch" | "button";

  /** Parameters for this remote control. */
  export type IParams = Omit<HandheldDevice.IParams, "kind" | "model"> & {
    model?: never;
  };
}
