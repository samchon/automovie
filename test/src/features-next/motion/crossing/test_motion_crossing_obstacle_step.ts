import {
  createBall,
  createHurdle,
  createKerb,
  createObstacle,
} from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObstacle,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanObstacle } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanSignature as M } from "../../../features/internal/motionHumanSignature";

/**
 * Stepping over a box looks like human obstacle crossing, on the four
 * extreme bodies leading with either foot over the sweep's box (0.3 m high,
 * 0.25 m deep, its near side 0.35 m ahead).
 *
 * Bounds and sources:
 * - Toe clearance: the lead foot clears an obstacle by about 0.1 m whatever
 *   its height (Patla and Rietdyk 1993, Gait Posture 1:45; Chou and
 *   Draganich 1998, J Biomech 31:685). Bound: the lowest sole point passes
 *   0.05 to 0.25 m above the box's top over its depth (provisional limits
 *   around the reported value); the trail foot at least 0.05 m.
 * - Lead limb: crossing raises the lead knee and hip far beyond level
 *   walking's swing; for an obstacle near 15 % of the stature the peak knee
 *   flexion is about 100 degrees and the hip's about 60 to 70 (Chou and
 *   Draganich 1997, J Biomech 30:331). Bound: peak lead knee flexion over
 *   the box in [75, 125] and peak lead hip flexion in [40, 95] degrees
 *   (provisional limits around the reported values).
 * - Trunk: crossing keeps the trunk upright or slightly forward (Chou,
 *   Kaufman, Brey and Draganich 2001, Gait Posture 13:17). Bound: mean
 *   inclination from lead toe-off to trail contact in [0, 15] degrees
 *   (provisional).
 *
 * The trunk is read as the line from the hip joints' midpoint to the
 * shoulder joints' midpoint, the trunk segment of the cited studies, and
 * the quiet stance must read within 3 degrees of vertical under it
 * (Kendall et al. 2005, ideal alignment; `motionHumanSignature.calibrate`).
 *
 * Scenarios:
 * 1. Check the named geometry and contact conditions above at the measured instants.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real step over on real bodies and reads displayed soles and joints; a foot that grazes or sails over the box, a stiff lead leg or a trunk tipped back fails with its cell, value, bound and source.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is a cited obstacle-crossing value or marked provisional with its reason.
 * @evidence contracts/development/testing.md#distinguishing-cases Both lead feet and the default, each row on one body and every body in some row (`motionHumanSignature.cells`).
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because a film of fitted poses is costly; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States every bound with its source and status.
 */
