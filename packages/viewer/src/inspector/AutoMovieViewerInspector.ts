import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import type { IAutoMovieDrawSubject } from "@automovie/render";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorProps } from "./IAutoMovieInspectorProps.js";
import type { IAutoMovieInspectorScene } from "./IAutoMovieInspectorScene.js";
import type { IAutoMovieInspectorSceneHost } from "./IAutoMovieInspectorSceneHost.js";
import { mountAutoMovieInspectorPage } from "./internal/mountAutoMovieInspectorPage.js";
import { mountAutoMovieInspectorScene } from "./internal/mountAutoMovieInspectorScene.js";

/**
 * Owns the imperative entry points for the Viewer inspector.
 *
 * `mountPage` mounts the existing React inspector as a complete page and
 * returns its unmount operation. `mountScene` mounts one subject on a host
 * canvas and returns the controls used by the React component. Hosts should
 * use `mountPage`; React applications that want their own controls can render
 * `AutoMovieInspector` directly.
 */
export namespace AutoMovieViewerInspector {
  /** Inputs the host supplies to mount the complete inspector page. */
  export interface IPageProps {
    /** The element the page renders into. */
    root: Element;
    /** The subjects offered by name; keep each subject identity stable. */
    subjects: Readonly<Record<string, IAutoMovieDrawSubject>>;
    /** The page location; its query initializes the request. */
    location: Pick<Location, "pathname" | "search" | "hash">;
    /** The page history, whose current entry follows the request. */
    history: Pick<History, "replaceState" | "state">;
    /** Executable and fixed capture arguments from the host, when available. */
    captureCommand?: IAutoMovieInspectorProps["captureCommand"];
  }

  /** Inputs the React inspector supplies to mount one subject scene. */
  export interface ISceneProps {
    /** The subject to build. */
    subject: IAutoMovieDrawSubject;
    /** The subject name used by the request and refusal reports. */
    name: string;
    /** The request in force when mounting starts. */
    request: IAutoMovieCapturePlanRequest;
    /** The playhead borrowed for the mount's lifetime. */
    playhead: AutoMovieInspectorPlayhead;
    /** Renderer, frame clock and size supplied by the host. */
    host: IAutoMovieInspectorSceneHost;
    /** Receives facts, labels, errors, refusals and diagnostics. */
    report: IAutoMovieInspectorScene.IReport;
  }

  /** Handle returned by `mountPage`, used to release the React root. */
  export interface IPageHandle {
    /** Unmount the page and release everything it holds. */
    unmount(): void;
  }

  /**
   * Mount the React inspector page, initialized from the supplied address and
   * keeping its query synchronized through the supplied history.
   *
   * The host owns the root element, subject record, location and history. The
   * address writer preserves the path, fragment and current history state.
   * Unmounting releases the component's scene and renderer through its effect
   * cleanup; React StrictMode may mount, clean up and mount that scene again.
   *
   * @param props Page root, named subjects, location, history and optional capture command.
   * @returns An idempotent React root unmount operation.
   */
  export function mountPage(props: IPageProps): IPageHandle {
    return mountAutoMovieInspectorPage(props);
  }

  /**
   * Mount one subject's scene for the inspector component.
   *
   * The subject is created asynchronously. Applying a refused request keeps
   * the last accepted request drawn and reports the refusal. Disposing cancels
   * the pending frame, restores inspection changes and releases the renderer
   * and instance; an instance arriving after disposal is released immediately.
   * Calls to `dispose` are safe to repeat.
   *
   * @param props Subject identity, name, initial request, borrowed playhead, host and report callbacks.
   * @returns The mounted scene's apply, overlay and dispose controls.
   */
  export function mountScene(props: ISceneProps): IAutoMovieInspectorScene {
    return mountAutoMovieInspectorScene(props);
  }
}
