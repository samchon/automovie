import type {
  AutoMovieTextureBinding,
  IAutoMovieTextureReference,
} from "@automovie/interface";

/**
 * Identify binding-controlled GPU upload state independently of shader UVs.
 * A source's inherited sampler is shared by all clones that omit a sampler;
 * when its host reports that sampler, an equivalent explicit binding shares
 * the same key. UV channel, offset, scale and rotation do not allocate storage.
 * The source owner adds actual format, type and upload state to this key.
 *
 * @evidence contracts/common.md#principled-implementation Serialize color decoding and effective sampler fields as a fixed-position JSON tuple; omitted binding samplers inherit host source sampling, while shader UV transforms do not affect native upload allocation.
 * @evidence contracts/common.md#clear-and-simple-design This function owns binding-controlled upload equivalence; source identity, component format and actual upload flags are added by the texture closure owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited unsupported/unreported sampler state is not certified by this key alone; closure separately tracks allocation authority instead of interpreting a key match as measured storage.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish effective inherited/explicit sampler equality, decoding and ignored UV state; source facts are optional borrowed host inputs.
 * @evidence contracts/performance.md#efficient-algorithms The fixed sampler tuple uses O(1) structural work and output proportional to enum/native-key string lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent explicit and observed inherited samplers share the tuple, enabling closure reuse only together with actual Source/format/upload identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned string retains no binding object or texture; no native allocation, handle or watcher is owned.
 */
export function autoMovieTextureBindingStateKey(
  binding: AutoMovieTextureBinding,
  legacyColorSpace: "srgb" | "linear" | "linear-environment",
  sourceSampler?: IAutoMovieTextureReference["sampler"],
  sourceSamplerState?: string | null,
): string {
  const reference: IAutoMovieTextureReference | undefined =
    typeof binding === "string" ? undefined : binding;
  const sampler:
    | {
        wrapS: "clamp" | "repeat" | "mirror";
        wrapT: "clamp" | "repeat" | "mirror";
        minFilter:
          | "nearest"
          | "linear"
          | "nearestMipmapLinear"
          | "linearMipmapLinear";
        magFilter: "nearest" | "linear";
      }
    | undefined = reference?.sampler ?? sourceSampler;
  return JSON.stringify([
    reference?.colorSpace ?? legacyColorSpace,
    sampler === undefined
      ? (sourceSamplerState ?? "source-sampler")
      : [sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter],
  ]);
}
