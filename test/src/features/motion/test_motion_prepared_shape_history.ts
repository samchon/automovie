import {
  type IAutoMovieResolvedBone,
  integrateAirborneRotation as F,
  prepareAutoMovieMassModel as M,
  type resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
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
 * 4. The pure public rate reader observes the actual current principal-frame
 *    quaternion of a factory-issued instant. With net root momentum(4,0,0),
 *    identity/Z90/identity changes rate X from2 to4/3 to2. Editing an earlier
 *    rate result cannot change another rate or instant; clear does not make
 *    a previously issued numeric instant unusable as ordinary rate input.
 * 5. Before public inertia observation, a fixed Z45 tensor with moments
 *    (2,3,5) maps momentum(4,6,10) to rate(13/6,17/6,2), at scales 1e-100,
 *    1 and 1e100. Repeated moments(2,2,3) give(2,3,10/3). Replacing the public
 *    inertia descriptor and editing its new moments changes the actual
 *    rates; clearing history leaves that ordinary numeric input usable.
 *    An Rx45 tensor diag(2,4,2) has independent X moment2 even while its YZ
 *    block is coupled; declared relative spin2X and zero world momentum
 *    therefore require exactly -X, without a square-root division roundtrip.
 * 6. A native observer counts the actual explicit history queries, exact
 *    memo hit, unique stencil nodes, factor calls and first public Jacobi
 *    reads across two histories and clear. Snapshots are independent;
 *    a copied observer refuses before a shape read, as its public contract
 *    requires. A pure owned shape failure adds a query but no completed
 *    numeric node. Diagnostic reads never create physical work.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame SI moments, angular rate, exact millisecond stencil overlap across adjacent and distant reads, whole-owner reuse reason, raw-bone/rate-output isolation, current principal-frame input and clear/separate-epoch lifetimes, independently inverted scaled/repeated Z45 tensors, descriptor replacement and actual cumulative observer/snapshot ownership in six scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public history/rate/clear with raw and prepared models, checks physical principal moments and relative/root angular rates, observes owned pure shape calls at exact overlapping nodes after more than four intervening nodes, mutates issued raw bones/rate outputs, edits then restores a factory-issued instant's actual principal quaternion and requires post-clear/separate-history recomputation plus ordinary rate validity. Native observer snapshots must reflect those same actual events, survive caller edits independently and retain cumulative counts through clear; a copied token must refuse before physical work.
 * @evidence contracts/development/testing.md#independent-expectations A single centre-fixed part has no orbital momentum and spin Iz*omega=5*2=10. Subtracting it from world/body Z momentum20 and dividing Iz5 gives root rate2. The declared central stencil sets share 0/DELTA then DELTA/2DELTA and introduce only one endpoint per adjacent new query, even after the disjoint32DELTA/64DELTA stencils. This derives reads from exact dependency sets and the pure operation lifetime rather than cache capacity; DELTA remains1e-3. For rate input, momentum(4,0,10) minus relative(0,0,10) leaves X4. A Z90 principal frame rotates Iy3 onto world X, so inverse inertia changes4/2 to4/3 without a cached-quaternion oracle. Z45 gives the tensor block[[2.5,-0.5],[-0.5,2.5]], whose determinant6 gives rates(13/6,17/6); equal tensor/momentum scaling preserves these rates. Repeated moments(2,2,3) remain a realizable tensor and give(2,3,10/3). A replacement diagonal(4,6,10) gives(1,1,1), then first moment8 gives(0.5,1,1). Eight successful history calls include one repeated exact instant and seventeen distinct stencil nodes across their epochs; seven previously unseen public inertias require seven Jacobi calls. A ninth call throws before its first node insert and changes only the query count. The unobserved rate fixture factors once without a public Jacobi read.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers raw versus admitted prepared models, changing/repeated exact query times, adjacent and distant-node reuse versus a separate epoch, raw endpoint mutation, same-record principal-frame edits/restoration, rate-output edits, old numeric instant validity after clear and reconstruction. Unobserved noncardinal SPD tensors, repeated principal moments, extreme equal unit scales, public descriptor replacement and later edits distinguish direct factor results from stale principal assumptions. Initial/changed/repeated snapshots, native/copied tokens, first/replayed queries, factor versus observed-principal work and clear across shared histories distinguish each diagnostic boundary. Boundary correction and full flight momentum acceptance retain their existing specifications and are not relaxed here.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns finite single-part models, pure shape callbacks, native observer tokens/snapshots and issued bones. It edits only its issued numeric instant, explicitly supplies a declared relative spin for the isolated-axis algebra check and mutates owned result vectors/snapshots. It starts no numerical run until invoked by the existing runner, and no renderer/compiler/foreign replacement is involved; prepared model and histories release in finally.
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
    const failedAt: number = 128 * F.DELTA;

    /** Return a fresh true cardinal spin frame for each demanded instant. */
    function shape(seconds: number): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
      reads++;
      if (seconds === failedAt) throw new Error("owned shape input failure");
      const half: number = seconds;
      const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
      const bone: IAutoMovieResolvedBone = { bone: "hips", localRotation: { ...rotation },
        worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: rotation };
      issued = bone;
      return new Map([["hips", bone]]);
    }

    const observation: ReturnType<typeof F.observe> = F.observe();
    const snapshot: ReturnType<typeof observation.read> = observation.read();
    snapshot.queries = 999;
    work(observation, [0, 0, 0, 0, 0]);
    TestValidator.predicate("a copied diagnostic token refuses before any actual shape work",
      throwsError((): F.ICachedHistory => F.history(model, shape, undefined, { ...observation }), ["native", "observer"]) && reads === 0,
    );
    const token: M.IPrepared = M(model);
    const history: F.ICachedHistory = F.history(prepared ? token : model, shape, undefined, observation);
    const separate: F.ICachedHistory = F.history(prepared ? token : model, shape, undefined, observation);
    try {
      const first: F.IInstant = history(0);
      work(observation, [1, 0, 3, 0, 0]);
      physical(first);
      principalInput(first);
      work(observation, [1, 0, 3, 0, 1]);
      TestValidator.equals("later events do not overwrite a caller-owned prior snapshot", snapshot.queries, 999);
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
      principalInput(first);
      physical(history(2 * F.DELTA));
      TestValidator.equals("clear releases every old distant and adjacent numeric node", reads, 14);
      physical(separate(2 * F.DELTA));
      TestValidator.equals("a different history has its own shape epoch", reads, 17);
      work(observation, [8, 1, 17, 0, 7]);
      history.clear();
      separate.clear();
      work(observation, [8, 1, 17, 0, 7]);
      TestValidator.predicate("an actual failed history query remains a failure",
        throwsError((): F.IInstant => history(failedAt), ["owned", "shape"]),
      );
      work(observation, [9, 1, 17, 0, 7]);
    } finally {
      history.clear();
      separate.clear();
      M.release(token);
    }
  }
  factorInput();
  isolatedInput();
}

