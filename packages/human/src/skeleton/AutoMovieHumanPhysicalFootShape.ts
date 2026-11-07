import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanFootBones } from "../generation/foot/AutoMovieHumanFootBones";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";

/**
 * A declared box approximation of the canonical foot envelope, split at the
 * actual midfoot landmark. Length, breadth, heel and sole come from the same
 * foot dimensions and frame as construction, including each side's measures.
 * It is a collision envelope, not a claim that the absent skin was generated.
 */
export function AutoMovieHumanPhysicalFootShape(
  parameters: IAutoMovieHumanParameters,
  bone: string,
  neutral: ReadonlyMap<string, P.ITransform>,
  material: string,
): P.IShape {
  const side: "left" | "right" = bone.startsWith("left") ? "left" : "right";
  const sign: number = side === "left" ? 1 : -1;
  const dimensions: ReturnType<typeof AutoMovieHumanBodyLaw.footDimensions> =
    AutoMovieHumanBodyLaw.footDimensions(parameters);
  const reference: AutoMovieHumanFootBones.ICentres =
    AutoMovieHumanFootBones.of(dimensions[side], side === "left" ? 1 : -1);
  const ankle: P.ITransform = neutral.get(`${side}Foot`)!;
  const ball: IAutoMovieVector3 = neutral.get(`${side}Midfoot`)!.position;
  const source: readonly number[] = reference.bones.ball;
  const delta: IAutoMovieVector3 = Vector3.subtract(ball, ankle.position);
  const yaw: number =
    Math.atan2(delta.z, delta.x) - Math.atan2(source[2]!, source[0]!);
  const c: number = Math.cos(yaw);
  const s: number = Math.sin(yaw);
  const world: (a: number, u: number, height: number) => IAutoMovieVector3 = (
    a: number,
    u: number,
    height: number,
  ): IAutoMovieVector3 => {
    const point: readonly number[] = reference.frame.at(a, u, height);
    const x: number = point[0]! / 1000;
    const z: number = (sign * point[2]!) / 1000;
    return Vector3.add(ankle.position, {
      x: c * x - s * z,
      y: (point[1]! - reference.frame.H) / 1000,
      z: s * x + c * z,
    });
  };
  const heel: IAutoMovieVector3 = world(0, 0.5, 0);
  const tip: IAutoMovieVector3 = world(1, 0.5, 0);
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(tip, heel),
  );
  const split: number =
    Vector3.dot(Vector3.subtract(ball, heel), axis) /
    (reference.frame.L / 1000);
  if (!(split > 0 && split < 1))
    throw new Error(`Physical foot midfoot outside source envelope: ${side}`);
  const from: number = bone.endsWith("Subtalar") ? 0 : split;
  const to: number = bone.endsWith("Subtalar") ? split : 1;
  const center: IAutoMovieVector3 = world(
    (from + to) / 2,
    0.5,
    reference.frame.H / 2,
  );
  const orientation: P.ITransform["rotation"] = {
    x: 0,
    y: -Math.sin(Math.atan2(axis.z, axis.x) / 2),
    z: 0,
    w: Math.cos(Math.atan2(axis.z, axis.x) / 2),
  };
  const inverse: P.ITransform["rotation"] = Quaternion.inverse(
    neutral.get(bone)!.rotation,
  );
  return {
    id: "surface",
    kind: "box",
    material,
    halfExtents: {
      x: ((to - from) * reference.frame.L) / 2000,
      y: reference.frame.H / 2000,
      z: reference.frame.B / 2000,
    },
    transform: {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(center, neutral.get(bone)!.position),
      ),
      rotation: Quaternion.multiply(inverse, orientation),
    },
  };
}