export function test_motion_crossing_obstacle_step(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  checkObjectEdges(complaints);
  checkWallCrossing(complaints);
  const NEAR: number = 0.35;
  const FAR: number = 0.6;
  const TOP: number = 0.3;
  for (const { row, name } of M.cells(["default", "lead=left", "lead=right"])) {
    const cell: string = `stepOver ${row} ${name}`;
    const s: M.IStaged = M.stage("stepOver", row, name);
    const leadOff: number = M.event(s, "leadToeOff")!;
    const leadOn: number = M.event(s, "leadContact")!;
    const trailOff: number = M.event(s, "trailToeOff")!;
    const trailOn: number = M.event(s, "trailContact")!;
    const mid: number = (leadOff + leadOn) / 2;
    const lead: AutoMovieHumanSide =
      M.sole(s, mid, "left").y > M.sole(s, mid, "right").y ? "left" : "right";
    const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
    const clearance = (
      side: AutoMovieHumanSide,
      from: number,
      to: number,
    ): number => {
      let least: number = Infinity;
      for (const t of M.times(from, to, 120))
        for (const socket of HumanFoot.sockets(s.body, M.bones(s, t), side))
          if (socket.point.z >= NEAR && socket.point.z <= FAR)
            least = Math.min(least, socket.point.y - TOP);
      return least;
    };
    const leadClear: number = clearance(lead, leadOff, leadOn);
    complaints.check(
      `${cell}: the lead (${lead}) sole clears the box by ${(leadClear * 1000).toFixed(0)} mm, outside [50, 250] (Patla and Rietdyk 1993; Chou and Draganich 1998)`,
      leadClear >= 0.05 && leadClear <= 0.25,
    );
    const trailClear: number = clearance(trail, trailOff, trailOn);
    complaints.check(
      `${cell}: the trail (${trail}) sole clears the box by ${(trailClear * 1000).toFixed(0)} mm, at least 50 expected (Patla and Rietdyk 1993)`,
      trailClear >= 0.05,
    );
    let knee: number = 0;
    let hip: number = 0;
    for (const t of M.times(leadOff, leadOn, 60)) {
      knee = Math.max(knee, M.knee(s, t, lead));
      hip = Math.max(hip, M.hip(s, t, lead));
    }
    complaints.check(
      `${cell}: peak lead knee flexion ${knee.toFixed(1)} deg outside [75, 125] (Chou and Draganich 1997; provisional)`,
      knee >= 75 && knee <= 125,
    );
    complaints.check(
      `${cell}: peak lead hip flexion ${hip.toFixed(1)} deg outside [40, 95] (Chou and Draganich 1997; provisional)`,
      hip >= 40 && hip <= 95,
    );
    const lean: number = M.mean(M.times(leadOff, trailOn, M.HELD), (t) =>
      M.trunk(s, t),
    );
    complaints.check(
      `${cell}: mean trunk inclination ${lean.toFixed(2)} deg while crossing outside [0, 15] (Chou et al. 2001; provisional)`,
      lean >= 0 && lean <= 15,
    );
  }
  for (const name of motionHumanBody.EXTREMES)
    for (const c of M.calibrate(name)) complaints.check(c, false);
  complaints.assert("the step over has the signature of obstacle crossing");
}

/** The authored edge is crossed or refused according to its height and affordances. */
function checkObjectEdges(findings: motionComplaints.IGatherer): void {
  const body = motionHumanBody("m-average"),
    near = 0.3;
  const cross = (
    model: Parameters<typeof HumanObject.prop>[1],
    depth: number,
  ) =>
    new HumanPerformance({
      seed: "step-over",
      props: [
        HumanObject.prop("edge", model, {
          at: { x: 0, y: 0, z: near + depth },
          yaw: 180,
        }),
      ],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").stepOver({ obstacle: "edge" }).node,
    });
  const kerb = createKerb({ kind: "kerb" }),
    step = createKerb({ kind: "step" });
  const tie = createObstacle({ kind: "crosstie" }),
    bag = createObstacle({ kind: "sandbag" });
  for (const [model, depth] of [
    [kerb, kerb.dimensions.depth!],
    [step, step.dimensions.depth!],
    [tie, tie.dimensions.width!],
    [bag, bag.dimensions.width!],
  ] as const) {
    const film = cross(model, depth);
    let clearance = Infinity;
    for (let t = 0; t <= film.duration; t += 1 / 60)
      for (const p of HumanFoot.base(body, film.bones("a", t)))
        if (p.z > near && p.z < near + depth)
          clearance = Math.min(clearance, p.y - model.dimensions.height!);
    findings.check(
      "the sole clears the occupied depth by " + clearance,
      Number.isFinite(clearance) && clearance > 0,
    );
    for (const side of ["left", "right"] as const)
      findings.check(
        "the trailing ankle clears the far edge",
        film.bones("a", film.duration).get(`${side}Foot`)!.worldPosition.z >
          near + depth,
      );
  }
  for (const [model, depth] of [
    [createHurdle({ kind: "women400" }), 0],
    [createBall({ kind: "football" }), 0],
    [createObstacle({ kind: "jerseyBarrier" }), 0.61],
    [createObstacle({ kind: "crowdBarrier" }), 0.61],
  ] as const) {
    let refusal: unknown;
    try {
      cross(model, depth);
    } catch (error) {
      refusal = error;
    }
    findings.check(
      "unavailable or excessive edge reports obstacle",
      refusal instanceof HumanRefusal && refusal.axis === "obstacle",
    );
  }
}

