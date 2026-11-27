import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

/** Findings and coverage produced by one placed-scene observation. */
export type IObserveAutoMoviePlacedSceneResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;
