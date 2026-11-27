import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkFoot } from "../../actions/internal/walkFoot";
import { walkReach } from "../../actions/internal/walkReach";
import { walkReachGround } from "../../actions/internal/walkReachGround";
import { walkReachHeld } from "../../actions/internal/walkReachHeld";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerDorsal } from "./staggerDorsal";
import { staggerKnots } from "./staggerKnots";
import { staggerLean } from "./staggerLean";
import type { staggerRecover } from "./staggerRecover";
import { staggerSwingBow } from "./staggerSwingBow";

/*
 * A stagger's feet and pelvis at every second of its plan (`stagger`): the
 * pelvis carried by the recovery's centre of mass course, the feet standing
 * where the steps put them, and each step's swing as a walking foot swings,
 * risen first by the least toe clearance of walking and bowed around the
 * standing foot where it would pass into it.
 *
 * Every reading is a prepared curve evaluated at the second plus the walk's own
 * settling of the pelvis over its feet: the trunk leans and the root carries
 * the centre of mass's travel less the lean's shift of it (`staggerLean`),
 * lowered to the height its planted legs allow (`walkReachGround`, a scalar
 * root of each leg's closed-form reach claim, its heel rising about the ball
 * where the ankle runs out of room); a swinging foot follows its prepared
 * walking-foot curve (`walkFoot.prepareSwing`) between its two settled ends,
 * its bow fixed in closed form for its step (`staggerSwingBow`), and is held
 * inside its leg's ranges under that pelvis (`walkReach.prepareSwing`). The
 * legs' admission (`staggerAdmission`) already read this same pelvis at every
 * step's mid-swing and landing.
 *
 * The instance prepares body-only swing reach once, and every step's endpoints,
 * swing reader and bow on construction and again under each shift the plan
 * gives (`shifted`); no arbitrary-time result is retained.
 */
export class StaggerFeet {
  /*
   * The feet as the entry stands them.
   */
  private readonly entered: Record<
    AutoMovieHumanSide,
    IAutoMovieMotionHumanFoot.IPlacement
  >;

  /*
   * The share of a swing a foot rises in (`staggerKnots.risingOf`).
   */
  private readonly rising: number;

  /*
   * Each step's bow around the standing foot.
   */
  private readonly bows: Map<staggerRecover.IStep, number> = new Map();

  /*
   * One fixed swing reader and nonzero-travel direction per recovery step.
   */
  private readonly swings: Map<staggerRecover.IStep, IStaggerFeetSwingsEntry> =
    new Map();

  /*
   * The entry's posture.
   */
  private readonly posture: IAutoMovieMotionHumanPosture;

  /*
   * The body.
   */
  private readonly body: IAutoMovieMotionHumanActionContext["body"];

  /*
   * The recovery.
   */
  private readonly recovery: staggerRecover.IRecovery;

  /*
   * Each side's body-only swing range and floor-clearance prerequisites.
   */
  private readonly swingReaches: Record<
    AutoMovieHumanSide,
    ReturnType<typeof walkReach.prepareSwing>
  >;

  /*
   * The trunk's lean and the root carrying it, at a second (`staggerLean`).
   */
  private readonly lean: ReturnType<typeof staggerLean>;

  /*
   * The plan's level shift of the root at a second (`shifted`); none until the
   * plan gives one.
   */
  private shift: ((seconds: number) => IAutoMovieVector3) | undefined;

  /*
   * Take the plan's level shift of the root, and prepare every step's ends,
   * swing and bow under it in place of those prepared under the one before.
   *
   * A swing runs between its foot's stance at the step's start and at its
   * landing, and those two stances are the ones the pose shows at those seconds
   * only when they are settled under the same pelvis. The pose settles the
   * pelvis on the shifted root; the ends were settled on the unshifted one, so
   * a foot touched down on a stance some millimetres from the swing's last
   * pose: measured, a body pushed forward showed its stepping leg's knee jump
   * 12.8 mm at the landing, 0.52 s.
   * Parameter shift: The shift at a second since the push, world metres, level; the
   * same reader the plan's leg row passes to `solve`.
   */
  public shifted(shift: (seconds: number) => IAutoMovieVector3): void {
    this.shift = shift;
    this.prepareSteps();
  }

