import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import type { AutoMovieHumanPolygonFoot } from "./AutoMovieHumanPolygonFoot.js";

/**
 * Record actual emitted foot witnesses and initial placed full-foot heights.
 * Call during original assembly after its unparented body matrices are current.
 * Source landmarks retain ring-major identity; all foot descendants, including
 * separately articulated toes, participate in the full-foot minimum.
 *
 * @evidence contracts/common.md#principled-implementation Reads named source course/point addresses from actual Float32 mesh attributes, then uses actual initial matrixWorld transforms for body-frame heights. Parent-before-child rest identities classify all emitted foot descendants. Numerical coincidence uses gamma11 for four matrix-coefficient roundings and seven affine operations, plus a subnormal bound; no source height is moved.
 * @evidence contracts/common.md#clear-and-simple-design One measurement pass connects the original emitter's actual mesh registry to immutable initial geometry metadata; anatomy, source sampling and live physical admission retain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither hull extrema nor mean-height flattening assigns anatomical names. Full-foot minimum includes toes and can differ from every named landmark; numerical coincidence grants no floor-clearance exemption or contact certificate.
 * @evidence contracts/common.md#meaningful-documentation States initial body-frame premise, actual Float32/bone-local witnesses, complete descendant population, numerical bound and fixed reference lifetime under later setPose calls.
 * @evidence contracts/performance.md#efficient-algorithms Parent-side classification costs O(B); two side scans visit actual emitted part/vertex populations in O(P+V), with constant vector scratch and three witness records per side.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses actual emitted position buffers and current matrices rather than rebuilding or resampling source geometry; resulting initial metadata is retained once by the drawing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no native resource and returns frozen scalar/address records; temporary maps/vectors die after assembly and source descriptors are not mutated.
 */
