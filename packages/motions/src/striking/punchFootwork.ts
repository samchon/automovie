import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPunch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanFootRelax } from "../compose/AutoMovieMotionHumanFootRelax";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingArrest } from "./StrikingArrest";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import { StrikingTwist } from "./StrikingTwist";
import type { punchGeometry } from "./punchGeometry";
import { strikingStepSupport } from "./strikingStepSupport";

/** The alternatives of `CreateKindResult`'s site. */
type CreateKindResult = "plant" | "pivot";

/** The alternatives of `CreateRearKind`'s site. */
type CreateRearKind = "plant" | "pivot";

/** The alternatives of `CreateWindowKind`'s site. */
type CreateWindowKind = "plant" | "pivot";

/** The alternatives of `CreateWindowPart`'s site. */
type CreateWindowPart = "leftFoot" | "rightFoot";

/** The record of `ICreateArrestResult`'s site. */
type ICreateArrestResult = { from: number; speed: number; rest: number };

/** The record of `ICreateArrested`'s site. */
type ICreateArrested = { from: number; speed: number; rest: number };

/**
 * A punch's root, heading and feet: the lead foot steps in by the advance with
 * a small lift, the rear foot drags after it from mid-delivery to mid-return
 * (the IBA stepping jab: the rear foot follows at once), and a rear-hand punch
 * pivots the rear foot on its ball. A negative advance, a target nearer than
 * the arm's band, steps back the other way round: the rear foot leaves first,
 * by the delivery, and the lead foot follows over the drag, so the foot that
 * moves first is the one on the side it moves toward.
 *
 * The trunk's turn is shared by the pelvis (two fifths) and the lumbar and
 * thoracic spine (three tenths each), as the rotation of a punch runs up the
 * spine; the pelvis alone would twist the planted hips past their range. The
 * trunk turns back only once a stepping punch's rear foot has landed from its
 * drag, and the rear foot's pivot returns on that same profile, so no planted
 * foot is twisted under a hip turning back over it.
 */
export namespace punchFootwork {
  /**
   * Rear heel raise of a rear-hand punch's ball pivot at contact, degrees
   * (provisional reading of the IBA cross drawing's released heel).
   */
  export const HEEL_RAISE: number = 15;

  /**
   * The pelvis's share of the trunk's turn: two fifths, the heading turns by
   * it.
   */
  export const PELVIS_SHARE: number = 0.4;

  /**
   * Each of the lumbar and the thoracic spine's share of the trunk's turn:
   * three tenths.
   */
  export const SPINE_SHARE: number = 0.3;

  /**
   * The least step along the line the feet take, metres: a launch plan's step
   * no longer than this keeps both feet planted (provisional, a rounding-sized
   * step).
   */
  export const STEP: number = 0.02;

  /** What the footwork is built from. */
  export interface IProps {
    /** The punch's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPunch.IParams>;

    /** The punch's timing. */
    timing: punchGeometry.ITiming;

    /** The horizontal unit line to the target. */
    line: IAutoMovieVector3;

    /**
     * The step along the line by a second since the start, metres: positive
     * steps in, the lead foot first and the rear foot dragging after it;
     * negative steps back, the rear foot first and the lead foot after it. The
     * launch plan's step at the start, carried by the tracker's corrections as
     * they arrive; whether to step, and which way, is decided by the launch
     * plan's.
     */
    advance(seconds: number): number;

    /** The trunk turn at contact, degrees. */
    turn: number;

    /** How far the root lowers at contact, metres. */
    dip: number;

    /**
     * The committed stop's second, null when the arm met nothing, undefined
     * when the punch offers no weapon.
     */
    fixed: number | null | undefined;

    /** The share of the way out at seconds since the start. */
    out(seconds: number): number;

    /** The share of the way back at seconds since the start. */
    back(seconds: number): number;
  }

  /** A punch's built footwork. */
  export interface IFootwork {
    /**
     * The posture without the punching arm.
     *
     * @param seconds Seconds since the start, the feet's clock.
     * @param clock The trunk turn's clock; the feet's own when absent.
     * @param resolution Optional exact FK supplier borrowed only during this
     *   synchronous base/lowering evaluation.
     */
    base(
      seconds: number,
      clock?: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture;

    /** The feet's contact windows, as shares of the punch. */
    contacts: IAutoMovieMotionHumanContactWindow[];
  }

  /**
   * The share of its drag the rear foot has made.
   *
   * @param timing The punch's timing.
   * @param seconds Seconds since the start.
   * @returns The share in [0, 1].
   */
  export function drag(timing: punchGeometry.ITiming, seconds: number): number {
    const from: number = 0.5 * timing.shown;
    const to: number = timing.shown + 0.5 * timing.recoil;
    return minimumJerk.share((seconds - from) / (to - from));
  }

