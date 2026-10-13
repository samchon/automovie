import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The mounted control sections of the person editor, as the panel drives
 * them after a state change.
 *
 * @author Samchon
 */
export interface IConnectedPersonSections {
  /** Redraw the channel, joint and anatomy controls from the working document. */
  render(): void;

  /** Refill every form and re-read every measurement for a newly displayed person. */
  refresh(displayed: IAutoMovieHumanPersonDocument): void;
}
