import type { AutoMovieContentDigest } from "@automovie/interface";

/** Package-owned encoder identity fenced into every chunk. */
export interface IAutoMovieProductionEncoderIdentity {
  /**
   * Exact installed package name.
   */
  package: string;
  /**
   * Exact installed package version.
   */
  version: string;
  /**
   * Canonical digest of the complete installed executable closure.
   */
  closureDigest: AutoMovieContentDigest;
  /**
   * Closed codec family emitted by the foundation adapter.
   */
  codec: "h264";
  /**
   * Every encoder argument that can affect output bytes.
   */
  arguments: {
    /** Constant-rate-factor analogue accepted by the package encoder. */
    quantizationParameter: number;
    /** Package encoder speed setting. */
    speed: number;
    /** Key-frame period in frames. */
    groupOfPictures: number;
  };
}
