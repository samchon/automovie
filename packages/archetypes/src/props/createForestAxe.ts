import { type Archetype } from "../core";
import { ForestAxe } from "./ForestAxe";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Forest axe with a shaft hold and a head-face marker.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Forest axe with a shaft hold and a head-face marker.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the saved visual assembly that derives its handle mass and grip aperture from the model.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reuses the existing rigid graphics proxy and its saved fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the handle and head and registers two contact frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createForestAxe(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "edge" | "headLength" | "headMass" | "mass"
  > = {},
  seed?: number | string,
): Archetype<"face" | "shaft", LongImplementDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<"face" | "shaft">> =
    LongImplementDraw.prepare<"face" | "shaft">("forestAxe", params, seed);
  ForestAxe.build(builder, d);
  return builder.build(d.mass!);
}
