import type {
  IAutoMovieInspectionTrail,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieRenderDraw,
  AutoMovieRenderInspection,
  type IAutoMovieRenderDrawScene,
} from "@automovie/render";
import assert from "node:assert/strict";
import * as THREE from "three";

import { InspectionScene } from "../../internal/InspectionScene";
import { createRecordedFilmSubject } from "../../internal/createRecordedFilmSubject";

/**
 * Both draw hosts use the authoritative motion-trail sampler. It records the
 * real played clock, author baseline and actual placed forward separately. A
 * changed support ends a segment. An ordinary sample keeps its original shape
 * without an opted-in source. Authored breaks split played samples and explicit
 * same-entry continuity can preserve a measured supported origin across a
 * remount.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the played clock, authored and realized data, projection and support-local control.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the public sampler and mark producer with one cut, a following film camera, actual moved and rotated support nodes, a detached support, a producer-free read, a declared teleport, and authorized or unsupported remounts.
 * @evidence contracts/development/testing.md#independent-expectations A cut at output 2 s keeps A at local 2.5 s before it, then B at local 0 and 0.5 s. The declared local +Z axis is turned 30 degrees in world space and the camera targets the observed origin. The fixed local socket sits at its independent anchor on the moving support. Source absence and zero trail selection have distinct expected shapes and work counts. A shot-local break at 1.625 lies between output 0.5 and 0.75. The compatible remount shares a supported origin and actual source token, unlike the missing, unsupported and hard-cut controls.
 */
export async function test_render_draw_sample_authored_motion_trails(): Promise<void> {
  const { subject: stock, calls } = createRecordedFilmSubject({
    transition: null,
    seekShot: true,
    optics: false,
  });
  const hero = stock.scene.getObjectByName("hero")!;
  const deck = new THREE.Group();
  deck.name = "deck";
  const socket = new THREE.Object3D();
  const anchor: IAutoMovieVector3 = { x: 0.2, y: 0, z: 0.15 };
  socket.position.set(anchor.x, anchor.y, anchor.z);
  deck.add(socket);
  stock.scene.add(deck);
  const detached = new THREE.Group();
  detached.name = "detached";
  const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const route: IAutoMovieInspectionTrail.IAuthoredRoute = {
    id: "walk",
    points: [point(0, 0, -5), point(3, 0, -5)],
    requestedSpeed: 1.2,
    effectiveSpeed: 1,
  };
  const seek = stock.seek;
  let reads: number = 0;
  const subject: IAutoMovieRenderDrawScene<never> = {
    ...stock,
    seek: async (seconds: number): Promise<void> => {
      await seek(seconds);
      hero.position.set(seconds, 0.2, -5);
      hero.rotation.y = Math.PI / 6;
      deck.position.set(-1 + seconds / 4, 0, 0.2);
      deck.rotation.y = seconds / 4;
      stock.camera.position.copy(hero.position).add(new THREE.Vector3(0, 2, 4));
      stock.camera.lookAt(hero.position);
    },
    inspectMotionTrail: {
      read(sample) {
        reads++;
        assert.strictEqual(sample.object, hero);
        return {
          route,
          baseline: {
            time: sample.time.shot!.seconds,
            position: point(sample.time.filmSeconds, 0, -5),
            yawDeg: 90,
            tangent: point(1, 0, 0),
          },
          phase: 0.25,
          forwardAxis: point(0, 0, 1),
          support: {
            socket,
            support: sample.time.filmSeconds <= 2 ? deck : detached,
            anchor,
          },
        };
      },
    },
  };
  const request = InspectionScene.ask({
    trail: ["hero"],
    marks: ["trail"],
    reach: 0.5,
    ticks: 2,
  });
  const trails = await AutoMovieRenderDraw.samplePlayedTrails(
    "two shots",
    subject,
    request,
    2,
  );
  assert.equal(reads, 3);
  assert.deepEqual(
    trails.map(({ times }) => times),
    [[1.5], [2], [2.5]],
  );
  assert.deepEqual(
    trails.map(({ positions }) => positions),
    [
      [1.5, 0.2, -5],
      [2, 0.2, -5],
      [2.5, 0.2, -5],
    ],
  );
  const sampled = trails.flatMap(({ motion }) => motion!.samples);
  assert.deepEqual(
    sampled.map(({ time, entry }) => [time.outputFrame, entry, time.shot]),
    [
      [36, 0, { path: "shot:a", seconds: 2.5 }],
      [48, 1, { path: "shot:b", seconds: 0 }],
      [60, 1, { path: "shot:b", seconds: 0.5 }],
    ],
  );
  for (const element of sampled) {
    assert.equal(element.baseline?.yawDeg, 90);
    assert.equal(element.baseline?.position.y, 0);
    assert.equal(element.phase, 0.25);
    assertNear(element.forward?.x, 0.5);
    assertNear(element.forward?.z, Math.sqrt(3) / 2);
    assert.equal(element.projection.status, "in-frame");
    if (element.projection.status === "in-frame") {
      assertNear(element.projection.ndc.x, 0);
      assertNear(element.projection.ndc.y, 0);
    }
  }
  assert.strictEqual(trails[1]?.motion?.route, route);
  const contact = sampled[1]?.support;
  assert.equal(contact?.status, "observed");
  assert.equal(contact.path, "deck");
  assertNear(contact.local.x, anchor.x);
  assertNear(contact.local.z, anchor.z);
  assertNear(contact.gap, 0);
  assertNear(contact.slip, 0);
  assert.deepEqual(sampled[2]?.support, { status: "unavailable" });
  const authored = AutoMovieRenderInspection.markTrails(trails, 2).filter(
    ({ kind }) => kind === "trail/route",
  );
  assert.deepEqual(
    authored.map(({ shape }) => shape),
    [
      {
        type: "polyline",
        points: [0, 0, -5, 3, 0, -5],
        closed: false,
      },
    ],
  );

  calls.length = 0;
  assert.deepEqual(
    await AutoMovieRenderDraw.samplePlayedTrails(
      "two shots",
      subject,
      { ...request, trail: [] },
      2,
    ),
    [],
  );
  assert.equal(reads, 3);
  assert.equal(calls.length, 0);
  const legacy: IAutoMovieRenderDrawScene<never> = {
    ...stock,
    seek: subject.seek,
  };
  const earlier = await AutoMovieRenderDraw.samplePlayedTrails(
    "two shots",
    legacy,
    request,
    2,
  );
  assert(earlier.every((trail) => !("motion" in trail)));
  assert(
    AutoMovieRenderInspection.markTrails(earlier, 2).every(
      ({ kind }) => kind !== "trail/route",
    ),
  );
  await checkAuthoredBoundaries();
}

