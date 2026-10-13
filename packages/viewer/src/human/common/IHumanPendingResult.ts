/**
 * The settlement callbacks owned by one pending numerical request.
 *
 * @author Samchon
 */
export interface IHumanPendingResult<Output> {
  /** Publish this request's successful value. */
  resolve: (value: Output) => void;

  /** Refuse this request with its numerical or transport failure. */
  reject: (error: Error) => void;
}