  /**
   * The share of the step the root has carried the shoulder by the contact.
   *
   * @param timing The punch's timing.
   * @returns The share in [0.5, 1].
   */
  export function carried(timing: punchGeometry.ITiming): number {
    return 0.5 * (1 + drag(timing, timing.shown));
  }

  /**
   * Build a punch's footwork.
   *
   * @param props The context, the timing and the contact solution's values.
   * @returns The footwork.
   */
  export function create(props: IProps): IFootwork {
    const { context, timing, line, advance, turn, dip, fixed, out, back } =
      props;
    const { lead, which, shown, recoil, duration } = timing;
    const body = context.body;
    const t0: number = context.start;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...entry.joints,
      ...StrikingStance.joints(entry.joints),
    };
    const dragTo: number = shown + 0.5 * recoil;

    const support: strikingStepSupport.ISupport | undefined =
      strikingStepSupport(context);
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = { ...StrikingTarget.feet(context.entry), ...support?.landings };
    const rear: AutoMovieHumanSide = StrikingStance.rear({ lead });
    // A step in or, before a target too close, a step back along the line,
    // led by the foot on the side it moves toward.
    // Decided at the launch: a foot does not choose to step mid-delivery.
    const launched: number = advance(0);
    const stepping: boolean = Math.abs(launched) > STEP;
    const backing: boolean = stepping && launched < 0;
    const first: AutoMovieHumanSide = backing ? rear : lead;
    const next: AutoMovieHumanSide = first === lead ? rear : lead;
    // A punch can turn while a foot arrives, but a traveling punch must
    // finish the inherited transfer before lifting its old bearing shoe.
    const firstStart: number =
      stepping && support?.bearing === first ? 0.5 * shown : 0;
    const dragFrom: number =
      stepping && support !== undefined ? shown : 0.5 * shown;
    const dragged = (t: number): number =>
      support === undefined
        ? drag(timing, t)
        : minimumJerk.share((t - dragFrom) / (dragTo - dragFrom));
    const opens = (t: number): number =>
      firstStart === 0
        ? out(t)
        : minimumJerk.share((t - firstStart) / (shown - firstStart));
    const landing = (side: AutoMovieHumanSide): number =>
      support?.landings[side] === undefined
        ? 0
        : stepping && side === first
          ? shown
          : 0.5 * shown;
    const lift: number = 0.015 * body.measure.stature;
    const turnBack = (t: number): number =>
      stepping
        ? minimumJerk.share((t - dragTo) / Math.max(1e-3, duration - dragTo))
        : back(t);

