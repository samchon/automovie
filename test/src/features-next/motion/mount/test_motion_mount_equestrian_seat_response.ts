import {
  AutoMovieArchetypeEquineStance,
  type AutoMovieArchetypeEquineStanceCue,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../features/internal/archetypeHorseRide";
import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** The stirrups and reins the rider keeps. */
const HOLD: IAutoMovieMotionHumanMounted.ISupports = {
  leftFoot: "leftStirrup",
  rightFoot: "rightStirrup",
  leftHand: "leftRein",
  rightHand: "rightRein",
};

/**
 * A ridden rear and buck with the seat response: the horse halts, rears and
 * later bucks under a seated rider who keeps the seat, both stirrups and both
 * reins, the trunk leaning against the horse's pitch.
 *
 * Scenarios:
 * 1. The horse's own pitch, read from its saddle's forward axis, rises more than 15 degrees nose-up in the rear and falls nose-down in the buck.
 * 2. Against the saddle's up, the displayed trunk leans forward while the horse rears and back while it bucks, and in the world its inclination turns less from where it was before the event than in the same take ridden with no response: the trunk inclination opposes the horse's pitch.
 * 2b. A ridden levade and pesade (#3939): the horse's pitch exceeds 25 degrees in the levade and more in the pesade, the trunk leans forward against the saddle in both, and at the halt 0.6 s after the pesade it is back within 1 degree of its lean before the events.
 * 3. Through both events, a sideways step aside (a shy), three crow hops (each lifting the left hind) a 90-degree spin on the haunches (turning the saddle within 5 degrees of it), a levade, a pesade and the halt after them, the seat region stays within 10 mm of the saddle, both balls of the feet within 10 mm of their stirrups and both wrists within 0.7 hand lengths of their reins, moving less than 10 mm against them.
 * 3b. No hoof slides more than 5 mm while planted through the crow hops and the spin, read between each hoof's own landing and lift events; a pose sought again after a later one is the same; crow hops asked of the horse while it walks are refused.
 * 3c. Each event recovers to the stand continuously: across the end of every event the horse's root, each hoof and the rider's hips change velocity by less than 2 mm per frame squared at 60 frames a second, and every hoof stays within 5 mm of its place over the half second after.
 * 4. A take that lets the left foot go as the buck begins and takes the stirrup again after it: halfway through the loss the left ball is more than 50 mm from its tread, half a second after the regain it is back within 30 mm, and the left stirrup's window closes when the loss begins and opens again when the regain arrives.
 * 5. A response share outside 0 to 1 is refused on `respond`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, its five scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law with and without its seat response over an actual horse that rears and bucks in place and reads the displayed trunk, seat, feet and wrists against its moving saddle, stirrups and reins; a trunk carried rigidly, a response of the wrong sign or a lost contact fails.
 * @evidence contracts/development/testing.md#independent-expectations The horse's pitch is read from its own saddle frame; the response's direction is the issue's (forward in a rear, back in a buck); the bounds are the campaign's and the rider attachment spec's.
 * @evidence contracts/development/testing.md#distinguishing-cases Rear against buck, with against without the response, and an admitted against an out-of-range share.
 * @evidence contracts/development/testing.md#execution-ownership Two in-memory films of one polygon man over one archetype stance ride.
 */
export function test_motion_mount_equestrian_seat_response(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
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
  const phases = (
    from: number,
    entry: number,
    hold: number,
    exit: number,
  ): AutoMovieArchetypeEquineStanceCue.IPhases => ({ from, entry, hold, exit });
  const rear: number = halt.duration + 2;
  const buck: number = halt.duration + 7;
  const shy: number = halt.duration + 10;
  const hops: number = halt.duration + 13;
  const spun: number = halt.duration + 16;
  const levade: number = halt.duration + 21;
  const pesade: number = halt.duration + 26;
  const course: mountedHorseScene.Ride = AutoMovieArchetypeEquineStance.after(
    horse,
    halt,
    [
      { kind: "rear", pitch: 30, ...phases(rear, 1.2, 0.8, 1.2) },
      { kind: "buck", pitch: 15, ...phases(buck, 0.6, 0.3, 0.6) },
      {
        kind: "stepAside",
        side: "right",
        width: 0.25,
        ...phases(shy, 0.8, 0.4, 0.8),
      },
      { kind: "crowHops", count: 3, pitch: 8, ...phases(hops, 1.8, 0.2, 0.4) },
      { kind: "spin", degrees: 90, ...phases(spun, 3.2, 0.3, 0.6) },
      { kind: "air", air: "levade", ...phases(levade, 1.2, 1, 1.2) },
      { kind: "air", air: "pesade", ...phases(pesade, 1.2, 1, 1.2) },
    ],
  );
  const reared: number = WAIT + rear + 1.2 + 0.4;
  const bucked: number = WAIT + buck + 0.6 + 0.15;
  const shied: number = WAIT + shy + 0.8 + 0.2;
  const hopped: number = WAIT + hops + 0.9;
  const spinning: number = WAIT + spun + 1.6;
  const levaded: number = WAIT + levade + 1.2 + 0.5;
  const pesaded: number = WAIT + pesade + 1.2 + 0.5;
  const responding: mountedHorseScene.IScene = stage(horse, body, course, 1);
  const rigid: mountedHorseScene.IScene = stage(horse, body, course, 0);

  // 1. The horse's own pitch.
  const pitch = (scene: mountedHorseScene.IScene, at: number): number => {
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      scene.part("seat", at).rotation,
      { x: 0, y: 0, z: 1 },
    );
    return (Math.asin(Math.max(-1, Math.min(1, ahead.y))) * 180) / Math.PI;
  };
  if (!(pitch(responding, reared) > 15 && pitch(responding, bucked) < 0))
    findings.push(
      `the horse pitches ${pitch(responding, reared).toFixed(1)} degrees in the rear and ${pitch(responding, bucked).toFixed(1)} in the buck`,
    );

  // 2. The trunk leans against the pitch.
  const trunk = (
    scene: mountedHorseScene.IScene,
    at: number,
  ): IAutoMovieVector3 =>
    Vector3.normalize(
      Vector3.subtract(
        Vector3.lerp(
          mountedHorseScene.joint(scene, "leftUpperArm", at),
          mountedHorseScene.joint(scene, "rightUpperArm", at),
          0.5,
        ),
        Vector3.lerp(
          mountedHorseScene.joint(scene, "leftUpperLeg", at),
          mountedHorseScene.joint(scene, "rightUpperLeg", at),
          0.5,
        ),
      ),
    );
  const lean = (scene: mountedHorseScene.IScene, at: number): number => {
    const local: IAutoMovieVector3 = mountedHorseScene.turned(
      scene.part("seat", at),
      trunk(scene, at),
    );
    return (Math.atan2(local.z, local.y) * 180) / Math.PI;
  };
  // The trunk's forward inclination in the world, about the horse's own heading: what the response keeps.
  const drift = (scene: mountedHorseScene.IScene, at: number): number => {
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      scene.place(at).rotation,
      { x: 0, y: 0, z: 1 },
    );
    const level: IAutoMovieVector3 = Vector3.normalize({ ...ahead, y: 0 });
    const t: IAutoMovieVector3 = trunk(scene, at);
    return (Math.atan2(Vector3.dot(t, level), t.y) * 180) / Math.PI;
  };
  const settled: number = WAIT + rear - 0.5;
  for (const at of [reared, levaded, pesaded])
    if (!(lean(responding, at) > lean(responding, settled)))
      findings.push(
        `raised at ${at.toFixed(2)} s the trunk leans ${lean(responding, at).toFixed(1)} degrees against the saddle, ${lean(responding, settled).toFixed(1)} before it`,
      );
  // Back at the halt after the pesade the trunk settles where it sat before the events.
  const halted: number = WAIT + pesade + 3.4 + 0.6;
  if (Math.abs(lean(responding, halted) - lean(responding, settled)) > 1)
    findings.push(
      `at the halt after the pesade the trunk leans ${lean(responding, halted).toFixed(1)} degrees against the saddle, ${lean(responding, settled).toFixed(1)} before the events`,
    );
  if (
    !(
      pitch(responding, levaded) > 25 &&
      pitch(responding, pesaded) > pitch(responding, levaded)
    )
  )
    findings.push(
      `the levade pitches ${pitch(responding, levaded).toFixed(1)} degrees and the pesade ${pitch(responding, pesaded).toFixed(1)}`,
    );
  if (!(lean(responding, bucked) < lean(responding, settled)))
    findings.push(
      `in the buck the trunk leans ${lean(responding, bucked).toFixed(1)} degrees against the saddle, ${lean(responding, settled).toFixed(1)} before it`,
    );
  for (const at of [reared, bucked])
    if (
      !(
        Math.abs(drift(responding, at) - drift(responding, settled)) <
        Math.abs(drift(rigid, at) - drift(rigid, settled))
      )
    )
      findings.push(
        `at ${at.toFixed(2)} s the responding trunk turns ${(drift(responding, at) - drift(responding, settled)).toFixed(1)} degrees in the world, the rigid one ${(drift(rigid, at) - drift(rigid, settled)).toFixed(1)}`,
      );

  // 3. The seat, stirrups and reins hold through both events.
  const seat = (at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      responding.part("seat", at),
      HumanSignature.region(responding.reader, "seat", at),
    );
  const ball = (side: "left" | "right", at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      responding.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(responding.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point,
    );
  const wrist = (side: "left" | "right", at: number): IAutoMovieVector3 => {
    const rein: IAutoMovieTransform = responding.part(`${side}Rein`, at);
    return mountedHorseScene.local(
      rein,
      mountedHorseScene.joint(responding, `${side}Hand`, at),
    );
  };
  const before: number = settled;
  for (const at of [
    reared,
    bucked,
    shied,
    hopped,
    spinning,
    levaded,
    pesaded,
    halted,
  ]) {
    if (Vector3.distance(seat(at), seat(before)) > CONTACT)
      findings.push(`the seat slides on the saddle at ${at.toFixed(2)} s`);
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieVector3 = ball(side, at);
      if (
        Math.abs(foot.y) > CONTACT ||
        Vector3.distance(foot, ball(side, before)) > CONTACT
      )
        findings.push(
          `the ${side} ball leaves its stirrup at ${at.toFixed(2)} s`,
        );
      if (
        Vector3.length(wrist(side, at)) > 0.7 * body.measure.hand ||
        Vector3.distance(wrist(side, at), wrist(side, before)) > CONTACT
      )
        findings.push(
          `the ${side} wrist loses its rein at ${at.toFixed(2)} s (${Vector3.length(wrist(side, at)).toFixed(3)} m from it, ${Vector3.distance(wrist(side, at), wrist(side, before)).toFixed(3)} m moved)`,
        );
    }
  }

  // The horse's own crow hops and spin: each hop lifts both hind hooves, and the spin turns the saddle's heading by its degrees.
  const lifts: number = course.instants.filter(
    (e): boolean =>
      e.label === "leftHindOff" && e.seconds > hops && e.seconds < hops + 1.8,
  ).length;
  if (lifts !== 3)
    findings.push(`the crow hops lift the left hind ${lifts} times, wanted 3`);
  const heading = (at: number): number => {
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      responding.part("seat", at).rotation,
      { x: 0, y: 0, z: 1 },
    );
    return (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;
  };
  const turned: number =
    heading(WAIT + spun + 4.2) - heading(WAIT + spun - 0.2);
  if (Math.abs(turned - 90) > 5)
    findings.push(
      `the spin turns the saddle ${turned.toFixed(1)} degrees, wanted 90`,
    );

  // No hoof slides while it is planted through the crow hops and the spin: between its landing and its next lift, read from the horse's own support events.
  for (const [from, to] of [
    [hops, hops + 2.4],
    [spun, spun + 4.1],
  ] as const)
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const edges: { label: string; seconds: number }[] = course.instants
        .filter(
          (e): boolean =>
            (e.label === `${limb}Off` || e.label === `${limb}On`) &&
            e.seconds > from &&
            e.seconds < to,
        )
        .sort((a, b): number => a.seconds - b.seconds);
      const planted: [number, number][] = [];
      let down: number = from;
      for (const edge of edges)
        if (edge.label.endsWith("Off")) planted.push([down, edge.seconds]);
        else down = edge.seconds;
      if (edges.at(-1)?.label.endsWith("Off") !== true)
        planted.push([down, to]);
      for (const [a, b] of planted) {
        if (b - a < 0.05) continue;
        const rest: IAutoMovieVector3 = archetypeHorseRide.hoof(
          course,
          limb,
          a + 0.01,
        );
        for (let k: number = 1; k <= 8; ++k) {
          const at: number = a + 0.01 + ((b - a - 0.02) * k) / 8;
          const slid: number = Vector3.distance(
            archetypeHorseRide.hoof(course, limb, at),
            rest,
          );
          if (slid > 0.005) {
            findings.push(
              `the ${limb} hoof slides ${(slid * 1000).toFixed(1)} mm while planted at ${at.toFixed(2)} s`,
            );
            break;
          }
        }
      }
    }

  // Seeking is repeatable: a pose read again after a later one is the same.
  const first = responding.film.bones("rider", spinning).get("hips")!;
  responding.film.bones("rider", reared);
  const again = responding.film.bones("rider", spinning).get("hips")!;
  if (Vector3.distance(first.worldPosition, again.worldPosition) > 1e-9)
    findings.push("seeking back to the spin changes the rider's hips");

  // An event asked of the horse while it walks is refused.
  let walking: unknown = null;
  try {
    AutoMovieArchetypeEquineStance.after(
      horse,
      mountedHorseScene.course(horse, "walk"),
      [{ kind: "crowHops", count: 2, pitch: 8, ...phases(4, 1.2, 0.2, 0.4) }],
    );
  } catch (failure) {
    walking = failure;
  }
  if (!(walking instanceof AutoMovieArchetypeRefusal))
    findings.push(
      `crow hops at a walk must be refused, got ${String(walking)}`,
    );

  // 3c. Each event recovers to the stand continuously: across its end the horse's root and hooves and the rider's hips carry no jump in velocity, and in the half second after it every hoof stays planted.
  const ends: number[] = [
    rear + 3.2,
    buck + 1.5,
    shy + 2,
    hops + 2.4,
    spun + 4.1,
    levade + 3.4,
    pesade + 3.4,
  ];
  const step: number = 1 / 60;
  const kink = (read: (at: number) => IAutoMovieVector3, at: number): number =>
    Vector3.length(
      Vector3.add(
        Vector3.subtract(read(at + step), read(at)),
        Vector3.subtract(read(at - step), read(at)),
      ),
    );
  for (const end of ends) {
    const at: number = WAIT + end;
    const root: number = kink(
      (s: number): IAutoMovieVector3 => responding.place(s).position,
      at,
    );
    const hipsKink: number = kink(
      (s: number): IAutoMovieVector3 =>
        responding.film.bones("rider", s).get("hips")!.worldPosition,
      at,
    );
    if (root > 0.002 || hipsKink > 0.002)
      findings.push(
        `recovery at ${at.toFixed(2)} s: the horse's root bends ${(root * 1000).toFixed(1)} mm and the rider's hips ${(hipsKink * 1000).toFixed(1)} mm per frame squared`,
      );
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const hoof = (s: number): IAutoMovieVector3 =>
        archetypeHorseRide.hoof(course, limb, s - WAIT);
      if (kink(hoof, at) > 0.002)
        findings.push(`recovery at ${at.toFixed(2)} s: the ${limb} hoof jumps`);
      if (Vector3.distance(hoof(at + 0.5), hoof(at + 0.05)) > 0.005)
        findings.push(
          `recovery at ${at.toFixed(2)} s: the ${limb} hoof slides after the stand`,
        );
    }
  }

  // 4. The left stirrup is lost as the buck begins and taken again after it.
  const begun: number = rigid.segments[rigid.segments.length - 1]!.start;
  const lose: number = WAIT + buck - begun;
  const shaken: mountedHorseScene.IScene = stage(horse, body, course, 1, [
    { seat: "entered", transfer: 0.3, hold: lose - 0.3, supports: HOLD },
    {
      seat: "entered",
      transfer: 0.3,
      hold: 1.2,
      supports: {
        rightFoot: "rightStirrup",
        leftHand: "leftRein",
        rightHand: "rightRein",
      },
    },
    { seat: "entered", transfer: 0.6, hold: 1, supports: HOLD },
  ]);
  const shook: IAutoMovieMotionHumanSegment =
    shaken.segments[shaken.segments.length - 1]!;
  const span: number = shook.end - shook.start;
  const lost: number = shook.start + shook.plan.events[1]!.share * span;
  const regained: number = shook.start + shook.plan.events[2]!.share * span;
  const loose = (at: number): number =>
    Vector3.length(
      mountedHorseScene.local(
        shaken.part("leftStirrup", at),
        HumanFoot.sockets(
          body,
          HumanSignature.bones(shaken.reader, at),
          "left",
        ).find(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.socket === "ball",
        )!.point,
      ),
    );
  if (!(loose(lost + 0.6) > 0.05))
    findings.push(
      `the lost left foot stays ${loose(lost + 0.6).toFixed(3)} m from its stirrup`,
    );
  if (!(loose(regained + 0.5) < 0.03))
    findings.push(
      `the regained left foot is ${loose(regained + 0.5).toFixed(3)} m from its stirrup`,
    );
  const left: number[][] = shook.plan.contacts
    .filter((c): boolean => c.part === "leftFoot")
    .map((c): number[] => [
      shook.start + c.from * span,
      shook.start + c.to * span,
    ]);
  if (
    left.length !== 2 ||
    Math.abs(left[0]![1]! - (lost - 0.3)) > 1e-6 ||
    Math.abs(left[1]![0]! - regained) > 1e-6
  )
    findings.push(
      `left stirrup windows ${JSON.stringify(left)}, wanted a release at ${(lost - 0.3).toFixed(3)} and a return at ${regained.toFixed(3)}`,
    );

  // 5. An out-of-range share is refused.
  let error: unknown = null;
  try {
    const wrong: mountedHorseScene.IScene = stage(horse, body, course, 1.5);
    wrong.film.bones("rider", wrong.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "respond"))
    findings.push(
      `a response of 1.5 must be refused on respond, got ${String(error)}`,
    );

  assertTakeClean("the responding seat", responding.film);
  assertTakeClean("the rigid seat", rigid.film);
  assertTakeClean("the shaken seat", shaken.film);
  TestValidator.equals("the seat response to a rear and a buck", findings, []);
}

/** Sit, ride on with the stirrups and reins, then hold the seat with the given response through the horse's events. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  course: mountedHorseScene.Ride,
  respond: number,
  figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    {
      seat: "entered",
      transfer: 0.3,
      hold: course.duration + WAIT - 4,
      supports: HOLD,
    },
  ],
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "walk",
    wait: WAIT,
    course,
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
        .registered("mounted", {
          on: "horse",
          frame: "seat",
          respond,
          figures,
        }),
  });
}