/** A coupled tensor can still own an exactly independent scalar axis. */
function isolatedInput(): void {
  const model: resolveAutoMovieCenterOfMass.IModel = {
    mass: 1,
    segments: [{ bone: "hips", mass: 1, point: { x: 0, y: 0, z: 0 },
      inertia: { x: 2, y: 4, z: 2 }, axes: { x: 0, y: 0, z: 0, w: 1 } }],
  };
  const history: F.ICachedHistory = F.history(model,
    (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => new Map([
      ["hips", { bone: "hips", localRotation: { x: 0, y: 0, z: 0, w: 1 },
        worldPosition: { x: 0, y: 0, z: 0 },
        worldRotation: { x: Math.sin(Math.PI / 8), y: 0, z: 0, w: Math.cos(Math.PI / 8) } }],
    ]),
  );
  try {
    const instant: F.IInstant = history(0);
    instant.relative = { x: 2, y: 0, z: 0 };
    const rate: IAutoMovieVector3 = F.rate(instant, { x: 0, y: 0, z: 0 });
    TestValidator.predicate("an independent X axis stays exact inside a coupled YZ tensor",
      vclose(rate, { x: -1, y: 0, z: 0 }, 0) &&
      vclose({ x: 2 * rate.x + 2, y: 3 * rate.y + rate.z, z: rate.y + 3 * rate.z },
        { x: 0, y: 0, z: 0 }, 0),
    );
  } finally {
    history.clear();
  }
}

/** Check an unobserved factory tensor and later ordinary public replacement against hand-inverted equations. */
function factorInput(): void {
  for (const [scale, repeated] of [[1e-100, false], [1, false], [1e100, false], [1, true]] as const) {
    const model: resolveAutoMovieCenterOfMass.IModel = {
      mass: 1,
      segments: [{ bone: "hips", mass: 1, point: { x: 0, y: 0, z: 0 },
        inertia: { x: 2 * scale, y: (repeated ? 2 : 3) * scale, z: (repeated ? 3 : 5) * scale },
        axes: { x: 0, y: 0, z: 0, w: 1 } }],
    };
    const rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: Math.sin(Math.PI / 8), w: Math.cos(Math.PI / 8) };
    const observation: ReturnType<typeof F.observe> = F.observe();
    const history: F.ICachedHistory = F.history(model,
      (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => new Map([
        ["hips", { bone: "hips", localRotation: { x: 0, y: 0, z: 0, w: 1 },
          worldPosition: { x: 0, y: 0, z: 0 }, worldRotation: { ...rotation } }],
      ]), undefined, observation,
    );
    try {
      const instant: F.IInstant = history(0);
      const momentum: IAutoMovieVector3 = { x: 4 * scale, y: 6 * scale, z: 10 * scale };
      const expected: IAutoMovieVector3 = repeated ? { x: 2, y: 3, z: 10 / 3 } : { x: 13 / 6, y: 17 / 6, z: 2 };
      const first: IAutoMovieVector3 = F.rate(instant, momentum);
      TestValidator.predicate(`unobserved Z45 tensor scale${scale} repeated${repeated} follows independent inverse`, vclose(first, expected, 1e-10));
      first.x = 999;
      TestValidator.predicate("numeric factor result remains independently owned",
        vclose(F.rate(instant, momentum), expected, 1e-10) && Object.is(first.x, 999),
      );
      work(observation, [1, 0, 3, 1, 0]);
      const replacement: F.IInstant["inertia"] = {
        moments: { x: 4 * scale, y: 6 * scale, z: 10 * scale },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      };
      Object.defineProperty(instant, "inertia", { value: replacement, writable: true, configurable: true, enumerable: true });
      TestValidator.predicate("replaced public descriptor supplies the actual current tensor",
        vclose(F.rate(instant, momentum), { x: 1, y: 1, z: 1 }, 1e-10),
      );
      replacement.moments.x = 8 * scale;
      TestValidator.predicate("later edits of the replacement stay live",
        vclose(F.rate(instant, momentum), { x: 0.5, y: 1, z: 1 }, 1e-10),
      );
      history.clear();
      TestValidator.predicate("clear leaves a previously issued ordinary numeric input valid",
        vclose(F.rate(instant, momentum), { x: 0.5, y: 1, z: 1 }, 1e-10),
      );
      work(observation, [1, 0, 3, 1, 0]);
    } finally {
      history.clear();
    }
  }
}

/** Compare dimensionless actual owner events in query, memo, node, factor and Jacobi order. */
function work(observation: ReturnType<typeof F.observe>, expected: readonly [number, number, number, number, number]): void {
  const statistics: ReturnType<typeof observation.read> = observation.read();
  TestValidator.equals("native observation counts actual physical owner events",
    [statistics.queries, statistics.memoHits, statistics.uniqueNumericNodes, statistics.factorizations, statistics.publicJacobi], [...expected],
  );
}

/** The actual current numeric principal frame, rather than its record identity, controls rate. */
function principalInput(instant: F.IInstant): void {
  const original: IAutoMovieQuaternion = { ...instant.inertia.rotation };
  try {
    let previous: ReturnType<typeof F.rate> | undefined;
    for (const quarter of [false, true, false]) {
      Object.assign(instant.inertia.rotation, quarter
        ? { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 }
        : { x: 0, y: 0, z: 0, w: 1 });
      const current: ReturnType<typeof F.rate> = F.rate(instant, { x: 4, y: 0, z: 10 });
      TestValidator.predicate("rate rereads the actual principal quaternion and issues independent vectors",
        vclose(current, { x: quarter ? 4 / 3 : 2, y: 0, z: 0 }, 1e-10) &&
        (previous === undefined || current !== previous && Object.is(previous.x, 999)));
      current.x = 999;
      previous = current;
    }
  } finally {
    Object.assign(instant.inertia.rotation, original);
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