  /*
   * Keep one plan's body, entry posture and recovery, and prepare each side's
   * body-only swing reach and every step's endpoints, swing and bow.
   * Parameter body: The body.
   * Parameter entry: The context's entry.
   * Parameter recovery: The admitted recovery.
   */
  public constructor(
    body: IAutoMovieMotionHumanActionContext["body"],
    entry: IAutoMovieMotionHumanActionContext["entry"],
    recovery: staggerRecover.IRecovery,
    bend: Record<StaggerFeetBendEntry, IAutoMovieVector3>,
  ) {
    this.body = body;
    this.recovery = recovery;
    this.posture = entry.posture;
    this.lean = staggerLean(body, entry, recovery, bend);
    this.entered = StrikingTarget.feet(entry);
    this.rising = staggerKnots.risingOf(body);
    this.swingReaches = {
      left: walkReach.prepareSwing(body, "left"),
      right: walkReach.prepareSwing(body, "right"),
    };
    this.prepareSteps();
  }

  /*
   * The pelvis and stances at a second: the root carrying the centre of mass's
   * travel less the trunk lean's shift of it, moved by the plan's balance
   * shift, settled over the feet as the walk settles its pelvis on the hip
   * joints the trunk's tilt about the hips carries (`walkReachHeld.tilt`): the
   * pelvis as the plan shows it. Settled on the upright hips of the unshifted
   * root and then shifted and tilted, a leg standing at its knee's least bend
   * was asked for a hip some millimetres further than it reaches, and its foot
   * left the floor.
   * Parameter seconds: Seconds since the push.
   * Parameter feet: The scheduled feet at that second.
   * Parameter resolution: Optional exact FK source borrowed by the same synchronous
   * settlement.
   * Parameter at: The lean's reading at the second (`staggerLean`): the upright
   * root before lowering, the trunk's tilt and the reaction's share, over
   * which the lowering comes in from the entry's height; read when absent.
   * Parameter shift: The plan's level shift of the root at the second, world
   * metres; none when absent.
   * Returns: The settled pelvis (its root shifted, its rotation the tilted
   * one), feet and contacts.
   */
  public settle(
    seconds: number,
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    at: ReturnType<StaggerFeet["lean"]> = this.lean(seconds),
    shift?: IAutoMovieVector3,
  ): walkReach.IGround {
    const entry: IAutoMovieMotionHumanPosture = this.posture;
    const body: IAutoMovieMotionHumanActionContext["body"] = this.body;
    const root: IAutoMovieVector3 =
      shift === undefined
        ? at.root
        : { x: at.root.x + shift.x, y: at.root.y, z: at.root.z + shift.z };
    return walkReachGround(
      body,
      root,
      walkReach.pelvis(
        body,
        root,
        entry.yaw,
        entry.joints.hips ?? [0, 0, 0],
        feet,
        resolution === undefined
          ? undefined
          : prepareHumanPoseResolution.read(resolution),
      ),
      feet,
      {},
      undefined,
      (
        root: IAutoMovieVector3,
        yaw: number,
        joints: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
      ): ReturnType<typeof walkReachHeld.tilt> =>
        walkReachHeld.tilt(body, root, yaw, joints, at.trunk),
      // Each planted ankle bends as far as the weight it bears lets it
      // (`staggerDorsal`).
      staggerDorsal(body, this.recovery.pressure(seconds), feet),
    );
  }