function assertNear(actual: number | undefined, expected: number): void {
  assert(actual !== undefined && Math.abs(actual - expected) < 1e-10);
}

/* Check break and remount on the same admitted clock without further seeks. */
async function checkAuthoredBoundaries(): Promise<void> {
  type ICase =
    | "permitted"
    | "unproven"
    | "different-token"
    | "unsupported-anchor"
    | "different-support"
    | "missing"
    | "teleport"
    | "cut";
  const grid = [0, 0.25, 0.5, 0.75, 1];
  const ordinaryGap = [
    [0, 0.25],
    [0.5, 0.75, 1],
  ];
  assert.deepEqual(await observe("permitted"), [grid]);
  assert.deepEqual(await observe("unproven"), ordinaryGap);
  assert.deepEqual(await observe("different-token"), ordinaryGap);
  assert.deepEqual(await observe("unsupported-anchor"), ordinaryGap);
  assert.deepEqual(await observe("different-support"), ordinaryGap);
  assert.deepEqual(await observe("missing"), [[0], [0.5, 0.75, 1]]);
  assert.deepEqual(await observe("teleport"), [
    [0, 0.25, 0.5],
    [0.75, 1],
  ]);
  assert.deepEqual(await observe("cut"), [[1.75], [2, 2.25]]);

  async function observe(fixture: ICase): Promise<number[][]> {
    const { subject: stock, calls } = createRecordedFilmSubject({
      transition: null,
      seekShot: true,
      optics: false,
    });
    const prior = stock.scene.getObjectByName("hero")!;
    const replacement = prior.clone();
    const deck = new THREE.Group();
    const otherDeck = new THREE.Group();
    deck.name = "deck";
    otherDeck.name = "other-deck";
    deck.position.set(0, 0, -5);
    otherDeck.position.set(0, 0, -5);
    const socket = new THREE.Object3D();
    deck.add(socket);
    stock.scene.add(deck, otherDeck);
    const token = Object.freeze({ role: "hero" });
    const otherToken = Object.freeze({ role: "hero" });
    const anchor = { x: 0, y: 0, z: 0 };
    const originChanged = { x: 0.5, y: 0, z: 0 };
    const cut = fixture === "cut";
    const request = InspectionScene.ask({
      trail: ["hero"],
      reach: cut ? 0.25 : 0.5,
      ticks: 4,
    });
    const subject: IAutoMovieRenderDrawScene<never> = {
      ...stock,
      ...(fixture === "teleport"
        ? { trailDiscontinuities: [{ shot: "shot:a", seconds: 1.625 }] }
        : {}),
      async seek(seconds): Promise<void> {
        await stock.seek(seconds);
        stock.scene.remove(prior, replacement);
        if (fixture === "missing" && seconds === 0.25) return;
        const actor =
          fixture === "teleport" || seconds < (cut ? 2 : 0.5)
            ? prior
            : replacement;
        actor.position.set(
          fixture === "teleport" && seconds >= 0.75 ? 3 : 0,
          0,
          -5,
        );
        stock.scene.add(actor);
      },
      inspectMotionTrail: {
        read({ object }) {
          return {
            ...(fixture === "unproven"
              ? {}
              : {
                  compatibleRemount:
                    fixture === "different-token" && object === replacement
                      ? otherToken
                      : token,
                }),
            support: {
              socket,
              support:
                fixture === "different-support" && object === replacement
                  ? otherDeck
                  : deck,
              anchor:
                fixture === "unsupported-anchor" && object === replacement
                  ? originChanged
                  : anchor,
            },
          };
        },
      },
    };
    const at = cut ? 2 : 0.5;
    const trails = await AutoMovieRenderDraw.samplePlayedTrails(
      "two shots",
      subject,
      request,
      at,
    );
    assert.deepEqual(
      calls
        .filter(({ name }) => name === "seek")
        .map(({ numbers }) => numbers[0]),
      cut ? [2, 1.75, 2, 2.25] : [0.5, ...grid],
    );
    assert(
      trails.every(
        (trail) => trail.times.length === trail.motion?.samples.length,
      ),
    );
    return trails.map((trail) => trail.times);
  }
}
