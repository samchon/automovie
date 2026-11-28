import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a surface normal may stand from its closed form, unit vector
 * components: the normal is read from the native nearest point a micrometre off
 * a surface of radius about a millimetre away, so it errs under 1e-3.
 */
const NORMAL: number = 1e-3;

/**
 * A collider's outward normal at a point of its surface.
 *
 * Scenarios:
 *
 * 1. A sphere's normal is its radius through the point, and a capsule's runs from
 *    the nearest point of its axis, on its side and on its cap, under a turned
 *    pose.
 * 2. A box's and a cube hull's normal in the middle of a face is that face's
 *    normal.
 * 3. On a box's edge the normal bisects the two faces' normals.
 * 4. Carried 1 mm at a time over a box's edge from one face to the next, the
 *    normal turns by under 10 degrees a step, where a face's own normal would
 *    step by 90.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes outward normals on smooth shapes and blended edge normals on a box.
 * @evidence contracts/development/testing.md#behavioral-verification Places sphere, capsule, box and hull fixtures and queries face, cap and edge points as well as a sequence across a box edge.
 * @evidence contracts/development/testing.md#independent-expectations Radial vectors, face directions and the two-face bisector specify the exact cases. A 1 mm step across the edge has an angular bound below 10 degrees.
 */
export async function test_engine_physics_physical_shape_normal(): Promise<void> {
  const still: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const turned: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 55),
  };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const findings: string[] = [];
  const near = (
    label: string,
    got: IAutoMovieVector3,
    want: IAutoMovieVector3,
    tolerance: number,
  ): void => {
    const angle: number =
      (Math.acos(
        Math.max(-1, Math.min(1, AutoMovieEngineVector3.dot(got, AutoMovieEngineVector3.normalize(want)))),
      ) *
        180) /
      Math.PI;
    if (angle > tolerance)
      findings.push(`${label}: ${angle.toFixed(3)} degrees off`);
  };

  // 1. The sphere and the capsule, under a turned pose.
  const sphere: IAutoMoviePhysicalShape = {
    id: "sphere",
    material: "solid",
    kind: "sphere",
    radius: 0.1,
    transform: still,
  };
  const radial: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({ x: 1, y: -2, z: 0.5 });
  near(
    "sphere",
    AutoMovieEnginePhysics.physicalShapeNormal(
      turned,
      sphere,
      AutoMovieEngineVector3.add(turned.position, AutoMovieEngineVector3.scale(radial, 0.1)),
      up,
    ),
    radial,
    NORMAL,
  );
  const capsule: IAutoMoviePhysicalShape = {
    id: "capsule",
    material: "solid",
    kind: "capsule",
    radius: 0.05,
    halfLength: 0.2,
    transform: still,
  };
  // The capsule's axis is the pose's +Y; its side faces the pose's +X.
  const side: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(turned.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  near(
    "capsule side",
    AutoMovieEnginePhysics.physicalShapeNormal(
      turned,
      capsule,
      AutoMovieEngineVector3.add(
        turned.position,
        AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(side, 0.05), { x: 0, y: 0.1, z: 0 }),
      ),
      up,
    ),
    side,
    NORMAL,
  );
  const cap: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({ x: 0.6, y: 0.8, z: 0 });
  near(
    "capsule cap",
    AutoMovieEnginePhysics.physicalShapeNormal(
      still,
      capsule,
      AutoMovieEngineVector3.add({ x: 0, y: 0.2, z: 0 }, AutoMovieEngineVector3.scale(cap, 0.05)),
      up,
    ),
    cap,
    NORMAL,
  );

  // 2. A face's middle, on a box and on a cube hull.
  const box: IAutoMoviePhysicalShape = {
    id: "box",
    material: "solid",
    kind: "box",
    halfExtents: { x: 0.1, y: 0.1, z: 0.1 },
    transform: still,
  };
  const hull: IAutoMoviePhysicalShape = {
    id: "hull",
    material: "solid",
    kind: "hull",
    points: [-0.1, 0.1].flatMap((x: number): IAutoMovieVector3[] =>
      [-0.1, 0.1].flatMap((y: number): IAutoMovieVector3[] =>
        [-0.1, 0.1].map((z: number): IAutoMovieVector3 => ({ x, y, z })),
      ),
    ),
    transform: still,
  };
  for (const shape of [box, hull])
    near(
      `${shape.kind} face`,
      AutoMovieEnginePhysics.physicalShapeNormal(still, shape, { x: 0.1, y: 0.02, z: -0.03 }, up),
      { x: 1, y: 0, z: 0 },
      0.5,
    );

  // 3. The edge between the +X and the +Z faces.
  near(
    "box edge",
    AutoMovieEnginePhysics.physicalShapeNormal(still, box, { x: 0.1, y: 0, z: 0.1 }, up),
    { x: 1, y: 0, z: 1 },
    NORMAL,
  );

  // 4. Over that edge, 1 mm at a time: up the +X face to the edge, then
  // across the +Z face.
  const path: IAutoMovieVector3[] = [
    ...Array.from(
      { length: 11 },
      (_: unknown, k: number): IAutoMovieVector3 => ({
        x: 0.1,
        y: 0,
        z: 0.09 + k * 0.001,
      }),
    ),
    ...Array.from(
      { length: 10 },
      (_: unknown, k: number): IAutoMovieVector3 => ({
        x: 0.099 - k * 0.001,
        y: 0,
        z: 0.1,
      }),
    ),
  ];
  let previous: IAutoMovieVector3 | null = null;
  for (const point of path) {
    const normal: IAutoMovieVector3 = AutoMovieEnginePhysics.physicalShapeNormal(
      still,
      box,
      point,
      up,
    );
    if (previous !== null)
      near(`step to ${JSON.stringify(point)}`, normal, previous, 10);
    previous = normal;
  }
  TestValidator.equals("collider normals", findings, []);
}
