import {
  type IPortraitInterior,
  assertPortraitInteriorBindings,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Each native declaration refusal has an adjacent valid triangle. The contract
 * validates explicit identities and directed cycles, not manifoldness or contact.
 * No rejection relies on searching XYZ for an alternative vertex.
 *
 * Scenarios:
 * 1. Duplicate parts, unknown targets and nonresident/fractional indices refuse.
 * 2. Incomplete/nonfinite referenced XYZ and unequal declared coordinates refuse.
 * 3. Blank/repeated names, short/repeated cycles, incomplete triangles and reversed
 *    triangle boundaries refuse; the unmodified declaration remains admissible.
 */
export const test_subject_native_bindings_refusals = (): void => {
  const skin = {
    positions: [
      [0, 0, 0],
      [10, 0, 0],
      [0, 10, 0],
    ],
  };
  const valid: IPortraitInterior = {
    id: "triangle",
    material: "teeth",
    mesh: {
      positions: skin.positions.flat(),
      indices: [0, 1, 2],
      normals: null,
      uvs: null,
      skin: null,
    },
    loops: [{ name: "rim", vertices: [0, 1, 2] }],
    attachments: [{ vertex: 0, target: { part: null, vertex: 0 } }],
  };
  const refuse = (
    edit: (part: IPortraitInterior) => void,
    message: string,
  ): void => {
    const changed = structuredClone(valid);
    edit(changed);
    TestValidator.predicate(
      message,
      throwsError(
        () => assertPortraitInteriorBindings(skin, [changed]),
        message,
      ),
    );
    assertPortraitInteriorBindings(skin, [valid]);
  };
  assertPortraitInteriorBindings(skin, [valid]);
  TestValidator.predicate(
    "unique part identities",
    throwsError(
      () => assertPortraitInteriorBindings(skin, [valid, valid]),
      "unique part",
    ),
  );
  refuse((p) => {
    p.attachments = [{ vertex: 0, target: { part: "missing", vertex: 0 } }];
  }, "prepared interior");
  for (const vertex of [-1, 0.5, 3, NaN, Infinity]) {
    refuse((p) => {
      p.attachments = [{ vertex, target: { part: null, vertex: 0 } }];
    }, "resident vertex");
    refuse((p) => {
      p.attachments = [{ vertex: 0, target: { part: null, vertex } }];
    }, "resident vertex");
    refuse((p) => {
      p.loops = [{ name: "rim", vertices: [0, 1, vertex] }];
    }, "resident vertex");
  }
  for (const value of [NaN, Infinity, -Infinity])
    refuse((p) => {
      p.mesh.positions[0] = value;
    }, "finite millimetre");
  refuse((p) => {
    p.mesh.positions.pop();
  }, "finite millimetre");
  for (const point of [
    [0, 0],
    [0, 0, NaN],
    [0, 0, 0, 0],
  ])
    TestValidator.predicate(
      "skin XYZ admission",
      throwsError(
        () => assertPortraitInteriorBindings({ positions: [point] }, [valid]),
        "finite millimetre",
      ),
    );
  refuse((p) => {
    p.mesh.positions[0] = 0.001;
  }, "agree exactly");
  for (const name of ["", " "])
    refuse((p) => {
      p.loops = [{ name, vertices: [0, 1, 2] }];
    }, "nonblank names");
  refuse((p) => {
    p.loops = [p.loops![0], p.loops![0]];
  }, "nonblank names");
  for (const vertices of [[], [0], [0, 1], [0, 1, 0], [0, 1, 2, 0]])
    refuse((p) => {
      p.loops = [{ name: "rim", vertices }];
    }, "distinct vertices");
  refuse((p) => {
    p.mesh.indices = [0, 1];
  }, "complete mesh triangles");
  refuse((p) => {
    p.loops = [{ name: "rim", vertices: [0, 2, 1] }];
  }, "directed mesh edges");
};
