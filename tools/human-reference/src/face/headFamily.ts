import { faceTypes } from "./faceTypes.ts";

interface Input {
  rows: { id: string; y: number; points: faceTypes.Point[] }[];
  limits: string[];
}

/**
 * Maps the head author's ordered front arcs to a nonperiodic section family without inferring a second cut.
 * Row endpoints remain the sole side-boundary observations. Background trimming against feature collars
 * is unresolved and is carried into the candidate's limits.
 *
 * @evidence contracts/common.md#principled-implementation A direct row mapping preserves physical heights, source paths and the head owner's exact cut endpoints.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns only the head chart schema; the common compiler owns fitting and evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy or identity is special-cased, and untrimmed overlap is explicitly unaccepted.
 * @evidence contracts/common.md#meaningful-documentation States boundary ownership and the unresolved feature-collar trim.
 * @evidence contracts/performance.md#efficient-algorithms One linear row traversal creates section descriptors while reusing immutable point arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Supplied observation arrays remain shared by reference; there is no cross-invocation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned family retains its input rows until compilation releases it and opens no resources.
 */
export function headFamily(input: Input): faceTypes.Family {
  if (!Array.isArray(input.rows) || input.rows.length < 2)
    throw new Error("Ordered front-head chart rows required");
  return {
    id: "face.head-background",
    owner: "headneck",
    periodic: false,
    sections: input.rows.map(
      (row: Input["rows"][number]): faceTypes.Section => ({
        id: row.id,
        station: row.y,
        points: row.points,
      }),
    ),
    knots: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    knotLabels: [
      "right-cut",
      "right-lateral",
      "right-quarter",
      "right-medial",
      "anterior-middle",
      "left-medial",
      "left-quarter",
      "left-lateral",
      "left-cut",
    ],
    boundaryMeaning:
      "Top, bottom and both angular side cuts are owned by the supplied front-head chart. All four emitted boundaries and transverse derivatives come from this evaluator.",
    limits: [
      ...input.limits,
      "This background candidate is not yet trimmed against eye and mouth collars; standalone patches must not be overlaid and called an assembled continuous face.",
    ],
  };
}
