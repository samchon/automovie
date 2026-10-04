/**
 * The numerical preview members persisted in the cache: the model and its
 * numerical readings. Display and photograph data are not members, so they
 * cannot reach the disk through this projection.
 *
 * @evidence contracts/common.md#principled-implementation An explicit member list keeps display metadata out of persistence.
 * @evidence contracts/common.md#meaningful-documentation Names every persisted member.
 * @author Samchon
 */
export interface IHumanViewerPreviewProjection {
  /** Always `preview` for a cached result. */
  operation: string;

  /** The numerical model. */
  model?: unknown;

  /** Face articulation reading. */
  articulation?: unknown;

  /** Face contact reading. */
  contact?: unknown;

  /** Surface crossing reading. */
  crossings?: unknown;

  /** Body extras (bones and readings). */
  extras?: unknown;

  /** Body anatomy reading. */
  anatomy?: unknown;
}
