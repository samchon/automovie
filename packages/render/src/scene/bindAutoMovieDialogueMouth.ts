import type * as THREE from "three";

import { AutoMovieDialogueMouthFigures } from "./AutoMovieDialogueMouthFigures.js";
import type { IAutoMovieDialogueMouthFigure } from "./IAutoMovieDialogueMouthFigure.js";

/**
 * Bind a figure's dialogue mouth to the object its representation owns, so the
 * draw page shows a speaking actor's mouth on it.
 *
 * The page looks for bound objects under the actor's scene node, the object
 * named by the speaker binding's `actor`, after every placement it draws.
 * `AutoMoviePlayer` and `createAutoMovieHumanPolygonFigure` bind their own
 * objects; call this for any other representation. A later binding of the same
 * object replaces the earlier one.
 *
 * @param object The figure's own root object, placed under the actor's node.
 * @param figure How the figure shows a mouth.
 */
export function bindAutoMovieDialogueMouth(
  object: THREE.Object3D,
  figure: IAutoMovieDialogueMouthFigure,
): void {
  AutoMovieDialogueMouthFigures.set(object, figure);
}
