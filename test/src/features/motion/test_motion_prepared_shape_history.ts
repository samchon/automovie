import {
  integrateAirborneRotation as F,
  prepareAutoMovieMassModel as M,
  Quaternion,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qunit } from "../internal/qunit";
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
 * 7. F.fixed consumes actual complete FK, copies its model/rig/bones/span,
 *    and issues fresh numeric instants. A covered stationary flight keeps
 *    three real momentum tangents with explicit zero absolute physical
 *    budget. Uncertified sampled-constant history, an uncovered interval,
 *    nonzero physical budget and a cleared epoch retain numerical fallback.
 *    Old instant edits stay live only in that instant, including after clear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States root-frame SI moments, angular rate, exact millisecond stencil overlap, whole-owner reuse, raw/result isolation, principal/descriptor mutation, cumulative observer events and native fixed-history proof/span/clear lifetime with three actual tangent columns across seven scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public history/rate/clear with raw/prepared models and checks physical moments/rates, exact stencil reuse, mutable issued data and cumulative native observation. Public full FK supplies F.fixed; its stationary exact output retains three real tangents and independent playback, while span/provenance/clear/nonzero-budget boundaries must use numerical admission with unchanged physical outputs.
 * @evidence contracts/development/testing.md#independent-expectations A single centre-fixed part has no orbital momentum and spin Iz*omega=5*2=10. Subtracting it from world/body Z momentum20 and dividing Iz5 gives root rate2. Exact stencil dependency sets derive node reuse and DELTA remains1e-3. With relative spin10Z, momentum(4,0,10) leaves4X: a Z90 principal frame changes rate4/2 to4/3. Z45 gives the tensor block[[2.5,-0.5],[-0.5,2.5]], whose determinant6 gives rates(13/6,17/6); equal tensor/momentum scaling preserves rates. Realizable repeated moments(2,2,3) give(2,3,10/3). Replacement diagonal(4,6,10) gives(1,1,1), then first moment8 gives(0.5,1,1). Eight successful explicit calls include one memo hit, seventeen nodes and seven first public Jacobi reads; a ninth throwing call adds only its attempted query. Unobserved rate preparation factors once without public Jacobi. At stationary fixed I=(2,3,5), Y90 sends world X/Y/Z into body Z/Y/-X, so the three tangents are dt*(Z/5,Y/3,-X/2). A nonzero principal L=3X gives Rx(1.5t). Exact curves have two logical boundaries; numerical integration with initial h0.25 over1s requires more than two stored knots. All physical orientation/tangent comparisons retain the existing1e-6 analytic bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers raw/prepared mass models, exact/stencil reuse, input/output mutation, ordinary principal and unobserved SPD paths, repeated eigenvalues/extreme units, native/copied diagnostic handles, first/replayed/failed queries and clear. F.fixed adds missing-rate refusal, malformed/copied span, three real stationary tangents with a zero absolute budget, fresh results, sampled-constant provenance fallback, a nonzero-budget fallback and permanent clear invalidation with old numeric input validity. Boundary correction and full Human flight acceptance remain unchanged in their existing specifications.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns finite single-part models, pure shape callbacks, native observer tokens/snapshots and issued bones. It edits only its issued numeric instant, explicitly supplies a declared relative spin for the isolated-axis algebra check and mutates owned result vectors/snapshots. It starts no numerical run until invoked by the existing runner, and no renderer/compiler/foreign replacement is involved; prepared model and histories release in finally.
 */
