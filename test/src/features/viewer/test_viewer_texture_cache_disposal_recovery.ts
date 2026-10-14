import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { AutoMovieTextureCache, createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { HumanResidentPort } from "@automovie/viewer/human/common/HumanResidentPort";
import type { IHumanResidentRequest } from "@automovie/viewer/human/common/IHumanResidentRequest";
import { createHumanResidentWorker } from "@automovie/viewer/human/common/createHumanResidentWorker";
import { throwsError } from "../internal/predicates";

/**
 * Cache closure owns one completion and attempts each real Texture wrapper, retaining native disposal failures rather than skipping later resources. These public event observations are attempt counts, not GPU allocation counts.
 *
 * Scenarios:
 * 1. A throwing first clone cannot skip later clones or sources, and repeats retain the same failed promise and original Error without another attempt.
 * 2. Two asset aliases retire one original object once but both Source-sharing clones individually; several failures retain their original ordered values.
 * 3. Pending and reentrant host decodes remain owned until they independently settle; closure is shared and new work is immediately refused.
 * 4. A synchronous decode failure is named without losing its healthy neighbour; empty and successful caches close once through the same public lifetime.
 * 5. A generic resource completion starts all independent owners before waiting, keeps primary and original ordered causes, and is shared during reentry.
 * 6. Existing primitive number-message transports retain termination failures with their request cause, settle all pending work and refuse later allocation or another native termination attempt; a healthy port forwards its value.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises real texture wrappers through cache/resource retirement and the existing primitive-message resident port seam. Assertions observe completion identity, actual disposal events, pending settlement and failed-owner allocation refusal; they do not inspect source text or declare native GPU bytes freed.
 * @evidence contracts/testing.md#independent-expectations One-attempt ownership and independent retirement require each supplied owner to be called once despite another failure, with original causes retained. Controlled existing ports supply their own numerical values independently of the coordinator; exact promise/error identities verify completion sharing rather than snapshots of derived geometry.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/healthy/failing/aliased and pending/reentrant texture scopes, synchronous decode refusal, multi-owner asynchronous retirement and existing healthy/failing primitive ports. Failed termination must remain terminal and retain both causes; texture pipeline/viewer appearance are owned by other cases and are not certified here.
 * @evidence contracts/testing.md#execution-ownership The exported named unit entry uses portable promise semantics, public three.js Texture disposal events and the existing caller-owned number-message port callbacks. It installs no browser, native worker, process, renderer or GPU and adds no Human figure/probe/mock asset or validation driver.
 */
export async function test_viewer_texture_cache_disposal_recovery(): Promise<void> {
  /** Completion observation keeps a native rejection value without coercion. */
  type Outcome = { passed: boolean; error: unknown };
  /** An existing primitive port supplies its own value or original refusal. */
  type NumericOutcome = { value: number | undefined; error: unknown };
  const make: () => THREE.DataTexture = (): THREE.DataTexture =>
    new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const attempts: string[] = [];
  const record: (
    texture: THREE.DataTexture,
    name: string,
    failure?: Error,
  ) => void = (
    texture: ReturnType<typeof make>,
    name: string,
    failure?: Error,
  ): void =>
    texture.addEventListener("dispose", (): void => {
      attempts.push(name);
      if (failure !== undefined) throw failure;
    });
  const outcome: (promise: Promise<void>) => Promise<Outcome> = (
    promise: Promise<void>,
  ): Promise<Outcome> =>
    promise
      .then((): { passed: boolean; error: undefined } => ({
        passed: true,
        error: undefined,
      }))
      .catch((error: unknown): { passed: boolean; error: unknown } => ({
        passed: false,
        error,
      }));

  const first: THREE.DataTexture = make();
  const later: THREE.DataTexture = make();
  record(first, "first-source");
  record(later, "later-source");
  const failing: AutoMovieTextureCache = new AutoMovieTextureCache(
    async (asset: string): Promise<THREE.DataTexture> =>
      asset === "first" ? first : later,
  );
  await failing.prime(["first", "later"]);
  const failure: Error = new Error("first-clone-retirement");
  const firstClone: THREE.Texture<unknown, THREE.TextureEventMap> =
    failing.resolve("first");
  const laterClone: THREE.Texture<unknown, THREE.TextureEventMap> =
    failing.resolve("later");
  firstClone.addEventListener("dispose", (): never => {
    attempts.push("first-clone");
    throw failure;
  });
  laterClone.addEventListener("dispose", (): void => {
    attempts.push("later-clone");
  });
  const firstClose: Promise<void> = failing.dispose();
  const secondClose: Promise<void> = failing.dispose();
  TestValidator.predicate(
    "concurrent close shares its actual completion",
    firstClose === secondClose,
  );
  const failed: Outcome = await outcome(firstClose);
  TestValidator.predicate(
    "single retirement retains its original Error",
    !failed.passed && failed.error === failure,
  );
  TestValidator.equals(
    "first failure cannot skip another owned Texture",
    attempts,
    ["first-clone", "later-clone", "first-source", "later-source"],
  );
  TestValidator.equals("failed cache bookkeeping is closed", failing.size, 0);
  TestValidator.predicate(
    "failed closure refuses new bindings",
    throwsError(
      (): THREE.Texture<unknown, THREE.TextureEventMap> =>
        failing.resolve("first"),
      "disposed",
    ),
  );
  TestValidator.predicate(
    "repeat failure is the same promise",
    failing.dispose() === firstClose,
  );
  const repeated: Outcome = await outcome(failing.dispose());
  TestValidator.predicate(
    "repeat retains the same original Error",
    repeated.error === failure,
  );
  TestValidator.equals(
    "repeat makes no new retirement attempt",
    attempts.length,
    4,
  );

  attempts.length = 0;
  const aliased: THREE.DataTexture = make();
  record(aliased, "aliased-source");
  const aliasLoader: () => Promise<THREE.DataTexture> =
    async (): Promise<THREE.DataTexture> => aliased;
  const aliasCache: AutoMovieTextureCache = new AutoMovieTextureCache(
    aliasLoader,
  );
  await aliasCache.prime(["alias-a", "alias-b"]);
  const aliasA: THREE.Texture<unknown, THREE.TextureEventMap> =
    aliasCache.resolve("alias-a");
  const aliasB: THREE.Texture<unknown, THREE.TextureEventMap> =
    aliasCache.resolve("alias-b");
  TestValidator.predicate(
    "aliases still create actual independent wrappers",
    aliasA !== aliasB && aliasA.source === aliasB.source,
  );
  aliasA.addEventListener("dispose", (): void => {
    attempts.push("alias-a");
  });
  aliasB.addEventListener("dispose", (): void => {
    attempts.push("alias-b");
  });
  const aliasClose: Promise<void> = aliasCache.dispose();
  const aliasResult: Outcome = await outcome(aliasClose);
  TestValidator.equals(
    "supported alias closure succeeds",
    aliasResult.passed,
    true,
  );
  TestValidator.predicate(
    "successful closure retains its completion",
    aliasCache.dispose() === aliasClose,
  );
  await aliasCache.dispose();
  TestValidator.equals(
    "dedup original object rather than shared Source",
    attempts,
    ["alias-a", "alias-b", "aliased-source"],
  );

  attempts.length = 0;
  const brokenSource: THREE.DataTexture = make();
  const healthySource: THREE.DataTexture = make();
  const sourceFailure: Error = new Error("source-retirement");
  record(brokenSource, "broken-source", sourceFailure);
  record(healthySource, "healthy-source");
  const multiple: AutoMovieTextureCache = new AutoMovieTextureCache(
    async (asset: string): Promise<THREE.DataTexture> =>
      asset === "broken" ? brokenSource : healthySource,
  );
  await multiple.prime(["broken", "healthy"]);
  const cloneFailures: Error[] = [new Error("clone-a"), new Error("clone-b")];
  for (let index: number = 0; index < cloneFailures.length; index++) {
    const clone: THREE.Texture<unknown, THREE.TextureEventMap> =
      multiple.resolve("broken");
    const error: Error = cloneFailures[index]!;
    clone.addEventListener("dispose", (): never => {
      attempts.push(`broken-clone:${index}`);
      throw error;
    });
  }
  const multipleResult: Outcome = await outcome(multiple.dispose());
  TestValidator.predicate(
    "several native failures remain aggregated",
    multipleResult.error instanceof AggregateError,
  );
  const aggregateErrors: unknown[] = (multipleResult.error as AggregateError)
    .errors;
  const expectedErrors: Error[] = [...cloneFailures, sourceFailure];
  TestValidator.equals(
    "aggregate retains every failure",
    aggregateErrors.length,
    expectedErrors.length,
  );
  TestValidator.predicate(
    "aggregate preserves original ordered identities",
    aggregateErrors.every(
      (error: unknown, index: number): boolean =>
        error === expectedErrors[index],
    ),
  );
  TestValidator.equals(
    "healthy source is attempted after every failure",
    attempts,
    ["broken-clone:0", "broken-clone:1", "broken-source", "healthy-source"],
  );
  TestValidator.equals(
    "multi-failure cache bookkeeping is cleared",
    multiple.size,
    0,
  );

  attempts.length = 0;
  // The native Promise constructor invokes its executor before returning.
  let resolveDeferred!: (texture: ReturnType<typeof make>) => void;
  const deferred: Promise<THREE.DataTexture> = new Promise<
    ReturnType<typeof make>
  >(
    (
      resolve: (
        value: THREE.DataTexture | PromiseLike<THREE.DataTexture>,
      ) => void,
    ): void => {
      resolveDeferred = resolve;
    },
  );
  const pendingSource: THREE.DataTexture = make();
  record(pendingSource, "pending-source");
  const pending: AutoMovieTextureCache = new AutoMovieTextureCache(
    (): Promise<THREE.DataTexture> => deferred,
  );
  const priming: Promise<void> = pending.prime(["pending"]);
  const pendingClose: Promise<void> = pending.dispose();
  TestValidator.predicate(
    "in-flight closure shares completion",
    pending.dispose() === pendingClose,
  );
  let completed: boolean = false;
  const completion: Promise<void> = pendingClose.then((): void => {
    completed = true;
  });
  await Promise.resolve();
  TestValidator.equals(
    "close cannot complete before its decode",
    completed,
    false,
  );
  const closedPrime: Outcome = await outcome(pending.prime(["late"]));
  TestValidator.predicate(
    "pending release immediately rejects new work",
    !closedPrime.passed,
  );
  resolveDeferred(pendingSource);
  await priming;
  await pendingClose;
  await completion;
  TestValidator.equals(
    "settled pending source retires once",
    [attempts, pending.size, completed],
    [["pending-source"], 0, true],
  );

  attempts.length = 0;
  const reentrantSource: THREE.DataTexture = make();
  record(reentrantSource, "reentrant-source");
  let reentrantClose: Promise<void> | undefined;
  const reentrant: AutoMovieTextureCache = new AutoMovieTextureCache(
    async (): Promise<THREE.DataTexture> => {
      reentrantClose = reentrant.dispose();
      return reentrantSource;
    },
  );
  await reentrant.prime(["reentrant"]);
  await reentrantClose;
  TestValidator.equals(
    "loader teardown cannot miss its registered decode",
    [attempts, reentrant.size],
    [["reentrant-source"], 0],
  );

  attempts.length = 0;
  const syncHealthy: THREE.DataTexture = make();
  record(syncHealthy, "sync-healthy");
  const syncFailure: Error = new Error("sync-host-decode");
  const sync: AutoMovieTextureCache = new AutoMovieTextureCache(
    (asset: string): Promise<THREE.DataTexture> => {
      if (asset === "broken") throw syncFailure;
      return Promise.resolve(syncHealthy);
    },
  );
  const primeFailure: Outcome = await outcome(
    sync.prime(["broken", "healthy"]),
  );
  TestValidator.predicate(
    "sync decode failure names only its asset",
    primeFailure.error instanceof Error &&
      primeFailure.error.message.includes("broken") &&
      !primeFailure.error.message.includes("healthy"),
  );
  await sync.dispose();
  TestValidator.equals(
    "sync failed decode preserves healthy source ownership",
    [attempts, sync.size],
    [["sync-healthy"], 0],
  );

  const empty: AutoMovieTextureCache = new AutoMovieTextureCache(aliasLoader);
  const emptyClose: Promise<void> = empty.dispose();
  TestValidator.predicate(
    "empty cache has one successful completion",
    empty.dispose() === emptyClose,
  );
  await emptyClose;
  TestValidator.equals("empty cache remains empty", empty.size, 0);

  const healthyRetirement: () => Promise<void> =
    createAutoMovieResourceRetirement([]);
  const healthyCompletion: Promise<void> = healthyRetirement();
  TestValidator.predicate(
    "empty retirement shares its completion",
    healthyRetirement() === healthyCompletion,
  );
  await healthyCompletion;
  const primary: Error = new Error("preparation");
  const failedGroup: Error = new Error("geometry callback");
  const rejectedCache: Error = new Error("cache completion");
  const independent: string[] = [];
  const combined: () => Promise<never> = createAutoMovieResourceRetirement(
    [
      (): never => {
        independent.push("group");
        throw new AggregateError([failedGroup]);
      },
      (): Promise<void> => {
        independent.push("cache");
        return Promise.reject(rejectedCache);
      },
      (): void => {
        independent.push("later");
      },
    ],
    { error: primary },
  );
  const combinedCompletion: Promise<never> = combined();
  const combinedResult: Outcome = await outcome(combinedCompletion);
  TestValidator.equals(
    "group failure never skips independent cache or later resource",
    independent,
    ["group", "cache", "later"],
  );
  TestValidator.predicate(
    "all original failure identities stay ordered",
    combinedResult.error instanceof AggregateError &&
      combinedResult.error.errors.length === 3 &&
      combinedResult.error.errors[0] === primary &&
      combinedResult.error.errors[1] === failedGroup &&
      combinedResult.error.errors[2] === rejectedCache,
  );
  const combinedError: unknown = combinedResult.error;
  TestValidator.predicate(
    "existing message-based status can see every cause",
    combinedError instanceof Error &&
      [primary, failedGroup, rejectedCache].every((error: Error): boolean =>
        combinedError.message.includes(error.message),
      ),
  );
  TestValidator.predicate(
    "failed retirement returns its same completion",
    combined() === combinedCompletion,
  );
  const sole: Outcome = await outcome(
    createAutoMovieResourceRetirement([
      (): never => {
        throw failedGroup;
      },
    ])(),
  );
  TestValidator.predicate(
    "single cleanup failure preserves identity",
    sole.error === failedGroup,
  );
  const onlyPrimary: Outcome = await outcome(
    createAutoMovieResourceRetirement([], { error: primary })(),
  );
  TestValidator.predicate(
    "primary-only failure is never success",
    onlyPrimary.error === primary,
  );
  const opaque: AggregateError = new AggregateError([], "opaque callback");
  const opaqueResult: Outcome = await outcome(
    createAutoMovieResourceRetirement([
      (): never => {
        throw opaque;
      },
    ])(),
  );
  TestValidator.predicate(
    "empty aggregate retains original opaque identity",
    opaqueResult.error === opaque,
  );
  const primaryAggregate: AggregateError = new AggregateError(
    [primary],
    "primary aggregate",
  );
  TestValidator.predicate(
    "primary aggregate is not substituted when cleanup succeeds",
    (
      await outcome(
        createAutoMovieResourceRetirement([], { error: primaryAggregate })(),
      )
    ).error === primaryAggregate,
  );
  const rejectHostCause: (reason: unknown) => Promise<never> = (
    reason: unknown,
  ): Promise<never> => Promise.reject(reason);
  const scalarFailure: Outcome = await outcome(
    createAutoMovieResourceRetirement([
      (): Promise<never> => rejectHostCause(null),
      (): Promise<never> => rejectHostCause("non-Error cause"),
    ])(),
  );
  TestValidator.predicate(
    "non-Error causes remain typed unknown original values",
    scalarFailure.error instanceof AggregateError &&
      scalarFailure.error.errors[0] === null &&
      scalarFailure.error.errors[1] === "non-Error cause" &&
      scalarFailure.error.message.includes("non-Error cause"),
  );
  const unreadable: { toString: () => never } = {
    toString: (): never => {
      throw new Error("diagnostic conversion");
    },
  };
  const unreadableResult: Outcome = await outcome(
    createAutoMovieResourceRetirement([
      (): never => {
        throw unreadable;
      },
      (): never => {
        throw rejectedCache;
      },
    ])(),
  );
  TestValidator.predicate(
    "diagnostic conversion never substitutes an original cause",
    unreadableResult.error instanceof AggregateError &&
      unreadableResult.error.errors[0] === unreadable &&
      unreadableResult.error.errors[1] === rejectedCache &&
      unreadableResult.error.message.includes("Unprintable"),
  );
  let finishIndependent!: () => void;
  const waiting: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: PromiseLike<undefined> | undefined) => void): void => {
      finishIndependent = (): void => resolve(undefined);
    },
  );
  let reenteredCompletion: Promise<void> | undefined;
  let reachedLater: boolean = false;
  const duringRetirement: () => Promise<void> =
    createAutoMovieResourceRetirement([
      (): Promise<undefined> => {
        reenteredCompletion = duringRetirement();
        return waiting;
      },
      (): void => {
        reachedLater = true;
      },
    ]);
  const waitingCompletion: Promise<void> = duringRetirement();
  await Promise.resolve();
  TestValidator.predicate(
    "reentry sees the already registered completion",
    reenteredCompletion === waitingCompletion,
  );
  TestValidator.equals(
    "pending first owner cannot delay later attempt",
    reachedLater,
    true,
  );
  finishIndependent();
  await waitingCompletion;

  const terminateFailure: Error = new Error(
    "owned numeric transport termination",
  );
  let terminationAttempts: number = 0;
  const disposedMessages: { id: number; input: number }[] = [];
  const disposedPort: HumanResidentPort<number, number> = {
    onmessage: null,
    onerror: null,
    postMessage: (message: IHumanResidentRequest<number>): void => {
      disposedMessages.push(message);
    },
    terminate: (): never => {
      terminationAttempts++;
      throw terminateFailure;
    },
  };
  const disposedConnection: {
    request: (input: number) => { result: Promise<number>; cancel: () => void };
    dispose: () => void;
  } = createHumanResidentWorker(
    (): HumanResidentPort<number, number> => disposedPort,
  );
  const disposedRequestA: { result: Promise<number>; cancel: () => void } =
    disposedConnection.request(11);
  const disposedRequestB: { result: Promise<number>; cancel: () => void } =
    disposedConnection.request(22);
  const disposedOutcomeA: Promise<NumericOutcome> = disposedRequestA.result
    .then((value: number): { value: number; error: undefined } => ({
      value,
      error: undefined,
    }))
    .catch((error: unknown): { value: undefined; error: unknown } => ({
      value: undefined,
      error,
    }));
  const disposedOutcomeB: Promise<NumericOutcome> = disposedRequestB.result
    .then((value: number): { value: number; error: undefined } => ({
      value,
      error: undefined,
    }))
    .catch((error: unknown): { value: undefined; error: unknown } => ({
      value: undefined,
      error,
    }));
  let originalTermination: unknown;
  try {
    disposedConnection.dispose();
  } catch (error) {
    originalTermination = error;
  }
  for (const message of disposedMessages)
    disposedPort.onmessage?.({
      data: { id: message.id, success: true, value: message.input },
    });
  disposedRequestA.cancel();
  disposedRequestB.cancel();
  const disposedResults: [NumericOutcome, NumericOutcome] = await Promise.all([
    disposedOutcomeA,
    disposedOutcomeB,
  ]);
  TestValidator.predicate(
    "owned host failure retains disposal and termination causes",
    originalTermination instanceof AggregateError &&
      originalTermination.errors.length === 2 &&
      originalTermination.errors[0] instanceof Error &&
      originalTermination.errors[0].message.includes("disposed") &&
      originalTermination.errors[1] === terminateFailure,
  );
  TestValidator.predicate(
    "termination failure cannot leave either request pending",
    disposedResults.every(
      (result: NumericOutcome): boolean => result.error === originalTermination,
    ),
  );
  let repeatedTermination: unknown;
  try {
    disposedConnection.dispose();
  } catch (error) {
    repeatedTermination = error;
  }
  TestValidator.predicate(
    "repeat disposal preserves its failed completion",
    repeatedTermination === originalTermination,
  );
  TestValidator.equals(
    "repeat disposal cannot reterminate the withdrawn connection",
    terminationAttempts,
    1,
  );
  const refusedDisposedRequest: Outcome = await outcome(
    disposedConnection.request(33).result.then((): undefined => undefined),
  );
  TestValidator.predicate(
    "disposed request owner refuses new work",
    refusedDisposedRequest.error === originalTermination,
  );

  const healthyPort: HumanResidentPort<number, number> = {
    onmessage: null,
    onerror: null,
    postMessage: ({ id, input }: IHumanResidentRequest<number>): void => {
      healthyPort.onmessage?.({
        data: { id, success: true, value: input * 2 },
      });
    },
    terminate: (): void => {
      terminationAttempts++;
    },
  };
  const healthyConnection: {
    request: (input: number) => { result: Promise<number>; cancel: () => void };
    dispose: () => void;
  } = createHumanResidentWorker(
    (): HumanResidentPort<number, number> => healthyPort,
  );
  TestValidator.equals(
    "supported primitive transport returns its actual value",
    await healthyConnection.request(7).result,
    14,
  );
  healthyConnection.dispose();

  let connections: number = 0;
  const postFailure: Error = new Error("primitive transport lost");
  let failPost: boolean = false;
  const brokenMessages: { id: number; input: number }[] = [];
  const brokenPort: HumanResidentPort<number, number> = {
    onmessage: null,
    onerror: null,
    postMessage: (message: IHumanResidentRequest<number>): void => {
      if (failPost) throw postFailure;
      brokenMessages.push(message);
    },
    terminate: (): never => {
      terminationAttempts++;
      throw terminateFailure;
    },
  };
  const recoveredPort: HumanResidentPort<number, number> = {
    onmessage: null,
    onerror: null,
    postMessage: ({ id, input }: IHumanResidentRequest<number>): void => {
      recoveredPort.onmessage?.({
        data: { id, success: true, value: input + 1 },
      });
    },
    terminate: (): void => {
      terminationAttempts++;
    },
  };
  const recoverable: {
    request: (input: number) => { result: Promise<number>; cancel: () => void };
    dispose: () => void;
  } = createHumanResidentWorker(
    (): HumanResidentPort<number, number> =>
      ++connections === 1 ? brokenPort : recoveredPort,
  );
  const waitingA: { result: Promise<number>; cancel: () => void } =
    recoverable.request(1);
  const waitingB: { result: Promise<number>; cancel: () => void } =
    recoverable.request(2);
  const waitingResults: Promise<NumericOutcome>[] = [waitingA, waitingB].map(
    (request: {
      result: Promise<number>;
      cancel: () => void;
    }): Promise<NumericOutcome> =>
      request.result
        .then((value: number): { value: number; error: undefined } => ({
          value,
          error: undefined,
        }))
        .catch((error: unknown): { value: undefined; error: unknown } => ({
          value: undefined,
          error,
        })),
  );
  failPost = true;
  const postOutcome: NumericOutcome = await recoverable
    .request(3)
    .result.then(
      (value: number): NumericOutcome => ({ value, error: undefined }),
    )
    .catch((error: unknown): NumericOutcome => ({ value: undefined, error }));
  const transportTermination: unknown = postOutcome.error;
  brokenPort.onerror?.({ message: "stale primitive transport event" });
  for (const message of brokenMessages)
    brokenPort.onmessage?.({
      data: { id: message.id, success: true, value: message.input },
    });
  waitingA.cancel();
  waitingB.cancel();
  TestValidator.predicate(
    "transport-failure termination retains both original causes",
    transportTermination instanceof AggregateError &&
      transportTermination.errors.length === 2 &&
      transportTermination.errors[0] instanceof Error &&
      transportTermination.errors[0].message === "primitive transport lost" &&
      transportTermination.errors[0].cause === postFailure &&
      transportTermination.errors[1] === terminateFailure,
  );
  TestValidator.predicate(
    "transport loss settles all correlated pending requests",
    (await Promise.all(waitingResults)).every(
      (result: NumericOutcome): boolean =>
        result.error === transportTermination,
    ),
  );
  const refusedReplacement: Outcome = await outcome(
    recoverable.request(8).result.then((): undefined => undefined),
  );
  TestValidator.predicate(
    "failed termination refuses a replacement with its original completion",
    refusedReplacement.error === transportTermination,
  );
  TestValidator.equals(
    "failed transport retains exactly one supplied owner",
    connections,
    1,
  );
  let repeatedTransportTermination: unknown;
  try {
    recoverable.dispose();
  } catch (error) {
    repeatedTransportTermination = error;
  }
  TestValidator.predicate(
    "final disposal retains the failed transport completion",
    repeatedTransportTermination === transportTermination,
  );
}
