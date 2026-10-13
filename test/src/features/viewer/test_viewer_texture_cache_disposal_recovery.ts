import { AutoMovieTextureCache, createAutoMovieResourceRetirement } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import { createHumanResidentWorker } from "@automovie/viewer/human/common/createHumanResidentWorker";
import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";

import { throwsError } from "../internal/predicates";

/**
 * Cache closure owns one completion and attempts each real Texture wrapper,
 * retaining native disposal failures rather than skipping later resources.
 * These public event observations are attempt counts, not GPU allocation counts.
 *
 * Scenarios:
 * 1. A throwing first clone cannot skip later clones or sources, and repeats
 *    retain the same failed promise and original Error without another attempt.
 * 2. Two asset aliases retire one original object once but both Source-sharing
 *    clones individually; several failures retain their original ordered values.
 * 3. Pending and reentrant host decodes remain owned until they independently
 *    settle; closure is shared and new work is immediately refused.
 * 4. A synchronous decode failure is named without losing its healthy neighbour;
 *    empty and successful caches close once through the same public lifetime.
 * 5. A generic resource completion starts all independent owners before waiting,
 *    keeps primary and original ordered causes, and is shared during reentry.
 * 6. A primitive number-message transport withdraws pending request Promises
 *    before its owned terminate callback can fail, preserving the original
 *    host Error and permitting a fresh connection after transport loss.
 */
