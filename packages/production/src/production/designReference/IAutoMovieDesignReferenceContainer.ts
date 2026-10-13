/**
 * Parser-confirmed family and any extent carried by the admitted container.
 *
 * @author Samchon
 */
export type IAutoMovieDesignReferenceContainer =
  | { media: "image/png" | "image/jpeg"; width: number; height: number }
  | { media: "image/svg+xml"; width: number; height: number }
  | { media: "image/svg+xml" }
  | { media: "application/pdf" | "image/vnd.dxf" };
