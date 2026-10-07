import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceAxis } from "./AutoMovieHumanBodySourceAxis";

/** A named anatomical coordinate drives one source-owned joint axis. */
export interface IAutoMovieHumanBodySourceAnatomicalDriver {
  /** A canonical anatomicalMotion coordinate is the source axis's sole authored driver. */
  kind: "anatomical";

  /** Actual closed anatomical bone owning the named driver coordinate. */
  bone: AutoMovieHumanBodyBoneId;

  /** Source-defined physiological coordinate; its source axis owns direction, neutral and support. */
  axis: AutoMovieHumanBodySourceAxis;

  /** Source neutral retained when no goal for this coordinate is authored. */
  neutral: number;

  /** Source unit matched by the public goal and any mapping profile. */
  unit: "degrees" | "metres";
}
