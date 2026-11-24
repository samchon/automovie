import { createPlyoBox } from "@automovie/archetypes";
import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanThrowCatch,
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanColliders, HumanFoot } from "@automovie/motions/internal";

import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { motionHumanStance } from "../../internal/motionHumanStance";

/**
 * A two-hand box vault
 * (`AutoMovieMotionHumanAcrobatics.HumanGymnastics.boxVault`, the squat vault
 * law) lays the hands on the box, flies over it and lands beyond it, on the
 * average man and the small woman.
 *
 * The box is a 30 inch plyometric box (`createPlyoBox`, its tallest common
 * height), stood with its near side half the arm's length ahead of the quiet
 * stance's toes, where a body standing at it lays its hands (provisional
 * placement). Its far edge is read from its own geometry: its place along the
 * heading plus half its declared depth.
 *
 * Scenarios: on each body:
 *
 * 1. The vault plans and is placed under its row's name.
 * 2. No contact window is open strictly between the push-off (`tucked`) and
 *    `touchdown`: the body flies, borne by nothing.
 * 3. At `touchdown` both heels lie beyond the box's far edge along the heading:
 *    the feet land past the box, not on or before it.
 * 4. Both feet are planted from `touchdown` to the end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the vault through the public chain with a real archetype box and reads the plan's windows and events and the displayed feet; a vault that lands on or before the box, or that leans on something in flight, fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The far edge is the box's own placement and declared depth; the flight's emptiness and the landing beyond it are what a vault over a box is.
 * @evidence contracts/development/testing.md#distinguishing-cases The push-off, the flight and the landing, on one measured body of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance each in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the box and its placement, how the far edge is read and the 4 scenarios.
 */
export function test_motion_support_gym_support(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  checkSupportedWorkout(complaints);
  checkInvertedSupport(complaints);
  const box: ReturnType<typeof createPlyoBox> = createPlyoBox({
    height: 0.762,
  });
  const depth: number = box.dimensions.depth!;
  for (const name of ["f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stance = motionHumanStance(body);
    const toes: number = Math.max(
      stance.get("leftToes")!.worldPosition.z,
      stance.get("rightToes")!.worldPosition.z,
    );
    const middle: number =
      toes + (body.measure.upperArm + body.measure.forearm) / 2 + depth / 2;
    const far: number = middle + depth / 2;
    let film: IAutoMovieMotionHumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "box-vault",
        laws: [AutoMovieMotionHumanAcrobatics.HumanGymnastics.boxVault],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("box", box, {
            position: { x: 0, y: 0, z: middle },
            rotation: Quaternion.identity(),
          }),
        ],
        composition: HumanChain.subject("a").registered("boxVault", {
          on: "box",
        }).node,
      });
      film.segments("a");
    } catch (error) {
      complaints.check(`${name}: refused, ${(error as Error).message}`, false);
      continue;
    }

    // 1. Placed under its name.
    const vault: IAutoMovieMotionHumanSegment | undefined = film
      .segments("a")
      .find(
        (s: IAutoMovieMotionHumanSegment): boolean => s.name === "boxVault",
      );
    complaints.check(`${name}: placed as boxVault`, vault !== undefined);
    if (vault === undefined) continue;
    const share = (event: string): number | undefined =>
      vault.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === event,
      )?.share;
    const push: number | undefined = share("tucked");
    const down: number | undefined = share("touchdown");
    complaints.check(
      `${name}: push-off at ${push?.toFixed(3)} before touchdown at ${down?.toFixed(3)}`,
      push !== undefined && down !== undefined && push < down,
    );
    if (push === undefined || down === undefined) continue;

    // 2. Nothing bears in flight.
    const bearing: string[] = vault.plan.contacts
      .filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.from < down - 1e-9 && w.to > push + 1e-9,
      )
      .map(
        (w: IAutoMovieMotionHumanContactWindow): string =>
          `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`,
      );
    complaints.check(
      `${name}: no support in flight, read ${bearing.join(", ") || "none"}`,
      bearing.length === 0,
    );

    // 3. The heels land beyond the far edge.
    const t: number = vault.start + down * vault.plan.duration;
    const bones = film.bones("a", t);
    for (const side of ["left", "right"] as const) {
      const heel: number = HumanFoot.sockets(body, bones, side)[0]!.point.z;
      complaints.check(
        `${name}: the ${side} heel lands at ${heel.toFixed(3)} m, beyond the far edge at ${far.toFixed(3)} m`,
        heel > far,
      );
    }

    // 4. Both feet planted from touchdown to the end.
    for (const part of ["leftFoot", "rightFoot"] as const)
      complaints.check(
        `${name}: the ${part} is planted from touchdown to the end`,
        vault.plan.contacts.some(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.part === part &&
            w.kind === "plant" &&
            Math.abs(w.from - down) < 1e-9 &&
            w.to >= 1 - 1e-9,
        ),
      );
  }
  complaints.assert("a box vault flies over its box and lands beyond it");
}

