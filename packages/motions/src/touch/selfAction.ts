import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanSelfAction,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "../compose/AutoMovieMotionHumanTargetGrid";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The alternatives of `PlanLiftBone`'s site. */
type PlanLiftBone = "leftShoulder" | "rightShoulder";

/** The alternatives of `PLACESEntryItem`'s site. */
type PLACESEntryItem = "stretch" | "victory" | "fistPump";

/**
 * A whole-body self action while standing: the yawn-and-stretch with both arms
 * overhead, both arms raised in victory, a fist pump, a neck roll and a
 * shoulder roll. The body-directed touches of the same family (pats, rubs,
 * scratches, covers, pain holds) are rows of the `touch` law.
 *
 * Each action is a phrase: the parts rise to their place over the free-space
 * transport of the hand's travel (`AutoMovieMotionHumanTiming.transport`), and
 * at least as long as each raised arm's path needs to keep within the audit's
 * travel bound (`AutoMovieMotionHumanArmPlanned.reaching`), or 0.4 s for the
 * head and the shoulders, perform the stroke, hold and return in the rise's
 * time. Each arm's raise, hold and lowering are planned as one trajectory over
 * the clock's instants (`AutoMovieMotionHumanArm.carried`), from the entry's
 * angles to a named place of the air (`AutoMovieMotionHumanTargetGrid.place`):
 * overhead above the shoulders for the stretch, palms up; overhead and outside
 * them for victory, the hands fists, as winners raise their arms above the
 * shoulders and away from the body with fists clenched (Hwang and Matsumoto
 * 2014, Motivation and Emotion: medal winners at the 2004 and 2008 Olympic and
 * 2004 Paralympic judo events, blind athletes among them); at eye height a
 * forearm ahead of the shoulder for the fist pump, the forearm rising to it
 * from an elbow near the body; its fist drops a fifth of the arm and rises
 * again `count` times. A neck roll circles the head through a light share of
 * the neck's flexion and lateral range, a shoulder roll circles both shoulder
 * girdles through a light share of theirs. The stretch lasts 6 s in all, the
 * yawn's duration of Provine 1986 (unverified); every other time and size is
 * provisional.
 *
 * Events: the phrase instants.
 */
