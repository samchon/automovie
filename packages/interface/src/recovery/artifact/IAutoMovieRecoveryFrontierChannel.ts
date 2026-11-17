import type { IAutoMovieRecoveryArrayFragment } from "../../index";

/**
 * Ordered fragment bindings for one persisted generating channel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explicit generating channel name. Total committed item population.
 * @evidence contracts/development/design.md#principled-representation Ordered fragment bindings for one persisted generating channel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryMeshFrontier share IAutoMovieRecoveryFrontierChannel's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryFrontierChannel {
  /** Explicit generating channel name. */
  name: string;

  /** Total committed item population. */
  items: number;

  /** Ordered immutable fragments for this channel. */
  files: IAutoMovieRecoveryArrayFragment[];
}
