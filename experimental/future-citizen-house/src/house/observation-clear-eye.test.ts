import type { IAutoMovieBuiltSpace } from "@automovie/interface";
import assert from "node:assert/strict";

import {
  clearObservationEye,
  clearObservationView,
  supplementalObservationEye,
} from "./observation-clear-eye";

export function verifySupplementalObservationEye(): void {
  const v = (x: number, y: number, z: number) => ({ x, y, z });
  const space: IAutoMovieBuiltSpace = {
    id: "room",
    kind: "room",
    parent: null,
    cells: [
      {
        id: "cell",
        planes: [
          { normal: v(1, 0, 0), offset: 2 },
          { normal: v(-1, 0, 0), offset: 0 },
          { normal: v(0, 1, 0), offset: 3 },
          { normal: v(0, -1, 0), offset: 0 },
          { normal: v(0, 0, 1), offset: 2 },
          { normal: v(0, 0, -1), offset: 0 },
        ],
      },
    ],
  };
  const box = { min: v(0, 0, 0), max: v(0.5, 2, 0.5) };
  assert.equal(clearObservationEye(v(0.25, 1.6, 0.25), [box]), false);
  assert.equal(clearObservationEye(v(1, 1.6, 1), [box]), true);
  const eye = supplementalObservationEye(
    space,
    v(0.25, 1.6, 0.25),
    v(1, 1.6, 1),
    [box],
  );
  assert.ok(eye && eye.x >= 0.58 && eye.z >= 0.58 && eye.y === 1.6);
  assert.equal(
    supplementalObservationEye(space, v(1, 1.6, 1), v(1.5, 1.6, 1.5), [box]),
    null,
  );
  assert.equal(
    supplementalObservationEye(space, v(0.25, 1.6, 0.25), v(0.25, 1.6, 0.25), [
      box,
    ]),
    null,
  );
  assert.equal(
    supplementalObservationEye(space, v(0.25, 1.6, 0.25), v(0.4, 1.6, 0.4), [
      box,
    ]),
    null,
  );
  const all = { min: v(-1, -1, -1), max: v(3, 3, 3) };
  assert.equal(
    supplementalObservationEye(space, v(0.25, 1.6, 0.25), v(1, 1.6, 1), [all]),
    null,
  );
  const leaf = { min: v(0.8, 0, 0.1), max: v(0.83, 2, 1.9) };
  const outside = v(0.2, 1.6, 1),
    target = v(1.5, 1.6, 1);
  assert.equal(clearObservationEye(outside, [leaf]), true);
  assert.equal(clearObservationView(outside, target, [leaf]), false);
  assert.equal(clearObservationView(outside, outside, []), true);
  const afterLeaf = supplementalObservationEye(space, outside, target, [leaf]);
  assert.ok(
    afterLeaf &&
      afterLeaf.x >= 0.91 &&
      clearObservationView(afterLeaf, target, [leaf]),
  );
}
