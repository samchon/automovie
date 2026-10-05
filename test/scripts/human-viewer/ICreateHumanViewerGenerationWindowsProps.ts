import type { createHumanViewerCompileGate } from "./createHumanViewerCompileGate";

/**
 * What the generation windows read and hold.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface ICreateHumanViewerGenerationWindowsProps {
  /** The compile gate a window holds. */
  gate: ReturnType<typeof createHumanViewerCompileGate>;

  /** The current source revision. */
  revision: () => string;

  /** Whether an edit batch is still being digested. */
  updating: () => boolean;
}
