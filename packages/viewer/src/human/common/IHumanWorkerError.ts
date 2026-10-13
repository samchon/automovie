/**
 * A normalized native worker failure delivered to the request owner.
 *
 * @author Samchon
 */
export interface IHumanWorkerError {
  /** Available native failure reason, or the transport's domain fallback. */
  message: string;
}
