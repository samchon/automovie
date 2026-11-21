import { createWoodenDummy } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanGrapple,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanCoupled,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanSignature,
  HumanSportThrow,
  HumanStageFight,
  HumanStrike,
  chiSau,
} from "@automovie/motions";

import { assertTakeClean } from "../internal/assertTakeClean";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** The two canonical bodies. */
type Name = "f-small" | "m-average";

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

/** The three sumo bouts. */
const BOUTS: readonly IBout[] = [
  { kind: "oshiDashi", grip: ["chestRight", "chestLeft"], finish: "out" },
  { kind: "yoriKiri", grip: ["hipRight", "hipLeft"], finish: "out" },
  { kind: "uwateNage", grip: ["hipRight", "hipLeft"], finish: "thrown" },
];

/** A held or landed contact lies within this, metres: the grapple specs' 1 cm. */
const GRIP: number = 0.01;

/** A strike lands within this of its prop target, metres: the blade strokes spec's bound. */
const TOUCH: number = 0.015;

/** A flat stamp has heel and ball within this of the floor, metres: the support checks' 5 mm. */
const FLAT: number = 0.005;

/** The ring's diameter, metres (the Japan Sumo Association's 4.55 m). */
const RING: number = 4.55;

/** The shikiri lines' separation, metres: 70 cm. */
const LINES: number = 0.7;

/** The shiko's authored foot lift, a share of stature, as the stance phrase states it. */
const SHIKO: number = 0.4;

/** Chain punches land at least this many per second: amateur boxers' 4 to 6 (as #4014's sources summarise). */
const RATE: readonly [number, number] = [4, 13.4];

/** The capoeira roda's non-contact distance, a share of stature. */
const RODA: number = 1;

/**
 * Capoeira, sumo and wing chun on two bodies.
 *
 * Scenarios:
 * 1. Capoeira: two gingas with alternating leads plant the back foot on
 *    the same corner behind the middle of the stance, a beat apart, the
 *    triangle's third corner; the meia-lua de frente and the armada sweep
 *    across the line above the hip and pass the partner across the roda
 *    without contact, the armada after a whole turn; the partner's esquiva
 *    takes the head below the passing foot; the aú bears the body on both
 *    palms.
 * 2. Sumo: the shiko foot rises above its authored height and stamps down
 *    flat; at each bout's tachiai the initiator's hands meet the receiver's
 *    chest or belt, and the bout ends with the receiver's foot outside the
 *    ring or the receiver thrown onto the clay.
 * 3. Wing chun: chain punches alternate hands along the centreline at a
 *    boxer's rate or faster; in chi sau the partners' wrists keep contact
 *    through every roll while the contacts roll; strikes on the wooden dummy
 *    land on its trunk, its arm and its leg.
 * 4. Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three styles' cases and what each reads.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the public rows and actions through HumanPerformance and reads the displayed feet, palms, wrists, fists and the dummy's affordances at the laws' events.
 * @evidence contracts/development/testing.md#independent-expectations The ring and the lines are the Japan Sumo Association's; contact bounds are the grapple specs' 1 cm and the blade strokes spec's 15 mm; the punch rate is boxers' typical range up to the recorded wing chun record.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair in each style on a small and an average body; the karate and tai chi phrases stay pinned by the striking support baseline.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances, with no host or capture.
 */
export function test_motion_exercise_capoeira_sumo_wing_chun(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const [label, run] of [
      ["ginga", ginga],
      ["capoeira kicks", capoeiraKicks],
      ["au", au],
      ["shiko", shiko],
      ["sumo", sumo],
      ["chain punches", chainPunches],
      ["chi sau", rollingHands],
      ["dummy", dummy],
    ] as const)
      try {
        run(name, body, complaints);
      } catch (error) {
        complaints.list.push(`${name} ${label}: ${String(error)}`);
      }
  }
  complaints.assert("Capoeira, sumo and wing chun");
}

/** A pair facing at a distance, the first acting. */
function pair(
  body: IAutoMovieMotionHumanBody,
  distance: number,
  composition: IAutoMovieMotionHumanChainCore,
  seed: string,
): HumanPerformance {
  return new HumanPerformance({
    seed,
    laws: [
      ...Object.values(HumanStrike),
      ...Object.values(HumanStageFight),
      ...Object.values(HumanSportThrow),
    ],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: distance },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: composition.node,
  });
}

/** The placed action by anchor. */
function placed(
  film: HumanPerformance,
  anchor: string,
): IAutoMovieScheduleEntry {
  const entry: IAutoMovieScheduleEntry | undefined = film.schedule.entries.find(
    (row: IAutoMovieScheduleEntry): boolean => row.intent.anchor === anchor,
  );
  if (entry === undefined) throw new Error(`${anchor} was not placed`);
  return entry;
}

