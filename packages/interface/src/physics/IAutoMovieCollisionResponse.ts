import type { IAutoMoviePose } from "../pose/IAutoMoviePose";
import type { IAutoMovieImpact } from "./IAutoMovieImpact";
import type { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * Advisory collision result containing an impact, its scalar impulse-derived
 * recoil push and an optional ROM-bounded flinch pose. Recoil is null unless
 * both struck chain and skeleton were supplied.
 */
export interface IAutoMovieCollisionResponse {
  /** Resolved normal impulse and qualitative collision advice. */
  impact: IAutoMovieImpact;

  /**
   * Clinical recoil control obtained from impulse magnitude and the caller's
   * gain.
   */
  push: IAutoMovieRecoilPush;

  /**
   * ROM-bounded flinch pose, or null unless both struck chain and skeleton were
   * supplied.
   */
  recoil: IAutoMoviePose | null;
}
