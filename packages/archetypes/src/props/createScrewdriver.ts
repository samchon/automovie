import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { HandToolDraw } from "./HandToolDraw";

/**
 * Screwdriver with a round grip and an axial tip along +Y.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Screwdriver with a round grip and an axial tip along +Y.
 * @evidence contracts/development/implementation.md#principled-implementation The grip and tip share the shank axis. The tip frame marks the driver contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tip is part of the shank proxy and its working frame is at the end.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createScrewdriver(
  params: Pick<
    HandToolDraw.IParams,
    "id" | "length" | "gripDiameter" | "mass" | "blade"
  > = {},
  seed?: number | string,
): Archetype<createScrewdriver.Affordance, createScrewdriver.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof HandToolDraw.prepare<createScrewdriver.Affordance>> =
    HandToolDraw.prepare<createScrewdriver.Affordance>(
      "screwdriver",
      params,
      seed,
    );
  const length: number = d.length!;
  const radius: number = d.gripDiameter! / 2;

  const handle: number = length - d.blade!;
  HandToolDraw.handle(builder, handle, radius, { round: true });

  builder.rod(
    "shank",
    0.003,
    Vector3.create(0, handle, 0),
    Vector3.create(0, length, 0),
    { color: "#b9bcc0", density: 11 },
  );
  builder.affordance({
    id: "face",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.upright(Vector3.create(0, length, 0)),
    extent: null,
  });
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createScrewdriver}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createScrewdriver {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "blade" | "gripDiameter" | "length" | "mass";
}
