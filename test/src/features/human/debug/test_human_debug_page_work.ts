import { AutoMovieTextureCache } from "@automovie/viewer";
import { strict as assert } from "node:assert";
import * as THREE from "three";

import { HumanDebugOptions } from "../../../../../packages/human/debug/contracts/HumanDebugOptions";
import type { IHumanDebugOptions } from "../../../../../packages/human/debug/contracts/IHumanDebugOptions";
import { HumanDebugCameraState } from "../../../../../packages/human/debug/page/HumanDebugCameraState";
import { HumanDebugDocumentModel } from "../../../../../packages/human/debug/page/HumanDebugDocumentModel";
import { HumanDebugPageWork } from "../../../../../packages/human/debug/page/HumanDebugPageWork";
import type { IHumanDebugSubject } from "../../../../../packages/human/debug/page/IHumanDebugSubject";

/**
 * Page mutations retain admission order/inputs, actual-draw waits and terminal resource ownership.
 *
 * Scenarios:
 * 1. Passive camera reads preserve projection and release ordered input without a draw.
 * 2. Queued applies retain copied inputs and continue after an earlier failure.
 * 3. Actual draws settle current waiters, and closure rejects queued work and retires late textures.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the same page work/adoption owner as mount, real option records, an admitted triangle document and real TextureCache/Texture public disposal. No foreign method, global or generator is replaced.
 * @evidence contracts/development/testing.md#independent-expectations Explicit gates require first-start/first-end/second order; later mutation of caller arrays cannot change admitted values. A draw settles existing waiters, not future ones. A late subject's one owned texture emits one dispose event. Passive camera observation preserves zoom 3.5, matrices and placement exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers copied nested inputs, failure/next success, multiple/future draw waits, closed queued work, open/late subject transfer and real texture-disposal failure; perspective/orthographic and coincident-target camera reads. No rendered frame, physical GPU release or Human anatomy is certified.
 * @evidence contracts/development/testing.md#execution-ownership One async portable unit selected by human_debug_page_work. It owns explicit promise gates and CPU textures, retires each cache, and starts no person generation, browser, viewer, server, slot or watch.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Passive camera reads preserve projection and release ordered input without a draw.).
 */
