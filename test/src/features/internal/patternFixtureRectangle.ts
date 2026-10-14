import type { IAutoMoviePatternPoint } from "@automovie/engine";

/**
 * Author four planar corners from the supplied U/V bounds in metre coordinates.
 *
 * The literal bottom-left, bottom-right, top-right and top-left order lets pattern tests independently calculate rectangle areas and cuts; this builder does not repair inverted or collapsed bounds. Consumers own admission and layout assertions, while this portable helper returns a fresh array and four fresh points without registering a scenario or acquiring a host.
 */
export function patternFixtureRectangle(minU: number, minV: number, maxU: number, maxV: number): IAutoMoviePatternPoint[] {
  return [{ u: minU, v: minV }, { u: maxU, v: minV }, { u: maxU, v: maxV }, { u: minU, v: maxV }];
}
