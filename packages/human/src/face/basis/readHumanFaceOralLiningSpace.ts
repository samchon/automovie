import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import type {
  IAutoMovieHumanFaceContactCollider as IAutoMovieHumanFaceContactColliderImported,
  IHumanFaceOralAssembly as IHumanFaceOralAssemblyImported,
} from "../../index";
import type { IHumanFaceAssemblyCensusInput } from "./IHumanFaceAssemblyCensusInput";
import type { IHumanFaceDynamicCollider as IHumanFaceDynamicColliderImported } from "./IHumanFaceDynamicCollider";
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
 * deeper than the source tolerance inside a crown, a vertex whose nearest
 * reference feature is an open rim regardless of distance, or a non-coplanar
 * triangle crossing refuses. Crowns
 * themselves and the labial vestibule strips are not lining in this sense
 * and are not read here.
 *
 * Each crown is also read against every crown of the opposing arch, named by
 * its ISO tooth number, as a report-only reading of the performed occlusion.
 *
 * The lip margin gaps are a report-only reading of the contact summary: the
 * signed gap of each lip margin chain vertex against the opposite chain,
 * given as minimum, median and maximum. The contact owner computes them;
 * this owner only carries them into the construction report.
 * Current oral finish publishes head-metre meshes with null TRS; this reader
 * relies on that actual producer contract. Default crossing counts retain
 * at most one transverse witness per subject triangle. Report-only crown
 * readings and carried margin summaries do not certify clinical occlusion.
 *
 * @evidence contracts/common.md#principled-implementation Current performed dental colliders and world-frame generated oral finish supply signed open-sheet clearance within registered reach. Lining records use the shared judged refusal rule; opposing crown records and already-measured margin gaps remain observations, with unchanged source tolerance.
 * @evidence contracts/common.md#clear-and-simple-design Dental opposition, emitted lining and carried contact-summary gaps have separate loops but one shared clearance owner; this reporter does not recalculate the lip graph or replace physical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Oral id roles deliberately exclude teeth and labial-vestibule strips from the lining population. Missing/misaligned tooth-id metadata omits opposing-arch readings, not a guessed ISO mapping; open-rim unknowns and native query failures remain visible.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes judged lining from report-only crowns/gaps, current null-TRS world meshes, signed metre values, source reach and per-subject-triangle crossing witnesses.
 * @evidence contracts/performance.md#efficient-algorithms D dental colliders enumerate opposing D-squared crown pairs and scan P model parts per collider for lining, then pay actual spatial-query/candidate costs. Sorting G margin gaps is O(G log G); output follows selected relations rather than all crossing pairs.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared immutable-mesh clearance owner may reuse equivalent collider queries; gaps reuse the completed contact summary and only their copied sorting is repeated. Changed performed geometry cannot reuse old relation verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Request-local records and the sorted gap copy scale with selected dental/lining relations and G; no unbounded history, worker or GPU handle is retained, and caller pose/model arrays are unchanged.
 */
export function readHumanFaceOralLiningSpace(
  input: IHumanFaceAssemblyCensusInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  const { basis, pose, model }: IHumanFaceAssemblyCensusInput = input;
  const owner: string = "oral-lining";
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  const oral: IHumanFaceOralAssemblyImported | undefined = pose.oral;
  if (oral !== undefined) {
    const tolerance: number | undefined = basis.contact?.toleranceMetres;
    if (tolerance === undefined || !Number.isFinite(tolerance) || tolerance < 0)
      throw new Error("Oral lining space needs its source contact tolerance.");
    const reachMetres: number | undefined = basis.contact?.colliders.find(
      (collider: IAutoMovieHumanFaceContactColliderImported): boolean =>
        collider.surface === oral.dentalSurface,
    )?.reachMetres;
    const ids:
      | readonly (
          | "11"
          | "12"
          | "13"
          | "14"
          | "15"
          | "16"
          | "17"
          | "18"
          | "21"
          | "22"
          | "23"
          | "24"
          | "25"
          | "26"
          | "27"
          | "28"
          | "31"
          | "32"
          | "33"
          | "34"
          | "35"
          | "36"
          | "37"
          | "38"
          | "41"
          | "42"
          | "43"
          | "44"
          | "45"
          | "46"
          | "47"
          | "48"
        )[]
      | undefined = oral.dentalColliderIds;
    const colliders: readonly IHumanFaceDynamicColliderImported[] =
      oral.dentalColliders ?? [];
    // Crowns of one arch against the crowns of the opposing arch: a
    // report-only reading of where the two performed dentitions stand. The
    // first digit of an ISO tooth number is its quadrant; 1 and 2 are
    // maxillary, 3 and 4 mandibular.
    if (ids !== undefined && ids.length === colliders.length)
      colliders.forEach(
        (subject: IHumanFaceDynamicColliderImported, at: number): void => {
          colliders.forEach(
            (
              exterior: IHumanFaceDynamicColliderImported,
              other: number,
            ): void => {
              const upper: boolean = Number(String(ids[at])[0]) <= 2;
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
            },
          );
        },
      );
    (oral.dentalColliders ?? []).forEach(
      (collider: IHumanFaceDynamicColliderImported, at: number): void => {
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
      },
    );
  }
  const gaps: number[] | undefined = pose.summary?.marginInterlabialMetres;
  if (gaps !== undefined && gaps.length > 0) {
    const sorted: number[] = [...gaps].sort(
      (a: number, b: number): number => a - b,
    );
    readings.push({
      owner,
      state: "performed",
      subject: "lip-margin:upper+lower",
      against: "lip-margin:opposite",
      judged: false,
      refused: false,
      toleranceMetres: 0,
      vertices: sorted.length,
      insideVertices: sorted.filter((gap: number): boolean => gap < 0).length,
      outsideVertices: sorted.filter((gap: number): boolean => gap > 0).length,
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
