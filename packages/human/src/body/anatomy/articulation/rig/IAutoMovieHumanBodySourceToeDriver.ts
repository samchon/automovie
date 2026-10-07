import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";

/** One existing canonical toe-ray motion addresses a source-owned anatomical phalanx axis. */
export interface IAutoMovieHumanBodySourceToeDriver {
  /** Existing per-ray document goal, evaluated in the same anatomical graph as toe geometry. */
  kind: "public-toe";
  /** Actual closed source ray identity, independent of the anatomical bone's FMA identity. */
  bone: AutoMovieHumanBodyToeBone;
  /** Flexion toward the sole or proximal lateral splay; source axes/profile preserve its existing sign. */
  axis: "flexion" | "abduction";
  /** Source neutral in degrees used when this coordinate is omitted. */
  neutral: number;
  /** Public toe poses and these driver coordinates use degrees. */
  unit: "degrees";
}
