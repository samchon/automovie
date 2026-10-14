import type { IAutoMovieMesh, IAutoMovieModelPart as IAutoMovieModelPartImported, IAutoMovieTransform as IAutoMovieTransformImported } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { readHumanFaceOpticalExterior } from "../anatomy/eye/readHumanFaceOpticalExterior";
import { readHumanFaceSkinRegionRelations } from "../anatomy/skin/readHumanFaceSkinRegionRelations";
import type { IHumanFaceAssemblyCensusInput } from "./IHumanFaceAssemblyCensusInput";
import type { IHumanFaceClearanceRequest } from "./IHumanFaceClearanceRequest";
import { measureHumanFaceClearance } from "./measureHumanFaceClearance";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported, IAutoMovieHumanFaceBasisRegion as IAutoMovieHumanFaceBasisRegionImported, IHumanFaceOralAssembly as IHumanFaceOralAssemblyImported, IAutoMovieHumanFaceContactCollider as IAutoMovieHumanFaceContactColliderImported } from "../../index";
import type { IAutoMovieHumanFacePeriocularCage as IAutoMovieHumanFacePeriocularCageImported } from "../structures/IAutoMovieHumanFacePeriocularCage";

import type { IHumanFaceDynamicCollider as IHumanFaceDynamicColliderImported } from "./IHumanFaceDynamicCollider";


/**
 * Observe the spatial relations of the whole constructed face that no
 * admission condition yet decides.
 *
 * Every reading is report-only (`judged: false`): it states where a part lies
 * relative to a neighbour without applying an acceptance envelope to these
 * aggregate relations. Existing component-specific admissions remain separate;
 * measured aggregate geometry can inform future envelope decisions. Readings
 * use the performed positions the model emits.
 *
 * Relations read, in order:
 *
 * 1. The skin surface against each optical exterior, and each registered lid
 *    cage station row against the exterior of its eye. These say whether the
 *    lid skin is seated on, inside or away from the globe.
 * 2. Every part that is not a region of a source surface against the skin
 *    surface, read as an open sheet: tissue shells, visible ocular sheets,
 *    lashes, optics, crowns, oral lining and hair. Brow shafts are read
 *    per side by their own owner. Positive
 *    distances are outside the face. Hair skips the triangle census, which its
 *    own ribbon separation owner performs.
 * 3. Each soft contact surface against each generated oral collider, within
 *    the reach the source contact owner registers for the dental sheets. The
 *    lining against the crowns is a judged relation of `readHumanFaceOralLiningSpace`.
 * 4. Each left part against the mirror image of its right twin, as the
 *    left-right correspondence. The twin is found by identity, never by
 *    vertex order, so parts whose index order differs between sides compare.
 *
 * A point population such as a cage row is read as vertices only.
 * Default crossing counts retain at most one transverse witness per subject
 * triangle; they are not a census of every intersecting face pair. Source
 * surfaces and emitted parts share model metres, with each emitted part's
 * actual TRS passed to the clearance owner. Missing registrations omit that
 * relation. Report-only does not imply that measurement cannot throw.
 *
 * @evidence contracts/common.md#principled-implementation Registered performed source surfaces, actual optical exteriors and emitted parts identify the relations in model metres; part TRS and mirrored right-twin TRS reach the shared signed/crossing owner. These are judged-false observations because no acceptance envelope is supplied here, not manufactured clearance successes.
 * @evidence contracts/common.md#clear-and-simple-design One local adapter fixes assembly owner/state/tolerance while four relation populations and the skin-region owner keep distinct geometry responsibilities; identity names choose twins without vertex-order assumptions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Hair and cage rows explicitly skip triangle crossings for their registered vertex-only population; brows have a separate owner. Missing sources/twins omit a relation, open-sheet unknown sides stay unknown, and report-only cannot prove whole-face validity.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies relation order, optional omissions, performed frame/TRS, report-only semantics and default per-subject-triangle witnesses instead of claiming every face pair is enumerated.
 * @evidence contracts/performance.md#efficient-algorithms Population enumeration scans surfaces/regions/parts and creates source-position copies; each selected relation pays its actual mesh publication, spatial hierarchy, vertex queries and candidate crossing work. Candidate pairs can be quadratic even though retained witnesses are bounded by subject triangles.
 * @evidence contracts/performance.md#reuse-equivalent-work The skin view, region-id set and twin map serve this census; the shared clearance owner's immutable mesh/TRS query cache may reuse equivalent exteriors. New relation readings remain request-specific observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned array retains one record per selected relation with scalar summaries; population maps and source copies are local, while the shared query cache has its own weak-mesh lifetime. No viewer or GPU resource exists here.
 */
