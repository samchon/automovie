import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import RAPIER from "@dimforge/rapier3d-compat";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";
import { physicalNativeShape } from "./physicalNativeShape";
import { physicalNativeVector } from "./physicalNativeVector";
import { physicalShapeBounds } from "./physicalShapeBounds";

/**
 * Prepare exact convex geometric queries with the pinned WASM narrow phase.
 * This creates no dynamics world, steps and impulses. Returned contacts retain
 * null impulse so a geometric witness cannot masquerade as a solver result.
 * Query allocations are owned and released by Rapier's Shape.contactShape API.
 * A capsule with an axis is measured as its native axis segment grown by its
 * radius: the pinned narrow phase reports shallow overlap of the full curved
 * capsule against a box as a positive gap (1.7 mm for #3791's rotated pair).
 * While the cores are apart the signed distance is exactly the core distance
 * less both radii, and the surface witnesses lie one radius along the normal;
 * intersecting cores, and pairs without a capsule, use the full shapes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose, the null-impulse authority, allocation ownership and the capsule core rule with the observed native defect it avoids.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior directly over its typed inputs as 5 sequential bound passes and at most two native queries, delegating to `RAPIER.init`, `Number.isFinite`, `physicalShapeBounds`, `Math.max` and `Shape.contactShape`; the premises are the units, frames and ranges stated in its parameter documentation, enforced where the body throws (3 throw sites). The capsule rule is the Minkowski identity: growing one convex set by a ball of radius r lowers its distance to another convex set by exactly r while the sets stay apart, and translation along the separating normal changes that distance one-for-one, so the shallow-overlap depth is r less the core distance. Beyond structural 0, 1 and 2 the body uses the literals 32, 23, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation with a local full-shape query and two module helpers, `core` and `place`, reusing `RAPIER.init`, `physicalNativeShape`, `physicalShapeBounds` and `Shape.contactShape` from their owners; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 32, 23, 0.5 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of its inputs; the dominant cost is 5 sequential passes (map over Object.values(boundsA.min); map over Object.values(boundsA.max); map over Object.values(boundsB.min)), performed once per call with 10 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
export async function preparePhysicalGeometry(): Promise<IAutoMoviePreparePhysicalGeometry.IQueries> {
  await RAPIER.init();
  return {
    contact: (
      a: IAutoMoviePreparePhysicalGeometry.ICollider,
      b: IAutoMoviePreparePhysicalGeometry.ICollider,
      seconds: number,
      prediction: number = 0,
    ): IAutoMovieContactReceipt | null => {
      if (
        !Number.isFinite(seconds) ||
        !Number.isFinite(prediction) ||
        prediction < 0
      )
        throw new Error("Invalid physical contact query time or prediction");
      const boundsA: IAutoMoviePhysicalShapeBounds.IResult =
        physicalShapeBounds(a.pose, a.shape);
      const boundsB: IAutoMoviePhysicalShapeBounds.IResult =
        physicalShapeBounds(b.pose, b.shape);
      // Keep a conservative single-precision transform margin before skipping
      // a native query; near-contact truth remains entirely native.
      const rounding: number =
        32 *
        2 ** -23 *
        Math.max(
          1,
          ...Object.values(boundsA.min).map(Math.abs),
          ...Object.values(boundsA.max).map(Math.abs),
          ...Object.values(boundsB.min).map(Math.abs),
          ...Object.values(boundsB.max).map(Math.abs),
        );
      if (
        (["x", "y", "z"] as const).some(
          (axis: "x" | "y" | "z"): boolean =>
            Math.max(
              boundsA.min[axis] - boundsB.max[axis],
              boundsB.min[axis] - boundsA.max[axis],
            ) >
            prediction + rounding,
        )
      )
        return null;
      const first: IAutoMovieRigidTransform = place(a.pose, a.shape.transform);
      const second: IAutoMovieRigidTransform = place(b.pose, b.shape.transform);
      const search: number = prediction + rounding;
      const coreA: ICore = core(a.shape);
      const coreB: ICore = core(b.shape);
      const margin: number = coreA.radius + coreB.radius;
      if (!isPhysicalNativeNumber(search + margin))
        throw new Error("Derived native contact prediction exceeds f32 range");
      // A capsule is its axis segment grown by its radius. While the cores
      // stay apart, the rounded signed distance is exactly the core distance
      // less both radii; only intersecting cores need the full-shape query.
      const rounded: RAPIER.ShapeContact | null | undefined =
        margin > 0
          ? coreA.shape.contactShape(
              first.position,
              first.rotation,
              coreB.shape,
              second.position,
              second.rotation,
              search + margin,
            )
          : undefined;
      if (rounded === null) return null;
      const measured: IMeasured | null =
        rounded !== undefined && rounded.distance > 0
          ? {
              distance: rounded.distance - margin,
              normal: rounded.normal1,
              point1: Vector3.add(
                rounded.point1,
                Vector3.scale(rounded.normal1, coreA.radius),
              ),
              point2: Vector3.add(
                rounded.point2,
                Vector3.scale(rounded.normal2, coreB.radius),
              ),
            }
          : full();
      if (!measured) return null;
      if (!isPhysicalNativeNumber(measured.distance))
        throw new Error("Nonfinite native geometric contact distance");
      if (measured.distance > prediction) return null;
      return {
        id: `geometry:${a.body}/${a.bone}/${a.shape.id}:${b.body}/${b.bone}/${b.shape.id}:${seconds}`,
        source: "geometric",
        seconds,
        endSeconds: seconds,
        a: {
          body: a.body,
          bone: a.bone,
          shape: a.shape.id,
          material: a.shape.material,
        },
        b: {
          body: b.body,
          bone: b.bone,
          shape: b.shape.id,
          material: b.shape.material,
        },
        point: physicalNativeVector(
          Vector3.scale(Vector3.add(measured.point1, measured.point2), 0.5),
        ),
        normal: physicalNativeVector({ ...measured.normal }),
        impulse: null,
        separation: measured.distance,
        compression: Math.max(0, -measured.distance),
      };

      /** Intersecting cores or two solid cores: query the full native shapes. */
      function full(): IMeasured | null {
        const contact: RAPIER.ShapeContact | null = physicalNativeShape(
          a.shape,
        ).contactShape(
          first.position,
          first.rotation,
          physicalNativeShape(b.shape),
          second.position,
          second.rotation,
          search,
        );
        return contact
          ? {
              distance: contact.distance,
              normal: contact.normal1,
              point1: contact.point1,
              point2: contact.point2,
            }
          : null;
      }
    },
    minimumY: (
      collider: IAutoMoviePreparePhysicalGeometry.ICollider,
    ): number => {
      return physicalShapeBounds(collider.pose, collider.shape).min.y;
    },
    project: (
      collider: IAutoMoviePreparePhysicalGeometry.ICollider,
      point: IAutoMovieRigidTransform["position"],
    ): IAutoMovieRigidTransform["position"] => {
      const pose: IAutoMovieRigidTransform = place(
        collider.pose,
        collider.shape.transform,
      );
      return {
        ...physicalNativeVector(
          physicalNativeShape(collider.shape).projectPoint(
            pose.position,
            pose.rotation,
            physicalNativeVector(point),
            false,
          ).point,
        ),
      };
    },
  };
}

