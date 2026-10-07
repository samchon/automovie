/**
 * The current viewer source and body against which an observation is judged.
 * @author Samchon
 */
export interface IBodyObservationSource {
  /** Current viewer's source digest, in the same identity scheme as the capture response. */
  revision: string;

  /** Current numerical body basis identity. */
  basisId: string;
}
