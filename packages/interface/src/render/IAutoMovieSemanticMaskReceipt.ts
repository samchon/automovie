import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieSemanticMaskCoverage } from "./IAutoMovieSemanticMaskCoverage";

/**
 * Resident semantic dependency of one mask image.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Exposes `IAutoMovieSemanticMaskReceipt` as the portable data boundary for content-addressed semantic evidence.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Types `IAutoMovieSemanticMaskReceipt` for reopening a semantic render product.
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
    digest: AutoMovieContentDigest;

    /** Positive resident byte count. */
    bytes: number;
  };

  /** Digest of the canonical semantic payload inside the sidecar. */
  semanticDigest: AutoMovieContentDigest;

  /** Runtime coverage preserved without normalizing gaps away. */
  coverage: IAutoMovieSemanticMaskCoverage;
}
