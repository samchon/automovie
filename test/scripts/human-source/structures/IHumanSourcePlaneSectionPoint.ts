import type { IAutoMovieHumanFaceAttachmentPoint } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentPoint";

/** Exact material crossing of a canonical native edge with a declared plane. */
export interface IHumanSourcePlaneSectionPoint {
  edge: [number, number];
  t: number;
  point: number[];
  seat: IAutoMovieHumanFaceAttachmentPoint;
}
