import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { SmokingPropDraw } from "./SmokingPropDraw";

/**
 * Digital pocket lighter with a grip, wheel, button and effect locator.
 *
 * @param params The optional scene ID and BIC model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Digital pocket lighter with a grip, wheel, button and effect locator.
 * @evidence contracts/development/implementation.md#principled-implementation The model fixes the case dimensions and the wheel part follows its existing knob contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fire effect is a locator. Only the wheel has its own moving part.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createLighter(
  params: Pick<SmokingPropDraw.IParams, "id"> & {
    model?: SmokingPropDraw.Model;
  } = {},
  seed?: number | string,
): Archetype<"grip" | "flame" | "wheel" | "valve", SmokingPropDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof SmokingPropDraw.prepare<"grip" | "flame" | "wheel" | "valve">
  > = SmokingPropDraw.prepare<"grip" | "flame" | "wheel" | "valve">(
    "lighter",
    params,
    seed,
  );
  const width: number = d.width!;
  const height: number = d.length!;
  const depth: number = d.diameter!;
  const wheel: number = depth * 0.3;
  builder.box(
    "body",
    Vector3.create(width, height - 2 * wheel, depth),
    Vector3.create(0, (height - 2 * wheel) / 2, 0),
    { color: "#c0392b" },
  );
  builder.rod(
    "wheel",
    wheel,
    Vector3.create(-width * 0.2, height - wheel, depth * 0.1),
    Vector3.create(width * 0.2, height - wheel, depth * 0.1),
    { color: "#8a8d91" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, (height - 2 * wheel) / 2, 0),
      Vector3.create(0, 0, -1),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: depth,
    length: height - 2 * wheel,
  });
  builder.affordance({
    id: "wheel",
    kind: "knob",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, height - wheel, depth * 0.1),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 1, 0),
    ),
    extent: null,
    travel: 90,
    parts: ["wheel"],
  });
  builder.affordance({
    id: "valve",
    kind: "button",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, height - 2 * wheel, -depth * 0.25),
    ),
    extent: null,
    travel: 0.003,
  });
  builder.affordance({
    id: "flame",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.upright(
      Vector3.create(0, height + 0.015, depth * 0.3),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