  /*
   * The standing feet, each at the placement its latest landed step supplied.
   */
  public standing(
    seconds: number,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled> {
    const out: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanWalkFoot.IScheduled
    > = {
      left: { placement: this.entered.left, toes: 0 },
      right: { placement: this.entered.right, toes: 0 },
    };
    for (const step of this.recovery.steps)
      if (seconds >= step.land - 1e-9)
        out[step.side] = { placement: step.to, toes: 0 };
    return out;
  }

  /*
   * The standing schedule with each active walking-foot swing written over it.
   */
  public scheduled(
    seconds: number,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled> {
    const out: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanWalkFoot.IScheduled
    > = this.standing(seconds);
    for (const step of this.recovery.steps) {
      if (seconds <= step.start || seconds >= step.land) continue;
      out[step.side] = this.swungAt(step, seconds, this.bowOf(step));
    }
    return out;
  }

  /*
   * The feet, the pelvis and the reached feet at a second: a swinging foot held
   * inside its leg's ranges under the settled pelvis and off the floor
   * (`walkReach.swing`).
   * Parameter seconds: Seconds since the push.
   * Parameter resolution: Optional parent FK source borrowed only by this
   * synchronous settlement.
   * Parameter shift: The plan's level shift of the root at the second, world
   * metres; none when absent.
   * Returns: The scheduled, settled and reached feet.
   */
  public solve(
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    shift?: IAutoMovieVector3,
  ): ISolveResult {
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanWalkFoot.IScheduled
    > = this.scheduled(seconds);
    const at: ReturnType<StaggerFeet["lean"]> = this.lean(seconds);
    const trunk: ISolveTrunk = at.trunk;

    // The pelvis reads a swinging foot's claim where it stands, not where
    // it flies: at the place it left until mid-swing and at its landing
    // after, the claim's weight being none at mid-swing (`walkReach.weight`),
    // so the lowering is continuous at lift-off and touch-down alike.
    const claims: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanWalkFoot.IScheduled
    > = { ...feet };
    for (const step of this.recovery.steps)
      if (seconds > step.start && seconds < step.land) {
        const swing: IAutoMovieMotionHumanWalkFoot.IScheduled["swing"] =
          feet[step.side].swing;
        claims[step.side] = {
          placement: (swing?.u ?? 0) < 0.5 ? step.from : step.to,
          toes: 0,
          ...(swing === undefined ? {} : { swing }),
        };
      }
    const settled: walkReach.IGround = this.settle(
      seconds,
      claims,
      resolution,
      at,
      shift,
    );
    const reached: Record<AutoMovieHumanSide, walkFoot.IEnd> = {
      ...settled.feet,
    };
    for (const side of ["left", "right"] as const)
      if (feet[side].swing !== undefined)
        reached[side] = this.swingReaches[side](
          settled,
          feet[side],
          this.swinging(side, seconds),
        );
    return { feet, settled, reached, trunk, ease: at.ease };
  }

  /*
   * The first matching open swing's linear share at action-local seconds, zero
   * outside every swing.
   */
  private swinging(side: AutoMovieHumanSide, seconds: number): number {
    for (const step of this.recovery.steps)
      if (step.side === side && seconds > step.start && seconds < step.land)
        return (seconds - step.start) / (step.land - step.start);
    return 0;
  }

  /*
   * A step's raised-start walking swing at action-local seconds and signed
   * lateral bow metres: the foot rises by CLEARANCE over the rising share, then
   * follows the prepared swing plus the 16_share^2_(1-share)^2 lateral bump,
   * resting at both endpoints, so it is continuous at lift-off and at
   * touch-down.
   */
  private swungAt(
    step: staggerRecover.IStep,
    seconds: number,
    bow: number,
  ): IAutoMovieMotionHumanWalkFoot.IScheduled {
    const { CLEARANCE }: typeof staggerBounds = staggerBounds;
    const rising: number = this.rising;
    const u: number = (seconds - step.start) / (step.land - step.start);
    const { from, at }: ReturnType<StaggerFeet["swingOf"]> = this.swingOf(step);
    const share: number = Math.max(0, (u - rising) / (1 - rising));
    const swung: IAutoMovieMotionHumanWalkFoot.IFoot =
      u < rising
        ? {
            placement: {
              ankle: {
                ...from.ankle,
                y: from.ankle.y + CLEARANCE * AutoMovieEngineMotionSampling.minimumJerkShare(u / rising),
              },
              rotation: from.rotation,
            },
            toes: from.toes,
          }
        : at(share);
    const normal: IAutoMovieVector3 = this.normalOf(step);
    const bump: number = 16 * share * share * (1 - share) * (1 - share);
    return {
      ...swung,
      placement: {
        ...swung.placement,
        ankle: AutoMovieEngineVector3.add(
          swung.placement.ankle,
          AutoMovieEngineVector3.scale(normal, bow * bump),
        ),
      },

      // The pelvis reads the swing from its lift-off on: a foot still
      // rising bears its claim on the hips as a stance does.
      swing: { u: share, off: step.start, on: step.land },
    };
  }

  /*
   * The unit a step's bow displaces its ankle along: its travel turned a
   * quarter turn, or the entry's heading for a step in place.
   */
  private normalOf(step: staggerRecover.IStep): IAutoMovieVector3 {
    return (
      this.swingOf(step).normal ??
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: this.posture.yaw },
        { x: 0, y: 0, z: 1 },
      )
    );
  }

