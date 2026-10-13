import type { IBodySimpleBody } from "./IBodySimpleBody";

/**
 * A simple projection in flight for one body.
 *
 * @author Samchon
 */
export interface IBodySimplePending {
  /** The body being projected. */
  shape: IBodySimpleBody;

  /** Settles when the projection is displayed or dropped. */
  result: Promise<void>;
}
