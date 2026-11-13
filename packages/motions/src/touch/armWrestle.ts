import { Vector3, minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionKey } from "../HumanActionKey";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { gesture } from "../everyday/gesture";
import { handGoals } from "../everyday/handGoals";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Arm wrestling, one role of it (#3350): the elbow planted on a table's top,
 * the hand clasped with the partner's above it, the struggle and the pin.
 *
 * Both roles read one geometry from the table's point and the two bodies, so
 * neither waits on the other. The clasp stands over the table's point at
 * 0.85 of the shorter forearm (provisional), the two wrists `GAP` apart
 * across the table; each elbow lies on the table's top where its own forearm
 * reaches its wrist from, toward its own side. The trunk leans from the hips
 * until the shoulder is an upper arm from the elbow, so the elbow, which is
 * no hand surface, is put where it must be by the arm's own lengths: the
 * hand's goal is the wrist and the elbow's hint is its place on the table.
 * A table too low or too far for the lean to close is refused.
 *
 * The forearms turn about the line through the two elbows: upright from
 * `set`, swaying `SWAY` degrees through the struggle from `go`, then down to
 * the pin's angle (`PIN` degrees when none is asked) toward the winner's
 * left by `pin`, the trunk bending and turning to that side with the arm
 * (`BEND`, `TWIST`) and the lean re-solved as it rolls, an angle past what
 * trunk and arm hold being refused with the angle they hold, and back up to leave from `relax`. The
 * author declares the winner (#3350's outcome-first rule).
 *
 * First pass: the elbow's bearing on the table is not declared as a contact
 * window, the fingers are left as they were and do not clasp, and the free
 * hand hangs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry both roles share, how the elbow is placed, the phases with their events and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law record whose two roles read the same table point and the same two bodies, the pivot of the contest being the elbows' line.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the parameters, three constants and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The elbow is placed by the arm's two lengths, not by a correction pass; no body or table is special-cased.
 */
export namespace armWrestle {
  /** The action's name. */
  export const name: HumanActionKey = "armWrestle";

  /** Cancel table: a contest is left once the hands part. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** How far apart the two clasped wrists stand across the table, metres (provisional: about a hand's breadth). */
  export const GAP: number = 0.08;

  /** How far the forearms sway through the struggle, degrees either way (provisional). */
  export const SWAY: number = 8;

  /** How far from upright the forearms end at the pin when none is asked, degrees (provisional: the back of the loser's hand a hand's breadth off the table). */
  export const PIN: number = 70;

  /** How far the trunk bends to the pin's side with the forearm a quarter turn from upright, degrees (provisional, inside the trunk's side bend). */
  export const BEND: number = 20;

  /** How far the chest turns toward the pin's side with the forearm a quarter turn from upright, degrees (provisional, inside the trunk's rotation). */
  export const TWIST: number = 30;

  /** How much further above or below the table's top than with the forearm upright the displayed elbow may lie for a pin's angle to count as held, metres (the campaign's contact bound). */
  export const HELD: number = 0.015;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The partner, the shared point on the table, the declared outcome and the struggle's length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The outcome is declared, never drawn, so both roles agree without a shared draw.
   */
  export interface IParams {
    /** The partner. */
    partner: string;

    /** The point on the table's top the clasp stands over, world metres; both roles give the same one. */
    table: IAutoMovieVector3;

    /** Whether this role wins. */
    wins: boolean;

    /** Seconds of struggle from `go` to the start of the pin; 3 when absent. */
    seconds?: number;

    /** How far from upright the forearms end at the pin, degrees; both roles give the same one. `PIN` when absent. An angle this role's arm cannot hold with its elbow on the table is refused with the largest it can. */
    pin?: number;
  }

  /**
   * Plan one role of an arm wrestle.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the struggle's length is negative, no lean from the hips puts the shoulder an upper arm from the elbow's place on the table, or the pin's angle lies outside 0 to 90 degrees or past what this arm holds with its elbow in place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals; the law's doc gives the geometry and the phases.
   * @evidence contracts/development/implementation.md#principled-implementation The clasp height and the two elbows follow from the two forearms; the lean is the root of the shoulder-to-elbow distance less the upper arm, bisected over the trunk's pitch; the forearm's turn is a rotation about the elbows' line, which keeps both forearms' lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared geometry, the lean, the clock, the posture.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lean that cannot close the distance throws; the sway is a fixed sine, not a draw, so the two roles stay together.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bisection of forty trunk resolves at plan time; constant work per frame before the posture resolve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the bow's trunk pitch, the trunk resolver, the hand goals and the arm carry.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the base plan, the geometry and the entry's arm angles.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const struggle: number = p.seconds ?? 3;
    HumanBound.least("seconds", struggle, 0, "s");
    const side: HumanHand.Side = "right";
    const entry: IHumanPosture = context.entry.posture;
    const partner = context.performer(p.partner).body;

    // The arm's two lengths are this body's own, between its rest joints: the
    // elbow falls on its place only on the circle those lengths allow.
    const span = (
      of: typeof body,
      from: "UpperArm" | "LowerArm",
      to: "LowerArm" | "Hand",
    ): number =>
      Vector3.length(
        Vector3.subtract(
          of.rest.get(`${side}${to}`)!,
          of.rest.get(`${side}${from}`)!,
        ),
      );
    const upperArm: number = span(body, "UpperArm", "LowerArm");
    const forearm: number = span(body, "LowerArm", "Hand");

    // The shared geometry: `own` is the level unit from the table's point
    // toward this performer, `left` the winner's left, where the hands go.
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const own: IAutoMovieVector3 = Vector3.normalize({
      x: entry.root.x - p.table.x,
      y: 0,
      z: entry.root.z - p.table.z,
    });
    const left: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, own),
      p.wins ? -1 : 1,
    );
    const height: number =
      0.85 * Math.min(forearm, span(partner, "LowerArm", "Hand"));
    const reach: number = Math.sqrt(forearm ** 2 - height ** 2);
    const elbow: IAutoMovieVector3 = Vector3.add(
      p.table,
      Vector3.scale(own, GAP / 2 + reach),
    );

    // The wrist with the forearm turned by an angle about the elbows' line.
    const wrist = (degrees: number): IAutoMovieVector3 => {
      const angle: number = (degrees * Math.PI) / 180;
      return Vector3.add(
        Vector3.add(elbow, Vector3.scale(own, -reach)),
        Vector3.add(
          Vector3.scale(up, height * Math.cos(angle)),
          Vector3.scale(left, height * Math.sin(angle)),
        ),
      );
    };

    // The lean that puts the shoulder an upper arm from the elbow.
    const leaned = (pitch: number, posture: IHumanPosture): IHumanPosture =>
      gesture.bow(body, posture, pitch, 0);

    // The palm faces back at this performer, the forearm neither turned in
    // nor out, as the clasp holds it: a palm asked across the table would
    // state the arm's plane against the elbow's place.
    const across: IAutoMovieVector3 = own;

    // A posture with the arm asked onto the wrist's place at a turn, the
    // elbow hinted onto the table.
    const armed = (posture: IHumanPosture, degrees: number): IHumanPosture => {
      const at: IAutoMovieVector3 = wrist(degrees);
      return handGoals(body, posture, [
        {
          side,
          surface: "wrist",
          shape: "fist",
          point: at,
          rotation: HumanHand.rotation(side, {
            fingers: Vector3.normalize(Vector3.subtract(at, elbow)),
            palm: Vector3.normalize(
              Vector3.cross(
                Vector3.cross(Vector3.subtract(at, elbow), across),
                Vector3.subtract(at, elbow),
              ),
            ),
          }),
          bend: elbow,
        },
      ]);
    };

    // The trunk rolls with the arm: it bends to the pin's side and turns its
    // chest toward it by the forearm's share of a quarter turn, half in the
    // spine and half in the chest. The spine's side bend is about its +Z,
    // negative to the performer's left, and its twist about +Y turns the
    // chest to the left (`HUMANOID_JOINT_AXES`); `toLeft` is 1 when the pin
    // goes to this performer's left and -1 when to the right.
    const toLeft: number = Vector3.dot(
      left,
      Vector3.cross(up, Vector3.scale(own, -1)),
    );
    const rolled = (posture: IHumanPosture, degrees: number): IHumanPosture => {
      const share: number = (toLeft * degrees) / 90;
      const joints: IHumanPosture["joints"] = { ...posture.joints };
      for (const bone of ["spine", "chest"] as const) {
        const was: readonly [number, number, number] = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          was[0],
          was[1] - (BEND / 2) * share,
          was[2] + (TWIST / 2) * share,
        ];
      }
      return { ...posture, joints };
    };

    // The lean at a turn: the shoulder an upper arm from the elbow with the
    // trunk rolled as that turn rolls it, kept per whole degree.
    const short = (pitch: number, degrees: number): number =>
      Vector3.length(
        Vector3.subtract(
          HumanTrunk.resolve(body, leaned(pitch, rolled(entry, degrees))).get(
            `${side}UpperArm`,
          )!.worldPosition,
          elbow,
        ),
      ) - upperArm;
    const leans: Map<number, number> = new Map();
    const lean = (whole: number): number => {
      const kept: number | undefined = leans.get(whole);
      if (kept !== undefined) return kept;
      let low: number = -20;
      let high: number = 70;
      if (!(short(low, whole) * short(high, whole) <= 0))
        throw new HumanRefusal({
          kind: "reach",
          axis: "table",
          value: `${(short(high, whole) * 1000).toFixed(0)} mm`,
          feasible: {
            kind: "alternatives",
            values: [
              "a table nearer the shoulder's height",
              "a seat at the table",
            ],
          },
          reason: `With the forearm ${whole} degrees from upright no lean from the hips puts the shoulder an upper arm from the elbow's place on the table: it stays ${(short(low, whole) * 1000).toFixed(0)} mm off leaning 20 degrees back and ${(short(high, whole) * 1000).toFixed(0)} mm off leaning 70 degrees forward`,
          fix: "sit the performer at the table, or give a table point nearer the shoulder",
        });
      for (let i: number = 0; i < 24; i++) {
        const mid: number = (low + high) / 2;
        if (short(low, whole) * short(mid, whole) <= 0) high = mid;
        else low = mid;
      }
      leans.set(whole, (low + high) / 2);
      return (low + high) / 2;
    };
    const pitched = (degrees: number): number => {
      const floor: number = Math.floor(degrees);
      return (
        lean(floor) + (lean(floor + 1) - lean(floor)) * (degrees - floor)
      );
    };

    // The body at a turn: rolled, leant, the arm on its goal.
    const set = (
      posture: IHumanPosture,
      degrees: number,
      share: number,
    ): IHumanPosture =>
      armed(
        leaned(pitched(degrees) * share, rolled(posture, degrees * share)),
        degrees,
      );
    pitched(0);
    // The pin stops at this arm's own range: past it the arm leaves the
    // elbow's place for its other solution, which only a force would do.
    const asked: number = p.pin ?? PIN;
    HumanBound.within("pin", asked, 0, 90);
    // The elbow is read by its height: it may bear anywhere on the top.
    const off = (degrees: number): number =>
      Math.abs(
        poseBones(
          body,
          resolveHumanPosture(body, set(entry, degrees, 1)),
        ).get(`${side}LowerArm`)!.worldPosition.y - elbow.y,
      );
    const upright: number = off(0);
    if (!(off(asked) <= upright + HELD)) {
      let most: number = 0;
      for (let degrees: number = 5; degrees < asked; degrees += 5)
        if (off(degrees) <= upright + HELD) most = degrees;
        else break;
      throw new HumanRefusal({
        kind: "reach",
        axis: "pin",
        value: asked,
        feasible: { kind: "range", minimum: 0, maximum: most, unit: "degrees" },
        reason: `With the forearm ${asked} degrees from upright the elbow leaves the table's top by ${(off(asked) * 1000).toFixed(0)} mm, against ${(upright * 1000).toFixed(0)} mm upright: the arm holds the place up to ${most} degrees`,
        fix: "ask a pin within that angle for both roles; an arm forced past its range is not this law's",
      });
    }

    // The clock: reach and set, go, the struggle, the pin, its hold, leave.
    const from: IAutoMovieVector3 = poseBones(body, context.entry.pose).get(
      `${side}Hand`,
    )!.worldPosition;
    // Both roles set together: the longer of the two hands' transports, the
    // partner's hand read where it is as this role starts.
    const theirs: IAutoMovieVector3 = Vector3.add(
      Vector3.add(p.table, Vector3.scale(own, -GAP / 2)),
      Vector3.scale(up, height),
    );
    const arrive: number = Math.max(
      AutoMovieMotionHumanTiming.transport(
        Vector3.length(Vector3.subtract(wrist(0), from)),
      ),
      AutoMovieMotionHumanTiming.transport(
        Vector3.length(
          Vector3.subtract(
            theirs,
            context
              .performer(p.partner)
              .bones(context.start)
              .get(`${side}Hand`)!.worldPosition,
          ),
        ),
      ),
    );
    const go: number = arrive + 0.3;
    const turn: number = go + struggle;
    const pin: number = turn + 0.4;
    const relax: number = pin + 0.5;
    const duration: number = relax + arrive;
    const base: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      duration,
    );
    const begin: AutoMovieMotionHumanArm.IAngles = AutoMovieMotionHumanArm.angles(
      context.entry.pose,
      side,
    );
    return {
      duration,
      events: [
        { name: "set", share: arrive / duration },
        { name: "go", share: go / duration },
        { name: "pin", share: pin / duration },
        { name: "relax", share: relax / duration },
      ],
      contacts: base.contacts,
      hands: [side],
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const envelope: number =
          t < arrive
            ? minimumJerk(t / arrive).s
            : t <= relax
              ? 1
              : 1 - minimumJerk((t - relax) / arrive).s;
        const degrees: number =
          t <= go
            ? 0
            : t <= turn
              ? SWAY * Math.sin((2 * Math.PI * (t - go)) / 1.5)
              : t <= pin
                ? SWAY * Math.sin((2 * Math.PI * struggle) / 1.5) +
                  (asked - SWAY * Math.sin((2 * Math.PI * struggle) / 1.5)) *
                    minimumJerk((t - turn) / (pin - turn)).s
                : asked;
        return AutoMovieMotionHumanArm.carry(
          body,
          set(base.posture(t), degrees, envelope),
          { right: begin },
          envelope,
        );
      },
    };
  }
}
