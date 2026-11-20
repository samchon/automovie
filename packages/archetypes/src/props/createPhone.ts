import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/**
 * A smartphone with an upright touchscreen and a rear lens.
 *
 * The model stands on its bottom edge at the origin with its front toward `+Z`.
 * @param params The identifier, fixed outside dimensions and mass.
 * @param seed The seed for the device's remaining choices.
 * @returns The device and its named contacts.
 * @throws {ArchetypeRefusal} For a refused dimension or producer input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the device, its frame and the exposed contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Add the shared shallow case and two grips, then place the touchscreen and rear lens.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw case dimensions using the saved device namespace and build the named contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use the device's measured model or recorded bands. Keep the existing distinctions between part geometry and its contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds at most one case and four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer uses the common device draw and case geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns a complete model and retains no inputs.
 */
export function createPhone(
  params: createPhone.IParams = {},
  seed?: number | string,
): Archetype<createPhone.Affordance, HandheldDevice.Dimension> {
  const {
    builder,
    size,
  }: ReturnType<typeof HandheldDevice.draw<createPhone.Affordance>> =
    HandheldDevice.draw<createPhone.Affordance>(
      "phone",
      "smartphone",
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
    id: "screen",
    kind: "surface",
    direction: "normal",
    frame: HandheldDevice.front(height / 2, depth),
    extent: null,
    width: width * 0.94,
    depth: height * 0.94,
  });
  builder.affordance({
    id: "lens",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, height * 0.9, -depth / 2),
      Vector3.create(0, 0, -1),
      Vector3.create(-1, 0, 0),
    ),
    extent: null,
  });
  return builder.build(size.mass);
}

/**
 * The parameters and affordance identifiers of {@link createPhone}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer's typed choice and contacts.
 * @evidence contracts/development/design.md#principled-representation The type lists this device's contact identifiers. Outside dimensions use metres and mass uses kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs share the existing handheld dimensions and identifier.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The identifier union covers the contacts this producer builds.
 */
export namespace createPhone {
  /** The identifiers of contacts built by this producer. */
  export type Affordance = "grip" | "pinch" | "screen" | "lens";

  /** Parameters for this smartphone. */
  export type IParams = Omit<HandheldDevice.IParams, "kind" | "model"> & {
    model?: never;
  };
}
