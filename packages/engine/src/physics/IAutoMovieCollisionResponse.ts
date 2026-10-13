import { IAutoMoviePose } from "@automovie/interface";

import { IAutoMovieImpact } from "./IAutoMovieImpact";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * A suggested collision response: the abstracted {@link IAutoMovieImpact}, the
 * {@link IAutoMovieRecoilPush} its impulse maps to, and (when a struck chain is
 * given) the ROM-bounded flinch {@link IAutoMoviePose}. It is advice an agent
 * can accept, not an imposed result (see D010): a warning carries this so the
 * model can adopt the plausible bounce or override it as intentional.
 *
 * @author Samchon
 */
export interface IAutoMovieCollisionResponse {
  /** The resolved impact between the two bodies. */
  impact: IAutoMovieImpact;
  /** The recoil deflection its impulse maps to. */
  push: IAutoMovieRecoilPush;
  /** The ROM-bounded flinch pose, or `null` when no struck chain was given. */
  recoil: IAutoMoviePose | null;
}
