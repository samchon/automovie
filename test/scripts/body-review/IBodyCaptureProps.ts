import type { IHumanViewerClient } from "../human-viewer/IHumanViewerClient";
import type { IBodyObservationFrame } from "./IBodyObservationFrame";

/**
 * Input authority and frame selection for one body capture run. The capture
 * submits documents but never starts or stops the session-owned viewer.
 * @author Samchon
 */
export interface IBodyCaptureProps {
  /** Connected resident viewer providing actual admission and frame responses. */
  viewer: IHumanViewerClient;

  /** Input filename stem shared by this run's file-document addresses. */
  label: string;

  /** Default basis id composed into states that do not declare their own basis. */
  basisId: string;

  /** Explicit candidate path; omission or null makes no candidate copy. */
  candidateBasis?: string | null;

  /** Caller-owned ordered view/pass requests, read without mutation. */
  frames: readonly IBodyObservationFrame[];

  /** Render refusal policy: throw stops, record skips the state's remaining frames; unknown isolated meshes always throw. */
  onRefused: "throw" | "record";
}
