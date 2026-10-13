import { IAutoMoviePose } from "@automovie/interface";

import { IAutoMovieImpact } from "./IAutoMovieImpact";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * Advisory collision result containing an impact, its scalar impulse-derived recoil push and an optional ROM-bounded flinch pose. Recoil is null unless both struck chain and skeleton were supplied.
 *
 * @evidence contracts/common.md#principled-implementation suggestCollisionResponse composes resolveImpact, impulseToRecoilPush and optional impactRecoil, keeping material response and clinical pose advice tied to one evaluated collision.
 * @evidence contracts/common.md#clear-and-simple-design The three nested records expose actual stages of the suggestion without adding an imposed simulation state or acceptance policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Recoil direction is the current dominant-flexion magnitude heuristic, not a contact-frame vector solve; downstream authors may accept or override this advice.
 * @evidence contracts/common.md#meaningful-documentation Documents advisory ownership, impact/push linkage and exact null recoil condition.
 * @evidence contracts/performance.md#efficient-algorithms The representation has no computation; producing it costs constant impact arithmetic plus the supplied chain's ROM traversal when recoil is requested.
 * @evidence contracts/performance.md#reuse-equivalent-work The single resolved impact's impulse feeds one push and optional recoil solve; consumers reuse the proposal rather than resolving an identical collision again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the suggestion and nested result values; no persistent collision world, rig handle or task is retained.
 * @author Samchon
 */
export interface IAutoMovieCollisionResponse {
  /** Resolved normal impulse and qualitative collision advice. */
  impact: IAutoMovieImpact;

  /** Clinical recoil control obtained from impulse magnitude and the caller's gain. */
  push: IAutoMovieRecoilPush;

  /** ROM-bounded flinch pose, or null unless both struck chain and skeleton were supplied. */
  recoil: IAutoMoviePose | null;
}
