import {
  createHorse,
  createSphericalBall,
  rideHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanTrick,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanRide,
  HumanObject,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** How near a bound ankle lies to its strap's or seat's point plus the ankle's height, metres: the campaign's 10 mm contact bound with the sole's 20 mm. */
const FOOT: number = 0.03;

/**
 * Speed mounts, trick-riding figures and Roman riding (#3950).
 *
 * Scenarios:
 * 1. Running mount: a performer beside the riderless trick-saddled horse as it moves off boards the seat holding the horn with the near hand; at the take-off and at the landing the hips move with the seat's own velocity within 0.1 m/s, and the right wrist is within 0.7 hand lengths of the horn at the take-off.
 * 2. Trick figures on the moving horse, each held: the hippodrome stand with both ankles at the hippodrome strap, a left side drag with the left ankle at its strap, a back drag with both ankles at their straps, and a right pickup with the left wrist on the horn and the right wrist within 0.7 hand lengths of a ball on the ground; the ankles within 30 mm of their contacts plus the ankle's height.
 * 3. Roman riding: over the stand each ankle lies within 30 mm of its own horse's seat plus the ankle's height while both horses go.
 * 4. A pickup of a ball four metres out is refused on its figure's `object`, and a Roman stand across horses three metres apart is refused on `right`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each figure, its bounds and their sources.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the board, trick and roman laws over actual moving horses with a trick saddle and reads the displayed hips, ankles and wrists against the horses' own seat, straps, horn and a ball; a velocity jump, a foot off its strap or a hand off its hold fails.
 * @evidence contracts/development/testing.md#independent-expectations Every target is the horse's or the ball's own displayed point; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Each figure against the others; one horse against two; reachable against unreachable.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on archetype horses.
 */
export function test_motion_mount_equestrian_trick(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0, tack: "trick" },
    8,
  );
  const easy: mountedHorseScene.Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 60 }],
    cruise: 3,
    startSpeed: 0,
    endSpeed: 0,
    acceleration: 0.3,
    deceleration: 0.5,
    startFromStanding: true,
  });
  const at3 = (
    scene: mountedHorseScene.IScene,
    name: string,
    at: number,
  ): IAutoMovieVector3 =>
    scene.film.bones("rider", at).get(name as never)!.worldPosition;
  const ankle = (
    scene: mountedHorseScene.IScene,
    contact: string,
    at: number,
  ): IAutoMovieVector3 =>
    Vector3.add(scene.part(contact, at).translation, {
      x: 0,
      y: body.measure.ankleHeight,
      z: 0,
    });

  // 1. The running mount: the performer runs beside the riderless horse as it moves off and boards its seat.
  const boarding: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "walk",
    wait: WAIT,
    course: easy,
    laws: [AutoMovieMotionHumanRide.board],
    from: { x: 0.6, y: 0, z: 0.1 },
    seated: false,
    acts: (chain) =>
      chain.stand({ hold: WAIT + 0.8 }).registered("board", {
        on: "horse",
        seat: "seat",
        hand: { side: "right", contact: "horn" },
      }),
  });
  assertTakeClean("a running mount", boarding.film);
  const board: IAutoMovieMotionHumanSegment =
    boarding.film.segments("rider")[1]!;
  const h: number = 1 / 240;
  for (const [label, at] of [
    ["take-off", board.start + h],
    [
      "landing",
      board.start +
        board.plan.events.find((e) => e.name === "land")!.share *
          (board.end - board.start),
    ],
  ] as const) {
    const hips = (t: number): IAutoMovieVector3 =>
      boarding.film.bones("rider", t).get("hips")!.worldPosition;
    const seat = (t: number): IAutoMovieVector3 =>
      boarding.part("seat", t).translation;
    const relative: number = Vector3.length(
      Vector3.subtract(
        Vector3.scale(
          Vector3.subtract(hips(at + h), hips(at - h)),
          1 / (2 * h),
        ),
        Vector3.scale(
          Vector3.subtract(seat(at + h), seat(at - h)),
          1 / (2 * h),
        ),
      ),
    );
    if (relative > 0.1)
      findings.push(
        `running mount: the hips move ${relative.toFixed(3)} m/s against the seat at the ${label}`,
      );
  }
  const horn: number = Vector3.distance(
    boarding.film.bones("rider", board.start + 0.02).get("rightHand")!
      .worldPosition,
    boarding.part("horn", board.start + 0.02).translation,
  );
  if (horn > 0.7 * body.measure.hand)
    findings.push(
      `running mount: the right wrist is ${horn.toFixed(3)} m from the horn`,
    );

  // 2. The trick figures on the moving horse.
  const ball: ReturnType<typeof createSphericalBall> = createSphericalBall({
    kind: "tennis",
  });
  const figures: IAutoMovieMotionHumanTrick.IFigure[] = [
    { kind: "hippodrome", transfer: 0.8, hold: 1 },
    { kind: "seat", transfer: 0.6, hold: 0.5 },
    { kind: "sideDrag", side: "left", transfer: 0.8, hold: 1 },
    { kind: "seat", transfer: 0.8, hold: 0.5 },
    { kind: "backDrag", transfer: 0.8, hold: 1 },
    { kind: "seat", transfer: 0.8, hold: 0.5 },
    {
      kind: "pickup",
      side: "right",
      object: "ball",
      transfer: 0.8,
      hold: 0.6,
    },
    { kind: "seat", transfer: 0.8, hold: 0.5 },
  ];
  const tricks = (out: number): mountedHorseScene.IScene => {
    const dry: number =
      WAIT +
      0.6 +
      figures.slice(0, 6).reduce((s, f) => s + f.transfer + f.hold, 0) +
      0.8;
    const local: number = Math.max(0, dry - WAIT);
    const seat: IAutoMovieTransform = easy.frame("seat", local);
    const right: IAutoMovieVector3 = Vector3.scale({ x: -1, y: 0, z: 0 }, out);
    const spot: IAutoMovieVector3 = {
      ...Vector3.add(seat.translation, right),
      y: 0,
    };
    return mountedHorseScene.build({
      horse,
      body,
      gait: "walk",
      wait: WAIT,
      course: easy,
      laws: [AutoMovieMotionHumanAcrobatics.trick],
      props: [
        HumanObject.prop("ball", ball, {
          position: spot,
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      ],
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) =>
        seated
          .registered("ride", {
            on: "horse",
            duration: 0.6,
            seat: "seat",
            feet: { left: "leftStirrup", right: "rightStirrup" },
          })
          .registered("trick", { on: "horse", frame: "seat", figures }),
    });
  };
  const show: mountedHorseScene.IScene = tricks(0.9);
  assertTakeClean("trick-riding figures", show.film);
  const trick: IAutoMovieMotionHumanSegment =
    show.segments[show.segments.length - 1]!;
  const held = (index: number): number =>
    trick.start +
    trick.plan.events[index]!.share * (trick.end - trick.start) +
    0.3;
  const near = (
    label: string,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    bound: number,
  ): void => {
    if (Vector3.distance(a, b) > bound)
      findings.push(`${label}: ${Vector3.distance(a, b).toFixed(3)} m off`);
  };
  near(
    "hippodrome left ankle",
    at3(show, "leftFoot", held(0)),
    ankle(show, "hippodrome", held(0)),
    FOOT,
  );
  near(
    "hippodrome right ankle",
    at3(show, "rightFoot", held(0)),
    ankle(show, "hippodrome", held(0)),
    FOOT,
  );
  near(
    "side drag left ankle",
    at3(show, "leftFoot", held(2)),
    ankle(show, "leftStrap", held(2)),
    FOOT,
  );
  near(
    "back drag left ankle",
    at3(show, "leftFoot", held(4)),
    ankle(show, "leftStrap", held(4)),
    FOOT,
  );
  near(
    "back drag right ankle",
    at3(show, "rightFoot", held(4)),
    ankle(show, "rightStrap", held(4)),
    FOOT,
  );
  near(
    "pickup left wrist on the horn",
    at3(show, "leftHand", held(6)),
    show.part("horn", held(6)).translation,
    0.7 * body.measure.hand,
  );
  near(
    "pickup right wrist at the ball",
    at3(show, "rightHand", held(6)),
    show.film.prop("ball", held(6)).position,
    0.7 * body.measure.hand,
  );

  // 4a. A pickup out of reach.
  let far: unknown = null;
  try {
    const out: mountedHorseScene.IScene = tricks(4);
    out.film.bones("rider", out.film.duration - 0.1);
  } catch (failure) {
    far = failure;
  }
  if (!(far instanceof HumanRefusal && far.axis === "figures.6.object"))
    findings.push(`an unreachable pickup must be refused, got ${String(far)}`);

  // 3. Roman riding across two horses side by side.
  const roman = (
    apart: number,
  ): {
    scene: mountedHorseScene.IScene;
    seat: (at: number) => IAutoMovieVector3;
  } => {
    const pair: mountedHorseScene.Horse = createHorse(
      { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
      8,
    );
    const beside: mountedHorseScene.Ride = rideHorse(pair, {
      start: { x: -apart, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 60 }],
      cruise: 3,
      startSpeed: 0,
      endSpeed: 0,
      acceleration: 0.3,
      deceleration: 0.5,
      startFromStanding: true,
    });
    const local = (at: number): number =>
      Math.max(0, Math.min(beside.duration, at - WAIT));
    const place = (at: number): IAutoMovieRigidTransform => {
      const frame: IAutoMovieTransform = beside.at(local(at)).placement;
      return { position: frame.translation, rotation: frame.rotation };
    };
    const scene: mountedHorseScene.IScene = mountedHorseScene.build({
      horse: createHorse(
        { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
        8,
      ),
      body,
      gait: "walk",
      wait: WAIT,
      course: rideHorse(
        createHorse({ withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 }, 8),
        {
          start: { x: 0, z: 0, heading: 0 },
          legs: [{ kind: "straight", length: 60 }],
          cruise: 3,
          startSpeed: 0,
          endSpeed: 0,
          acceleration: 0.3,
          deceleration: 0.5,
          startFromStanding: true,
        },
      ),
      laws: [AutoMovieMotionHumanAcrobatics.roman],
      props: [
        HumanObject.prop(
          "pair",
          pair,
          place(0),
          place,
          (id: string, at: number) =>
            beside.frame(id as Parameters<typeof beside.frame>[0], local(at)),
        ),
      ],
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) =>
        seated.registered("roman", {
          left: "horse",
          right: "pair",
          frame: "seat",
          hold: WAIT + 3,
        }),
    });
    return {
      scene,
      seat: (at: number): IAutoMovieVector3 =>
        beside.frame("seat", local(at)).translation,
    };
  };
  const romanRide = roman(0.7);
  const stand: mountedHorseScene.IScene = romanRide.scene;
  assertTakeClean("Roman riding", stand.film);
  for (let k: number = 1; k <= 6; ++k) {
    const at: number = WAIT + (3 * k) / 6;
    near(
      `roman left ankle at ${at.toFixed(2)} s`,
      at3(stand, "leftFoot", at),
      ankle(stand, "seat", at),
      FOOT,
    );
    near(
      `roman right ankle at ${at.toFixed(2)} s`,
      at3(stand, "rightFoot", at),
      Vector3.add(romanRide.seat(at), {
        x: 0,
        y: body.measure.ankleHeight,
        z: 0,
      }),
      FOOT,
    );
  }

  // 4b. Horses too far apart for a Roman stand.
  let wide: unknown = null;
  try {
    const apart: mountedHorseScene.IScene = roman(3).scene;
    apart.film.bones("rider", apart.film.duration - 0.1);
  } catch (failure) {
    wide = failure;
  }
  if (!(wide instanceof HumanRefusal && wide.axis === "right"))
    findings.push(
      `a Roman stand three metres wide must be refused on right, got ${String(wide)}`,
    );

  TestValidator.equals(
    "speed mounts, trick figures and Roman riding",
    findings,
    [],
  );
}
