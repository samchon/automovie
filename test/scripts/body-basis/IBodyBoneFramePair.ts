import type { IBodyBoneWorldFrame } from "./IBodyBoneWorldFrame";

/** The same bone rest/posed world frames retained by the actual builder. */
export interface IBodyBoneFramePair {
  rest: IBodyBoneWorldFrame;
  posed: IBodyBoneWorldFrame;
}
