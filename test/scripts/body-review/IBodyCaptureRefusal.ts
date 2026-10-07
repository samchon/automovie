/**
 * A requested state refused by the actual viewer; it supplies no drawn frame.
 * @author Samchon
 */
export interface IBodyCaptureRefusal {
  /** Review state whose remaining frames were skipped after the refusal. */
  state: string;

  /** Reported admission or render refusal, retained without reinterpretation. */
  reason: string;
}
