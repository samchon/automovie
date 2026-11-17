/**
 * One named boundary publication from an owner region/node to a consumer region/node. All keys are caller-defined; the engine gives them no anatomical interpretation.
 *
 * @evidence contracts/development/design.md#principled-representation The complete owner and consumer pair defines the binding authorization checked by the context.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One edge record keeps routing identity beside its boundary key.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No region or bone name is special-cased as an approved anatomical connection.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the caller-owned meaning of keys and both authorization endpoints.
 */
export interface IAutoMovieCurveBoundaryEdge64 {
  /** Stable declared boundary or node identity, not a selector for a body catalogue. */
  id: string;

  /** Caller-defined owner key; only this factory may publish the declared boundary. */
  ownerRegion: string;

  /** Caller-defined owner node key in the proper parent hierarchy; anatomy is defined by Human rather than engine. */
  ownerBone: string;

  /** Caller-defined dependent key; its construction receives the actual published value. */
  consumerRegion: string;

  /** Caller-defined receiving node key whose binding is authenticated by this edge. */
  consumerBone: string;
}
