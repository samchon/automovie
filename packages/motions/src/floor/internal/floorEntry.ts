import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { prepareHumanSampledCourse } from "../../posture/internal/prepareHumanSampledCourse";
import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";
import { knockdown } from "../../reaction/internal/knockdown";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";
import { floorArmRoom } from "./floorArmRoom";

/*
 * How a law that gets the body down onto the floor (a crawl, an inchworm, a lie
 * down) starts from the base it is entered on.
 *
 * Each such law has its own way down from standing. Entered off its feet, on
 * the knees or crouched over the hands (where a crawl ends), the body is
 * already low, so the law's first floor posture is reached by a blend from the
 * posture the entry displays, the hips carried straight between the two,
 * instead of from a standing body put back at the entry's root. A base with no
 * way down planned from it (lying, seated, hanging, leaning) is refused, so a
 * composition never jumps from one base to another.
 */
export namespace floorEntry {
  /*
   * Require both feet to bear before a law whose first phase crouches on them.
   * Parameter left: Whether the left foot is planted in the entry.
   * Parameter right: Whether the right foot is planted in the entry.
   * Parameter reason: The law's explanation of its entry demand.
   * Parameter fix: The law's correction for an unsupported entry.
   */
  export function bothFeet(
    left: boolean,
    right: boolean,
    reason: string,
    fix: string,
  ): void {
    if (left && right) return;
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: "not on both feet",
      feasible: { kind: "alternatives", values: ["standing"] },
      reason,
      fix,
    });
  }

  /*
   * The bases a floor law starts from: standing by its own way down, kneeling
   * and crouched by a blend from the displayed entry.
   */
  export const BASES: readonly IAutoMovieMotionHumanBase.Kind[] = [
    "standing",
    "kneeling",
    "crouched",
  ];

  /*
   * Whether a floor law is entered standing, refusing a base it has no way down
   * from.
   * Parameter context: The action's context.
   * Parameter action: The law's name, for the refusal.
   * Returns: `true` standing, `false` kneeling or crouched.
   * `base` on `base` for any other base, naming it and
   * the accepted ones.
   */
  export function standing(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    action: string,
  ): boolean {
    const kind: IAutoMovieMotionHumanBase.Kind = context.entry.base.kind;
    if (kind === "standing") return true;
    if (BASES.includes(kind)) return false;
    throw new HumanRefusal({
      kind: "base",
      axis: "base",
      value: kind,
      feasible: { kind: "alternatives", values: [...BASES] },
      reason: `${action} gets down onto the floor from standing, kneeling or crouched, and the body is ${kind} where it starts`,
      fix: "end the act before it on the feet or on the hands and knees; getting up from lying, sitting or hanging is not in the vocabulary yet",
    });
  }

  /*
   * Where a floor law starts.
   */
  export interface IStart {
    /*
     * The standing posture the law measures from: the stance it stands in, or
     * one over the entry when it does not stand.
     */
    standing: IAutoMovieMotionHumanPosture;

    /*
     * The displayed entry the way down blends from; null when the body enters
     * standing, since the law's own way down starts there.
     */
    entered: IAutoMovieMotionHumanPosture | null;
  }

  /*
   * Where a floor law starts: entered standing, the stance it stands in;
   * entered kneeling or crouched, an upright stance over the entry for its
   * geometry and the displayed entry for its way down.
   * Parameter context: The action's context.
   * Parameter action: The law's name, for the refusal.
   * Parameter over: What the stance off the feet stands over.
   * Parameter stood: The stance a standing entry stands in.
   * Returns: The start.
   * `base` for a base the law has no way down from
   * (`standing`).
   */
  export function start(
    context: Pick<IAutoMovieMotionHumanActionContext, StartContext>,
    action: string,
    over: StartOver,
    stood: () => IAutoMovieMotionHumanPosture,
  ): IStart {
    if (standing(context, action)) return { standing: stood(), entered: null };
    const entered: IAutoMovieMotionHumanPosture = displayed(context);
    return { standing: referenceFrom(context, over, entered), entered };
  }

  /*
   * A floor law's posture with its way down taken from the entry: the law's own
   * posture once its way down is done or when it was entered standing, and
   * before that the blend from the displayed entry to the law's posture at the
   * end of its way down, which is prepared here over the base the law is
   * written over.
   * Parameter body: The body.
   * Parameter entered: The displayed entry; null when the law was entered standing.
   * Parameter at: The law's second at the end of its way down.
   * Parameter weight: How far down the body is at a second, in [0, 1].
   * Parameter posture: The law's posture at a second over a base posture.
   * Parameter base: The base posture the law is written over at `at`.
   * Returns: The posture at a second over a base posture.
   */
  export function down(
    body: IAutoMovieMotionHumanBody,
    entered: IAutoMovieMotionHumanPosture | null,
    at: number,
    weight: (seconds: number) => number,
    posture: IAutoMovieMotionHumanPrimitive["write"],
    base: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPrimitive["write"] {
    if (entered === null) return posture;
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const arrived: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      body,
      posture(base, at, undefined, read, project),
      read,
      project,
    );
    const transition: ReturnType<typeof between> = between(
      body,
      entered,
      arrived,
    );
    return (
      over: IAutoMovieMotionHumanPosture,
      seconds: number,
      before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const w: number = weight(seconds);
      return w >= 1
        ? posture(over, seconds, before, resolution, projection)
        : transition(w);
    };
  }

  /*
   * The posture the entry displays, written by its joint angles alone: its
   * root, its heading read off the root's rotation and every joint's clinical
   * angles, so it resolves to the displayed pose itself.
   * Parameter context: The action's context.
   * Returns: The posture, with no limb goal.
   */
  export function displayed(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
  ): IAutoMovieMotionHumanPosture {
    const pose: IAutoMoviePose = context.entry.pose;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of pose.joints)
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    return { ...displayedFrame(context), joints, limbs: {} };
  }

  /*
   * Prepare a transition between two fixed postures written by joint angles
   * alone: every joint's angles, the heading the short way round and the tips
   * go by the weight, and the hips joint travels on the straight line between
   * its two places, the root following from it. Carrying the root instead would
   * swing the hips through the air between two tilted bodies, whose roots lie
   * far from their hips. Where the blended angles would put a limb deeper under
   * the floor than the two ends have it, the body is raised by the difference
   * (`knockdown.prepareRest`). That rise is solved here at evenly spaced
   * weights, as many as keep every arm within the audit's allowance between two
   * of them (`floorArmRoom.count`), and read between them from a knot course
   * (`prepareHumanKnotCourse`, Flash and Hogan's minimum-jerk path), so a read
   * evaluates closed forms only.
   */
  export function between(
    body: IAutoMovieMotionHumanBody,
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
  ): (weight: number) => IAutoMovieMotionHumanPosture {
    const interpolate: (
      weight: number,
    ) => IAutoMovieMotionHumanPosture["joints"] = prepareHumanShapeBlend(
      from.joints,
      to.joints,
    );
    const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
    const hipsAt: (weight: number) => IAutoMovieVector3 = Vector3.prepareLerp(
      hips(body, from),
      hips(body, to),
    );
    const carried = (weight: number): IAutoMovieMotionHumanPosture => {
      const lerp = (a: number, b: number): number => a + (b - a) * weight;
      const heading: Pick<IAutoMovieMotionHumanPosture, BetweenHeading> = {
        yaw: from.yaw + turn * weight,
        pitch: lerp(from.pitch, to.pitch),
        roll: lerp(from.roll, to.roll),
      };
      return {
        ...heading,
        root: Vector3.subtract(
          hipsAt(weight),
          Quaternion.rotateVector(
            humanPostureHeading(heading),
            body.rest.get("hips")!,
          ),
        ),
        joints: interpolate(weight),
        limbs: {},
      };
    };

    // The floor is a constraint on the way: angles blended between two
    // postures that rest on the floor can dip a limb under it, so the body is
    // raised by whatever sinks deeper than the two ends themselves do.
    const floor: ReturnType<typeof knockdown.prepareRest> =
      knockdown.prepareRest(body);
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const sunk = (posture: IAutoMovieMotionHumanPosture): number =>
      Math.max(0, floor(posture, read, project) - posture.root.y);
    const sunkFrom: number = sunk(from);
    const sunkTo: number = sunk(to);
    // The rise at knots AutoKnots places over the blend's weight (Vitenti et
    // al. 2024, arXiv:2412.13423) to the limb solver's millimetre
    // (`HumanArmTrajectoryTerms.TOLERANCE`), no finer than the blend's
    // clearance readings (`floorArmRoom.count`) space them.
    const rising: (seconds: number) => number[] = prepareHumanSampledCourse({
      from: 0,
      to: 1,
      sample: (w: number): number[] => [
        w <= 0 || w >= 1
          ? 0
          : Math.max(
              0,
              sunk(carried(w)) - (sunkFrom + (sunkTo - sunkFrom) * w),
            ),
      ],
      tolerance: {
        kind: "absolute",
        absolute: HumanArmTrajectoryTerms.TOLERANCE / 1000,
      },
      step: 1 / floorArmRoom.count(body, from, to),
    });
    return (weight: number): IAutoMovieMotionHumanPosture => {
      if (weight <= 0) return from;
      if (weight >= 1) return to;
      const posture: IAutoMovieMotionHumanPosture = carried(weight);
      const rise: number = Math.max(0, rising(weight)[0]!);
      return rise === 0
        ? posture
        : { ...posture, root: { ...posture.root, y: posture.root.y + rise } };
    };
  }

  /*
   * An upright stance at the entry, the reference a floor law measures its
   * geometry from when the body is not standing: over the floor under the
   * entry's hips, or under the middle of its ankles, heading the entry's way.
   * It is only the law's measure and is never shown, since the law blends from
   * the displayed entry (`stand.posture` at a floor point read off it).
   */
  function referenceFrom(
    context: Pick<IAutoMovieMotionHumanActionContext, ReferenceFromContext>,
    over: ReferenceFromOver,
    entered: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    const at: IAutoMovieVector3 =
      over === "hips"
        ? hips(context.body, entered)
        : Vector3.scale(
            Vector3.add(
              context.entry.feet.left.ankle,
              context.entry.feet.right.ankle,
            ),
            0.5,
          );
    return stand.posture(
      context.body,
      { x: at.x, y: 0, z: at.z },
      context.entry.posture.yaw,
    );
  }

  /*
   * Read the original displayed root/heading without copying unrelated joints
   * for a reference-only observation.
   */
  function displayedFrame(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
  ): Pick<IAutoMovieMotionHumanPosture, DisplayedFrameResult> {
    const pose: IAutoMoviePose = context.entry.pose;
    const posture: IAutoMovieMotionHumanPosture = context.entry.posture;
    return pose.root === undefined || pose.root === null
      ? {
          root: posture.root,
          yaw: posture.yaw,
          pitch: posture.pitch,
          roll: posture.roll,
        }
      : {
          root: pose.root.translation,
          ...humanPostureHeading.angles(pose.root.rotation),
        };
  }

  /*
   * Where a posture's hips joint is: its root plus the hips' rest place turned
   * by its heading.
   */
  function hips(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, HipsPosture>,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        humanPostureHeading(posture),
        body.rest.get("hips")!,
      ),
    );
  }
}

/*
 * The alternatives of `HipsPosture`'s site.
 */
type HipsPosture = "root" | "yaw" | "pitch" | "roll";

/*
 * The alternatives of `BetweenHeading`'s site.
 */
type BetweenHeading = "yaw" | "pitch" | "roll";

/*
 * The alternatives of `DisplayedFrameResult`'s site.
 */
type DisplayedFrameResult = "root" | "yaw" | "pitch" | "roll";

/*
 * The alternatives of `ReferenceFromOver`'s site.
 */
type ReferenceFromOver = "hips" | "feet";

/*
 * The alternatives of `ReferenceFromContext`'s site.
 */
type ReferenceFromContext = "body" | "entry";

/*
 * The alternatives of `StartOver`'s site.
 */
type StartOver = "hips" | "feet";

/*
 * The alternatives of `StartContext`'s site.
 */
type StartContext = "body" | "entry";
