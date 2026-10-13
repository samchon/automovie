import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import type { IAutoMovieExternalMotionBasis } from "./IAutoMovieExternalMotionBasis";
import { IAutoMovieExternalMotionReceiptResource } from "./IAutoMovieExternalMotionReceiptResource";
import type { IAutoMovieExternalMotionTake } from "./IAutoMovieExternalMotionTake";

/**
 * Complete byte-grounded source basis consumed by one motion conversion.
 *
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
  basisDigest: AutoMovieContentDigest;
}
