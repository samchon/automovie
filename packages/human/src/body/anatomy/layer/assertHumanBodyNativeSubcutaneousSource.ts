import { autoMovieRenderDigest } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";

/**
 * Admit one native subcutaneous owner against its actual field and skin.
 * File provenance identifies retained source resources; the content digest
 * independently verifies the field the runtime will calculate with. Static
 * and native ownership of the same tissue cannot coexist. Offset geometry
 * and its original refusals remain with the layer constructor.
 *
 * @evidence contracts/common.md#principled-implementation Exact surface/basis identity and parsed field digest bind the runtime calculation to the source registration.
 * @evidence contracts/common.md#clear-and-simple-design One admission serves both standalone Body and Person through their compiled body basis.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Simultaneous static/native ownership refuses instead of dropping a selected source part.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes resource provenance, runtime field identity and independent geometry observations.
 * @evidence contracts/modeling.md#shared-boundaries One field and native skin own the subcutaneous boundary, excluding an independent static boundary owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source descriptor owns the logical tissue identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels No authoring channel is added.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This admission emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The surface/field owners retain the metre frame and native indices.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body and person consumers observe the boundary.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Field anchors retain anatomical quantity and population qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing field and offset admission retain physiological and geometric limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline registration is not personal authoring.
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
