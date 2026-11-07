import { Quaternion, preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { collectBoutFormulaResponses } from "../../../src/physics/collectBoutFormulaResponses";

/** Independent two-carrier snapshots for the direct scalar estimate. */
type SphereFrames = Record<"a" | "b", { root: P.ITransform }>;

/** Actual geometric touching and independent two-mass arithmetic exercise the comparison estimate directly, including rotation of a contact witness, separation and a cold first sample. No dynamics world or native impulse is claimed. */
export async function test_bout_formula_impulse(): Promise<void> {
  const pose: P.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const shape: P.IShape = {
    id: "sphere",
    material: "rigid",
    kind: "sphere",
    radius: 0.1,
    transform: pose,
  };
  const profile: (mass: number) => P = (mass: number): P => ({
    id: `independent-${mass}kg-sphere`,
    mass,
    centerOfMass: { x: 0, y: 0, z: 0 },
    provenance:
      "Analytic independent solid sphere for one direct comparison formula unit",
    materials: [
      { id: "rigid", friction: 0, restitution: 0, compliance: 0, damping: 0 },
    ],
    joints: [],
    segments: [
      {
        bone: "root",
        mass,
        neutral: pose,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: mass * 0.004, y: mass * 0.004, z: mass * 0.004 },
        inertiaRotation: pose.rotation,
        shapes: [shape],
      },
    ],
  });
  const profiles: Record<string, P> = { a: profile(2), b: profile(3) };
  const actual: SphereFrames = {
    a: { root: pose },
    b: { root: { ...pose, position: { x: 0.2, y: 0, z: 0 } } },
  };
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  const measured: Receipt | null = geometry.contact(
    { body: "a", bone: "root", shape, pose: actual.a.root },
    { body: "b", bone: "root", shape, pose: actual.b.root },
    2,
  );
  assert.ok(measured, "two0.1m spheres actually touch at0.2m centre distance");
  assert.equal(measured.source, "geometric");
  assert.equal(measured.impulse, null);
  const before: SphereFrames = {
    a: { root: { ...pose, position: { x: -0.06, y: 0, z: 0 } } },
    b: actual.b,
  };
  const snapshot: string = JSON.stringify({
    measured,
    profiles,
    before,
    actual,
  });
  const impulse: number = collectBoutFormulaResponses.estimate(
    measured,
    profiles,
    before,
    actual,
    0.01,
  );
  // Closing6m/s, no restitution:6/(1/2+1/3)=7.2N s.
  assert.ok(Math.abs(impulse - 7.2) < 1e-10);
  assert.equal(
    collectBoutFormulaResponses.estimate(measured, profiles, before, actual, 0),
    0,
  );
  const separating: SphereFrames = {
    a: { root: { ...pose, position: { x: 0.06, y: 0, z: 0 } } },
    b: actual.b,
  };
  assert.equal(
    collectBoutFormulaResponses.estimate(
      measured,
      profiles,
      separating,
      actual,
      0.01,
    ),
    0,
  );
  const rotated: SphereFrames = {
    a: {
      root: {
        ...pose,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
      },
    },
    b: actual.b,
  };
  const rotational: number = collectBoutFormulaResponses.estimate(
    measured,
    profiles,
    actual,
    rotated,
    1,
  );
  // The actual +X contact witness was on +Z before the quarter turn.
  assert.ok(Math.abs(rotational - measured.point.x / (1 / 2 + 1 / 3)) < 1e-10);
  assert.equal(
    JSON.stringify({ measured, profiles, before, actual }),
    snapshot,
  );
  assert.throws((): number =>
    collectBoutFormulaResponses.estimate(
      { ...measured, source: "solver", impulse: 1 },
      profiles,
      before,
      actual,
      0.01,
    ),
  );
  assert.throws((): number =>
    collectBoutFormulaResponses.estimate(
      measured,
      profiles,
      before,
      actual,
      -1,
    ),
  );
}
