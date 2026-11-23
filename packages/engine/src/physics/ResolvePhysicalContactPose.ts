import type { IPhysicalContactPoseReference } from "./IPhysicalContactPoseReference";

/** Resolve a scene body and its local bone once when preparing its row. */
export type ResolvePhysicalContactPose = (
  body: string,
  bone: string,
) => IPhysicalContactPoseReference;