export function readHumanFaceAssemblyClearances(
  input: IHumanFaceAssemblyCensusInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  const { basis, pose, model }: IHumanFaceAssemblyCensusInput = input;
  const tolerance: number = basis.contact?.toleranceMetres ?? 0;
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  const read: (request: Pick<IHumanFaceClearanceRequest, "subject" | "against" | "mesh" | "meshTransform" | "exterior" | "exteriorTransform" | "boundary" | "vertices" | "crossingIndices" | "reachMetres">) => void = (
    request: Pick<
      IHumanFaceClearanceRequest,
      | "subject"
      | "against"
      | "mesh"
      | "meshTransform"
      | "exterior"
      | "exteriorTransform"
      | "boundary"
      | "vertices"
      | "crossingIndices"
      | "reachMetres"
    >,
  ): void => {
    readings.push(
      measureHumanFaceClearance({
        ...request,
        owner: "assembly-census",
        state: "performed",
        judged: false,
        toleranceMetres: tolerance,
      }),
    );
  };
  const surfaceMesh: (id: string) => IAutoMovieMesh | undefined = (id: string): IAutoMovieMesh | undefined => {
    const surface: IAutoMovieHumanFaceBasisSurfaceImported | undefined = basis.surfaces.find((candidate: IAutoMovieHumanFaceBasisSurfaceImported): boolean  => candidate.id === id);
    const points: readonly number[] | undefined = pose.positions.get(id);
    return surface === undefined || points === undefined
      ? undefined
      : {
          positions: [...points],
          indices: surface.indices,
          normals: null,
          uvs: null,
          skin: null,
        };
  };
  const skinId: string | undefined =
    basis.periocular?.left.margins.surface ?? basis.contact?.lips.surface;
  const skin: IAutoMovieMesh | undefined = skinId === undefined ? undefined : surfaceMesh(skinId);

  // 1. Lid skin against the optical exteriors.
  if (skin !== undefined && skinId !== undefined)
    for (const side of ["left", "right"] as const) {
      const exterior: IAutoMovieMesh | undefined = readHumanFaceOpticalExterior(
        basis,
        pose.positions,
        pose.optics,
        side,
        "performed",
      );
      if (exterior === undefined) continue;
      read({
        subject: skinId,
        against: "optics:" + side,
        mesh: skin,
        exterior,
        boundary: "closed",
      });
      const cage: IAutoMovieHumanFacePeriocularCageImported | undefined = basis.periocular?.[side].cage;
      if (cage === undefined || cage.surface !== skinId) continue;
      for (const station of cage.stations)
        read({
          subject: "periocular-cage:" + side + ":" + station.role,
          against: "optics:" + side,
          mesh: skin,
          exterior,
          boundary: "closed",
          vertices: station.vertices,
          crossingIndices: null,
        });
    }

  // 2. Generated parts against the skin sheet.
  const regions: Set<string> = new Set(
    basis.surfaces.flatMap((surface: IAutoMovieHumanFaceBasisSurfaceImported): string[]  =>
      surface.regions.map((region: IAutoMovieHumanFaceBasisRegionImported): string  => region.id),
    ),
  );
  // Brow shafts are read per side by their own owner.
  const generated: IAutoMovieModelPartImported[] = model.parts.filter(
    (part: IAutoMovieModelPartImported): boolean  =>
      part.geometry.type === "mesh" &&
      !regions.has(part.id) &&
      !part.id.startsWith("brows:"),
  );
  if (skin !== undefined && skinId !== undefined)
    for (const part of generated) {
      if (part.geometry.type !== "mesh") continue;
      read({
        subject: part.id,
        against: skinId,
        mesh: part.geometry.mesh,
        meshTransform: part.transform,
        exterior: skin,
        boundary: "open",
        ...(part.id.startsWith("numerical-hair:")
          ? { crossingIndices: null }
          : {}),
      });
    }

  // 3. Soft surfaces and lining against the generated oral colliders.
  const oral: IHumanFaceOralAssemblyImported | undefined = pose.oral;
  if (oral !== undefined) {
    // The source contact owner states how far its dental sheets tell their
    // sides apart; the generated colliders replace those sheets one for one.
    const reachMetres: number | undefined = basis.contact?.colliders.find(
      (collider: IAutoMovieHumanFaceContactColliderImported): boolean  => collider.surface === oral.dentalSurface,
    )?.reachMetres;
    (oral.colliders ?? []).forEach((collider: IHumanFaceDynamicColliderImported, at: number): void  => {
      for (const soft of basis.contact?.soft ?? []) {
        const mesh: IAutoMovieMesh | undefined = surfaceMesh(soft.surface);
        if (mesh === undefined) continue;
        read({
          subject: soft.surface,
          against: "oral-collider:" + at,
          mesh,
          exterior: collider.posed,
          boundary: "open",
          ...(reachMetres === undefined ? {} : { reachMetres }),
        });
      }
    });
  }

  // 4. Left parts against their mirrored right twins.
  const twins: Map<string, IAutoMovieModelPartImported> = new Map(generated.map((part: IAutoMovieModelPartImported): [string, IAutoMovieModelPartImported]  => [part.id, part]));
  for (const part of generated) {
    if (part.geometry.type !== "mesh") continue;
    const twinId: string | undefined = part.id.includes(":left:")
      ? part.id.replace(":left:", ":right:")
      : part.id.includes(":left-")
        ? part.id.replace(":left-", ":right-")
        : undefined;
    const twin: IAutoMovieModelPartImported | undefined = twinId === undefined ? undefined : twins.get(twinId);
    if (twin === undefined || twin.geometry.type !== "mesh") continue;
    const transform: IAutoMovieTransformImported = twin.transform ?? {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    };
    // Reflection D across X composes as D*R*S = (D*R*D)*(D*S).
    // Its proper quaternion is [qx,-qy,-qz,qw]; the existing mesh transform
    // owner handles the negative X scale's winding reversal exactly once.
    read({
      subject: part.id,
      against: "mirror:" + twin.id,
      mesh: part.geometry.mesh,
      meshTransform: part.transform,
      exterior: twin.geometry.mesh,
      exteriorTransform: {
        translation: { ...transform.translation, x: -transform.translation.x },
        rotation: {
          x: transform.rotation.x,
          y: -transform.rotation.y,
          z: -transform.rotation.z,
          w: transform.rotation.w,
        },
        scale: { ...transform.scale, x: -transform.scale.x },
      },
      boundary: "open",
      crossingIndices: null,
    });
  }
  readings.push(...readHumanFaceSkinRegionRelations(input));
  return readings;
}
