import type { IAutoMovieRandom } from "@automovie/engine";
import type { AutoMovieMotionTarget, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanSkill } from "../skill/HumanSkill";
import type { IHumanEntryState } from "./IHumanEntryState";

/**
 * Everything one action instance plans from: whose body, with which
 * parameters and skill, entered from which state, at which film second, and
 * how to find its targets and its seeded draws.
 *
 * `start` is the film second of the action's own time zero; an action entered
 * at a later share of itself (a redirect continuing its family's clock) starts
 * before its entry. `aim` resolves a target to a world point and outward
 * normal at a film second: a person's region on that person's displayed body,
 * a prop's named point, a free point, or the virtual opponent of `none`.
 * `random` returns the stream of one channel of this instance, keyed by the
 * chain seed, the subject, the action's id and its instance.
 */
export interface IHumanActionContext<P = object> {
  /** The performer's subject id. */
  subject: string;

  /** The performer's body. */
  body: IHumanBody;

  /** The action's parameters. */
  params: P;

  /** The performer's resolved skill. */
  skill: HumanSkill.ISkill;

  /** The state the action is entered from. */
  entry: IHumanEntryState;

  /** Film second of the action's time zero. */
  start: number;

  /**
   * A target's world point and outward unit normal at a film second.
   *
   * @param target The target.
   * @param seconds Film seconds.
   * @returns The aim.
   */
  aim(target: AutoMovieMotionTarget, seconds: number): { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

  /**
   * This instance's draw stream for one channel.
   *
   * @param channel The quantity drawn.
   * @returns The stream.
   */
  random(channel: string): IAutoMovieRandom;
}