export function test_motion_prepared_shape_history(): void {
  const model: IAutoMovieResolveCenterOfMass.IModel = {
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
      const first: IAutoMovieIntegrateAirborneRotation.IInstant = history(0);
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
        throwsError((): IAutoMovieIntegrateAirborneRotation.IInstant => history(failedAt), ["owned", "shape"]),
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
  fixedInput(model);
}

/** Reach the native fixed-history and exact-dispatch boundaries through complete public FK. */
function fixedInput(model: IAutoMovieResolveCenterOfMass.IModel): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const skeleton: IAutoMovieSkeleton = { id: "fixed-inertia-owner", bones: [{
    bone: "hips", parent: null, constraint: null,
    rest: { translation: { x: 0, y: 0, z: 0 }, rotation: identity, scale: { x: 1, y: 1, z: 1 } },
  }] };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
  for (const bone of resolvePose({ skeleton: skeleton.id, root: null, joints: [] }, skeleton))
    bones.set(bone.bone, bone);
  const source: IAutoMovieResolveCenterOfMass.IModel = structuredClone(model);
  const span: { from: number; to: number } = { from: 0, to: 1 };
  const observation: ReturnType<typeof F.observe> = F.observe();
  const failures: string[] = [];
  try {
    const incomplete: F.ICachedHistory | undefined = F.fixed(source, skeleton, new Map(), span);
    if (incomplete !== undefined) {
      failures.push("an incomplete fixed FK map manufactured a zero-rate proof");
      incomplete.clear();
    }
  } catch (error) {
    failures.push(`an unavailable complete rate map did not preserve undefined fallback: ${String(error)}`);
  }
  if (!throwsError((): F.ICachedHistory | undefined => F.fixed(source, skeleton, bones, { from: 1, to: 1 }), "span"))
    failures.push("a fixed construction admitted an invalid span");
  const history: F.ICachedHistory | undefined = F.fixed(source, skeleton, bones, span, observation);
  if (history === undefined) throw new Error("The complete one-part fixed input was not admitted");
  let sampledReads: number = 0;
  const sampled: F.ICachedHistory = F.history(model, (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    sampledReads++;
    return bones;
  });
  const q0: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  const columns: readonly IAutoMovieVector3[] = [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }];

  /** At L=0, q=q0 and eta=dt I^-1 R0^T dL for every actual requested column. */
  const stationary: (label: string, reader: IAutoMovieIntegrateAirborneRotation.IHistory, from: number, to: number, exact: boolean) => IAutoMovieIntegrateAirborneRotation.IFlight | undefined = (
    label: string, reader: IAutoMovieIntegrateAirborneRotation.IHistory, from: number, to: number, exact: boolean,
  ): IAutoMovieIntegrateAirborneRotation.IFlight | undefined => {
    try {
      const flight: IAutoMovieIntegrateAirborneRotation.IFlight = F({ history: reader, t0: from, t1: to, q0: { ...q0 },
        momentum: { x: 0, y: 0, z: 0 }, variations: columns, h: 0.25,
        tolerance: { relative: 1e-10, absolute: 1e-10 }, momentumTolerance: { relative: 0.01, absolute: 0 } });
      if (exact ? flight.knots !== 2 : !(flight.knots > 2))
        failures.push(`${label}: exact/numerical public knot metadata is wrong: ${flight.knots}`);
      for (const seconds of [from - 0.5, from, from + 0.37 * (to - from), to, to + 0.5]) {
        const elapsed: number = Math.max(from, Math.min(to, seconds)) - from;
        const expected: readonly IAutoMovieVector3[] = [
          { x: 0, y: 0, z: elapsed / 5 }, { x: 0, y: elapsed / 3, z: 0 }, { x: -elapsed / 2, y: 0, z: 0 },
        ];
        const actual: readonly IAutoMovieVector3[] = flight.variations(seconds);
        const shown: IAutoMovieQuaternion = flight.orientation(seconds);
        if (!(qunit(shown, 1e-12) && Quaternion.angle(shown, q0) <= 1e-6) || actual.length !== 3 ||
          expected.some((value: IAutoMovieVector3, index: number): boolean => actual[index] === undefined || !vclose(actual[index]!, value, 1e-6)))
          failures.push(`${label}: actual stationary orientation/three tangents failed at${seconds}`);
      }
      return flight;
    } catch (error) {
      failures.push(`${label}: public integration failed: ${String(error)}`);
      return undefined;
    }
  };
  try {
    const before: number = observation.read().queries;
    const exact: IAutoMovieIntegrateAirborneRotation.IFlight | undefined = stationary("covered native fixed history", history, 0, 1, true);
    const queryWork: number = observation.read().queries - before;
    if (!(Number.isSafeInteger(queryWork) && queryWork >= 0 && queryWork <= 1))
      failures.push("a proved stationary curve performed numerical stage history work instead of its one physical validation");
    if (exact !== undefined) {
      const old: IAutoMovieQuaternion = exact.orientation(0.5);
      const oldColumns: readonly IAutoMovieVector3[] = exact.variations(0.5);
      old.x = 999;
      const oldFirst: IAutoMovieVector3 | undefined = oldColumns[0];
      if (oldFirst !== undefined) oldFirst.x = 999;
      const next: IAutoMovieQuaternion = exact.orientation(0.5);
      const nextFirst: IAutoMovieVector3 | undefined = exact.variations(0.5)[0];
      if (!(qunit(next, 1e-12) && Quaternion.angle(next, q0) <= 1e-6) ||
        oldFirst === undefined || nextFirst === undefined || !vclose(nextFirst, { x: 0, y: 0, z: 0.1 }, 1e-6) || old.x !== 999 || oldFirst.x !== 999)
        failures.push("exact playback outputs escape or overwrite their independent numeric ownership");
    }
    stationary("sampled constant callback has no whole-curve proof", sampled, 0, 1, false);
    if (!(sampledReads > 1)) failures.push("uncertified constant callback did no numerical history work");
    sampled.clear();
    span.from = -10;
    span.to = 10;
    stationary("copied fixed span does not cover the requested interval", history, -0.25, 0.75, false);
    const guarded: IAutoMovieIntegrateAirborneRotation.IFlight = F({ history, t0: 0, t1: 1, q0: identity,
      momentum: { x: 3, y: 0, z: 0 }, h: 0.25,
      tolerance: { relative: 1e-10, absolute: 1e-10 }, momentumTolerance: { relative: 0.01, absolute: 0 } });
    if (!(guarded.knots > 2)) failures.push("nonzero explicit physical budget lost its numerical admission");
    for (const seconds of [0, 0.37, 1]) {
      const expected: IAutoMovieQuaternion = { x: Math.sin(0.75 * seconds), y: 0, z: 0, w: Math.cos(0.75 * seconds) };
      const shown: IAutoMovieQuaternion = guarded.orientation(seconds);
      if (!(qunit(shown, 1e-12) && Quaternion.angle(shown, expected) <= 1e-6))
        failures.push(`nonzero budget fallback failed its principal-axis closed form at${seconds}`);
    }
    const old: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.2);
    const fresh: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.2);
    old.inertia.moments.x = 4;
    old.relative.x = 2;
    source.segments[0]!.inertia.x = 999;
    skeleton.bones[0]!.rest.translation.y = 999;
    bones.get("hips")!.worldPosition.x = 999;
    const current: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.2);
    if (!(old !== fresh && fresh !== current && old.relative !== fresh.relative &&
      vclose(current.relative, { x: 0, y: 0, z: 0 }, 0) &&
      vclose(current.inertia.moments, { x: 2, y: 3, z: 5 }, 1e-10) &&
      vclose(F.rate(old, { x: 0, y: 0, z: 0 }), { x: -0.5, y: 0, z: 0 }, 1e-10)))
      failures.push("fixed constructor snapshots or per-query instant independence were lost");
    const released: IAutoMovieIntegrateAirborneRotation.IInstant = history(0.3);
    const retained: ReturnType<typeof observation.read> = observation.read();
    if (retained.uniqueNumericNodes !== 1 || retained.memoHits !== 0)
      failures.push("fixed construction repeated physical nodes or memoized mutable query results");
    history.clear();
    const cleared: ReturnType<typeof observation.read> = observation.read();
    stationary("clear permanently ends exact eligibility", history, 0, 1, false);
    const oldRate: IAutoMovieVector3 = F.rate(old, { x: 0, y: 0, z: 0 });
    const releasedRate: IAutoMovieVector3 = F.rate(released, { x: 0, y: 0, z: 0 });
    const continued: IAutoMovieVector3 = history(0.2).relative;
    const after: ReturnType<typeof observation.read> = observation.read();
    if (!(Object.keys(cleared) as (keyof typeof cleared)[]).every((key: keyof typeof cleared): boolean => after[key] === cleared[key]) ||
      !vclose(oldRate, { x: -0.5, y: 0, z: 0 }, 1e-10) ||
      !vclose(releasedRate, { x: 0, y: 0, z: 0 }, 0) ||
      !vclose(continued, { x: 0, y: 0, z: 0 }, 0))
      failures.push("cleared history retained instrumentation or invalidated an issued ordinary numeric input");
  } finally {
    history.clear();
    sampled.clear();
  }
  TestValidator.equals("fixed history provenance, physical control and lifetime contracts", failures, []);
}

