/**
 * Identity of the installed H.264 encoder and every setting that can change
 * its output bytes.
 *
 * It sits inside `IAutoMovieProductionRenderRuntimeIdentity`, which every chunk
 * id digests, so a different encoder version, closure or setting gives every
 * chunk a new id and an old encode reads as stale. Publication checks that the
 * package and version are non-blank and the closure digest is a SHA-256
 * content digest. No code in the repository builds this record yet; it is
 * supplied with the runtime identity by the caller of
 * `planProductionRenderJob`.
 *
 * @evidence contracts/development/design.md#principled-representation Content addressing needs every input that decides output bytes, so the record names the package, its version, a digest over its installed executable closure, and each byte-affecting encoder setting, and nothing that only affects speed of the build machine.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The encoder facts are grouped apart from the capture facts so the runtime identity reads as capture plus encoder, and the settings sit in one `arguments` record that maps one to one onto the encoder's options.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The codec is a closed `h264` literal because the H.264 adapter is the only encoder, and no setting is defaulted or special-cased here; the doc states that no repository code produces the record yet.
 * @evidence contracts/development/common.md#meaningful-documentation The doc states why the record exists, how a change propagates to chunk ids, which fields publication validates, and that no repository producer exists, and each member says what it identifies and in which unit.
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
