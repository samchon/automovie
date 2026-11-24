import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanJump,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * A completed physical somersault arrives at the declared planted soles and recovers on them.
 *
 * Scenarios:
 * 1. Observe the trained average man's forward and backward jumps on level ground.
 * 2. Observe the small woman's physical pike with its original take-off and touchdown cues.
 * 3. Read the adjacent binary64 instants around declared touchdown and sample the planted absorption and recovery at 60 Hz.
 * 4. Refuse a physical rotation without enough time and takeoff impulse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the bodies, physical rotations, clock boundary, displayed contacts and recovery.
 * @evidence contracts/development/testing.md#behavioral-verification Reads public bones and root poses at the declared event and its adjacent representable instants; a floating, sunk or shifted foot, wrong heading, lost winding or changed angular momentum fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected flat soles come from the authored destination, canonical stance separation and standing toe-out. Full signed turns require a winding of plus or minus two pi. The 5 mm geometry and 1 percent displayed momentum budgets are the existing motion limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes both signed turns, the pike layer, opening and closing plant, exact and adjacent instants, and settled support.
 * @evidence contracts/development/testing.md#execution-ownership Runs three finite in-memory public compositions with canonical bodies and no external inputs.
 */
export function test_motion_jump_physical_touchdown(): void {
  const findings: motionComplaints.IGatherer = motionComplaints();
  for (const [name, way, apex, pike] of [
    ["m-average", "forward", 0.5, false],
    ["m-average", "backward", 0.5, false],
    ["f-small", "forward", 0.6, true],
  ] as const) {
    const native: IAutoMovieMotionHumanBody = motionHumanBody(name);

    // Preserve the historical average-body adapter and the maintained native pike.
    const body: IAutoMovieMotionHumanBody = pike ? native : { ...native };
    const label: string = `${name} ${way}${pike ? " pike" : ""}`;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: pike ? "airborne" : "flight",
        flight: "physical",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ hold: 0.3 })
          .jump(
            {
              to: { x: 0, y: 0, z: 1 },
              apex,
              rotation: {
                somersault: 1,
                ...(pike || way === "backward" ? { way } : {}),
              },
            },
            "leap",
          ).node,
        ...(pike
          ? {
              layers: {
                a: [
                  {
                    layer:
                      AutoMovieMotionHumanJump.HumanAirborneShape.layer("pike"),
                    from: { of: "leap", event: "takeoff" },
                    to: { of: "leap", event: "touchdown" },
                    fade: 0.05,
                  },
                ],
              },
            }
          : {}),
      });
    } catch (error) {
      findings.check(
        `${label}: admitted physical jump: ${String(error)}`,
        false,
      );
      continue;
    }
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    /** Convert this jump's declared events to the public film clock. */
    const event = (name: string): number =>
      segment.start +
      segment.plan.duration *
        segment.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === name,
        )!.share;
    const takeoff: number = event("takeoff");
    const touchdown: number = event("touchdown");
    const settled: number = event("settled");
    const times: readonly number[] = [
      adjacent(touchdown, -1n),
      touchdown,
      adjacent(touchdown, 1n),
      (touchdown + settled) / 2,
      settled,
      film.duration,
      ...Array.from(
        { length: Math.ceil(60 * (film.duration - touchdown)) },
        (_: unknown, index: number): number => touchdown + index / 60,
      ),
    ];
    const bones: ReturnType<HumanPerformance["bones"]>[] = times.map(
      (time: number): ReturnType<HumanPerformance["bones"]> =>
        film.bones("a", time),
    );
    const before: IAutoMovieVector3 = film.pose("a", times[0]!).root!
      .translation;
    const after: IAutoMovieVector3 = film.pose("a", times[2]!).root!
      .translation;
    const rootDrift: number = Vector3.distance(before, after);
    findings.check(
      `${label}: root seam ${(rootDrift * 1000).toFixed(3)} mm`,
      rootDrift <= 0.005,
    );
    const touchShare: number = segment.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === "touchdown",
    )!.share;
    for (const side of ["left", "right"] as const) {
      const bone: `${typeof side}Foot` = `${side}Foot`;
      const contact: IAutoMovieMotionHumanContactWindow | undefined =
        segment.plan.contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part === bone && c.from === touchShare,
        );
      findings.check(
        `${label}: ${bone} declares ground support at touchdown`,
        contact?.kind === "plant" && contact.support?.kind === "ground",
      );
      const expected: IAutoMovieVector3 = {
        x: body.rest.get(bone)!.x,
        y: body.measure.ankleHeight,
        z: 1,
      };
      const flat: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        side === "left"
          ? AutoMovieMotionHumanStance.stand.TOE_OUT
          : -AutoMovieMotionHumanStance.stand.TOE_OUT,
      );
      const soles: ReturnType<typeof HumanFoot.sockets>[] = bones.map(
        (frame): ReturnType<typeof HumanFoot.sockets> =>
          HumanFoot.sockets(body, frame, side),
      );
      for (const [i, { socket, point }] of soles[1]!.entries()) {
        const target: IAutoMovieVector3 = HumanFoot.point(body, side, socket, {
          ankle: expected,
          rotation: flat,
        });
        for (const [index, sole] of soles.entries()) {
          const marker: IAutoMovieVector3 = sole[i]!.point;
          const error: number = Vector3.distance(marker, target);
          findings.check(
            `${label}: ${bone} ${socket} sample ${index} target error ${(error * 1000).toFixed(3)} mm, floor height ${(marker.y * 1000).toFixed(3)} mm`,
            error <= 0.005 && nclose(marker.y, 0, 0.005),
          );
        }
        const change: number = Vector3.distance(point, soles[2]![i]!.point);
        findings.check(
          `${label}: ${bone} ${socket} touchdown seam ${(change * 1000).toFixed(3)} mm`,
          change <= 0.005,
        );
      }
    }

    const initial: IAutoMovieQuaternion = Quaternion.inverse(
      film.pose("a", takeoff).root!.rotation,
    );
    let previous: number = 0;
    let turn: number = 0;
    for (let i: number = 1; i <= 32; i++) {
      const t: number = takeoff + ((times[0]! - takeoff) * i) / 32;
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        initial,
        film.pose("a", t).root!.rotation,
      );
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
        x: 0,
        y: 1,
        z: 0,
      });
      const angle: number = Math.atan2(axis.z, axis.y);
      turn += Math.atan2(
        Math.sin(angle - previous),
        Math.cos(angle - previous),
      );
      previous = angle;
    }
    findings.check(
      `${label}: completes its signed turn`,
      nclose(turn / (2 * Math.PI), way === "forward" ? 1 : -1, 0.02),
    );

    const delta: number = integrateAirborneRotation.DELTA;
    /** Estimate displayed angular momentum over the same symmetric interval at each probe. */
    const momentum = (share: number): IAutoMovieVector3 => {
      const t: number = takeoff + (touchdown - takeoff) * share;
      return resolveAutoMovieMomentum(
        body.massModel,
        film.bones("a", t - delta),
        film.bones("a", t + delta),
        2 * delta,
      ).angular;
    };
    const reference: IAutoMovieVector3 = momentum(0.25);
    const lastFlightShare: number = 1 - (2 * delta) / (touchdown - takeoff);
    for (const share of [0.5, 0.75, lastFlightShare]) {
      const drift: number =
        Vector3.distance(momentum(share), reference) /
        Vector3.length(reference);
      findings.check(
        `${label}: displayed momentum drifts ${drift} at ${share}`,
        drift <= 0.01,
      );
    }
  }
  let refusal: unknown;
  try {
    new HumanPerformance({
      seed: "unsupported-flight",
      flight: "physical",
      performers: [
        {
          subject: "a",
          body: motionHumanBody("m-average"),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .jump({
          to: { x: 0, y: 0, z: 0.15 },
          apex: 0.05,
          rotation: { somersault: 4 },
        }).node,
    });
  } catch (error) {
    refusal = error;
  }
  findings.check(
    `insufficient physical takeoff refuses turns: ${String(refusal)}`,
    refusal instanceof HumanRefusal && refusal.axis === "turns",
  );
  findings.assert("physical turns reach both planted soles at touchdown");
}

/** Return the immediately adjacent binary64 instant on either side of a positive event second. */
function adjacent(time: number, step: -1n | 1n): number {
  const bits: DataView = new DataView(new ArrayBuffer(8));
  bits.setFloat64(0, time);
  bits.setBigUint64(0, bits.getBigUint64(0) + step);
  return bits.getFloat64(0);
}
