import type { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import { humanSkinLandmark } from "../../common/basis/humanSkinLandmark";
import { measureHumanSection } from "../../common/measure/measureHumanSection";
import type { IAutoMovieHumanPersonGirthMeasurement } from "../structures/IAutoMovieHumanPersonGirthMeasurement";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { joinHumanPersonSkin } from "./joinHumanPersonSkin";

/**
 * Read one person girth on a person's final skin, in metres, or null
 * when the skin cannot answer it.
 *
 * The rule's skin point is read on the body view (`skinLandmarks`) and its
 * source sample found; the skin halves are joined around that sample
 * (`joinHumanPersonSkin`), so a section that crosses the head/body cut
 * closes. A body view that does not declare the point, or does not place it
 * on a source sample, refuses by name. The plane passes through that sample perpendicular to the landmark
 * segment. The closed loop nearest the segment is kept and its tape girth
 * reported (`measureHumanSection`). A missing landmark, a missing sample,
 * a degenerate segment or a plane that closes no loop answers null.
 */
export function readHumanPersonGirth(
  model: IAutoMovieModel,
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
  rule: IAutoMovieHumanPersonGirthMeasurement,
  body: IAutoMovieHumanBodyBasis,
): IAutoMovieHumanPersonMeasurementReading | null {
  const from = landmarks[rule.from];
  const to = landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  const point = humanSkinLandmark(body, rule.landmark);
  const sample =
    body.surfaces[point.surface].sourcePartition?.samples[point.vertex];
  if (sample === undefined)
    throw new Error(
      `The body view ${body.id} places ${rule.landmark} on no source sample of the generation.`,
    );
  const skin = joinHumanPersonSkin(model, sample);
  if (skin === null) return null;
  const axis = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const length = Math.hypot(axis.x, axis.y, axis.z);
  if (!(length > 0)) return null;
  const normal = { x: axis.x / length, y: axis.y / length, z: axis.z / length };
  // the segment point on the plane seeds the loop choice
  const { anchor } = skin;
  const along =
    (anchor.x - from.x) * normal.x +
    (anchor.y - from.y) * normal.y +
    (anchor.z - from.z) * normal.z;
  const seed = {
    x: from.x + normal.x * along,
    y: from.y + normal.y * along,
    z: from.z + normal.z * along,
  };
  const plane = { point: anchor, normal };
  const section = measureHumanSection(
    skin.positions,
    skin.indices,
    plane,
    seed,
    undefined,
    skin.physicalVertices,
  );
  return section === null ? null : { metres: section.girth, section, plane };
}
