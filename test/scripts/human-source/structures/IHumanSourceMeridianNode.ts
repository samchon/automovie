import type { IAutoMovieHumanFaceAttachmentPoint } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentPoint";

/** An exact source edge/vertex plane intersection and its actual host seat. */
export interface IHumanSourceMeridianNode {
  point: number[];
  seat: IAutoMovieHumanFaceAttachmentPoint;
  neighbors: Map<string, number>;
}
