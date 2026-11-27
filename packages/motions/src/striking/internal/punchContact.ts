import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieMotionHumanStrikingAim,
  IAutoMovieMotionHumanStrikingReach,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { PreparedHumanIntervals } from "../../perform/PreparedHumanIntervals";
import { StrikingAim } from "../StrikingAim";
import { StrikingBody } from "../StrikingBody";
import { StrikingQuality } from "../StrikingQuality";
import { StrikingReach } from "../StrikingReach";
import { StrikingRoom } from "../StrikingRoom";
import { StrikingSkill } from "../StrikingSkill";
import { StrikingStance } from "../StrikingStance";
import { StrikingTarget } from "../StrikingTarget";
import { punchFootwork } from "./punchFootwork";
import type { punchGeometry } from "./punchGeometry";
import type { punchLaunch } from "./punchLaunch";
import { punchReach } from "./punchReach";
import { punchSurface } from "./punchSurface";

/** The alternatives of `EntryItemEntry`'s site. */
type EntryItemEntry = "lead" | "rear";

/**
 * A punch at its contact: the line to the target, the trunk's turn, the fist's
 * rotation, the tracked aim, the step-in and the arm's solution.
 *
 * Techniques (IBA coaching manual pp. 42 to 45 and the kickboxing research of
 * the research): `straight` lands nearly extended along the line, palm down;
 * `hook` lands with the elbow near a right angle, arriving across the line,
 * palm down; `uppercut` rises from below, palm toward the puncher. A body punch
 * lowers the shoulder through the knees so the fist meets a low target from
 * about its own level. When the arm's band falls short, the lead foot steps in
 * by up to one stance length, never past the room in front of the arms
 * ({@link StrikingRoom}) and never toward a target that no place on the line
 * brings within the band.
 */
export namespace punchContact {
  /**
   * How far a punch at a low target lowers the shoulder: half of how far the
   * shoulder stands above the target beyond a quarter of the arm, at most 0.15
   * of the hip's height, none for a target that high.
   *
   * @param m The puncher's hip height and arm.
   * @param shoulder The shoulder's height, metres.
   * @param target The target's height, metres.
   * @returns Metres.
   */
  export function dip(
    m: Pick<IAutoMovieBodyMeasure, "hipHeight" | "upperArm" | "forearm">,
    shoulder: number,
    target: number,
  ): number {
    return Math.min(
      0.15 * m.hipHeight,
      Math.max(0, 0.5 * (shoulder - target - 0.25 * (m.upperArm + m.forearm))),
    );
  }

  /**
   * Elbow flexion band at contact by technique, degrees (IBA drawings read;
   * hook and uppercut near a right angle; the palm heel as the straight, the
   * backfist nearly extended and the hammerfist bent, provisional).
   */
  export const FLEXION: Readonly<
    Record<
      IAutoMovieMotionHumanPunch.IParams["technique"],
      readonly [number, number]
    >
  > = {
    straight: [5, 25],
    hook: [70, 100],
    uppercut: [60, 100],
    palmHeel: [5, 25],
    backfist: [10, 45],
    hammerfist: [30, 90],
    verticalFist: [5, 25],
  };

  /**
   * Trunk turn at contact by technique and hand, degrees toward bringing the
   * rear shoulder forward (negative turns the lead shoulder through, as the
   * lead hook does). Provisional readings of the coached rotations: the rear
   * straight squares the hips and shoulders past the line (twice the 30 degree
   * stance turn), the jab barely turns, the lead hook turns the lead shoulder
   * through by more than the stance turn. The palm heel turns as the straight,
   * the backfist turns its shoulder through like a hook and the hammerfist
   * drops through a smaller turn (provisional). Skill scales the turn's share
   * ({@link StrikingSkill.amplitude}).
   */
  export const TURN: Readonly<
    Record<
      IAutoMovieMotionHumanPunch.IParams["technique"],
      Readonly<Record<EntryItemEntry, number>>
    >
  > = {
    straight: { lead: 8, rear: 60 },
    hook: { lead: -40, rear: 50 },
    uppercut: { lead: -20, rear: 40 },
    palmHeel: { lead: 8, rear: 60 },
    backfist: { lead: -15, rear: 45 },
    hammerfist: { lead: 10, rear: 40 },
    verticalFist: { lead: 0, rear: 10 },
  };

