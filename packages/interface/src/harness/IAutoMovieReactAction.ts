import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * React to being struck: the engine resolves the impact (`resolveImpact`) and
 * the ROM-bounded flinch/knock-back (`impactRecoil`). Usually emitted by the
 * engine from a {@link IAutoMovieLaunchAction}'s `onHit`; author it directly for
 * a melee blow whose timing you control.
 */
export interface IAutoMovieReactAction extends IAutoMovieActionBase {
  /** Selects an impact reaction as the action family. */
  verb: "react";

  /** Where the blow comes from. */
  from: IAutoMovieActionTarget;

  /** Force `[0,1]` (a graze vs. a knockout); the engine scales the impulse. */
  force: number;

  /** If it unseats/floors the actor (drives a fall within ROM + balance). */
  unbalance?: boolean;
}