/** A foot's named point on the displayed foot. */
function foot(
  body: IAutoMovieMotionHumanBody,
  reader: IAutoMovieMotionHumanSignature.IReader,
  side: AutoMovieHumanSide,
  name: "heel" | "ball" | "sole",
  seconds: number,
): IAutoMovieVector3 {
  const bone: IAutoMovieResolvedBone = HumanSignature.bones(
    reader,
    seconds,
  ).get(`${side}Foot`)!;
  return HumanFoot.point(body, side, name, {
    ankle: bone.worldPosition,
    rotation: bone.worldRotation,
  });
}

/** Two gingas, the left then the right foot back to the same corner, a beat apart. */
function ginga(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = pair(
    body,
    RODA * body.measure.stature,
    HumanChain.subject("a")
      .registered("martialArt", { kind: "capoeiraGinga", lead: "left" }, "left")
      .registered(
        "martialArt",
        { kind: "capoeiraGinga", lead: "right" },
        "right",
      ),
    "ginga",
  );
  assertTakeClean(`${name} ginga`, film);
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  const back = (
    anchor: "left" | "right",
  ): readonly [IAutoMovieVector3, number] => {
    const step: IAutoMovieScheduleEntry = placed(film, anchor);
    const middle: number = 0.5 * (step.start + step.end);
    return [HumanSignature.joint(a, middle, `${anchor}Foot`), middle];
  };
  const [left, first] = back("left");
  const [right, second] = back("right");
  const front: IAutoMovieVector3 = Vector3.lerp(
    HumanSignature.joint(a, 0, "leftFoot"),
    HumanSignature.joint(a, 0, "rightFoot"),
    0.5,
  );
  const width: number = Vector3.distance(
    HumanSignature.joint(a, 0, "leftFoot"),
    HumanSignature.joint(a, 0, "rightFoot"),
  );
  complaints.check(
    `${name} ginga: the two back corners lie ${Vector3.distance(left, right)} m apart, ${front.z - left.z} m behind the front feet and ${Math.abs(left.x - front.x)} m off the middle`,
    Vector3.distance(left, right) <= 0.1 * width &&
      front.z - left.z > 0.1 * body.measure.stature &&
      Math.abs(left.x - front.x) <= 0.1 * width,
  );
  const beat: number = placed(film, "left").end - placed(film, "left").start;
  complaints.check(
    `${name} ginga: the back corners come ${second - first} s apart on a ${beat} s beat`,
    Math.abs(second - first - beat) <= 1 / 24,
  );
}

/** The meia-lua de frente and the armada across the roda, the partner's esquiva under the armada. */
function capoeiraKicks(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const distance: number = RODA * body.measure.stature;
  for (const row of ["meiaLuaDeFrente", "armada"] as const) {
    const kick: IAutoMovieMotionHumanChainCore = HumanChain.subject(
      "a",
    ).registered(
      row,
      { at: { kind: "person", subject: "b", region: "jawLeft" } },
      "kick",
    );
    const film: HumanPerformance = pair(
      body,
      distance,
      row === "armada"
        ? kick.with(
            HumanChain.subject("b")
              .registered("esquiva", {}, "esquiva")
              .sync({ of: "kick", align: "stroke" }),
          )
        : kick,
      row,
    );
    const cell: string = `${name} ${row}`;
    assertTakeClean(cell, film);
    const strike: IAutoMovieScheduleEntry = placed(film, "kick");
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
    const moved = (side: AutoMovieHumanSide): number =>
      Vector3.distance(
        HumanSignature.joint(a, strike.start, `${side}Foot`),
        HumanSignature.joint(a, strike.contact ?? strike.end, `${side}Foot`),
      );
    const side: AutoMovieHumanSide =
      moved("left") > moved("right") ? "left" : "right";
    let clear: number = Number.POSITIVE_INFINITY;
    let lateral: number = 0;
    let high: number = 0;
    const from: IAutoMovieVector3 = foot(body, a, side, "ball", strike.start);
    for (let s: number = strike.start; s <= strike.end; s += 1 / 48) {
      const bones: ReturnType<typeof HumanSignature.bones> =
        HumanSignature.bones(b, s);
      for (const point of ["heel", "ball"] as const) {
        const at: IAutoMovieVector3 = foot(body, a, side, point, s);
        clear = Math.min(
          clear,
          HumanColliders.distance(body, bones, at).distance,
        );
        lateral = Math.max(lateral, Math.abs(at.x - from.x));
        high = Math.max(high, at.y);
      }
    }
    complaints.check(
      `${cell}: the foot sweeps ${lateral} m across, ${high} m high, ${clear} m clear of the partner`,
      lateral >= 0.2 * body.measure.stature &&
        high >= body.measure.hipHeight &&
        clear > 0,
    );
    if (row === "armada") {
      const contact: number = strike.contact ?? strike.end;
      const crown: number = HumanSignature.region(b, "crown", contact).y;
      const kickFoot: number = foot(body, a, side, "heel", contact).y;
      complaints.check(
        `${cell}: the esquiva takes the crown to ${crown} m under the foot at ${kickFoot} m`,
        crown < kickFoot,
      );
    }
  }
}

