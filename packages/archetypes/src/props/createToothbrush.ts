import { type AutoMovieArchetype } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Toothbrush with a handle and a +Y bristle face near its far end.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {AutoMovieArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Toothbrush with a handle and a +Y bristle face near its far end.
 * @evidence contracts/development/implementation.md#principled-implementation The head rises from the surface so the brush law can address its top.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bristles share a flat block at their original extent.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds two parts and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createToothbrush(
  params: Pick<
    GroomingPropDraw.IParams,
    "id" | "length" | "width" | "mass"
  > = {},
  seed?: number | string,
): AutoMovieArchetype<createToothbrush.Affordance, createToothbrush.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<createToothbrush.Affordance>> =
    GroomingPropDraw.prepare<createToothbrush.Affordance>(
      "toothbrush",
      params,
      seed,
    );
  const length: number = d.length!;
  const width: number = d.width!;

  GroomingPropDraw.addHead(
    builder,
    { length, width, head: 0.028, across: width },
    { handle: "#3f8fc4", head: "#eef2f5" },
  );
  return builder.build(d.mass!);
}

/**
 * The contacts and dimensions of {@link createToothbrush}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact ids and the dimensions this producer records.
 * @evidence contracts/development/design.md#principled-representation Closed unions of the ids it builds and the dimension keys its draw records; a numbered family keeps its prefix with a number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only this producer's own contacts and dimensions, which its callers read through AutoMovieArchetype.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sibling's contact or dimension is admitted.
 */
export namespace createToothbrush {
  /** The contacts this producer builds; a numbered family's count follows its inputs. */
  export type Affordance = "face" | "grip";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "length" | "mass" | "width";
}
