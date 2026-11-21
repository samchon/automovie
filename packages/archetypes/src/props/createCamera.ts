import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandheldDevice } from "./HandheldDevice";

/**
 * A compact camera with separate grasp, support, viewing and shutter contacts.
 *
 * The model stands on its bottom edge at the origin with its front toward `+Z`.
 * @param params The identifier and a choice among this device's measured models.
 * @param seed The seed for the device's remaining choices.
 * @returns The device and its named contacts.
 * @throws {ArchetypeRefusal} For a refused dimension or producer input.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the device, its frame and the exposed contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Keep the camera's case, grip bar and lens barrel with the grasp, support, viewing and shutter contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw case dimensions using the saved device namespace and build the named contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Use the device's measured model or recorded bands. Keep the existing distinctions between part geometry and its contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds at most three parts and five contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer uses the common device draw.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns a complete model and retains no inputs.
 */
export function createCamera(
  params: createCamera.IParams = {},
  seed?: number | string,
): Archetype<createCamera.Affordance, createCamera.Dimension> {
  const {
    builder,
    size,
  }: ReturnType<typeof HandheldDevice.draw<createCamera.Affordance>> =
    HandheldDevice.draw<createCamera.Affordance>(
      "camera",
      "compact camera",
      params,
      seed,
    );
  const {
    width,
    height,
    thickness: depth,
  }: Record<HandheldDevice.Dimension, number> = size;
  // The body, a grip bar on the photographer's right (-X) and the lens barrel in front.
  const grip: number = depth / 2;
  builder.box(
    "body",
    Vector3.create(width - 2 * grip, height, depth),
    Vector3.create(grip, height / 2, 0),
    { color: "#2c2f33" },
  );
  builder.rod(
    "grip",
    grip,
    Vector3.create(-width / 2 + grip, 0, 0),
    Vector3.create(-width / 2 + grip, height, 0),
    { color: "#2c2f33" },
  );
  builder.rod(
    "lens",
    height * 0.35,
    Vector3.create(grip, height / 2, depth / 2),
    Vector3.create(grip, height / 2, depth / 2 + 0.02),
    { color: "#55595f" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(-width / 2 + grip, height / 2, 0),
      Vector3.create(-1, 0, 0),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: depth,
    length: height,
  });
  // The thumb on the left side and index finger underneath brace the
  // lower outer edge (https://in.canon/en/support/8000009200). The approach
  // is vertical, so the case's height is its aperture. Centre the frame
  // vertically so the near face lands on the underside. The front half
  // of the edge leaves room for the hand ahead of the photographer's face.
  builder.affordance({
    id: "support",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(width / 2, height / 2, grip / 2),
      Vector3.create(0, -1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: height,
    length: grip,
  });
  builder.affordance({
    id: "lens",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(grip, height / 2, depth / 2 + 0.02),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "screen",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(grip, height / 2, -depth / 2),
      Vector3.create(0, 0, -1),
      Vector3.create(-1, 0, 0),
    ),
    extent: null,
    width: width * 0.6,
    depth: height * 0.8,
  });
  builder.affordance({
    id: "button",
    kind: "button",
    frame: ArchetypeFrame.upright(Vector3.create(-width / 2 + grip, height, 0)),
    extent: null,
  });
  return builder.build(size.mass);
}

/**
 * The parameters and affordance identifiers of {@link createCamera}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer's typed choice and contacts.
 * @evidence contracts/development/design.md#principled-representation The type lists this device's contact identifiers and its admitted manufacturer models. Outside dimensions use metres and mass uses kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The caller supplies an identifier and only this device's recorded model choices.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The identifier union covers the contacts this producer builds.
 */
export namespace createCamera {
  /** The `model` choices this producer admits. */
  export type Model = "grIII" | "x100vi";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "height" | "mass" | "thickness" | "width";

  /** The identifiers of contacts built by this producer. */
  export type Affordance = "button" | "grip" | "lens" | "screen" | "support";

  /** Parameters for this compact camera. */
  export interface IParams extends Pick<HandheldDevice.IParams, "id"> {
    /** The manufacturer model, drawn from the seed when absent. */
    model?: Model;
  }
}
