import { autoMovieRenderDigest, SHA256_DIGEST_PATTERN } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "../assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type { IAutoMovieHumanBodyNativeSubcutaneousSource } from "../assembly/IAutoMovieHumanBodyNativeSubcutaneousSource";
import type { IAutoMovieHumanBodySourcePart } from "../assembly/IAutoMovieHumanBodySourcePart";
import type { IAutoMovieHumanBodyLayerThicknessField } from "./IAutoMovieHumanBodyLayerThicknessField";

/**
 * Admit one native subcutaneous owner against its actual field and skin. File provenance identifies retained source resources; the content digest independently verifies the field the runtime will calculate with. Static and native ownership of the same tissue cannot coexist. Offset geometry and its original refusals remain with the layer constructor.
 *
 * @evidence contracts/common.md#principled-implementation One native SAT owner must match exact skin/field identity, nonempty provenance and raw/prefixed SHA256 forms; actual serialized field digest verifies calculation input.
 * @evidence contracts/common.md#clear-and-simple-design Source provenance admission remains separate from the layer constructor's offset observations and refusals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Static and native owners of the same tissue cannot coexist, and provenance never certifies clinical segmentation or offset embedding.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes file witnesses, actual parsed-field digest and exclusive tissue ownership.
 * @evidence contracts/performance.md#efficient-algorithms Source parts/surfaces are scanned, fixed provenance fields checked and the actual thickness field serialized/hashed in O(field bytes); verification reads the current supplied field.
 * @evidence contracts/performance.md#reuse-equivalent-work Prefixed digest spelling reuses engine SHA256_DIGEST_PATTERN and hashing reuses autoMovieRenderDigest; mutable source inputs are not identity-cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary serialization/hash data die on return/refusal; no field URI is fetched and no source bytes are retained by admission.
 */
export function assertHumanBodyNativeSubcutaneousSource(
  basis: IAutoMovieHumanBodyBasis,
): void {
  const assembly: IAutoMovieHumanBodyAnatomicalAssembly | undefined = basis.anatomicalAssembly;
  const source: IAutoMovieHumanBodyNativeSubcutaneousSource | undefined = assembly?.nativeSubcutaneous;
  if (source === undefined) return;
  if (
    assembly!.parts.some((part: IAutoMovieHumanBodySourcePart): boolean => part.id === source.id) ||
    source.id !== "subcutaneousAdipose" || source.tissue !== "adipose" ||
    [source.surface, source.fieldFileUri, source.bindingAccount, source.qualification].some((value: string): boolean => value.trim() === "") ||
    [source.fieldFileSha256, source.producerSha256, source.inputViewSha256, source.receiptSha256].some((value: string): boolean => !/^[a-f0-9]{64}$/.test(value)) ||
    !SHA256_DIGEST_PATTERN.test(source.fieldDigest)
  ) throw new Error("Native subcutaneous source needs one logical owner and complete explicit field provenance.");
  const matches: IAutoMovieHumanBodyBasis["surfaces"] = basis.surfaces.filter((surface: IAutoMovieHumanBodyBasis["surfaces"][number]): boolean => surface.id === source.surface);
  const field: IAutoMovieHumanBodyLayerThicknessField | undefined = matches[0]?.layerThickness;
  if (
    matches.length !== 1 || field === undefined || field.basis !== basis.id ||
    autoMovieRenderDigest(JSON.stringify(field)) !== source.fieldDigest
  ) throw new Error("Native subcutaneous source does not address this exact registered skin field.");
}
