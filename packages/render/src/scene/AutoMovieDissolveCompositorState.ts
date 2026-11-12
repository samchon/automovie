import * as THREE from "three";

import { AutoMovieDisplayCompositor } from "./AutoMovieDisplayCompositor.js";

/** Per-renderer dissolve ownership, shared only by its draw and release operations. */
export const AutoMovieDissolveCompositorState = new WeakMap<
  THREE.WebGLRenderer,
  AutoMovieDisplayCompositor
>();
