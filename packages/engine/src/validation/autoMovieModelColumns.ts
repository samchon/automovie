import {
  AutoMovieHumanoidBone,
  AutoMoviePrimitiveShape,
  IAutoMovieBone,
  IAutoMovieGeometry,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PRIMITIVE_RADIAL_SEGMENTS } from "../geometry/constants/PRIMITIVE_RADIAL_SEGMENTS";
import { PRIMITIVE_SPHERE_RINGS } from "../geometry/constants/PRIMITIVE_SPHERE_RINGS";
import { IAutoMovieModelColumn } from "./IAutoMovieModelColumn";

/**
 * Measure filled rest-axis cores of the engine's tessellated primitive solids.
 *
 * @evidence contracts/common.md#principled-implementation Repeated ancestry passes resolve axial unit-scale rest chains whose actual yaw matrix has horizontal gain exactly one. Radial polygon apothems bound cylinder/cone cores; the sphere contains a ball of radius R*cos(pi/segments)*cos(pi/(2*rings)), which contains an equal-radius/half-height cylinder after division by sqrt(2). Primitive resolution comes from the tessellator's shared constants.
 * @evidence contracts/common.md#clear-and-simple-design Formation overlap consumes these rest-axis quantities independently of outer projection radii, so the required no-invented-occupancy meaning must survive any correction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported meshes/planes, off-axis or nonunit-scale ancestry, nonisometric axial rest/part rotations, unrepresentable primitive total height/scaled outer envelope and nonfinite output intervals produce no column. Omission loses detections without normalizing authored rotations or changing model admission; capsule cores lie inside the central cylindrical body without certifying the rounded silhouette or repairing extreme producer output.
 * @evidence contracts/common.md#meaningful-documentation Defines model-origin metre intervals and rest-pose scope, per-axis part scaling, mathematically inscribed CPU-double mesh cores and omitted cases. GPU Float32 narrowing and animated deformation are outside this numerical guarantee.
 * @evidence contracts/performance.md#efficient-algorithms For B bones and P parts, repeated settling can take O(B^2) and part lookup O(P), with O(B+P) working/output storage; this is not a single linear parent walk.
 * @evidence contracts/performance.md#reuse-equivalent-work One ancestry-height map serves all parts; each core and outer-envelope admission is computed once per part, without a retained cache of mutable model generations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh scalar column rows transfer to the caller; the height map is discarded and no part, skeleton, appearance asset or host handle is retained.
 */
export const autoMovieModelColumns: (
  model: Pick<IAutoMovieModel, "parts" | "skeleton">,
) => IAutoMovieModelColumn[] = (
  model: Pick<IAutoMovieModel, "parts" | "skeleton">,
): IAutoMovieModelColumn[] => {
  const heights: Map<AutoMovieHumanoidBone, number> = axialBoneHeights(
    model.skeleton,
  );
  return model.parts.flatMap(
    (part: IAutoMovieModelPart): IAutoMovieModelColumn[] => {
      const column: IAutoMovieModelColumn | null = axialPartColumn(
        part,
        heights,
      );
      return column === null ? [] : [column];
    },
  );
};

/**
 * Where each bone rests on the model's own vertical axis, above its origin.
 *
 * A bone is on that axis when it and every bone above it rest with no sideways
 * displacement and no turn out of the vertical, which is exactly when adding up
 * the chain's heights gives the bone's real resting height. A bone that fails
 * either test, has nonunit scale or nonisometric yaw, or has an omitted parent, is absent: its parts are
 * then not measured, which costs the gate a column and never gives it a wrong
 * one.
 *
 * Resolved by repeated passes rather than by walking parents, because bones are
 * not required to be listed above their children, and a chain that never
 * resolves because a parent is missing, off-axis or cyclic simply stops adding
 * heights instead of needing a separate cycle guard.
 */
