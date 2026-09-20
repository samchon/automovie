import { IAutoMovieShotContract } from "../production/IAutoMovieShotContract";

/**
 * Contract fields embedded in a shot registration rather than its source
 * pointer.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `IAutoMovieDefinedShotContract` as the portable data boundary for the agent ordinary code authoring requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `IAutoMovieDefinedShotContract` for the spec authoring source input system contract.
 */
export type IAutoMovieDefinedShotContract = Omit<
  IAutoMovieShotContract,
  "id" | "source"
>;
