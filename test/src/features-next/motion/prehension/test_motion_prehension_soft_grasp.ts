import {
  Quaternion,
  Vector3,
  simulateSoftBodyCore,
  simulateSoftBodyWithBoundaries,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieSoftBodyBoundarySample,
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

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
 * 2. The occupied hand bears a downward load and the empty hand reports zero.
 * 3. Releasing the anchor lets its particle fall away under gravity.
 * 4. The anchored end stays on the hand's grip socket at every read second
 *    within 1 mm, the campaign's grip bound.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance with a soft prop and reads `HumanPerformance.soft` and the displayed bones.
 * @evidence contracts/development/testing.md#independent-expectations A hanging chain's statics put its free end its length below the anchor, within #3448's 2 %; gravity pulls the loaded hand downward and a released end falls; the grip bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases The occupied and empty hands, the held end and the newly released end.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test that prepares one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the four scenarios with their bounds.
 */
export function test_motion_prehension_soft_grasp(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const domain: IAutoMovieSoftBodyDomain = cord(body, LINKS, LENGTH, 4);
  const lanyard: IAutoMovieMotionHumanProp = {
    subject: "lanyard",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    soft: domain,
  };
  const hang = (
    soft: IAutoMovieSoftBodyDomain,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "soft",
      props: [{ ...lanyard, soft }],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").stand({ hold: 4, sway: 0 }).node,
    });
  const performance = hang(domain);
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

  // The occupied hand bears the hanging mass. Its unoccupied counterpart
  // contributes no reaction to the same cord at the same instant.
  const loaded: IAutoMovieVector3 = performance.softLoad(
    "lanyard",
    "a",
    "right",
    end,
  );
  const fine = hang({
    ...domain,
    solver: {
      ...domain.solver,
      fixedStepSeconds: domain.solver.fixedStepSeconds / 2,
      maxSteps: 2 * domain.solver.maxSteps,
    },
  });
  const refined = fine.softLoad("lanyard", "a", "right", end);
  const weight = G * domain.mass.slice(1).reduce((a, b) => a + b, 0);
  const converged = (4 * refined.y - loaded.y) / 3;
  TestValidator.predicate(
    "static anchor reaction balances the suspended particle weights",
    Math.abs(converged + weight) <= STATICS * weight,
  );
  const empty: IAutoMovieVector3 = performance.softLoad(
    "lanyard",
    "a",
    "left",
    end,
  );
  TestValidator.predicate(
    "the occupied hand bears a downward force",
    loaded.y < 0,
  );
  TestValidator.equals("the empty hand carries no load", empty, {
    x: 0,
    y: 0,
    z: 0,
  });

  // Hold the particle for one second, then release it for a second.
  const second: number = Math.round(1 / domain.solver.fixedStepSeconds);
  const anchor: IAutoMovieVector3 = {
    x: domain.rest[0]!,
    y: domain.rest[1]!,
    z: domain.rest[2]!,
  };
  const boundaries: IAutoMovieSoftBodyBoundarySample[] = Array.from(
    { length: 2 * second + 1 },
    (_, step: number): IAutoMovieSoftBodyBoundarySample =>
      step <= second
        ? { step, anchors: [{ particle: 0, position: anchor }], capsules: [] }
        : { step, anchors: [], released: [0], capsules: [] },
  );
  const last: IAutoMovieVector3 = {
    x: anchor.x + LENGTH,
    y: anchor.y,
    z: anchor.z,
  };
  const pinned: IAutoMovieSoftBodyBoundarySample = {
    step: 0,
    anchors: [
      { particle: 0, position: anchor },
      { particle: LINKS, position: last },
    ],
    capsules: [],
  };
  const paired: IAutoMovieSoftBodyDomain = {
    ...domain,
    anchors: [
      ...domain.anchors,
      { ...domain.anchors[0]!, id: "second", particle: LINKS },
    ],
  };
  let width: number = 0;
  simulateSoftBodyCore(paired, 1, null, [pinned, { ...pinned, step: 1 }], {
    step: (_step, points) => {
      width = Math.hypot(
        points[3 * LINKS]! - points[0]!,
        points[3 * LINKS + 1]! - points[1]!,
        points[3 * LINKS + 2]! - points[2]!,
      );
    },
  });
  TestValidator.predicate(
    "separate grips keep the cord's full span",
    Math.abs(width - LENGTH) <= 0.001,
  );
  let conflict: unknown;
  try {
    simulateSoftBodyWithBoundaries(paired, 1, [
      pinned,
      { ...pinned, step: 1, released: [0] },
    ]);
  } catch (error) {
    conflict = error;
  }
  TestValidator.predicate(
    "one particle cannot be held and released in the same step",
    conflict instanceof Error &&
      conflict.message.includes("both holds and releases"),
  );
  const heights: number[] = [];
  simulateSoftBodyCore(domain, 2 * second, null, boundaries, {
    step: (_step: number, positions: Float64Array): void => {
      heights.push(positions[1]!);
    },
  });
  TestValidator.predicate(
    "the released end falls below the occupied socket",
    heights.at(-1)! < anchor.y,
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