/** The aú bears the body on both palms. */
function au(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = pair(
    body,
    RODA * body.measure.stature,
    HumanChain.subject("a").registered("au", {}, "au"),
    "au",
  );
  assertTakeClean(`${name} au`, film);
  const turn: IAutoMovieScheduleEntry = placed(film, "au");
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  const middle: number = 0.5 * (turn.start + turn.end);
  const palms: readonly number[] = (["palmLeft", "palmRight"] as const).map(
    (palm: AutoMovieHumanoidRegion): number =>
      HumanSignature.region(a, palm, middle).y,
  );
  const feet: number = Math.min(
    foot(body, a, "left", "sole", middle).y,
    foot(body, a, "right", "sole", middle).y,
  );
  complaints.check(
    `${name} au: at the middle the palms stand ${palms.join(", ")} m and the feet ${feet} m above the floor`,
    palms.every((y: number): boolean => y <= GRIP) &&
      feet > 0.2 * body.measure.stature,
  );
}

/** The shiko lifts the foot above its authored height and stamps it flat. */
function shiko(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = pair(
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
  const stamp: IAutoMovieScheduleEntry = placed(film, "shiko");
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
    const y: number = foot(body, a, "left", "sole", s).y;
    top = Math.max(top, y);
    if (y > FLAT) lifted = true;
    else if (lifted) {
      landed = s;
      break;
    }
  }
  const heel: number = foot(body, a, "left", "heel", landed).y;
  const ball: number = foot(body, a, "left", "ball", landed).y;
  complaints.check(
    `${name} shiko: the foot rises ${top} m and lands with heel ${heel} m and ball ${ball} m`,
    top >= SHIKO * body.measure.stature &&
      Math.abs(heel) <= FLAT &&
      Math.abs(ball) <= FLAT,
  );
}

