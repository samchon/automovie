import { type Archetype } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Toothbrush with a handle and a +Y bristle face near its far end.
 *
 * @param params The optional scene ID and any fixed free dimension in metres or kilograms.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
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
): Archetype<"grip" | "face", GroomingPropDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<"grip" | "face">> =
    GroomingPropDraw.prepare<"grip" | "face">("toothbrush", params, seed);
  const length: number = d.length!;
  const width: number = d.width!;

  GroomingPropDraw.addHead(
    builder,
    { length, width, head: 0.028, across: width },
    { handle: "#3f8fc4", head: "#eef2f5" },
  );
  return builder.build(d.mass!);
}
