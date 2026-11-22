import { type AutoMovieArchetype } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Shaving razor scene prop with a grip and a +Y cartridge face.
 *
 * @param params The optional scene ID, manufacturer model, and handle diameter in metres.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shaving razor scene prop with a grip and a +Y cartridge face.
 * @evidence contracts/development/implementation.md#principled-implementation The model supplies the total length and mass. The cartridge keeps its saved working face relative to its handle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cartridge is a rigid box at the saved estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createShavingRazor(
  params: Pick<GroomingPropDraw.IParams, "id" | "width"> & {
    model?: Extract<GroomingPropDraw.Model, "edwinJagger" | "gilletteMach3">;
  } = {},
  seed?: number | string,
): AutoMovieArchetype<
  createShavingRazor.Affordance,
  createShavingRazor.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<
    typeof GroomingPropDraw.prepare<createShavingRazor.Affordance>
  > = GroomingPropDraw.prepare<createShavingRazor.Affordance>(
    "razor",
    params,
    seed,
  );
  const length: number = d.length!;
  const width: number = d.width!;

  GroomingPropDraw.addHead(
    builder,
    {
      length,
      width,
      head: GroomingPropDraw.CARTRIDGE.depth,
      across: GroomingPropDraw.CARTRIDGE.width,
    },
    { handle: "#2c2f33", head: "#b9bcc0" },
  );
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createShavingRazor}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through AutoMovieArchetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createShavingRazor {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass" | "width";
}
