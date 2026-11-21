import { type Archetype } from "../core";
import { LongImplementDraw } from "./LongImplementDraw";
import { Throwers } from "./Throwers";

/**
 * Inert sling prop with its original display pouch and hand contacts.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inert sling prop with its original display pouch and hand contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the saved digital prop shapes and their authored locator frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The producer exposes the saved display geometry and scene contacts.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds only the fixed inventory of display parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStageSling(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "pouchLength" | "pouchWidth" | "mass"
  > = {},
  seed?: number | string,
): Archetype<createStageSling.Affordance, createStageSling.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof LongImplementDraw.prepare<createStageSling.Affordance>> =
    LongImplementDraw.prepare<createStageSling.Affordance>(
      "sling",
      params,
      seed,
    );
  Throwers.sling(builder, d);
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createStageSling}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createStageSling {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "grip" | "pouch" | "release";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "launchSpeed"
    | "length"
    | "mass"
    | "pouchLength"
    | "pouchWidth"
    | "shaftDiameter";
}
