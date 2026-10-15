import {
  IAutoMovieSubdivisionSurface,
  subdivideAutoMovieSurface,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";
import { knitAutoMovieHumanFootCage } from "./knitAutoMovieHumanFootCage";

/** Corrections applied; the second leaves under a hundredth of a millimetre on every person tried. */
const PASSES: number = 2;

/**
 * Make the foot's limit surface measure the identity's foot length and breadth.
 *
 * A Catmull-Clark limit surface lies inside its cage, by an amount that depends on the cage's local shape, so the cage's own extent is not the skin's. The foot is therefore measured as it is rendered: the cage alone is subdivided by the engine and its limit positions give the heel's back, the tip of the longest toe and the breadth across the forefoot. The surface is affine-invariant under its cage, so moving every control point that shapes an extreme by the same offset moves the extreme exactly that far: the toes and the forefoot shift forward, the heel back, and each border of the forefoot outward, each by its error, with weights that fade to zero toward the ankle, the heel's by height and the forefoot's forward of the ring, so the ring never moves. Foot length runs from the back of the heel to the tip of the longest toe, as ANSUR II measures it, and foot breadth across the metatarsal heads, centred on the foot's long axis.
 *
 * @param plan The foot's plan
 * @param cage The knitted foot, its positions moved in place; the ring's vertices never move
 */
export function fitAutoMovieHumanFootCage(
  plan: IAutoMovieHumanFootPlan,
  cage: knitAutoMovieHumanFootCage.IOutput,
): void {
  const ring: Set<number> = new Set(cage.ring);
  const front: number = plan.ankle.origin.z + plan.ankle.radii[0]!;
  const ball: number = plan.toes[plan.toes.length - 1]!.joint.z;
  for (let pass: number = 0; pass < PASSES; ++pass) {
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: {
        positions: cage.positions.flatMap((p: IAutoMovieVector3): number[] => [
          p.x,
          p.y,
          p.z,
        ]),
        faces: cage.faces,
      },
      levels: 3,
    });
    const limit: number[] = surface.limitPositions;
    let minZ: number = Infinity;
    let maxZ: number = -Infinity;
    let minX: number = Infinity;
    let maxX: number = -Infinity;
    for (let k: number = 0; k < limit.length; k += 3) {
      const z: number = limit[k + 2]!;
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
      if (z < ball) continue;
      minX = Math.min(minX, limit[k]!);
      maxX = Math.max(maxX, limit[k]!);
    }
    const toTip: number = plan.heel + plan.length - maxZ;
    const toHeel: number = plan.heel - minZ;
    const toMedial: number = plan.axis - plan.breadth / 2 - minX;
    const toLateral: number = plan.axis + plan.breadth / 2 - maxX;
    cage.positions = cage.positions.map(
      (p: IAutoMovieVector3, index: number): IAutoMovieVector3 => {
        if (ring.has(index)) return p;
        const forefoot: number = smoothstep((p.z - front) / (ball - front));
        const hindfoot: number =
          smoothstep((plan.ankle.origin.y * 0.6 - p.y) / (0.3 * plan.ankle.origin.y)) *
          smoothstep(-p.z / (0.1 * plan.length));
        const side: number = smoothstep(Math.abs(p.x - plan.axis) / (0.35 * plan.breadth));
        return AutoMovieHumanVector.of(
          p.x + forefoot * side * (p.x < plan.axis ? toMedial : toLateral),
          p.y,
          p.z + forefoot * toTip + hindfoot * toHeel,
        );
      },
    );
  }
}

const smoothstep = (t: number): number =>
  t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
