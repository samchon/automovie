import type { IAutoMovieHumanKneePose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanKneePose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanKneePoseSchema = IAutoMovieHumanKneePose & {
  /** Flexion 139.8, hyperextension 1.3 (measured). */
  flexion?: number & tags.Minimum<-1.3> & tags.Maximum<139.8>;

  /**
   * Tibial rotation, external 35 and internal 25 (convention). It exists only with the knee bent: the stickman scales the range by flexion / 90, so a straight knee does not rotate.
   */
  rotation?: number & tags.Minimum<-25> & tags.Maximum<35>;
};
