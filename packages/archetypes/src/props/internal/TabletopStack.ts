import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core";

/** Places shared grip and stacking frames on small tabletop objects. */
export namespace TabletopStack {
  /** Precision `grip`, underside `base` socket and upper `top` socket. */
  export type Contact = "grip" | "base" | "top";

  /**
   * Add the stacking and pickup frames on a prop centred at its underside.
   *
   * The two sockets face up at Y zero and the model's full height. The
   * precision pinch is centred on the upper face.
   *
   * @param builder The tabletop prop whose underside is the origin.
   * @param height Height of its upper face above the underside, in metres.
   * @param aperture Width the fingertips close across, in metres.
   */
  export function contacts<Id extends string, D extends string>(
    builder: AutoMovieArchetypeBuilder<Contact | Id, D>,
    height: number,
    aperture: number,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
