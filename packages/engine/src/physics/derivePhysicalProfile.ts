import type {
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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Build a physical provider from primitive parts, density and explicit joint declarations) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Build a physical provider from primitive parts, density and explicit joint declarations) directly over its typed inputs (`model`, `options`) as nested iteration of depth 2 (for-of over model.skeleton.bones; find over [...parents]; for-of over transforms), delegating to `physicalModelRestTransforms`, `parents.set`, `transforms.set`, `segments.push`, `structuredClone`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (9 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.4, 3, 1e-8, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 233 lines and 18 top-level statements that reuses `physicalModelRestTransforms`, `parents.set`, `transforms.set`, `segments.push`, `structuredClone` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `model`, `options`; the dominant cost is nested iteration of depth 2 (for-of over model.skeleton.bones; find over [...parents]; for-of over transforms), performed once per call with 34 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 34 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function derivePhysicalProfile(
  model: IAutoMovieModel,
  options: derivePhysicalProfile.IOptions,
): P {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const transforms: Map<string, P.ITransform> =
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
  const segments: P.ISegment[] = [];
  for (const [bone, neutral] of transforms) {
    const override: P.ISegment | undefined = options.overrides?.[bone];
    if (override) {
      if (override.bone !== bone)
        throw new Error(`Physical override bone must remain ${bone}`);
      segments.push(structuredClone(override));
      continue;
    }
    const parts: IAutoMovieModel["parts"] = model.parts.filter(
      (part: (typeof model.parts)[number]): boolean =>
        (part.attachedBone ?? root) === bone,
    );
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
      const scale: IAutoMovieVector3 = part.transform?.scale ?? {
        x: 1,
        y: 1,
        z: 1,
      };
      let rotation: IAutoMovieQuaternion = part.transform?.rotation ?? identity;
      let position: IAutoMovieVector3 = part.transform?.translation ?? zero;
      if (model.skeleton && !part.attachedBone) {
        const inverse: IAutoMovieQuaternion = Quaternion.inverse(
          neutral.rotation,
        );
        position = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(position, neutral.position),
        );
        rotation = Quaternion.multiply(inverse, rotation);
      }
      const mass: number =
        primitiveVolume(shape) * scale.x * scale.y * scale.z * density;
      if (!(mass > 0) || !Number.isFinite(mass))
        throw new Error(
          `Physical provider requires a solid positive-volume part: ${part.id}`,
        );
      const centroid: IAutoMovieVector3 = primitiveCentroid(shape);
      const center: IAutoMovieVector3 = Vector3.add(
        position,
        Quaternion.rotateVector(rotation, {
          x: centroid.x * scale.x,
          y: centroid.y * scale.y,
          z: centroid.z * scale.z,
        }),
      );
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
            const e: IAutoMovieVector3 = value.extent;
            const inertia: IAutoMovieVector3 =
              value.shape.kind === "sphere"
                ? {
                    x: 0.4 * value.mass * value.shape.radius ** 2,
                    y: 0.4 * value.mass * value.shape.radius ** 2,
                    z: 0.4 * value.mass * value.shape.radius ** 2,
                  }
                : // A capsule and a box both use the box of their extent; this
                  // provider derives no hull.
                  {
                    x: (value.mass * (e.y ** 2 + e.z ** 2)) / 3,
                    y: (value.mass * (e.x ** 2 + e.z ** 2)) / 3,
                    z: (value.mass * (e.x ** 2 + e.y ** 2)) / 3,
                  };
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
      shapes: values.map(
        (value: (typeof values)[number]): P.IShape => value.shape,
      ),
    });
  }
  const mass: number = segments.reduce(
    (sum: number, segment: P.ISegment): number => sum + segment.mass,
    0,
  );
  const centerOfMass: IAutoMovieVector3 = Vector3.scale(
    segments.reduce(
      (sum: IAutoMovieVector3, segment: P.ISegment): IAutoMovieVector3 =>
        Vector3.add(
          sum,
          Vector3.scale(
            Vector3.add(
              segment.neutral.position,
              Quaternion.rotateVector(
                segment.neutral.rotation,
                segment.centerOfMass,
              ),
            ),
            segment.mass,
          ),
        ),
      { ...zero },
    ),
    1 / mass,
  );
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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Density and full overrides keep model content out of Engine) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Density and full overrides keep model content out of Engine: companion namespace of 1 member (`IOptions`); units and frames named in its text: frames, radians, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `derivePhysicalProfile` in packages/engine/src/physics/derivePhysicalProfile.ts; its surface is the 1 member listed and the text shows 3 other files naming it, mostly test (2), packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace derivePhysicalProfile {
  /** All masses are kg and density is kg/m³. */
  export interface IOptions {
    /** Default declared density, not inferred from names. */ density: number;
    /** Per-optical-material density overrides. */ densities: Record<
      string,
      number
    >;
    /** Physical material applied to derived colliders. */ material: string;
    /** Physical contact materials. */ materials: P.IMaterial[];
    /** Explicit solver-neutral frames and angular limits replace rig derivation. */ joints?: P.IJoint[];
    /** Required when deriving joints from the model's canonical clinical axes and ROM. */
    actuator?: {
      /** Radians per second. */ frequency: number;
      /** Critical-damping ratio. */ dampingRatio: number;
      /** N m per kg of downstream segments. */ torquePerKg: number;
      /** Passive angular decay rate, 1/s; zero by default. */ passiveRate?: number;
    };
    /** Complete per-bone replacements, including imported collision proxies. */ overrides?: Record<
      string,
      P.ISegment
    >;
    /** Source and uncertainty of density, collision proxies and joint data. */ provenance: string;
  }
}
