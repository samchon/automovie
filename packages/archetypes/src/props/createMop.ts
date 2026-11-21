import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeFrame } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";

/** The pad block's height, metres. */
const PAD: number = 0.03;

/**
 * Mop with a wide pad and a two-hand shaft. Fixed `upperGrip` and
 * `lowerGrip` handles on the clear shaft take the two hands of a floor stroke.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Mop with a wide pad and a two-hand shaft.
 * @evidence contracts/development/implementation.md#principled-implementation Its floor-facing contact starts at the bottom of the pad block.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The strands are a coarse block with the original working width.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and four contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createMop(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number | string,
): Archetype<createMop.Affordance, createMop.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createMop.Affordance>> =
    LongImplementDraw.prepare<createMop.Affordance>("mop", params, seed);
  const radius: number = d.shaftDiameter! / 2;

  LongImplementDraw.groundTool(
    builder,
    {
      width: LongImplementDraw.HEAD_WIDTH,
      height: PAD,
      depth: 0.12,
      color: "#c9a24a",
      density: 1,
    },
    { radius, top: d.length! },
  );

  // An upper hand and a lower hand push in distinct places on one shaft, at
  // 0.73 and 0.53 of the clear shaft above the pad (a two-handed push).
  for (const [id, share] of [
    ["upperGrip", 0.73],
    ["lowerGrip", 0.53],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: ArchetypeFrame.facing(
        Vector3.create(0, PAD + share * (d.length! - PAD), 0),
        Vector3.create(0, 0, -1),
        Vector3.create(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: 2 * radius,
    });
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createMop}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createMop {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "shaft" | "upperGrip" | "lowerGrip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}
