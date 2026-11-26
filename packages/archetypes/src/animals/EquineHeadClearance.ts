import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeRefusal } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * Refuse a muzzle reach whose head or neck passes through a forelimb.
 *
 * Every bar of the shared quadruped is a capsule or cylinder, so two bars
 * overlap exactly when the distance between their axis segments is less than
 * the sum of their radii. The head and the neck are checked against each of the
 * eight forelimb bars of the posed equid; a bar the target lies on, within its
 * radius, is the surface the muzzle is meant to touch and is skipped.
 *
 * @param archetype The producer's name, for the refusal.
 * @param posed The posed equid's parts, model space.
 * @param point The reach's target, model space.
 * @throws {AutoMovieArchetypeRefusal} When the head or neck overlaps a forelimb
 *   bar that does not bear the target, with the overlap in metres.
 */
export function EquineHeadClearance(
  archetype: string,
  posed: Pick<AutoMovieArchetype, "parts">,
  point: IAutoMovieVector3,
): void {
  const bars: Map<string, ISegment> = new Map(
    posed.parts.flatMap((part: IAutoMovieModelPart): [string, ISegment][] => {
      const segment: ISegment | null = bar(part);
      return segment === null ? [] : [[part.id, segment]];
    }),
  );
  for (const mover of ["head", "neck"] as const) {
    const moving: ISegment = bars.get(mover)!;
    for (const limb of ["leftFore", "rightFore"] as const)
      for (const bone of AutoMovieArchetypeQuadrupedBody.BONES[limb]) {
        const other: ISegment = bars.get(bone)!;
        const bearing: number = AutoMovieEngineMath.closestPointsBetweenSegments(
          point,
          point,
          other.from,
          other.to,
        ).distance;
        if (bearing <= other.radius + 1e-9) continue;
        const gap: number =
          AutoMovieEngineMath.closestPointsBetweenSegments(
            moving.from,
            moving.to,
            other.from,
            other.to,
          ).distance -
          moving.radius -
          other.radius;
        if (gap < 0)
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype,
            axis: "target",
            value: point,
            feasible: null,
            reason: `the ${mover} reaches the target only through the ${bone}, by ${-gap} m`,
            fix: "Place the target where the muzzle can reach it clear of the forelimbs.",
          });
      }
  }
}

/** A capsule or cylinder part's axis and radius, model space. */
interface ISegment {
  /** Its start. */
  from: IAutoMovieVector3;

  /** Its end. */
  to: IAutoMovieVector3;

  /** Its radius, metres. */
  radius: number;
}

/** Read a bar part's axis, or null for any other part. */
function bar(part: IAutoMovieModelPart): ISegment | null {
  const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
  if (
    part.transform === null ||
    part.transform === undefined ||
    geometry.type !== "primitive" ||
    (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
  )
    return null;
  const half: IAutoMovieVector3 = Quaternion.rotateVector(
    part.transform.rotation,
    { x: 0, y: geometry.shape.height / 2, z: 0 },
  );
  return {
    from: Vector3.subtract(part.transform.translation, half),
    to: Vector3.add(part.transform.translation, half),
    radius: geometry.shape.radius,
  };
}
