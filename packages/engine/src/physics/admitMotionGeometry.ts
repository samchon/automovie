import type {
  IAutoMovieMotionGeometry as Geometry,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";

/** Admit geometry and observed frames without borrowing the native mass/tree contract. Every collider still has a finite solid shape, material, local frame and known joint carriers. */
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
