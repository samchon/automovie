/**
 * The data member delivered by a native worker message callback.
 *
 * @author Samchon
 */
export interface IHumanWorkerMessage<Data> {
  /** Numerical payload delivered by this message. */
  data: Data;
}
