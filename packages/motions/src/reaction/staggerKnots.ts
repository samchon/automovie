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
   * The upright root carrying a centre course after the trunk's mass shift.
   *
   * @param entry The entry root, world metres.
   * @param bend The same entry's centre shift per sine of pitch and roll.
   * @param travel The centre's horizontal travel from the entry, world metres.
   * @param trunk The current pitch and roll in degrees.
   * @returns The translated root before stance lowering, at the entry height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world-metre inputs, sine-scaled trunk shift, angular units and unchanged entry height.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original frame root formula: entry plus centre travel minus each reference bending shift times the sine of its current trunk angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure root calculation serves both full knot frames and StaggerFeet settlement that needs no preliminary pelvis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the original subtraction order and entry height without changing body motion, targets or angles.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/vector work with no body traversal, pelvis solve or leg fit.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the frame's actual formula with settlement; each requested trunk/travel is evaluated directly and no time or pose result is memoized.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh root vector and retains no input, cache or handle.
   */
  export function root(
    entry: IAutoMovieVector3,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    travel: IAutoMovieVector3,
    trunk: walkStanceCourse.ITrunk,
  ): IAutoMovieVector3 {
    const p: number = Math.sin((trunk.pitch * Math.PI) / 180);
    const r: number = Math.sin((trunk.roll * Math.PI) / 180);
    return {
      x: entry.x + travel.x - bend.pitch.x * p - bend.roll.x * r,
      y: entry.y,
      z: entry.z + travel.z - bend.pitch.z * p - bend.roll.z * r,
    };
  }

  /**
   * The centre of mass's shift per sine of the trunk's tilt about the hips,
   * on the entry's feet: the posture tilted `REFERENCE` degrees in pitch and
   * in roll (`AutoMovieMotionHumanLean.pivot`) and its centre of mass read
   * (`HumanBalance.centre`).
   *
   * @param body The body.
   * @param entry The posture the push meets.
   * @returns The horizontal shift per sine of the pitch and of the roll, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the unchanged entry feet, REFERENCE tilt, sine normalization and horizontal world-metre result.
   * @evidence contracts/development/implementation.md#principled-implementation Measures the original whole-body centre on the entry's standing legs, tilts about the hips on each trunk axis, applies original leg lowering and divides each centre displacement by sin(REFERENCE).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing reference and one shared axis-trial reader produce the two actual bending vectors.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original body, entry, pivot, lowering and reference angle; no fitted body proxy or sampled trajectory replaces the mass reading.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three original centre readings and two lowered trial postures per preparation; callers explicitly share this invariant within their unchanged-entry operation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One synchronous operation lends its exact FK workspace to the three actual full centre solves and both lowerings; only unchanged scalar FK prerequisites are shared while every changed posture/goal still solves normally. A parent may borrow the actual completed bending only under the same unchanged body and entry, with no global result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One local lazy FK getter ends on return or throw; only two fresh shift vectors escape, without a reader, posture, sampled history or handle.
   */
  export function bending(
    body: IHumanActionContext["body"],
    entry: IHumanActionContext["entry"],
  ): Record<"pitch" | "roll", IAutoMovieVector3> {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const standing: IHumanPosture = {
      ...entry.posture,
      limbs: {
        ...entry.posture.limbs,
        ...StrikingStance.legs(body, StrikingTarget.feet(entry)),
      },
    };
    const upright: IAutoMovieVector3 = HumanBalance.centre(
      body,
      standing,
      resolution,
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
      const centre: IAutoMovieVector3 = HumanBalance.centre(
        body,
        {
          ...tilted,
          root: resolveHumanPosture.lower(body, tilted, resolveHumanPosture.KNEE, resolution).root,
        },
        resolution,
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
   * @returns The upright root and the pelvis under a trunk's tilt, and the pelvis's heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States centre-travel compensation, pre-drop root, trunk-dependent pelvis and fixed knot yaw.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original root formula, stance-directed upright pelvis and hips-pivot rigid tilt; moving hip x/z preserves hip+at-base arithmetic before the same tilt operation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Root arithmetic, one upright pelvis and fixed-heading tilt preparation precede the two varying-trunk readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps entry clinical hips, actual feet, body rest hip and every original translation/rotation grouping without changing support or centre goals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One original upright pelvis preparation per knot; each requested trunk tilt uses constant work with precomputed upright inverse and rest offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned readers share only this knot's fixed body/entry/bending/travel/feet and upright heading; each varying trunk still produces its actual root/pelvis.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A knot owns fixed frame data and one tilt reader until its stance problem/course is released; no time-query or pose history grows.
   */
  export function frame(
    body: IHumanActionContext["body"],
    entry: IHumanPosture,
    bend: Record<"pitch" | "roll", IAutoMovieVector3>,
    travel: IAutoMovieVector3,
    feet: Readonly<Record<"left" | "right", walkFoot.IScheduled>>,
  ): {
    root: (trunk: walkStanceCourse.ITrunk) => IAutoMovieVector3;
    pelvis: (trunk: walkStanceCourse.ITrunk) => walkStanceCourse.IPelvis;
    yaw: number;
  } {
    const rootAt: (trunk: walkStanceCourse.ITrunk) => IAutoMovieVector3 =
      (trunk: walkStanceCourse.ITrunk): IAutoMovieVector3 => root(entry.root, bend, travel, trunk);
    const base: IAutoMovieVector3 = rootAt({ pitch: 0, roll: 0 });
    const upright: walkReach.IPelvis = walkReach.pelvis(
      body,
      base,
      entry.yaw,
      entry.joints.hips ?? [0, 0, 0],
      feet,
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
   * @param prepared Optional fixed point reader prepared from this body's same-side rest knee at this exact yaw.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world root/knee hint, degree headings and the optional exact fixed-source knee transform.
   * @evidence contracts/development/implementation.md#principled-implementation Places the body's rest lower-leg joint under the supplied root/yaw, then adds unit forward under the actual foot heading, preserving the original two horizontal-frame transforms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The optional prepared first transform serves repeated fixed knot/side probes; the varying foot-heading transform remains unchanged.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the body's same-side knee offset and original unit-forward hint; prepared source products retain exact original arithmetic grouping.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant point work; a supplied fixed-source reader avoids the same yaw trigonometry/rest lookup/products across nearby leg-fit probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit reader belongs to this same body's rest knee, side and exact yaw; changing any source requires another preparation and every root/foot heading is evaluated directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh hint vector and retains neither the optional reader nor any queried root.
   */
  export function kneePole(
    body: IHumanActionContext["body"],
    root: IAutoMovieVector3,
    yaw: number,
    side: "left" | "right",
    heading: number,
    prepared?: ReturnType<typeof HumanFrame.preparePoint>,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: prepared?.(root) ?? HumanFrame.point(
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Schedule the feet, read the course values, construct the same frame and bearing knot.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original knot, foot claim, landing predicate and fallback reader; no extrapolated value is requested before the original capture condition.
   * @evidence contracts/development/implementation.md#efficient-algorithms The original knot/step loops remain; a supplied paired reader replaces repeated phase scans at each knot with one scan, and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work StaggerPendulum owns the shared formulas and phase selection; staggerClose forwards the same sample before its settling tail.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned knots retain only their original frame and geometric demands; the temporary paired reading is not retained or memoized by time.
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
      const capture: boolean = t >= walk.caught && stances.length === 2;
      const reading: staggerRecover.IReading | undefined = walk.sample?.(t, capture);
      const framed: ReturnType<typeof frame> = frame(body, entry.posture, bend, reading?.course ?? walk.course(t), feet);
      knots.push({
        seconds: k / staggerBounds.KNOTS,
        frame: framed,
        pelvis: framed.pelvis,
        borne: [
          reading?.pressure ?? walk.pressure(t),
          ...(capture
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
