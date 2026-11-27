import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureStorage,
} from "@automovie/interface";

/** Input for capturing one subject through the CLI capture host. */
export interface IAutoMovieCliCaptureHostInput {
  /** The request, as `parseCapturePlanRequest` read it. */
  request: IAutoMovieCapturePlanRequest;

  /** Data the subject module reads, as JSON, or null. */
  props: unknown;

  /**
   * The capture's root folder, relative to the production or absolute;
   * absent, `media/capture/<subject>` of the production.
   */
  out?: string;

  /** Admit the absolute output folder before capture artifacts are written. */
  admitFolder?: (folder: string) => void;

  /** Storage used for capture artifacts. */
  storage?: IAutoMovieCaptureStorage;

  /** The subject owner's own section of the record, or absent. */
  section?: Readonly<Record<string, unknown>>;
}
