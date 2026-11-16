import {
  type IAutoMovieResolvedBone,
  integrateAirborneRotation as F,
  prepareAutoMovieMassModel as M,
  type resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Shape history shares exact numeric stencil nodes inside its own epoch while
 * retaining the original millisecond differences and physical momentum.
 *
 * Scenarios:
 * 1. One part with principal moments (2,3,5) turns about Z at 2 rad/s.
 *    Its relative momentum is (0,0,10), and momentum (0,0,20) requires
 *    root rate (0,0,2), independently of the requested exact time.
 * 2. Queries at 0 then DELTA share their overlapping shape nodes. The first
 *    needs {-DELTA,0,DELTA}, the second only adds 2DELTA; a repeated exact
 *    instant needs no shape read. After two distant stencils introduce six
 *    other nodes, a new 2DELTA stencil still needs only its new 3DELTA node.
 *    Pure fixed shape and history ownership establish exact node equivalence
 *    for the whole epoch, so an arbitrary four-node eviction bound cannot
 *    force required shape/IK work again. Mutating a returned raw bone cannot
 *    change the already reduced numeric node.
 * 3. Clearing the history releases both instant and posed-node reuse, so the
 *    next query evaluates all three actual stencil nodes again. A separate
 *    history with the same model and shape owns a separate epoch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame SI moments, angular rate, exact millisecond stencil overlap across adjacent and distant reads, whole-owner reuse reason, raw-bone isolation and clear/separate-epoch lifetimes in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public history/rate/clear with raw and prepared models, checks physical principal moments and relative/root angular rates, observes owned pure shape calls at exact overlapping nodes after more than four intervening nodes, mutates only issued raw bones and requires post-clear/separate-history recomputation.
 * @evidence contracts/development/testing.md#independent-expectations A single centre-fixed part has no orbital momentum and spin Iz*omega=5*2=10. Subtracting it from world/body Z momentum20 and dividing Iz5 gives root rate2. The declared central stencil sets share 0/DELTA then DELTA/2DELTA and introduce only one endpoint per adjacent new query, even after the disjoint32DELTA/64DELTA stencils. This derives required reads from exact dependency sets and the pure operation lifetime rather than cache capacity; existing DELTA remains1e-3.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers raw versus admitted prepared models, changing/repeated exact query times, adjacent and distant-node reuse versus a separate epoch, raw endpoint mutation, explicit clear and reconstruction. Boundary correction and full flight momentum acceptance retain their existing specifications and are not relaxed here.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns the single-part model, pure shape callback, counters and issued bones. It starts no numerical run until invoked by the existing runner, and no renderer/compiler/foreign replacement is involved; prepared model and histories release in finally.
 */
export function test_motion_prepared_shape_history(): void {
  const model: resolveAutoMovieCenterOfMass.IModel = {
    mass: 1,
    segments: [{ bone: "hips", mass: 1, point: { x: 0, y: 0, z: 0 },
      inertia: { x: 2, y: 3, z: 5 }, axes: { x: 0, y: 0, z: 0, w: 1 } }],
  };
  for (const prepared of [false, true]) {
    let reads: number = 0;
    let issued: IAutoMovieResolvedBone | undefined;
    const token: M.IPrepared = M(model);

    /** Return a fresh true cardinal spin frame for each demanded instant. */
    function shape(seconds: number): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
      reads++;
      const half: number = seconds;
      const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
      const bone: IAutoMovieResolvedBone = { bone: "hips", localRotation: { ...rotation },
        worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: rotation };
      issued = bone;
      return new Map([["hips", bone]]);
    }

    const history: F.ICachedHistory = F.history(prepared ? token : model, shape);
    const separate: F.ICachedHistory = F.history(prepared ? token : model, shape);
    try {
      physical(history(0));
      TestValidator.equals("first central stencil reads its three distinct actual shapes", reads, 3);
      issued!.worldPosition.x = 123;
      issued!.worldRotation.z = 456;
      physical(history(F.DELTA));
      TestValidator.equals("adjacent exact stencil shares only its overlapping nodes", reads, 4);
      physical(history(0));
      TestValidator.equals("exact numeric instant replay performs no shape work", reads, 4);
      physical(history(32 * F.DELTA));
      physical(history(64 * F.DELTA));
      TestValidator.equals("two disjoint distant stencils add their six required exact nodes", reads, 10);
      physical(history(2 * F.DELTA));
      TestValidator.equals("a new stencil reuses old numeric endpoints across the whole history lifetime", reads, 11);
      history.clear();
      physical(history(2 * F.DELTA));
      TestValidator.equals("clear releases every old distant and adjacent numeric node", reads, 14);
      physical(separate(2 * F.DELTA));
      TestValidator.equals("a different history has its own shape epoch", reads, 17);
    } finally {
      history.clear();
      separate.clear();
      M.release(token);
    }
  }
}

/** Compare actual reduced physics to the independent one-part angular balance. */
function physical(instant: F.IInstant): void {
  TestValidator.predicate("unchanged principal moments and actual relative spin",
    vclose(instant.inertia.moments, { x: 2, y: 3, z: 5 }, 1e-10) &&
    vclose(instant.relative, { x: 0, y: 0, z: 10 }, 1e-10) &&
    vclose(F.rate(instant, { x: 0, y: 0, z: 20 }), { x: 0, y: 0, z: 2 }, 1e-10) &&
    nclose(Math.hypot(instant.inertia.rotation.x, instant.inertia.rotation.y,
      instant.inertia.rotation.z, instant.inertia.rotation.w), 1, 1e-12),
  );
}
