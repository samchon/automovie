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
 * independently validated anatomical resolution is supplied. Acquired or
 * authored coarse source geometry may exist separately; this report does not
 * prohibit its generation or certify its biological validity. The shared skin
 * remains a candidate exterior with the same independent validation boundary.
 *
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
    skin: {
      id: "skin",
      status: "unavailable",
      reason: "geometry-not-validated",
    },
    parts: typia.assertEquals<IAutoMovieHumanBodyGeneratedAnatomy["parts"]>(
      Object.fromEntries(
        typia.reflect.literals<AutoMovieHumanBodyPartId>().map((id) => [
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
