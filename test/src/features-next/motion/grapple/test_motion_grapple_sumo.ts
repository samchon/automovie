import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSignature,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionCombatPair } from "../../../features/internal/motionCombatPair";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A sumo bout, its grip regions and its finish. */
interface IBout {
  /** The grapple scene. */
  kind: Extract<
    IAutoMovieMotionHumanGrapple.Kind,
    "oshiDashi" | "yoriKiri" | "uwateNage"
  >;

  /** The receiver's regions the initiator's hands meet at the tachiai. */
  grip: readonly [AutoMovieHumanoidRegion, AutoMovieHumanoidRegion];

  /** How it ends: the receiver pushed out of the ring, or thrown onto the clay. */
  finish: "out" | "thrown";
}

/**
 * The three sumo bouts. The push's hands meet the sides of the chest: an
 * oshi push is the hazu grip, the thumb and index spread in a V that pushes
 * up under the armpit (hazu-oshi, the sport's glossary), not two palms
 * beside the sternum, whose chest regions lie a palm's breadth apart (74 mm
 * on the small body) so that the two hands meet.
 */
const BOUTS: readonly IBout[] = [
  { kind: "oshiDashi", grip: ["ribsRight", "ribsLeft"], finish: "out" },
  { kind: "yoriKiri", grip: ["hipRight", "hipLeft"], finish: "out" },
  { kind: "uwateNage", grip: ["hipRight", "hipLeft"], finish: "thrown" },
];

/** A held or landed contact lies within this, metres: the grapple specs' 1 cm. */
const GRIP: number = 0.01;

/** A flat stamp has heel and ball within this of the floor, metres: the support checks' 5 mm. */
const FLAT: number = 0.005;

/** The ring's diameter, metres (the Japan Sumo Association's 4.55 m). */
const RING: number = 4.55;

/** The shikiri lines' separation, metres: 70 cm. */
const LINES: number = 0.7;

/** The shiko's authored foot lift, a share of stature, as the stance phrase states it. */
const SHIKO: number = 0.4;

/**
 * Sumo on two bodies: the shiko foot rises above its authored height and
 * stamps down flat; at each bout's tachiai the initiator's hands meet the
 * sides of the receiver's chest or the belt, and the bout ends with the receiver's foot
 * outside the ring or the receiver thrown onto the clay. Every take passes
 * the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case and what it reads.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the shiko and the three grapple bouts through HumanPerformance and reads the displayed feet, palms and back at the laws' events.
 * @evidence contracts/development/testing.md#independent-expectations The ring and the lines are the Japan Sumo Association's; contacts are the grapple specs' 1 cm and the support checks' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair on a small and an average body, a push, a belt force-out and a belt throw.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances, with no host or capture.
 */
export function test_motion_grapple_sumo(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const [label, run] of [
      ["shiko", shiko],
      ["sumo", sumo],
    ] as const)
      try {
        run(name, body, complaints);
      } catch (error) {
        complaints.list.push(`${name} ${label}: ${String(error)}`);
      }
  }
  complaints.assert("sumo");
}

/** The shiko lifts the foot above its authored height and stamps it flat. */
function shiko(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = motionCombatPair.pair(
    body,
    RING / 2,
    HumanChain.subject("a").registered(
      "martialArt",
      { kind: "sumoShiko", lead: "left" },
      "shiko",
    ),
    "shiko",
  );
  assertTakeClean(`${name} shiko`, film);
  const stamp: IAutoMovieScheduleEntry = motionCombatPair.placed(film, "shiko");
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  let top: number = 0;
  let landed: number = stamp.end;
  let lifted: boolean = false;
  for (let s: number = stamp.start; s <= stamp.end; s += 1 / 48) {
    const y: number = motionCombatPair.foot(body, a, "left", "sole", s).y;
    top = Math.max(top, y);
    if (y > FLAT) lifted = true;
    else if (lifted) {
      landed = s;
      break;
    }
  }
  const heel: number = motionCombatPair.foot(body, a, "left", "heel", landed).y;
  const ball: number = motionCombatPair.foot(body, a, "left", "ball", landed).y;
  complaints.check(
    `${name} shiko: the foot rises ${top} m and lands with heel ${heel} m and ball ${ball} m`,
    top >= SHIKO * body.measure.stature &&
      Math.abs(heel) <= FLAT &&
      Math.abs(ball) <= FLAT,
  );
}

/** The three sumo bouts from the shikiri lines. */
function sumo(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const distance: number = LINES + 2 * 0.15 * body.measure.stature;
  for (const bout of BOUTS) {
    const cell: string = `${name} ${bout.kind}`;
    const film: HumanPerformance = motionCombatPair.pair(
      body,
      distance,
      HumanChain.mutual(
        AutoMovieMotionHumanCarryPerson.HumanCoupled.grappling,
        {
          initiator: HumanChain.subject("a").stand({ hold: 0.3, sway: 0 }),
          receiver: HumanChain.subject("b").stand({ hold: 0.3, sway: 0 }),
        },
        { kind: bout.kind },
      ),
      bout.kind,
    );
    assertTakeClean(cell, film);
    const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const b: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "b",
      body,
      180,
    );
    const scene: IAutoMovieScheduleEntry | undefined =
      film.schedule.entries.find(
        (entry: IAutoMovieScheduleEntry): boolean =>
          entry.subject === "a" && entry.contact !== undefined,
      );
    if (scene === undefined) {
      complaints.list.push(`${cell}: no tachiai`);
      continue;
    }
    const tachiai: number = scene.contact!;
    const held: readonly number[] = (["left", "right"] as const).map(
      (side: AutoMovieHumanSide, index: number): number =>
        Vector3.distance(
          HumanSignature.region(
            a,
            side === "left" ? "palmLeft" : "palmRight",
            tachiai,
          ),
          HumanSignature.region(b, bout.grip[index]!, tachiai),
        ),
    );
    complaints.check(
      `${cell}: at the tachiai the palms lie ${held.join(", ")} m from the ${bout.grip.join(" and ")}`,
      held.every((gap: number): boolean => gap <= GRIP),
    );
    const end: number = film.duration;
    const centre: IAutoMovieVector3 = { x: 0, y: 0, z: distance / 2 };
    if (bout.finish === "out") {
      const out: number = Math.max(
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): number => {
            const ankle: IAutoMovieVector3 = HumanSignature.joint(
              b,
              end,
              `${side}Foot`,
            );
            return Math.hypot(ankle.x - centre.x, ankle.z - centre.z);
          },
        ),
      );
      complaints.check(
        `${cell}: the loser's farther foot ends ${out} m from the centre`,
        out > RING / 2,
      );
    } else {
      const back: number = HumanSignature.region(b, "upperBack", end).y;
      complaints.check(
        `${cell}: the thrown receiver's back lies ${back} m above the clay`,
        back <= 0.15 * body.measure.stature,
      );
    }
  }
}
