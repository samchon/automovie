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
 * `PIN` degrees toward the winner's left by `pin`, where the loser's hand is
 * a hand's breadth off the table, and back up to leave from `relax`. The
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

  /** How far from upright the forearms end at the pin, degrees (provisional: the back of the loser's hand a hand's breadth off the table). */
  export const PIN: number = 70;

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
  }

  /**
   * Plan one role of an arm wrestle.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the struggle's length is negative, or no lean from the hips puts the shoulder an upper arm from the elbow's place on the table.
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
    const m = body.measure;
    const struggle: number = p.seconds ?? 3;
    HumanBound.least("seconds", struggle, 0, "s");
    const side: HumanHand.Side = "right";
    const entry: IHumanPosture = context.entry.posture;
    const partner = context.performer(p.partner).body;

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
    const height: number = 0.85 * Math.min(m.forearm, partner.measure.forearm);
    const reach: number = Math.sqrt(m.forearm ** 2 - height ** 2);
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
    const short = (pitch: number): number =>
      Vector3.length(
        Vector3.subtract(
          HumanTrunk.resolve(body, leaned(pitch, entry)).get(
            `${side}UpperArm`,
          )!.worldPosition,
          elbow,
        ),
      ) - m.upperArm;
    let low: number = -20;
    let high: number = 70;
    if (!(short(low) * short(high) <= 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "table",
        value: `${(short(high) * 1000).toFixed(0)} mm`,
        feasible: {
          kind: "alternatives",
          values: ["a table nearer the shoulder's height", "a seat at the table"],
        },
        reason: `No lean from the hips puts the shoulder an upper arm from the elbow's place on the table: it stays ${(short(low) * 1000).toFixed(0)} mm off leaning 20 degrees back and ${(short(high) * 1000).toFixed(0)} mm off leaning 70 degrees forward`,
        fix: "sit the performer at the table, or give a table point nearer the shoulder",
      });
    for (let i: number = 0; i < 40; i++) {
      const mid: number = (low + high) / 2;
      if (short(low) * short(mid) <= 0) high = mid;
      else low = mid;
    }
    const pitch: number = (low + high) / 2;

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
    // The palm faces this performer's own left, where the partner's palm is.
    const across: IAutoMovieVector3 = Vector3.cross(
      up,
      Vector3.scale(own, -1),
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
                  (PIN - SWAY * Math.sin((2 * Math.PI * struggle) / 1.5)) *
                    minimumJerk((t - turn) / (pin - turn)).s
                : PIN;
        const at: IAutoMovieVector3 = wrist(degrees);
        const posture: IHumanPosture = leaned(
          pitch * envelope,
          base.posture(t),
        );
        return AutoMovieMotionHumanArm.carry(
          body,
          handGoals(body, posture, [
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
          ]),
          { right: begin },
          envelope,
        );
      },
    };
  }
}
