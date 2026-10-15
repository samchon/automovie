import type { IAutoMovieVector3 } from "@automovie/interface";

/** The design's grain direction is local, so a door rotation rotates its grain.
 * Cabinet horizontal shelves choose their long axis, while jambs and leaves
 * keep Y. Board and stair end faces are partitioned by the assembly consumer. */

export function woodGrainAxis(role: string, host: string, scale: IAutoMovieVector3): "x" | "y" | "z" {
  if (role === "oak-floor") return "z";
  if (role === "oak-stair") return host.includes("landing") ? "z" : "x";
  if (role === "oak-joinery") {
    if (/(head|threshold|shelf|top)/.test(host)) return scale.x >= scale.z ? "x" : "z";
    if (host.includes("back")) return scale.y >= scale.x ? "y" : "x";
    return "y";
  }
  if (/head|leg|support-(left|right)/.test(host)) return "y";
  return scale.x >= scale.z ? "x" : "z";
}
