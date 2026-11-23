import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Serialize one collision observation under the shared confidence, depth and
 * path rules.
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
