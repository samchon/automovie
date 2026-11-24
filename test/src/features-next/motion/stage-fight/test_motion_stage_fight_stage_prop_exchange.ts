import {
  createShield,
  createStageWeaponProp,
  createSword,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** One hand's grip: its side, the prop and the prop site's world point at a time. */
type IGrip = readonly [
  side: "left" | "right",
  prop: string,
  site: (t: number) => IAutoMovieVector3,
];

/** A hand's grip point lies on its prop site within this, metres: a palm's half width. */
const GRIP: number = 0.05;
/** A prop does not jump across a beat boundary by more than this, metres. */
const RIGID: number = 0.001;
/** A prop's displayed extremity keeps this clear of a partner's head, metres: a hand's breadth. */
const CLEAR: number = 0.1;
/** The partner's reaction delay after each stroke, seconds: authored. */
const DELAY: number = 0.1;
/** Two shown shield regions differ by at least this, metres: a fist's breadth. */
const APART: number = 0.08;

/**
 * Two-hand shaft and shield-and-sword stage beats with a partner's scripted
 * responses on one film clock.
 *
 * Scenarios:
 * 1. Shaft (#3864): picked up at its lower and upper grips, it plays a
 *    figure-eight with the right hand leading, then an overhead circle with
 *    the hands exchanged, the left leading; both hands' grip points stay on their
 *    grips through both beats, the shaft never jumps at
 *    a beat boundary, its tip clears the partner, and the partner flinches
 *    the authored delay after each stroke.
 * 2. Shield (#3865): a strapped shield on the left grip and a sword in the
 *    right hand; the boss beat and the rim beat show materially different
 *    regions at their strokes, both props keep their grips through the
 *    exchange and recovery, and the partner flinches after each stroke.
 * 3. A beat whose authored mark lies beyond the arm is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each beat sequence, the grip, continuity, clearance and cue checks, and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickup, stage beats and partner flinches through HumanPerformance and reads displayed hands, props, articulated marks and the placed schedule.
 * @evidence contracts/development/testing.md#independent-expectations The delay and the clearance are authored stage values; the grip bound is the piste's; the shown regions come from the archetype's own marks.
 * @evidence contracts/development/testing.md#distinguishing-cases Right against left lead, boss against rim, beat against recovery, a reachable against an unreachable mark.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_stage_fight_stage_prop_exchange(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    shaft(body, checks);
  } catch (error: unknown) {
    checks.check("shaft refused: " + String(error), false);
  }
  try {
    shield(body, checks);
  } catch (error: unknown) {
    checks.check(
      "shield refused: " +
        (error instanceof Error
          ? error.stack?.split("\n").slice(0, 12).join(" | ")
          : String(error)),
      false,
    );
  }
  checks.assert("stage prop exchanges");
}

/** The performer and the partner facing each other two metres apart. */
function perform(
  body: IAutoMovieMotionHumanBody,
  props: IAutoMovieMotionHumanProp[],
  carrier: IAutoMovieMotionHumanChain,
  anchors: readonly string[],
): HumanPerformance {
  let partner: IAutoMovieMotionHumanChain = HumanChain.subject("partner");
  for (const anchor of anchors)
    partner = partner
      .act("flinch", {}, `${anchor}.response`)
      .sync({ of: anchor, event: "stroke", offset: DELAY });
  return new HumanPerformance({
    seed: "stage-prop-exchange",
    performers: [
      {
        subject: "carrier",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "partner",
        body,
        at: { x: 0, y: 0, z: 2 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    laws: [AutoMovieMotionHumanStageFight.HumanStageProp],
    props,
    composition: carrier.with(partner).node,
  });
}

/** The placed entry of an anchor and its stroke. */
function cue(
  film: HumanPerformance,
  anchor: string,
): { entry: IAutoMovieScheduleEntry; stroke: number } {
  const entry: IAutoMovieScheduleEntry = film.schedule.entries.find(
    (row: IAutoMovieScheduleEntry): boolean => row.intent.anchor === anchor,
  )!;
  const stroke: number = entry.events!.find(
    (event: IAutoMovieScheduleCue): boolean => event.name === "stroke",
  )!.seconds;
  return { entry, stroke };
}

/** A prop's mark in the world at a time, read on its articulated model. */
function mark(
  film: HumanPerformance,
  model: {
    affordance(id: string): { frame: { translation: IAutoMovieVector3 } };
  },
  prop: string,
  id: string,
  t: number,
): IAutoMovieVector3 {
  const frame: IAutoMovieRigidTransform = film.prop(prop, t);
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      model.affordance(id).frame.translation,
    ),
  );
}

/** The shared checks of a beat sequence: grips, continuity, clearance and the partner's cues. */
function verify(
  film: HumanPerformance,
  label: string,
  body: IAutoMovieMotionHumanBody,
  grips: readonly IGrip[],
  anchors: readonly string[],
  extremity: (t: number) => IAutoMovieVector3,
  checks: motionComplaints.IGatherer,
): void {
  const first = cue(film, anchors[0]!);
  const last = cue(film, anchors[anchors.length - 1]!);
  const from: number = first.entry.start;
  // Through each beat, each hand's grip point stays on its prop site.
  for (const anchor of anchors) {
    const { entry } = cue(film, anchor);
    for (const [side, prop, site] of grips)
      for (let i: number = 0; i <= 8; ++i) {
        const t: number = entry.start + ((entry.end - entry.start) * i) / 8;
        const hand: IAutoMovieVector3 = HumanHand.frame(
          body,
          film.bones("carrier", t),
          side,
          "grip",
        ).point;
        const gap: number = Vector3.distance(hand, site(t));
        checks.check(
          `${label}: in ${anchor} the ${side} hand grips ${prop} at ${t.toFixed(2)} (${gap.toFixed(3)} m)`,
          gap <= GRIP,
        );
      }
  }
  for (const anchor of anchors) {
    const { entry, stroke } = cue(film, anchor);
    const response: IAutoMovieScheduleEntry = film.schedule.entries.find(
      (row: IAutoMovieScheduleEntry): boolean =>
        row.intent.anchor === `${anchor}.response`,
    )!;
    checks.check(
      `${label}: the partner answers ${anchor} after its stroke`,
      Math.abs(response.start - (stroke + DELAY)) <= 1e-6,
    );
    for (const [, prop] of grips) {
      const before: IAutoMovieRigidTransform = film.prop(
        prop,
        entry.end - 1e-4,
      );
      const after: IAutoMovieRigidTransform = film.prop(prop, entry.end + 1e-4);
      checks.check(
        `${label}: ${prop} does not jump at the end of ${anchor}`,
        Vector3.distance(before.position, after.position) <= RIGID,
      );
    }
  }
  assertTakeClean(label, film);
  for (let i: number = 0; i <= 24; ++i) {
    const t: number = from + ((last.entry.end - from) * i) / 24;
    const head: IAutoMovieVector3 = film
      .bones("partner", t)
      .get("head")!.worldPosition;
    checks.check(
      `${label}: the extremity clears the partner at ${t.toFixed(2)}`,
      Vector3.distance(extremity(t), head) > CLEAR,
    );
  }
}

/** The two-hand shaft with a hand exchange between its beats. */
function shaft(
  body: IAutoMovieMotionHumanBody,
  checks: motionComplaints.IGatherer,
): void {
  const model = createStageWeaponProp({ kind: "longBlade", height: 0.72 });
  const lower: number = model.affordance("grip-lower").frame.translation.y;
  const upper: number = model.affordance("grip-upper").frame.translation.y;
  const placed: IAutoMovieMotionHumanProp = HumanObject.prop("shaft", model, {
    at: { x: -(lower + upper) / 2, y: 1.11, z: 0.29 },
    yaw: 0,
  });
  const prop: IAutoMovieMotionHumanProp = {
    ...placed,
    frame: {
      ...placed.frame,
      rotation: { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
    },
  };
  const carrier: IAutoMovieMotionHumanChain = HumanChain.subject("carrier")
    .stand()
    .pickUp({ prop: "shaft", handle: "grip-lower", hand: "right", lift: 0 })
    .pickUp({ prop: "shaft", handle: "grip-upper", hand: "left", lift: 0 })
    .registered(
      AutoMovieMotionHumanStageFight.HumanStageProp.name,
      { beat: "figureEight", prop: "shaft", support: "grip-upper" },
      "eight",
    )
    .registered(
      AutoMovieMotionHumanStageFight.HumanStageProp.name,
      {
        beat: "overheadCircle",
        prop: "shaft",
        hand: "left",
        support: "grip-lower",
      },
      "circle",
    )
    .stand({ hold: 0.6, sway: 0 });
  const film: HumanPerformance = perform(body, [prop], carrier, [
    "eight",
    "circle",
  ]);
  verify(
    film,
    "shaft",
    body,
    [
      [
        "right",
        "shaft",
        (t: number) => mark(film, model, "shaft", "grip-lower", t),
      ],
      [
        "left",
        "shaft",
        (t: number) => mark(film, model, "shaft", "grip-upper", t),
      ],
    ],
    ["eight", "circle"],
    (t: number): IAutoMovieVector3 => mark(film, model, "shaft", "tip", t),
    checks,
  );
}

/** The shield on the left grip and a sword in the right hand, showing the boss then the rim. */
function shield(
  body: IAutoMovieMotionHumanBody,
  checks: motionComplaints.IGatherer,
): void {
  const guard = createShield({ id: "shield", kind: "strapped" });
  const blade = createSword({ kind: "armingSword", model: "knight" });
  const shieldProp: IAutoMovieMotionHumanProp = HumanObject.prop(
    "shield",
    guard,
    {
      at: { x: 0.25, y: 1.0, z: 0.35 },
      yaw: 0,
    },
  );
  const swordProp: IAutoMovieMotionHumanProp = HumanObject.prop(
    "sword",
    blade,
    {
      position: { x: -0.25, y: 1.0, z: 0.35 },
      rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
    },
  );
  const carrier: IAutoMovieMotionHumanChain = HumanChain.subject("carrier")
    .stand()
    .pickUp({ prop: "shield", handle: "grip", hand: "left", lift: 0 })
    .pickUp({ prop: "sword", handle: "grip", hand: "right", lift: 0 })
    .registered(
      AutoMovieMotionHumanStageFight.HumanStageProp.name,
      { beat: "boss", prop: "shield", hand: "left", mark: "boss" },
      "boss",
    )
    .registered(
      AutoMovieMotionHumanStageFight.HumanStageProp.name,
      { beat: "rim", prop: "shield", hand: "left", mark: "rim" },
      "rim",
    )
    .stand({ hold: 0.6, sway: 0 });
  const film: HumanPerformance = perform(
    body,
    [shieldProp, swordProp],
    carrier,
    ["boss", "rim"],
  );
  verify(
    film,
    "shield",
    body,
    [
      ["left", "shield", (t: number) => mark(film, guard, "shield", "grip", t)],
      ["right", "sword", (t: number) => mark(film, blade, "sword", "grip", t)],
    ],
    ["boss", "rim"],
    (t: number): IAutoMovieVector3 => mark(film, guard, "shield", "rim", t),
    checks,
  );
  const boss: IAutoMovieVector3 = mark(
    film,
    guard,
    "shield",
    "boss",
    cue(film, "boss").stroke,
  );
  const rim: IAutoMovieVector3 = mark(
    film,
    guard,
    "shield",
    "rim",
    cue(film, "rim").stroke,
  );
  checks.check(
    "shield: the boss and the rim beats show different regions",
    Vector3.distance(boss, rim) >= APART,
  );

  // A mark beyond the arm is refused.
  let refusal: unknown;
  try {
    perform(
      body,
      [shieldProp, swordProp],
      HumanChain.subject("carrier")
        .stand()
        .pickUp({ prop: "shield", handle: "grip", hand: "left", lift: 0 })
        .registered(
          AutoMovieMotionHumanStageFight.HumanStageProp.name,
          {
            beat: "boss",
            prop: "shield",
            hand: "left",
            mark: "boss",
            at: { x: 0, y: 2.6, z: 2.5 },
          },
          "far",
        ),
      [],
    );
  } catch (error: unknown) {
    refusal = error;
  }
  checks.check(
    "shield: a mark beyond the arm is refused",
    refusal instanceof HumanRefusal,
  );
}
