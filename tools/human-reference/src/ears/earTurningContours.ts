import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { V3 } from "../geometry/V3.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";
import { isoContour } from "../headneck/isoContour.ts";
import type { FeatureLoop } from "../schema/FeatureLoop.ts";
import { orientLoop } from "../schema/orientLoop.ts";

/**
 * Keeps open and closed turning contours of the admitted source normal field
 * under lateral and two oblique directions. These are geometric observation
 * curves, not helix crests, insertion lines or certified anatomical borders.
 *
 * @evidence contracts/common.md#principled-implementation Zero contours of the source outward normal dot each declared direction identify view-dependent turning walls; source-triangle interpolation preserves their geometric witnesses.
 * @evidence contracts/common.md#clear-and-simple-design All three diagnostic directions share one scope and centre, while every connected contour remains independently represented.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The oblique directions and two-millimetre fragment cutoff are one declared diagnostic protocol; no source identity or expected anatomical loop count is selected.
 * @evidence contracts/common.md#meaningful-documentation The contract explains source-normal dependence, open arcs, diagnostic directions and unresolved anatomical identity.
 * @evidence contracts/performance.md#efficient-algorithms Three V-length scalar fields and three O(V+T) contour extractions scan the admitted source; fragment length uses each observed edge once.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared head context supplies one immutable source normal field and skin; each direction owns its distinct scalar field without a stale cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar fields and intersection graphs are invocation-local; returned contour points transfer to the regional observation owner.
 */
export function earTurningContours(
  context: HeadContext,
  influence: Float64Array,
  side: "l" | "r",
  centre: V3,
): FeatureLoop[] {
  if (
    influence.length !== context.s.vertices.length ||
    context.vn.length !== context.s.vertices.length
  )
    throw new Error(
      "Ear turning fields must match the admitted source skin vertices",
    );
  const sign: number = side === "l" ? 1 : -1;
  const output: FeatureLoop[] = [];
  for (const [name, direction] of [
    ["lateral", [sign, 0, 0]],
    ["front-oblique", norm([sign, 0, 1])],
    ["rear-oblique", norm([sign, 0, -1])],
  ] as [string, V3][]) {
    const field: Float64Array = Float64Array.from(
      context.vn,
      (normal: V3, i: number): number =>
        influence[i] > 0.01 ? dot(normal, direction) : NaN,
    );
    const polylines: Polyline[] = isoContour(context.s, field, 0);
    const frame: Plane = planeFrame(centre, direction, [0, 1, 0]);
    let index: number = 0;
    for (const polyline of polylines) {
      if (polyline.pts.length < 4) continue;
      let length: number = 0;
      for (
        let i: number = 0;
        i < polyline.pts.length - (polyline.closed ? 0 : 1);
        i++
      )
        length += dist(
          polyline.pts[i].p,
          polyline.pts[(i + 1) % polyline.pts.length].p,
        );
      if (length < 2) continue;
      output.push({
        id: `ear-${side}.view-turn.${name}.${++index}`,
        name: `${name} normal turning contour ${index}`,
        kind: "contour-generator",
        side,
        pose: "native-A",
        closed: polyline.closed,
        frame: { origin: centre, normal: frame.n, u: frame.u, v: frame.v },
        method:
          "Zero contour of linearly interpolated source outward vertex-normal dot viewing direction. Open support endpoints and distinct connected contours remain explicit; this is not an anatomical rim or insertion.",
        confidence: "medium",
        points: orientLoop(
          frame,
          polyline,
          polyline.closed ? "selected" : "clipped-arc",
        ).points,
      });
    }
  }
  return output;
}
