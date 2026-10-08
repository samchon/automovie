import type { IAutoMovieMesh, IAutoMovieTransform } from "@automovie/interface";

import type { IAutoMovieHumanConstructionClearanceReading } from "../../../common/structures/IAutoMovieHumanConstructionClearanceReading";
import { measureHumanFaceClearance } from "../../basis/measureHumanFaceClearance";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceOpticalExterior } from "./readHumanFaceOpticalExterior";
import type { IHumanFaceOpticalAssembly } from "./structures/IHumanFaceOpticalAssembly";
import type { IHumanFacePeriocularTissuePart } from "./structures/IHumanFacePeriocularTissuePart";

/**
 * Measure every coarse lid tissue shell in the common space of the ocular
 * assembly.
 *
 * Each shell first reports the room its requested dimensions had inside the
 * lid (`lid-thickness`): a request that needs more than the lid has is
 * refused, with the shortfall as its minimum. The builder retains the
 * requested thickness and offset instead of truncating or lifting it.
 * Each shell must also lie beneath the lid skin: a
 * vertex in front of the skin sheet or a face crossing it refuses, because
 * skin is the outermost layer of the lid. Each shell is then read against the optical exterior of its eye, and each pair
 * of shells on one side is read in both directions. Both resting and
 * performed callers take this absolute reading; an intersecting rest shell
 * supplies no permissible penetration floor. The condition is the one this
 * owner always applied: a shell vertex deeper than the source tolerance
 * inside the other surface, or a non-coplanar triangle crossing, refuses.
 * Separate shells may meet on a coplanar authored boundary. What changed is
 * that every shell and every pair is measured and reported, where the
 * admission used to stop at the first one. The source tolerance absorbs
 * position rounding only.
 *
 * @evidence contracts/common.md#principled-implementation Absolute signed geometry plus the triangle crossing census read the exact emitted shells and eye hulls at output precision, over the whole shell population.
 * @evidence contracts/common.md#clear-and-simple-design One owner enumerates the relations and delegates each to the shared clearance instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shell offset, source tolerance or resting penetration is changed, and no shell or side is exempted.
 * @evidence contracts/common.md#meaningful-documentation States both state gates, coplanar contact, the unchanged condition and the complete report.
 * @evidence contracts/modeling.md#shared-boundaries Tissue shells and optics share one metre-frame spatial reading instead of independent penetration baselines.
 * @evidence contracts/modeling.md#spatial-conventions Uses existing head-frame geometry and source metre tolerance.
 * @evidence contracts/anatomy.md#permitted-range Refuses intersecting geometric shells without claiming tissue mechanics or a physiological dimension interval.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads generator-owned part identities without defining another population.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Reads exact generated geometry and emits no replacement.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no dimensional control or source eligibility field.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical admission; the eye assembly owner owes the rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometric intersection admission supplies no biological value or acquisition protocol.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 */
export function readHumanFacePeriocularTissueSpace(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  parts: readonly IHumanFacePeriocularTissuePart[],
  optics: readonly IHumanFaceOpticalAssembly[] | undefined,
  state: "rest" | "performed",
): IAutoMovieHumanConstructionClearanceReading[] {
  if (parts.length === 0) return [];
  const tolerance = basis.contact?.toleranceMetres;
  if (tolerance === undefined || !Number.isFinite(tolerance) || tolerance < 0)
    throw new Error(
      "Periocular tissue space needs its source contact tolerance.",
    );
  const owner = "periocular-" + state;
  const transforms = new Map<IHumanFacePeriocularTissuePart, IAutoMovieTransform>(
    parts.map((part) => [part, {
      translation: part.publication.origin,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    }]),
  );
  const readings: IAutoMovieHumanConstructionClearanceReading[] = [];
  const skins = new Map<"left" | "right", IAutoMovieMesh>();
  for (const side of ["left", "right"] as const) {
    const selected = parts.filter((part) => part.side === side);
    if (selected.length === 0) continue;
    const optical = readHumanFaceOpticalExterior(
      basis,
      positions,
      optics,
      side,
      state,
    );
    if (optical === undefined)
      throw new Error(
        "Periocular tissue space needs its registered optical proxy: " + side,
      );
    const id = (part: IHumanFacePeriocularTissuePart): string =>
      "periocular:" + side + ":" + part.tissue;
    for (const part of selected)
      readings.push({
        owner,
        state,
        subject: id(part),
        against: "lid-thickness:" + side,
        judged: true,
        refused: part.fit.shortStations > 0,
        toleranceMetres: 0,
        vertices: part.fit.stations,
        insideVertices: part.fit.shortStations,
        outsideVertices: part.fit.stations - part.fit.shortStations,
        boundaryVertices: 0,
        minimumSignedMetres: part.fit.minimumMarginMetres,
        maximumSignedMetres: null,
        worstVertex: null,
        worstPoint: null,
        crossings: null,
        unavailable: null,
      });
    // Lid tissue lies beneath the lid skin: the skin is the lid's outermost
    // layer (Ferreira et al. 2020), so no shell vertex may be in front of
    // the skin sheet and no shell face may cross it.
    const skinId = basis.periocular?.[side].cage?.surface;
    const host = basis.surfaces.find((surface) => surface.id === skinId);
    const skinPoints = skinId === undefined ? undefined : positions.get(skinId);
    if (host === undefined || skinPoints === undefined)
      throw new Error(
        "Periocular tissue space needs the lid skin of its cage: " + side,
      );
    skins.set(
      side,
      skins.get(side) ?? {
        positions: [...skinPoints],
        indices: host.indices,
        normals: null,
        uvs: null,
        skin: null,
      },
    );
    for (const part of selected)
      readings.push(
        measureHumanFaceClearance({
          owner,
          state,
          subject: id(part),
          against: skinId + ":beneath",
          judged: true,
          forbidden: "outside",
          mesh: part.publication.mesh,
          meshTransform: transforms.get(part),
          exterior: skins.get(side)!,
          boundary: "open",
          toleranceMetres: tolerance,
        }),
      );
    for (let at = 0; at < selected.length; at++) {
      readings.push(
        measureHumanFaceClearance({
          owner,
          state,
          subject: id(selected[at]),
          against: "optics:" + side,
          judged: true,
          mesh: selected[at].publication.mesh,
          meshTransform: transforms.get(selected[at]),
          exterior: optical,
          boundary: "closed",
          toleranceMetres: tolerance,
        }),
      );
      for (let other = 0; other < at; other++) {
        // The crossing census is symmetric, so the second direction reads
        // containment only.
        readings.push(
          measureHumanFaceClearance({
            owner,
            state,
            subject: id(selected[at]),
            against: id(selected[other]),
            judged: true,
            mesh: selected[at].publication.mesh,
            meshTransform: transforms.get(selected[at]),
            exterior: selected[other].publication.mesh,
            exteriorTransform: transforms.get(selected[other]),
            boundary: "closed",
            toleranceMetres: tolerance,
          }),
          measureHumanFaceClearance({
            owner,
            state,
            subject: id(selected[other]),
            against: id(selected[at]),
            judged: true,
            mesh: selected[other].publication.mesh,
            meshTransform: transforms.get(selected[other]),
            exterior: selected[at].publication.mesh,
            exteriorTransform: transforms.get(selected[at]),
            boundary: "closed",
            toleranceMetres: tolerance,
            crossingIndices: null,
          }),
        );
      }
    }
  }
  return readings;
}
