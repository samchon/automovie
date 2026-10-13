import typia from "typia";

import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";
import { HUMAN_BODY_REGION_PART_RESOLVERS } from "./HUMAN_BODY_REGION_PART_RESOLVERS";
import type { IAutoMovieHumanBodyGeneratedAnatomy } from "./IAutoMovieHumanBodyGeneratedAnatomy";
import type { IAutoMovieHumanBodyAnatomicalUnavailable } from "./IAutoMovieHumanBodyAnatomicalUnavailable";
import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "./IAutoMovieHumanBodyRegionPartsInput";

/**
 * Combine every region's part answers into one generated-anatomy report.
 *
 * Each registered region resolver answers its own parts. Two answers for one part refuse by that part's name, because the regions would disagree about who owns it. A part no region answers yet is `geometry-not-validated`: no independently validated anatomical resolution is supplied. Acquired or authored coarse source geometry may exist separately; this report does not prohibit its generation or certify its biological validity. The shared skin remains a candidate exterior with the same independent validation boundary.
 *
 * @evidence contracts/common.md#principled-implementation Registered region results enter one identity map, duplicate owners refuse, and the type-derived complete catalogue receives explicit unavailable defaults before exact runtime admission.
 * @evidence contracts/common.md#clear-and-simple-design The assembler owns complete inventory/duplicate detection while each region owns its part-specific answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent generators remain geometry-not-validated, never coarse-source or rendered-skin clinical certificates.
 * @evidence contracts/common.md#meaningful-documentation The comment explains duplicate refusal, unhandled-part causes, independent coarse source geometry and candidate skin qualification.
 * @evidence contracts/performance.md#efficient-algorithms For R returned regional parts and C catalogue IDs, maps and complete output cost O(R+C) plus each region's work and exact runtime validation.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue IDs derive from the maintained type union; each region runs once per call, with no stale source/request report cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The partial identity map is temporary and failure returns no partial report; only completed availability records escape without source mutation.
 * @author Samchon
 */
export function assembleHumanBodyGeneratedAnatomy(
  input: IAutoMovieHumanBodyRegionPartsInput,
): IAutoMovieHumanBodyGeneratedAnatomy {
  const answered: Map<AutoMovieHumanBodyPartId, IAutoMovieHumanBodyPartResolution> = new Map();
  for (const resolve of HUMAN_BODY_REGION_PART_RESOLVERS)
    for (const part of resolve(input)) {
      if (answered.has(part.id))
        throw new Error(`Two regions answered the anatomical part ${part.id}.`);
      answered.set(part.id, part);
    }
  return {
    skin: {
      id: "skin",
      status: "unavailable",
      reason: "geometry-not-validated",
    },
    parts: typia.assertEquals<IAutoMovieHumanBodyGeneratedAnatomy["parts"]>(
      Object.fromEntries(
        typia.reflect.literals<AutoMovieHumanBodyPartId>().map((id: AutoMovieHumanBodyPartId): [AutoMovieHumanBodyPartId, IAutoMovieHumanBodyPartResolution | IAutoMovieHumanBodyAnatomicalUnavailable<AutoMovieHumanBodyPartId>] => [
          id,
          answered.get(id) ?? {
            id,
            status: "unavailable",
            reason: "geometry-not-validated",
          },
        ]),
      ),
    ),
  };
}
