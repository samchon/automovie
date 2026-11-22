import { type Archetype } from "../core";
import { FIELD_IMPLEMENTS } from "./FIELD_IMPLEMENTS";
import { LongImplementDraw } from "./LongImplementDraw";

/**
 * Inert sponge-and-rammer prop with visible end markers and a shaft hold.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Inert sponge-and-rammer prop with visible end markers and a shaft hold.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the saved authored display parts and their contact frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original coarse digital display assembly.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the fixed inventory of display parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createStageSpongeRammer(
  params: Pick<
    LongImplementDraw.IParams,
    "id" | "length" | "shaftDiameter" | "mass"
  > = {},
  seed?: number | string,
): Archetype<
  createStageSpongeRammer.Affordance,
  createStageSpongeRammer.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof LongImplementDraw.prepare<createStageSpongeRammer.Affordance>
  > = LongImplementDraw.prepare<createStageSpongeRammer.Affordance>(
    "spongeRammer",
    params,
    seed,
  );
  FIELD_IMPLEMENTS.build(
    builder,
    "spongeRammer",
    d.length!,
    d.shaftDiameter! / 2,
    d.mass!,
  );
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createStageSpongeRammer}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through Archetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createStageSpongeRammer {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "shaft" | "tip" | "rammer" | "sponge";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass" | "shaftDiameter";
}
