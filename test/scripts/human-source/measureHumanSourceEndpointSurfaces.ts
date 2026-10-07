import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceEndpointCensusRow } from "./structures/IHumanSourceEndpointCensusRow.ts";
import type { IHumanSourceEndpointSurfaceReading } from "./structures/IHumanSourceEndpointSurfaceReading.ts";

/**
 * List the surfaces each shape channel end moves in a compiled face basis.
 *
 * A source endpoint is a set of sparse rows `[vertex, dx, dy, dz]` per surface
 * and per landmark table, so "what this control moves" is exactly which tables
 * hold rows under its endpoint name. A control whose endpoint has skin rows
 * and none on the globe, teeth, tongue, brow, lash or landmark tables leaves
 * those parts behind when the skin moves; that is the following risk this
 * census exposes. Displacements are unit-weight row lengths in head-frame
 * metres. Nothing here evaluates a corrective, an articulation or contact,
 * and a row count says nothing about whether the motion is anatomical.
 */
export function measureHumanSourceEndpointSurfaces(face: IAutoMovieHumanFaceBasis): IHumanSourceEndpointCensusRow[] {
  const skin = face.surfaces[0].id;
  const read = (surface: string, rows: readonly number[] | undefined): IHumanSourceEndpointSurfaceReading | null => {
    if (rows === undefined || rows.length === 0) return null;
    if (rows.length % 4 !== 0) throw new Error(`Endpoint rows of ${surface} are not [vertex, dx, dy, dz] quadruples.`);
    let maximum = 0;
    for (let at = 0; at < rows.length; at += 4) maximum = Math.max(maximum, Math.hypot(rows[at + 1], rows[at + 2], rows[at + 3]));
    return { surface, movedVertices: rows.length / 4, maximumDisplacementMetres: maximum };
  };
  const result: IHumanSourceEndpointCensusRow[] = [];
  for (const channel of face.channels) {
    if (channel.kind !== "shape") continue;
    for (const side of ["positive", "negative"] as const) {
      const endpoint = channel[side];
      if (endpoint === null) continue;
      const moved: IHumanSourceEndpointSurfaceReading[] = [];
      for (const surface of face.surfaces) {
        const reading = read(surface.id, surface.targets[endpoint]);
        if (reading !== null) moved.push(reading);
      }
      const landmarks = read("landmarks", face.landmarks?.targets[endpoint]);
      if (landmarks !== null) moved.push(landmarks);
      result.push({
        channel: channel.id, kind: channel.kind, side, endpoint,
        bound: side === "positive" ? channel.maximum : channel.minimum,
        moved, skinOnly: moved.length === 1 && moved[0].surface === skin,
      });
    }
  }
  return result;
}
