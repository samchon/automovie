import { autoMovieRenderDigest } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit one native subcutaneous owner against its actual field and skin.
 * File provenance identifies retained source resources; the content digest
 * independently verifies the field the runtime will calculate with. Static
 * and native ownership of the same tissue cannot coexist. Offset geometry
 * and its original refusals remain with the layer constructor.
 */
export function assertHumanBodyNativeSubcutaneousSource(
  basis: IAutoMovieHumanBodyBasis,
): void {
  const assembly = basis.anatomicalAssembly;
  const source = assembly?.nativeSubcutaneous;
  if (source === undefined) return;
  if (
    assembly!.parts.some((part) => part.id === source.id) ||
    source.id !== "subcutaneousAdipose" || source.tissue !== "adipose" ||
    [source.surface, source.fieldFileUri, source.bindingAccount, source.qualification].some((value) => value.trim() === "") ||
    [source.fieldFileSha256, source.producerSha256, source.inputViewSha256, source.receiptSha256].some((value) => !/^[a-f0-9]{64}$/.test(value)) ||
    !/^sha256:[a-f0-9]{64}$/.test(source.fieldDigest)
  ) throw new Error("Native subcutaneous source needs one logical owner and complete explicit field provenance.");
  const matches = basis.surfaces.filter((surface) => surface.id === source.surface);
  const field = matches[0]?.layerThickness;
  if (
    matches.length !== 1 || field === undefined || field.basis !== basis.id ||
    autoMovieRenderDigest(JSON.stringify(field)) !== source.fieldDigest
  ) throw new Error("Native subcutaneous source does not address this exact registered skin field.");
}
