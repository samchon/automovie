import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanWeb } from "./IAutoMovieHumanWeb";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * A column down a child: a pinch (the web's margin, the parent's vertex at a
 * web's edge) or a plain column from one vertex of the parent's ring to its
 * child's section.
 */
export type IAutoMovieHumanWebColumn =
  | {
      /** A web's pinch. */
      kind: "pinch";

      /** The parent's ring vertex. */
      v: number;

      /** The web it bounds. */
      web: IAutoMovieHumanWeb;
    }
  | {
      /** A column away from the pinches. */
      kind: "plain";

      /** The parent's ring vertex; -1 for a column of the continuous law between the vertices, read and not meshed. */
      v: number;

      /** Its point on the parent's ring, mm. */
      p: Vec3;

      /** The parent's outward unit direction there. */
      o: Vec3;

      /** Its arrival on the child's section, mm. */
      q: Vec3;

      /** The child's inward unit direction there. */
      d: Vec3;

      /** The parent's station jet at the ring vertex, leaving it. */
      from: IAutoMovieHumanSeam.IArcJet;

      /** The child's station jet at the arrival, entering it. */
      to: IAutoMovieHumanSeam.IArcJet;

      /** Phase of its arrival on the child's section. */
      phi: number;

      /** The web it lies beside. */
      web: IAutoMovieHumanWeb;

      /** Which side of the web it lies, -1 at the first pinch's side. */
      side: number;

      /** Its distance along the ring from the pinch over the margin's radius. */
      y: number;

      /** The margin's radius at its place, mm. */
      rho: number;
    };