    // The feet keep the punch's clock; the trunk's turn may run on another
    // (a withdrawal's), so a stopped punch can turn back without moving a
    // planted foot.
    //
    // A stepping punch that meets a body before its lead foot has landed does
    // not finish the step into that body: from the stop the lead foot's
    // travel is arrested from the speed it had ({@link StrikingArrest}),
    // landing at the planned second, and the rear foot drags up to where the
    // lead foot came to rest, so the stance keeps its length.
    let travel = (t: number): number => (stepping ? advance(t) * opens(t) : 0);
    let follow = (t: number): number =>
      stepping ? advance(t) * dragged(t) : 0;
    // Only a step in can be arrested by a body it meets; a step back moves
    // away from it.
    if (
      stepping &&
      !backing &&
      fixed !== undefined &&
      fixed !== null &&
      fixed - t0 < shown
    ) {
      const s: number = Math.max(0, fixed - t0);
      // Read once the stop is passed: the step by then is what the
      // corrections arrived before the stop made it.
      let arrested: ICreateArrested | undefined;
      const arrest = (): ICreateArrestResult => {
        if (arrested === undefined) {
          const advanced: number = advance(s);
          const from: number = advanced * opens(s);
          const speed: number =
            (advanced *
              minimumJerk.rate((s - firstStart) / (shown - firstStart))) /
            (shown - firstStart);
          arrested = {
            from,
            speed,
            rest: StrikingArrest.rest(from, speed, shown - s),
          };
        }
        return arrested;
      };
      travel = (t: number): number => {
        if (t <= s) return advance(t) * opens(t);
        const { from, speed, rest } = arrest();
        return StrikingArrest.settle(from, speed, rest, shown - s, t - s);
      };
      follow =
        s <= dragFrom
          ? (t: number): number => (t <= s ? 0 : arrest().rest * dragged(t))
          : (t: number): number => {
              if (t <= s) return advance(t) * dragged(t);
              const advanced: number = advance(s);
              return StrikingArrest.settle(
                advanced * dragged(s),
                (advanced *
                  minimumJerk.rate((s - dragFrom) / (dragTo - dragFrom))) /
                  (dragTo - dragFrom),
                arrest().rest,
                dragTo - s,
                t - s,
              );
            };
    }
    const base = (
      t: number,
      clock: number = t,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture => {
      const turning: number = out(clock) - turnBack(clock);
      const moved: number = travel(t);
      const followed: number = follow(t);
      const opening: number = stepping ? opens(t) : 0;
      const dragging: number = stepping ? dragged(t) : 0;
      const firstLift: number = stepping
        ? lift * 4 * opening * (1 - opening)
        : 0;
      const nextLift: number = stepping
        ? lift * 4 * dragging * (1 - dragging)
        : 0;
      const leadFoot: IAutoMovieMotionHumanFoot.IPlacement =
        StrikingTarget.slide(
          feet[lead],
          line,
          backing ? followed : moved,
          (backing ? nextLift : firstLift) +
            (support?.rise(lead, t, landing(lead)) ?? 0),
        );
      const slid: IAutoMovieMotionHumanFoot.IPlacement = StrikingTarget.slide(
        feet[rear],
        line,
        backing ? moved : followed,
        (backing ? firstLift : nextLift) +
          (support?.rise(rear, t, landing(rear)) ?? 0),
      );
      const rearFoot: IAutoMovieMotionHumanFoot.IPlacement =
        which === "rear"
          ? StrikingTarget.pivot(
              body,
              rear,
              slid,
              0.5 * turn * turning,
              HEEL_RAISE * turning,
            )
          : slid;
      const placed: Record<
        AutoMovieHumanSide,
        IAutoMovieMotionHumanFoot.IPlacement
      > =
        lead === "left"
          ? { left: leadFoot, right: rearFoot }
          : { left: rearFoot, right: leadFoot };
      const firstDown: boolean = stepping
        ? (firstStart > 0 && t <= firstStart) || t >= shown
        : t >= landing(first);
      const nextDown: boolean = stepping
        ? (t >= landing(next) && t <= dragFrom) || t >= dragTo
        : t >= landing(next);
      const leadDown: boolean = backing ? nextDown : firstDown;
      const rearDown: boolean = backing ? firstDown : nextDown;
      const down: Record<AutoMovieHumanSide, boolean> =
        lead === "left"
          ? { left: leadDown, right: rearDown }
          : { left: rearDown, right: leadDown };
      const written: Omit<IAutoMovieMotionHumanPosture, "limbs"> = {
        root: Vector3.add(
          { ...entry.root, y: entry.root.y - dip * turning },
          Vector3.scale(line, 0.5 * (moved + followed)),
        ),
        yaw: entry.yaw + PELVIS_SHARE * turn * turning,
        pitch: entry.pitch,
        roll: entry.roll,
        joints: StrikingStance.facing(
          {
            ...joints,
            ...StrikingTwist.trunk(entry.joints, SPINE_SHARE * turn * turning),
            // The raised heel's toes bend to stay flat on the floor.
            ...(which === "rear"
              ? {
                  [`${rear}Toes`]: [HEEL_RAISE * turning, 0, 0] as const,
                }
              : {}),
          },
          turn * turning,
        ),
      };
      // A foot off its plant bears no weight, so its ankle holds no more
      // dorsiflexion than the passive range: its heel rises about the toes'
      // joint as the shank leans over it (`AutoMovieMotionHumanFootRelax`),
      // where the stance's flat foot, dragged or stepped, kept the loaded
      // stance's bend 12 degrees past it.
      const relaxed = (
        side: AutoMovieHumanSide,
      ): IAutoMovieMotionHumanFoot.IPlacement =>
        down[side]
          ? placed[side]
          : AutoMovieMotionHumanFootRelax.of(
              body,
              { ...written, limbs: {} },
              side,
              placed[side],
            );
      return lowerHumanPosture(
        body,
        {
          ...written,
          limbs: StrikingStance.legs(
            body,
            { left: relaxed("left"), right: relaxed("right") },
            down,
          ),
        },
        lowerHumanPosture.KNEE,
        resolution,
      );
    };

    // The feet's contact windows, as shares of the punch.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    const window = (
      part: CreateWindowPart,
      kind: CreateWindowKind,
      from: number,
      to: number,
    ): void => {
      if (to > from)
        contacts.push({
          part,
          kind,
          from: from / duration,
          to: to / duration,
          support: { kind: "ground" },
        });
    };
    const rearKind: CreateRearKind = which === "rear" ? "pivot" : "plant";
    const kind = (foot: AutoMovieHumanSide): CreateKindResult =>
      foot === rear ? rearKind : "plant";
    window(
      `${first}Foot`,
      kind(first),
      stepping ? shown : landing(first),
      duration,
    );
    if (stepping) {
      window(`${first}Foot`, kind(first), 0, firstStart);
      window(`${next}Foot`, kind(next), landing(next), dragFrom);
      window(`${next}Foot`, "plant", dragTo, duration);
    } else window(`${next}Foot`, kind(next), landing(next), duration);

    return { base, contacts };
  }
}
