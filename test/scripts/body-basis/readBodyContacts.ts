import { measureAutoMovieModelCrossings } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Crossing readings of a built body split into dominant-bone segments.
 *
 * `segmented` is the output of the package's body segmenter
 * (`createHumanBodySegmenter`): a model of one part per bone segment and the
 * basis vertices each part reads. The instrument is the engine's
 * `measureAutoMovieModelCrossings`, which counts triangles of one part that a
 * triangle of another part pierces and, with `within`, triangles of one part
 * that another triangle of the same part pierces (a fold swallowing its own
 * crease). The rest pose of the shipped basis crosses on no pair, so every
 * reading is absolute.
 */

/** One crossing pair: the parts and how many triangles of each are pierced. */
export interface IBodyContactPair {
  part: string;
  other: string;
  triangles: number;
  otherTriangles: number;
}

/** The output of `createHumanBodySegmenter`'s evaluator. */
export interface IBodySegmented {
  model: IAutoMovieModel;
  sources: Map<string, number[]>;
}

/** Every crossing pair of a segmented body. */
export function readBodyContacts(
  segmented: IBodySegmented,
  within = true,
): IBodyContactPair[] {
  return measureAutoMovieModelCrossings(segmented.model, {
    withinParts: within,
  }).map(({ part, other, triangles, otherTriangles }) => ({
    part,
    other,
    triangles,
    otherTriangles,
  }));
}

/**
 * The crossing pairs of a candidate that differs from a measured body only by
 * a corrective moving `moved` rest vertices.
 *
 * A pair between two segments the corrective leaves alone has the same
 * geometry on both, so only the pairs with a moved segment (and each moved
 * segment against itself, when `within`) are measured. `known` supplies the
 * unmoved pairs from the earlier reading; without it only the moved pairs are
 * returned, enough to compare two candidates that differ in nothing else. The
 * partition is the skin's dominant-bone one, the same for every revision of
 * the basis.
 */
export function readMovedBodyContacts(
  segmented: IBodySegmented,
  moved: ReadonlySet<number>,
  known: IBodyContactPair[] | null,
  within = true,
): IBodyContactPair[] {
  const touched = new Set(
    [...segmented.sources]
      .filter(([, vertices]) => vertices.some((v) => moved.has(v)))
      .map(([part]) => part),
  );
  const parts = segmented.model.parts;
  const found: IBodyContactPair[] = [];
  for (let first = 0; first < parts.length; first++)
    for (let second = first; second < parts.length; second++) {
      if (!touched.has(parts[first].id) && !touched.has(parts[second].id))
        continue;
      if (first === second && !within) continue;
      for (const c of measureAutoMovieModelCrossings(
        {
          ...segmented.model,
          parts:
            first === second ? [parts[first]] : [parts[first], parts[second]],
        },
        { withinParts: first === second },
      ))
        found.push({
          part: c.part,
          other: c.other,
          triangles: c.triangles,
          otherTriangles: c.otherTriangles,
        });
    }
  if (known === null) return found;
  return [
    ...known.filter(
      (pair) => !touched.has(pair.part) && !touched.has(pair.other),
    ),
    ...found,
  ];
}

/** The triangle count a list of pairs pierces, both sides. */
export function countBodyContactTriangles(pairs: IBodyContactPair[]): number {
  return pairs.reduce((sum, p) => sum + p.triangles + p.otherTriangles, 0);
}

/** A short label of a pair list, `-` for none. */
export function summarizeBodyContacts(pairs: IBodyContactPair[]): string {
  return pairs.map((p) => `${p.part}x${p.other}`).join(",") || "-";
}
