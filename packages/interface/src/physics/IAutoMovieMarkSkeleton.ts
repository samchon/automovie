import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePhysicsCache } from "./IAutoMoviePhysicsCache";

/** Profile topology and cached world poses used to build skeleton inspection marks. */
export namespace IAutoMovieMarkSkeleton {
  /**
   * Physical profiles and one cached world pose to turn into skeleton inspection marks.
   *
   * Body ids resolve into frame.bodies; profile joints connect parent and child bone origins, and profile segments supply joint-point marks in world metres. markAutoMovieSkeleton borrows profiles and the frame and allocates detached mark coordinate arrays in body, joint and segment order. A missing named frame segment throws with body and bone identity; an empty body list returns no marks. Profiles provide topology, not a second pose source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Physical profiles and one cached world pose to turn into skeleton inspection marks.
   * @evidence contracts/development/design.md#principled-representation Body ids resolve into frame.bodies; profile joints connect parent and child bone origins, and profile segments supply joint-point marks in world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface markAutoMovieSkeleton borrows profiles and the frame and allocates detached mark coordinate arrays in body, joint and segment order.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing named frame segment throws with body and bone identity; an empty body list returns no marks. Profiles provide topology, not a second pose source.
   */
  export type IProps = {
    /** Borrowed scene bodies in output order; each profile supplies the skeleton topology. */
    bodies: readonly {
      /** Scene body key required in frame.bodies. */
      id: string;

      /** Admitted physical segments and joints whose bone origins are drawn. */
      profile: IAutoMoviePhysicalProfile;
    }[];

    /** Borrowed cached or interpolated pose at the inspected film second; every named segment must be present. */
    frame: IAutoMoviePhysicsCache.IFrame;
  };
}
