/**
 * One named boundary publication from an owner region/node to a consumer
 * region/node. All keys are caller-defined; the engine gives them no anatomical
 * interpretation.
 */
export interface IAutoMovieCurveBoundaryEdge64 {
  /**
   * Stable declared boundary or node identity, not a selector for a body
   * catalogue.
   */
  id: string;

  /**
   * Caller-defined owner key; only this factory may publish the declared
   * boundary.
   */
  ownerRegion: string;

  /**
   * Caller-defined owner node key in the proper parent hierarchy; anatomy is
   * defined by Human rather than engine.
   */
  ownerBone: string;

  /**
   * Caller-defined dependent key; its construction receives the actual
   * published value.
   */
  consumerRegion: string;

  /**
   * Caller-defined receiving node key whose binding is authenticated by this
   * edge.
   */
  consumerBone: string;
}
