import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanProp, IAutoMovieSoftBodyDomain, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** Standard gravity, m/s^2 (CGPM 1901). */
const G: number = 9.80665;

/** The tension's statics bound, a share of the weight below the hand: #3451's test line (the tension equals the cord's weight below the hand within 2 %). */
const STATICS: number = 0.02;

/** The cord's length, metres: the cast's cord. */
const LENGTH: number = 0.5;

/** The cord's links: the cast's cord. */
const LINKS: number = 20;

/** The cord's step, seconds: the soft props' 240 a second. */
const STEP: number = 1 / 240;

/** A cord of `links` segments, `length` metres and `mass` kilograms hung from the right hand's grip socket of performer "a", solved at steps of `dt` seconds. */
const hung = (
  body: IAutoMovieMotionHumanBody,
  links: number,
  length: number,
  mass: number,
  seconds: number,
  dt: number,
): IAutoMovieMotionHumanProp => {
  const socket: IAutoMovieVector3 = body.surfaces.sockets.gripRight.point;
  const top: IAutoMovieVector3 = Vector3.add(
    body.rest.get("rightHand")!,
    socket,
  );
  const rest: number[] = [];
  for (let k: number = 0; k <= links; k++)
    rest.push(top.x + 0.001 * k, top.y - (k * length) / links, top.z + 0.2);
  const domain: IAutoMovieSoftBodyDomain = {
    version: 1,
    id: "cord",
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
    mass: new Array(links + 1).fill(mass / (links + 1)),
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
  return {
    subject: "cord",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    soft: domain,
  };
};

/**
 * A soft prop's tension is a load on the hand that holds it (#3451).
 *
 * The average man stands for four seconds holding a cord of 20 links and
 * 0.5 m from the grip socket of his right hand; the anchored particle bears
 * the rest of the cord.
 *
 * Scenarios:
 *
 * 1. Once settled, the force on the hand, solved at the cord's step and at
 *    half of it and extrapolated by Richardson to the converged solver (the
 *    fixed sweeps' residual falls with the step squared), points down and
 *    equals the weight of the cord below the hand (every particle but the
 *    anchored one) within 2 % (statics), for a light and a heavy cord; its
 *    error against the weight falls from the step to its half and again to
 *    the extrapolation.
 * 2. A heavier cord pulls harder: the force grows with the mass at the same
 *    length (metamorphic).
 * 3. The force read at a second is the step's before it: reads at 24 and 60
 *    frames a second agree at their shared seconds.
 * 4. A hand that holds nothing, the left, reads no force.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances with a hung soft prop and reads `HumanPerformance.softLoad`.
 * @evidence contracts/development/testing.md#independent-expectations Statics of a hanging chain (the anchor bears the weight below it, within #3451's 2 %), monotonicity in mass, the purity of a read, and an empty hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Two masses, a step and its half, two frame rates, the holding and the free hand.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the four scenarios with their bounds.
 */
export function test_human_motion_soft_load(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const pulls: number[] = [];
  const stand = (mass: number, dt: number): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "load",
      props: [hung(body, LINKS, LENGTH, mass, 4, dt)],
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
  for (const mass of [0.05, 0.5]) {
    // The cord at its step and at half of it: the fixed sweeps leave the
    // anchor's multiplier short by a residual that falls with the step
    // squared, so Richardson's extrapolation of the two is the converged
    // solver's force (as the cord's catenary is, test_soft_cord_xpbd).
    const performance: IAutoMovieMotionHumanPerformance = stand(mass, STEP);
    const end: number = performance.duration;
    const coarse: IAutoMovieVector3 = performance.softLoad(
      "cord",
      "a",
      "right",
      end,
    );
    const fine: IAutoMovieVector3 = stand(mass, STEP / 2).softLoad(
      "cord",
      "a",
      "right",
      end,
    );
    const f: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(Vector3.scale(fine, 4), coarse),
      1 / 3,
    );
    const weight: number = ((mass * LINKS) / (LINKS + 1)) * G;
    pulls.push(-f.y);
    if (
      !(
        Math.abs(-f.y - weight) < Math.abs(-fine.y - weight) &&
        Math.abs(-fine.y - weight) < Math.abs(-coarse.y - weight)
      )
    )
      complaints.push(
        `${mass} kg: the force nears the weight ${weight.toFixed(4)} N as the step falls, as its square: ${(-coarse.y).toFixed(4)} N at the step, ${(-fine.y).toFixed(4)} N at half of it, ${(-f.y).toFixed(4)} N extrapolated`,
      );
    if (
      !(
        Math.abs(-f.y - weight) <= STATICS * weight &&
        Math.hypot(f.x, f.z) <= STATICS * weight
      )
    )
      complaints.push(
        `${mass} kg: the hand bears (${f.x.toFixed(4)}, ${f.y.toFixed(4)}, ${f.z.toFixed(4)}) N, the ${weight.toFixed(4)} N below it straight down within ${STATICS * 100} % expected`,
      );
    const free: IAutoMovieVector3 = performance.softLoad(
      "cord",
      "a",
      "left",
      end,
    );
    if (!(free.x === 0 && free.y === 0 && free.z === 0))
      complaints.push(`${mass} kg: the empty left hand reads a force`);
    for (let k: number = 0; k <= 8; k++) {
      const s: number = k * 0.5;
      const a24: IAutoMovieVector3 = performance.softLoad(
        "cord",
        "a",
        "right",
        Math.round(s * 24) / 24,
      );
      const a60: IAutoMovieVector3 = performance.softLoad(
        "cord",
        "a",
        "right",
        Math.round(s * 60) / 60,
      );
      if (
        !(
          Object.is(a24.x, a60.x) &&
          Object.is(a24.y, a60.y) &&
          Object.is(a24.z, a60.z)
        )
      )
        complaints.push(
          `${mass} kg: the force at ${s} s differs between 24 and 60 frames a second`,
        );
    }
  }
  if (!(pulls[1]! > pulls[0]!))
    complaints.push(
      `a cord ten times heavier pulls ${pulls[1]!.toFixed(4)} N against ${pulls[0]!.toFixed(4)} N`,
    );
  TestValidator.equals("a soft prop's tension on the hand", complaints, []);
}
