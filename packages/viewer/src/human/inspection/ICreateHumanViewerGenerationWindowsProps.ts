import type { createHumanViewerCompileGate } from "./createHumanViewerCompileGate.js";

/**
 * What the generation windows read and hold.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerGenerationWindowsProps {
  /** The compile gate a window holds. */
  gate: ReturnType<typeof createHumanViewerCompileGate>;

  /** The current source revision. */
  revision: () => string;

  /** Whether an edit batch is still being digested. */
  updating: () => boolean;

  /**
   * Told after a window closed, so documents waiting on its frame are asked again.
   */
  closed: () => void;
}
