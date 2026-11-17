import type { IAutoMovieHumanJawPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanJawPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanJawPoseSchema = IAutoMovieHumanJawPose & {
  /** Interincisal opening, from 0 (closed) to 52.9 mm maximal active opening. */
  opening?: number & tags.Minimum<0> & tags.Maximum<52.9>;

  /** Protrusion of the lower incisors forward from rest, 0 to 8.5 mm. */
  protrusion?: number & tags.Minimum<0> & tags.Maximum<8.5>;

  /** Lateral excursion of the lower incisors: positive toward the person's left, 10.35 mm each way. */
  lateralExcursion?: number & tags.Minimum<-10.35> & tags.Maximum<10.35>;
};
