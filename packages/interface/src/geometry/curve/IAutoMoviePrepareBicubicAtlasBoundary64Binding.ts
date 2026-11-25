import type { IAutoMovieBicubicAtlasTessellation64 } from "./IAutoMovieBicubicAtlasTessellation64";

/**
 * Admitted explicit binding or transported restriction for an otherwise unbound
 * complete-edge peer. Explicit records are borrowed; transported records are
 * new.
 */
export type IAutoMoviePrepareBicubicAtlasBoundary64Binding = NonNullable<
  IAutoMovieBicubicAtlasTessellation64.Input["boundaryBindings"]
>[number] & {
  /**
   * Canonically oriented comma-separated four-control-ID tuple for a
   * transported legacy fan; absent for explicitly authored bindings.
   */
  legacy?: string;
};