  /** A punch solved at its contact. */
  export interface IContact {
    /** The point aimed at when the punch is launched. */
    first: IAutoMovieVector3;

    /** The horizontal unit line to the target. */
    line: IAutoMovieVector3;

    /** The trunk turn at contact, degrees. */
    turn: number;

    /** How far the root lowers at contact, metres. */
    dip: number;

    /** The fist's unit travel direction at contact. */
    direction: IAutoMovieVector3;

    /** The hand's rotation at contact. */
    rotation: IAutoMovieQuaternion;

    /** The fist socket's offset from the wrist at contact. */
    socket: IAutoMovieVector3;

    /** The seeded miss added to the aim. */
    offset: IAutoMovieVector3;

    /** The online tracker of the target. */
    tracker: IAutoMovieMotionHumanStrikingAim.ITracker;

    /**
     * The displayed entry bone map: complete by default, or the explicit
     * requested outputs. The punch geometry requests all six arm joints for its
     * launch wrist/elbow and both complete arm sweeps.
     */
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** The lead foot's step along the line, metres. */
    advance: number;

    /** The punching shoulder at contact. */
    shoulder: IAutoMovieVector3;

    /** The direction the elbow bends toward. */
    bend: IAutoMovieVector3;

    /** The arm's solution at contact, on the launch plan. */
    solved: IAutoMovieMotionHumanStrikingReach.ISolution;

    /** The elbow's hint point at contact, on the launch plan. */
    hint: IAutoMovieVector3;

    /**
     * The reach on the launch plan, whose step, shoulder, arm and hint the
     * members above repeat.
     */
    launched: punchReach.IReach;

    /**
     * The tracker's corrections arrived by a film second, each carried into the
     * step, the wrist at contact and the elbow's hint.
     */
    corrected(seconds: number): readonly punchReach.ICorrection[];
  }

