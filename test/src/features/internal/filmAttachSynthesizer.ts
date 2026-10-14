import { IAutoMovieActionCall, IAutoMovieMotion } from "@automovie/interface";
import { IAutoMovieActionSynthesizer } from "../../../../packages/engine/src/perform/IAutoMovieActionSynthesizer";
import { validSynthesizer } from "./filmFixtures";
/** Return null for the existing launch/attachTo object-only verbs and delegate other action/actor pairs to validSynthesizer. The attachment test supplies this callback to performShot; no global method, foreign implementation or runtime host is replaced. */
export const filmAttachSynthesizer: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null =>
  action.verb === "launch" || action.verb === "attachTo"
    ? null
    : validSynthesizer(action, actor);
