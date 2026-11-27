

import "../../math/Quaternion";
import "../../math/Vector3";


import "./resolvePose";
import * as ResolveAttachmentData from "./ResolveAttachmentData";

export namespace resolveAttachment {
  /*
   * Resolve a child transform from the parent skeleton pose.
   */
  export const run: typeof ResolveAttachmentData.resolveAttachmentRun = ResolveAttachmentData.resolveAttachmentRun;
}
