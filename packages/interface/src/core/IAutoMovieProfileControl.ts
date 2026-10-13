import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One named control a profile exposes: the abstract handle an LLM or an editor
 * UI drives, mapped onto a concrete channel.
 *
 * No engine, production or viewer code reads controls today. `bindProfile`
 * binds only a profile's limits and drivers, so `default` is never written and
 * a node channel here is not mapped through the binding's `boneMap`; legacy
 * prop conversion (`toEnginePropSpec`) copies the list through unchanged.
 *
 * @author Samchon
 */
export interface IAutoMovieProfileControl {
  /**
   * Semantic control name, e.g. `"leftElbow.flexion"` or `"body.waistWidth"`.
   */
  name: string;

  /** The channel this control writes. */
  channel: IAutoMovieChannel;

  /**
   * Default value, one element per channel component; neither checked against
   * the channel width nor applied by any pass.
   */
  default: number[];

  /**
   * Category this control belongs to (e.g. `"face"`, `"legs"`), or `null`. Lets
   * an editor group controls and reveal detail progressively (beginner mode vs
   * per-part panels) rather than showing hundreds of sliders at once.
   */
  group: string | null;
}