/** The physical floor is shared by prone, supine, elevated and lateral supports. */
function checkSupportedWorkout(complaints: motionComplaints.IGatherer): void {
  const body = motionHumanBody("f-small");
  for (const kind of [
    "superman",
    "crunch",
    "lyingLegRaise",
    "pnfHamstring",
    "benchPress",
    "sidePlank",
  ] as const) {
    try {
      const p = new HumanPerformance({
        seed: "workout-floor",
        laws: [AutoMovieMotionHumanWorkout.workout],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").registered("workout", {
          kind,
          count: 1,
          hold: kind === "sidePlank" ? 1.5 : 0.5,
        }).node,
      });
      let deepest = 0;
      for (let t = 0; t <= p.duration + 1e-9; t += 1 / 24)
        for (const { pose, shapes } of HumanColliders.placed(
          body,
          p.bones("a", t),
        ))
          for (const shape of shapes)
            deepest = Math.max(
              deepest,
              -physicalShapeBounds(pose, shape).min.y,
            );
      complaints.check(
        kind + " floor penetration " + deepest,
        deepest <= 0.005,
      );
    } catch (error) {
      complaints.list.push(kind + ": " + String(error));
    }
  }
}

/** A lateral cartwheel maintains heading. A round-off reverses it on landing. */
function checkInvertedSupport(findings: motionComplaints.IGatherer): void {
  const body = motionHumanBody("m-average"),
    stature = body.measure.stature;
  for (const law of [
    AutoMovieMotionHumanThrowCatch.HumanSportThrow.cartwheelLeft,
    AutoMovieMotionHumanAcrobatics.HumanGymnastics.roundOffLeft,
    AutoMovieMotionHumanAcrobatics.HumanGymnastics.roundOffRight,
  ]) {
    const p = new HumanPerformance({
      seed: "inverted",
      laws: [law],
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
        .registered(law.name).node,
    });
    const span = p.segments("a")[1]!,
      reader = HumanSignature(p, "a", body, 0);
    const t = (share: number) => span.start + share * span.plan.duration;
    const half = t(span.plan.events.find((e) => e.name === "inverted")!.share);
    const hips = (at: number) =>
      Vector3.lerp(
        HumanSignature.joint(reader, at, "leftUpperLeg"),
        HumanSignature.joint(reader, at, "rightUpperLeg"),
        0.5,
      );
    findings.check(
      law.name + " inverts over both palms",
      HumanSignature.joint(reader, half, "head").y < hips(half).y &&
        (["leftHand", "rightHand"] as const).every(
          (b) => HumanSignature.joint(reader, half, b).y <= 0.1 * stature,
        ),
    );
    const hands = span.plan.contacts.filter(
      (w) => w.part === "leftHand" || w.part === "rightHand",
    );
    findings.check(
      law.name + " plants each hand",
      hands.length === 2 && hands[0]!.part !== hands[1]!.part,
    );
    for (const w of hands) {
      const hand = w.part === "leftHand" ? "leftHand" : "rightHand",
        anchor = HumanSignature.joint(reader, t(w.from), hand);
      for (const share of [(w.from + w.to) / 2, w.to])
        findings.check(
          law.name + " " + hand + " planted slip",
          Vector3.distance(
            anchor,
            HumanSignature.joint(reader, t(share), hand),
          ) <= 0.005,
        );
    }
    const end = span.end;
    const facing = (at: number) =>
      Quaternion.rotateVector(p.bones("a", at).get("hips")!.worldRotation, {
        x: 0,
        y: 0,
        z: 1,
      });
    const direction = Vector3.dot(facing(span.start), facing(end)),
      travel = Vector3.subtract(hips(end), hips(span.start));
    findings.check(
      law.name + " ends upright",
      HumanSignature.joint(reader, end, "head").y - hips(end).y > 0.3 * stature,
    );
    if (law === AutoMovieMotionHumanThrowCatch.HumanSportThrow.cartwheelLeft)
      findings.check(
        law.name + " lateral advance and heading",
        travel.x > 0.8 * stature && direction >= 0.99,
      );
    else {
      findings.check(
        law.name + " advances and reverses heading",
        travel.z > 0.5 * stature && direction <= -0.99,
      );
      for (const side of ["left", "right"] as const)
        findings.check(
          law.name + " sole landing",
          Math.abs(HumanSignature.sole(reader, end, side).y) <= 0.015,
        );
    }
  }
}
