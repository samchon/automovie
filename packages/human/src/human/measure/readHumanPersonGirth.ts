import type { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import { humanSkinLandmark } from "../../common/basis/humanSkinLandmark";
import { measureHumanSection } from "../../common/measure/measureHumanSection";
import type { IAutoMovieHumanPersonGirthMeasurement } from "../structures/IAutoMovieHumanPersonGirthMeasurement";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { joinHumanPersonSkin } from "./joinHumanPersonSkin";

/**
 * Read a source-landmark section of the final skin in metres. The body landmark must name an actual generation sample; the sample anchors a plane perpendicular to the finite landmark segment, and its projected segment point seeds the nearest closed contour. Physical correspondence can join separate skin parts at the cut, but closure is answered by the section instrument rather than presumed here.
 *
 * Missing posed landmarks, missing joined anchor, a nonpositive segment length or no closed section return null. Missing declared source registration refuses by name. The caller supplies admitted finite landmarks/source geometry; this geometric protocol preserves its source acquisition/clinical limits and does not observe current rendering.
 *
 * @evidence contracts/common.md#principled-implementation Actual declared source sample and final physical correspondence place the section plane and loop-choice seed; measured contour length supplies the result.
 * @evidence contracts/common.md#clear-and-simple-design Source landmark lookup, skin joining and section traversal remain separate existing owners, with null for an unavailable geometric reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent source point refuses rather than using a coordinate proxy, and source correspondence does not stand in for guaranteed closure or clinical accuracy.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies metre units, plane/seed construction, distinct null/refusal paths and finite admitted-input premises.
 * @evidence contracts/performance.md#efficient-algorithms Landmark arithmetic is fixed work, while joining scans included mesh/source populations and the existing section reader pays actual triangle/contour traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied performed model/plane is read afresh; this instrument owns no shape, joined-skin or contour cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Joined buffers and section workspace are call-local, and only the measured section/plane escapes with no retained source task or render resource.
 */
export function readHumanPersonGirth(
  model: IAutoMovieModel,
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
  rule: IAutoMovieHumanPersonGirthMeasurement,
  body: IAutoMovieHumanBodyBasis,
): IAutoMovieHumanPersonMeasurementReading | null {
  const from: IAutoMovieVector3 | undefined = landmarks[rule.from];
  const to: IAutoMovieVector3 | undefined = landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  const point: ReturnType<typeof humanSkinLandmark> = humanSkinLandmark(
    body,
    rule.landmark,
  );
  const sample: number | undefined =
    body.surfaces[point.surface].sourcePartition?.samples[point.vertex];
  if (sample === undefined)
    throw new Error(
      `The body view ${body.id} places ${rule.landmark} on no source sample of the generation.`,
    );
  const skin: ReturnType<typeof joinHumanPersonSkin> = joinHumanPersonSkin(
    model,
    sample,
  );
  if (skin === null) return null;
  const axis: IAutoMovieVector3 = {
    x: to.x - from.x,
    y: to.y - from.y,
    z: to.z - from.z,
  };
  const length: number = Math.hypot(axis.x, axis.y, axis.z);
  if (!(length > 0)) return null;
  const normal: IAutoMovieVector3 = {
    x: axis.x / length,
    y: axis.y / length,
    z: axis.z / length,
  };
  // the segment point on the plane seeds the loop choice
  const { anchor }: typeof skin = skin;
  const along: number =
    (anchor.x - from.x) * normal.x +
    (anchor.y - from.y) * normal.y +
    (anchor.z - from.z) * normal.z;
  const seed: IAutoMovieVector3 = {
    x: from.x + normal.x * along,
    y: from.y + normal.y * along,
    z: from.z + normal.z * along,
  };
  const plane: Parameters<typeof measureHumanSection>[2] = {
    point: anchor,
    normal,
  };
  const section: ReturnType<typeof measureHumanSection> = measureHumanSection(
    skin.positions,
    skin.indices,
    plane,
    seed,
    undefined,
    skin.physicalVertices,
  );
  return section === null ? null : { metres: section.girth, section, plane };
}
