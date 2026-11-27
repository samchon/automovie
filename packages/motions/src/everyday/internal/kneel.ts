import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanKneel,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { prepareDryKneeSupport } from "../../floor/internal/prepareDryKneeSupport";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanPhysics } from "../../law/internal/HumanPhysics";
import { kneelContacts } from "./kneelContacts";
import { kneelHands } from "./kneelHands";
import { kneelKeys } from "./kneelKeys";
import { kneelPhaseTable } from "./kneelPhaseTable";
import { kneelWrite } from "./kneelWrite";
import { prepareKneelBalance } from "./prepareKneelBalance";
import { prepareKneelClock } from "./prepareKneelClock";
import { prepareKneelPhases } from "./prepareKneelPhases";

/*
 * Kneeling from standing: on one knee (half kneel), on both knees upright, or
 * sitting back on the heels, held, then rising the way it went down.
 *
 * The goals are floor points, solved by kneelKeys. The kneeling leg
 * steps back onto its tucked toes while the hips travel along the heading from
 * where they stand to where the step key puts them as the foot travels, so they
 * trail the foot and arrive after it lands; with the balance option
 * (`IAutoMovieMotionHumanBalance`) they run instead a course that keeps the
 * extrapolated centre of mass between the feet (the extrapolated-centre course;
 * Hof, Gazendam and Sinke 2005), going to the middle between the two feet.
 * Through the step the hips ride as high as the less extended leg reaches its
 * foot, the reach going from the standing leg's to `REACH` of its length, a
 * reverse lunge, and the pelvis tips forward by what keeps the leg behind
 * inside the hip's extension range (`kneelKeys.lean`). Then the hips lower
 * until the knee touches the floor straight under its hip joint with the thigh
 * upright, the shin lying back along the floor to the foot. For both knees the
 * front leg then swings back and its knee lands beside the first, and for
 * sitting back the hips turn about the knees toward the heels until the knees
 * flex `kneelKeys.SIT` degrees. Pollard, Porter and Redfern (2011, J Appl
 * Biomech 27:233) give the four kneeling postures. The hands rest on the thighs
 * as the body settles.
 *
 * Each phase moves on minimum-jerk progress; its length is provisional, scaled
 * by the square root of the hip height (Alexander 1984) and by the manner's
 * tempo. The root is lowered wherever a planted leg could not reach its foot.
 * Each foot plants while it keeps its floor point, and each knee on the floor
 * bears there (a `bear` window on its lower leg, at the knee) from the key it
 * comes down in until it leaves, both on the floor the feet stand on. Events:
 * `stepBack` at the start, `kneeContact`, `secondKnee` for both knees,
 * `seatOnHeels` for sitting back, `settled`, and when it rises `kneeOff` and
 * `stood`.
 */
export namespace kneel {
  /*
   * The pelvis travels over the supporting legs during the requested interval.
   */
  export const balance: IAutoMovieMotionHumanBalance = { by: "hips" };

  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "kneel";

  /*
   * Cancel table: the body stands, crouches or handles a low thing once it has
   * settled.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: "settled", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    crouch: [
      {
        window: { start: "settled", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    pickUp: [
      {
        window: { start: "settled", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    putDown: [
      {
        window: { start: "settled", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /*
   * How far of its full length the stepping leg extends to reach its foot
   * behind (provisional).
   */
  export const REACH: number = 0.98;

  /*
   * Seconds over which a lifted foot's toe-down turn eases in from and out to
   * its plants (provisional, as the medium walk's).
   */
  const EASE: number = 0.1;

  /*
   * Seconds of each phase for the reference hip height
   * (`walkRoot.REFERENCE_HIP`), scaled to a body by the square root of its own
   * hip height (dynamic similarity); the phases themselves have no located
   * measurement.
   */
  export const PHASES: Readonly<Record<PHASESEntryItem, number>> = {
    step: 0.7,
    lower: 1.0,
    second: 0.9,
    sit: 0.8,
  };

  /*
   * The swinging ankle's greatest rise over its straight path, as a share of
   * the shank (provisional).
   */
  export const CLEARANCE: number = 0.15;

