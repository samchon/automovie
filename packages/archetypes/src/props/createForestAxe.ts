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
): Archetype<createForestAxe.Affordance, createForestAxe.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createForestAxe.Affordance>> =
    LongImplementDraw.prepare<createForestAxe.Affordance>(
      "forestAxe",
      params,
      seed,
    );
  ForestAxe.build(builder, d);
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createForestAxe}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createForestAxe {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "shaft";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "edge"
    | "headLength"
    | "headMass"
    | "length"
    | "mass";
}
