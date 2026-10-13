/**
 * How a generation-change retry waits and how often it tries.
 *
 * @author Samchon
 */
export interface IRetryAcrossHumanViewerGenerationProps {
  /** Waits until a source generation can draw again. */
  settle: () => Promise<void>;

  /**
   * Total attempts, the first included; the last refusal is returned after them.
   */
  attempts: number;
}