  /*
   * Plan a kneel.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the hold is negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKneel.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const kind: IAutoMovieMotionHumanKneel.Kind = context.params.kind ?? "one";
    const k: AutoMovieHumanSide = context.params.knee ?? "right";
    const hold: number = context.params.hold ?? 1.5;
    const rise: boolean = context.params.rise ?? true;
    HumanBound.least("hold", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      context.params.manner,
    );
    const probe: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { hold: 1 } },
      k,
    );
    const standing: IAutoMovieMotionHumanPosture = probe.posture(0);
    const yaw: number = standing.yaw;
    const solved: kneelKeys.IKeys = kneelKeys.solve(
      body,
      standing,
      kind,
      k,
      context.params.at === undefined
        ? undefined
        : context.aim(context.params.at, 0).point,
    );
    const keys: kneelKeys.IKey[] = solved.keys;
    const length: number = m.thigh + m.shank;
    const kneeling: number = Vector3.dot(
      Vector3.subtract(keys[2]!.root, standing.root),
      solved.forward,
    );
    const aside: IAutoMovieVector3 = Vector3.subtract(
      { ...keys[2]!.root, y: standing.root.y },
      Vector3.add(standing.root, Vector3.scale(solved.forward, kneeling)),
    );

    // Phases: down through the keys, a hold, and back up when rising.
    const marks: string[] =
      kind === "one"
        ? ["kneeContact"]
        : kind === "both"
          ? ["secondKnee"]
          : ["seatOnHeels"];
    const phases: IPhase[] = kneelPhaseTable(
      m,
      keys.length,
      kind,
      marks,
      hold,
      rise,
    );
    const display: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(
        phases.map(
          (p: IPhase): IPlanDisplayResult => ({
            name: p.name,
            seconds: p.seconds,
          }),
        ),
      ),
      modifiers,
      { holds: ["settled"] },
    );
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      context.params,
      kneel,
      context.start,
      { duration: display.duration, events: display.events() },
      context.instant,
    );
    if (window !== null && window.by !== "hips")
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "balance.by",
        value: window.by,
        reason: "kneeling moves the hips along the supporting legs",
        fix: "give hips for balance.by",
      });
    const settled: number = display.at("settled");
    const next: IPhase | undefined =
      phases[
        phases.findIndex((phase: IPhase): boolean => phase.name === "settled") +
          1
      ];
    const release: number =
      next === undefined ? display.duration : display.at(next.name);
    const stationary: number = release - settled;
    const duration: number = display.duration - stationary;
    const movingSecond: (seconds: number) => number = (
      seconds: number,
    ): number => Math.min(settled, seconds) + Math.max(0, seconds - release);
    // Lay the changing body and arms only on the travel clock. The settled
    // interval has one geometry regardless of its duration after mannering.
    const clock: IAutoMovieMotionClock =
      stationary === 0
        ? display
        : AutoMovieMotionClock(
            duration,
            phases.map(
              (phase: IPhase): IAutoMovieMotionClockInstant => ({
                name: phase.name,
                seconds: movingSecond(display.at(phase.name)),
              }),
            ),
          );
    const at: ReturnType<typeof prepareKneelClock<IPhase>> = prepareKneelClock(
      clock,
      phases,
    );

    // A foot between two keys: pivoting on its toes' joint when that stays,
    // swinging on an arc when it moves.
    const geometry: ReturnType<typeof prepareKneelPhases> = prepareKneelPhases(
      body,
      keys,
      phases,
      CLEARANCE * m.shank,
      solved.pivot,
      kind === "sitBack",
    );

    // The body at a second. While it stands on its feet (the step and the
    // lowering, and their way back) the hips run a course along the heading
    // and ride as high as the less extended leg reaches its foot, down to the
    // kneeling height as the knee comes to the floor. `along` asks the hips'
    // place for the course's solve.
    type Course = (seconds: number) => number;
    const courses: Course[] = [];
    let landedKey: number | undefined;
    let landedBalance: number | undefined;
    const weightAt: (second: number) => number = (second: number): number =>
      HumanPhysics.weightAt(
        window,
        second > settled ? second + stationary : second,
      );
    const write: kneelWrite.Write = kneelWrite({
      body,
      standing,
      yaw,
      keys,
      solved,
      kneeling,
      aside,
      length,
      geometry,
      at,
      courses,
      weightAt,
      landedKey: (): number | undefined => landedKey,
      landedBalance: (): number | undefined => landedBalance,
      REACH,
      EASE,
    });
    // The courses. Without the balance option the hips travel the step's own
    // key line, from where they stand to where the step key puts them, on
    // that share (`IAutoMovieMotionHumanBalance`: no centre of mass is read).
    // With it, the extrapolated centre of mass goes from where it stands to
    // the middle between the feet (`AutoMovieMotionHumanCourse`); the
    // landing height is read from the step's own course first.
    const landing: number = clock.at(phases[1]!.name);
    const off: IPhase | undefined = phases.find(
      (p: IPhase): boolean => p.from === 2 && p.to === 1,
    );
    {
      const stepped: number = Vector3.dot(
        Vector3.subtract(keys[1]!.root, standing.root),
        solved.forward,
      );
      // The step key's place from the moment the foot lands; the way down
      // to the knee and back up to standing blend from it (`write`).
      const keyed: (seconds: number) => number = (seconds: number): number => {
        const { phase, u }: ReturnType<typeof at> = at(seconds);
        return stepped * (phase.from === 0 && phase.to === 1 ? u : 1);
      };
      landedKey = write(standing, landing, keyed(landing)).root.y;
      courses[0] = keyed;
      if (off !== undefined) courses[1] = keyed;
    }
    const downEnd: number = display.at(phases[2]!.name);
    const upStart: number = off === undefined ? Infinity : display.at(off.name);
    if (window !== null && (window.from < downEnd || window.to > upStart)) {
      const course: ReturnType<typeof prepareKneelBalance> =
        prepareKneelBalance({
          body,
          standing,
          forward: solved.forward,
          feet: keys[1]!.feet,
          yaw,
          at,
          write,
        });
      if (window.to > landing)
        landedBalance = write(
          standing,
          landing,
          course(0, landing, 0, landing)(landing),
        ).root.y;
      const blend: (keyed: Course, balanced: Course) => Course =
        (keyed: Course, balanced: Course): Course =>
        (second: number): number => {
          const key: number = keyed(second);
          const weight: number = weightAt(second);
          return weight === 0 ? key : key + weight * (balanced(second) - key);
        };
      if (window.from < downEnd)
        courses[0] = blend(
          courses[0]!,
          course(0, clock.at(phases[2]!.name), 0, movingSecond(window.to)),
        );
      if (off !== undefined && window.to > upStart)
        courses[1] = blend(
          courses[1]!,
          course(
            clock.at(off.name),
            duration,
            kneeling,
            movingSecond(window.to),
          ),
        );
    }
    const kneelBody: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "trunk", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        _before?: IAutoMovieMotionHumanPrimitive.Reader,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      ): IAutoMovieMotionHumanPosture =>
        write(posture, seconds, undefined, resolution),
    };

    const { hand, open }: kneelHands.IHands = kneelHands({
      context,
      body,
      clock,
      phases,
      next,
      duration,
    });
    const contacts: IAutoMovieMotionHumanContactWindow[] = kneelContacts(
      context,
      keys,
      phases,
      display,
      k,
    );
    const base: IAutoMovieMotionHumanActionPlan = stand.plan(
      { ...context, params: { hold: duration } },
      k,
    );
    // A kneel that rises leaves the body standing; one that stays down
    // leaves it kneeling (a base transition declares the base it
    // ends in).
    const course: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: { ...base, contacts },
        clock,
        contact: marks[0]!,
        primitives: [
          kneelBody,
          hand("left"),
          hand("right"),
          open("left"),
          open("right"),
        ],
      });
    // The settled kneel is prepared once and holds through the rest.
    const held: IAutoMovieMotionHumanPosture = course.posture(settled);
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds,
      channels,
      resolution,
      projection,
    ) =>
      settled <= seconds && seconds <= release
        ? held
        : course.posture(
            movingSecond(seconds),
            channels,
            resolution,
            projection,
          );
    return prepareDryKneeSupport(context, {
      ...course,
      ...HumanPhysics.declared(context.params, window),
      duration: display.duration,
      events: display.events(),
      posture,
      base: { kind: rise ? "standing" : "kneeling" },
      // The feet and knees carry the body, leaving the resting arms and head to overlays.
      yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
    });
  }

  /*
   * A phase between two key states.
   */
  type IPhase = kneelPhaseTable.IPhase;
}

/*
 * The record of `IPlanDisplayResult`'s site.
 */
type IPlanDisplayResult = { name: string; seconds: number };

/*
 * The alternatives of `PHASESEntryItem`'s site.
 */
type PHASESEntryItem = "step" | "lower" | "second" | "sit";
