import type {
  IAutoMovieMotionGeometry,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { physicalHullFaces } from "./physicalHullFaces";

/**
 * Admit geometry and observed frames without borrowing the native mass/tree
 * contract. Every collider still has a solid shape, material, local frame and
 * known joint carriers.
 */
export function admitMotionGeometry(geometry: IAutoMovieMotionGeometry): void {
  const name: (value: string) => boolean = (value: string): boolean =>
    value.trim().length > 0;
  const positive: (value: number) => boolean = (value: number): boolean =>
    value > 0;
  const nonnegative: (value: number) => boolean = (value: number): boolean =>
    value >= 0;
  const transform: (value: IAutoMovieRigidTransform) => boolean = (
    value: IAutoMovieRigidTransform,
  ): boolean =>
    Math.abs(
      Math.hypot(
        value.rotation.x,
        value.rotation.y,
        value.rotation.z,
        value.rotation.w,
      ) - 1,
    ) <= 1e-6;
  if (!geometry.segments.length)
    throw new Error("Invalid motion geometry population");
  const materials: Map<string, IAutoMovieMotionGeometry["materials"][number]> =
    new Map();
  for (const material of geometry.materials) {
    if (
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
      !name(segment.bone) ||
      bones.has(segment.bone) ||
      !segment.shapes.length
    )
      throw new Error("Invalid motion geometry carrier");
    bones.add(segment.bone);
    const ids: Set<string> = new Set();
    for (const shape of segment.shapes) {
      const material:
        | IAutoMovieMotionGeometry["materials"][number]
        | undefined = materials.get(shape.material);
      if (
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
      } else {
        if (shape.points.length < 4)
          throw new Error("Invalid motion geometry hull");
        const hull: IAutoMoviePhysicalHullFaces.IHull = physicalHullFaces(
          shape.points,
        );
        // Convex by contract: the points span a volume and none lies inside.
        if (hull.faces.length < 4 || hull.buried > hull.tolerance)
          throw new Error("Invalid motion geometry hull");
        radius = hull.depth;
      }
      if (material.compliance > 0 && material.maximumCompression! >= radius)
        throw new Error("Invalid motion geometry rigid core");
    }
  }
  const ids: Set<string> = new Set();
  for (const joint of geometry.joints) {
    if (
      !name(joint.id) ||
      ids.has(joint.id) ||
      !bones.has(joint.parent) ||
      !bones.has(joint.child) ||
      joint.parent === joint.child ||
      !transform(joint.parentFrame) ||
      !transform(joint.childFrame)
    )
      throw new Error("Invalid motion geometry joint carrier or frame");
    ids.add(joint.id);
    const axes: Set<string> = new Set();
    for (const axis of joint.axes) {
      if (
        axes.has(axis.axis) ||
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
