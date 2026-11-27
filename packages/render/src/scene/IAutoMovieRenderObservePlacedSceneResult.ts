import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

/** Findings and coverage produced by one placed-scene observation. */
export type IAutoMovieRenderObservePlacedSceneResult = Pick<IAutoMovieInspectionDiagnostics, "findings" | "coverage">;
