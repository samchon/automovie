import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";

/** Human ball witnesses, sole patches and anatomical chains. A flat foot uses its complete forefoot face; a raised heel uses the front transverse edge of the declared rigid envelope, because this approximation omits independent physical toes. */
export function AutoMovieHumanPhysicalSupports(
  profile: P,
  reference: Skeleton.IOutput,
  raisedHeels: readonly ("left" | "right")[] = [],
): IAutoMovieFootfallPattern {
  const at: (bone: string) => Skeleton.IPlacement = (
    bone: string,
  ): Skeleton.IPlacement => {
    const placement: Skeleton.IPlacement | undefined = reference.posed.find(
      (candidate: Skeleton.IPlacement): boolean => candidate.bone === bone,
    );
    if (!placement) throw new Error(`Human support landmark missing: ${bone}`);
    return placement;
  };
  const point: (coordinates: readonly number[]) => IAutoMovieVector3 = (
    coordinates: readonly number[],
  ): IAutoMovieVector3 => ({
    x: coordinates[0]!,
    y: coordinates[1]!,
    z: coordinates[2]!,
  });
  return {
    id: "human-own-physical-soles",
    minimumSupports: 1,
    limbs: (["left", "right"] as const).map(
      (
        side: "left" | "right",
        index: number,
      ): IAutoMovieFootfallPattern["limbs"][number] => {
        const bone: string = `${side}Midfoot`;
        const placement: Skeleton.IPlacement = at(bone);
        const endpoint: IAutoMovieVector3 = Vector3.scale(
          Vector3.add(
            point(at(`${side}HalluxProximal`).position),
            point(at(`${side}Toe5Proximal`).position),
          ),
          0.5,
        );
        const inverse: P.ITransform["rotation"] = {
          x: -placement.rotation[0],
          y: -placement.rotation[1],
          z: -placement.rotation[2],
          w: placement.rotation[3],
        };
        const localPoint: IAutoMovieVector3 = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(endpoint, point(placement.position)),
        );
        const segment: P.ISegment | undefined = profile.segments.find(
          (candidate: P.ISegment): boolean => candidate.bone === bone,
        );
        const shape: P.IShape | undefined = segment?.shapes.find(
          (candidate: P.IShape): boolean => candidate.kind === "box",
        );
        if (!shape || shape.kind !== "box")
          throw new Error(`Human forefoot envelope missing: ${bone}`);
        const floorPoints: NonNullable<
          IAutoMovieFootfallPattern["limbs"][number]["floorPoints"]
        > = [];
        for (const x of raisedHeels.includes(side) ? [1] : [-1, 1])
          for (const z of [-1, 1])
            floorPoints.push({
              bone,
              localPoint: Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, {
                  x: x * shape.halfExtents.x,
                  y: -shape.halfExtents.y,
                  z: z * shape.halfExtents.z,
                }),
              ),
            });
        return {
          bone,
          localPoint,
          floorPoints,
          contacts: [`${side}Foot`, `${side}Subtalar`, bone],
          chain: [
            `${side}UpperLeg`,
            `${side}LowerLeg`,
            `${side}Foot`,
            `${side}Subtalar`,
            bone,
          ],
          phase: index / 2,
          duty: 0.5,
          offset: { forward: 0, left: index ? -0.1 : 0.1 },
          stride: [{ speed: 0, length: 0.5 }],
        };
      },
    ),
  };
}
