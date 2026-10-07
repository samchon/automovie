import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type { IHumanFaceAssemblyCensusInput } from "./IHumanFaceAssemblyCensusInput";
import { measureHumanFaceClearance } from "./measureHumanFaceClearance";

/**
 * Measure the generated oral lining against every dental crown collider, and
 * report the lip margin gaps of the same construction.
 *
 * Gingiva, palate, floor and vestibular wall are tissue that meets the
 * crowns at their cervical margins and must not pass through them. Each such
 * lining part is read against each performed dental collider, within the
 * reach the source contact owner registers for the dental sheets. The
 * condition is the judged condition of the other face admissions: a vertex
 * deeper than the source tolerance inside a crown, a vertex on an open rim
 * within reach, or a non-coplanar triangle crossing refuses. Crowns
 * themselves and the labial vestibule strips are not lining in this sense
 * and are not read here.
 *
 * Each crown is also read against every crown of the opposing arch, named by
 * its ISO tooth number, as a report-only reading of the resting occlusion.
 *
 * The lip margin gaps are a report-only reading of the contact summary: the
 * signed gap of each lip margin chain vertex against the opposite chain,
 * given as minimum, median and maximum. The contact owner computes them;
 * this owner only carries them into the construction report.
 *
 * @evidence contracts/common.md#principled-implementation Lining and crowns are read with the shared signed and crossing instrument on emitted coordinates, within the reach for which the reference sheets have a side.
 * @evidence contracts/common.md#clear-and-simple-design One reader enumerates lining parts and dental colliders; the oral owners keep construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lining is selected by its identity class, every collider is read, and the tolerance is the source contact tolerance.
 * @evidence contracts/common.md#meaningful-documentation States what counts as lining, the condition, the reach and the origin of the lip gaps.
 * @evidence contracts/modeling.md#shared-boundaries Reads the boundary between generated lining and source crowns; the oral owners construct both sides.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres.
 * @evidence contracts/anatomy.md#permitted-range Refuses lining that intersects a crown; this is a geometric condition and claims no periodontal dimension.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads existing identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical admission; the oral assembly owner owes the rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
 */
export function readHumanFaceOralLiningSpace(
  input: IHumanFaceAssemblyCensusInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  const { basis, pose, model } = input;
  const owner = "oral-lining";
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  const oral = pose.oral;
  if (oral !== undefined) {
    const tolerance = basis.contact?.toleranceMetres;
    if (tolerance === undefined || !Number.isFinite(tolerance) || tolerance < 0)
      throw new Error("Oral lining space needs its source contact tolerance.");
    const reachMetres = basis.contact?.colliders.find(
      (collider) => collider.surface === oral.dentalSurface,
    )?.reachMetres;
    const ids = oral.dentalColliderIds;
    const colliders = oral.dentalColliders ?? [];
    // Crowns of one arch against the crowns of the opposing arch: a
    // report-only reading of where the two dentitions stand at rest. The
    // first digit of an ISO tooth number is its quadrant; 1 and 2 are
    // maxillary, 3 and 4 mandibular.
    if (ids !== undefined && ids.length === colliders.length)
      colliders.forEach((subject, at) => {
        colliders.forEach((exterior, other) => {
          const upper = Number(String(ids[at])[0]) <= 2;
          if (upper === Number(String(ids[other])[0]) <= 2) return;
          readings.push(
            measureHumanFaceClearance({
              owner,
              state: "performed",
              subject: "oral-dental-collider:" + ids[at],
              against: "oral-dental-collider:" + ids[other],
              judged: false,
              mesh: subject.posed,
              exterior: exterior.posed,
              boundary: "open",
              toleranceMetres: tolerance,
              ...(reachMetres === undefined ? {} : { reachMetres }),
            }),
          );
        });
      });
    (oral.dentalColliders ?? []).forEach((collider, at) => {
      for (const part of model.parts) {
        if (
          part.geometry.type !== "mesh" ||
          !part.id.startsWith("oral:") ||
          part.id.startsWith("oral:tooth-") ||
          part.id.includes("labial-vestibule")
        )
          continue;
        readings.push(
          measureHumanFaceClearance({
            owner,
            state: "performed",
            subject: part.id,
            against: "oral-dental-collider:" + (ids?.[at] ?? at),
            judged: true,
            mesh: part.geometry.mesh,
            exterior: collider.posed,
            boundary: "open",
            toleranceMetres: tolerance,
            ...(reachMetres === undefined ? {} : { reachMetres }),
          }),
        );
      }
    });
  }
  const gaps = pose.summary?.marginInterlabialMetres;
  if (gaps !== undefined && gaps.length > 0) {
    const sorted = [...gaps].sort((a, b) => a - b);
    readings.push({
      owner,
      state: "performed",
      subject: "lip-margin:upper+lower",
      against: "lip-margin:opposite",
      judged: false,
      refused: false,
      toleranceMetres: 0,
      vertices: sorted.length,
      insideVertices: sorted.filter((gap) => gap < 0).length,
      outsideVertices: sorted.filter((gap) => gap > 0).length,
      boundaryVertices: 0,
      minimumSignedMetres: sorted[0],
      maximumSignedMetres: sorted[sorted.length - 1],
      medianSignedMetres: sorted[Math.ceil(sorted.length / 2) - 1],
      worstVertex: null,
      worstPoint: null,
      crossings: null,
      unavailable: null,
    });
  }
  return readings;
}
