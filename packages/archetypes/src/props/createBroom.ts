import { type Archetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Broom with a low brushing head and a two-hand shaft.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Broom with a low brushing head and a two-hand shaft.
 * @evidence contracts/development/implementation.md#principled-implementation Its floor-facing contact starts at the bottom of the bristle block.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bristles are a coarse block with the original working width.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createBroom(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"face" | "shaft", LongImplementDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<"face" | "shaft">> =
    LongImplementDraw.prepare<"face" | "shaft">("broom", params, seed);
  const radius: number = d.shaftDiameter! / 2;

  LongImplementDraw.groundTool(
    builder,
    {
      width: LongImplementDraw.HEAD_WIDTH,
      height: 0.08,
      depth: 0.05,
      color: "#c9a24a",
      density: 1,
    },
    { radius, top: d.length! },
  );
  return builder.build(d.mass!);
}
