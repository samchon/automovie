import type { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import { humanBodySkinLandmark } from "../../body/basis/humanBodySkinLandmark";
import { measureHumanBodySection } from "../../body/measure/measureHumanBodySection";
import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonMeasurement } from "../structures/IAutoMovieHumanPersonMeasurement";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { joinHumanPersonSkin } from "./joinHumanPersonSkin";

/**
 * Read one person measurement on a person's final skin, in metres, or null
 * when the skin cannot answer it.
 *
 * The rule's skin point is read on the body view (`skinLandmarks`) and its
 * source sample found; the skin halves are joined around that sample
 * (`joinHumanPersonSkin`), so a section that crosses the head/body cut
 * closes. A body view that does not declare the point, or does not place it
 * on a source sample, refuses by name. The plane passes through that sample perpendicular to the landmark
 * segment. The closed loop nearest the segment is kept and its tape girth
 * reported (`measureHumanBodySection`). A missing landmark, a missing sample,
 * a degenerate segment or a plane that closes no loop answers null.
 *
 * @evidence contracts/common.md#principled-implementation The girth is read on the one joined skin with the body section instrument, so person and body girths share one instrument.
 * @evidence contracts/common.md#clear-and-simple-design Join, place the plane, read the section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No section is read on one half and extrapolated; a site the skin cannot close answers null.
 * @evidence contracts/common.md#meaningful-documentation States the plane, the loop choice and the null cases.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the model frame; the plane normal is the landmark segment's direction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The reader defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The reader consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The reader emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The join owns the boundary identity; the reader cuts the joined skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The reader displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns the measurement's definition and source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The reader converts no input.
 */
export function readHumanPersonMeasurement(
  model: IAutoMovieModel,
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
  rule: IAutoMovieHumanPersonMeasurement,
  body: IAutoMovieHumanBodyBasis,
): IAutoMovieHumanPersonMeasurementReading | null {
  const from = landmarks[rule.from];
  const to = landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  const point = humanBodySkinLandmark(body, rule.landmark);
  const sample = body.surfaces[point.surface].sourcePartition?.samples[point.vertex];
  if (sample === undefined)
    throw new Error(`The body view ${body.id} places ${rule.landmark} on no source sample of the generation.`);
  const skin = joinHumanPersonSkin(model, sample);
  if (skin === null) return null;
  const axis = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const length = Math.hypot(axis.x, axis.y, axis.z);
  if (!(length > 0)) return null;
  const normal = { x: axis.x / length, y: axis.y / length, z: axis.z / length };
  // the segment point on the plane seeds the loop choice
  const { anchor } = skin;
  const along =
    (anchor.x - from.x) * normal.x + (anchor.y - from.y) * normal.y + (anchor.z - from.z) * normal.z;
  const seed = { x: from.x + normal.x * along, y: from.y + normal.y * along, z: from.z + normal.z * along };
  const plane = { point: anchor, normal };
  const section = measureHumanBodySection(skin.positions, skin.indices, plane, seed, undefined, skin.physicalVertices);
  return section === null ? null : { metres: section.girth, section, plane };
}
