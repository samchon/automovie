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
 * sphere inertia; other primitives use their bounding-box inertia approximation.
 * Aggregation uses the parallel-axis theorem. Overrides replace entire segments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines primitive density, collider and inertia approximations, local segment frames and complete overrides; options document SI units and the provenance the caller must supply.
 * @evidence contracts/development/implementation.md#principled-implementation Uses analytic primitive volume and centroid, solid-sphere inertia or the declared bounding-box approximation, then the parallel-axis theorem. Rest FK fixes segment frames; unattached parts are changed from model to the root's neutral frame. Positive finite density and part mass precede aggregate admission, followed by body consistency at the existing 1e-8 threshold and full profile validation. Imported geometry and empty segments require full overrides; no hull or more accurate capsule inertia is claimed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Original rest/parent preparation precedes per-segment override validation. Only a segment with no complete override filters current parts, then completes primitive admission before aggregation; final mass, neutral centre, joint derivation and profile validation keep their existing owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Geometry, density, material, actuator and override choices come from the current call. An override is validated and cloned before any parts read for that bone; all-overridden models never read parts. Raw parent, model.parts and attachedBone observations retain their original order and frequency. Physical formulas, consistency tolerances and missing-actuator rejection remain unchanged; no mutable model is cached or repaired.
 * @evidence contracts/development/implementation.md#efficient-algorithms For B bones and P parts, the general raw path retains O(B*P) filtering because model/getter stability is not asserted; complete overrides skip those scans entirely. Rest/joint helpers retain their validation cost and each bone aggregates its selected parts. Private owned intermediate reductions reuse centres, one sphere moment, squared half-extents and one neutral inverse without changing the original products/sums; runtime gains are unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every unoverridden bone reads the current parts and attachment fields at its original observation point. Only its actually owned fixed neutral transform and fresh intermediate numerical records share repeated inverse, sphere-moment and squared-extent work. There is no cross-bone public-input snapshot or cross-call numerical cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A temporary parent map, selected-part arrays and primitive mass records are bounded by this call's bones and parts and release on return or throw. Returned profile records and cloned overrides, joints and materials transfer to the caller; no body, task or external handle is retained between calls.
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
    const override: IAutoMoviePhysicalSegment | undefined = options.overrides?.[bone];
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
      if (!(density > 0) || !Number.isFinite(density))
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
      if (!(mass > 0) || !Number.isFinite(mass))
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
    (sum: number, segment: IAutoMoviePhysicalSegment): number => sum + segment.mass,
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
