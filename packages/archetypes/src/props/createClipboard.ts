import { Vector3 } from "@automovie/engine";

import { type Archetype } from "../core";
import { StationeryDraw } from "./StationeryDraw";

/**
 * Clipboard with a grip on its near edge and a level writing surface.
 *
 * @param params The optional scene ID and Esselte model.
 * @param seed The seed for the recorded recipe. Without a seed, the draw uses the original defaults.
 * @returns The model with its named contact frames in model space.
 * @throws {ArchetypeRefusal} When the model or a fixed parameter lies outside its admitted recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Clipboard with a grip on its near edge and a level writing surface.
 * @evidence contracts/development/implementation.md#principled-implementation The selected Esselte model supplies the board dimensions and mass. The pinch and face derive from the board.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the saved recipe, then build this prop and its own contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The clamp remains outside the saved board proxy.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds one part and two contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The named and saved entry points share this producer and its original draw stream.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createClipboard(
  params: Pick<StationeryDraw.IParams, "id"> & {
    model?: StationeryDraw.Model;
  } = {},
  seed?: number | string,
): Archetype<"grip" | "face", StationeryDraw.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StationeryDraw.prepare<"grip" | "face">> =
    StationeryDraw.prepare<"grip" | "face">("clipboard", params, seed);
  const width: number = d.width!;
  const length: number = d.length!;
  const thick: number = d.thickness!;

  builder.box(
    "board",
    Vector3.create(width, thick, length),
    Vector3.create(0, thick / 2, 0),
    { color: "#8a6a4a" },
  );
  StationeryDraw.addPanelContacts(builder, { width, length, thick }, 0);
  return builder.build(d.mass!);
}
