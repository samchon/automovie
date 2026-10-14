import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanHeadCircumferenceMeasurement } from "./IAutoMovieHumanHeadCircumferenceMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { findHumanOpisthocranion } from "./findHumanOpisthocranion";
import { humanHeadEar } from "./humanHeadEar";
import { humanHeadPoint } from "./humanHeadPoint";
import { measureHumanSection } from "./measureHumanSection";

/**
 * Read head circumference on a head view at rest: the tape girth of the
 * closed section on a plane through the rule's glabella, level from side to
 * side, as near the plane through the opisthocranion
 * (`findHumanOpisthocranion`) as the protocol's two conditions allow.
 *
 * Every plane considered is parallel to the X direction, so it tilts front to back but
 * not to either side. ANSUR II 6.4.47 adds that the tape's plane is "higher in
 * front than it is in the back" and passes "above the attachment of the ears".
 * The plane through the selected opisthocranion follows the farthest admitted
 * midsagittal edge crossing; where it would rise behind the glabella it is held level, and where it
 * would cut the selected ear triangles it is raised at the back until all
 * three corners of every triangle touching either named ear area are clear.
 * This includes corners outside the named vertex area and is a source-mesh
 * clearance convention, not a measured anatomical ear-attachment boundary.
 * The girth is the convex hull perimeter of the closed loop nearest the
 * plane's midline between the glabella and its back point
 * (`measureHumanSection`), the tape a body girth reads. An ear in front of
 * the glabella or above its level, or a plane that closes no loop, refuses by
 * name. The reading's points include `ear-clearance` when the ears set the
 * plane.
 *
 * @evidence contracts/common.md#principled-implementation Glabella and the bounded midsagittal maximum define a side-level plane; ear-touching corners constrain its slope, and the nearest closed section's convex-hull perimeter supplies girth. This source-mesh clearance is distinct from a clinical attachment boundary.
 * @evidence contracts/common.md#clear-and-simple-design The reader owns tape-plane/seed choice and unit normal construction; shared landmark, ear, extremum and section owners retain their independent responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected circumference, ear proxy or arbitrary plane offset substitutes an unavailable section; invalid anterior/above-glabella ear clearance refuses.
 * @evidence contracts/common.md#meaningful-documentation The prose gives tilt restrictions, all-corner ear population, source approximation, seed/convex-hull tape semantics and named clearance/loop failures.
 * @evidence contracts/performance.md#efficient-algorithms Ear and midsagittal scans scale with T triangles and R memberships; the section additionally owns vertex distance storage and candidate-loop hull O(sum L log L) sorts, so total cost is not purely linear.
 * @evidence contracts/performance.md#reuse-equivalent-work Glabella/opisthocranion and the evolving slope are reused across the selected corners, while each ear reader supplies its canonical population; no result cache equates changed rest skin.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Ear sets, section graph/hulls and candidate plane data are synchronous call-local state; the reading transfers a few marker vectors and girth without retaining source buffers or tasks.
 */
export function readHumanHeadCircumference(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadCircumferenceMeasurement,
): IAutoMovieHumanHeadReading {
  const glabella: IAutoMovieVector3 = humanHeadPoint(head, rule.glabella);
  const opisthocranion: IAutoMovieVector3 = findHumanOpisthocranion(
    head,
    glabella,
    humanHeadPoint(head, rule.tragion).y,
  );
  // The plane y = glabella.y + slope * (z - glabella.z) is parallel to X; a positive slope lowers it at the back.
  const slopeTo: (point: IAutoMovieVector3) => number = (point: IAutoMovieVector3): number =>
    (glabella.y - point.y) / (glabella.z - point.z);
  // the tape is not lower in front than at the back: a plane that would rise behind is held level
  let slope: number = Math.max(0, slopeTo(opisthocranion));
  let clearance: IAutoMovieVector3 | undefined;
  for (const name of [rule.rightEar, rule.leftEar])
    for (const t of humanHeadEar(head, name).triangles)
      for (let k: number = 0; k < 3; k++) {
        const v: number = head.indices[t * 3 + k];
        const point: IAutoMovieVector3 = {
          x: head.positions[v * 3],
          y: head.positions[v * 3 + 1],
          z: head.positions[v * 3 + 2],
        };
        if (!(point.z < glabella.z))
          throw new Error(
            `The ear ${name} of ${head.id} reaches in front of the glabella.`,
          );
        if (slopeTo(point) < slope) {
          if (slopeTo(point) < 0)
            throw new Error(
              `The ear ${name} of ${head.id} rises above the glabella, so no tape passes above it level in front.`,
            );
          slope = slopeTo(point);
          clearance = point;
        }
      }
  const size: number = Math.hypot(1, slope);
  const plane: Parameters<typeof measureHumanSection>[2] = {
    point: glabella,
    normal: { x: 0, y: 1 / size, z: -slope / size },
  };
  const back: IAutoMovieVector3 = clearance ?? opisthocranion;
  const section: ReturnType<typeof measureHumanSection> = measureHumanSection(head.positions, head.indices, plane, {
    x: glabella.x,
    y: (glabella.y + back.y) / 2,
    z: (glabella.z + back.z) / 2,
  });
  if (section === null)
    throw new Error(
      `The head circumference plane of ${head.id} closes no loop.`,
    );
  return {
    metres: section.girth,
    points:
      clearance === undefined
        ? { glabella, opisthocranion }
        : { glabella, opisthocranion, "ear-clearance": clearance },
  };
}
