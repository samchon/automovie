import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { readHumanFaceOpticalExterior } from "../anatomy/eye/readHumanFaceOpticalExterior";
import { readHumanFaceSkinRegionRelations } from "../anatomy/skin/readHumanFaceSkinRegionRelations";
import type { IHumanFaceAssemblyCensusInput } from "./IHumanFaceAssemblyCensusInput";
import type { IHumanFaceClearanceRequest } from "./IHumanFaceClearanceRequest";
import { measureHumanFaceClearance } from "./measureHumanFaceClearance";

/**
 * Observe the spatial relations of the whole constructed face that no
 * admission condition yet decides.
 *
 * Every reading is report-only (`judged: false`): it states where a part lies
 * relative to a neighbour and refuses nothing, because the bound for each of
 * these relations belongs to an owner that does not exist yet. The readings
 * exist so those owners can be designed from measured geometry. They are taken
 * on the performed positions the model emits.
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
 *
 * @evidence contracts/common.md#principled-implementation Each relation pairs a part with the surface it physically neighbours and reads it with the shared signed and crossing instrument on emitted coordinates.
 * @evidence contracts/common.md#clear-and-simple-design One reader enumerates the relations from the model and the registrations; the instrument is shared with the judged admissions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Parts are selected by registration and identity class, never by a defect list, and no reading can refuse or pass a construction.
 * @evidence contracts/common.md#meaningful-documentation Lists the relations, their sign reading and why none is judged.
 * @evidence contracts/modeling.md#shared-boundaries Reads the measured state of boundaries whose constructing owners are still to be defined, naming both sides of each.
 * @evidence contracts/modeling.md#spatial-conventions Head-frame metres; the mirror twin negates X, the anatomical left-right axis.
 * @evidence contracts/modeling.md#rendered-observation A numerical observation of the assembly; the assembly owner still owes the rendered one.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads existing identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Report-only; bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function readHumanFaceAssemblyClearances(
  input: IHumanFaceAssemblyCensusInput,
): IAutoMovieHumanConstructionClearanceReading[] {
  const { basis, pose, model } = input;
  const tolerance = basis.contact?.toleranceMetres ?? 0;
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  const read = (
    request: Pick<
      IHumanFaceClearanceRequest,
      | "subject"
      | "against"
      | "mesh"
      | "exterior"
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
  const surfaceMesh = (id: string): IAutoMovieMesh | undefined => {
    const surface = basis.surfaces.find((candidate) => candidate.id === id);
    const points = pose.positions.get(id);
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
  const skinId =
    basis.periocular?.left.margins.surface ?? basis.contact?.lips.surface;
  const skin = skinId === undefined ? undefined : surfaceMesh(skinId);

  // 1. Lid skin against the optical exteriors.
  if (skin !== undefined && skinId !== undefined)
    for (const side of ["left", "right"] as const) {
      const exterior = readHumanFaceOpticalExterior(
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
      const cage = basis.periocular?.[side].cage;
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
  const regions = new Set(
    basis.surfaces.flatMap((surface) =>
      surface.regions.map((region) => region.id),
    ),
  );
  // Brow shafts are read per side by their own owner.
  const generated = model.parts.filter(
    (part) =>
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
        exterior: skin,
        boundary: "open",
        ...(part.id.startsWith("numerical-hair:")
          ? { crossingIndices: null }
          : {}),
      });
    }

  // 3. Soft surfaces and lining against the generated oral colliders.
  const oral = pose.oral;
  if (oral !== undefined) {
    // The source contact owner states how far its dental sheets tell their
    // sides apart; the generated colliders replace those sheets one for one.
    const reachMetres = basis.contact?.colliders.find(
      (collider) => collider.surface === oral.dentalSurface,
    )?.reachMetres;
    (oral.colliders ?? []).forEach((collider, at) => {
      for (const soft of basis.contact?.soft ?? []) {
        const mesh = surfaceMesh(soft.surface);
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
  const twins = new Map(generated.map((part) => [part.id, part]));
  for (const part of generated) {
    if (part.geometry.type !== "mesh") continue;
    const twinId = part.id.includes(":left:")
      ? part.id.replace(":left:", ":right:")
      : part.id.includes(":left-")
        ? part.id.replace(":left-", ":right-")
        : undefined;
    const twin = twinId === undefined ? undefined : twins.get(twinId);
    if (twin === undefined || twin.geometry.type !== "mesh") continue;
    const source = twin.geometry.mesh;
    const indices = [...(source.indices ?? [])];
    for (let at = 0; at < indices.length; at += 3)
      [indices[at + 1], indices[at + 2]] = [indices[at + 2], indices[at + 1]];
    read({
      subject: part.id,
      against: "mirror:" + twin.id,
      mesh: part.geometry.mesh,
      exterior: {
        positions: source.positions.map((value, at) =>
          at % 3 === 0 ? -value : value,
        ),
        indices,
        normals: null,
        uvs: null,
        skin: null,
      },
      boundary: "open",
      crossingIndices: null,
    });
  }
  readings.push(...readHumanFaceSkinRegionRelations(input));
  return readings;
}
