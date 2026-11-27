import { AutoMovieEngineRomTolerance, AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanStagger,
  IAutoMovieMotionHumanTiming,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { prepareHumanAdaptiveKnots } from "../../posture/internal/prepareHumanAdaptiveKnots";
import type { prepareHumanKnotCourse } from "../../posture/internal/prepareHumanKnotCourse";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StaggerFeet } from "./StaggerFeet";
import { staggerArms } from "./staggerArms";
import { staggerBounds } from "./staggerBounds";
import { staggerContacts } from "./staggerContacts";
import { staggerRecover } from "./staggerRecover";
import { staggerRecovery } from "./staggerRecovery";
import { staggerResolved } from "./staggerResolved";
import { staggerRocking } from "./staggerRocking";
import { staggerShift } from "./staggerShift";

/*
 * A stagger: a blow pushes the centre of mass past the base of support and
 * recovery steps catch it.
 *
 * The centre of mass moves over the floor as an inverted pendulum of Hof's leg
 * length, 1.34 hip heights (Hof, Gazendam and Sinke 2005, J Biomech 38:1), from
 * the blow's speed along the push, its centre of pressure always as near the
 * extrapolated centre of mass `x + v / omega0`, `omega0 = sqrt(g / l)`, as the
 * bearing feet reach: on it, which holds it, or at the nearest point of their
 * outline, from which it runs on (Hof 2008, Hum Mov Sci 27:112). After the push
 * it moves without a jump: a weight shift carries it onto the stance foot
 * before each step, ending where the swing holds it, and onto a landed foot
 * only by the next shift, never at a touch-down. Each recovery step chooses its
 * time and its place within measured bounds, as capture-point stepping does
 * (Koolen et al. 2012, Int J Robot Res 31:1094; Griffin et al. 2017): the
 * weight shifts onto the stance foot over both feet, the foot swings in its
 * direction's step time and lands the sole point it lands on as near the
 * extrapolated centre of mass as its reachable footstep region allows, and the
 * body is caught once the extrapolated centre of mass lies inside the base the
 * two feet make. The region is the stance foot's: within its direction's
 * longest recovery step of where the foot stood beside the stance foot; a step
 * past it shortens toward the stance foot. The legs then admit each step at its
 * mid-swing and its landing, under the pelvis the centre of mass carries there:
 * each planted leg's reach, knee flexion and thigh extension as a two-bone
 * chain, and crossed legs clear of each other as the tangle audit reads them
 * (`staggerAdmission`, `walkLegClearance`); a step they do not hold refuses its
 * order of the feet. The legs may cross, a sole's length in front of or behind
 * the stance foot: a footstep planner's region on the stepping foot's own side
 * of the stance foot (Deits and Tedrake 2014) keeps a walking robot's legs
 * apart, but it forbids the crossover step people take in most lateral
 * recoveries, so it is not this region. Every order of the feet over up to four
 * steps is tried, the fewest steps first, so capture is monotone in the push's
 * speed; the order preferred alternates its feet forward and backward (Maki and
 * McIlroy 1997), beginning with the foot further along the push, the rear foot
 * for a push backward, and pushed sideways begins with the leg the push
 * unloads, which crosses in front of or behind the loaded one (Maki, McIlroy
 * and Perry 1996: 96% of lateral stepping responses), the loaded leg's
 * side-step being the other order. The bounds are those of younger adults at
 * the threshold of balance recovery: an 82 ms reaction and a 138 ms weight
 * shift before the first step (Cyr, Moglo and Smeesters 2005), steps of 238,
 * 176 and 193 ms and up to 0.59, 0.38 and 0.42 statures forward, sideways and
 * backward (Telonio, Cyr, Moglo and Smeesters 2005), read between those
 * directions on an ellipse; the leg a sideways push unloads leaves the floor
 * 20% sooner and swings 70% longer than a forward or backward step (Maki,
 * McIlroy and Perry 1996, `LATERAL`). A foot stepping forward strikes with its
 * heel and one stepping backward lands on its forefoot (Grasso, Bianchi and
 * Lacquaniti 1998). A push four steps do not catch is a fall, as people take up
 * to four recovery steps (Debelle, Maganaris and O'Brien 2021): it is refused,
 * naming the fastest push the body catches that way.
 *
 * Once caught, the other foot closes at least at the entry's stance width, as
 * far ahead or behind as stands the middle of the two ankles, as the entry
 * stood over its own, under where the extrapolated centre of mass will be when
 * it lands, and the close holds only with the extrapolated centre of mass then
 * inside the two feet's base (Hof 2008). The extrapolated centre of mass then
 * tracks a minimum-jerk course to where the body stood over its feet, its
 * centre of pressure placed by the divergent component's tracking law inside
 * the base (Englsberger, Ott and Albu-Schaffer 2015), and the centre of mass
 * follows it, `x' = omega0 (xi - x)`, until both rest within a millimetre.
 *
 * The body over its feet is read at each second from prepared courses
 * (`StaggerFeet`): the trunk bends about the hips against the fall, the hip
 * strategy (Horak and Nashner 1986, J Neurophysiol 55:1369), by the inclination
 * of the extrapolated centre of mass's lead over the pendulum's length, bounded
 * by the hip's extension and eased in from the measured reaction
 * (`staggerLean`, the relation provisional); the pelvis carries the centre of
 * mass's course less the shift that tilt makes of it, and is lowered to the
 * height its planted legs allow, as the walk settles its pelvis
 * (`walkReach.ground`), each heel rising about its ball where the ankle runs
 * out of room. A stepping foot first rises clear of the floor by the minimum
 * toe clearance of walking (`walkFoot.CLEARANCE`, Killeen et al. 2017), over
 * the share of its swing a walking foot takes to set down from that height,
 * then swings as a walking foot swings (`walkFoot.prepareSwing`) to the stance
 * it lands in, bowed clear of the standing foot by the soles' own clearance in
 * closed form (`staggerSwingBow`) and held inside its leg's ranges and as high
 * over the floor as its swing carries it (`walkReach.swing`), so it leaves and
 * joins its stances where they stand.
 *
 * Both arms abduct as balance reactions, 9.4 degrees from 154 ms after the push
 * (the mean of the two arms' abduction within 200 ms of a backward release,
 * 10.7 and 8.0 degrees, at its measured onset; Weerdesteyn, Laing and
 * Robinovitch 2008, Exp Brain Res 186:571), held through the steps and let down
 * as the body settles, each let out further where it would pass into the body,
 * read once for the plan as a gait reads its carriage
 * (`HumanArmSwing.carriage`), at knots AutoKnots places (Vitenti et al. 2024,
 * arXiv:2412.13423), and interpolated between. The steps, the catch and the
 * settling are the body's dynamics, which no manner changes; the manner's tempo
 * scales the righting.
 *
 * The push is read where its source is as the plan begins, the causal read a
 * reaction makes (`ReactionSource`).
 *
 * A performer standing on one foot, a kicker mid-kick, catches no push: the
 * stagger is refused, naming the speed it can catch.
 */
