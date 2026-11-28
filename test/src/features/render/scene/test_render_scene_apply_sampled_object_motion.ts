import type { IAutoMovieSampledChannel } from "@automovie/interface";
import {
  applySampledObjectMotion
} from "../../../../../packages/render/src/scene/internal/applySampledObjectMotion";
import { TestValidator } from "@nestia/e2e";
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Line,
  Mesh,
  Object3D,
  Points,
} from "three";

import { nclose, vclose } from "../../internal/predicates";

/** Assignments and comparisons here use exactly representable binary fractions. */
const CHANNEL_TOLERANCE: number = 0;

/**
 * Apply already sampled channels in parent-local transform and morph index
 * order.
 *
 * Scenarios:
 *
 * 1. Translation, quaternion and scale write independently under a translated
 *    parent. An absent object and a pointer cannot write a node field.
 * 2. The same morph sample writes mesh, line and point descendants. It truncates
 *    at a short target and preserves the unused tail of a longer target.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names separate transform writes, unresolved object and pointer behavior, and short and long morph targets.
 * @evidence contracts/development/testing.md#behavioral-verification Feeds typed sampled channels to the renderer with Three.js objects under a moved parent. Records resolver requests and reads local transforms and morph influences of mesh, line and point descendants.
 * @evidence contracts/development/testing.md#independent-expectations Literal transform components belong to the named object's own local frame. Pointer and unresolved channels lack a native node field. A morph sample covers available entries in order, leaves an extra target entry unchanged and truncates for a short target.
 */
export function test_render_scene_apply_sampled_object_motion(): void {
  const parent: Group = new Group();
  const node: Group = new Group();
  parent.position.x = 100;
  parent.add(node);

  const mesh: Mesh = new Mesh(morphGeometry(1));
  const line: Line = new Line(morphGeometry(2));
  const points: Points = new Points(morphGeometry(3));
  points.morphTargetInfluences![2] = 0.75;
  node.add(mesh, line, points, new Object3D(), new Mesh());

  const samples: Map<string, IAutoMovieSampledChannel> = new Map([
    [
      "position",
      {
        channel: { kind: "node", node: "part", path: "translation" },
        value: [2, -3, 4],
      },
    ],
    [
      "rotation",
      {
        channel: { kind: "node", node: "part", path: "rotation" },
        value: [0.5, -0.5, 0.5, 0.5],
      },
    ],
    [
      "scale",
      {
        channel: { kind: "node", node: "part", path: "scale" },
        value: [0.5, 2, 4],
      },
    ],
    [
      "morphs",
      {
        channel: { kind: "node", node: "part", path: "weights" },
        value: [0.25, 0.5],
      },
    ],
    [
      "missing",
      {
        channel: { kind: "node", node: "absent", path: "translation" },
        value: [7, 8, 9],
      },
    ],
    [
      "pointer",
      {
        channel: {
          kind: "pointer",
          pointer: "/nodes/part/translation",
          valueType: "vec3",
        },
        value: [9, 8, 7],
      },
    ],
  ]);
  const resolved: string[] = [];
  applySampledObjectMotion(samples, (id: string): Object3D | undefined => {
    resolved.push(id);
    return id === "part" ? node : undefined;
  });

  TestValidator.equals("only node channels reach the resolver", resolved, [
    "part",
    "part",
    "part",
    "part",
    "absent",
  ]);
  TestValidator.predicate(
    "parent-local translation and scale",
    () =>
      vclose(node.position, { x: 2, y: -3, z: 4 }, CHANNEL_TOLERANCE) &&
      vclose(node.scale, { x: 0.5, y: 2, z: 4 }, CHANNEL_TOLERANCE),
  );
  TestValidator.predicate(
    "quaternion components",
    () =>
      nclose(node.quaternion.x, 0.5, CHANNEL_TOLERANCE) &&
      nclose(node.quaternion.y, -0.5, CHANNEL_TOLERANCE) &&
      nclose(node.quaternion.z, 0.5, CHANNEL_TOLERANCE) &&
      nclose(node.quaternion.w, 0.5, CHANNEL_TOLERANCE),
  );
  const meshWeights: number[] = mesh.morphTargetInfluences!;
  const lineWeights: number[] = line.morphTargetInfluences!;
  const pointWeights: number[] = points.morphTargetInfluences!;
  TestValidator.predicate(
    "short and long morph targets",
    () =>
      meshWeights.length === 1 &&
      lineWeights.length === 2 &&
      pointWeights.length === 3 &&
      nclose(meshWeights[0]!, 0.25, CHANNEL_TOLERANCE) &&
      nclose(lineWeights[0]!, 0.25, CHANNEL_TOLERANCE) &&
      nclose(lineWeights[1]!, 0.5, CHANNEL_TOLERANCE) &&
      nclose(pointWeights[0]!, 0.25, CHANNEL_TOLERANCE) &&
      nclose(pointWeights[1]!, 0.5, CHANNEL_TOLERANCE) &&
      nclose(pointWeights[2]!, 0.75, CHANNEL_TOLERANCE),
  );
}

/** One point with the requested number of relative shape positions. */
function morphGeometry(count: number): BufferGeometry {
  const geometry: BufferGeometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(3), 3),
  );
  geometry.morphAttributes.position = Array.from(
    { length: count },
    () => new BufferAttribute(new Float32Array(3), 3),
  );
  return geometry;
}
