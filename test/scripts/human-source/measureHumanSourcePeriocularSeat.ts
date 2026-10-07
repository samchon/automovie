import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourcePeriocularSeatSide } from "./structures/IHumanSourcePeriocularSeatSide.ts";
import type { IHumanSourcePeriocularSeatState } from "./structures/IHumanSourcePeriocularSeatState.ts";
import type { IHumanSourcePeriocularSeatStation } from "./structures/IHumanSourcePeriocularSeatStation.ts";

/**
 * Measure how the registered lid cage sits on the source globe.
 *
 * Each cage vertex is a skin vertex and the globe is the source eye surface
 * supplemented by its registered collider closure. The query is configured
 * as an oriented open sheet: its local pseudonormal side is available only
 * at a supported nearest feature, not a global enclosed-volume proof.
 * The reading is the signed
 * distance of every cage vertex to that surface (Baerentzen and Aanaes 2005
 * through the engine's signed mesh query): positive outside, negative inside,
 * head-frame metres. A posterior margin that rests on the globe reads a small
 * positive clearance along its columns; a floating margin reads large positive
 * values and a penetrating one negative values.
 *
 * The neutral is read first, then each end of every shape channel whose
 * endpoint moves a cage vertex or a vertex of this eye. A state is the source
 * neutral plus the endpoint rows at the absolute envelope bound, on the skin
 * and on the globe alike. Correctives, the articulation, contact and the
 * runtime optical assembly are not applied, so this is the seat the source
 * authored and not the seat a built person shows. A registered tear-film
 * clearance does not exist; no threshold is applied and none is implied.
 */
export function measureHumanSourcePeriocularSeat(face: IAutoMovieHumanFaceBasis): IHumanSourcePeriocularSeatSide[] {
  if (face.periocular === undefined) throw new Error("The face basis registers no periocular cage.");
  const result: IHumanSourcePeriocularSeatSide[] = [];
  for (const side of ["left", "right"] as const) {
    const registration = face.periocular[side];
    const cage = registration.cage;
    if (cage === undefined) throw new Error(`The ${side} periocular registration has no cage.`);
    const skin = face.surfaces.find((surface) => surface.id === cage.surface);
    const globe = face.surfaces.find((surface) => surface.id === registration.globe.surface);
    const collider = face.contact?.colliders.find((entry) => entry.surface === registration.globe.surface);
    const support = face.opticalSupport?.find((entry) => entry.owner === registration.globe.owner);
    if (skin === undefined || globe === undefined || collider === undefined || support === undefined)
      throw new Error(`The ${side} cage lacks its skin, source globe, collider closure or optical support.`);
    const indices = [...globe.indices, ...collider.closure];
    const cageVertices = new Set(cage.stations.flatMap((station) => station.vertices));
    const eyeVertices = new Set(support.vertices);
    const moved = (rows: readonly number[] | undefined, members: ReadonlySet<number>): number => {
      let count = 0;
      if (rows !== undefined) for (let at = 0; at < rows.length; at += 4) if (members.has(rows[at])) count++;
      return count;
    };
    const apply = (neutral: readonly number[], rows: readonly number[] | undefined, weight: number): number[] => {
      const positions = neutral.slice();
      if (rows !== undefined)
        for (let at = 0; at < rows.length; at += 4)
          for (let axis = 0; axis < 3; axis++) positions[3 * rows[at] + axis] += weight * rows[at + 1 + axis];
      return positions;
    };
    const measure = (channel: string | null, endpoint: string | null, weight: number): IHumanSourcePeriocularSeatState => {
      const skinRows = endpoint === null ? undefined : skin.targets[endpoint];
      const globeRows = endpoint === null ? undefined : globe.targets[endpoint];
      const skinPositions = apply(skin.positions, skinRows, weight);
      const query = createAutoMovieSignedMeshQuery(
        { positions: apply(globe.positions, globeRows, weight), indices, normals: null, uvs: null, skin: null },
        { boundary: "open" },
      );
      const stations = cage.stations.map((station): IHumanSourcePeriocularSeatStation => {
        const hits = station.vertices.map((vertex) => query(skinPositions.slice(3 * vertex, 3 * vertex + 3)));
        const distances = hits.map((hit) => hit.signedDistance);
        return {
          role: station.role, signedDistancesMetres: distances,
          minimumMetres: Math.min(...distances), maximumMetres: Math.max(...distances),
          penetratingColumns: distances.filter((distance) => distance < 0).length,
          boundaryColumns: hits.filter((hit) => hit.boundary).length,
        };
      });
      return { channel, endpoint, weight, movedCageVertices: moved(skinRows, cageVertices), movedGlobeVertices: moved(globeRows, eyeVertices), stations };
    };
    const states = [measure(null, null, 0)];
    for (const channel of face.channels) {
      if (channel.kind !== "shape") continue;
      for (const end of ["positive", "negative"] as const) {
        const endpoint = channel[end];
        if (endpoint === null) continue;
        if (moved(skin.targets[endpoint], cageVertices) === 0 && moved(globe.targets[endpoint], eyeVertices) === 0) continue;
        states.push(measure(channel.id, endpoint, Math.abs(end === "positive" ? channel.maximum : channel.minimum)));
      }
    }
    result.push({
      side, cageSurface: cage.surface, globeSurface: registration.globe.surface,
      columns: cage.stations[0].vertices.length, medialColumn: cage.medialColumn, lateralColumn: cage.lateralColumn, states,
    });
  }
  return result;
}
