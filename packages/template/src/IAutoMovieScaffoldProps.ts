import type { AutoMovieProductionLanguage } from "@automovie/evidence";

/**
 * Project-owned values interpolated into the scaffold's `{{...}}` tokens.
 *
 * @author Samchon
 */
export interface IAutoMovieScaffoldProps {
  /** The created project's package name (replaces `{{name}}`). */
  name: string;
  /** Exact language contract installed into `docs/language`. */
  language: AutoMovieProductionLanguage;
}