/** A coupled tensor can still own an exactly independent scalar axis. */
function isolatedInput(): void {
  const model: IAutoMovieResolveCenterOfMass.IModel = {
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
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(0);
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
    const model: IAutoMovieResolveCenterOfMass.IModel = {
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
      const instant: IAutoMovieIntegrateAirborneRotation.IInstant = history(0);
      const momentum: IAutoMovieVector3 = { x: 4 * scale, y: 6 * scale, z: 10 * scale };
      const expected: IAutoMovieVector3 = repeated ? { x: 2, y: 3, z: 10 / 3 } : { x: 13 / 6, y: 17 / 6, z: 2 };
      const first: IAutoMovieVector3 = F.rate(instant, momentum);
      TestValidator.predicate(`unobserved Z45 tensor scale${scale} repeated${repeated} follows independent inverse`, vclose(first, expected, 1e-10));
      first.x = 999;
      TestValidator.predicate("numeric factor result remains independently owned",
        vclose(F.rate(instant, momentum), expected, 1e-10) && Object.is(first.x, 999),
      );
      work(observation, [1, 0, 3, 1, 0]);
      const replacement: IAutoMovieIntegrateAirborneRotation.IInstant["inertia"] = {
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
function principalInput(instant: IAutoMovieIntegrateAirborneRotation.IInstant): void {
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
function physical(instant: IAutoMovieIntegrateAirborneRotation.IInstant): void {
  TestValidator.predicate("unchanged principal moments and actual relative spin",
    vclose(instant.inertia.moments, { x: 2, y: 3, z: 5 }, 1e-10) &&
    vclose(instant.relative, { x: 0, y: 0, z: 10 }, 1e-10) &&
    vclose(F.rate(instant, { x: 0, y: 0, z: 20 }), { x: 0, y: 0, z: 2 }, 1e-10) &&
    nclose(Math.hypot(instant.inertia.rotation.x, instant.inertia.rotation.y,
      instant.inertia.rotation.z, instant.inertia.rotation.w), 1, 1e-12),
  );
}
