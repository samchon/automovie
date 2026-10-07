import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * The mounted control sections of the person editor, as the panel drives
 * them after a state change.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Redraws the body controls from the displayed person.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Redraws the face controls from the displayed person.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates redrawing controls from re-reading measurements, which only a changed person needs.
 * @author Samchon
 */
export interface IConnectedPersonSections {
  /** Redraw the channel, joint and anatomy controls from the working document. */
  render(): void;

  /** Refill every form and re-read every measurement for a newly displayed person. */
  refresh(displayed: IAutoMovieHumanPersonDocument): void;
}
