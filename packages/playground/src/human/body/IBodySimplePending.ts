import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * A simple projection in flight for one body.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Lets a repeated refresh of the same body share one projection.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Correlates a pending projection with its body.
 * @author Samchon
 */
export interface IBodySimplePending {
  /** The body being projected. */
  shape: IBodySimpleBody;

  /** Settles when the projection is displayed or dropped. */
  result: Promise<void>;
}