export namespace selfAction {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "selfAction";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    });

  /** The yawn-and-stretch's whole duration, seconds (Provine 1986, unverified). */
  export const YAWN: number = 6;

  /** Each arm action's place for the right hand (the left mirrors). */
  const PLACES: Readonly<
    Record<PLACESEntryItem, IAutoMovieMotionHumanTargetGrid.IGrid>
  > = {
    stretch: { height: "overhead", lateral: "shoulder", distance: "close" },
    victory: { height: "overhead", lateral: "outside", distance: "close" },
    fistPump: { height: "eye", lateral: "outside", distance: "mid" },
  };

  /** May be performed over a carrier: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /**
   * An arm a kind raises: its side, its place, the hand's shape and whether its
   * fist pumps.
   */
  interface IRaised {
    /** The arm. */
    side: AutoMovieHumanSide;

    /** The place of the air the hand goes to. */
    grid: IAutoMovieMotionHumanTargetGrid.IGrid;

    /** The hand's shape: flat palms or a fist. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** Whether the fist drops and rises over the stroke. */
    pump: boolean;
  }

  /**
   * Where the pumping arm's elbow hangs, which the fist's forearm rises from:
   * the knuckles face away from it. With the fist a forearm ahead of the
   * shoulder, the whole drop stays within the elbow's flexion range.
   */
  const ELBOW: IAutoMovieMotionHumanTargetGrid.IGrid = {
    height: "shoulder",
    lateral: "outside",
    distance: "near",
  };

  /**
   * Plan a self action.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSelfAction.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanSelfAction.IParams = context.params;
    const body = context.body;
    const kind: IAutoMovieMotionHumanSelfAction.Kind = p.kind;
    const count: number =
      p.count ?? (kind === "fistPump" ? 3 : kind.endsWith("Roll") ? 2 : 1);
    HumanBound.whole("count", count);
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The arms the kind raises: both palms for the stretch, both fists for
    // victory, as the winners' display does (the law's doc names the
    // source), one fist for the pump.
    const raised: readonly IRaised[] =
      kind === "stretch" || kind === "victory"
        ? (["right", "left"] as const).map(
            (side: AutoMovieHumanSide): IRaised => ({
              side,
              grid: PLACES[kind],
              shape: kind === "victory" ? "fist" : "flat",
              pump: false,
            }),
          )
        : kind === "fistPump"
          ? [
              {
                side: p.hand ?? "right",
                grid: PLACES.fistPump,
                shape: "fist",
                pump: true,
              },
            ]
          : [];

    // An arm's goal on a posture: the hand laid on its place, dropped by
    // `drop` metres below it.
    const placed = (
      posture: IAutoMovieMotionHumanPosture,
      r: IRaised,
      drop: number,
    ): IAutoMovieHumanLimbGoal => {
      const place = AutoMovieMotionHumanTarget.fallback(
        body,
        posture,
        AutoMovieMotionHumanTargetGrid.place(body, r.side, r.grid),
      );
      return AutoMovieMotionHumanArm.goal(
        body,
        r.side,
        AutoMovieMotionHumanTarget.hand(
          body,
          posture,
          r.side,
          {
            point: { ...place.point, y: place.point.y - drop },
            normal: r.pump
              ? Vector3.subtract(
                  AutoMovieMotionHumanTarget.fallback(
                    body,
                    posture,
                    AutoMovieMotionHumanTargetGrid.place(body, r.side, ELBOW),
                  ).point,
                  place.point,
                )
              : { x: 0, y: -1, z: 0 },
          },
          {
            surface: r.shape === "fist" ? "fist" : "palm",
            shape: r.shape,
            bend: "raised",
          },
        ),
      );
    };

    // The rise lasts the free-space transport of the hand's travel, and at
    // least as long as each raised arm's path needs to keep within the
    // audit's travel bound (`AutoMovieMotionHumanArmPlanned.reaching`), from
    // its arm at the entry to the arm on its place.
    const rise: number =
      kind === "neckRoll" || kind === "shoulderRoll"
        ? AutoMovieMotionHumanTiming.PAUSES.beat
        : Math.max(
            AutoMovieMotionHumanTiming.transport(arm * 1.5),
            ...raised.map((r: IRaised): number =>
              AutoMovieMotionHumanArmPlanned.reaching(
                body,
                entry,
                r.side,
                AutoMovieMotionHumanArm.angles(context.entry.pose, r.side),
                AutoMovieMotionHumanArm.angles(
                  resolveHumanPosture(body, {
                    ...entry,
                    limbs: {
                      ...entry.limbs,
                      [`${r.side}Arm`]: placed(entry, r, 0),
                    },
                  }),
                  r.side,
                ),
              ),
            ),
          );
    const attack: number =
      kind === "stretch"
        ? Math.max(0.5, YAWN - 2 * rise)
        : kind === "victory"
          ? AutoMovieMotionHumanTiming.PAUSES.long
          : count *
            AutoMovieMotionHumanTiming.seconds("beat") *
            (kind === "fistPump" ? 1 : 2.5);
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: rise,
        attack,
        hold: AutoMovieMotionHumanTiming.PAUSES.brief,
        retract: rise,
      }),
      modifiers,
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];

    // Two arms raised over one span are planned on one base, each beside
    // the other at its rest (`IAutoMovieMotionHumanArmCarry.beside`): they
    // rise on their own sides and never share space. Planned one after the
    // other, the right arm was solved beside a left arm at rest and the left
    // beside the right arm's solved course, so the stretch's two arms were
    // not each other's mirror: the little fingers stood 0.24 m apart from
    // their mirror places (measured). As one problem of both arms they
    // mirrored, at several times the cost of two.
    const together: IAutoMovieMotionHumanArmPlanned.ITogether | undefined =
      AutoMovieMotionHumanArmPlanned.together(
        context.handover,
        true,
        context.tempo,
      );
    const raise = (r: IRaised): void => {
      const side: AutoMovieHumanSide = r.side;
      primitives.push(
        AutoMovieMotionHumanArm.carried({
          body,
          side,
          ...(together === undefined ? {} : { beside: together }),
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: (seconds: number): number =>
            clock.envelope(["start", "ready"], ["relax", "end"], seconds),
          // The raise, the hold and the lowering, planned over the clock's
          // instants.
          span: {
            start: clock.at("start"),
            ready: clock.at("ready"),
            relax: clock.at("relax"),
            end: clock.at("end"),
          },
          // The pump's fist drops a fifth of the arm and rises again
          // `count` times over the stroke.
          goal: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieHumanLimbGoal =>
            placed(
              posture,
              r,
              r.pump
                ? 0.2 *
                    arm *
                    modifiers.extent *
                    Math.sin(
                      Math.PI *
                        count *
                        clock.linear("strokeStart", "strokeEnd", seconds),
                    ) **
                      2
                : 0,
            ),
        }),
        AutoMovieMotionHumanHand.form(
          clock,
          side,
          ["start", "ready"],
          ["relax", "end"],
          r.shape,
        ),
      );
    };
    const circle = (
      angles: (cos: number, sin: number) => IAutoMovieMotionHumanJoints.Angles,
    ): IAutoMovieMotionHumanPrimitive => {
      const probe: IAutoMovieMotionHumanJoints.Angles = angles(1, 1);
      return AutoMovieMotionHumanJoints.add({
        channels: AutoMovieMotionHumanJoints.channels(probe),
        from: 0,
        to: clock.duration,
        delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles => {
          const w: number = clock.envelope(
            ["start", "ready"],
            ["relax", "end"],
            seconds,
          );
          const phase: number =
            2 *
            Math.PI *
            count *
            clock.linear("strokeStart", "strokeEnd", seconds);
          return angles(w * Math.cos(phase), w * Math.sin(phase));
        },
      });
    };

    switch (kind) {
      case "stretch":
      case "victory":
      case "fistPump":
        raised.forEach(raise);
        break;
      case "neckRoll": {
        const flex: number = AutoMovieMotionHumanRange.degrees(
          "neck",
          "flexion",
          "light",
        );
        const side: number = AutoMovieMotionHumanRange.degrees(
          "neck",
          "abduction",
          "light",
        );
        primitives.push(
          circle((c: number, s: number) => ({
            neck: [flex * c * modifiers.extent, side * s * modifiers.extent, 0],
          })),
        );
        break;
      }
      case "shoulderRoll": {
        const lift = (
          bone: PlanLiftBone,
          motion: IAutoMovieMotionHumanRange.Motion,
        ): number =>
          AutoMovieMotionHumanRange.degrees(bone, motion, "light") *
          modifiers.extent;
        primitives.push(
          circle((c: number, s: number) => ({
            leftShoulder: [
              lift("leftShoulder", "flexion") * c,
              lift("leftShoulder", "abduction") * s,
              0,
            ],
            rightShoulder: [
              lift("rightShoulder", "flexion") * c,
              lift("rightShoulder", "abduction") * s,
              0,
            ],
          })),
        );
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives,
      contact: "stroke",
    });
  }
}