export async function test_human_debug_page_work(): Promise<void> {
  for (const camera of [
    new THREE.PerspectiveCamera(40, 1.5, 0.1, 100),
    new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100),
  ]) {
    camera.position.set(5, 6, 7);
    camera.zoom = 3.5;
    const target: THREE.Vector3 = new THREE.Vector3(1, 2, 3);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    const original: string = JSON.stringify([
      camera.position.toArray(),
      camera.quaternion.toArray(),
      camera.projectionMatrix.toArray(),
      camera.zoom,
      target.toArray(),
    ]);
    const observed: ReturnType<typeof HumanDebugCameraState> =
      HumanDebugCameraState(camera, target);
    assert.equal(observed.placement.zoom, 3.5);
    assert.deepEqual(observed.placement.position, [5, 6, 7]);
    assert.deepEqual(observed.options.target, [1000, 2000, 3000]);
    assert.equal(observed.options.az, 45);
    assert.equal(observed.options.el, 35.3);
    assert.equal(observed.options.dist, Math.round(Math.sqrt(48) * 10000) / 10);
    assert.equal(observed.placement.near, 0.1);
    assert.equal(observed.placement.far, 100);
    assert.deepEqual(observed.placement.target, [1, 2, 3]);
    assert.deepEqual(observed.placement.up, [0, 1, 0]);
    assert.equal(
      observed.placement.fov,
      camera instanceof THREE.PerspectiveCamera ? 40 : null,
    );
    assert.equal(
      observed.placement.halfHeight,
      camera instanceof THREE.OrthographicCamera ? 2 : null,
    );
    assert.equal(
      JSON.stringify([
        camera.position.toArray(),
        camera.quaternion.toArray(),
        camera.projectionMatrix.toArray(),
        camera.zoom,
        target.toArray(),
      ]),
      original,
    );
  }
  const coincident: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const zero: ReturnType<typeof HumanDebugCameraState> = HumanDebugCameraState(
    coincident,
    coincident.position.clone(),
  );
  assert.equal(zero.options.dist, null);
  assert.equal(zero.options.az, 90);
  assert.deepEqual(zero.placement.position, [0, 0, 0]);
  const busy: boolean[] = [];
  const work: HumanDebugPageWork = new HumanDebugPageWork(
    (active: boolean): void => {
      busy.push(active);
    },
  );
  const passiveCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
  );
  passiveCamera.zoom = 4;
  const passive: ReturnType<typeof HumanDebugCameraState> = await work.run(
    async (): Promise<ReturnType<typeof HumanDebugCameraState>> =>
      HumanDebugCameraState(passiveCamera, new THREE.Vector3()),
  );
  assert.equal(passive.placement.zoom, 4);
  assert.equal(busy[busy.length - 1], false);
  const entered: ReturnType<typeof deferred<undefined>> = deferred<undefined>();
  const release: ReturnType<typeof deferred<undefined>> = deferred<undefined>();
  const order: string[] = [];
  const first: IHumanDebugOptions = HumanDebugOptions.defaults();
  first.part = ["nose"];
  const pendingFirst: Promise<string> = work.apply(
    first,
    [],
    async (options: IHumanDebugOptions): Promise<string> => {
      order.push("first:" + options.part.join(","));
      entered.resolve(undefined);
      await release.promise;
      order.push("first-end");
      return "one";
    },
  );
  const second: IHumanDebugOptions = HumanDebugOptions.defaults();
  second.part = ["lip.*"];
  second.target = [1, 2, 3];
  second.partColor = [{ pattern: "nose/*", colour: "ff0000" }];
  const messages: string[] = ["original"];
  const pendingSecond: Promise<string> = work.apply(
    second,
    messages,
    async (options: IHumanDebugOptions, notices: string[]): Promise<string> => {
      assert.deepEqual(options.part, ["lip.*"]);
      assert.deepEqual(options.target, [1, 2, 3]);
      assert.equal(options.partColor[0]!.colour, "ff0000");
      assert.deepEqual(notices, ["original"]);
      order.push("second");
      return "two";
    },
  );
  first.part.push("changed");
  second.part.push("changed");
  second.target[0] = 999;
  second.partColor[0]!.colour = "000000";
  messages.push("changed");
  await entered.promise;
  assert.deepEqual(order, ["first:nose"]);
  release.resolve(undefined);
  assert.deepEqual(await Promise.all([pendingFirst, pendingSecond]), [
    "one",
    "two",
  ]);
  assert.deepEqual(order, ["first:nose", "first-end", "second"]);

  const original: Error = new Error("first job failed");
  const failed: Promise<unknown> = work
    .run(async (): Promise<undefined> => {
      throw original;
    })
    .catch((error: unknown): unknown => error);
  const recovered: Promise<number> = work.run(async (): Promise<number> => 7);
  assert.equal(await failed, original);
  assert.equal(await recovered, 7);
  assert.equal(busy[busy.length - 1], false);

  let drawn: number = 0;
  const a: Promise<void> = work.nextFrame().then((): void => {
    drawn++;
  });
  const b: Promise<void> = work.nextFrame().then((): void => {
    drawn++;
  });
  await Promise.resolve();
  assert.equal(drawn, 0);
  work.drawn();
  await Promise.all([a, b]);
  assert.equal(drawn, 2);
  const c: Promise<void> = work.nextFrame().then((): void => {
    drawn++;
  });
  await Promise.resolve();
  assert.equal(drawn, 2);
  work.drawn();
  await c;
  assert.equal(drawn, 3);

  const started: ReturnType<typeof deferred<undefined>> = deferred<undefined>();
  const stopGate: ReturnType<typeof deferred<undefined>> =
    deferred<undefined>();
  const active: Promise<unknown> = work
    .run(async (): Promise<undefined> => {
      started.resolve(undefined);
      await stopGate.promise;
      return undefined;
    })
    .catch((error: unknown): unknown => error);
  let laterCalls: number = 0;
  const later: Promise<unknown> = work
    .run(async (): Promise<undefined> => {
      laterCalls++;
      return undefined;
    })
    .catch((error: unknown): unknown => error);
  const stoppedFrame: Promise<unknown> = work
    .nextFrame()
    .catch((error: unknown): unknown => error);
  await started.promise;
  work.close();
  work.close();
  stopGate.resolve(undefined);
  for (const error of await Promise.all([active, later, stoppedFrame]))
    assert.match(String(error), /Human debug page closed/);
  assert.equal(laterCalls, 0);
  assert.equal(busy[busy.length - 1], true);
  await assert.rejects(
    work.run(async (): Promise<undefined> => undefined),
    /page closed/,
  );

  for (const scenario of ["open", "late", "retirement-failed"] as const) {
    const texture: THREE.Texture = new THREE.Texture();
    const disposalFailure: Error = new Error("texture retirement failed");
    let disposals: number = 0;
    texture.addEventListener("dispose", (): void => {
      disposals++;
      if (scenario === "retirement-failed") throw disposalFailure;
    });
    const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
      async (): Promise<THREE.Texture> => texture,
    );
    await cache.prime(["owned"]);
    const page: HumanDebugPageWork = new HumanDebugPageWork((): void => {});
    const loaded: ReturnType<typeof deferred<IHumanDebugSubject>> =
      deferred<IHumanDebugSubject>();
    let received: IHumanDebugSubject | undefined;
    const adopted: Promise<unknown> = page
      .adopt(
        loaded.promise,
        (subject: IHumanDebugSubject): IHumanDebugSubject => {
          received = subject;
          return subject;
        },
      )
      .catch((error: unknown): unknown => error);
    if (scenario !== "open") page.close();
    const subject: IHumanDebugSubject = resourceSubject(cache);
    loaded.resolve(subject);
    const outcome: unknown = await adopted;
    if (scenario === "open") {
      assert.equal(outcome, subject);
      assert.equal(received, subject);
      assert.equal(disposals, 0);
      await cache.dispose();
      page.close();
      await cache.dispose();
      assert.equal(disposals, 1);
    } else {
      assert.equal(received, undefined);
      assert.equal(disposals, 1);
      if (scenario === "late") assert.match(String(outcome), /page closed/);
      else {
        assert.ok(outcome instanceof AggregateError);
        assert.match(String(outcome.errors[0]), /page closed/);
        assert.ok(outcome.errors.includes(disposalFailure));
        await assert.rejects(
          cache.dispose(),
          (error: unknown): boolean => error === disposalFailure,
        );
        assert.equal(disposals, 1);
      }
    }
  }
}

/** Explicit CPU gates; no timer, global replacement or producer instrumentation. */
function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let release!: (value: T) => void;
  const promise: Promise<T> = new Promise<T>(
    (resolve: (value: T | PromiseLike<T>) => void): void => {
      release = resolve;
    },
  );
  return { promise, resolve: release };
}

/** An admitted analytic document carrying a real cache, used only for ownership, never anatomy. */
function resourceSubject(cache: AutoMovieTextureCache): IHumanDebugSubject {
  const document: ReturnType<typeof HumanDebugDocumentModel.assemble> =
    HumanDebugDocumentModel.assemble({
      parts: [
        {
          id: "human.skin.lifecycle/0",
          space: "body-mm",
          frame: {
            origin: [0, 0, 0],
            forward: [1, 0, 0],
            up: [0, 1, 0],
            left: [0, 0, 1],
          },
          points: [
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
          ],
          indices: [0, 1, 2],
          curves: [],
        },
      ],
      provenance: { test: "analytic ownership document" },
    });
  return {
    ...document,
    key: { person: "f1", piece: "lifecycle", pose: null },
    textures: cache,
    provenance: { test: "CPU ownership only" },
    milliseconds: 0,
  };
}
