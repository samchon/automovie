import type { IAutoMovieVector3 } from "@automovie/interface";

/** Frustum verdict for one compiled opening against its observation poses. */
export interface OpeningFrustumRow {
  /** Opening identity. */
  id: string;
  /** Opening kind, such as door or window. */
  kind: string;
  /** Identity of the room-side station facing the opening. */
  roomView: string;
  /** Eye of the room-side station. */
  roomPosition: IAutoMovieVector3;
  /** Target of the room-side station. */
  roomTarget: IAutoMovieVector3;
  /** Whether the opening's centre lies in the room-side frustum. */
  roomCenterVisible: boolean;
  /** Profile corners inside the room-side frustum. */
  roomCornersVisible: number;
  /** Profile corners inside the exterior station's frustum, or null without an exterior station. */
  exteriorCornersVisible: number | null;
  /** Whether one of the two stations frames every profile corner. */
  completeProfileFramed: boolean;
  /**
   * For a window, whether its sanctuary threshold station sees the centre; null otherwise or
   * without a pose.
   */
  arrivalCenterVisible: boolean | null;
}

