import { type Archetype } from "../core";
import { GroomingPropDraw } from "./GroomingPropDraw";

/**
 * Shaving razor scene prop with a grip and a +Y cartridge face.
 *
 * @param params The optional scene ID, manufacturer model, and handle diameter in metres.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
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
): Archetype<"grip" | "face", GroomingPropDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GroomingPropDraw.prepare<"grip" | "face">> =
    GroomingPropDraw.prepare<"grip" | "face">("razor", params, seed);
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
