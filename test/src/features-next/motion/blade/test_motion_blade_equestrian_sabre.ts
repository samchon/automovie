import { createHorse, createSword, rideHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  HumanObject,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Where the rider stands before sitting on, in the seat's frame on the floor. */
const FROM: IAutoMovieVector3 = { x: 0.6, y: 0, z: -0.2 };

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** The charge's transition, seconds: inside one gallop stride. */
const TRANSITION: number = 0.4;

/** How far a blade may point or turn its edge from a carriage's target, degrees (provisional). */
const AIM: number = 15;

/**
 * A cavalry sabre at the slope through the canter and brought to the engage at the trumpet's charge on the gallop (#3949, for #3957).
 *
 * Scenarios:
 * 1. Picked up on the ground and carried through sitting on, the ride and the overlay, the sabre's grip stays within 10 mm of the right hand's grip at every read.
 * 2. At the slope the back of the blade rests on the right shoulder: the blade passes within half a hand's length (about a hand's breadth) of the right shoulder joint, its edge facing away from the shoulder and its point above the grip; at the engage the point runs along the seat's forward and the edge up, as the ox guard turns it, within 15 degrees.
 * 3. The charge begins after the cue by the rider's reaction and reaches the engage within one gallop stride, 0.5 s.
 * 4. No point along the blade comes within the rider's head radius of the head or within the horse's own neck and head (the blade stays above the withers and outside the straddle below it).
 * 5. The left wrist stays within 0.7 hand lengths of the reins' middle; the seat within 10 mm of the saddle and both balls of the feet within 10 mm of their treads.
 * 6. A charge cued while the ride is still at the canter is refused on `cue`.
 * 7. With a target 6 m to the right of 20 m ahead, the engaged blade points at it within 15 degrees in the level plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario and bound.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the sabre law over an actual horse ride from canter to gallop with an actual sabre picked up by the polygon man, and reads the displayed sabre, hands, seat and feet against the moving saddle, reins and stirrups; a sabre slipping from the hand, a wrong carriage, a late charge or a blade through the horse or the rider fails.
 * @evidence contracts/development/testing.md#independent-expectations The gait is the ride's own published change; the sabre's frame is the prop's own; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Slope against engage, a gallop against a canter cue.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on one archetype horse with one sabre.
 */
export function test_motion_blade_equestrian_sabre(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const sabre = createSword({ kind: "sabre" } as Parameters<
    typeof createSword
  >[0]);
  const course: mountedHorseScene.Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 12 },
      { kind: "straight", length: 40 },
      { kind: "straight", length: 10 },
    ],
    speeds: [4.5, 8, 8],
    cruise: 8,
    startSpeed: 4.5,
    acceleration: 1.5,
    deceleration: 1.5,
  });
  const gaits = course.instants
    .filter((e): boolean => e.label.startsWith("gait:"))
    .map((e) => ({ name: e.label, seconds: WAIT + e.seconds }));
  const galloping: number = gaits.find((g) =>
    g.name.endsWith("-gallop"),
  )!.seconds;
  const charge: number = galloping + 1;
  const stage = (
    at: number,
    rack: IAutoMovieVector3,
    target?: IAutoMovieMotionTarget,
  ): mountedHorseScene.IScene =>
    mountedHorseScene.build({
      horse,
      body,
      gait: "canter",
      wait: WAIT,
      course,
      cues: { gaits, charge: [{ name: "charge", seconds: at }] },
      laws: [AutoMovieMotionHumanBlade.HumanSabre],
      props: [
        HumanObject.prop("sabre", sabre, {
          // On a rack where the standing rider's right hand rests.
          position: Vector3.subtract(
            rack,
            sabre.affordance("grip").frame.translation,
          ),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      ],
      from: FROM,
      // Picked up on the ground before mounting, as an author would: the hold rides the hand through sitting on and riding.
      before: (chain) =>
        chain.pickUp({ prop: "sabre", handle: "grip", hand: "right" }),
      acts: (seated) => {
        const ridden = seated.registered("ride", {
          on: "horse",
          duration: WAIT - 1,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        });
        return ridden.registered("sabre", {
          on: "horse",
          prop: "sabre",
          carry: "slope",
          cue: "charge",
          gaits: "gaits",
          transition: TRANSITION,
          ...(target === undefined ? {} : { target }),
          duration: charge - WAIT + 1.5,
        });
      },
    });
  const rack: IAutoMovieVector3 = mountedHorseScene.rack(horse, body, FROM);
  const scene: mountedHorseScene.IScene = stage(charge, rack);
  assertTakeClean("a sabre at the slope and the charge", scene.film);
  const take: IAutoMovieMotionHumanSegment =
    scene.segments[scene.segments.length - 1]!;
  const event = (name: string): number =>
    take.start +
    take.plan.events.find((e) => e.name === name)!.share *
      (take.end - take.start);
  const world = (
    id: "grip" | "point" | "edge",
    at: number,
  ): IAutoMovieRigidTransform => {
    const prop: IAutoMovieRigidTransform = scene.film.prop("sabre", at);
    const local = sabre.affordance(id).frame;
    return {
      position: Vector3.add(
        prop.position,
        Quaternion.rotateVector(prop.rotation, local.translation),
      ),
      rotation: Quaternion.multiply(prop.rotation, local.rotation),
    };
  };
  const inSeat = (at: number, v: IAutoMovieVector3): IAutoMovieVector3 =>
    mountedHorseScene.turned(scene.part("seat", at), v);
  const angle = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, Vector3.dot(Vector3.normalize(a), Vector3.normalize(b))),
      ),
    ) *
      180) /
    Math.PI;

  // 1. The grip stays closed from the ride on.
  for (let at: number = WAIT - 1; at < take.end; at += 0.25) {
    const gap: number = Vector3.distance(
      world("grip", at).position,
      HumanHand.frame(body, scene.film.bones("rider", at), "right", "grip")
        .point,
    );
    if (gap > CONTACT) {
      findings.push(
        `grip: the sabre is ${(gap * 1000).toFixed(1)} mm from the hand at ${at.toFixed(2)} s`,
      );
      break;
    }
  }

  // 2. The two carriages.
  const charged: number = event("charge");
  const engaged: number = event("engaged");
  const pointAt = (at: number): IAutoMovieVector3 =>
    inSeat(
      at,
      Quaternion.rotateVector(world("point", at).rotation, {
        x: 0,
        y: 1,
        z: 0,
      }),
    );
  const edgeAt = (at: number): IAutoMovieVector3 =>
    inSeat(
      at,
      Quaternion.rotateVector(world("edge", at).rotation, { x: 0, y: 1, z: 0 }),
    );
  const sloped: number = charged - 0.5;
  const joint: IAutoMovieVector3 = scene.film
    .bones("rider", sloped)
    .get("rightUpperArm")!.worldPosition;
  const hilt: IAutoMovieVector3 = world("grip", sloped).position;
  const sloping: IAutoMovieVector3 = Vector3.subtract(
    world("point", sloped).position,
    hilt,
  );
  const nearest: IAutoMovieVector3 = Vector3.add(
    hilt,
    Vector3.scale(
      sloping,
      Math.max(
        0,
        Math.min(
          1,
          Vector3.dot(Vector3.subtract(joint, hilt), sloping) /
            Vector3.dot(sloping, sloping),
        ),
      ),
    ),
  );
  const rest: number = Vector3.distance(nearest, joint);
  if (rest > body.measure.hand / 2)
    findings.push(
      `slope: the blade passes ${rest.toFixed(3)} m from the right shoulder joint`,
    );
  if (
    Vector3.dot(
      Quaternion.rotateVector(world("edge", sloped).rotation, {
        x: 0,
        y: 1,
        z: 0,
      }),
      Vector3.subtract(nearest, joint),
    ) <= 0
  )
    findings.push("slope: the edge faces the shoulder, not the back");
  if (!(pointAt(sloped).y > 0))
    findings.push("slope: the point is not above the grip");
  const held: number = engaged + 0.5;
  if (angle(pointAt(held), { x: 0, y: 0, z: 1 }) > AIM)
    findings.push(
      `engage: the point is ${angle(pointAt(held), { x: 0, y: 0, z: 1 }).toFixed(1)} degrees off the travel`,
    );
  if (angle(edgeAt(held), { x: 0, y: 1, z: 0 }) > AIM)
    findings.push(
      `engage: the edge is ${angle(edgeAt(held), { x: 0, y: 1, z: 0 }).toFixed(1)} degrees off up`,
    );

  // 3. The charge's timing.
  if (!(charged > charge && engaged - charged <= 0.5 + 1e-9))
    findings.push(
      `charge: begins ${(charged - charge).toFixed(3)} s after the cue and takes ${(engaged - charged).toFixed(3)} s`,
    );

  // 4. The blade clears the rider's head and the horse's neck and head.
  for (let at: number = WAIT; at < take.end; at += 0.2) {
    const a: IAutoMovieVector3 = world("grip", at).position;
    const b: IAutoMovieVector3 = world("point", at).position;
    const head: IAutoMovieVector3 = scene.film
      .bones("rider", at)
      .get("head")!.worldPosition;
    for (let k: number = 0; k <= 8; ++k) {
      const p: IAutoMovieVector3 = Vector3.lerp(a, b, k / 8);
      if (Vector3.distance(p, head) < body.measure.headRadius)
        findings.push(
          `blade: it passes through the rider's head at ${at.toFixed(2)} s`,
        );
      const local: IAutoMovieVector3 = mountedHorseScene.local(
        scene.part("seat", at),
        p,
      );
      if (local.z > 0.2 && Math.abs(local.x) < 0.25 && local.y < 0.35)
        findings.push(
          `blade: it passes through the horse's neck at ${at.toFixed(2)} s`,
        );
    }
  }

  // 5. The bridle hand, the seat and the stirrups.
  for (const at of [sloped, held]) {
    const reins: IAutoMovieVector3 = Vector3.lerp(
      scene.part("leftRein", at).translation,
      scene.part("rightRein", at).translation,
      0.5,
    );
    if (
      Vector3.distance(mountedHorseScene.joint(scene, "leftHand", at), reins) >
      0.7 * body.measure.hand
    )
      findings.push(
        `reins: the left wrist leaves both reins at ${at.toFixed(2)} s`,
      );
    const seat: IAutoMovieVector3 = mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    );
    if (Math.abs(seat.y) > CONTACT)
      findings.push(
        `seat: ${seat.y.toFixed(3)} m off the saddle at ${at.toFixed(2)} s`,
      );
    for (const side of ["left", "right"] as const) {
      const ball: IAutoMovieVector3 = mountedHorseScene.local(
        scene.part(`${side}Stirrup`, at),
        HumanFoot.sockets(
          body,
          HumanSignature.bones(scene.reader, at),
          side,
        ).find(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.socket === "ball",
        )!.point,
      );
      if (Math.abs(ball.y) > CONTACT)
        findings.push(
          `stirrups: the ${side} ball leaves its tread at ${at.toFixed(2)} s`,
        );
    }
  }

  // 6. A charge cued at the canter.
  let error: unknown = null;
  try {
    const early: mountedHorseScene.IScene = stage(galloping - 1.5, rack);
    early.film.bones("rider", early.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "cue"))
    findings.push(
      `a charge at the canter must be refused on cue, got ${String(error)}`,
    );

  // 7. A target off the heading: the engage turns the trunk and points the blade at it, within the aim bound, in the level plane.
  const aside: IAutoMovieVector3 = Vector3.add(
    scene.part("seat", charge).translation,
    Quaternion.rotateVector(scene.part("seat", charge).rotation, {
      x: -6,
      y: 0,
      z: 20,
    }),
  );
  const turned: mountedHorseScene.IScene = stage(charge, rack, {
    kind: "point",
    frame: "world",
    at: aside,
  });
  const turnedTake: IAutoMovieMotionHumanSegment =
    turned.segments[turned.segments.length - 1]!;
  const turnedEngaged: number =
    turnedTake.start +
    turnedTake.plan.events.find((e) => e.name === "engaged")!.share *
      (turnedTake.end - turnedTake.start) +
    0.3;
  const blade: IAutoMovieRigidTransform = turned.film.prop(
    "sabre",
    turnedEngaged,
  );
  const toward: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(
      blade.rotation,
      sabre.affordance("point").frame.rotation,
    ),
    { x: 0, y: 1, z: 0 },
  );
  const gripAt: IAutoMovieVector3 = Vector3.add(
    blade.position,
    Quaternion.rotateVector(
      blade.rotation,
      sabre.affordance("grip").frame.translation,
    ),
  );
  const level = (v: IAutoMovieVector3): IAutoMovieVector3 => ({ ...v, y: 0 });
  const off: number = angle(
    level(toward),
    level(Vector3.subtract(aside, gripAt)),
  );
  if (off > AIM)
    findings.push(
      `target: the blade points ${off.toFixed(1)} degrees off the target`,
    );

  TestValidator.equals("a sabre at the slope and the charge", findings, []);
}
