import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanProp, IAutoMovieResolvedBone, IAutoMovieSoftBodyDomain, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** Standard gravity, m/s^2 (CGPM 1901). */
const G: number = 9.80665;

/** The hung cord's statics bound, a share of its length: #3448's first acceptance line (the free end its length below the anchor within 2 % once settled). */
const STATICS: number = 0.02;

/** The cord's length, metres: the cast's lanyard. */
const LENGTH: number = 0.5;

/** The cord's links: the cast's lanyard. */
const LINKS: number = 20;

/**
 * A cord of `links` segments and `length` metres hung from a bone-local point
 * of a performer's right hand, laid out straight below the hand's rest place.
 */
const cord = (
  body: IAutoMovieMotionHumanBody,
  links: number,
  length: number,
  seconds: number,
): IAutoMovieSoftBodyDomain => {
  const socket: IAutoMovieVector3 = body.surfaces.sockets.gripRight.point;
  const hand: IAutoMovieVector3 = body.rest.get("rightHand")!;
  const top: IAutoMovieVector3 = Vector3.add(hand, socket);
  const rest: number[] = [];
  for (let k: number = 0; k <= links; k++)
    rest.push(top.x + 0.001 * k, top.y - (k * length) / links, top.z + 0.2);
  const dt: number = 1 / 240;
  return {
    version: 1,
    id: "lanyard",
    units: "meter",
    lattice: { columns: 1, rows: links + 1 },
    solver: {
      fixedStepSeconds: dt,
      gravity: { x: 0, y: -G, z: 0 },
      drag: 6,
      iterations: 16,
      stiffness: { structural: 1, shear: 1, bend: 0 },
      compliance: { structural: 0, shear: 0, bend: 1e3 },
      referenceSpeed: 4,
      maxSteps: Math.ceil(seconds / dt) + 1,
    },
    rest,
    mass: new Array(links + 1).fill(0.002),
    anchors: [
      {
        id: "hand",
        particle: 0,
        position: null,
        binding: {
          kind: "actor-bone",
          actor: "a",
          bone: "rightHand",
          offset: socket,
        },
      },
    ],
    states: [],
    colliders: [],
    wind: null,
    selfCollision: false,
  };
};

/**
 * Soft props in the performance: solved once from the displayed poses at
 * their own step, and read by film seconds (#3448).
 *
 * The average man stands for four seconds with a 0.5 m cord of 20 links
 * hanging from the grip socket of his right hand.
 *
 * Scenarios:
 *
 * 1. Once settled (the last second), the cord's free end hangs its length
 *    below the hand's socket within 2 % (statics of a hanging chain; the
 *    bound is #3448's acceptance, `STATICS`).
 * 2. Reading 100 seconds in shuffled order gives the same bits as reading
 *    them sorted.
 * 3. Reading at 24 and at 60 frames a second gives the same state at the
 *    seconds the two share.
 * 4. The anchored end stays on the hand's grip socket at every read second
 *    within 1 mm, the campaign's grip bound.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance with a soft prop and reads `HumanPerformance.soft` and the displayed bones.
 * @evidence contracts/development/testing.md#independent-expectations A hanging chain's statics put its free end its length below the anchor, within #3448's 2 %; read order and frame rate cannot change a pure read; the grip bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Settled and moving reads, shuffled and sorted orders, two frame rates and the anchored end.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test that prepares one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the four scenarios with their bounds.
 */
export function test_human_motion_soft_prop(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const domain: IAutoMovieSoftBodyDomain = cord(body, LINKS, LENGTH, 4);
  const lanyard: IAutoMovieMotionHumanProp = {
    subject: "lanyard",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    soft: domain,
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "soft",
    props: [lanyard],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ seconds: 4 }).node,
  });
  const end: number = performance.duration;
  const at = (seconds: number): number[] =>
    performance.soft("lanyard", seconds);
  const socket = (seconds: number): IAutoMovieVector3 => {
    const hand: IAutoMovieResolvedBone = performance
      .bones("a", seconds)
      .get("rightHand")!;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        body.surfaces.sockets.gripRight.point,
      ),
    );
  };

  // 1. Statics.
  const settled: number[] = at(end);
  const drop: number = socket(end).y - settled[settled.length - 2]!;
  TestValidator.predicate(
    `the settled cord's end hangs ${drop.toFixed(4)} m below the hand, its ${LENGTH} m length within ${STATICS * 100} %`,
    Math.abs(drop - LENGTH) <= STATICS * LENGTH,
  );

  // 2. Order.
  const seconds: number[] = Array.from(
    { length: 100 },
    (_: unknown, k: number): number => (k * end) / 100,
  );
  const sorted: number[][] = seconds.map(at);
  const shuffled: number[] = seconds
    .map((s: number, k: number): [number, number] => [s, (k * 37) % 100])
    .sort((a: [number, number], b: [number, number]): number => a[1] - b[1])
    .map((p: [number, number]): number => p[0]);
  TestValidator.predicate(
    "shuffled reads give the sorted reads' bits",
    shuffled.every((s: number): boolean => {
      const read: number[] = at(s);
      const known: number[] = sorted[seconds.indexOf(s)]!;
      return read.every((v: number, i: number): boolean =>
        Object.is(v, known[i]),
      );
    }),
  );

  // 3. Frame rates.
  const shared: number[] = Array.from(
    { length: Math.floor(end / 0.5) + 1 },
    (_: unknown, k: number): number => k * 0.5,
  );
  TestValidator.predicate(
    "reads at 24 and 60 frames a second agree at their shared seconds",
    shared.every((s: number): boolean => {
      const a: number[] = at(Math.round(s * 24) / 24);
      const b: number[] = at(Math.round(s * 60) / 60);
      return a.every((v: number, i: number): boolean => Object.is(v, b[i]));
    }),
  );

  // 4. The anchored end on the socket.
  let worst: number = 0;
  for (let s: number = 0; s <= end; s += 0.25) {
    const p: number[] = at(s);
    worst = Math.max(
      worst,
      Vector3.length(
        Vector3.subtract({ x: p[0]!, y: p[1]!, z: p[2]! }, socket(s)),
      ),
    );
  }
  TestValidator.predicate(
    `the held end stays on the grip socket within 1 mm (worst ${(worst * 1000).toFixed(3)} mm)`,
    worst <= 1e-3,
  );
}
