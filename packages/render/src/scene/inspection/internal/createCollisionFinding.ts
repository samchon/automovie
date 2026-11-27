import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Serialize one collision observation under the shared confidence, depth and
 * path rules.
 * Parameter key: The coverage key the finding answers.
 * Parameter paths: The ordered part paths.
 * Parameter mode: A placed frame or a motion cell.
 * Parameter confirmed: Whether drawn geometry proves the penetration.
 * Parameter separation: Measured signed gap in metres, or null for bounds alone.
 * Parameter tolerance: Allowed depth in metres.
 * Parameter point: World witness point, when measured.
 * Parameter time: The witness clock and, for a motion cell, its interval.
 * Returns: A plain finding; confirmed findings are errors, candidates warnings.
 */
export function createCollisionFinding(
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
