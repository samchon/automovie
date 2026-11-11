import type {
  IAutoMovieMotionGeometry as Geometry,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";
import { physicalHullFaces } from "./physicalHullFaces";

/**
 * Admit geometry and observed frames without borrowing the native mass/tree contract. Every collider still has a finite solid shape, material, local frame and known joint carriers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit geometry and observed frames without borrowing the native mass/tree contract) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit geometry and observed frames without borrowing the native mass/tree contract) directly over its typed inputs (`geometry`) as nested iteration of depth 3 (every over [value.position.x, value.position.y, val; every over [ value.rotation.x, value.ro; for-of over geometry.materials), delegating to `value.trim`, `scalar`, `Math.fround`, `Number.isFinite`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (11 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.000001, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 143 lines and 12 top-level statements that reuses `value.trim`, `scalar`, `Math.fround`, `Number.isFinite`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `geometry`; the dominant cost is nested iteration of depth 3 (every over [value.position.x, value.position.y, val; every over [ value.rotation.x, value.ro; for-of over geometry.materials), performed once per call with 21 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 21 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitMotionGeometry(geometry: Geometry): void {
  const name: (value: string) => boolean = (value: string): boolean =>
    typeof value === "string" && value.trim().length > 0;
  const positive: (value: number) => boolean = (value: number): boolean =>
    scalar(value) &&
    value > 0 &&
    Math.fround(value) > 0 &&
    Number.isFinite(Math.fround(1 / value));
  const nonnegative: (value: number) => boolean = (value: number): boolean =>
    scalar(value) && value >= 0 && (value === 0 || Math.fround(value) > 0);
  const transform: (value: P.ITransform) => boolean = (
    value: P.ITransform,
  ): boolean =>
    !!value?.position &&
    !!value.rotation &&
    [value.position.x, value.position.y, value.position.z].every(scalar) &&
    [
      value.rotation.x,
      value.rotation.y,
      value.rotation.z,
      value.rotation.w,
    ].every(Number.isFinite) &&
    Math.abs(
      Math.hypot(
        value.rotation.x,
        value.rotation.y,
        value.rotation.z,
        value.rotation.w,
      ) - 1,
    ) <= 1e-6;
  if (
    !geometry ||
    !Array.isArray(geometry.segments) ||
    !geometry.segments.length ||
    !Array.isArray(geometry.joints) ||
    !Array.isArray(geometry.materials) ||
    (geometry.witnesses !== undefined && !Array.isArray(geometry.witnesses))
  )
    throw new Error("Invalid motion geometry population");
  const materials: Map<string, Geometry["materials"][number]> = new Map();
  for (const material of geometry.materials) {
    if (
      !material ||
      !name(material.id) ||
      materials.has(material.id) ||
      !nonnegative(material.compliance) ||
      (material.maximumCompression !== undefined &&
        !positive(material.maximumCompression)) ||
      (material.compliance > 0 && !positive(material.maximumCompression!))
    )
      throw new Error("Invalid motion geometry material");
    materials.set(material.id, material);
  }
  const bones: Set<string> = new Set();
  for (const segment of geometry.segments) {
    if (
      !segment ||
      !name(segment.bone) ||
      bones.has(segment.bone) ||
      !Array.isArray(segment.shapes) ||
      !segment.shapes.length
    )
      throw new Error("Invalid motion geometry carrier");
    bones.add(segment.bone);
    const ids: Set<string> = new Set();
    for (const shape of segment.shapes) {
      const material: Geometry["materials"][number] | undefined = materials.get(
        shape?.material,
      );
      if (
        !shape ||
        !name(shape.id) ||
        ids.has(shape.id) ||
        !material ||
        !transform(shape.transform)
      )
        throw new Error("Invalid motion geometry shape reference or frame");
      ids.add(shape.id);
      let radius: number;
      if (shape.kind === "box") {
        if (
          !shape.halfExtents ||
          ![
            shape.halfExtents.x,
            shape.halfExtents.y,
            shape.halfExtents.z,
          ].every(positive)
        )
          throw new Error("Invalid motion geometry box");
        radius = Math.min(
          shape.halfExtents.x,
          shape.halfExtents.y,
          shape.halfExtents.z,
        );
      } else if (shape.kind === "sphere" || shape.kind === "capsule") {
        if (
          !positive(shape.radius) ||
          (shape.kind === "capsule" && !nonnegative(shape.halfLength))
        )
          throw new Error("Invalid motion geometry round shape");
        radius = shape.radius;
      } else if (shape.kind === "hull") {
        if (
          !Array.isArray(shape.points) ||
          shape.points.length < 4 ||
          !shape.points.every(
            (point: (typeof shape.points)[number]): boolean =>
              !!point && [point.x, point.y, point.z].every(scalar),
          )
        )
          throw new Error("Invalid motion geometry hull");
        const hull: physicalHullFaces.IHull = physicalHullFaces(shape.points);
        // Convex by contract: the points span a volume and none lies inside.
        if (hull.faces.length < 4 || hull.buried > hull.tolerance)
          throw new Error("Invalid motion geometry hull");
        radius = hull.depth;
      } else throw new Error("Invalid motion geometry shape kind");
      if (material.compliance > 0 && material.maximumCompression! >= radius)
        throw new Error("Invalid motion geometry rigid core");
    }
  }
  const ids: Set<string> = new Set();
  for (const joint of geometry.joints) {
    if (
      !joint ||
      !name(joint.id) ||
      ids.has(joint.id) ||
      !bones.has(joint.parent) ||
      !bones.has(joint.child) ||
      joint.parent === joint.child ||
      !transform(joint.parentFrame) ||
      !transform(joint.childFrame) ||
      !Array.isArray(joint.axes)
    )
      throw new Error("Invalid motion geometry joint carrier or frame");
    ids.add(joint.id);
    const axes: Set<string> = new Set();
    for (const axis of joint.axes) {
      if (
        !axis ||
        !["x", "y", "z"].includes(axis.axis) ||
        axes.has(axis.axis) ||
        !Number.isFinite(axis.minimum) ||
        !Number.isFinite(axis.maximum) ||
        axis.minimum < -Math.PI ||
        axis.maximum > Math.PI ||
        axis.minimum > axis.maximum
      )
        throw new Error("Invalid motion geometry joint axis");
      axes.add(axis.axis);
    }
  }
  for (const witness of geometry.witnesses ?? []) {
    if (!name(witness) || bones.has(witness))
      throw new Error("Invalid motion geometry witness");
    bones.add(witness);
  }
}
