import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Serialize one collision observation under the shared confidence, depth and path rules.
 *
 * @param key The coverage key the finding answers.
 * @param paths The ordered part paths.
 * @param mode A placed frame or a motion cell.
 * @param confirmed Whether drawn geometry proves the penetration.
 * @param separation Measured signed gap in metres, or null for bounds alone.
 * @param tolerance Allowed depth in metres.
 * @param point World witness point, when measured.
 * @param time The witness clock and, for a motion cell, its interval.
 * @returns A plain finding; confirmed findings are errors, candidates warnings.
 * @evidence contracts/development/common.md#meaningful-documentation States the category and confidence mapping and the depth measurement.
 * @evidence contracts/development/implementation.md#principled-implementation Ranks by penetration depth and records the separation against the negative allowance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One constructor for frame and motion findings.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bounds-only candidate carries no invented point or depth.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one record.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data only.
 */
export function createAutoMovieCollisionFinding(
  key: string,
  paths: readonly string[],
  mode: "frame" | "sweep",
  confirmed: boolean,
  separation: number | null,
  tolerance: number,
  point: IAutoMovieVector3 | null,
  time: Pick<Diagnostic.IWitness, "time" | "interval">,
): Diagnostic.IFinding {
  return {
    check: "collision",
    key,
    paths,
    code: mode === "frame" ? "scene-penetration" : "swept-penetration",
    category: confirmed ? "error" : "warning",
    confidence: confirmed ? "confirmed" : "candidate",
    message: confirmed
      ? "Displayed geometry penetrates another part."
      : "The available geometry suggests overlap.",
    witness: {
      ...time,
      ...(point === null
        ? {}
        : { point: { x: point.x, y: point.y, z: point.z } }),
      ...(separation === null
        ? {}
        : {
            rank: Math.max(0, -separation),
            measurements: [
              {
                name: "separation",
                value: separation,
                unit: "m",
                limit: -tolerance,
              },
            ],
          }),
    },
  };
}
