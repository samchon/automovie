import type { IAutoMovieVector3 } from "@automovie/interface";

import { walkFoot } from "../actions/walkFoot";
import { walkReach } from "../actions/walkReach";
import { walkReachHeld } from "../actions/walkReachHeld";
import type { walkStanceCourse } from "../actions/walkStanceCourse";
import {
  AutoMovieMotionHumanAuditContact,
} from "../audit/AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanBalance } from "../everyday/HumanBalance";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import type { staggerRecover } from "./staggerRecover";

/**
 * The knots of a stagger's stance course (`walkStanceCourse`): the feet as
 * the recovery's steps place them, the centre of mass's course, the points
 * the feet bear, and the frame the pelvis stands in, at `KNOTS` a second;
 * with the trunk's shift of the centre of mass, the knee's hint and the
 * share of a swing a foot rises in, which the plan reads too.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the knots hold and who reads them.
 * @evidence contracts/development/design.md#principled-representation The course's knots with each one's pelvis frame, built once per solve.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The knots, their type and the readings the plan shares with them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is the body's own; the reference tilt and the knot rate are `staggerBounds`'.
 */
export namespace staggerKnots {
  /**
   * The centre of mass's shift per sine of the trunk's tilt about the hips,
   * on the entry's feet: the posture tilted `REFERENCE` degrees in pitch and
   * in roll (`AutoMovieMotionHumanLean.pivot`) and its centre of mass read
   * (`HumanBalance.centre`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param source Optional same-body FK source borrowed from the surrounding synchronous entry observation.
   * @param projector Optional genuine same-body ROM metadata borrowed by that same operation.
   * @returns The horizontal shift per sine of the pitch and of the roll, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the unchanged entry feet, REFERENCE tilt, sine normalization and horizontal world-metre result.
   * @evidence contracts/development/implementation.md#principled-implementation Measures the original whole-body centre on the entry's standing legs, tilts about the hips on each trunk axis, applies original leg lowering and divides each centre displacement by sin(REFERENCE).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing reference and one shared axis-trial reader produce the two actual bending vectors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original body, entry, pivot, lowering and reference angle; no fitted body proxy or sampled trajectory replaces the mass reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Every invocation performs the original three centre readings and two lowered trial postures; one fixed body/profile demand preparation serves those actual full fits/FK reads without replaying a prior invocation's bending.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous observation creates or borrows exact FK and genuine same-body ROM metadata for its three actual full centre solves and both lowerings. Fixed profile demand prepares once, while every current joint is still projected and every posture/goal solves normally. Recovery and displayed feet retain their separate original bending observations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local fixed FK demand and owned metadata end on return or throw; supplied metadata returns to its synchronous parent. Only two fresh shift vectors escape, without a dynamic reader, projector, posture, sampled history or handle.
   */
  export function bending(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    source?: Parameters<typeof prepareHumanPoseResolution>[0],
    projector?: ReturnType<typeof prepareHumanPostureProjection>,
  ): Record<"pitch" | "roll", IAutoMovieVector3> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(source);
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      projector ?? prepareHumanPostureProjection(body);
    const centreOf: ReturnType<typeof HumanBalance.prepareCentre> =
      HumanBalance.prepareCentre(body);
    const standing: IHumanPosture = {
      ...entry.posture,
      limbs: {
        ...entry.posture.limbs,
        ...StrikingStance.legs(body, StrikingTarget.feet(entry)),
      },
    };
    const upright: IAutoMovieVector3 = centreOf(
      standing,
      resolution,
      projection,
    );
    const sine: number = Math.sin((staggerBounds.REFERENCE * Math.PI) / 180);
    const shift: (more: walkStanceCourse.ITrunk) => IAutoMovieVector3 = (more: {
      pitch: number;
      roll: number;
    }): IAutoMovieVector3 => {
      const tilted: IHumanPosture = AutoMovieMotionHumanLean.pivot(
        body,
        standing,
        more,
      );
      const centre: IAutoMovieVector3 = centreOf(
        {
          ...tilted,
          root: resolveHumanPosture.lower(body, tilted, resolveHumanPosture.KNEE, resolution).root,
        },
        resolution,
        projection,
      );
      return {
        x: (centre.x - upright.x) / sine,
        y: 0,
        z: (centre.z - upright.z) / sine,
      };
    };
    return {
      pitch: shift({ pitch: staggerBounds.REFERENCE, roll: 0 }),
      roll: shift({ pitch: 0, roll: staggerBounds.REFERENCE }),
    };
  }

  /**
   * A stance course's pelvis at an instant: the upright root carries the
   * centre of mass's travel less the shift the trunk's tilt makes of it
   * (`bending`), so the centre keeps its course whatever the trunk does, and
   * the pelvis turns toward its stances (`walkReach.pelvis`) and tilts with
   * the trunk about the hips (`walkReachHeld.tilt`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param bend The shift per sine of the trunk's tilt.
   * @param travel The centre of mass's travel from the entry's, world metres.
   * @param feet Each foot as scheduled then.
   * @param resolution Optional exact FK source borrowed only while preparing the upright hips.
   * @returns The upright root and the pelvis under a trunk's tilt, and the pelvis's heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States centre-travel compensation, pre-drop root, trunk-dependent pelvis and fixed knot yaw.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original root formula, stance-directed upright pelvis and hips-pivot rigid tilt; moving hip x/z preserves hip+at-base arithmetic before the same tilt operation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Root arithmetic, one upright pelvis and fixed-heading tilt preparation precede the two varying-trunk readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps entry clinical hips, actual feet, body rest hip and every original translation/rotation grouping without changing support or centre goals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original upright pelvis preparation per knot; each requested trunk tilt uses constant work with precomputed upright inverse and rest offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned readers share only this knot's fixed body/entry/bending/travel/feet and upright heading; each varying trunk still produces its actual root/pelvis. An optional same-operation FK source reaches the actual upright hip reading, with all current dependencies checked by the canonical owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A knot owns fixed frame data and one tilt reader until its stance problem/course is released; its returned readers capture only geometric prerequisites, never the optional dynamic FK source or a time/pose history.
   */
  export function frame(
    body: IHumanActionContext["body"],
    entry: IHumanPosture,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    travel: IAutoMovieVector3,
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): {
    root: (trunk: walkStanceCourse.ITrunk) => IAutoMovieVector3;
    pelvis: (trunk: walkStanceCourse.ITrunk) => walkStanceCourse.IPelvis;
    yaw: number;
  } {
    /** Preserve each original raw root-field read in the frame's tilt compensation. */
    const rootAt: (trunk: walkStanceCourse.ITrunk) => IAutoMovieVector3 =
      (trunk: walkStanceCourse.ITrunk): IAutoMovieVector3 => {
        const p: number = Math.sin((trunk.pitch * Math.PI) / 180);
        const r: number = Math.sin((trunk.roll * Math.PI) / 180);
        return {
          x: entry.root.x + travel.x - bend.pitch.x * p - bend.roll.x * r,
          y: entry.root.y,
          z: entry.root.z + travel.z - bend.pitch.z * p - bend.roll.z * r,
        };
      };
    const base: IAutoMovieVector3 = rootAt({ pitch: 0, roll: 0 });
    const upright: walkReach.IPelvis = walkReach.pelvis(
      body,
      base,
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
      typeof resolution === "function" ? resolution() : resolution,
    );
    const tilt: ReturnType<typeof walkReachHeld.prepareTilt> = walkReachHeld.prepareTilt(body, upright.yaw);
    return {
      root: rootAt,
      pelvis: (trunk: walkStanceCourse.ITrunk): walkStanceCourse.IPelvis => {
        const at: IAutoMovieVector3 = rootAt(trunk);
        const moved: (hip: IAutoMovieVector3) => IAutoMovieVector3 = (hip: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: hip.x + at.x - base.x,
          y: hip.y,
          z: hip.z + at.z - base.z,
        });
        return tilt(
          at,
          { left: moved(upright.hips.left), right: moved(upright.hips.right) },
          trunk,
        );
      },
      yaw: upright.yaw,
    };
  }

  /**
   * The point a leg's knee bends toward: ahead over its foot's heading from
   * where the knee rests under the root.
   *
   * @param body The body.
   * @param root The lowered root, world metres.
   * @param yaw The pelvis's heading, degrees.
   * @param side The leg.
   * @param heading The foot's heading, degrees.
   * @param prepared Optional fixed-yaw rest-knee reader, or its world point already evaluated at this exact body/side/root/yaw by the same fixed instant.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world root/knee hint, degree headings and the optional fixed-yaw reader or exact same-root world rest-knee point.
   * @evidence contracts/development/implementation.md#principled-implementation Places the body's rest lower-leg joint under the supplied root/yaw, then adds unit forward under the actual foot heading, preserving the original two horizontal-frame transforms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the supplied exact world point, evaluate the fixed-yaw reader, or perform the ordinary first transform; the current foot-heading transform remains one shared owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the body's same-side knee offset and original unit-forward hint; prepared source products retain exact original arithmetic grouping.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant point work; a fixed-yaw reader avoids repeated trigonometry/products, and a fixed instant's actual world rest-knee point also omits the first translation/vector allocation. The current foot-heading transform always runs and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The reader fixes this body's same-side rest knee/yaw while accepting the actual root; an explicit world point additionally requires that exact fixed root. Changed prerequisites require another preparation, and no fitted knee or previous target supplies this authored reference.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh hint vector and retains neither supplied point/reader nor queried root; the hint exposes only newly transformed scalar values.
   */
  export function kneePole(
    body: IHumanActionContext["body"],
    root: IAutoMovieVector3,
    yaw: number,
    side: "left" | "right",
    heading: number,
    prepared?: ReturnType<typeof HumanFrame.preparePoint> | IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: (typeof prepared === "function" ? prepared(root) : prepared) ?? HumanFrame.point(
          { origin: root, yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading,
      },
      { x: 0, y: 0, z: 1 },
    );
  }
  /**
   * The share of a swing a stepping foot takes to rise clear of the floor:
   * the share of a walking swing its lift takes to set down from the
   * floor's contact height (`walkFoot.swing`).
   *
   * @param body The body.
   * @returns The share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the initial rise as a share of swing from the original contact-height and lift policy.
   * @evidence contracts/development/implementation.md#principled-implementation Inverts sin^2(pi*u) at the unchanged audit contact height over LIFT*hipHeight, as the walking-foot rise law requires.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit inverse-height expression owns the same rise share for knot scheduling and displayed feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original height, LIFT and body measure without clipping or tuning; the valid body/rise domain remains the caller's premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work, prepared once by each owning schedule/feet object.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both knot planning and displayed foot motion call this same original formula.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no body or sample.
   */
  export function risingOf(body: IHumanActionContext["body"]): number {
    return (
      Math.asin(
        Math.sqrt(
          AutoMovieMotionHumanAuditContact.HEIGHT /
            (staggerBounds.LIFT * body.measure.hipHeight),
        ),
      ) / Math.PI
    );
  }

  /**
   * A recovery's stance-course knots up to a second (`walkStanceCourse`):
   * at `KNOTS` a second, the feet standing where their last steps put them
   * and a swinging foot read at the place it left, for the pelvis's turn
   * alone, from its lift-off; the pelvis on the centre of mass's course
   * (`frame`); the feet bearing the centre of pressure, and the extrapolated
   * centre of mass once a step has caught it and both feet stand; a foot
   * that has landed free to turn out.
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @param bend The shift per sine of the trunk's tilt.
   * @param walk The steps, the pendulum's courses, the catching step's landing, seconds since the action's start, and the landing the course places, when one is.
   * @param until The last knot's second.
   * @returns The knots, each with its frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the knot clock, foot schedule, frame and borne pressure/capture points.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original schedule and catching/stance condition; course, pressure and requested extrapolation use the same integrated phase reading when supplied.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Schedule the feet, read course/frame/pressure and then the cold capture condition; an explicit paired producer can instead provide its same physical phase values together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original knot, foot claim, landing predicate and fallback reader. Without sample, caught is observed only after the original course, upright frame and pressure callbacks, preserving their current-source effects before capture is decided.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original knot/step loops remain; a supplied paired reader replaces repeated phase scans at each knot with one scan. One operation FK workspace shares checked hip-transform prerequisites across the original upright readings; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work StaggerPendulum owns shared formulas/phase selection and staggerClose forwards its same sample before the settling tail. Fixed body/clinical hips share only exact FK preparation across frames; every current root, stance heading and hip placement is still read normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned knots retain only original geometric frame/demand data. The local lazy FK workspace ends when construction returns or throws; it and the temporary paired samples are never retained by frame callbacks or a time-result cache.
   */
  export function of(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    walk: {
      steps: readonly staggerRecover.IStep[];
      course: (seconds: number) => IAutoMovieVector3;
      pressure: (seconds: number) => IAutoMovieVector3;
      extrapolated: (seconds: number) => IAutoMovieVector3;
      sample?: staggerRecover.ICourses["sample"];
      caught: number;
      landing?: {
        placement: HumanFoot.IPlacement;
        goal: IAutoMovieVector3;
        region: (ankle: IAutoMovieVector3) => number[];
      };
    },
    until: number,
  ): IKnot[] {
    const entered: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(entry);
    const rising: number = risingOf(body);
    const knots: IKnot[] = [];
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    for (let k: number = 0; k <= Math.ceil(until * staggerBounds.KNOTS - 1e-9); k++) {
      const t: number = Math.min(until, k / staggerBounds.KNOTS);
      const feet: Record<"left" | "right", walkFoot.IScheduled> = {
        left: { placement: entered.left, toes: 0 },
        right: { placement: entered.right, toes: 0 },
      };
      for (const step of walk.steps)
        if (t >= step.land - 1e-9)
          feet[step.side] = { placement: step.to, toes: 0 };
      for (const step of walk.steps)
        if (t > step.start && t < step.land - 1e-9)
          feet[step.side] = {
            placement: step.from,
            toes: 0,
            swing: {
              u: Math.max(
                0,
                ((t - step.start) / (step.land - step.start) - rising) /
                  (1 - rising),
              ),
              off: step.start,
              on: step.land,
            },
          };
      const stances: ("left" | "right")[] = (["left", "right"] as const).filter(
        (side: "left" | "right"): boolean => feet[side].swing === undefined,
      );
      // A cold reader may update caught while reading course or pressure;
      // only the explicit paired producer needs its capture request early.
      let capture: boolean | undefined;
      const reading: staggerRecover.IReading | undefined = walk.sample?.(
        t, (capture = t >= walk.caught && stances.length === 2),
      );
      const framed: ReturnType<typeof frame> = frame(body, entry.posture, bend, reading?.course ?? walk.course(t), feet, resolution);
      knots.push({
        seconds: k / staggerBounds.KNOTS,
        frame: framed,
        pelvis: framed.pelvis,
        borne: [
          reading?.pressure ?? walk.pressure(t),
          ...((capture ?? (t >= walk.caught && stances.length === 2))
            ? [reading?.extrapolated ?? walk.extrapolated(t)]
            : []),
        ],
        stances: stances.map(
          (side: "left" | "right"): walkStanceCourse.IStance => ({
            side,
            placement: feet[side].placement,
            turning: walk.steps.some(
              (step: staggerRecover.IStep): boolean =>
                step.side === side && t >= step.land - 1e-9,
            ),
            ...(walk.landing !== undefined &&
            feet[side].placement === walk.landing.placement
              ? {
                  landing: {
                    goal: walk.landing.goal,
                    region: walk.landing.region,
                  },
                }
              : {}),
          }),
        ),
      });
    }
    return knots;
  }

  /** A recovery's stance-course knot with its original pelvis frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Extends the shared knot with root/pelvis readers and the fixed world yaw from frame.
   * @evidence contracts/development/design.md#principled-representation Reuses the original stance knot's clock/supports and intersects its actual frame rather than duplicating those fields.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Sequential recovery needs the frame root and yaw for actual knee hints; the inherited model reads its pelvis and support data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Adds no body-specific pose or sampled result to the shared knot representation.
   */
  export type IKnot = walkStanceCourse.IKnot & { frame: ReturnType<typeof frame> };
}
