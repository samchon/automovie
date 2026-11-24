import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanAuditModel, HumanColliders } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { embraceFromBehind } = AutoMovieMotionHumanTouch;

/** How near two regions in contact stay, metres: the law's skin contact. */
const NEAR: number = 0.01;

/**
 * How near a palm lies to the abdomen, metres: a skin contact and the palm's
 * own thickness (provisional).
 */
const PALM: number = 0.03;

/**
 * How far toward the partner's left the embracer stands, metres: none, centred
 * behind the partner with the shoulders square, so both arms pass around the
 * partner's flanks to the clasp on the midline (staged 0.08 m aside, the right
 * shoulder stood inside the partner's chest's breadth and the right arm's way
 * to the clasp ran through the partner's chest). The head leans and turns to
 * the shoulder the chin rests on.
 */
const ASIDE: number = 0;

/** How long the embrace is held, seconds. */
const HOLD: number = 2;

/**
 * The gap left between the chest and the back standing upright for the average
 * man, metres, scaled with the embracer's stature (provisional staging: a short
 * step back, so the lean that closes it carries the head forward over the
 * shoulder).
 */
const GAP: number = 0.2;

/**
 * Embracing a partner from behind (#4012).
 *
 * Scenarios, the average man embracing another average man and the small woman
 * embracing another small woman, each take clean:
 *
 * 1. Through the hold, the chest lies on the partner's back and the head on the
 *    partner's left shoulder, each read as the audit reads two bodies, collider
 *    on collider: the least signed distance from the audit's probes of the
 *    embracer's torso to the partner's torso colliders (the spine's, the
 *    chest's and the upper chest's), and the chin's signed distance to the
 *    colliders of the shoulder region's bone; and each palm on the partner's
 *    abdomen within a hand's length of its middle: the palms lie either side of
 *    the midline, their fingertips meeting at it.
 * 2. The chest, the chin and the palms bear on the partner in windows, the chest's
 *    loaded.
 * 3. The small woman cannot rest her chin on the tall man's shoulder from behind:
 *    the refusal states the miss.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed regions of both bodies through the hold and the plan's windows; a chest off the back, a chin off the shoulder, a palm off the abdomen, a missing or unloaded window, or an admitted unreachable shoulder fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound; the palm bound adds the palm's thickness. The chest is read collider on collider and the chin as the contact's end effector on the shoulder's colliders, against the colliders the partner audit reads two bodies by ("a declared contact is a statement that the skins meet", `AutoMovieMotionHumanAuditPartner`), the contact violation of Mordatch, Todorov and Popović 2012: the region points cannot stand for the contacts, since with the sternum on the back's colliders and the chin on the shoulder's region the embracer's chest collider lay 66 mm (average man) and 48 mm (small woman) inside the partner's spine collider, and with the chest collider on the back the neck lay 22 and 11 mm inside the partner's chest.
 * @evidence contracts/development/testing.md#distinguishing-cases Two pairs of equal heights, and a large height difference refused.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_touch_embrace_from_behind(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    try {
      const label: string = `${name} embraces ${name} from behind`;
      const a: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const b: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const film: HumanPerformance = scene(a, b);
      verdict(checks, label, film);
      const act: IAutoMovieMotionHumanSegment = film
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.name === "embraceFromBehind",
        )!;
      const from: number = mark(act, "ready");
      const to: number = mark(act, "relax");
      for (const t of [from, (from + to) / 2, to]) {
        const partnerBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones("b", t);
        const embracer: HumanAuditModel.IFrame = HumanAuditModel.frame(
          a,
          film.bones("a", t),
        );
        const chest: number = Math.abs(
          contact(embracer, TORSO, b, only(partnerBones, TORSO)),
        );
        const chin: number = Math.abs(
          HumanColliders.distance(
            b,
            only(
              partnerBones,
              new Set<AutoMovieHumanoidBone>([
                b.surfaces.regions.shoulderLeft.bone,
              ]),
            ),
            region(film, "a", a, "chin", t),
          ).distance,
        );
        const palms: readonly number[] = (
          ["palmLeft", "palmRight"] as const
        ).map((palm: AutoMovieHumanoidRegion): number =>
          Vector3.distance(
            region(film, "a", a, palm, t),
            region(film, "b", b, "abdomen", t),
          ),
        );
        checks.check(
          `${label}: at ${t.toFixed(2)} s the chest (${(chest * 1000).toFixed(0)} mm) and the chin (${(chin * 1000).toFixed(0)} mm) rest on the partner`,
          chest <= NEAR && chin <= NEAR,
        );
        checks.check(
          `${label}: at ${t.toFixed(2)} s the palms lie on the abdomen (${palms.map((p: number): string => (p * 1000).toFixed(0)).join(", ")} mm)`,
          palms.every((p: number): boolean => p <= PALM + a.measure.hand),
        );
      }
      const windows: readonly IAutoMovieMotionHumanContactWindow[] =
        act.plan.contacts.filter(
          (w: IAutoMovieMotionHumanContactWindow): boolean =>
            w.support.kind === "person" && w.support.subject === "b",
        );
      checks.check(
        `${label}: chest, chin and palms bear on the partner, the chest loaded`,
        windows.length === 4 &&
          windows.some(
            (w: IAutoMovieMotionHumanContactWindow): boolean =>
              w.part === "chest" && w.load !== undefined && w.load > 0,
          ),
      );
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.check(
    "the small woman cannot rest her chin on the tall man's shoulder",
    (() => {
      try {
        scene(motionHumanBody("f-small"), motionHumanBody("m-tall")).bones(
          "a",
          1,
        );
        return false;
      } catch (error: unknown) {
        return (
          error instanceof HumanRefusal &&
          error.axis === "partner" &&
          /mm from the partner's shoulder/.test(error.message)
        );
      }
    })(),
  );
  checks.assert("touch embrace from behind");
}

/** `b` stands ahead facing away; `a` steps in behind and embraces. */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
): HumanPerformance {
  return new HumanPerformance({
    seed: "embrace-from-behind",
    laws: [embraceFromBehind],
    performers: [
      {
        // Behind the partner's left shoulder, where the chin goes.
        subject: "a",
        body: a,
        at: { x: ASIDE, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: {
          x: 0,
          y: 0,
          // The step back scaled with the embracer's stature from the
          // average man's, so every body closes it by the same lean.
          z:
            (a.measure.chestDepth + b.measure.chestDepth) / 2 +
            (GAP * a.measure.stature) /
              motionHumanBody("m-average").measure.stature,
        },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    // The partner is placed first, so the embrace reads where the partner stands.
    composition: HumanChain.subject("b")
      .stand({ hold: HOLD + 4 })
      .with(
        HumanChain.subject("a").registered(embraceFromBehind.name, {
          partner: "b",
          hold: HOLD,
        }),
      ).node,
  });
}

/** The partner's torso bones, whose colliders are the back the chest lies on. */
const TORSO: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["spine", "chest", "upperChest"]);

/** A body's displayed bones among a set. */
function only(
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  among: ReadonlySet<AutoMovieHumanoidBone>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(
    [...bones].filter(
      ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
        among.has(bone),
    ),
  );
}

/**
 * A contact's violation as the audit reads two bodies: the least signed
 * distance from the audit's probes of the embracer's parts to the partner's
 * colliders, metres.
 */
function contact(
  embracer: HumanAuditModel.IFrame,
  parts: ReadonlySet<AutoMovieHumanoidBone>,
  partner: IAutoMovieMotionHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): number {
  let least: number = Infinity;
  embracer.model.parts.forEach(
    (
      part: HumanAuditModel.IFrame["model"]["parts"][number],
      i: number,
    ): void => {
      if (!parts.has(part.bone)) return;
      for (const probe of embracer.probes[i]!)
        least = Math.min(
          least,
          HumanColliders.distance(partner, bones, probe).distance,
        );
    },
  );
  return least;
}

/** A body region's displayed point. */
function region(
  film: HumanPerformance,
  subject: string,
  body: IAutoMovieMotionHumanBody,
  name: AutoMovieHumanoidRegion,
  t: number,
): IAutoMovieVector3 {
  return resolveAutoMovieHumanoidSurfaces.place(
    body.surfaces.regions[name],
    film.bones(subject, t).get(body.surfaces.regions[name].bone)!,
  ).point;
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share
  );
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
