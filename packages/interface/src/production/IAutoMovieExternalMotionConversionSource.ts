import type { IAutoMovieExternalMotionBasis } from "./IAutoMovieExternalMotionBasis";
import { IAutoMovieExternalMotionReceiptResource } from "./IAutoMovieExternalMotionReceiptResource";
import type { IAutoMovieExternalMotionTake } from "./IAutoMovieExternalMotionTake";

/**
 * Complete byte-grounded source basis consumed by one motion conversion.
 *
 * @evidence contracts/common.md#principled-implementation Primary bytes, ordered resource closure, inspected take and normalized hierarchy/rest basis pin the entire input to one conversion; a separate canonical basis digest identifies its interpreted source geometry and coordinate facts.
 * @evidence contracts/common.md#clear-and-simple-design Byte resources and interpreted take/basis are kept together as source provenance but separated from the actor-bound decision and target rig, which own different conversion authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A take name alone cannot choose source bytes or sidecars, and an authored rig cannot overwrite the byte-inspected hierarchy retained in the receipt.
 * @evidence contracts/common.md#meaningful-documentation States primary asset ownership, ordered interpretation dependencies, exact inspected take, normalized coordinate and local-rest basis and its canonical digest.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionSource {
  /** Primary external motion asset and its exact content digest. */
  asset: IAutoMovieExternalMotionReceiptResource;

  /** Ordered dependency files required to interpret the source asset. */
  closure: IAutoMovieExternalMotionReceiptResource[];

  /** Exact animation take selected from the source bytes. */
  take: IAutoMovieExternalMotionTake;

  /**
   * Canonical coordinate, hierarchy, and local-rest basis inspected from bytes.
   */
  basis: IAutoMovieExternalMotionBasis;

  /** Canonical digest of the inspected source basis. */
  basisDigest: string;
}
