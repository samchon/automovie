import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Shovel resting on its blade edge with a two-hand shaft and top D grip.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shovel resting on its blade edge with a two-hand shaft and top D grip.
 * @evidence contracts/development/implementation.md#principled-implementation The head's downward face, shaft and crossbar expose separate contacts. The shaft meets the D grip's yoke.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The blade is a flat plate and the head density preserves the saved balance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds four parts and three contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createShovel(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number | string,
): Archetype<createShovel.Affordance, createShovel.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createShovel.Affordance>> =
    LongImplementDraw.prepare<createShovel.Affordance>("shovel", params, seed);
  const radius: number = d.shaftDiameter! / 2;
  const length: number = d.length!;
  const top: number = length - 0.1;

  LongImplementDraw.groundTool(
    builder,
    {
      width: LongImplementDraw.BLADE_WIDTH,
      height: 0.29,
      depth: 0.004,
      color: "#6c7076",
      density: 8,
    },
    { radius, top },
  );

  // The D grip: a cross bar held from above, joined to the shaft by its yoke.
  builder.rod(
    "grip",
    radius,
    Vector3.create(-LongImplementDraw.D_GRIP / 2, length - radius, 0),
    Vector3.create(LongImplementDraw.D_GRIP / 2, length - radius, 0),
    { color: "#b98d5b" },
  );
  builder.box(
    "yoke",
    Vector3.create(0.12, 0.1 - 2 * radius, 0.01),
    Vector3.create(0, top + (0.1 - 2 * radius) / 2, 0),
    { color: "#b98d5b", density: 0.2 },
  );
  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "round",
    frame: ArchetypeFrame.upright(Vector3.create(0, length - radius, 0)),
    extent: null,
    grip: "power",
    aperture: 2 * radius,
    length: LongImplementDraw.D_GRIP,
  });
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createShovel}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createShovel {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip" | "shaft";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}
