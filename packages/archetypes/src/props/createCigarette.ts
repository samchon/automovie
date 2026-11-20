import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { SmokingPropDraw } from "./SmokingPropDraw";

/**
 * Inert cigarette proxy with a pinch, filter contact and lit-end locator.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inert cigarette proxy with a pinch, filter contact and lit-end locator.
 * @evidence contracts/development/implementation.md#principled-implementation The filter and paper lie along +Z, with the filter contact at the origin end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flame site marks a visual effect position. The prop produces no smoke, ash or fire.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createCigarette(
  params: Pick<
    SmokingPropDraw.IParams,
    "id" | "length" | "diameter" | "filter" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"grip" | "mouth" | "flame", SmokingPropDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof SmokingPropDraw.prepare<"grip" | "mouth" | "flame">> =
    SmokingPropDraw.prepare<"grip" | "mouth" | "flame">(
      "cigarette",
      params,
      seed,
    );
  const radius: number = d.diameter! / 2;
  const filter: number = d.filter!;
  const length: number = d.length!;
  builder.rod(
    "filter",
    radius,
    Vector3.create(0, radius, 0),
    Vector3.create(0, radius, filter),
    { color: "#c98f4e" },
  );
  builder.rod(
    "paper",
    radius,
    Vector3.create(0, radius, filter),
    Vector3.create(0, radius, length),
    { color: "#f1efe8" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, radius, filter + 0.01),
      Vector3.create(0, 1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "precision",
    aperture: 2 * radius,
  });
  builder.affordance({
    id: "mouth",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, radius, 0),
      Vector3.create(0, 0, -1),
    ),
    extent: null,
  });
  builder.affordance({
    id: "flame",
    kind: "socket",
    direction: "along",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, radius, length),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass!);
}
