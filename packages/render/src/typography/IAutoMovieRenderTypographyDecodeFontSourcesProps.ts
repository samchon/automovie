import type { IAutoMovieFontSource } from "@automovie/interface";

/** The options for decoding a shot's font sources. */
export interface IAutoMovieRenderTypographyDecodeFontSourcesProps {
  /** The shot's font sources, in list order. */
  sources: readonly IAutoMovieFontSource[];

  /** Project asset reader for `"asset"` sources. */
  readAsset?: (path: string) => Promise<Uint8Array>;
}
