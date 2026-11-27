

import "../../math/AutoMovieEngineQuaternion";
import "../../math/AutoMovieEngineVector3";


import "./resolvePose";
import { ResolveAttachmentData } from "./ResolveAttachmentData";

export namespace resolveAttachment {
  /*
   * Resolve a child transform from the parent skeleton pose.
   */
  export const run: typeof ResolveAttachmentData.resolveAttachmentRun = ResolveAttachmentData.resolveAttachmentRun;
}
