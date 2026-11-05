import assert from "node:assert/strict";
import * as THREE from "three";

import { createFinitePaperInspection } from "../../../src/actors/createFinitePaperInspection";

/**
 * Distinguish real finite interior crossings from overlapping conservative hulls.
 *
 * @evidence contracts/testing.md#observable-behavior Exercises original closed box/L-shaped prism triangles and the real signed-query implementation. A paper through the solid refuses, a completely contained paper refuses even without a boundary crossing, and a paper in the L-shaped prism’s empty corner passes despite overlapping bounds. A common rigid transform preserves the empty-corner result; missing matching part transforms remain unresolved. No Human/contact success is inferred from these analytic geometry cases.
 * @evidence contracts/testing.md#independent-cases Literal paper2x10x10mm fits in the known empty corner of a closed L-shaped prism and strictly inside a100mm box. A1x40x4mm box crosses its interior. The L’s arms stop at minus25mm on each axis, independently establishing empty central space; translated/rotated copies preserve containment and intersection. Expectations use those solids rather than the helper's returned distance or copied source output.
 */
export function test_finite_paper_inspection(): void {
  const paper: THREE.BoxGeometry = new THREE.BoxGeometry(0.002, 0.01, 0.01);
  const crossing: THREE.BoxGeometry = new THREE.BoxGeometry(0.001, 0.04, 0.004);
  const enclosing: THREE.BoxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const outline: THREE.Shape = new THREE.Shape();
  outline.moveTo(-0.04, -0.04); outline.lineTo(0.04, -0.04); outline.lineTo(0.04, -0.025); outline.lineTo(-0.025, -0.025); outline.lineTo(-0.025, 0.04); outline.lineTo(-0.04, 0.04); outline.closePath();
  const corner: THREE.ExtrudeGeometry = new THREE.ExtrudeGeometry(outline, { depth: 0.01, bevelEnabled: false, steps: 1 }); corner.translate(0, 0, -0.005);
  const identity: THREE.Matrix4 = new THREE.Matrix4();
  try {
    const cross: ReturnType<ReturnType<typeof createFinitePaperInspection>> = createFinitePaperInspection([{ name: "skin", geometry: crossing }])(paper, identity, new Map([["skin", identity]]));
    assert.ok(!cross.certified && cross.intersections > 0);
    const contained: ReturnType<ReturnType<typeof createFinitePaperInspection>> = createFinitePaperInspection([{ name: "skin", geometry: enclosing }])(paper, identity, new Map([["skin", identity]]));
    assert.equal(contained.intersections, 0); assert.ok(!contained.certified && contained.containments > 0);
    const inspect: ReturnType<typeof createFinitePaperInspection> = createFinitePaperInspection([{ name: "skin", geometry: corner }]);
    const hole: ReturnType<typeof inspect> = inspect(paper, identity, new Map([["skin", identity]]));
    assert.ok(hole.certified, JSON.stringify(hole));
    const moved: THREE.Matrix4 = new THREE.Matrix4().compose(new THREE.Vector3(2, 0.7, -1), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, -0.6, 0.4)), new THREE.Vector3(1, 1, 1));
    assert.ok(inspect(paper, moved, new Map([["skin", moved]])).certified);
    assert.ok(!inspect(paper, identity, new Map()).certified);
  } finally { paper.dispose(); crossing.dispose(); enclosing.dispose(); corner.dispose(); }
}
