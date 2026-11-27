import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";

/*
 * The shared contacts of a small flat tabletop prop that rests on, and stacks
 * on, another: a playing card, a gaming chip, a banknote or a die.
 *
 * The prop's origin is the centre of its underside, `+Y` up. Its `base` socket
 * is that origin, laid on another prop's `top` or a board square to place it;
 * its `top` socket is the centre of its upper face, where the next prop of a
 * stack mounts; its `grip` is a precision pinch from above at the upper face,
 * the fingertips closing across the given aperture.
 */
export namespace TabletopStack {
  /** The contact ids every stackable tabletop prop builds. */
  export type Contact = "grip" | "base" | "top";

  /*
   * Lay the pinch and the two stacking sockets.
   * Parameter builder: The prop under construction.
   * Parameter height: The prop's height from its underside to its upper face,
   * metres.
   * Parameter aperture: The width the fingertips close across, metres.
   */
  export function contacts<Id extends string, D extends string>(
    builder: AutoMovieArchetypeBuilder<Contact | Id, D>,
    height: number,
    aperture: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, height, 0),
        v(0, 1, 0),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture,
      length: aperture,
    });
    builder.affordance({
      id: "base",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0, 0, 0)),
      extent: null,
    });
    builder.affordance({
      id: "top",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0, height, 0)),
      extent: null,
    });
  }
}
