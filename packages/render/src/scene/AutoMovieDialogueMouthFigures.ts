import type * as THREE from "three";

import type { IAutoMovieDialogueMouthFigure } from "./IAutoMovieDialogueMouthFigure.js";

/**
 * The dialogue-mouth figures bound to scene objects, by the object a figure's
 * representation owns; the draw page reads it under each speaking actor's node.
 * Weak, so a figure lives exactly as long as its object.
 */
export const AutoMovieDialogueMouthFigures: WeakMap<
  THREE.Object3D,
  IAutoMovieDialogueMouthFigure
> = new WeakMap();
