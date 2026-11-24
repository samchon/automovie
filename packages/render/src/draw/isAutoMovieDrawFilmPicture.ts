import type { IAutoMovieDrawCall } from "@automovie/interface";

import { isAutoMoviePlainBeautyRequest } from "./isAutoMoviePlainBeautyRequest.js";

/**
 * Whether a draw call is the film picture: a `beauty` picture or a `graphics`
 * plate that composites its transition's layers and, in `beauty`, accumulates a
 * sampled film's shutter and lens samples.
 *
 * A delivery draw (`inspectionDiagnostics` `"delivery"`) is the film picture,
 * and so is a capture whose request asks for the film picture alone, the plain
 * request `isAutoMoviePlainBeautyRequest` names with the call's shade taken as
 * `beauty`, so the plate of a plain request is the film's too. Such a capture
 * of second `t` shows what the delivered frame at `t` shows. Every other draw,
 * a capture with parts, hiding, marks, a trail, colouring, labels, a section or
 * x-ray, and every structural pass, is one sharp placement at its second, so
 * what it inspects is where the frame's records say it is.
 */
export function isAutoMovieDrawFilmPicture(
  call: Pick<IAutoMovieDrawCall, "request" | "inspectionDiagnostics">,
): boolean {
  const shade: IAutoMovieDrawCall["request"]["shade"] = call.request.shade;
  return (
    (shade === "beauty" || shade === "graphics") &&
    (call.inspectionDiagnostics === "delivery" ||
      isAutoMoviePlainBeautyRequest({ ...call.request, shade: "beauty" }))
  );
}