  /**
   * Solve a punch at its contact.
   *
   * @param context The action's context, whose body keeps its topology and
   *   skeleton unchanged.
   * @param timing The punch's timing.
   * @param tangent The varied point within a person's region, when the punch
   *   varies.
   * @param launch What the punch reads of its own entry alone (`punchLaunch`),
   *   made once for the plan.
   * @returns The contact's solution.
   */
  export function solve(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>,
    timing: punchGeometry.ITiming,
    tangent: IAutoMovieHumanoidSurfaces.ITangent | undefined,
    launch: punchLaunch.ILaunch,
  ): IContact {
    const p: IAutoMovieMotionHumanPunch.IParams = context.params;
    const { side, delivery }: punchGeometry.ITiming = timing;
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieBodyMeasure = body.measure;
    const t0: number = context.start;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const at: IAutoMovieMotionTarget = p.at;
    const partner: IAutoMovieMotionHumanPerformerReader | undefined =
      tangent !== undefined && at.kind === "person"
        ? context.performer(at.subject)
        : undefined;
    const varied: IAutoMovieHumanoidSurfaces.IFrame | undefined =
      partner !== undefined && at.kind === "person"
        ? StrikingBody.frame(partner.body, at.region, tangent!)
        : undefined;
    const variedBones: ReadonlySet<AutoMovieHumanoidBone> | undefined =
      varied === undefined
        ? undefined
        : new Set<AutoMovieHumanoidBone>([varied.bone]);
    const aim: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 => {
      if (tangent !== undefined && at.kind === "person") {
        const other: IAutoMovieMotionHumanPerformerReader = partner!;
        const frame: IAutoMovieHumanoidSurfaces.IFrame = varied!;
        return resolveAutoMovieHumanoidSurfaces.point(
          frame,
          other.bones(seconds, variedBones!).get(frame.bone)!,
        );
      }
      return StrikingTarget.aim(
        context,
        at,
        seconds,
        (): number =>
          0.9 * (m.upperArm + m.forearm) + 0.5 * m.shoulderHalfWidth,
      );
    };

    // The line to the target at the launch and the trunk turn it calls for.
    const first: IAutoMovieVector3 = aim(t0 - StrikingTarget.LOOK);
    const line: IAutoMovieVector3 = StrikingTarget.line(
      entry.root,
      first,
      entry.yaw,
    );
    const { turn, bones }: punchLaunch.ILaunch = launch;
    const outward: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, line),
      side === "left" ? 1 : -1,
    );

    // The shoulder at contact: the entry turned, lowered for a body shot so
    // the fist meets a low target from about its own level.
    const shoulder0: IAutoMovieVector3 = launch.shoulder;
    const dip: number = punchContact.dip(m, shoulder0.y, first.y);
    const lowered: IAutoMovieVector3 = { ...shoulder0, y: shoulder0.y - dip };

    // The striking surface's travel, the hand's rotation and the surface's
    // offset at contact by technique.
    const straight: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(first, lowered),
    );
    const surface: punchSurface.ISurface = punchSurface(
      body,
      side,
      p.technique,
      line,
      outward,
      straight,
    );
    const { direction, rotation, socket }: punchSurface.ISurface = surface;

    // Tracking with the declared accuracy and the seeded scatter.
    const offset: IAutoMovieVector3 = StrikingQuality.offset({
      skill: context.skill,
      random: context.random("scatter"),
      ...(p.accuracy === undefined ? {} : { accuracy: p.accuracy }),
      direction,
      radius: StrikingQuality.fist(m.hand),
      distance: Vector3.distance(first, lowered),
      seconds: delivery,
    });
    const tracker: IAutoMovieMotionHumanStrikingAim.ITracker =
      StrikingAim.track(
        aim,
        {
          launch: t0 - StrikingTarget.LOOK,
          impact: t0 + delivery,
          latency: StrikingSkill.CORRECTION_LATENCY,
          step: StrikingAim.STEP,
          shortest: StrikingAim.SHORTEST,
        },
        offset,
      );

    // Reach: the step along the line that brings the wrist the fist needs
    // within the arm's comfortable reach, then the arm's goals at contact.
    // Both are planned on what the puncher sees at the launch, the tracker's
    // launch plan, and carried by each correction as it arrives
    // (`corrected`), so a punch reads its target only at or before the
    // second it is shown at. Planned at once against the tracker's goal at
    // the contact, the punch read the target at the corrections still to
    // come: two people punching each other at once each planned on the
    // other's punch still being planned. Carried by the corrections, the arm
    // still lands within its band: planned on the launch plan alone, a jab
    // from a guard facing a settling guard planned 15 degrees at the elbow
    // and landed with 37 to 55, the face 5 to 6 cm nearer than planned.
    const band: readonly [number, number] = FLEXION[p.technique];
    const comfortable: number = StrikingReach.reach(
      m.upperArm,
      m.forearm,
      (band[0] + band[1]) / 2,
    );

    // By the contact the root has carried the shoulder only a share of the
    // step, as the rear foot is still dragging ({@link punchFootwork}).
    const carried: number = punchFootwork.carried(timing);

    // The punch returns to the guard where the step ends, so the step never
    // closes past the room in front of the arms ({@link StrikingRoom}). A
    // target nearer than the band's reach is backed away from by the same
    // step along the line, so the arm still lands within its band, no
    // farther than the room behind the heels allows. A wrist
    // off the line by more than the band's longest reach (a target above the
    // arm) is out of reach from every place on the line, so it is not
    // stepped toward: the nearest place is under it, the other's own.
    const longest: number = StrikingReach.reach(m.upperArm, m.forearm, band[0]);
    const bend: IAutoMovieVector3 =
      p.technique === "hook" || p.technique === "backfist"
        ? Vector3.add(outward, Vector3.scale(up, 0.1))
        : Vector3.add(Vector3.scale(up, -1), Vector3.scale(outward, 0.3));
    // The room behind the heels and in front of the arms along the line,
    // read once at the launch for every reach a delivered punch solves.
    const room: readonly [number, number] =
      p.feint === undefined
        ? [
            -StrikingRoom.behind(
              context,
              StrikingTarget.feet(context.entry),
              line,
            ),
            StrikingRoom.ahead(context, at, bones, line, t0),
          ]
        : [0, 0];
    // A correction keeps the launch's decision to step and its direction
    // (`punchFootwork`): it changes how far the foot goes, never whether or
    // which way, so its arm is solved on the shoulder the body carries.
    const reach: (
      goal: IAutoMovieVector3,
      decided?: number,
    ) => punchReach.IReach = (
      goal: IAutoMovieVector3,
      decided?: number,
    ): punchReach.IReach => {
      const wristAt: IAutoMovieVector3 = Vector3.subtract(goal, socket);
      const relative: IAutoMovieVector3 = Vector3.subtract(wristAt, lowered);
      const along: number = Vector3.dot(relative, line);
      const across: number = Math.sqrt(
        Math.max(0, Vector3.dot(relative, relative) - along * along),
      );
      const needed: number = Math.sqrt(
        Math.max(0, comfortable * comfortable - across * across),
      );
      let advance: number = 0;
      if (p.feint === undefined && across <= longest) {
        advance = Math.max(
          room[0],
          Math.min(
            StrikingReach.advance(
              along,
              needed,
              carried * StrikingStance.length(body),
            ) / carried,
            room[1],
          ),
        );
      }
      if (decided !== undefined)
        advance =
          Math.abs(decided) <= punchFootwork.STEP
            ? decided
            : decided > 0
              ? Math.max(0, advance)
              : Math.min(0, advance);
      const shoulder: IAutoMovieVector3 = Vector3.add(
        lowered,
        Vector3.scale(line, carried * advance),
      );
      const solved: IAutoMovieMotionHumanStrikingReach.ISolution =
        StrikingReach.chain({
          root: shoulder,
          point: wristAt,
          upper: m.upperArm,
          along: m.forearm,
          lower: m.forearm,
          bend,
          flexion: band,
          slide: false,
        });
      return {
        advance,
        shoulder,
        solved,
        hint: StrikingReach.hint(shoulder, solved, bend, 0.25 * m.upperArm),
      };
    };
    const launched: punchReach.IReach = reach(tracker.planned);

    // Each correction's reach, solved here on the tracker's goal once that
    // correction has arrived: the i-th after the launch plan.
    const records: punchReach.ICorrection[] = [];
    let goal: IAutoMovieVector3 = tracker.planned;
    let before: punchReach.IReach = launched;
    for (const unit of tracker.units(Infinity)) {
      goal = Vector3.add(goal, unit.displacement);
      const now: punchReach.IReach = reach(goal, launched.advance);
      records.push({
        start: unit.start,
        duration: unit.duration,
        advance: now.advance - before.advance,
        end: Vector3.subtract(now.solved.end, before.solved.end),
        hint: Vector3.subtract(now.hint, before.hint),
        reach: now,
        moved: !punchReach.same(now, before),
      });
      before = now;
    }
    const startAt = (i: number): number => records[i]!.start;
    const corrected = (seconds: number): readonly punchReach.ICorrection[] =>
      seconds === Infinity
        ? records
        : records.slice(
            0,
            PreparedHumanIntervals.upperBound(records.length, startAt, seconds),
          );

    return {
      first,
      line,
      turn,
      dip,
      direction,
      rotation,
      socket,
      offset,
      tracker,
      bones,
      advance: launched.advance,
      shoulder: launched.shoulder,
      bend,
      solved: launched.solved,
      hint: launched.hint,
      launched,
      corrected,
    };
  }
}