/** The three sumo bouts from the shikiri lines. */
function sumo(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const distance: number = LINES + 2 * 0.15 * body.measure.stature;
  for (const bout of BOUTS) {
    const cell: string = `${name} ${bout.kind}`;
    const film: HumanPerformance = pair(
      body,
      distance,
      HumanChain.mutual(
        HumanCoupled.grappling,
        {
          initiator: HumanChain.subject("a").stand({ seconds: 0.3, sway: 0 }),
          receiver: HumanChain.subject("b").stand({ seconds: 0.3, sway: 0 }),
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

/** Four chain punches alternating hands along the centreline. */
function chainPunches(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const at: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "solarPlexus",
  };
  const rows: readonly ("chainPunch" | "rearChainPunch")[] = [
    "chainPunch",
    "rearChainPunch",
    "chainPunch",
    "rearChainPunch",
  ];
  let chain: IAutoMovieMotionHumanChainCore = HumanChain.subject(
    "a",
  ).registered("martialArt", { kind: "wingChunStance" }, "stance");
  rows.forEach((row: "chainPunch" | "rearChainPunch", index: number): void => {
    chain = chain.registered(row, { at }, `punch.${index}`);
  });
  const film: HumanPerformance = pair(
    body,
    0.45 * body.measure.stature,
    chain,
    "chain",
  );
  assertTakeClean(`${name} chain punches`, film);
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  const impacts: number[] = rows.map(
    (_row: string, index: number): number =>
      placed(film, `punch.${index}`).contact!,
  );
  const hands: AutoMovieHumanSide[] = impacts.map(
    (s: number): AutoMovieHumanSide => {
      const target: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature.of(film, "b", body, 180),
        "solarPlexus",
        s,
      );
      return Vector3.distance(HumanSignature.joint(a, s, "leftHand"), target) <
        Vector3.distance(HumanSignature.joint(a, s, "rightHand"), target)
        ? "left"
        : "right";
    },
  );
  complaints.check(
    `${name} chain punches: the hands land ${hands.join(", ")}`,
    hands.every(
      (hand: AutoMovieHumanSide, i: number): boolean =>
        i === 0 || hand !== hands[i - 1],
    ),
  );
  const off: number = Math.max(
    ...impacts.map((s: number, i: number): number =>
      Math.abs(HumanSignature.joint(a, s, `${hands[i]!}Hand`).x),
    ),
  );
  complaints.check(
    `${name} chain punches: the fists land within ${off} m of the centreline`,
    off <= 0.05 * body.measure.stature,
  );
  const rate: number =
    (impacts.length - 1) / (impacts[impacts.length - 1]! - impacts[0]!);
  complaints.check(
    `${name} chain punches: ${rate} punches per second`,
    rate >= RATE[0] && rate <= RATE[1],
  );
}

/** Chi sau: the wrists keep contact through every roll. */
function rollingHands(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = pair(
    body,
    0.34 * body.measure.stature,
    HumanChain.subject("a")
      .registered("chiSau", { partner: "b", cycles: 4 }, "rollA")
      .with(
        HumanChain.subject("b").registered(
          "chiSau",
          { partner: "a", cycles: 4 },
          "rollB",
        ),
      ),
    "chiSau",
  );
  assertTakeClean(`${name} chi sau`, film);
  const roll: IAutoMovieScheduleEntry = placed(film, "rollA");
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
  const touching: number = 2 * chiSau.WRIST * body.measure.stature;
  let worst: number = 0;
  let low: number = Number.POSITIVE_INFINITY;
  let high: number = Number.NEGATIVE_INFINITY;
  for (
    let s: number = roll.start + chiSau.BLEND;
    s <= roll.end - chiSau.BLEND;
    s += 1 / 24
  )
    for (const [mine, theirs] of [
      ["leftHand", "rightHand"],
      ["rightHand", "leftHand"],
    ] as const) {
      const here: IAutoMovieVector3 = HumanSignature.joint(a, s, mine);
      const there: IAutoMovieVector3 = HumanSignature.joint(b, s, theirs);
      worst = Math.max(
        worst,
        Math.abs(Vector3.distance(here, there) - touching),
      );
      low = Math.min(low, here.y);
      high = Math.max(high, here.y);
    }
  complaints.check(
    `${name} chi sau: the wrists stay within ${worst} m of touching while the contacts roll ${high - low} m`,
    worst <= GRIP && high - low >= chiSau.RADIUS * body.measure.stature,
  );
}

/** The wooden dummy drill: a palm strike on the trunk, a slap on the arm and a kick on the leg. */
function dummy(
  name: Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const model: ReturnType<typeof createWoodenDummy> = createWoodenDummy({
    id: "dummy",
  });
  const distance: number = 0.45 * body.measure.stature;
  const at = (point: string): IAutoMovieMotionTarget => ({
    kind: "prop",
    subject: "dummy",
    point,
  });
  const film: HumanPerformance = new HumanPerformance({
    seed: "dummy",
    laws: [...Object.values(HumanStrike)],
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
      HumanObject.prop("dummy", model, {
        position: { x: 0, y: 0, z: distance },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      }),
    ],
    composition: HumanChain.subject("a")
      .registered("martialArt", { kind: "wingChunStance" }, "stance")
      .registered("palmHeel", { at: at("trunk") }, "trunk")
      .registered(
        "touch",
        { target: at("armRight"), kind: "tap", with: "palm" },
        "arm",
      )
      .registered("sideKick", { at: at("leg") }, "leg").node,
  });
  assertTakeClean(`${name} dummy`, film);
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  for (const [anchor, point] of [
    ["trunk", "trunk"],
    ["arm", "armRight"],
  ] as const) {
    const entry: IAutoMovieScheduleEntry = placed(film, anchor);
    const s: number = entry.contact ?? 0.5 * (entry.start + entry.end);
    const frame: IAutoMovieRigidTransform = film.prop("dummy", s);
    const target: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        model.affordance(point).frame.translation,
      ),
    );
    const gap: number = Math.min(
      ...(["palmLeft", "palmRight"] as const).map(
        (palm: AutoMovieHumanoidRegion): number =>
          Vector3.distance(HumanSignature.region(a, palm, s), target),
      ),
    );
    complaints.check(
      `${name} dummy ${anchor}: the palm lands ${gap} m from the ${point}`,
      gap <= TOUCH,
    );
  }
  const kick: IAutoMovieScheduleEntry = placed(film, "leg");
  const s: number = kick.contact!;
  const frame: IAutoMovieRigidTransform = film.prop("dummy", s);
  const leg: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      model.affordance("leg").frame.translation,
    ),
  );
  const heel: number = Math.min(
    Vector3.distance(foot(body, a, "left", "heel", s), leg),
    Vector3.distance(foot(body, a, "right", "heel", s), leg),
  );
  complaints.check(
    `${name} dummy leg: the heel lands ${heel} m from the leg`,
    heel <= TOUCH,
  );
}
