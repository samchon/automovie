import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import { readHumanSourceLandmarkRow } from "./readHumanSourceLandmarkRow.ts";
import type { IHumanSourceGenerationLandmarks } from "./structures/IHumanSourceGenerationLandmarks.ts";

/**
 * Regenerate the face landmark set for the head-shaping body endpoints. Rows
 * of face endpoints that now alias a body channel are dropped; each
 * head-shaping body endpoint gains the face landmarks' rows relative to the
 * anchor carry, so articulation pivots follow the reshaped head. Body
 * landmark sets pass through unchanged.
 */
export function regenerateHumanSourceFaceLandmarks(
  sets: readonly IHumanSourceGenerationLandmarks[],
  body: IAutoMovieHumanBodyBasis,
  headShaping: ReadonlySet<string>,
  aliased: ReadonlySet<string>,
  anchorOf: (name: string) => number[],
): IHumanSourceGenerationLandmarks[] {
  return sets.map((set) => {
    if (set.origin !== "face") return set;
    const targets: Record<string, number[]> = Object.fromEntries(Object.entries(set.targets).filter(([name]) => !aliased.has(name)));
    const indices = set.ids.map((id) => body.landmarks.ids.indexOf(id));
    for (const name of Object.keys(body.landmarks.targets).filter((key) => headShaping.has(key))) {
      const anchor = anchorOf(name);
      const out: number[] = [];
      indices.forEach((index, i) => {
        if (index < 0) return;
        const row = readHumanSourceLandmarkRow(body, name, index).map((x, c) => x - anchor[c]);
        if (row.some((x) => x !== 0)) out.push(i, ...row);
      });
      if (out.length > 0) targets[name] = out;
    }
    return { ...set, targets };
  });
}
