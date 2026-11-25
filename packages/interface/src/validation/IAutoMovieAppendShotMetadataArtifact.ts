import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";

/** Shot fields inspected at stored and submitted artifact boundaries. */
export namespace IAutoMovieAppendShotMetadataArtifact {
  /**
   * Borrowed optional fields passed to appendShotMetadataArtifact. Present
   * metadata dispatches in events, editorialMarkers, cameraIntent, coverage,
   * cameraClearance order and appends to the caller's violations array; no
   * field is repaired. Missing fields are skipped.
   */
  export type IShot = Pick<
    IAutoMovieShot,
    | "duration"
    | "camera"
    | "events"
    | "editorialMarkers"
    | "cameraIntent"
    | "coverage"
    | "cameraClearance"
  >;
}
