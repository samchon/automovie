import { measureHumanSection } from "./measureHumanSection";
import type { IAutoMovieHumanHeadCircumferenceMeasurement } from "./IAutoMovieHumanHeadCircumferenceMeasurement";
import type { IAutoMovieHumanHeadReading } from "./IAutoMovieHumanHeadReading";
import type { IAutoMovieHumanHeadSkin } from "./IAutoMovieHumanHeadSkin";
import { findHumanOpisthocranion } from "./findHumanOpisthocranion";
import { humanHeadEar } from "./humanHeadEar";
import { humanHeadPoint } from "./humanHeadPoint";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Read head circumference on a head view at rest: the tape girth of the
 * closed section on a plane through the rule's glabella, level from side to
 * side, as near the plane through the opisthocranion
 * (`findHumanOpisthocranion`) as the protocol's two conditions allow.
 *
 * Every plane considered contains the X axis, so it tilts front to back but
 * not to either side. ANSUR II 6.4.47 adds that the tape's plane is "higher in
 * front than it is in the back" and passes "above the attachment of the ears".
 * The plane through the opisthocranion is the head's longest front-to-back
 * line; where it would rise behind the glabella it is held level, and where it
 * would cut an ear it is raised at the back to touch the highest ear point.
 * The girth is the convex hull perimeter of the closed loop nearest the
 * plane's midline between the glabella and its back point
 * (`measureHumanSection`), the tape a body girth reads. An ear in front of
 * the glabella or above its level, or a plane that closes no loop, refuses by
 * name. The reading's points include `ear-clearance` when the ears set the
 * plane.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the body's tape instrument on a plane set by the head's own points.
 * @evidence contracts/common.md#clear-and-simple-design One slope from the opisthocranion held to the two conditions, one pass over the ear triangles, one section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plane is moved only by the protocol's own conditions, constructions rather than tolerances; impossible planes refuse.
 * @evidence contracts/common.md#meaningful-documentation States the plane, the two conditions that move it, the instrument and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions The plane is level along X of the person frame; the girth is metres.
 * @evidence contracts/anatomy.md#anatomical-source Follows ANSUR II 6.4.47 as the rule cites it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanHeadCircumference(
  head: IAutoMovieHumanHeadSkin,
  rule: IAutoMovieHumanHeadCircumferenceMeasurement,
): IAutoMovieHumanHeadReading {
  const glabella = humanHeadPoint(head, rule.glabella);
  const opisthocranion = findHumanOpisthocranion(head, glabella, humanHeadPoint(head, rule.tragion).y);
  // the plane y = glabella.y + slope * (z - glabella.z) holds the X axis; a positive slope lowers it at the back
  const slopeTo = (point: IAutoMovieVector3): number => (glabella.y - point.y) / (glabella.z - point.z);
  // the tape is not lower in front than at the back: a plane that would rise behind is held level
  let slope = Math.max(0, slopeTo(opisthocranion));
  let clearance: IAutoMovieVector3 | undefined;
  for (const name of [rule.rightEar, rule.leftEar])
    for (const t of humanHeadEar(head, name).triangles)
      for (let k = 0; k < 3; k++) {
        const v = head.indices[t * 3 + k];
        const point = { x: head.positions[v * 3], y: head.positions[v * 3 + 1], z: head.positions[v * 3 + 2] };
        if (!(point.z < glabella.z)) throw new Error(`The ear ${name} of ${head.id} reaches in front of the glabella.`);
        if (slopeTo(point) < slope) {
          if (slopeTo(point) < 0)
            throw new Error(`The ear ${name} of ${head.id} rises above the glabella, so no tape passes above it level in front.`);
          slope = slopeTo(point);
          clearance = point;
        }
      }
  const size = Math.hypot(1, slope);
  const plane = { point: glabella, normal: { x: 0, y: 1 / size, z: -slope / size } };
  const back = clearance ?? opisthocranion;
  const section = measureHumanSection(head.positions, head.indices, plane, {
    x: glabella.x,
    y: (glabella.y + back.y) / 2,
    z: (glabella.z + back.z) / 2,
  });
  if (section === null) throw new Error(`The head circumference plane of ${head.id} closes no loop.`);
  return {
    metres: section.girth,
    points: clearance === undefined ? { glabella, opisthocranion } : { glabella, opisthocranion, "ear-clearance": clearance },
  };
}
