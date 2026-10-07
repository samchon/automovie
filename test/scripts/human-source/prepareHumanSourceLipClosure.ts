import { createHumanSourceFaceRecipeCandidates } from "./createHumanSourceFaceRecipeCandidates.ts";
import { recoverHumanSourceFaceRecipe } from "./recoverHumanSourceFaceRecipe.ts";
import { denseHumanSourceRows } from "./denseHumanSourceRows.ts";
import { HUMAN_SOURCE_RECIPE_TOLERANCE_METRES } from "./HUMAN_SOURCE_RECIPE_TOLERANCE_METRES.ts";
import { readHumanSourceAuthoredEndpoint } from "./readHumanSourceAuthoredEndpoint.ts";
import type { IHumanSourceLipClosurePreparation } from "./structures/IHumanSourceLipClosurePreparation.ts";
import type { IHumanSourceLipClosureRows } from "./structures/IHumanSourceLipClosureRows.ts";

/**
 * Recover the original closure recipe, then read its current provider delta.
 * The existing all-candidate recovery owner retains its two-micrometre source
 * reproduction threshold and common extraction shift. Retired legacy vertices
 * are never copied into the replaced head. Every current head sample reads
 * the verified replay's root delta through its actual cut stencil, minus that
 * same recovered frame shift. Unmatched endpoints use the normal producer's
 * explicit original-native residual transport and retain that provenance.
 * Missing support or nonfinite rows refuse before source geometry is authored.
 */
export function prepareHumanSourceLipClosure(input: IHumanSourceLipClosurePreparation): IHumanSourceLipClosureRows {
  const { original, originalCut, skin, sample, originalReader, currentReader } = input;
  const contact = original.contact, source = original.surfaces.find((surface) => surface.id === contact?.lips.surface);
  const channel = original.channels.find((one) => one.id === contact?.closure.channel);
  if (source === undefined || channel === undefined || source.targets[channel.positive] === undefined)
    throw new Error("Current source closure needs its original endpoint and recipe population.");
  if (originalCut.faceSamples.length !== source.positions.length / 3 || new Set(originalCut.faceToG1).size !== originalCut.faceSamples.length)
    throw new Error("Source closure recovery needs the original face's exact injective cut domain.");
  const candidates = createHumanSourceFaceRecipeCandidates(originalCut, originalReader, sample);
  const match = recoverHumanSourceFaceRecipe(denseHumanSourceRows(source.targets[channel.positive], source.positions.length / 3), candidates);
  const matched = Number.isFinite(match.maximumMetres) && match.maximumMetres <= HUMAN_SOURCE_RECIPE_TOLERANCE_METRES;
  const originalRows = [...source.targets[channel.positive]];
  for (let at = 0; at < originalRows.length; at += 4) originalRows[at] = originalCut.faceToG1[originalRows[at]];
  const delta = readHumanSourceAuthoredEndpoint({ name: channel.positive, original: originalCut, root: input.root, packet: input.packet,
    reader: currentReader, originalRows, recipe: matched ? match.state : undefined, shiftMetres: matched ? match.shiftMetres : undefined });
  const rows: number[] = [];
  skin.partition.cut.faceSamples.forEach(({ a, b, t }, vertex) => {
    const xyz = [0, 1, 2].map((axis) => (1 - t) * delta[3 * a + axis] + t * delta[3 * b + axis]);
    if (!xyz.every(Number.isFinite)) throw new Error("Current source closure replay has a nonfinite cut sample.");
    if (xyz.some((value) => value !== 0)) rows.push(vertex, ...xyz);
  });
  return { endpoint: channel.positive, recipe: matched ? match.state : null, frameShiftMetres: matched ? match.shiftMetres : null,
    provenance: matched ? "upstreamRecipe" : "carriedNativeResidual",
    recoveryMaximumMetres: match.maximumMetres, rows };
}