const axialBoneHeights: (
  skeleton: IAutoMovieSkeleton | null,
) => Map<AutoMovieHumanoidBone, number> = (
  skeleton: IAutoMovieModel["skeleton"],
): Map<AutoMovieHumanoidBone, number> => {
  const heights: Map<AutoMovieHumanoidBone, number> = new Map<
    AutoMovieHumanoidBone,
    number
  >();
  const axial: IAutoMovieBone[] = (skeleton?.bones ?? []).filter(
    (bone: IAutoMovieBone): boolean =>
      bone.rest.translation.x === 0 &&
      bone.rest.translation.z === 0 &&
      axialIsometry(bone.rest.rotation) &&
      bone.rest.scale.x === 1 &&
      bone.rest.scale.y === 1 &&
      bone.rest.scale.z === 1,
  );
  let settled: boolean = true;
  while (settled) {
    settled = false;
    for (const bone of axial) {
      if (heights.has(bone.bone)) continue;
      const above: number | undefined =
        bone.parent === null ? 0 : heights.get(bone.parent);
      if (above === undefined) continue;
      heights.set(bone.bone, above + bone.rest.translation.y);
      settled = true;
    }
  }
  return heights;
};

/**
 * The column one part fills on its model's axis, or `null` when it fills none.
 *
 * A part's own scale is applied rather than refused, because a scaled part is
 * still a solid: each horizontal reach is stretched by its own factor and the
 * disc inside the result is the narrower of the two, while a mirrored part
 * occupies exactly what its unmirrored twin did. That is also what makes one
 * reading at the end enough: a nonpositive dimension or a scale that erases one
 * arrives here as a column with nothing inside it.
 */
const axialPartColumn: (
  part: IAutoMovieModelPart,
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
) => IAutoMovieModelColumn | null = (
  part: IAutoMovieModel["parts"][number],
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
): IAutoMovieModelColumn | null => {
  const solid: {
    across: number;
    deep: number;
    centre: number;
    half: number;
  } | null = columnOfShape(part.geometry);
  if (solid === null) return null;
  const base: number | null = axialPartHeight(part, heights);
  if (base === null) return null;
  const scale: IAutoMovieVector3 =
    part.transform === null ? UNIT_SCALE : part.transform.scale;
  const outer: IAutoMovieVector3 | null = primitiveOuterExtents(part.geometry);
  if (outer === null) return null;
  const outerRadius: number = Math.hypot(
    outer.x * Math.abs(scale.x),
    outer.z * Math.abs(scale.z),
  );
  const outerHalf: number = outer.y * Math.abs(scale.y);
  // The horizontal box diagonal bounds every permitted axial heading. Both
  // translated outer Y ends must remain representable, not merely the smaller core.
  if (
    !Number.isFinite(outerRadius) ||
    !Number.isFinite(base - outerHalf) ||
    !Number.isFinite(base + outerHalf)
  )
    return null;
  const radius: number = Math.min(
    solid.across * Math.abs(scale.x),
    solid.deep * Math.abs(scale.z),
  );
  const centre: number = base + solid.centre * scale.y;
  const half: number = solid.half * Math.abs(scale.y);
  const bottom: number = centre - half;
  const top: number = centre + half;
  return finitePositive(radius) &&
    finitePositive(half) &&
    Number.isFinite(bottom) &&
    Number.isFinite(top)
    ? { radius, bottom, top }
    : null;
};

/** The scale a part with no transform of its own is drawn at. */
const UNIT_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/** Half-extents of the primitive envelope for scaled-envelope admission; the capsule's conservative admission requires a finite total H+2R. */
function primitiveOuterExtents(
  geometry: IAutoMovieGeometry,
): IAutoMovieVector3 | null {
  if (geometry.type !== "primitive") return null;
  const shape: AutoMoviePrimitiveShape = geometry.shape;
  switch (shape.type) {
    case "box":
      return { x: shape.width / 2, y: shape.height / 2, z: shape.depth / 2 };
    case "sphere":
      return { x: shape.radius, y: shape.radius, z: shape.radius };
    case "cylinder":
    case "cone":
      return { x: shape.radius, y: shape.height / 2, z: shape.radius };
    case "capsule": {
      const totalHeight: number = shape.height + 2 * shape.radius;
      return Number.isFinite(totalHeight)
        ? { x: shape.radius, y: totalHeight / 2, z: shape.radius }
        : null;
    }
    case "plane":
      return null;
    default:
      return null;
  }
}

/**
 * Height above the model's origin at which one part rides, or `null` off-axis.
 *
 * A part rides a bone, or the model's origin when it rides no bone at all, and
 * then its own transform moves it again. Either step can take it off the axis
 * this gate measures about, and a part it cannot place is a part it does not
 * measure.
 */
