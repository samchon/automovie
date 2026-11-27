import type { IAutoMovieInspectionDiagnostics, IAutoMoviePhysicalFrame } from "@automovie/interface";
import type { Camera, Scene } from "three";
import type { IObserveAutoMoviePlacedSceneCheck } from "./IObserveAutoMoviePlacedSceneCheck.js";

/** The original placed scene and source-owned checks at the selected clock. */
export interface IObserveAutoMoviePlacedSceneProps {
  /** Original scene before inspection overlays or visibility masks. */
  readonly scene: Scene;
  /** The canonical delivery camera, even when detached from the scene. */
  readonly camera: Camera;
  /** The clock of this observation when supplied by the host. */
  readonly time?: IAutoMovieInspectionDiagnostics.ITime;
  /** Physical snapshot already applied by the caller's placement. */
  readonly physicalFrame?: IAutoMoviePhysicalFrame;
  /** Authoritative checks selected for the placed occurrence by its owner. */
  readonly checks?: readonly IObserveAutoMoviePlacedSceneCheck[];
}
