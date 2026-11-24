import {
  AutoMovieArchetypeEquineStance,
  createHorse,
  rideHorse,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanRide,
  AutoMovieMotionHumanTouch,
  HumanObject,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/**
 * Two people on or around one ridden horse (#3951): a swing-up onto the pillion of a double saddle and the passenger's waist hold, a limp body carried across the saddle, ponying a second horse by its lead, and a leg-up.
 *
 * Scenarios:
 * 1. Swing-up at a walk: the passenger takes the rider's waist standing, then the right hand grips the rider's left thigh from the take-off, and the left hand takes the rider's left thigh before the right lets go as the passenger comes behind the rider, until the landing, and the pillion seat window opens at the landing, so the support passes from the ground through the rider (by either hand) to the horse with no gap; after the landing the passenger's seat region lies within 10 mm of the pillion's surface.
 * 2. Pillion hold: both of the passenger's wrists stay within 0.7 hand lengths of the rider's hip joints, and the passenger's chest stays behind the rider's along the saddle by more than the rider's chest depth.
 * 3. Limp carry: the body's hips rest within a chest depth above the saddle and its head hangs below the seat on the authored side.
 * 4. Ponying: the rider's right wrist stays within 0.7 hand lengths of the led horse's lead while both horses go, the led horse on its own slower clock.
 * 5. Leg-up: the helper's hands stay within 0.7 hand lengths of the rider's left lower leg while the rider gets on.
 * 6. A swing-up at a trot, closing too fast against the pillion, is refused on `speed`.
 * 7. Rodeo pickup: off a bucking horse the rider boards the standing pickup horse's pillion holding the pickup man's waist, sits within 10 mm of the pillion, then steps clear onto the feet, the hips at their standing height within 30 mm.
 * 8. A boarding that brings the carrier past its declared load is refused on `load`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each exchange, its bounds and their sources.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the board, clasp and drape laws with two polygon men around actual horses and reads hands, seats, chests and heads against the moving pillion, saddle, lead and each other; a gap in support, a hand off its hold, a body through the other or a wrong side fails.
 * @evidence contracts/development/testing.md#independent-expectations Holds and seats are the horses' and partners' own displayed points; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases A walk against a trot pickup; a held partner against a held prop; standing against carried.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of polygon men on archetype horses.
 */
export function test_motion_mount_equestrian_double(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0, tack: "double" },
    8,
  );
  const easy: mountedHorseScene.Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    cruise: 1.4,
    startSpeed: 0,
    endSpeed: 0,
    acceleration: 0.3,
    deceleration: 0.5,
    startFromStanding: true,
  });
  const wrist = (
    scene: mountedHorseScene.IScene,
    who: string,
    side: "left" | "right",
    at: number,
  ): IAutoMovieVector3 =>
    scene.film.bones(who, at).get(`${side}Hand`)!.worldPosition;
  const bone = (
    scene: mountedHorseScene.IScene,
    who: string,
    name: string,
    at: number,
  ): IAutoMovieVector3 =>
    scene.film.bones(who, at).get(name as never)!.worldPosition;
  const take = (
    scene: mountedHorseScene.IScene,
    who: string,
    index: number,
  ): IAutoMovieMotionHumanSegment => scene.film.segments(who)[index]!;

  // 1 and 2. The swing-up onto the pillion, then the waist hold.
  const pickup = (course: mountedHorseScene.Ride): mountedHorseScene.IScene =>
    mountedHorseScene.build({
      horse,
      body,
      gait: "walk",
      wait: WAIT,
      course,
      laws: [
        AutoMovieMotionHumanRide.board,
        AutoMovieMotionHumanTouch.HumanClasp,
      ],
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) =>
        seated.registered("ride", {
          on: "horse",
          duration: WAIT + 6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        }),
      partners: [
        {
          subject: "passenger",
          body,
          from: { x: 0.45, y: 0, z: -0.45 },
          acts: (chain) =>
            chain
              .stand({ hold: WAIT - 0.4 })
              // The rider's waist taken standing, before the swing-up.
              .registered("clasp", {
                duration: 1,
                right: { subject: "rider", bone: "leftUpperLeg" },
              })
              .registered("board", {
                on: "horse",
                seat: "pillion",
                hand: { side: "right", partner: "rider", bone: "leftUpperLeg" },
              })
              .registered("clasp", {
                on: "horse",
                frame: "pillion",
                duration: 3,
                left: { subject: "rider", bone: "leftUpperLeg" },
                right: { subject: "rider", bone: "rightUpperLeg" },
              }),
        },
      ],
    });
  const swung: mountedHorseScene.IScene = pickup(easy);
  assertTakeClean("a swing-up onto the pillion", swung.film);
  const board: IAutoMovieMotionHumanSegment = take(swung, "passenger", 2);
  const span: number = board.end - board.start;
  // Some hand holds the rider from the take-off until the seat bears the
  // passenger. A passenger swung up behind a rider keeps hold by taking the
  // rider's waist with the other hand before the first lets go of the thigh
  // it took off by (the first hand would otherwise pass behind the rider's
  // back), so the support passes through either hand with no gap.
  const grips: IAutoMovieMotionHumanContactWindow[] = board.plan.contacts
    .filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        (c.part === "leftHand" || c.part === "rightHand") &&
        c.kind === "grip" &&
        c.support.kind === "person" &&
        c.support.subject === "rider",
    )
    .sort(
      (
        a: IAutoMovieMotionHumanContactWindow,
        b: IAutoMovieMotionHumanContactWindow,
      ): number => a.from - b.from,
    );
  const sat: IAutoMovieMotionHumanContactWindow | undefined =
    board.plan.contacts.find((c) => c.part === "seat");
  let held: number = grips.length === 0 || grips[0]!.from > 1e-9 ? -1 : 0;
  for (const g of grips)
    if (held >= 0 && g.from <= held + 1e-9) held = Math.max(held, g.to);
  if (sat === undefined || held < sat.from - 1e-9)
    findings.push(
      `swing-up: the holds ${JSON.stringify(grips)} and the seat ${JSON.stringify(sat)} leave a gap in support`,
    );
  const landed: number = board.start + (sat?.from ?? 1) * span;
  const passenger = HumanSignature.of(swung.film, "passenger", body, 0);
  for (const at of [landed + 0.3, landed + 1.5]) {
    const local: IAutoMovieVector3 = mountedHorseScene.local(
      swung.part("pillion", at),
      HumanSignature.region(passenger, "seat", at),
    );
    if (Math.abs(local.y) > CONTACT)
      findings.push(
        `pillion: the seat region is ${local.y.toFixed(3)} m off the pillion at ${at.toFixed(2)} s`,
      );
  }
  const clasp: IAutoMovieMotionHumanSegment = take(swung, "passenger", 3);
  for (let k: number = 1; k <= 4; ++k) {
    const at: number =
      clasp.start + 0.4 + ((clasp.end - clasp.start - 0.5) * k) / 4;
    for (const [side, hip] of [
      ["left", "leftUpperLeg"],
      ["right", "rightUpperLeg"],
    ] as const)
      if (
        Vector3.distance(
          wrist(swung, "passenger", side, at),
          bone(swung, "rider", hip, at),
        ) >
        0.7 * body.measure.hand
      )
        findings.push(
          `pillion: the passenger's ${side} wrist leaves the rider's waist at ${at.toFixed(2)} s`,
        );
    const behind: number =
      mountedHorseScene.local(
        swung.part("seat", at),
        bone(swung, "rider", "chest", at),
      ).z -
      mountedHorseScene.local(
        swung.part("seat", at),
        bone(swung, "passenger", "chest", at),
      ).z;
    if (!(behind > body.measure.chestDepth))
      findings.push(
        `pillion: the passenger's chest is ${behind.toFixed(3)} m behind the rider's at ${at.toFixed(2)} s`,
      );
  }

  // 6. A pickup at a trot closes too fast.
  let error: unknown = null;
  try {
    const fast: mountedHorseScene.IScene = pickup(
      mountedHorseScene.course(horse, "trot"),
    );
    fast.film.bones("passenger", fast.film.duration - 0.1);
  } catch (failure) {
    error = failure;
  }
  if (!(error instanceof HumanRefusal && error.axis === "speed"))
    findings.push(
      `a pickup at a trot must be refused on speed, got ${String(error)}`,
    );

  // 3. A limp body across the saddle.
  const saddled: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const limp: mountedHorseScene.IScene = mountedHorseScene.build({
    horse: saddled,
    body,
    gait: "walk",
    wait: WAIT,
    laws: [AutoMovieMotionHumanTouch.HumanDrape],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated.registered("drape", {
        on: "horse",
        frame: "seat",
        head: "left",
        duration: WAIT + 2,
      }),
  });
  for (const at of [WAIT - 1, WAIT + 1.5]) {
    const hips: IAutoMovieVector3 = mountedHorseScene.local(
      limp.part("seat", at),
      bone(limp, "rider", "hips", at),
    );
    const head: IAutoMovieVector3 = mountedHorseScene.local(
      limp.part("seat", at),
      bone(limp, "rider", "head", at),
    );
    if (!(hips.y > 0 && hips.y < body.measure.chestDepth))
      findings.push(
        `limp: the hips are ${hips.y.toFixed(3)} m over the saddle at ${at.toFixed(2)} s`,
      );
    if (!(head.y < 0 && head.x > 0))
      findings.push(
        `limp: the head does not hang down the left side at ${at.toFixed(2)} s`,
      );
  }

  // 4. Ponying a second horse by its lead.
  const pony: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.5, tempo: 0 },
    3,
  );
  const led: mountedHorseScene.Ride = rideHorse(pony, {
    start: { x: -1.6, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 30 }],
    cruise: 1.3,
    startSpeed: 1.3,
    endSpeed: 1.3,
    acceleration: 1,
    deceleration: 1,
  });
  const ponyAt = (at: number): number =>
    Math.max(0, Math.min(led.duration, at - WAIT));
  const ponyFrame = (at: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = led.at(ponyAt(at)).placement;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const ponying: mountedHorseScene.IScene = mountedHorseScene.build({
    horse: saddled,
    body,
    gait: "walk",
    wait: WAIT,
    laws: [AutoMovieMotionHumanTouch.HumanClasp],
    props: [
      HumanObject.prop(
        "pony",
        pony,
        ponyFrame(0),
        ponyFrame,
        (id: string, at: number) =>
          led.frame(id as Parameters<typeof led.frame>[0], ponyAt(at)),
      ),
    ],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: 0.6,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein" },
        })
        .registered("clasp", {
          on: "horse",
          frame: "seat",
          duration: WAIT + 4,
          right: { subject: "pony", contact: "lead" },
        }),
  });
  for (let k: number = 1; k <= 6; ++k) {
    const at: number = WAIT + (4 * k) / 6;
    const lead: IAutoMovieVector3 = led.frame("lead", ponyAt(at)).translation;
    if (
      Vector3.distance(wrist(ponying, "rider", "right", at), lead) >
      0.7 * body.measure.hand
    )
      findings.push(
        `ponying: the right wrist leaves the led horse's lead at ${at.toFixed(2)} s`,
      );
  }

  // 5. A leg-up: the helper's hands under the rider's left lower leg as the rider gets on.
  const legUp: mountedHorseScene.IScene = mountedHorseScene.build({
    horse: saddled,
    body,
    gait: "walk",
    wait: WAIT,
    laws: [AutoMovieMotionHumanTouch.HumanClasp],
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) => seated,
    partners: [
      {
        subject: "groom",
        body,
        from: { x: 0.9, y: 0, z: -0.45 },
        acts: (chain) =>
          chain.registered("clasp", {
            duration: 0.6,
            left: { subject: "rider", bone: "leftLowerLeg" },
            right: { subject: "rider", bone: "leftLowerLeg" },
          }),
      },
    ],
  });
  for (const at of [0.35, 0.45, 0.55])
    for (const side of ["left", "right"] as const)
      if (
        Vector3.distance(
          wrist(legUp, "groom", side, at),
          bone(legUp, "rider", "leftLowerLeg", at),
        ) >
        0.7 * body.measure.hand
      )
        findings.push(
          `leg-up: the groom's ${side} wrist leaves the rider's lower leg at ${at.toFixed(2)} s`,
        );

  // 7. The rodeo pickup: the bronc rider boards the pickup horse's pillion holding the pickup man's waist, then steps down to the ground.
  const halt: mountedHorseScene.Ride = rideHorse(
    saddled,
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
  const bronc: mountedHorseScene.Ride = AutoMovieArchetypeEquineStance.after(
    saddled,
    halt,
    [
      {
        kind: "buck",
        pitch: 15,
        from: halt.duration + 1,
        entry: 0.6,
        hold: 0.3,
        exit: 0.6,
      },
    ],
  );
  const pickupHorse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0, tack: "double" },
    8,
  );
  const pickupAt: IAutoMovieRigidTransform = {
    position: { x: -1.1, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const pickupPart = (id: string): IAutoMovieTransform => {
    const local: IAutoMovieTransform = pickupHorse.affordance(
      id as never,
    ).frame;
    return {
      ...local,
      translation: Vector3.add(local.translation, pickupAt.position),
    };
  };
  const rodeo = (load?: {
    capacity: number;
    carried: number;
  }): mountedHorseScene.IScene =>
    mountedHorseScene.build({
      horse: saddled,
      body,
      gait: "walk",
      wait: WAIT,
      course: bronc,
      laws: [AutoMovieMotionHumanRide.board, AutoMovieMotionHumanMount.unseat],
      props: [
        HumanObject.prop(
          "pickup",
          pickupHorse,
          pickupAt,
          () => pickupAt,
          (id: string) => pickupPart(id),
        ),
      ],
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) =>
        seated
          .registered("ride", {
            on: "horse",
            duration: WAIT + halt.duration + 2.5,
            seat: "seat",
            feet: { left: "leftStirrup", right: "rightStirrup" },
            hands: { left: "leftRein", right: "rightRein" },
          })
          .registered("board", {
            on: "pickup",
            seat: "pillion",
            hand: { side: "right", partner: "picker", bone: "rightUpperLeg" },
            ...(load === undefined ? {} : { load }),
          })
          .registered("unseat", {
            on: "pickup",
            frame: "pillion",
            fall: "clear",
            side: "right",
            release: 1,
          }),
      partners: [
        {
          subject: "picker",
          body,
          from: { x: -0.5, y: 0, z: -0.2 },
          acts: (chain) =>
            chain
              .sit({
                seat: HumanObject.seat(pickupHorse, pickupAt, "seat"),
                hold: 0.5,
              })
              .registered("ride", {
                on: "pickup",
                duration: WAIT + halt.duration + 6,
                seat: "seat",
                feet: { left: "leftStirrup", right: "rightStirrup" },
                hands: { left: "leftRein", right: "rightRein" },
              }),
        },
      ],
    });
  const rodeoTake: mountedHorseScene.IScene = rodeo();
  const moved: IAutoMovieMotionHumanSegment[] = rodeoTake.film.segments(
    "rider",
  ) as IAutoMovieMotionHumanSegment[];
  const crossed: IAutoMovieMotionHumanSegment = moved[moved.length - 2]!;
  const onPillion: number =
    crossed.start +
    crossed.plan.events.find((e) => e.name === "land")!.share *
      (crossed.end - crossed.start) +
    0.1;
  const pillion: IAutoMovieVector3 = Vector3.subtract(
    HumanSignature.region(rodeoTake.reader, "seat", onPillion),
    pickupPart("pillion").translation,
  );
  if (Math.abs(pillion.y) > CONTACT)
    findings.push(
      `rodeo: the bronc rider sits ${pillion.y.toFixed(3)} m off the pickup horse's pillion`,
    );
  const down: number = bone(
    rodeoTake,
    "rider",
    "hips",
    rodeoTake.film.duration - 0.05,
  ).y;
  if (Math.abs(down - body.measure.hipHeight) > 0.03)
    findings.push(
      `rodeo: the bronc rider ends with the hips at ${down.toFixed(3)} m, not standing`,
    );

  // 8. A carrier asked to carry beyond its declared load refuses the boarding.
  let heavy: unknown = null;
  try {
    const over: mountedHorseScene.IScene = rodeo({
      capacity: 100,
      carried: 80,
    });
    over.film.bones("rider", over.film.duration - 0.1);
  } catch (failure) {
    heavy = failure;
  }
  if (!(heavy instanceof HumanRefusal && heavy.axis === "load"))
    findings.push(
      `an overloaded boarding must be refused on load, got ${String(heavy)}`,
    );

  TestValidator.equals("two people around one ridden horse", findings, []);
}