export namespace stagger {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "stagger";

  /*
   * A stagger's content is a staged loss of balance, so its balance is judged
   * (`IAutoMovieMotionHumanActionLaw.physical`).
   */
  export const physical: boolean = true;

  /*
   * Cancel table: a stagger flows into a guard or a knockdown.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      knockdown: ["anytime", "quick"],
    });

  /*
   * A reaction interrupts whatever the body was doing, at any instant, as a
   * reflex.
   */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /*
   * A forward recovery step's landing after the push (`staggerBounds.LANDING`),
   * the step's time `perturb` reads.
   */
  export const LANDING: IAutoMovieMotionHumanTiming.Span =
    staggerBounds.LANDING;

  /*
   * Plan a stagger.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the speed is not positive or the manner is out of
   * range.
   * `parameter` on `speed` when no `STEPS` recovery
   * steps catch the push: a fall, with the fastest push the body catches that
   * way.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStagger.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    // The push and the recovery it asks for (`staggerRecovery`); a push no
    // `STEPS` steps catch is a fall, refused with the fastest push this body
    // catches that way.
    const admitted: staggerRecovery.IAdmitted = staggerRecovery(context);
    if (admitted.recovery === null)
      throw staggerRecovery.refusal(context, admitted);
    return recovered(context, admitted.recovery, admitted.fixed);
  }

  /*
   * Plan an admitted stagger: the steps, the catch and the settling of a
   * recovery `staggerRecovery` laid.
   * Parameter context: The action's context.
   * Parameter recovery: The recovery that catches the push.
   * Parameter fixed: The entry geometry the recovery was laid from.
   * Returns: The plan.
   */
  export function recovered(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStagger.IParams>,
    recovery: staggerRecover.IRecovery,
    fixed: staggerRecovery.Fixed,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The first step's landing, the instant the clock names the catch by.
    const swing: number = recovery.steps[0]!.land;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(
      recovery.settled,
      [
        { name: "tipped", seconds: 0.5 * swing },
        { name: "caught", seconds: swing },
        { name: "stroke", seconds: swing },
        { name: "relax", seconds: swing },
      ],
    );
    const duration: number = clock.duration;
    const feet: StaggerFeet = new StaggerFeet(
      body,
      context.entry,
      recovery,
      fixed.bend,
    );
    const landing: Map<staggerRecover.IStep, IAutoMovieHumanLimbReference> =
      new Map();
    const rocking: ReturnType<typeof staggerRocking> = staggerRocking(
      body,
      context.entry,
      recovery,
      landing,
    );
    const settledEntry: number = feet.settle(0, feet.standing(0)).root.y;
    const reaction: number = AutoMovieMotionHumanTiming.seconds(
      staggerBounds.REACTION,
    );

    // The root's level shift at a second (`residual` below); none before the plan
    // solves it; the feet settle their steps' ends under the same reader
    // (`StaggerFeet.shifted`).
    let shiftAt: (
      seconds: number,
    ) => IAutoMovieVector3 = (): IAutoMovieVector3 => ({
      x: 0,
      y: 0,
      z: 0,
    });
    const legs: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        _projection?: Parameters<IAutoMovieMotionHumanPrimitive["write"]>[4],
      ): IAutoMovieMotionHumanPosture => {
        if (seconds <= 0) return entry;
        // The root carries the plan-time residual of the displayed centre of
        // mass from the pendulum's course (`shiftAt`), and the
        // pelvis is settled where that puts it, under the trunk's tilt: the
        // legs are fitted to the hips the pose shows.
        const reacting: number = AutoMovieEngineMotionSampling.minimumJerkShare(seconds / reaction);
        const shift: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
          shiftAt(seconds),
          reacting,
        );
        const solved: ReturnType<StaggerFeet["solve"]> = feet.solve(
          seconds,
          resolution,
          shift,
        );
        const settled: ReturnType<StaggerFeet["solve"]>["settled"] =
          solved.settled;
        const root: IAutoMovieVector3 =
          reacting === 1
            ? settled.root
            : {
                ...settled.root,
                y:
                  settled.root.y +
                  (entry.root.y - settledEntry) * (1 - reacting),
              };
        return rocking({ posture, solved, root, seconds, reacting });
      },
    };
    // Both arms abduct from the entry's angles as balance reactions and come
    // down as the body settles, each let out further where it would pass
    // into the body by its plan-time carriage (`carried`, `staggerArms`).
    const laid: { carriage?: (seconds: number) => readonly number[] } = {};
    const arms: IAutoMovieMotionHumanPrimitive = staggerArms(
      body,
      context.entry,
      recovery,
      duration,
      (): ((seconds: number) => readonly number[]) | undefined => laid.carriage,
    );
    // Each arm's let-out from the body (`HumanArmSwing.carriage`, the gait's
    // own clearance), read at plan time against the plan's own posture (its
    // dropped pelvis and swinging thighs) at knots AutoKnots places (Vitenti et
    // al. 2024, arXiv:2412.13423; `prepareHumanAdaptiveKnots`) to the
    // solver's own angular resolution (`AutoMovieEngineRomTolerance`); no pose query fits an
    // arm.
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: {
          ...AutoMovieMotionHumanBase.still(duration, {
            root: entry.root,
            yaw: entry.yaw,
            pitch: entry.pitch,
            roll: entry.roll,
            joints: entry.joints,
            limbs: {},
          }),
        },
        clock,
        primitives: [legs, arms],
      });
    const resolved: staggerResolved.IReader = staggerResolved(body);
    const frames: number =
      Math.ceil(duration / AutoMovieMotionHumanArmCourse.STEP) + 1;
    let sample: number = 0;
    const carriage: prepareHumanKnotCourse.ICourse = prepareHumanAdaptiveKnots({
      from: 0,
      to: duration,
      evaluate: (seconds: number): readonly number[] => {
        const need: Record<AutoMovieHumanSide, number> = resolved.carriage(
          sample++,
          composed.posture(seconds),
        );
        return [need.left, need.right];
      },
      tolerance: { kind: "absolute", absolute: AutoMovieEngineRomTolerance },
      maxKnots: frames,
    }).course;
    laid.carriage = (seconds: number): readonly number[] =>
      carriage.position(Math.min(duration, Math.max(0, seconds)));

    // The displayed centre of mass kept on the pendulum's course: the
    // residual of the displayed posture's centre of mass
    // (`HumanBalance.centre`) from the course's horizontal point is added to
    // the root, as the fixed point of the per-frame centre of mass correction
    // (Phillips and Badler 1991): the legs stand planted while the rest of the
    // body follows the root, so each step leaves the planted legs' share of
    // the residual, and the shift is the sum of that series, read from the
    // residual with no shift and the one its shift leaves (`staggerShift`).
    // Each residual is read at knots AutoKnots places to the arm solver's own
    // millimetre (`HumanArmTrajectoryTerms.TOLERANCE`).
    const residual = (): ((seconds: number) => IAutoMovieVector3) => {
      const course: prepareHumanKnotCourse.ICourse = prepareHumanAdaptiveKnots({
        from: 0,
        to: duration,
        evaluate: (seconds: number): readonly number[] => {
          const shown: IAutoMovieVector3 = resolved.centre(
            -1,
            composed.posture(seconds),
          );
          const travel: IAutoMovieVector3 = recovery.course(seconds);
          return [
            recovery.centre.x + travel.x - shown.x,
            recovery.centre.z + travel.z - shown.z,
          ];
        },
        tolerance: {
          kind: "absolute",
          absolute: HumanArmTrajectoryTerms.TOLERANCE / 1000,
        },
        maxKnots: frames,
      }).course;
      return (seconds: number): IAutoMovieVector3 => {
        const [x, z]: number[] = course.position(
          Math.min(duration, Math.max(0, seconds)),
        );
        return { x: x!, y: 0, z: z! };
      };
    };
    const first: (seconds: number) => IAutoMovieVector3 = residual();
    shiftAt = first;
    feet.shifted(shiftAt);
    const second: (seconds: number) => IAutoMovieVector3 = residual();
    shiftAt = (seconds: number): IAutoMovieVector3 =>
      staggerShift(first(seconds), second(seconds));
    feet.shifted(shiftAt); // A crossing leg may have two almost equal swivels; use the touchdown
    // solution through the approach and the ensuing stance. One scoped fit
    // per landing determines the branch with no previous-frame dependency.
    for (const step of recovery.steps) {
      const key: keyof IAutoMovieMotionHumanPosture["limbs"] = `${step.side}Leg`;
      const postfix: AutoMovieHumanoidBone = `${step.side}LowerLeg`;
      const wanted: ReadonlySet<AutoMovieHumanoidBone> =
        new Set<AutoMovieHumanoidBone>([postfix, `${step.side}Foot`]);
      const posture: IAutoMovieMotionHumanPosture = composed.posture(
        step.land,
        ["root", "trunk", key],
      );
      const solved: ReturnType<typeof resolveHumanPosture.seeded> =
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          undefined,
          undefined,
          wanted,
        );
      landing.set(step, HumanLimbFit.reference(solved.pose, key));
    }
    const contacts: IAutoMovieMotionHumanContactWindow[] = staggerContacts(
      recovery,
      duration,
    );
    return {
      ...composed,
      contacts,
      physicalWindow: { from: 0, to: recovery.settled },
    };
  }
}