  /*
   * Prepare every recovery step's settled endpoints, raised-start walking swing
   * curve, nonzero-travel normal and bow under the plan's current shift, each
   * endpoint settled as the pose settles it.
   */
  private prepareSteps(): void {
    this.swings.clear();
    this.bows.clear();
    const end = (side: AutoMovieHumanSide, seconds: number): walkFoot.IEnd =>
      this.settle(
        seconds,
        this.standing(seconds),
        undefined,
        undefined,
        this.shift?.(seconds),
      ).feet[side];
    for (const step of this.recovery.steps) {
      const from: walkFoot.IEnd = end(step.side, step.start);
      const to: walkFoot.IEnd = end(step.side, step.land);
      const raised: walkFoot.IEnd = {
        ...from,
        ankle: { ...from.ankle, y: from.ankle.y + staggerBounds.CLEARANCE },
      };
      const travel: IAutoMovieVector3 = {
        x: to.ankle.x - from.ankle.x,
        y: 0,
        z: to.ankle.z - from.ankle.z,
      };
      const size: number = AutoMovieEngineVector3.length(travel);
      this.swings.set(step, {
        from,
        normal:
          size > 1e-9
            ? { x: -travel.z / size, y: 0, z: travel.x / size }
            : undefined,
        at: walkFoot.prepareSwing(this.body, step.side, {
          from: raised,
          velocity: { x: 0, y: 0, z: 0 },
          to,
          seconds: (1 - this.rising) * (step.land - step.start),
          lift: staggerBounds.LIFT,
        }),
      });

      // The step's closed-form bow around the foot standing through its swing
      // (`staggerSwingBow`).
      const stance: AutoMovieHumanSide =
        step.side === "left" ? "right" : "left";
      this.bows.set(
        step,
        staggerSwingBow(
          this.body,
          step,
          this.standing(step.start)[stance].placement,
          this.normalOf(step),
          (
            seconds: number,
            lateral: number,
          ): IAutoMovieMotionHumanWalkFoot.IScheduled =>
            this.swungAt(step, seconds, lateral),
        ),
      );
    }
  }

  /*
   * A step's prepared swing (`prepareSteps`).
   */
  private swingOf(step: staggerRecover.IStep): ISwingOfResult {
    return this.swings.get(step)!;
  }

  /*
   * A step's prepared bow (`prepareSteps`).
   */
  private bowOf(step: staggerRecover.IStep): number {
    return this.bows.get(step)!;
  }
}

/*
 * The record of `ISwingOfResult`'s site.
 */
type ISwingOfResult = {
  from: walkFoot.IEnd;
  normal: IAutoMovieVector3 | undefined;
  at: (share: number) => IAutoMovieMotionHumanWalkFoot.IFoot;
};

/*
 * The record of `ISolveTrunk`'s site.
 */
type ISolveTrunk = { pitch: number; roll: number };

/*
 * The record of `ISolveResult`'s site.
 */
type ISolveResult = {
  feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanWalkFoot.IScheduled>;
  settled: walkReach.IGround;
  reached: Record<AutoMovieHumanSide, walkFoot.IEnd>;
  trunk: ISolveTrunkResult;
  ease: number;
};

/*
 * The record of `ISolveTrunkResult`'s site.
 */
type ISolveTrunkResult = { pitch: number; roll: number };

/*
 * The alternatives of `StaggerFeetBendEntry`'s site.
 */
type StaggerFeetBendEntry = "pitch" | "roll";

/*
 * The record of `IStaggerFeetSwingsEntry`'s site.
 */
type IStaggerFeetSwingsEntry = {
  from: walkFoot.IEnd;
  normal: IAutoMovieVector3 | undefined;
  at: (share: number) => IAutoMovieMotionHumanWalkFoot.IFoot;
};
