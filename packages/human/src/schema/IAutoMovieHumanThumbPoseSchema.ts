import type { IAutoMovieHumanThumbPose } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanThumbPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanThumbPoseSchema = IAutoMovieHumanThumbPose & {
  /** Carpometacarpal flexion across the palm 15, extension 20 (recalled, Greene and Heckman 1994). */
  cmcFlexion?: number & tags.Minimum<-20> & tags.Maximum<15>;

  /** Carpometacarpal palmar abduction away from the palm, 0 to 60 (AAOS). */
  cmcAbduction?: number & tags.Minimum<0> & tags.Maximum<60>;

  /** Carpometacarpal opposition, axial rotation turning the pad toward the fingers, 0 to 45 (convention). */
  cmcOpposition?: number & tags.Minimum<0> & tags.Maximum<45>;

  /** Metacarpophalangeal flexion, 0 to 50 (AAOS). */
  mcpFlexion?: number & tags.Minimum<0> & tags.Maximum<50>;

  /** Interphalangeal flexion, 0 to 80 (AAOS). */
  ipFlexion?: number & tags.Minimum<0> & tags.Maximum<80>;
};
