import { createAutoMovieMeshCrossingQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import assert from "node:assert/strict";

import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { ContactGeometry } from "../../../../src/motion/interaction/ContactGeometry";
import { ContactTrace } from "../../../../src/motion/interaction/ContactTrace";

/**
 * Pin native crossing admission and fixed-world refits at finite boundary cases.
 *
 * Scenarios:
 * 1. Disjoint parallel boxes remain clear even below the narrow-phase plane tolerance.
 * 2. Exact-boundary near-coplanar candidates reach the native plane predicate unchanged.
 * 3. Coincident overlap refuses with attribution; a shared corner alone remains clear.
 * 4. Degenerate-to-valid and rotated receiver coordinates refit the original topology.
 * 5. Nonfinite coordinates, sparse unused coordinates and incomplete triangles refuse before pruning.
 *
 * @evidence contracts/testing.md#observable-behavior Executes ContactTrace and its real Engine-backed session on actual world triangle buffers. Analytic boundary cases and the installed public crossing operation verify that candidate pruning preserves the native contact classification and fixed-layout refits. No browser, Human construction or continuous-articulation claim is involved.
 * @evidence contracts/testing.md#independent-cases Exact x extrema define separated and touching boxes. The installed Engine owns its near-coplanar and degenerate predicates; trace outcomes are compared through that public contract without replacing it. Changed rotation/cardinality and malformed unused data exercise state/admission boundaries, while test_contact_interaction owns delivery timing, earliest participants, recovery response and fast paths.
 */
export function test_contact_boundaries(): void {
  const resident: IAutoMovieMesh = triangle([
    [0, -1, -1],
    [0, 1, -1],
    [0, 0, 1],
  ]);
  const separated: IAutoMovieMesh = triangle([
    [5e-10, -0.4, -0.4],
    [5e-10, 0.4, -0.4],
    [5e-10, 0, 0.4],
  ]);
  assert.equal(
    createAutoMovieMeshCrossingQuery(resident).crosses(separated),
    false,
  );
  assert.equal(
    ContactTrace.resolve(staticOptions(separated, resident)).outcome,
    "miss",
  );

  for (const displacement of [1e-10, 1e-7]) {
    const near: IAutoMovieMesh = triangle([
      [0, -0.4, -0.4],
      [displacement, 0.4, -0.4],
      [displacement, 0, 0.4],
    ]);
    const native: boolean =
      createAutoMovieMeshCrossingQuery(resident).crosses(near);
    if (native)
      assert.throws(
        (): ContactTrace.Result =>
          ContactTrace.resolve(staticOptions(near, resident)),
        /crossing|Coplanar overlap/,
      );
    else
      assert.equal(
        ContactTrace.resolve(staticOptions(near, resident)).outcome,
        "miss",
      );
  }
  const overlap: IAutoMovieMesh = triangle([
    [0, -0.4, -0.4],
    [0, 0.4, -0.4],
    [0, 0, 0.4],
  ]);
  assert.equal(
    createAutoMovieMeshCrossingQuery(resident).crosses(overlap),
    true,
  );
  assert.throws(
    (): ContactTrace.Result =>
      ContactTrace.resolve(staticOptions(overlap, resident)),
    /attack->receiver/,
  );
  const corner: IAutoMovieMesh = triangle([
    [0, 0, 1],
    [0, 1, 2],
    [0, -1, 2],
  ]);
  assert.equal(
    createAutoMovieMeshCrossingQuery(resident).crosses(corner),
    false,
  );
  assert.equal(
    ContactTrace.resolve(staticOptions(corner, resident)).outcome,
    "miss",
  );

  const receipt: ContactTrace.Receipt = ContactTrace.resolve(
    staticOptions(separated, resident),
  ).receipt;
  const session: ContactGeometry.Session = ContactGeometry.create(receipt);
  const beforeBuilds: number = receipt.work.crossingBuilds;
  const beforeRefits: number = receipt.work.crossingRefits;
  const attack: IAutoMovieMesh = triangle([
    [-0.2, 0, 0],
    [0.2, -0.3, 0.2],
    [0.2, 0.3, 0.2],
  ]);
  const degenerate: ContactTrace.Frame = frame(
    0,
    attack,
    triangle([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]),
  );
  assert.equal(session.intercept(degenerate, degenerate, 0), null);
  const valid: ContactTrace.Frame = frame(1, attack, resident);
  assert.ok(session.intercept(degenerate, valid, 1));
  const rotated: ContactTrace.Frame = frame(
    2,
    attack,
    triangle([
      [-1, -1, 0.1],
      [1, -1, 0.1],
      [0, 1, 0.1],
    ]),
  );
  assert.ok(session.intercept(valid, rotated, 1));
  assert.equal(receipt.work.crossingBuilds - beforeBuilds, 1);
  assert.equal(receipt.work.crossingRefits - beforeRefits, 2);

  const nonfinite: IAutoMovieMesh = structuredClone(separated);
  nonfinite.positions[0] = NaN;
  assert.throws(
    (): ContactTrace.Result =>
      ContactTrace.resolve(staticOptions(nonfinite, resident)),
    /finite/,
  );
  const sparse: IAutoMovieMesh = structuredClone(separated);
  sparse.positions.length += 3;
  assert.throws(
    (): ContactTrace.Result =>
      ContactTrace.resolve(staticOptions(sparse, resident)),
    /finite/,
  );
  const malformed: IAutoMovieMesh = structuredClone(separated);
  malformed.indices = [0, 1];
  assert.throws(
    (): ContactTrace.Result =>
      ContactTrace.resolve(staticOptions(malformed, resident)),
    /complete triangle/,
  );
}

/** A single independent source triangle, in world metres. */
function triangle(points: MotionAction.Vec3[]): IAutoMovieMesh {
  return {
    positions: points.flat(),
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
}

/** Static local captures expose native contact semantics without an authored stroke. */
function staticOptions(
  attack: IAutoMovieMesh,
  receiver: IAutoMovieMesh,
): ContactTrace.Options {
  return {
    actionId: "boundary",
    actorId: "actor-one",
    targetId: "actor-two",
    start: 0,
    end: 1,
    stepSeconds: 1,
    refinementSteps: 2,
    maximumCaptures: 16,
    grazeCosine: 0.2,
    capture: (time: number): ContactTrace.Frame =>
      frame(time, attack, receiver),
  };
}

/** Immutable detached frame; sample coordinates are not a claim about a Human rig. */
function frame(
  time: number,
  attack: IAutoMovieMesh,
  receiver: IAutoMovieMesh,
): ContactTrace.Frame {
  const sample: MotionAction.Sample = {
    pose: {},
    rootOffset: [0, 0, 0],
    support: { left: 0.5, right: 0.5 },
    effectors: [],
    phase: "delivery",
    elapsed: time,
    progress: time,
  };
  return {
    sample,
    attacks: [{ id: "attack", mesh: structuredClone(attack) }],
    receivers: [
      { id: "receiver", relation: "guard", mesh: structuredClone(receiver) },
    ],
  };
}
