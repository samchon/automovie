import type {
  IAutoMovieBone,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
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
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Rest frames and ordered part buckets precede per-segment derivation. Each segment completes primitive admission before mass aggregation; final mass, neutral centre, joint derivation and profile validation remain separate phases owned by their existing helpers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Geometry, density, material, actuator and override choices come from the current call. The existing 0.4 solid-sphere and one-third box half-extent factors are physical formulas, and consistency tolerances are unchanged. The actuator non-null assertion follows the explicit missing-actuator rejection; no mutable model is cached or repaired.
 * @evidence contracts/development/implementation.md#efficient-algorithms For B bones and P parts, ordered bucketing and primitive derivation take O(B+P), replacing a full part filter per bone; rest-frame and joint helpers retain their own rig-validation cost. Each bone aggregates its own parts, with the eigensolver's fixed sweep bound. Storage is O(B+P) besides cloned declared joints and materials; fresh centres are reused within their owning reduction instead of allocating addition and weighting vectors. One sphere moment serves all three axes, and each box half-extent is squared once. No measured speedup is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Parts are grouped once by their current attached bone, retaining source order. A neutral inverse is computed only when that bone first consumes an unattached part and reused for the same fixed neutral transform. The owned intermediate part shares its identical sphere moment or squared half-extents without changing the original products and sums. All reuse lives only in this call; the next call reads all mutable model and option values again.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Buckets and intermediate primitive mass records are bounded by this call's bones and parts and become unreachable on return or throw. Returned profile records and cloned overrides, joints and materials transfer to the caller; no body, task or external handle is retained between calls.
 */
export function derivePhysicalProfile(
  model: IAutoMovieModel,
  options: derivePhysicalProfile.IOptions,
): P {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const unit: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };
  const transforms: Map<string, P.ITransform> =
    physicalModelRestTransforms(model);
  if (!model.skeleton)
    transforms.set("root", { position: zero, rotation: identity });
  const root: string =
    model.skeleton?.bones.find(
      (bone: IAutoMovieBone): boolean => bone.parent === null,
    )?.bone ?? "root";
  const grouped: Map<string, IAutoMovieModel["parts"]> = new Map();
  for (const part of model.parts) {
    const bone: string = part.attachedBone ?? root;
    let parts: IAutoMovieModel["parts"] | undefined = grouped.get(bone);
    if (parts === undefined) {
      parts = [];
      grouped.set(bone, parts);
    }
    parts.push(part);
  }

  const segments: P.ISegment[] = [];
  for (const [bone, neutral] of transforms) {
    const override: P.ISegment | undefined = options.overrides?.[bone];
    if (override) {
      if (override.bone !== bone)
        throw new Error(`Physical override bone must remain ${bone}`);
      segments.push(structuredClone(override));
      continue;
    }
    const parts: IAutoMovieModel["parts"] = grouped.get(bone) ?? [];
    const shapes: P.IShape[] = [];
    let unboundInverse: IAutoMovieQuaternion | undefined;
    const values: {
      mass: number;
      center: IAutoMovieVector3;
      extent: IAutoMovieVector3;
      rotation: IAutoMovieQuaternion;
      shape: P.IShape;
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
      const collider: P.IShape =
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
    const aggregate: combinePhysicalMassProperties.IPart =
      combinePhysicalMassProperties(
        values.map(
          (
            value: (typeof values)[number],
          ): combinePhysicalMassProperties.IPart => {
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
    (sum: number, segment: P.ISegment): number => sum + segment.mass,
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
  const joints: P.IJoint[] =
    options.joints ??
    (model.skeleton
      ? derivePhysicalModelJoints(model, segments, options.actuator!)
      : []);
  const profile: P = {
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

/**
 * Density and full overrides keep model content out of Engine.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents density, physical materials, explicit joint or actuator inputs, full segment overrides and provenance with their units and absence rules.
 * @evidence contracts/development/design.md#principled-representation IOptions separates physical declarations from optical model geometry. Absent per-material densities use density; absent overrides derive primitives; absent joints require actuator assumptions for a rig. All physical frames and result types reuse the interface profile contract.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The existing derivePhysicalProfile entry point owns this single companion options interface, consumed by the physical model provider and fixture producers. No new producer or option is added for the reduction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named bone and optical-material maps express existing caller keys, while material ids remain explicit profile references. No cast, untyped payload, inferred anatomical density or implicit actuator strength replaces a physical declaration.
 */
export namespace derivePhysicalProfile {
  /** All masses are kg and density is kg/m³. */
  export interface IOptions {
    /** Default declared density, not inferred from names. */
    density: number;

    /** Per-optical-material density overrides. */
    densities: Record<string, number>;

    /** Physical material applied to derived colliders. */
    material: string;

    /** Physical contact materials. */
    materials: P.IMaterial[];

    /** Explicit solver-neutral frames and angular limits replace rig derivation. */
    joints?: P.IJoint[];

    /** Required when deriving joints from the model's canonical clinical axes and ROM. */
    actuator?: {
      /** Radians per second. */
      frequency: number;

      /** Critical-damping ratio. */
      dampingRatio: number;

      /** N m per kg of downstream segments. */
      torquePerKg: number;

      /** Passive angular decay rate, 1/s; zero by default. */
      passiveRate?: number;
    };

    /** Complete per-bone replacements, including imported collision proxies. */
    overrides?: Record<string, P.ISegment>;

    /** Source and uncertainty of density, collision proxies and joint data. */
    provenance: string;
  }
}