const axialPartHeight: (
  part: IAutoMovieModelPart,
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
) => number | null = (
  part: IAutoMovieModel["parts"][number],
  heights: ReadonlyMap<AutoMovieHumanoidBone, number>,
): number | null => {
  const bone: number | undefined =
    part.attachedBone === null ? 0 : heights.get(part.attachedBone);
  if (bone === undefined) return null;
  const local: IAutoMovieTransform | null = part.transform;
  if (local === null) return bone;
  return vertical(local.translation) && axialIsometry(local.rotation)
    ? bone + local.translation.y
    : null;
};

/**
 * True when one displacement or turn leaves the model's vertical axis alone.
 *
 * A quaternion with no `x` and no `z` part turns about the vertical and nothing
 * else, which is exactly the turn a column of circular section does not notice.
 * A displacement with neither is a move straight up or down the axis it already
 * stood on.
 */
const vertical: (value: { x: number; z: number }) => boolean = (value: {
  x: number;
  z: number;
}): boolean => value.x === 0 && value.z === 0;

/** A pure axial TRS matrix preserves horizontal lengths only when hypot(1-2*y*y,2*y*w) is one. Near-unit admission permits shrinkage or expansion, so those frames are omitted without an epsilon or quaternion repair. Binary64 equality can also omit a mathematically unit authored rotation after rounding. */
function axialIsometry(rotation: IAutoMovieQuaternion): boolean {
  return (
    vertical(rotation) &&
    Math.hypot(1 - 2 * rotation.y * rotation.y, 2 * rotation.y * rotation.w) ===
      1
  );
}

/**
 * The solid one primitive shape certainly holds, as half-extents about its own
 * centre.
 *
 * Radial polygons use their apothem, not their vertex radius. The sphere core
 * uses the centered ball bounded by every latitude-cell face plane. These are
 * the CPU tessellator's solids; Float32 rendering is a separate narrowing step.
 * Read as two horizontal reaches and a height rather than as a finished disc,
 * because the part's scale stretches the two reaches by different factors and
 * the disc inside the result is the narrower of them. A cone tapers, so what it
 * certainly holds is half its base apothem over its wider half; a plane has no
 * thickness, so nothing is ever inside one; a mesh states no dimensions here
 * and is left to the parts that do.
 */
const columnOfShape: (
  geometry: IAutoMovieGeometry,
) => { across: number; deep: number; centre: number; half: number } | null = (
  geometry: IAutoMovieModel["parts"][number]["geometry"],
): { across: number; deep: number; centre: number; half: number } | null => {
  if (geometry.type !== "primitive") return null;
  const shape: AutoMoviePrimitiveShape = geometry.shape;
  const radialApothem: number = Math.cos(Math.PI / PRIMITIVE_RADIAL_SEGMENTS);
  if (shape.type === "sphere") {
    // Each latitude-cell plane is sin(mu)*u/cos(delta) + cos(mu)*y =
    // R*cos(epsilon), and its normal length is at most 1/cos(delta).
    // Thus the mesh contains a centered ball of radius rho below; an equal
    // radius/half-height cylinder lies in that ball because r*r + h*h = rho*rho.
    const core: number =
      (shape.radius *
        radialApothem *
        Math.cos(Math.PI / (2 * PRIMITIVE_SPHERE_RINGS))) /
      Math.SQRT2;
    return {
      across: core,
      deep: core,
      centre: 0,
      half: core,
    };
  }
  if (shape.type === "capsule" || shape.type === "cylinder")
    return {
      across: shape.radius * radialApothem,
      deep: shape.radius * radialApothem,
      centre: 0,
      half: shape.height / 2,
    };
  if (shape.type === "cone")
    return {
      across: (shape.radius / 2) * radialApothem,
      deep: (shape.radius / 2) * radialApothem,
      centre: shape.height / 4,
      half: shape.height / 4,
    };
  if (shape.type === "box")
    return {
      across: shape.width / 2,
      deep: shape.depth / 2,
      centre: 0,
      half: shape.height / 2,
    };
  return null;
};

const finitePositive: (value: number) => boolean = (value: number): boolean =>
  Number.isFinite(value) && value > 0;
