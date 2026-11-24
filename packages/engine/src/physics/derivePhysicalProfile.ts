import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieDerivePhysicalProfile,
  IAutoMovieModel,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { combinePhysicalMassProperties } from "./combinePhysicalMassProperties";
import { derivePhysicalModelJoints } from "./derivePhysicalModelJoints";
import { physicalModelRestTransforms } from "./physicalModelRestTransforms";
import { primitiveCentroid } from "./primitiveCentroid";
import { primitiveVolume } from "./primitiveVolume";
import { validatePhysicalProfile } from "./validatePhysicalProfile";

/**
 * Build a physical provider from primitive parts, density and explicit joint
 * declarations. Imported geometry requires a caller-supplied segment override.
 * Non-box primitives use conservative box colliders unless spherical/capsular
 * scale is uniform. Mass is analytic volume times density. Spheres use solid
 * sphere inertia; other primitives use their bounding-box inertia
 * approximation. Aggregation uses the parallel-axis theorem. Overrides replace
 * entire segments.
 */
export function derivePhysicalProfile(
  model: IAutoMovieModel,
  options: IAutoMovieDerivePhysicalProfile.IOptions,
): IAutoMoviePhysicalProfile {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const unit: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
  const transforms: Map<string, IAutoMovieRigidTransform> =
    physicalModelRestTransforms(model);
  const parents: Map<string, string | null> = new Map();
  if (model.skeleton) {
    for (const bone of model.skeleton.bones)
      parents.set(bone.bone, bone.parent);
  } else {
    transforms.set("root", { position: zero, rotation: identity });
    parents.set("root", null);
  }
  const root: string = [...parents].find(
    ([, parent]: [string, string | null]): boolean => parent === null,
  )![0];

  const segments: IAutoMoviePhysicalSegment[] = [];
  for (const [bone, neutral] of transforms) {
    const override: IAutoMoviePhysicalSegment | undefined =
      options.overrides?.[bone];
    if (override) {
      if (override.bone !== bone)
        throw new Error(`Physical override bone must remain ${bone}`);
      segments.push(structuredClone(override));
      continue;
    }
    const parts: IAutoMovieModel["parts"] = model.parts.filter(
      (part: IAutoMovieModel["parts"][number]): boolean =>
        (part.attachedBone ?? root) === bone,
    );
    const shapes: IAutoMoviePhysicalShape[] = [];
    let unboundInverse: IAutoMovieQuaternion | undefined;
    const values: {
      mass: number;
      center: IAutoMovieVector3;
      extent: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      shape: IAutoMoviePhysicalShape;
    }[] = [];
    for (const part of parts) {
      if (part.geometry.type !== "primitive")
        throw new Error(
          `Physical provider needs explicit collision/mass override for ${bone}/${part.id}`,
        );
      const shape: typeof part.geometry.shape = part.geometry.shape;
      const density: number =
        options.densities[part.material ?? ""] ?? options.density;
      if (density <= 0)
        throw new Error(`Physical density must be positive for ${part.id}`);
      const scale: IAutoMovieVector3 = part.transform?.scale ?? unit;
      let rotation: IAutoMovieQuaternion = part.transform?.rotation ?? identity;
      let position: IAutoMovieVector3 = part.transform?.translation ?? zero;
      if (model.skeleton && !part.attachedBone) {
        if (unboundInverse === undefined)
          unboundInverse = Quaternion.inverse(neutral.rotation);
        position = Quaternion.rotateVector(
          unboundInverse,
          Vector3.subtract(position, neutral.position),
        );
        rotation = Quaternion.multiply(unboundInverse, rotation);
      }
      const mass: number =
        primitiveVolume(shape) * scale.x * scale.y * scale.z * density;
      if (mass <= 0)
        throw new Error(
          `Physical provider requires a solid positive-volume part: ${part.id}`,
        );
      const centroid: IAutoMovieVector3 = primitiveCentroid(shape);
      const center: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: centroid.x * scale.x,
        y: centroid.y * scale.y,
        z: centroid.z * scale.z,
      });
      center.x = position.x + center.x;
      center.y = position.y + center.y;
      center.z = position.z + center.z;
      const radius: number =
        shape.type === "sphere" ||
        shape.type === "capsule" ||
        shape.type === "cylinder" ||
        shape.type === "cone"
          ? shape.radius
          : 0;
      const extent: IAutoMovieVector3 =
        shape.type === "box"
          ? {
              x: (shape.width * scale.x) / 2,
              y: (shape.height * scale.y) / 2,
              z: (shape.depth * scale.z) / 2,
            }
          : {
              x: radius * scale.x,
              y:
                (shape.type === "sphere"
                  ? radius
                  : shape.type === "capsule"
                    ? shape.height / 2 + radius
                    : shape.type === "plane"
                      ? 0
                      : shape.height / 2) * scale.y,
              z: radius * scale.z,
            };
      const collider: IAutoMoviePhysicalShape =
        shape.type === "sphere" && scale.x === scale.y && scale.y === scale.z
          ? {
              id: part.id,
              kind: "sphere",
              radius: radius * scale.x,
              material: options.material,
              transform: { position, rotation },
            }
          : shape.type === "capsule" &&
              scale.x === scale.y &&
              scale.y === scale.z
            ? {
                id: part.id,
                kind: "capsule",
                radius: radius * scale.x,
                halfLength: (shape.height * scale.y) / 2,
                material: options.material,
                transform: { position, rotation },
              }
            : {
                id: part.id,
                kind: "box",
                halfExtents: extent,
                material: options.material,
                transform: { position, rotation },
              };
      values.push({ mass, center, extent, rotation, shape: collider });
      shapes.push(collider);
    }
    if (values.length === 0)
      throw new Error(
        `Physical provider needs an explicit positive-mass override for empty bone ${bone}`,
      );
    const aggregate: IAutoMovieCombinePhysicalMassProperties.IPart =
      combinePhysicalMassProperties(
        values.map(
          (
            value: (typeof values)[number],
          ): IAutoMovieCombinePhysicalMassProperties.IPart => {
            let inertia: IAutoMovieVector3;
            if (value.shape.kind === "sphere") {
              const moment: number = 0.4 * value.mass * value.shape.radius ** 2;
              inertia = { x: moment, y: moment, z: moment };
            } else {
              // A capsule and a box both use the box of their extent; this
              // provider derives no hull. These owned extents stay unchanged.
              const x2: number = value.extent.x ** 2;
              const y2: number = value.extent.y ** 2;
              const z2: number = value.extent.z ** 2;
              inertia = {
                x: (value.mass * (y2 + z2)) / 3,
                y: (value.mass * (x2 + z2)) / 3,
                z: (value.mass * (x2 + y2)) / 3,
              };
            }
            return {
              mass: value.mass,
              centerOfMass: value.center,
              inertia,
              inertiaRotation: value.rotation,
            };
          },
        ),
      );
    segments.push({
      bone,
      neutral,
      ...aggregate,
      shapes,
    });
  }
  const mass: number = segments.reduce(
    (sum: number, segment: IAutoMoviePhysicalSegment): number =>
      sum + segment.mass,
    0,
  );
  let centerX: number = 0;
  let centerY: number = 0;
  let centerZ: number = 0;
  for (const segment of segments) {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      segment.neutral.rotation,
      segment.centerOfMass,
    );
    centerX += (segment.neutral.position.x + local.x) * segment.mass;
    centerY += (segment.neutral.position.y + local.y) * segment.mass;
    centerZ += (segment.neutral.position.z + local.z) * segment.mass;
  }
  const inverseMass: number = 1 / mass;
  const centerOfMass: IAutoMovieVector3 = {
    x: centerX * inverseMass,
    y: centerY * inverseMass,
    z: centerZ * inverseMass,
  };
  if (model.body && Math.abs(model.body.mass - mass) > 1e-8 * Math.max(1, mass))
    throw new Error(
      "Model body.mass and derived articulated profile disagree; choose density or overrides consistently",
    );
  if (
    model.body?.centerOfMass &&
    Vector3.length(Vector3.subtract(model.body.centerOfMass, centerOfMass)) >
      1e-8
  )
    throw new Error(
      "Model body.centerOfMass and articulated segment totals disagree; provide consistent segment overrides",
    );
  if (!options.joints && model.skeleton && !options.actuator)
    throw new Error(
      "A model profile needs explicit joints or explicit actuator assumptions for its rig",
    );
  const joints: IAutoMoviePhysicalJoint[] =
    options.joints ??
    (model.skeleton
      ? derivePhysicalModelJoints(model, segments, options.actuator!)
      : []);
  const profile: IAutoMoviePhysicalProfile = {
    id: model.id,
    mass,
    centerOfMass,
    segments,
    joints: structuredClone(joints),
    materials: structuredClone(options.materials),
    provenance: options.provenance,
  };
  const errors: string[] = validatePhysicalProfile(profile);
  if (errors.length)
    throw new Error(`Derived physical profile: ${errors.join(", ")}`);
  return profile;
}
