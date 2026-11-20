import { type Archetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";
import { Throwers } from "./Throwers";

/**
 * Inert atlatl prop with its original display grip and end locator.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inert atlatl prop with its original display grip and end locator.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the saved digital prop shapes and their authored locator frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The producer exposes the saved display geometry and scene contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds only the fixed inventory of display parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStageAtlatl(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "width" | "spurSetback" | "gripSetback" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"grip" | "spur", LongImplementDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<"grip" | "spur">> =
    LongImplementDraw.prepare<"grip" | "spur">("atlatl", params, seed);
  Throwers.atlatl(builder, d);
  return builder.build(d.mass!);
}
