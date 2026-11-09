import { IAutoMoviePose } from "@automovie/interface";

import { IAutoMovieImpact } from "./IAutoMovieImpact";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * Advisory collision result containing an impact, its scalar impulse-derived recoil push and an optional ROM-bounded flinch pose. Recoil is null unless both struck chain and skeleton were supplied.
 *
 * @evidence contracts/development/design.md#principled-representation suggestCollisionResponse composes resolveImpact, impulseToRecoilPush and optional impactRecoil, keeping material response and clinical pose advice tied to one evaluated collision.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three nested records expose actual stages of the suggestion without adding an imposed simulation state or acceptance policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Recoil direction is the current dominant-flexion magnitude heuristic, not a contact-frame vector solve; downstream authors may accept or override this advice.
 * @evidence contracts/development/common.md#meaningful-documentation Documents advisory ownership, impact/push linkage and exact null recoil condition.
 */
export interface IAutoMovieCollisionResponse {
  /** Resolved normal impulse and qualitative collision advice. */
  impact: IAutoMovieImpact;

  /** Clinical recoil control obtained from impulse magnitude and the caller's gain. */
  push: IAutoMovieRecoilPush;

  /** ROM-bounded flinch pose, or null unless both struck chain and skeleton were supplied. */
  recoil: IAutoMoviePose | null;
}