export function measureHumanPolygonFootSupport(
  input: AutoMovieHumanPolygon.IInput,
  parts: ReadonlyMap<string, THREE.Mesh>,
):
  | {
      /** Named addresses read from actual emitted Float32 attributes. */
      plantarLandmarks: NonNullable<
        AutoMovieHumanPolygon.IDrawing["plantarLandmarks"]
      >;
      /** Fixed initial full-foot/toe height observations. */
      plantarSupport: NonNullable<
        AutoMovieHumanPolygon.IDrawing["plantarSupport"]
      >;
    }
  | undefined {
  const source: Readonly<AutoMovieHumanPolygonFoot.IInput> | undefined =
    input.footSurface;
  if (source === undefined) return undefined;
  const sides: Map<string, "left" | "right"> = new Map();
  const known: Set<string> = new Set();
  for (const bone of input.bones) {
    if (bone.parent !== null && !known.has(bone.parent))
      throw new Error(
        "Foot measurement requires parent-before-child source joints.",
      );
    known.add(bone.bone);
    const side: "left" | "right" | undefined =
      /^(left|right)(?:Foot|Subtalar|Midfoot)$/.test(bone.bone)
        ? bone.bone.startsWith("left")
          ? "left"
          : "right"
        : sides.get(bone.parent ?? "");
    if (side !== undefined) sides.set(bone.bone, side);
  }
  const at: (side: "left" | "right") => {
    landmarks: Readonly<
      Record<
        AutoMovieHumanPolygonFoot.Landmark,
        AutoMovieHumanPolygonFoot.IEmittedLandmark
      >
    >;
    support: AutoMovieHumanPolygonFoot.IPlantarSupport;
  } = (
    side: "left" | "right",
  ): {
    landmarks: Readonly<
      Record<
        AutoMovieHumanPolygonFoot.Landmark,
        AutoMovieHumanPolygonFoot.IEmittedLandmark
      >
    >;
    support: AutoMovieHumanPolygonFoot.IPlantarSupport;
  } => {
    let minimum: number = Infinity;
    let magnitude: number = 0;
    const point: THREE.Vector3 = new THREE.Vector3();
    for (const [bone, mesh] of parts) {
      if (sides.get(bone) !== side) continue;
      const positions:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      const matrix: number[] = mesh.matrixWorld.elements;
      for (let index: number = 0; index < positions.count; index++) {
        point.fromBufferAttribute(positions, index);
        const absolute: number =
          Math.abs(matrix[1]! * point.x) +
          Math.abs(matrix[5]! * point.y) +
          Math.abs(matrix[9]! * point.z) +
          Math.abs(matrix[13]!);
        magnitude = Math.max(magnitude, absolute);
        point.applyMatrix4(mesh.matrixWorld);
        if (
          !Number.isFinite(point.x) ||
          !Number.isFinite(point.y) ||
          !Number.isFinite(point.z)
        )
          throw new Error("Emitted foot contains a nonfinite placed vertex.");
        minimum = Math.min(minimum, point.y);
      }
    }
    if (!Number.isFinite(minimum + magnitude))
      throw new Error(`No finite emitted ${side} foot population.`);
    const heights: Record<AutoMovieHumanPolygonFoot.Landmark, number> = {
      plantarHeel: 0,
      medialBall: 0,
      lateralBall: 0,
    };
    const witness: (
      name: AutoMovieHumanPolygonFoot.Landmark,
    ) => AutoMovieHumanPolygonFoot.IEmittedLandmark = (
      name: AutoMovieHumanPolygonFoot.Landmark,
    ): AutoMovieHumanPolygonFoot.IEmittedLandmark => {
      const address: AutoMovieHumanPolygonFoot.ISourceLandmark =
        source[side].landmarks[name];
      const module: AutoMovieHumanPolygonFoot.IModule =
        source[side][address.module];
      const mesh: THREE.Mesh | undefined = parts.get(module.bone);
      if (mesh === undefined)
        throw new Error(`Missing actual emitted foot module ${module.bone}`);
      const positions:
        | THREE.BufferAttribute
        | THREE.InterleavedBufferAttribute =
        mesh.geometry.getAttribute("position");
      const vertexIndex: number =
        address.course * module.courses[0]!.points.length + address.point;
      if (vertexIndex >= positions.count)
        throw new Error(
          "Source foot landmark does not identify an emitted vertex.",
        );
      const localPoint: [number, number, number] = [
        positions.getX(vertexIndex),
        positions.getY(vertexIndex),
        positions.getZ(vertexIndex),
      ];
      point.set(...localPoint).applyMatrix4(mesh.matrixWorld);
      heights[name] = point.y;
      return Object.freeze({
        bone: module.bone,
        vertexIndex,
        localPoint: Object.freeze(localPoint),
      });
    };
    const landmarks: Readonly<
      Record<
        AutoMovieHumanPolygonFoot.Landmark,
        AutoMovieHumanPolygonFoot.IEmittedLandmark
      >
    > = Object.freeze({
      plantarHeel: witness("plantarHeel"),
      medialBall: witness("medialBall"),
      lateralBall: witness("lateralBall"),
    });
    const unit: number = 2 ** -24;
    const tolerance: number =
      ((11 * unit) / (1 - 11 * unit)) * magnitude + 11 * 2 ** -149;
    const contacts: AutoMovieHumanPolygonFoot.Landmark[] = (
      ["plantarHeel", "medialBall", "lateralBall"] as const
    ).filter(
      (name: AutoMovieHumanPolygonFoot.Landmark): boolean =>
        Math.abs(heights[name] - minimum) <= tolerance,
    );
    return {
      landmarks,
      support: Object.freeze({
        minimumHeight: minimum,
        landmarkHeights: Object.freeze(heights),
        contactLandmarks: Object.freeze(contacts),
        measurementTolerance: tolerance,
      }),
    };
  };
  const left: ReturnType<typeof at> = at("left");
  const right: ReturnType<typeof at> = at("right");
  return {
    plantarLandmarks: Object.freeze({
      left: left.landmarks,
      right: right.landmarks,
    }),
    plantarSupport: Object.freeze({ left: left.support, right: right.support }),
  };
}
