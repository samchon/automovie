import type { IAutoMovieHumanFaceAttachmentPoint } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentPoint";

/** Source material loop convention; not a measured frenulum or hyoid insertion. */
export interface IHumanSourceTongueAttachmentLoop {
  surface: string;
  nativeVertices: number[];
  points: IAutoMovieHumanFaceAttachmentPoint[];
  attachedTriangles: number[];
  attachedSourceVertices: number[];
  frame: "head-metres-y-up-z-anterior";
  qualification: string;
}
