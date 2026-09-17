import {
  assertPortraitInteriorBindings,
  createPortraitDentalComponent,
  createPortraitMandibularDentition,
  createPortraitTongueComponent,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { portraitTongueFixture } from "../internal/portraitTongueFixture";
import { nclose } from "../internal/predicates";

/**
 * Real oral components transfer native head-space geometry before metric packing.
 * Their existing kinematic scenarios pin the independent rotation formulas;
 * this scenario pins the new producer boundary, units and buffer ownership.
 *
 * Scenarios:
 * 1. Both maxillary policies, lower enamel and tongue expose fresh native meshes
 *    whose positions differ from model coordinates only by the specified 1000:1
 *    unit conversion. Connectivity, normals, order and materials are retained.
 * 2. Mutating a returned native mesh cannot alter its producer, the source host,
 *    another native result or a subsequent compatibility finish.
 * 3. Upper cervical cycles face superiorly; reflection and a ten-degree jaw
 *    rotation make the lower cycle face (0,-cos(10),-sin(10)).
 */
export const test_subject_native_oral_interiors = (): void => {
  const host = {
    positions: [
      [-20, 0, 0],
      [20, 0, 0],
      [0, -10, 5],
    ],
    indices: [],
    viewRay: [0, 0, 1],
  };
  const before = structuredClone(host);
  const refined = { positions: host.positions, indices: [], groups: [] };
  const row = {
    halfWidth: 24,
    depth: 18,
    gap: 0.1,
    crowns: [
      { width: 5, height: 7, depth: 1.5, cervicalWidth: 0.8, edgeRise: 0.3 },
    ],
  };
  const upper = { rightCorner: 0, leftCorner: 1, upperLipMiddle: 2 };
  const lower = { rightCorner: 0, leftCorner: 1, lowerLipMiddle: 2 };
  const hinge = { x: 0, y: 0, z: -40 };
  const components = [
    createPortraitDentalComponent(upper, row, { lift: 1, recess: 4 }),
    createPortraitDentalComponent(
      upper,
      row,
      { lift: 1, recess: 4 },
      "observed-maxilla",
    ),
    createPortraitMandibularDentition(
      lower,
      row,
      { drop: 5, recess: 4 },
      { hinge, observed: 0, current: 10 },
    ),
    createPortraitTongueComponent(
      lower,
      portraitTongueFixture(),
      hinge,
      {},
      { jawOpen: 10 },
    ),
  ];
  for (const component of components) {
    const attached = component
      .fit(host)
      .attach(refined, host.positions, () => 0);
    TestValidator.predicate(
      "actual native provider exists",
      attached.prepareInteriors !== undefined,
    );
    const native = attached.prepareInteriors!(refined);
    assertPortraitInteriorBindings(refined, native);
    const saved = structuredClone(native);
    const finished = attached.finish(refined);
    TestValidator.equals(
      "same anatomical population",
      native.map((part) => part.id),
      finished.map((part) => part.id),
    );
    TestValidator.equals("one actual oral body", native.length, 1);
    if (component.id !== "tongue") {
      TestValidator.equals(
        "one declared cervical ring",
        native[0].loops?.length,
        1,
      );
      const cycle = native[0].loops![0].vertices;
      const points = cycle.map((id) =>
        native[0].mesh.positions.slice(3 * id, 3 * id + 3),
      );
      const normal = [0, 0, 0];
      for (let i = 0; i < points.length; ++i) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        normal[0] += a[1] * b[2] - a[2] * b[1];
        normal[1] += a[2] * b[0] - a[0] * b[2];
        normal[2] += a[0] * b[1] - a[1] * b[0];
      }
      const length = Math.hypot(...normal);
      const expected =
        component.id === "lower-dentition"
          ? [0, -Math.cos(Math.PI / 18), -Math.sin(Math.PI / 18)]
          : [0, 1, 0];
      TestValidator.predicate(
        "anatomical cervical winding follows jaw",
        normal.every((value, axis) =>
          nclose(value / length, expected[axis], 1e-12),
        ),
      );
    }
    const part = finished[0];
    if (part.geometry.type !== "mesh") throw new Error("Expected oral mesh.");
    const mesh = part.geometry.mesh;
    TestValidator.predicate(
      "native mm and model m",
      native[0].mesh.positions.every((v, i) =>
        nclose(v * 0.001, mesh.positions[i], 1e-12),
      ),
    );
    TestValidator.equals(
      "native topology retained",
      native[0].mesh.indices,
      mesh.indices,
    );
    TestValidator.predicate(
      "native normal directions retained",
      native[0].mesh.normals!.every((v, i) =>
        nclose(v, mesh.normals![i], 1e-12),
      ),
    );
    TestValidator.equals(
      "finish identity retained",
      native[0].material,
      part.material,
    );
    native[0].mesh.positions[0] = 999;
    native[0].mesh.normals![0] = 999;
    native[0].mesh.indices![0] = 999;
    // Mutable result ownership includes the declared anatomy, not just XYZ.
    if (native[0].loops !== undefined) native[0].loops[0].name = "changed";
    TestValidator.equals(
      "native result has exclusive ownership",
      attached.prepareInteriors!(refined),
      saved,
    );
    TestValidator.equals(
      "native mutation cannot affect compatibility",
      attached.finish(refined),
      finished,
    );
  }
  TestValidator.equals("oral providers retain host", host, before);
};
