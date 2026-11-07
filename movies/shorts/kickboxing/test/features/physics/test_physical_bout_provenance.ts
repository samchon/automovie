import {
  AutoMoviePhysicsCache as Cache,
  AutoMoviePhysicalPlayback as Playback,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import assert from "node:assert/strict";

import type { BoutFormulaResponse } from "../../../src/motion/reactions/BoutFormulaResponse";
import { BoutEffects } from "../../../src/physics/BoutEffects";
import type { BoutFrameReader } from "../../../src/physics/BoutFrameReader";
import { boutGeometricImpulses } from "../../../src/physics/boutGeometricImpulses";
import { measureBoutGeometricFloor } from "../../../src/physics/measureBoutGeometricFloor";
import { readBoutPhysicalManifest } from "../../../src/physics/readBoutPhysicalManifest";

/** Pure manifest mode admission and direct binary codec preserve explicit provenance. Geometric effects use a declared estimate while exact floor observations retain null solver impulse. No HTTP, browser or external project is created. */
export async function test_physical_bout_provenance(): Promise<void> {
  const pose: P.ITransform = {
    position: { x: 0, y: 0.2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const profile: P = {
    id: "mode-unit",
    mass: 1,
    centerOfMass: { ...pose.position },
    provenance:
      "Synthetic unit-mass solid sphere with analytic inertia, for provenance adaptation",
    materials: [
      { id: "skin", friction: 0, restitution: 0, compliance: 0, damping: 0 },
    ],
    joints: [],
    segments: [
      {
        bone: "root",
        mass: 1,
        neutral: pose,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 0.004, y: 0.004, z: 0.004 },
        inertiaRotation: pose.rotation,
        shapes: [
          {
            id: "surface",
            material: "skin",
            kind: "sphere",
            radius: 0.1,
            transform: { ...pose, position: { x: 0, y: 0, z: 0 } },
          },
        ],
      },
    ],
  };
  const at: (seconds: number) => Cache.IFrame = (
    seconds: number,
  ): Cache.IFrame => {
    const state: Cache.ISegment = {
      ...pose,
      position: { x: seconds, y: 0.2 - 13.2 * seconds, z: 0 },
      velocity: { x: 1, y: -13.2, z: 0 },
      angularVelocity: { x: 0, y: 0, z: 0 },
    };
    return {
      seconds,
      bodies: {
        a: { root: state },
        b: {
          root: {
            ...state,
            position: { ...state.position, x: 0.199 },
            velocity: { x: 0, y: -13.2, z: 0 },
          },
        },
        referee: { root: state },
      },
    };
  };
  const cache: Cache = new Cache(`sha256:${"1".repeat(64)}`, 120, 1 / 120);
  cache.frames.push(at(0), at(1 / 120));
  for (const body of ["a", "b", "referee"])
    cache.ownership.push({ body, bone: "root", seconds: 0, kind: "authored" });
  const bytes: Uint8Array<ArrayBuffer> = await Playback.encode(cache, 1048576);
  const manifest: {
    identity: string;
    sourceIdentity: string;
    mode?: string;
    startSeconds: number;
    duration: number;
    rate: number;
    bytes: number;
    profiles: Record<string, P>;
  } = {
    identity: cache.identity,
    sourceIdentity: "current-source",
    mode: "kinematic",
    startSeconds: 0,
    duration: 1 / 120,
    rate: 120,
    bytes: bytes.length,
    profiles: { a: profile, b: profile, referee: profile },
  };
  for (const mode of ["kinematic", "simulated"] as const)
    assert.equal(
      readBoutPhysicalManifest({ ...manifest, mode }, "current-source").mode,
      mode,
    );
  const response: BoutFormulaResponse.IContact = {
    receiptId: "independent-unit-geometric-response",
    actionId: "independent-unit-action",
    actorId: "b",
    seconds: 0,
    relation: "head",
    normalImpulseEstimate: 1,
    source: "geometric",
  };
  const planned: typeof manifest & {
    formulaResponses: BoutFormulaResponse.IContact[];
  } = { ...manifest, formulaResponses: [response] };
  assert.deepEqual(
    readBoutPhysicalManifest(planned, "current-source").formulaResponses,
    [response],
  );
  assert.deepEqual(
    readBoutPhysicalManifest(
      { ...manifest, formulaResponses: undefined },
      "current-source",
    ).formulaResponses,
    [],
  );
  for (const malformed of [null, {}, "contacts", [null], [{}], [1]])
    assert.throws((): void => {
      readBoutPhysicalManifest(
        { ...manifest, formulaResponses: malformed },
        "current-source",
      );
    }, /Bout formula responses|Invalid geometric bout formula response/);
  assert.deepEqual(
    readBoutPhysicalManifest(
      { ...planned, startSeconds: 0.005 },
      "current-source",
    ).formulaResponses,
    [response],
    "bounded comparison retains prior absolute contact history without moving its timestamp",
  );
  assert.throws((): void => {
    readBoutPhysicalManifest(
      { ...planned, mode: "simulated" },
      "current-source",
    );
  }, /Native bout/);
  assert.throws((): void => {
    readBoutPhysicalManifest(
      { ...planned, formulaResponses: [{ ...response, seconds: 1 }] },
      "current-source",
    );
  }, /outside/);
  assert.throws((): void => {
    readBoutPhysicalManifest(
      {
        ...planned,
        formulaResponses: [{ ...response, normalImpulseEstimate: NaN }],
      },
      "current-source",
    );
  }, /Invalid geometric/);
  for (const invalid of [undefined, "unknown"])
    assert.throws(
      (): readBoutPhysicalManifest.IManifest =>
        readBoutPhysicalManifest(
          { ...manifest, mode: invalid },
          "current-source",
        ),
      /explicit simulated or kinematic mode/,
    );
  for (const duration of [0, -1, NaN, Infinity, 1 / 1000])
    assert.throws(
      (): readBoutPhysicalManifest.IManifest =>
        readBoutPhysicalManifest({ ...manifest, duration }, "current-source"),
      /declared budget/,
    );
  const decoded: Playback = await Playback.decode(bytes, cache.identity, {
    maximumBytes: 1048576,
    maximumFrames: 2,
    maximumSegments: 3,
  });
  const inMemory: BoutFrameReader = cache;
  const archived: BoutFrameReader = decoded;
  const memoryFrame: Cache.IFrame = inMemory.at(0);
  const archivedFrame: Cache.IFrame = archived.at(0);

  /** Order DTO identities explicitly without depending on locale or record prototypes. */
  const compare: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => (a < b ? -1 : a > b ? 1 : 0);

  assert.equal(memoryFrame.seconds, archivedFrame.seconds);
  assert.deepEqual(
    Object.keys(memoryFrame.bodies).sort(compare),
    Object.keys(archivedFrame.bodies).sort(compare),
  );
  for (const [body, segments] of Object.entries(memoryFrame.bodies)) {
    assert.deepEqual(
      Object.keys(segments).sort(compare),
      Object.keys(archivedFrame.bodies[body]!).sort(compare),
    );
    for (const [bone, state] of Object.entries(segments))
      assert.deepEqual(state, archivedFrame.bodies[body]![bone]);
  }
  assert.deepEqual(decoded.ownership, cache.ownership);
  assert.deepEqual(
    decoded.supportWrenches,
    [],
    "an authored fixture makes no virtual or achieved support-force claim",
  );
  const receipt: Receipt = {
    id: "unit-geometric-contact",
    source: "geometric",
    seconds: 0,
    endSeconds: 0,
    a: { body: "a", bone: "root", shape: "surface", material: "skin" },
    b: { body: "b", bone: "root", shape: "surface", material: "skin" },
    point: { x: 0.1, y: 0.2, z: 0 },
    normal: { x: 1, y: 0, z: 0 },
    impulse: null,
    separation: -0.001,
    compression: 0.001,
  };
  const estimates: Record<string, number> = boutGeometricImpulses(
    [receipt],
    { a: profile, b: profile },
    at,
  );
  assert.equal(estimates[receipt.id], 0.5);
  assert.equal(receipt.impulse, null);
  const effects: BoutEffects = new BoutEffects();
  try {
    assert.throws(
      (): void =>
        effects.configure([{ actionId: "unit", relation: "head", receipt }]),
      /requires a measured or formula impulse/,
    );
    effects.configure(
      [{ actionId: "unit", relation: "head", receipt }],
      estimates,
    );
    effects.update(0.1);
    assert.ok(effects.object.children.length > 0);
  } finally {
    effects.dispose();
  }
  const floor: Receipt[] = await measureBoutGeometricFloor({
    profiles: { b: profile },
    at,
    start: 0,
    end: 1 / 120,
    rate: 120,
  });
  assert.equal(floor.length, 1);
  assert.ok(
    floor.every(
      (contact: Receipt): boolean =>
        contact.source === "geometric" &&
        contact.impulse === null &&
        contact.seconds === 1 / 120 &&
        contact.separation <= 0,
    ),
  );
}
