/** Perspective/frustum audit for the complete compiled opening population. */
import type { IAutoMovieVector3 } from "@automovie/interface";

export interface OpeningFrustumRow {
  id: string;
  kind: string;
  roomView: string;
  roomPosition: IAutoMovieVector3;
  roomTarget: IAutoMovieVector3;
  roomCenterVisible: boolean;
  roomCornersVisible: number;
  exteriorCornersVisible: number | null;
  completeProfileFramed: boolean;
  arrivalCenterVisible: boolean | null;
}