export const test_viewer_texture_cache_disposal_recovery = async (): Promise<void> => {
  const make = () => new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const attempts: string[] = [];
  const record = (texture: ReturnType<typeof make>, name: string, failure?: Error) =>
    texture.addEventListener("dispose", () => {
      attempts.push(name);
      if (failure !== undefined) throw failure;
    });
  const outcome = (promise: Promise<void>) => promise
    .then(() => ({ passed: true, error: undefined }))
    .catch((error: unknown) => ({ passed: false, error }));

  const first = make();
  const later = make();
  record(first, "first-source"); record(later, "later-source");
  const failing = new AutoMovieTextureCache(async (asset) => asset === "first" ? first : later);
  await failing.prime(["first", "later"]);
  const failure = new Error("first-clone-retirement");
  const firstClone = failing.resolve("first");
  const laterClone = failing.resolve("later");
  firstClone.addEventListener("dispose", () => { attempts.push("first-clone"); throw failure; });
  laterClone.addEventListener("dispose", () => { attempts.push("later-clone"); });
  const firstClose = failing.dispose();
  const secondClose = failing.dispose();
  TestValidator.predicate("concurrent close shares its actual completion", firstClose === secondClose);
  const failed = await outcome(firstClose);
  TestValidator.predicate("single retirement retains its original Error", !failed.passed && failed.error === failure);
  TestValidator.equals("first failure cannot skip another owned Texture", attempts,
    ["first-clone", "later-clone", "first-source", "later-source"]);
  TestValidator.equals("failed cache bookkeeping is closed", failing.size, 0);
  TestValidator.predicate("failed closure refuses new bindings", throwsError(() => failing.resolve("first"), "disposed"));
  TestValidator.predicate("repeat failure is the same promise", failing.dispose() === firstClose);
  const repeated = await outcome(failing.dispose());
  TestValidator.predicate("repeat retains the same original Error", repeated.error === failure);
  TestValidator.equals("repeat makes no new retirement attempt", attempts.length, 4);

  attempts.length = 0;
  const aliased = make();
  record(aliased, "aliased-source");
  const aliasLoader = async () => aliased;
  const aliasCache = new AutoMovieTextureCache(aliasLoader);
  await aliasCache.prime(["alias-a", "alias-b"]);
  const aliasA = aliasCache.resolve("alias-a");
  const aliasB = aliasCache.resolve("alias-b");
  TestValidator.predicate("aliases still create actual independent wrappers", aliasA !== aliasB && aliasA.source === aliasB.source);
  aliasA.addEventListener("dispose", () => { attempts.push("alias-a"); });
  aliasB.addEventListener("dispose", () => { attempts.push("alias-b"); });
  const aliasClose = aliasCache.dispose();
  const aliasResult = await outcome(aliasClose);
  TestValidator.equals("supported alias closure succeeds", aliasResult.passed, true);
  TestValidator.predicate("successful closure retains its completion", aliasCache.dispose() === aliasClose);
  await aliasCache.dispose();
  TestValidator.equals("dedup original object rather than shared Source", attempts, ["alias-a", "alias-b", "aliased-source"]);

  attempts.length = 0;
  const brokenSource = make();
  const healthySource = make();
  const sourceFailure = new Error("source-retirement");
  record(brokenSource, "broken-source", sourceFailure); record(healthySource, "healthy-source");
  const multiple = new AutoMovieTextureCache(async (asset) => asset === "broken" ? brokenSource : healthySource);
  await multiple.prime(["broken", "healthy"]);
  const cloneFailures = [new Error("clone-a"), new Error("clone-b")];
  for (let index = 0; index < cloneFailures.length; index++) {
    const clone = multiple.resolve("broken");
    const error = cloneFailures[index]!;
    clone.addEventListener("dispose", () => { attempts.push(`broken-clone:${index}`); throw error; });
  }
  const multipleResult = await outcome(multiple.dispose());
  TestValidator.predicate("several native failures remain aggregated", multipleResult.error instanceof AggregateError);
  const aggregateErrors = (multipleResult.error as AggregateError).errors;
  const expectedErrors = [...cloneFailures, sourceFailure];
  TestValidator.equals("aggregate retains every failure", aggregateErrors.length, expectedErrors.length);
  TestValidator.predicate("aggregate preserves original ordered identities",
    aggregateErrors.every((error: unknown, index: number) => error === expectedErrors[index]));
  TestValidator.equals("healthy source is attempted after every failure", attempts,
    ["broken-clone:0", "broken-clone:1", "broken-source", "healthy-source"]);
  TestValidator.equals("multi-failure cache bookkeeping is cleared", multiple.size, 0);

  attempts.length = 0;
  // The native Promise constructor invokes its executor before returning.
  let resolveDeferred!: (texture: ReturnType<typeof make>) => void;
  const deferred = new Promise<ReturnType<typeof make>>((resolve) => { resolveDeferred = resolve; });
  const pendingSource = make();
  record(pendingSource, "pending-source");
  const pending = new AutoMovieTextureCache(() => deferred);
  const priming = pending.prime(["pending"]);
  const pendingClose = pending.dispose();
  TestValidator.predicate("in-flight closure shares completion", pending.dispose() === pendingClose);
  let completed = false;
  const completion = pendingClose.then(() => { completed = true; });
  await Promise.resolve();
  TestValidator.equals("close cannot complete before its decode", completed, false);
  const closedPrime = await outcome(pending.prime(["late"]));
  TestValidator.predicate("pending release immediately rejects new work", !closedPrime.passed);
  resolveDeferred(pendingSource);
  await priming; await pendingClose; await completion;
  TestValidator.equals("settled pending source retires once", [attempts, pending.size, completed], [["pending-source"], 0, true]);

  attempts.length = 0;
  const reentrantSource = make();
  record(reentrantSource, "reentrant-source");
  let reentrantClose: Promise<void> | undefined;
  const reentrant = new AutoMovieTextureCache(async () => {
    reentrantClose = reentrant.dispose();
    return reentrantSource;
  });
  await reentrant.prime(["reentrant"]);
  await reentrantClose;
  TestValidator.equals("loader teardown cannot miss its registered decode", [attempts, reentrant.size], [["reentrant-source"], 0]);

  attempts.length = 0;
  const syncHealthy = make();
  record(syncHealthy, "sync-healthy");
  const syncFailure = new Error("sync-host-decode");
  const sync = new AutoMovieTextureCache((asset) => {
    if (asset === "broken") throw syncFailure;
    return Promise.resolve(syncHealthy);
  });
  const primeFailure = await outcome(sync.prime(["broken", "healthy"]));
  TestValidator.predicate("sync decode failure names only its asset",
    primeFailure.error instanceof Error && primeFailure.error.message.includes("broken") && !primeFailure.error.message.includes("healthy"));
  await sync.dispose();
  TestValidator.equals("sync failed decode preserves healthy source ownership", [attempts, sync.size], [["sync-healthy"], 0]);

  const empty = new AutoMovieTextureCache(aliasLoader);
  const emptyClose = empty.dispose();
  TestValidator.predicate("empty cache has one successful completion", empty.dispose() === emptyClose);
  await emptyClose;
  TestValidator.equals("empty cache remains empty", empty.size, 0);

  const healthyRetirement = createAutoMovieResourceRetirement([]);
  const healthyCompletion = healthyRetirement();
  TestValidator.predicate("empty retirement shares its completion", healthyRetirement() === healthyCompletion);
  await healthyCompletion;
  const primary = new Error("preparation");
  const failedGroup = new Error("geometry callback");
  const rejectedCache = new Error("cache completion");
  const independent: string[] = [];
  const combined = createAutoMovieResourceRetirement([
    () => { independent.push("group"); throw new AggregateError([failedGroup]); },
    () => { independent.push("cache"); return Promise.reject(rejectedCache); },
    () => { independent.push("later"); },
  ], { error: primary });
  const combinedCompletion = combined();
  const combinedResult = await outcome(combinedCompletion);
  TestValidator.equals("group failure never skips independent cache or later resource", independent,
    ["group", "cache", "later"]);
  TestValidator.predicate("all original failure identities stay ordered",
    combinedResult.error instanceof AggregateError && combinedResult.error.errors.length === 3 &&
    combinedResult.error.errors[0] === primary && combinedResult.error.errors[1] === failedGroup &&
    combinedResult.error.errors[2] === rejectedCache);
  const combinedError = combinedResult.error;
  TestValidator.predicate("existing message-based status can see every cause",
    combinedError instanceof Error && [primary, failedGroup, rejectedCache]
      .every((error) => combinedError.message.includes(error.message)));
  TestValidator.predicate("failed retirement returns its same completion", combined() === combinedCompletion);
  const sole = await outcome(createAutoMovieResourceRetirement([() => { throw failedGroup; }])());
  TestValidator.predicate("single cleanup failure preserves identity", sole.error === failedGroup);
  const onlyPrimary = await outcome(createAutoMovieResourceRetirement([], { error: primary })());
  TestValidator.predicate("primary-only failure is never success", onlyPrimary.error === primary);
  const opaque = new AggregateError([], "opaque callback");
  const opaqueResult = await outcome(createAutoMovieResourceRetirement([() => { throw opaque; }])());
  TestValidator.predicate("empty aggregate retains original opaque identity", opaqueResult.error === opaque);
  const primaryAggregate = new AggregateError([primary], "primary aggregate");
  TestValidator.predicate("primary aggregate is not substituted when cleanup succeeds",
    (await outcome(createAutoMovieResourceRetirement([], { error: primaryAggregate })())).error === primaryAggregate);
  const rejectHostCause = (reason: unknown): Promise<never> => Promise.reject(reason);
  const scalarFailure = await outcome(createAutoMovieResourceRetirement([
    () => rejectHostCause(null), () => rejectHostCause("non-Error cause"),
  ])());
  TestValidator.predicate("non-Error causes remain typed unknown original values",
    scalarFailure.error instanceof AggregateError && scalarFailure.error.errors[0] === null &&
    scalarFailure.error.errors[1] === "non-Error cause" && scalarFailure.error.message.includes("non-Error cause"));
  const unreadable = { toString: () => { throw new Error("diagnostic conversion"); } };
  const unreadableResult = await outcome(createAutoMovieResourceRetirement([
    () => { throw unreadable; }, () => { throw rejectedCache; },
  ])());
  TestValidator.predicate("diagnostic conversion never substitutes an original cause",
    unreadableResult.error instanceof AggregateError && unreadableResult.error.errors[0] === unreadable &&
    unreadableResult.error.errors[1] === rejectedCache && unreadableResult.error.message.includes("Unprintable"));
  let finishIndependent!: () => void;
  const waiting = new Promise<undefined>((resolve) => { finishIndependent = () => resolve(undefined); });
  let reenteredCompletion: Promise<void> | undefined;
  let reachedLater = false;
  const duringRetirement = createAutoMovieResourceRetirement([
    () => { reenteredCompletion = duringRetirement(); return waiting; },
    () => { reachedLater = true; },
  ]);
  const waitingCompletion = duringRetirement();
  await Promise.resolve();
  TestValidator.predicate("reentry sees the already registered completion", reenteredCompletion === waitingCompletion);
  TestValidator.equals("pending first owner cannot delay later attempt", reachedLater, true);
  finishIndependent();
  await waitingCompletion;

  const terminateFailure = new Error("owned numeric transport termination");
  let terminationAttempts = 0;
  const disposedMessages: { id: number; input: number }[] = [];
  const disposedPort: HumanResidentPort<number, number> = {
    onmessage: null, onerror: null,
    postMessage: (message) => { disposedMessages.push(message); },
    terminate: () => { terminationAttempts++; throw terminateFailure; },
  };
  const disposedConnection = createHumanResidentWorker(() => disposedPort);
  const disposedRequestA = disposedConnection.request(11);
  const disposedRequestB = disposedConnection.request(22);
  const disposedOutcomeA = disposedRequestA.result.then((value) => ({ value, error: undefined }))
    .catch((error: unknown) => ({ value: undefined, error }));
  const disposedOutcomeB = disposedRequestB.result.then((value) => ({ value, error: undefined }))
    .catch((error: unknown) => ({ value: undefined, error }));
  let originalTermination: unknown;
  try { disposedConnection.dispose(); } catch (error) { originalTermination = error; }
  for (const message of disposedMessages)
    disposedPort.onmessage?.({ data: { id: message.id, success: true, value: message.input } });
  disposedRequestA.cancel(); disposedRequestB.cancel();
  const disposedResults = await Promise.all([disposedOutcomeA, disposedOutcomeB]);
  TestValidator.predicate("owned host termination error reaches its original caller", originalTermination === terminateFailure);
  TestValidator.predicate("termination failure cannot leave either request pending",
    disposedResults.every((result) => result.error instanceof Error && result.error.message.includes("disposed")));
  disposedConnection.dispose();
  TestValidator.equals("repeat disposal cannot reterminate the withdrawn connection", terminationAttempts, 1);
  const refusedDisposedRequest = await outcome(disposedConnection.request(33).result.then(() => undefined));
  TestValidator.predicate("disposed request owner refuses new work",
    refusedDisposedRequest.error instanceof Error);

  const healthyPort: HumanResidentPort<number, number> = {
    onmessage: null, onerror: null,
    postMessage: ({ id, input }) => { healthyPort.onmessage?.({ data: { id, success: true, value: input * 2 } }); },
    terminate: () => { terminationAttempts++; },
  };
  const healthyConnection = createHumanResidentWorker(() => healthyPort);
  TestValidator.equals("supported primitive transport returns its actual value", await healthyConnection.request(7).result, 14);
  healthyConnection.dispose();

  let connections = 0;
  const brokenMessages: { id: number; input: number }[] = [];
  const brokenPort: HumanResidentPort<number, number> = {
    onmessage: null, onerror: null,
    postMessage: (message) => { brokenMessages.push(message); },
    terminate: () => { terminationAttempts++; throw terminateFailure; },
  };
  const recoveredPort: HumanResidentPort<number, number> = {
    onmessage: null, onerror: null,
    postMessage: ({ id, input }) => { recoveredPort.onmessage?.({ data: { id, success: true, value: input + 1 } }); },
    terminate: () => { terminationAttempts++; },
  };
  const recoverable = createHumanResidentWorker(() => ++connections === 1 ? brokenPort : recoveredPort);
  const waitingA = recoverable.request(1);
  const waitingB = recoverable.request(2);
  const waitingResults = [waitingA, waitingB].map((request) => request.result
    .then((value) => ({ value, error: undefined }))
    .catch((error: unknown) => ({ value: undefined, error })));
  let transportTermination: unknown;
  try { brokenPort.onerror?.({ message: "primitive transport lost" }); }
  catch (error) { transportTermination = error; }
  for (const message of brokenMessages)
    brokenPort.onmessage?.({ data: { id: message.id, success: true, value: message.input } });
  waitingA.cancel(); waitingB.cancel();
  TestValidator.predicate("transport-failure termination preserves original host identity", transportTermination === terminateFailure);
  TestValidator.predicate("transport loss settles all correlated pending requests",
    (await Promise.all(waitingResults)).every((result) =>
      result.error instanceof Error && result.error.message === "primitive transport lost"));
  TestValidator.equals("next request opens its supported fresh connection", await recoverable.request(8).result, 9);
  TestValidator.equals("transport replacement uses exactly two supplied owners", connections, 2);
  recoverable.dispose();
};
