import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import type {
  IAutoMovieDrawScene,
  IAutoMovieInspectionHandle,
} from "@automovie/render";
import type * as THREE from "three";

import type { AutoMovieInspectorBeauty } from "./AutoMovieInspectorBeauty.js";
import type { AutoMovieInspectorPlayhead } from "../AutoMovieInspectorPlayhead.js";
import type { AutoMovieInspectorTransition } from "./AutoMovieInspectorTransition.js";
import type { IAutoMovieInspectorSceneHost } from "../IAutoMovieInspectorSceneHost.js";

/**
 * What an inspector mount holds once its subject is ready: the subject and the
 * resources drawn with, the inspection in force, and the frame loop's state.
 */
export interface IAutoMovieInspectorLive {
  /** The created subject. */
  instance: IAutoMovieDrawScene;

  /** The host's renderer. */
  renderer: IAutoMovieInspectorSceneHost.IRenderer;

  /** The host's renderer as a WebGL one, or null when it is not. */
  compositor: THREE.WebGLRenderer | null;

  /** The beauty picture's film stages. */
  beauty: AutoMovieInspectorBeauty;

  /** A transition's held outgoing shot. */
  transition: AutoMovieInspectorTransition;

  /** The inspection applied to the subject's scene. */
  inspection: IAutoMovieInspectionHandle;

  /** The request that inspection was applied from. */
  applied: IAutoMovieCapturePlanRequest;

  /** The pending animation frame, if one is scheduled. */
  frame: number | undefined;

  /** The previous frame's clock in milliseconds, before the first frame none. */
  lastMs: number | undefined;

  /** The playhead snapshot last drawn. */
  drawn: AutoMovieInspectorPlayhead.ISnapshot | undefined;

  /** The size the renderer was last sized to. */
  size: IAutoMovieInspectorSceneHost.ISize | undefined;

  /** Whether the next frame must redraw though the snapshot did not change. */
  dirty: boolean;

  /** Whether a seek is pending, during which no other draw starts. */
  seeking: boolean;

  /** The drawing error last reported, or null. */
  error: string | null;

  /** Whether labels of a paused picture are on screen. */
  labelled: boolean;
}
