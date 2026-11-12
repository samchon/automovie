import type { IEvidenceClaim } from "@wrtnlabs/evidence";

/**
 * Declares that no narrative layer is checked, for a screenplay no narrative
 * pass writes.
 *
 * @evidence contracts/development/design.md#principled-representation The choice is named by its own mode rather than left to an omitted option, and with an enabled composition stage the code then realizes every instruction section that no narrative layer cites.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mode and additional native claims are the only members; layer stages and scope belong to the narrative routes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No stage or scope field exists, so none can be written and silently ignored.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states when the choice applies and what each member does.
 */
export interface IAutoMovieNoNarrativeProps {
  /** Checks no narrative layer; with an enabled composition stage, the composition and entities must realize every instruction section instead. */
  mode: "none";

  /** Additional native claims for the production's actual respondents. */
  claims?: IEvidenceClaim[];
}
