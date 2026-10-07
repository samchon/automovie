import type { IServeHumanViewerCaptureProps } from "./IServeHumanViewerCaptureProps";
import type { IServeHumanViewerDataProps } from "./IServeHumanViewerDataProps";
import type { IServeHumanViewerGenerationProps } from "./IServeHumanViewerGenerationProps";
import type { IServeHumanViewerHeapProps } from "./IServeHumanViewerHeapProps";
import type { assembleHumanViewerHealth } from "./assembleHumanViewerHealth";

/** Request-independent host bindings for the loopback HTTP routes. @author Samchon */
export interface ICreateHumanViewerMiddlewareProps {
  /** Selected service origin used to parse relative requests. */
  origin: string;

  /** Live health from its existing state owners. */
  health: () => ReturnType<typeof assembleHumanViewerHealth>;

  /** Source-window authority. */
  generation: Omit<IServeHumanViewerGenerationProps, "url" | "response" | "json">;

  /** Independent heap readings. */
  heap: Omit<IServeHumanViewerHeapProps, "response" | "json">;

  /** Fresh complete catalogue and input authority at request time. */
  data: () => Omit<IServeHumanViewerDataProps, "url" | "request" | "response" | "json">;

  /** Existing serialized GPU capture authority. */
  capture: Omit<IServeHumanViewerCaptureProps, "url" | "request" | "response" | "json">;
}
