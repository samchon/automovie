/**
 * Identity of the installed H.264 encoder and every setting that can change its
 * output bytes.
 *
 * It sits inside `IAutoMovieProductionRenderRuntimeIdentity`, which every chunk
 * id digests, so a different encoder version, closure or setting gives every
 * chunk a new id and an old encode reads as stale. Publication checks that the
 * package and version are non-blank and the closure digest is a SHA-256 content
 * digest. No code in the repository builds this record yet; it is supplied with
 * the runtime identity by the caller of `planProductionRenderJob`.
 */
export interface IAutoMovieProductionEncoderIdentity {
  /** Installed encoder package name, such as `h264-mp4-encoder`. */
  package: string;

  /** Installed encoder package version, exactly as installed. */
  version: string;

  /** SHA-256 content digest over every installed file the encoder executes. */
  closureDigest: string;

  /** Coded video format the encoder emits; H.264 is the only one. */
  codec: "h264";

  /** Every encoder setting that can change the output bytes. */
  arguments: {
    /** The encoder's quantization parameter; lower values keep more detail. */
    quantizationParameter: number;

    /** The encoder's speed preset, which trades compression for time. */
    speed: number;

    /** Key-frame interval, in frames. */
    groupOfPictures: number;
  };
}
