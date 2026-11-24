import {
  AutoMovieArchetypeEquineFall,
  AutoMovieArchetypeEquineStance,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanUnseat,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** Seconds into the unseat act the saddle lets go. */
const RELEASE: number = 1;

/**
 * A rider released from a moving saddle (#3941), and a buck's thrown outcome handed to it (#3940).
 *
 * Scenarios, each on the trotting horse unless named:
 * 1. Backward fall: at the release the displayed hips move with the saddle's own velocity, within 0.1 m/s; no window on the horse stays open after the release; through the landing no bone of the rider passes 10 mm below the floor; the falling hand's floor window opens before the back's, and the displayed hand is within 50 mm of the floor at the landing.
 * 2. Sideways fall to the left and to the right: the landed hips lie on the authored side of the saddle's heading at the release.
 * 3. Drag: until the breakaway the left ball stays within 10 mm of the left stirrup and the hips lie on the floor, below 0.3 m, behind the stirrup along the horse's heading; after the breakaway no window on the horse stays open.
 * 4. Step clear: the rider lands on the feet, the hips at their standing height within 30 mm.
 * 5. Slump staying on: the seat window holds to the end and the right hand's grip on the mane opens once slumped; the displayed right wrist is within 0.7 hand lengths of the mane after the slump.
 * 6. Seeking back to the landing after a later second gives the same hips.
 * 7. A sideways fall pushed too gently to clear the flank is refused on `push`.
 * 9. Fall with the horse: as a trained horse goes down on its left from a canter, the rider steps clear on its right, landing on the feet more than 0.5 m to the right of the saddle's line at the fall and clear of the fallen horse.
 * 8. Thrown by a buck at a halt: the release at the buck's lift-off instant hands the rider to the fall, and the rider lands.
 * 10. Backward fall from a galloping horse: the take is clean, the falling hand passing no part through the thighs, and the displayed hand is within 50 mm of the floor at the landing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every fall checked, its bounds and their sources.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the unseat law over an actual trotting or bucking horse and reads the displayed hips, hands, balls and bones against its moving saddle, stirrup, mane and the floor; a jump in velocity, a contact kept bound, a penetration, a wrong side or a lost stirrup fails.
 * @evidence contracts/development/testing.md#independent-expectations The release velocity is the saddle's own read from its frame; the floor is height 0; the side is the authored one; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Back, left, right, drag, clear, slump and a refused fall; a trotting against a bucking horse.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on one archetype horse.
 */
export function test_motion_mount_equestrian_unseat(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const trot: mountedHorseScene.Ride = mountedHorseScene.course(horse, "trot");
  const hips = (
    scene: mountedHorseScene.IScene,
    at: number,
  ): IAutoMovieVector3 =>
    scene.film.bones("rider", at).get("hips")!.worldPosition;
  const act = (scene: mountedHorseScene.IScene): IAutoMovieMotionHumanSegment =>
    scene.segments[scene.segments.length - 1]!;
  const instant = (scene: mountedHorseScene.IScene, name: string): number => {
    const segment: IAutoMovieMotionHumanSegment = act(scene);
    const event = segment.plan.events.find((e): boolean => e.name === name)!;
    return segment.start + event.share * (segment.end - segment.start);
  };
  const onHorse = (
    scene: mountedHorseScene.IScene,
    after: number,
  ): string[] => {
    const segment: IAutoMovieMotionHumanSegment = act(scene);
    const share: number =
      (after - segment.start) / (segment.end - segment.start);
    return segment.plan.contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.support.kind === "prop" && c.to > share + 1e-9,
      )
      .map((c: IAutoMovieMotionHumanContactWindow): string => c.part);
  };

  // 1. The backward fall.
  const back: mountedHorseScene.IScene = stage(horse, body, trot, {
    fall: "back",
  });
  assertTakeClean("a backward fall from a trotting horse", back.film);
  const released: number = instant(back, "release");
  const h: number = 1 / 240;
  const riderVelocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(hips(back, released + h), hips(back, released - h)),
    1 / (2 * h),
  );
  const saddleVelocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(
      back.part("seat", released + h).translation,
      back.part("seat", released - h).translation,
    ),
    1 / (2 * h),
  );
  if (Vector3.distance(riderVelocity, saddleVelocity) > 0.1)
    findings.push(
      `back: the hips leave at ${JSON.stringify(riderVelocity)} m/s, the saddle moves at ${JSON.stringify(saddleVelocity)}`,
    );
  if (onHorse(back, released + 1e-3).length !== 0)
    findings.push(
      `back: ${onHorse(back, released + 1e-3).join(", ")} stay bound to the horse after the release`,
    );
  const landed: number = instant(back, "land");
  for (let k: number = 0; k <= 12; ++k) {
    const at: number = landed - 0.3 + (0.6 * k) / 12;
    let lowest: number = Infinity;
    for (const bone of back.film.bones("rider", at).values())
      lowest = Math.min(lowest, bone.worldPosition.y);
    if (lowest < -CONTACT) {
      findings.push(
        `back: a bone is ${(-lowest * 1000).toFixed(1)} mm under the floor at ${at.toFixed(2)} s`,
      );
      break;
    }
  }
  const windows: readonly IAutoMovieMotionHumanContactWindow[] =
    act(back).plan.contacts;
  const hand: IAutoMovieMotionHumanContactWindow | undefined = windows.find(
    (c) => c.part === "leftHand" && c.support.kind === "ground",
  );
  const lie: IAutoMovieMotionHumanContactWindow | undefined = windows.find(
    (c) => c.part === "back",
  );
  if (hand === undefined || lie === undefined || !(hand.from < lie.from))
    findings.push(
      "back: the falling hand does not meet the floor before the back",
    );
  const palm: number = back.film.bones("rider", landed).get("leftHand")!
    .worldPosition.y;
  if (palm > 0.05)
    findings.push(
      `back: the falling hand is ${palm.toFixed(3)} m above the floor at the landing`,
    );

  // 10. The backward fall at the gallop: the falling hand's way to the floor keeps clear of the thighs.
  const gallop: mountedHorseScene.IScene = stage(
    horse,
    body,
    mountedHorseScene.course(horse, "gallop"),
    { fall: "back" },
  );
  assertTakeClean("a backward fall from a galloping horse", gallop.film);
  const galloped: number = gallop.film
    .bones("rider", instant(gallop, "land"))
    .get("leftHand")!.worldPosition.y;
  if (galloped > 0.05)
    findings.push(
      `gallop: the falling hand is ${galloped.toFixed(3)} m above the floor at the landing`,
    );

  // 2. Sideways falls land on their side.
  for (const side of ["left", "right"] as const) {
    const scene: mountedHorseScene.IScene = stage(horse, body, trot, {
      fall: "side",
      side,
    });
    const at: number = instant(scene, "release");
    const seat = scene.part("seat", at);
    const lateral: number = Vector3.dot(
      Vector3.subtract(
        hips(scene, scene.film.duration - 0.05),
        seat.translation,
      ),
      Quaternion.rotateVector(seat.rotation, { x: 1, y: 0, z: 0 }),
    );
    if (side === "left" ? !(lateral > 0) : !(lateral < 0))
      findings.push(
        `side ${side}: the rider lands ${lateral.toFixed(3)} m along the saddle's left`,
      );
  }

  // 3. The drag behind the left stirrup, freed by the breakaway.
  const drag: mountedHorseScene.IScene = stage(horse, body, trot, {
    fall: "drag",
    side: "left",
    stirrup: "leftStirrup",
    free: 2,
  });
  const dragged: number = instant(drag, "release");
  const freed: number = instant(drag, "free");
  for (let k: number = 1; k <= 8; ++k) {
    const at: number = dragged + 0.5 + ((freed - dragged - 0.6) * k) / 8;
    const stirrup = drag.part("leftStirrup", at);
    const ball: IAutoMovieVector3 = HumanFoot.sockets(
      body,
      HumanSignature.bones(drag.reader, at),
      "left",
    ).find(
      (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
    )!.point;
    if (
      Vector3.distance(ball, stirrup.translation) >
      CONTACT + body.measure.footLength
    )
      findings.push(
        `drag: the left ball is ${Vector3.distance(ball, stirrup.translation).toFixed(3)} m from its stirrup at ${at.toFixed(2)} s`,
      );
    const at3: IAutoMovieVector3 = hips(drag, at);
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(stirrup.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    if (
      !(
        at3.y < 0.3 &&
        Vector3.dot(Vector3.subtract(at3, stirrup.translation), ahead) < 0
      )
    )
      findings.push(
        `drag: the hips are not on the floor behind the stirrup at ${at.toFixed(2)} s`,
      );
  }
  if (onHorse(drag, freed + 1e-3).length !== 0)
    findings.push(
      `drag: ${onHorse(drag, freed + 1e-3).join(", ")} stay bound after the breakaway`,
    );

  // 4. Stepping clear onto the feet.
  const clear: mountedHorseScene.IScene = stage(horse, body, trot, {
    fall: "clear",
    side: "left",
  });
  const stood: number = hips(clear, instant(clear, "land") + 0.01).y;
  if (Math.abs(stood - body.measure.hipHeight) > 0.03)
    findings.push(
      `clear: the hips land at ${stood.toFixed(3)} m, the standing height is ${body.measure.hipHeight.toFixed(3)}`,
    );

  // 5. Slumped, staying on with a hand in the mane.
  const slump: mountedHorseScene.IScene = stage(horse, body, trot, {
    fall: "slump",
    side: "left",
    mane: "mane",
    stays: true,
  });
  const slumpWindows = act(slump).plan.contacts;
  if (!slumpWindows.some((c) => c.part === "seat" && c.to === 1))
    findings.push("slump: the seat does not hold to the end");
  if (!slumpWindows.some((c) => c.part === "rightHand" && c.kind === "grip"))
    findings.push("slump: the right hand never grips the mane");
  const late: number = slump.film.duration - 0.1;
  const wrist: number = Vector3.distance(
    slump.film.bones("rider", late).get("rightHand")!.worldPosition,
    slump.part("mane", late).translation,
  );
  if (wrist > 0.7 * body.measure.hand)
    findings.push(
      `slump: the right wrist is ${wrist.toFixed(3)} m from the mane`,
    );

  // 6. Seeking is repeatable.
  const first: IAutoMovieVector3 = hips(back, landed);
  hips(back, back.film.duration - 0.05);
  if (Vector3.distance(first, hips(back, landed)) > 1e-9)
    findings.push(
      "seek: the landing's hips change after a later second is read",
    );

  // 7. A fall too gentle to clear the flank is refused.
  let error: unknown = null;
  try {
    const weak: mountedHorseScene.IScene = stage(horse, body, trot, {
      fall: "side",
      side: "left",
      push: 0.05,
    });
    weak.film.bones("rider", weak.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "push"))
    findings.push(
      `a fall that crosses the flank must be refused on push, got ${String(error)}`,
    );

  // 8. Thrown by a buck: released at its lift-off.
  const halt: mountedHorseScene.Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.2,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 1,
      deceleration: 1,
      startFromStanding: true,
      legs: [{ kind: "straight", length: 2 }],
    },
    "walk",
  );
  const buck: number = halt.duration + 2;
  const bucking: mountedHorseScene.Ride = AutoMovieArchetypeEquineStance.after(
    horse,
    halt,
    [{ kind: "buck", pitch: 15, from: buck, entry: 0.6, hold: 0.3, exit: 0.6 }],
  );
  const lift: number =
    WAIT +
    bucking.instants.find(
      (e) => e.label === "leftHindOff" && e.seconds >= buck,
    )!.seconds;
  const thrown: mountedHorseScene.IScene = stage(
    horse,
    body,
    bucking,
    { fall: "forward", cue: "thrown" },
    {
      thrown: [{ name: "thrown", seconds: lift }],
    },
  );
  if (Math.abs(instant(thrown, "release") - lift) > 1e-6)
    findings.push(
      `thrown: released at ${instant(thrown, "release")}, the buck lifts off at ${lift}`,
    );
  if (!(hips(thrown, thrown.film.duration - 0.05).y < 0.4))
    findings.push("thrown: the rider does not come to lie on the floor");

  // 9. A fall with the horse: the trained horse goes down on its left; the rider steps clear on the high, right, side as it starts down.
  const canter: mountedHorseScene.Ride = mountedHorseScene.course(
    horse,
    "canter",
  );
  const trunk = horse.parts.find((part) => part.id === "trunk")!;
  const quarters = horse.parts.find((part) => part.id === "hindquarters")!;
  const down: number = canter.duration / 2;
  const falling: mountedHorseScene.Ride = AutoMovieArchetypeEquineFall.after(
    horse,
    canter,
    {
      from: down,
      drop: 0.6,
      slide: 3,
      prepared: true,
      rest: {
        loweringSeconds: 2,
        restingSeconds: 1,
        risingSeconds: 2,
        restPitch:
          (Math.atan2(
            trunk.transform!.translation.y - quarters.transform!.translation.y,
            trunk.transform!.translation.z - quarters.transform!.translation.z,
          ) *
            180) /
          Math.PI,
        tailDirection: -90,
        folded: { fore: [90, 0], hind: [-90, 0] },
        windows: { body: [0, 1], fore: [0, 1], hind: [0, 1] },
      },
      lateral: {
        side: "left",
        rollDegrees: 90,
        tuckDegrees: 35,
        turnSeconds: 1,
        holdSeconds: 0.8,
        offset: 0.08,
      },
      away: { length: 2, speed: 1.2 },
    },
  );
  const goingDown: number = WAIT + down;
  const clearOf: mountedHorseScene.IScene = stage(
    horse,
    body,
    falling,
    { fall: "clear", side: "right", cue: "fall" },
    { fall: [{ name: "fall", seconds: goingDown }] },
  );
  assertTakeClean("stepping clear of a falling horse", clearOf.film);
  const atFall = clearOf.part("seat", goingDown);
  const end: number = clearOf.film.duration - 0.05;
  const aside: number = Vector3.dot(
    Vector3.subtract(hips(clearOf, end), atFall.translation),
    Quaternion.rotateVector(atFall.rotation, { x: 1, y: 0, z: 0 }),
  );
  if (!(aside < -0.5))
    findings.push(
      `fall with the horse: the rider lands ${aside.toFixed(3)} m along the horse's left, not clear on its right`,
    );
  if (Math.abs(hips(clearOf, end).y - body.measure.hipHeight) > 0.03)
    findings.push("fall with the horse: the rider does not land on the feet");
  const lying: IAutoMovieVector3 = clearOf.part("seat", end).translation;
  if (
    Vector3.distance({ ...hips(clearOf, end), y: 0 }, { ...lying, y: 0 }) < 0.5
  )
    findings.push("fall with the horse: the rider ends under the fallen horse");

  TestValidator.equals("a rider released from a moving saddle", findings, []);
}

/** Sit, ride on with the stirrups and reins, then leave the saddle `RELEASE` seconds into the unseat act. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  course: mountedHorseScene.Ride,
  fall: Omit<IAutoMovieMotionHumanUnseat, "on" | "frame">,
  cues?: Record<string, { name: string; seconds: number }[]>,
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "trot",
    wait: WAIT,
    course,
    ...(cues === undefined ? {} : { cues }),
    laws: [AutoMovieMotionHumanMount.unseat],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: 0.6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        })
        .registered("unseat", {
          on: "horse",
          frame: "seat",
          ...(fall.cue === undefined ? { release: RELEASE + WAIT - 1 } : {}),
          ...fall,
        }),
  });
}
