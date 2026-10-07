import type { IHumanShotHealth } from "./IHumanShotHealth";

/**
 * One `/health` probe of a viewer port.
 *
 * @evidence contracts/common.md#principled-implementation Keeps an answering, an absent and an unanswered port apart.
 * @evidence contracts/common.md#meaningful-documentation States each health value's meaning.
 * @author Samchon
 */
export interface IHumanViewerProbe {
  /** The answer; null when the connection was refused, undefined when nothing complete answered. */
  health: IHumanShotHealth | null | undefined;

  /** Why no complete answer arrived, empty when one did. */
  failure: string;
}
