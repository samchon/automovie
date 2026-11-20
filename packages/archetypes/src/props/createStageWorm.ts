import { type Archetype } from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Inert worm display prop with a shaft hold and an end marker.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inert worm display prop with a shaft hold and an end marker.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the saved authored display parts and their contact frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original coarse digital display assembly.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the fixed inventory of display parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStageWorm(
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
    LongImplementDraw.prepare<"face" | "shaft">("worm", params, seed);
  FIELD_IMPLEMENTS.build(
    builder,
    "worm",
    d.length!,
    d.shaftDiameter! / 2,
    d.mass!,
  );
  return builder.build(d.mass!);
}
