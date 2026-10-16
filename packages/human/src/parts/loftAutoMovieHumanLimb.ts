import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";

import { IAutoMovieHumanCage } from "../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRing } from "../junction/IAutoMovieHumanRing";
import { IAutoMovieHumanSurfaceCoordinate } from "../junction/IAutoMovieHumanSurfaceCoordinate";
import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";
import { networkAutoMovieHumanLimb } from "./networkAutoMovieHumanLimb";
import { patchAutoMovieHumanLimb } from "./patchAutoMovieHumanLimb";

/**
 * Loft a limb into its control cage: the engine samples the network of `networkAutoMovieHumanLimb` at the human profile's tier. Free coarse vertices interpolate the engine's cell-averaged targets on the subdivision limit; these targets can differ from the unfiltered analytic sweep. Junction ring and collar controls retain their shared pinned positions, and the joined limit at those boundaries depends on both neighboring parts.
 *
 * The chart is the sweep's domain: `u` along the limb from 0 at the proximal ring to 1 at the distal ring, `v` counterclockwise about the distal axis from each station's `anterior`. Rings, in order: the proximal one, then the distal one.
 *
 * @param plan The limb's stations, relief and rings
 * @returns The limb's cage in millimetres, its proximal ring first
 * @throws {Error} When `networkAutoMovieHumanLimb` refuses the plan or the engine the network
 */
export function loftAutoMovieHumanLimb(
  plan: IAutoMovieHumanLimbPlan,
): IAutoMovieHumanCage {
  const network: networkAutoMovieHumanLimb.IOutput =
    networkAutoMovieHumanLimb(plan);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: network.value,
    tier: "medium",
  });
  const positions: number[] = sampled.cage.positions;
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < positions.length; k += 3)
    vertices.push({
      position: {
        x: positions[k]! * 1000,
        y: positions[k + 1]! * 1000,
        z: positions[k + 2]! * 1000,
      },
    });
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): IAutoMovieHumanCage.IFace => {
      const corners: IAutoMovieHumanSurfaceCoordinate[] = sampled.corners[
        f
      ]!.map(
        (c: IAutoMovieSurfaceCoordinate): IAutoMovieHumanSurfaceCoordinate => {
          const d: patchAutoMovieHumanLimb.IDomain = network.domains[c.patch]!(
            c.s,
            c.t,
          );
          return { part: plan.part, side: plan.side, u: d.u, v: d.v };
        },
      );
      return {
        vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
        coordinates: corners as IAutoMovieHumanCage.IFace["coordinates"],
      };
    },
  );
  const rings: IAutoMovieHumanRing[] = network.rings.map(
    (r: networkAutoMovieHumanLimb.IRing): IAutoMovieHumanRing => ({
      site: r.shape.site,
      side: r.shape.side,
      vertices: sampled.rings[r.name]!,
      start: r.shape.start,
      frame: r.shape.frame,
    }),
  );
  return {
    vertices,
    faces,
    creases: [],
    rings,
    construction: IAutoMovieHumanCage.inModel(network.value),
  };
}
