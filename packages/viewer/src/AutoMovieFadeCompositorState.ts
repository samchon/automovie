import * as THREE from "three";
import { AutoMovieDisplayCompositor } from "./AutoMovieDisplayCompositor.js";

/** Per-renderer fade ownership, shared only by its draw and release operations. */
export const AutoMovieFadeCompositorState = new WeakMap<THREE.WebGLRenderer, AutoMovieDisplayCompositor>();
