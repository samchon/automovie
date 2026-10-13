import { IAutoMovieChannel } from "./IAutoMovieChannel";

/**
 * One named control a profile exposes: the abstract handle an LLM or an editor
 * UI drives, mapped onto a concrete channel.
 */
export interface IAutoMovieProfileControl {
  /**
   * Semantic control name, e.g. `"leftElbow.flexion"` or `"body.waistWidth"`.
   */
  name: string;

  /** The channel this control writes. */
  channel: IAutoMovieChannel;

  /** Default value, one element per channel component. */
  default: number[];

  /**
   * Category this control belongs to (e.g. `"face"`, `"legs"`), or `null`. Lets
   * an editor group controls and reveal detail progressively (beginner mode vs
   * per-part panels) rather than showing hundreds of sliders at once.
   */
  group: string | null;
}