function checkWallCrossing(findings: motionComplaints.IGatherer): void {
  const body = motionHumanBody("m-average"),
    actor = HumanChain.subject("a");
  const wall = (width?: number, height = 2) =>
    HumanObstacle.wall(
      "wall",
      { x: -2, y: 0, z: 2 },
      { x: 2, y: 0, z: 2 },
      0.2,
      2.5,
      width === undefined
        ? []
        : [
            {
              id: "door",
              at: { x: 0, y: 0, z: 2 },
              across: { x: 1, y: 0, z: 0 },
              width,
              height,
            },
          ],
    );
  const run = (
    obstacle: IAutoMovieMotionHumanObstacle,
    chain: IAutoMovieMotionHumanChain,
    x = 0,
  ) =>
    new HumanPerformance({
      seed: "wall",
      laws: [AutoMovieMotionHumanGait.HumanTravelDoor.passThrough],
      obstacles: [obstacle],
      performers: [
        {
          subject: "a",
          body,
          at: { x, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: motionHumanBody("f-small"),
          at: { x: 0, y: 0, z: 2.6 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    });
  const walk = actor.walk({ to: { x: 0, y: 0, z: 4 } });
  const via = actor.walk({
    to: { x: 0, y: 0, z: 4 },
    via: [
      { x: 3, y: 0, z: 0.5 },
      { x: 3, y: 0, z: 3.5 },
    ],
  });
  for (const [obstacle, minimum] of [
    [wall(), undefined],
    [wall(0.3), body.measure.chestBreadth],
    [wall(0.9, 1.2), body.measure.stature],
  ] as const) {
    let e: unknown;
    try {
      run(obstacle, walk);
    } catch (error) {
      e = error;
    }
    findings.check(
      "blocked walk reports wall and needed clearance",
      e instanceof HumanRefusal &&
        e.kind === "reach" &&
        e.axis === "path" &&
        e.message.includes("wall") &&
        (minimum === undefined ||
          (e.feasible?.kind === "range" &&
            (e.feasible.minimum ?? -Infinity) >= minimum)),
    );
  }
  const open = wall(0.9);
  const pass = actor.registered("passThrough", { through: "wall" });
  for (const [obstacle, chain, x] of [
    [open, walk, 0],
    [wall(), via, 0],
    [open, pass, 1.5],
  ] as const) {
    const p = run(obstacle, chain, x);
    const hips = (t: number) => {
      const b = p.bones("a", t),
        l = b.get("leftUpperLeg")!.worldPosition,
        r = b.get("rightUpperLeg")!.worldPosition;
      return { x: (l.x + r.x) / 2, z: (l.z + r.z) / 2 };
    };
    if (chain === pass) {
      let closest = hips(0);
      for (let t = 0; t <= p.duration; t += 1 / 8) {
        const now = hips(t);
        if (Math.abs(now.z - 2) < Math.abs(closest.z - 2)) closest = now;
      }
      findings.check(
        "portal leads off-axis walker through its aperture",
        Math.abs(closest.x) <= 0.25 && hips(p.duration).z >= 2.3,
      );
    } else
      findings.check(
        "admitted path reaches beyond the wall",
        Math.abs(hips(p.duration).z - 4) <= 0.3,
      );
  }
  let blocked: unknown;
  try {
    run(
      wall(),
      actor.approach({
        target: { kind: "person", subject: "b", region: "sternum" },
      }),
    );
  } catch (error) {
    blocked = error;
  }
  findings.check(
    "wall between approaching actors",
    blocked instanceof HumanRefusal &&
      blocked.kind === "reach" &&
      blocked.axis === "path" &&
      blocked.message.includes("between"),
  );
  let absent: unknown;
  try {
    run(wall(), pass, 1.5);
  } catch (error) {
    absent = error;
  }
  findings.check(
    "no aperture for passage",
    absent instanceof HumanRefusal &&
      absent.kind === "affordance" &&
      absent.axis === "aperture",
  );
}
