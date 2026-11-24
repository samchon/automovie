/**
 * Everything that decides one stage artifact's bytes, before it is hashed into
 * a cache key by `composeAutoMovieArtifactKey`.
 *
 * A stage is any deterministic step whose output is worth keeping between runs:
 * a prepared figure, a resolved schedule, a physics bake, one captured frame.
 * Its key must name every input that can change the output (Bazel's documented
 * failure is a key that omits the toolchain, so a hit returns bytes
 * made for another environment). The record therefore separates three kinds:
 * the stage's own implementation identity, the tools it runs on and the data it
 * reads. Everything else, such as wall-clock time or an undeclared environment
 * variable, must not influence the computation.
 *
 * Feed an upstream stage's output digest into `inputs` rather than that stage's
 * own inputs: when the upstream recomputes to the same bytes its digest is
 * unchanged, so this key is unchanged and the stage is not rerun (early cutoff,
 * Mokhov et al. 2018 "Build Systems a la Carte").
 */
export interface IAutoMovieArtifactKey {
  /**
   * Stable stage name, such as `render.viewer-frame`; two stages never share
   * keys.
   */
  stage: string;

  /**
   * The stage implementation's version, bumped by its owner whenever the code
   * would produce different bytes from the same inputs. Hashing cannot see a
   * code change, so this is the only invalidation for one.
   */
  version: string;

  /**
   * Tool and environment identities the output depends on, such as package
   * versions, the browser build, the GPU renderer string or an encoder
   * fingerprint. Order does not matter.
   */
  toolchain: Readonly<Record<string, string>>;

  /**
   * Declared input values or digests, such as parameters, an upstream
   * artifact's output digest, a viewport or a frame time. Order does not
   * matter.
   */
  inputs: Readonly<Record<string, string>>;
}
