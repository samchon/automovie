import { IAutoMovieSemanticMaskCoverage } from "./IAutoMovieSemanticMaskCoverage";

/**
 * Exact resident semantic sidecar dependency of one shot mask image.
 *
 * @evidence contracts/common.md#principled-implementation Mask publication binds frame, shot and mask pass to exact UTF-8 sidecar bytes and canonical semantic payload digest while preserving observed runtime coverage; readback reopens both byte and semantic identities.
 * @evidence contracts/common.md#clear-and-simple-design One dependency record connects the image's flat colors to its canonical palette and coverage without embedding the entire palette in every frame manifest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A PNG digest alone cannot prove semantic addressing, and coverage gaps remain present rather than normalized away; foreign shot/frame and changed sidecar bytes refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines frame/pass/shot identity, owner-relative sidecar path, exact byte digest and size, payload digest and unmodified coverage.
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskReceipt {
  /** Receipt record schema. */
  version: 1;

  /** Frame identity inside the owning bundle or chunk. */
  frame: number;

  /** Structural product this record accompanies. */
  pass: "mask";

  /** Exact compiled shot represented by the product. */
  shot: string;

  /** Canonical sidecar resident beside the image. */
  sidecar: {
    /** Portable owner-relative path. */
    path: string;

    /** Digest of the exact resident UTF-8 bytes. */
    digest: string;

    /** Positive resident byte count. */
    bytes: number;
  };

  /** Digest of the canonical semantic payload inside the sidecar. */
  semanticDigest: string;

  /** Runtime coverage preserved without normalizing gaps away. */
  coverage: IAutoMovieSemanticMaskCoverage;
}
