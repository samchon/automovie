import { Quaternion, Vector3, physicalShapeNormal } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A collider's outward normal at a point of its surface.
 *
 * Scenarios:
 * 1. A sphere's normal is its radius through the point, and a capsule's runs from the nearest point of its axis, on its side and on its cap, under a turned pose.
 * 2. A box's and a cube hull's normal in the middle of a face is that face's normal.
 * 3. On a box's edge the normal bisects the two faces' normals.
 * 4. Carried 1 mm at a time over a box's edge from one face to the next, the normal turns by under 10 degrees a step, where a face's own normal would step by 90.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `physicalShapeNormal` on in-memory shapes and asserts the four scenarios' findings through one TestValidator.equals.
 * @evidence contracts/development/testing.md#independent-expectations Expected normals are written from the shapes' geometry in the test: a radius, an axis offset, a face's axis and the bisector of two axes.
 * @evidence contracts/development/testing.md#distinguishing-cases A face's own normal fails scenarios 3 and 4; a direction taken as the normal fails scenario 1's cap and side; a blend too wide fails scenario 2.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_physical_shape_normal`; it starts no process, browser, viewer or render.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios with the input and the behaviour each pins.
 */
export async function test_physical_shape_normal(): Promise<void> {
  const still: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const turned: P.ITransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 55),
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
        Math.max(-1, Math.min(1, Vector3.dot(got, Vector3.normalize(want)))),
      ) *
        180) /
      Math.PI;
    if (angle > tolerance)
      findings.push(`${label}: ${angle.toFixed(3)} degrees off`);
  };

  // 1. The sphere and the capsule, under a turned pose.
  const sphere: P.IShape = {
    id: "sphere",
    material: "solid",
    kind: "sphere",
    radius: 0.1,
    transform: still,
  };
  const radial: IAutoMovieVector3 = Vector3.normalize({ x: 1, y: -2, z: 0.5 });
  near(
    "sphere",
    physicalShapeNormal(
      turned,
      sphere,
      Vector3.add(turned.position, Vector3.scale(radial, 0.1)),
      up,
    ),
    radial,
    1e-3,
  );
  const capsule: P.IShape = {
    id: "capsule",
    material: "solid",
    kind: "capsule",
    radius: 0.05,
    halfLength: 0.2,
    transform: still,
  };
  // The capsule's axis is the pose's +Y; its side faces the pose's +X.
  const side: IAutoMovieVector3 = Quaternion.rotateVector(turned.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  near(
    "capsule side",
    physicalShapeNormal(
      turned,
      capsule,
      Vector3.add(
        turned.position,
        Vector3.add(Vector3.scale(side, 0.05), { x: 0, y: 0.1, z: 0 }),
      ),
      up,
    ),
    side,
    1e-3,
  );
  const cap: IAutoMovieVector3 = Vector3.normalize({ x: 0.6, y: 0.8, z: 0 });
  near(
    "capsule cap",
    physicalShapeNormal(
      still,
      capsule,
      Vector3.add({ x: 0, y: 0.2, z: 0 }, Vector3.scale(cap, 0.05)),
      up,
    ),
    cap,
    1e-3,
  );

  // 2. A face's middle, on a box and on a cube hull.
  const box: P.IShape = {
    id: "box",
    material: "solid",
    kind: "box",
    halfExtents: { x: 0.1, y: 0.1, z: 0.1 },
    transform: still,
  };
  const hull: P.IShape = {
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
      physicalShapeNormal(still, shape, { x: 0.1, y: 0.02, z: -0.03 }, up),
      { x: 1, y: 0, z: 0 },
      0.5,
    );

  // 3. The edge between the +X and the +Z faces.
  near(
    "box edge",
    physicalShapeNormal(still, box, { x: 0.1, y: 0, z: 0.1 }, up),
    { x: 1, y: 0, z: 1 },
    1e-3,
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
    const normal: IAutoMovieVector3 = physicalShapeNormal(
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
