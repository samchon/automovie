import typia from "typia";

import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";
import { HUMAN_BODY_REGION_PART_RESOLVERS } from "./HUMAN_BODY_REGION_PART_RESOLVERS";
import type { IAutoMovieHumanBodyGeneratedAnatomy } from "./IAutoMovieHumanBodyGeneratedAnatomy";
import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "./IAutoMovieHumanBodyRegionPartsInput";

/**
 * Combine every region's part answers into one generated-anatomy report.
 *
 * Each registered region resolver answers its own parts. Two answers for one
 * part refuse by that part's name, because the regions would disagree about
 * who owns it. A part no region answers yet is `geometry-not-validated`: no
 * generator for it exists. The shared skin is a candidate exterior, never a
 * validated generated skin, so it is `geometry-not-validated` as well.
 *
 * @evidence contracts/common.md#principled-implementation Regions own their reasons; the assembly only combines them, refuses duplicates and names the unanswered default.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the registry and the closed id set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part becomes resolved here and no region can overwrite another's answer.
 * @evidence contracts/common.md#meaningful-documentation States the duplicate refusal and both defaults.
 * @evidence contracts/modeling.md#part-identity-and-grouping The report keys every named part once, under the closed part id set.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The exterior builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior consumer displays the report.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Region resolvers own their source reasons.
 * @evidenceExclude contracts/anatomy.md#permitted-range Region resolvers own their refusals.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export function assembleHumanBodyGeneratedAnatomy(
  input: IAutoMovieHumanBodyRegionPartsInput,
): IAutoMovieHumanBodyGeneratedAnatomy {
  const answered = new Map<string, IAutoMovieHumanBodyPartResolution>();
  for (const resolve of HUMAN_BODY_REGION_PART_RESOLVERS)
    for (const part of resolve(input)) {
      if (answered.has(part.id))
        throw new Error(`Two regions answered the anatomical part ${part.id}.`);
      answered.set(part.id, part);
    }
  return {
    skin: { id: "skin", status: "unavailable", reason: "geometry-not-validated" },
    parts: typia.assertEquals<IAutoMovieHumanBodyGeneratedAnatomy["parts"]>(
      Object.fromEntries(
        typia.reflect.literals<AutoMovieHumanBodyPartId>().map((id) => [
          id,
          answered.get(id) ?? { id, status: "unavailable", reason: "geometry-not-validated" },
        ]),
      ),
    ),
  };
}