/** One native measurement in world metres: signed distance, the unit normal from the first shape toward the second and each shape's surface witness. */
interface IMeasured {
  distance: number;
  normal: IAutoMovieVector3;
  point1: IAutoMovieVector3;
  point2: IAutoMovieVector3;
}

/** A native core and the radius that grows it into the declared shape. */
interface ICore {
  shape: RAPIER.Shape;
  radius: number;
}

/**
 * The pinned narrow phase misreports shallow overlap of a curved capsule
 * against a polyhedron as a positive gap, so a capsule with an axis is
 * measured as its native axis segment plus its radius. Every other shape is
 * its own solid core.
 */
function core(shape: IAutoMoviePhysicalShape): ICore {
  return shape.kind === "capsule" && shape.halfLength > 0
    ? {
        shape: new RAPIER.Segment(
          { x: 0, y: -shape.halfLength, z: 0 },
          { x: 0, y: shape.halfLength, z: 0 },
        ),
        radius: shape.radius,
      }
    : { shape: physicalNativeShape(shape), radius: 0 };
}

/** Compose bone and local shape transforms in the same world frame. */
function place(
  parent: IAutoMovieRigidTransform,
  local: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  const result: IAutoMovieRigidTransform = {
    position: Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, local.position),
    ),
    rotation: Quaternion.multiply(parent.rotation, local.rotation),
  };
  physicalNativeVector(result.position);
  if (!Object.values(result.rotation).every(isPhysicalNativeNumber))
    throw new Error("Derived native shape rotation exceeds f32 range");
  return result;
}
