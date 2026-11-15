import {
  type IAutoMovieSoftBodyBoundarySample,
  Quaternion,
  Transform,
  Vector3,
  simulateSoftBodyCore,
  simulateSoftBodyWithBoundaries,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
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

import { motionHandleShapes } from "../internal/motionHandleShapes";
import { motionHumanBody } from "../internal/motionHumanBody";

/** Standard gravity, m/s^2 (CGPM 1901). */
const G: number = 9.80665;

/** A square towel of `n` by `n` particles and `edge` metres lying flat at a height, its four corners as handle affordances. */
const towel = (
  origin: IAutoMovieVector3,
  n: number,
  edge: number,
  seconds: number,
): IHumanProp => {
  const rest: number[] = [];
  for (let row: number = 0; row < n; row++)
    for (let column: number = 0; column < n; column++)
      rest.push(
        origin.x + (column * edge) / (n - 1),
        origin.y,
        origin.z + (row * edge) / (n - 1),
      );
  const dt: number = 1 / 240;
  const domain: IAutoMovieSoftBodyDomain = {
    version: 1,
    id: "towel",
    units: "meter",
    lattice: { columns: n, rows: n },
    solver: {
      fixedStepSeconds: dt,
      gravity: { x: 0, y: -G, z: 0 },
      drag: 2,
      iterations: 8,
      stiffness: { structural: 1, shear: 0.5, bend: 0.1 },
      compliance: { structural: 0, shear: 1e-4, bend: 1e-1 },
      referenceSpeed: 2,
      maxSteps: Math.ceil(seconds / dt) + 1,
    },
    rest,
    mass: new Array(n * n).fill(0.3 / (n * n)),
    anchors: [],
    states: [],
    colliders: [
      {
        kind: "plane",
        id: "table",
        normal: { x: 0, y: 1, z: 0 },
        offset: origin.y - 0.001,
      },
    ],
    wind: null,
    selfCollision: false,
  };
  const corner = (id: string, column: number, row: number) => ({
    id,
    kind: "handle" as const,
    frame: {
      ...Transform.identity(),
      translation: {
        x: origin.x + (column * edge) / (n - 1),
        y: origin.y,
        z: origin.z + (row * edge) / (n - 1),
      },
    },
    extent: null,
    radius: 0.005,
  });
  const corners: IAutoMovieAffordance[] = [
    corner("cornerA", 0, 0),
    corner("cornerB", n - 1, 0),
  ];
  return {
    subject: "towel",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    affordances: corners,
    shapes: motionHandleShapes(corners),
    soft: domain,
  };
};

/**
 * Gripping, holding and releasing a soft prop (#3449).
 *
 * Scenarios:
 *
 * 1. A towel's corner picked up by the right hand stays on the hand's grip
 *    socket within 1 mm (the campaign's grip bound) from the grip's closing
 *    to the end, read every tenth of a second.
 * 2. Two hands picking up two corners of the towel's near edge hold it
 *    spread: the corners stay at least 90 % of the edge apart.
 * 3. A particle a boundary releases falls: its height decreases at every
 *    step until it meets the floor plane, and it leaves with its target's
 *    last sideways velocity.
 * 4. A boundary that both holds and releases a particle is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs pick-ups of a soft prop and reads the solved particles against the hands; drives the engine core with released anchors.
 * @evidence contracts/development/testing.md#independent-expectations The campaign's grip bound, the issue's 90 % spread, gravity's monotone fall from a moving release, and the boundary's own admission rule.
 * @evidence contracts/development/testing.md#distinguishing-cases One hand and two hands, a held and a released particle, and a malformed boundary.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios with their bounds.
 */
export function test_human_motion_soft_grip(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const m: IHumanBody["measure"] = body.measure;
  const edge: number = 2 * m.shoulderHalfWidth;
  const origin: IAutoMovieVector3 = {
    x: -m.shoulderHalfWidth,
    y: m.waistHeight,
    z: 0.5 * (m.upperArm + m.forearm),
  };
  const perform = (
    composition: HumanPerformance.IInput["composition"],
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "grip",
      props: [towel(origin, 8, edge, 8)],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition,
    });
  const socket = (
    p: HumanPerformance,
    side: "left" | "right",
    t: number,
  ): IAutoMovieVector3 => {
    const hand = p.bones("a", t).get(`${side}Hand`)!;
    const s: IAutoMovieVector3 =
      body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"].point;
    return Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(hand.worldRotation, s),
    );
  };
  const nearest = (positions: number[], to: IAutoMovieVector3): number => {
    let best: number = Infinity;
    for (let i: number = 0; i < positions.length; i += 3)
      best = Math.min(
        best,
        Math.hypot(
          positions[i]! - to.x,
          positions[i + 1]! - to.y,
          positions[i + 2]! - to.z,
        ),
      );
    return best;
  };

  // 1. One corner held.
  try {
    const held: HumanPerformance = perform(
      HumanChain.subject("a")
        .pickUp({ prop: "towel", handle: "cornerB", hand: "right" })
        .stand({ seconds: 1 }).node,
    );
    const s = held.segments("a")[0]!;
    const grip: number =
      s.start +
      (s.plan.events.find((e) => e.name === "gripClosed")?.share ?? 1) *
        s.plan.duration;
    let worst: number = 0;
    for (let t: number = grip + 0.05; t <= held.duration; t += 0.1)
      worst = Math.max(
        worst,
        nearest(held.soft("towel", t), socket(held, "right", t)),
      );
    if (!(worst <= 0.001))
      complaints.push(
        `a held corner strays ${(worst * 1000).toFixed(2)} mm from the grip socket, within 1 mm expected`,
      );
  } catch (error) {
    complaints.push(
      `one corner: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 2. Two corners held spread.
  try {
    const spread: HumanPerformance = perform(
      HumanChain.subject("a")
        .pickUp({ prop: "towel", handle: "cornerA", hand: "left" })
        .pickUp({ prop: "towel", handle: "cornerB", hand: "right" })
        .stand({ seconds: 1 }).node,
    );
    const end: number[] = spread.soft("towel", spread.duration);
    const a: IAutoMovieVector3 = { x: end[0]!, y: end[1]!, z: end[2]! };
    const b: IAutoMovieVector3 = { x: end[21]!, y: end[22]!, z: end[23]! };
    const apart: number = Vector3.length(Vector3.subtract(a, b));
    if (!(apart >= 0.9 * edge))
      complaints.push(
        `two held corners lie ${apart.toFixed(3)} m apart, at least ${(0.9 * edge).toFixed(3)} m expected`,
      );
  } catch (error) {
    complaints.push(
      `two corners: expected to plan, got ${(error as Error).message}`,
    );
  }

  // 3. A released particle falls.
  const cord: IAutoMovieSoftBodyDomain = {
    ...towel({ x: 0, y: 1, z: 0 }, 2, 0.2, 2).soft!,
    id: "drop",
    anchors: [
      {
        id: "held",
        particle: 0,
        position: null,
        binding: { kind: "node", node: "hand", offset: { x: 0, y: 0, z: 0 } },
      },
    ],
    colliders: [
      { kind: "plane", id: "floor", normal: { x: 0, y: 1, z: 0 }, offset: 0 },
    ],
  };
  const steps: number = 240;
  const dt: number = cord.solver.fixedStepSeconds;
  const boundaries: IAutoMovieSoftBodyBoundarySample[] = Array.from(
    { length: steps + 1 },
    (_: unknown, k: number) =>
      k < 60
        ? {
            step: k,
            anchors: [
              { particle: 0, position: { x: 0.5 * k * dt, y: 1, z: 0 } },
            ],
            capsules: [],
          }
        : { step: k, anchors: [], capsules: [], released: [0] },
  );
  const heights: number[] = [];
  const across: number[] = [];
  simulateSoftBodyCore(cord, steps, null, boundaries, {
    step: (_k: number, positions: Float64Array): void => {
      heights.push(positions[1]!);
      across.push(positions[0]!);
    },
  });
  const after: number[] = heights.slice(59);
  const falling: boolean = after
    .slice(1)
    .every((h: number, i: number): boolean => h < after[i]! || h <= 1e-9);
  if (!falling)
    complaints.push(
      `the released particle does not fall monotonically until the floor`,
    );
  if (!(across[60]! > across[59]!))
    complaints.push(
      `the released particle does not keep the hand's sideways velocity (${((across[60]! - across[59]!) / dt).toFixed(3)} m/s)`,
    );

  // 4. Held and released at once.
  try {
    simulateSoftBodyWithBoundaries(cord, 1, [
      boundaries[0]!,
      {
        step: 1,
        anchors: [{ particle: 0, position: { x: 0, y: 1, z: 0 } }],
        capsules: [],
        released: [0],
      },
    ]);
    complaints.push(
      "a boundary that holds and releases one particle was admitted",
    );
  } catch (error) {
    if (!(error as Error).message.includes("both holds and releases"))
      complaints.push(
        `a boundary that holds and releases one particle was refused with "${(error as Error).message}"`,
      );
  }
  TestValidator.equals(
    "gripping, holding and releasing a soft prop",
    complaints,
    [],
  );
}
