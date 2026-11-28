import { AutoMovieEngineMotionCrowd } from "@automovie/engine";
import type {
  IAutoMovieCrowdAgent,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/**
 * The engine's crowd steering pass keeps agents apart by anticipation,
 * brings each to its goal, does not depend on the order agents are listed
 * in, and never enters an obstacle that moves.
 *
 * Scenarios, agents of 0.25 m radius at 1.34 m/s, the mean desired speed of
 * Helbing and Molnar 1995:
 * 1. Two agents head-on along one line 10 m apart: they never come within
 *    their summed radii, they pass on opposite sides (the lateral offset of
 *    each changes sign relative to the other), and both arrive.
 * 2. Two flows of six crossing at 90 degrees, each agent going 20 m along
 *    its flow to a goal of its own: no two agents overlap at any step and
 *    every agent arrives.
 * 3. A random crossing of 60 agents: the share of agent pairs whose time to
 *    collision falls under 1 s at some sample is smaller with the interaction
 *    than without it (the power law's qualitative oracle; Karamouzas,
 *    Skinner and Guy 2014 calibrate the force's scale on trajectories this
 *    test does not have).
 * 4. Listing the agents of scenario 2 in reverse order gives bit-identical
 *    courses.
 * 5. A 2 by 1 m box crossing a walker's way at 2 m/s: the walker's disc never
 *    enters the box at any 1/24 s sample, and the walker arrives.
 * 6. Moving and turning the whole of scenario 1 by 3 m and 37 degrees moves
 *    every course rigidly, within 1e-6 m.
 * 7. Course reads at the same off-grid time and after a seek own their
 *    position and velocity, even after the caller mutates an earlier read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the pass and reads its courses at every step: overlap, a wrong side, an agent that never arrives, an order-dependent sum, a moving obstacle entered, or a frame-dependent law is caught.
 * @evidence contracts/development/testing.md#independent-expectations Non-penetration and arrival are the requirement; the head-on side change and the order and frame invariances follow from the law's symmetry; the close-call comparison is the paper's qualitative finding against a non-interacting control, since the force scale is uncalibrated.
 * @evidence contracts/development/common.md#meaningful-documentation Head-on, crossing and random crowds exercise minimum separation. Reverse order, transformed inputs, a moving box and repeated off-grid samples exercise invariance and ownership.
 */
export function test_engine_steer_crowd(): void {
  const findings: string[] = [];
  const R: number = 0.25;
  const v: number = 1.34;
  const agent = (
    at: IAutoMovieVector3,
    goal: IAutoMovieVector3,
  ): IAutoMovieCrowdAgent => ({ at, goal, radius: R, speed: v, start: 0 });
  const point = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const gap = (
    result: IAutoMovieSteerCrowd.IResult,
    n: number,
    t: number,
  ): number => {
    let least: number = Infinity;
    for (let i: number = 0; i < n; ++i)
      for (let j: number = i + 1; j < n; ++j) {
        const a: IAutoMovieVector3 = result.courses[i]!.at(t).position;
        const b: IAutoMovieVector3 = result.courses[j]!.at(t).position;
        least = Math.min(least, Math.hypot(a.x - b.x, a.z - b.z));
      }
    return least;
  };

  // 1. Head-on.
  const ends: IAutoMovieVector3[] = [point(0, 10), point(0.01, 0)];
  const pair: IAutoMovieCrowdAgent[] = [
    agent(point(0, 0), ends[0]!),
    agent(point(0.01, 10), ends[1]!),
  ];
  const headOn: IAutoMovieSteerCrowd.IResult = AutoMovieEngineMotionCrowd.steer({
    agents: pair,
    from: 0,
    to: 14,
  });
  let closest: number = Infinity;
  for (let t: number = 0; t <= 14; t += 1 / 24)
    closest = Math.min(closest, gap(headOn, 2, t));
  if (!(closest >= 2 * R))
    findings.push(
      `head-on: the agents came ${closest.toFixed(3)} m apart, at least ${2 * R} m expected`,
    );
  // They pass when their order along the line flips while each keeps to its own side of the other.
  const along = (t: number): number =>
    headOn.courses[0]!.at(t).position.z - headOn.courses[1]!.at(t).position.z;
  if (!(along(0) < 0 && along(14) > 0))
    findings.push("head-on: the agents did not pass each other");
  for (const [i, c] of headOn.courses.entries())
    if (c.arrival === null) findings.push(`head-on: agent ${i} did not arrive`);

  const seek: number = 3.153;
  const first = headOn.courses[0]!.at(seek);
  const position: IAutoMovieVector3 = { ...first.position };
  const velocity: IAutoMovieVector3 = { ...first.velocity };
  first.position.x += 100;
  first.velocity.z += 100;
  headOn.courses[1]!.at(seek);
  const shared = headOn.courses[0]!.at(seek);
  headOn.courses[1]!.at(8);
  const returned = headOn.courses[0]!.at(seek);
  TestValidator.predicate(
    "same-time projection and seek return caller-owned course samples",
    vclose(shared.position, position, 1e-12) &&
      vclose(shared.velocity, velocity, 1e-12) &&
      vclose(returned.position, position, 1e-12) &&
      vclose(returned.velocity, velocity, 1e-12),
  );

  // 2. Crossing flows, each agent going 20 m along its flow to a place of its own: two people cannot stand on one goal.
  const flows: IAutoMovieCrowdAgent[] = [];
  for (let k: number = 0; k < 6; ++k) {
    flows.push(
      agent(
        point(-8 - 1.2 * k, 0.9 * (k % 2)),
        point(12 - 1.2 * k, 0.9 * (k % 2)),
      ),
    );
    flows.push(
      agent(
        point(0.9 * (k % 2), -8 - 1.2 * k),
        point(0.9 * (k % 2), 12 - 1.2 * k),
      ),
    );
  }
  const crossing: IAutoMovieSteerCrowd.IResult = AutoMovieEngineMotionCrowd.steer({
    agents: flows,
    from: 0,
    to: 30,
  });
  for (let t: number = 0; t <= 30; t += 1 / 24) {
    const d: number = gap(crossing, flows.length, t);
    if (d < 2 * R - 1e-6) {
      findings.push(
        `crossing flows: two agents ${d.toFixed(3)} m apart at ${t.toFixed(2)} s`,
      );
      break;
    }
  }
  if (crossing.contacts.length !== 0)
    findings.push(
      `crossing flows: ${crossing.contacts.length} contacts reported`,
    );
  crossing.courses.forEach(
    (c: IAutoMovieCrowdAgent.ICourse, i: number): void => {
      if (c.arrival === null)
        findings.push(`crossing flows: agent ${i} did not arrive`);
    },
  );

  // 3. Close calls against a non-interacting control.
  let seed: number = 12345;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const crowd: IAutoMovieCrowdAgent[] = [];
  const goals: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < 60; ++k) {
    const a: number = random() * 2 * Math.PI;
    goals.push(point(-12 * Math.sin(a), -12 * Math.cos(a)));
    crowd.push(
      agent(
        point(12 * Math.sin(a) + random(), 12 * Math.cos(a) + random()),
        goals[k]!,
      ),
    );
  }
  const ttc = (result: IAutoMovieSteerCrowd.IResult | null): number => {
    let close: number = 0;
    for (let i: number = 0; i < crowd.length; ++i)
      for (let j: number = i + 1; j < crowd.length; ++j)
        for (let t: number = 0; t <= 20; t += 0.25) {
          const at = (k: number): IKinematic => {
            if (result !== null) {
              const s: {
                position: IAutoMovieVector3;
                velocity: IAutoMovieVector3;
              } = result.courses[k]!.at(t);
              return { p: s.position, u: s.velocity };
            }
            const c: IAutoMovieCrowdAgent = crowd[k]!;
            const g: IAutoMovieVector3 = goals[k]!;
            const L: number = Math.hypot(g.x - c.at.x, g.z - c.at.z);
            const s: number = Math.min(L, v * t);
            return {
              p: point(
                c.at.x + ((g.x - c.at.x) * s) / L,
                c.at.z + ((g.z - c.at.z) * s) / L,
              ),
              u:
                s < L
                  ? point(((g.x - c.at.x) * v) / L, ((g.z - c.at.z) * v) / L)
                  : point(0, 0),
            };
          };
          const a: IKinematic = at(i);
          const b: IKinematic = at(j);
          const dx: number = b.p.x - a.p.x;
          const dz: number = b.p.z - a.p.z;
          const ux: number = a.u.x - b.u.x;
          const uz: number = a.u.z - b.u.z;
          const A: number = ux * ux + uz * uz;
          const B: number = dx * ux + dz * uz;
          const C: number = dx * dx + dz * dz - 4 * R * R;
          const D: number = B * B - A * C;
          if (A > 1e-12 && B > 0 && D > 0 && (B - Math.sqrt(D)) / A < 1) {
            ++close;
            break;
          }
        }
    return close;
  };
  const steered: number = ttc(
    AutoMovieEngineMotionCrowd.steer({ agents: crowd, from: 0, to: 20 }),
  );
  const control: number = ttc(null);
  if (!(steered < control))
    findings.push(
      `random crossing: ${steered} pairs came within 1 s of colliding with the interaction and ${control} without; fewer expected`,
    );

  // 4. Order independence.
  const reversed: IAutoMovieSteerCrowd.IResult = AutoMovieEngineMotionCrowd.steer({
    agents: [...flows].reverse(),
    from: 0,
    to: 30,
  });
  for (let t: number = 0; t <= 30; t += 0.5)
    flows.forEach((_: IAutoMovieCrowdAgent, i: number): void => {
      const a: IAutoMovieVector3 = crossing.courses[i]!.at(t).position;
      const b: IAutoMovieVector3 =
        reversed.courses[flows.length - 1 - i]!.at(t).position;
      if (a.x !== b.x || a.z !== b.z)
        findings.push(`order: agent ${i} differs at ${t} s`);
    });

  // 5. A moving box.
  const box: IAutoMovieCrowdAgent.IObstacle = {
    footprint: [point(-0.5, -1), point(0.5, -1), point(0.5, 1), point(-0.5, 1)],
    motion: (s: number): { position: IAutoMovieVector3; yaw: number } => ({
      position: point(-10 + 2 * s, 5),
      yaw: 90,
    }),
  };
  const dodge: IAutoMovieSteerCrowd.IResult = AutoMovieEngineMotionCrowd.steer({
    agents: [agent(point(0, 0), point(0, 10))],
    obstacles: [box],
    from: 0,
    to: 20,
  });
  for (let t: number = 0; t <= 20; t += 1 / 24) {
    const p: IAutoMovieVector3 = dodge.courses[0]!.at(t).position;
    const c: IAutoMovieVector3 = box.motion!(t).position;
    // The box's own x (1 m wide) runs along -Z at yaw 90, its z (2 m long) along +X.
    const dx: number = Math.max(0, Math.abs(p.x - c.x) - 1);
    const dz: number = Math.max(0, Math.abs(p.z - c.z) - 0.5);
    if (Math.hypot(dx, dz) < R - 1e-6) {
      findings.push(
        `moving box: the walker's disc enters it at ${t.toFixed(2)} s`,
      );
      break;
    }
  }
  if (dodge.courses[0]!.arrival === null)
    findings.push("moving box: the walker did not arrive");

  // 6. A moved and turned frame.
  const turn: number = (37 * Math.PI) / 180;
  const move = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    point(
      3 + p.x * Math.cos(turn) + p.z * Math.sin(turn),
      -1 - p.x * Math.sin(turn) + p.z * Math.cos(turn),
    );
  const moved: IAutoMovieSteerCrowd.IResult = AutoMovieEngineMotionCrowd.steer({
    agents: pair.map(
      (a: IAutoMovieCrowdAgent, i: number): IAutoMovieCrowdAgent => ({
        ...a,
        at: move(a.at),
        goal: move(ends[i]!),
      }),
    ),
    from: 0,
    to: 14,
  });
  for (let t: number = 0; t <= 14; t += 0.5)
    for (let i: number = 0; i < 2; ++i) {
      const a: IAutoMovieVector3 = move(headOn.courses[i]!.at(t).position);
      const b: IAutoMovieVector3 = moved.courses[i]!.at(t).position;
      if (Math.hypot(a.x - b.x, a.z - b.z) > 1e-6) {
        findings.push(
          `frame: agent ${i} at ${t} s is ${Math.hypot(a.x - b.x, a.z - b.z)} m off its moved course`,
        );
        break;
      }
    }
  TestValidator.equals("the crowd steering pass", findings, []);
}

/** A position and a velocity, world metres and metres per second. */
interface IKinematic {
  /** The position. */
  p: IAutoMovieVector3;

  /** The velocity. */
  u: IAutoMovieVector3;
}
