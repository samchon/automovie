import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Pocket comb with a sideways spine grip and a working edge along the teeth.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Pocket comb with a sideways spine grip and a working edge along the teeth.
 * @evidence contracts/development/implementation.md#principled-implementation The spine supports a full-length grip. The lower block ends at the working ledge.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The teeth remain a single coarse block.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createComb(
  params: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass" | "thickness"
  > = {},
  seed?: number | string,
): Archetype<createComb.Affordance, createComb.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<createComb.Affordance>> =
    GroomingPropDraw.prepare<createComb.Affordance>("comb", params, seed);
  const length: number = d.length!;
  const width: number = d.width!;
  const thick: number = d.thickness ?? width;

  // A spine with a block of teeth under it; held sideways anywhere along the spine.
  builder.box(
    "spine",
    Vector3.create(thick, width * 0.4, length),
    Vector3.create(0, width * 0.8, length / 2),
    { color: "#3a3a3a" },
  );
  builder.box(
    "teeth",
    Vector3.create(thick * 0.6, width * 0.6, length),
    Vector3.create(0, width * 0.3, length / 2),
    { color: "#4a4a4a" },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "half",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, width * 0.8, length / 2),
      Vector3.create(1, 0, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    grip: "lateral",
    aperture: thick,
    length,
  });
  builder.affordance({
    id: "face",
    kind: "ledge",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, 0, length / 2),
      Vector3.create(0, -1, 0),
      Vector3.create(0, 0, 1),
    ),
    extent: null,
    length,
  });
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createComb}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createComb {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass" | "thickness" | "width";
}
