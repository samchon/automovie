import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** Standard gravity, m/s^2 (CGPM 1901). */
const G: number = 9.80665;

/** A cord of `links` segments, `length` metres and `mass` kilograms hung from the right hand's grip socket of performer "a". */
const hung = (
  body: IHumanBody,
  links: number,
  length: number,
  mass: number,
  seconds: number,
): IHumanProp => {
  const socket: IAutoMovieVector3 = body.surfaces.sockets.gripRight.point;
  const top: IAutoMovieVector3 = Vector3.add(
    body.rest.get("rightHand")!,
    socket,
  );
  const rest: number[] = [];
  for (let k: number = 0; k <= links; k++)
    rest.push(top.x + 0.001 * k, top.y - (k * length) / links, top.z + 0.2);
  const dt: number = 1 / 240;
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
 * 1. Once settled, the force on the hand points down and equals the weight of
 *    the cord below the hand (every particle but the anchored one) within 2 %
 *    (statics), for a light and a heavy cord.
 * 2. A heavier cord pulls harder: the force grows with the mass at the same
 *    length (metamorphic).
 * 3. The force read at a second is the step's before it: reads at 24 and 60
 *    frames a second agree at their shared seconds.
 * 4. A hand that holds nothing, the left, reads no force.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds performances with a hung soft prop and reads `HumanPerformance.softLoad`.
 * @evidence contracts/development/testing.md#independent-expectations Statics of a hanging chain (the anchor bears the weight below it), monotonicity in mass, the purity of a read, and an empty hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Two masses, two frame rates, the holding and the free hand.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the four scenarios with their bounds.
 */
export function test_human_motion_soft_load(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const pulls: number[] = [];
  for (const mass of [0.05, 0.5]) {
    const performance: HumanPerformance = new HumanPerformance({
      seed: "load",
      props: [hung(body, 20, 0.5, mass, 4)],
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
    const f: IAutoMovieVector3 = performance.softLoad(
      "cord",
      "a",
      "right",
      end,
    );
    const weight: number = ((mass * 20) / 21) * G;
    pulls.push(-f.y);
    if (
      !(
        Math.abs(-f.y - weight) <= 0.02 * weight &&
        Math.hypot(f.x, f.z) <= 0.02 * weight
      )
    )
      complaints.push(
        `${mass} kg: the hand bears (${f.x.toFixed(4)}, ${f.y.toFixed(4)}, ${f.z.toFixed(4)}) N, the ${weight.toFixed(4)} N below it straight down within 2 % expected`,
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
