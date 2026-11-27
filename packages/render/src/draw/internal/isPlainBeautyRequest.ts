import type { IAutoMovieInspectionRequest } from "@automovie/interface";

/*
 * Whether an inspection request asks for the film picture alone: the `beauty`
 * shade with no part selection, hiding, marks, trail, colouring, labels,
 * section or x-ray.
 *
 * Such a capture shows what the delivered frame shows, so the draw host gives
 * it a sampled film's shutter and lens samples as it does a delivery draw.
 */
export function isPlainBeautyRequest(
  request: IAutoMovieInspectionRequest,
): boolean {
  return (
    request.shade === "beauty" &&
    request.parts.length === 0 &&
    request.hide.length === 0 &&
    request.marks.length === 0 &&
    request.trail.length === 0 &&
    request.color.length === 0 &&
    request.label.length === 0 &&
    request.section === null &&
    !request.xray
  );
}
