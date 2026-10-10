import type { HumanViewerWork } from "./HumanViewerWork";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";

/**
 * Bind one browser lifetime to the host's source and capture owners. Callbacks
 * read their live owners after construction, because GPU observers begin only
 * when the server opens its page.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerResidencyProps {
  /** Public loopback origin the resident browser opens. */
  origin: string;

  /** Complete host inventory, whose revision labels ready generations. */
  inventory: () => IHumanViewerCatalogue;

  /** Republish availability after reload or renderer failure. */
  publish: () => void;

  /** Capture cancellation owner renewed only after physical settlement. */
  lifetime: ReturnType<typeof createHumanViewerCaptureLifetime>;

  /** Report the first opening's startup phases. */
  phase: (name: string) => void;

  /** Forward numerical progress to the running capture stage. */
  progress: () => void;

  /** Sample numerical work through the existing heap gauge. */
  sample: (work: HumanViewerWork) => void;

  /** Announce a proven current-code generation to thumbnail warming. */
  sourceReady: (revision: string) => void;

  /** Reconsider pending admissions after a frame or generation becomes ready. */
  retryAdmissions: (trigger: string) => void;
}
