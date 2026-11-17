import { Vector3, minimumJerk, physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanWorkout,
  IAutoMovieMotionHumanWorkoutKind,
  IAutoMovieMotionHumanWorkoutLoad,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutBodyweight } from "./WorkoutBodyweight";
import { WorkoutEquipment } from "./WorkoutEquipment";
import { WorkoutFeet } from "./WorkoutFeet";
import { WorkoutFloor } from "./WorkoutFloor";
import { WorkoutGym } from "./WorkoutGym";
import { WorkoutHanging } from "./WorkoutHanging";
import { WorkoutLoad } from "./WorkoutLoad";
import { WorkoutLying } from "./WorkoutLying";
import { WorkoutPlace } from "./WorkoutPlace";
import { WorkoutPoses } from "./WorkoutPoses";
import { WorkoutStanding } from "./WorkoutStanding";
import { WorkoutSupport } from "./WorkoutSupport";

/**
 * An exercise, a stretch or a pose done on a support that is not only the
 * feet, or with the feet kept under a moving trunk: the body gets from
 * standing into the exercise's first posture, passes through the postures
 * of each repetition, and gets up again (#3377, #3378).
 *
 * The physics is kinematic and stated: every posture is a set of joint
 * angles and a whole-body tilt (`WorkoutKind`, `ExerciseKey`), passed
 * through in joint space on minimum-jerk progress, and the body is placed
 * by what bears it. The bones that bear (the toes of a push-up, the hands
 * on a bar, the pelvis on a bench, the feet of a squat) keep their mean
 * place, so the body pivots about its support and rises by what its limbs
 * shorten. Hands that bear on the floor are laid there by the arm's solve
 * and stay. Nothing is integrated: no force, no load and no balance check
 * decides a posture.
 *
 * Events: `enter`; for each repetition `r` the kind's own pairs (such as
 * `lower1`, `bottom1`, `press1`, `top1`; `reach1`, `reachEnd1` for a held
 * pose); `release` and `relax`. With `stay`, the body is left on its
 * support and the plan declares that base.
 *
 * First pass limits: the way down from standing and back is a blend of the
 * two postures with the root carried between them and kept above the floor,
 * so the feet slide while it lasts and no hand helps; equipment (bars,
 * benches, machines, ropes) is not shown and nothing is held; a kind's own
 * table states which of its supports are kept by angles alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the law plans, its physics, the events and the first pass limits.
 * @evidence contracts/development/design.md#principled-representation A law record over a table of kinds, each a route of keyed postures and a pin, so fifty exercises share one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every length follows from the body; the one share stated here is the bar's height above the reach.
 */
export namespace workout {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "workout";

  /** Cancel table: from the end, into standing, walking or another exercise. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      workout: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The exercises. */
  export const KINDS: Readonly<
    Record<IAutoMovieMotionHumanWorkout.Kind, IAutoMovieMotionHumanWorkoutKind>
  > = {
    ...WorkoutFloor.KINDS,
    ...WorkoutEquipment.KINDS,
    ...WorkoutGym.KINDS,
    ...WorkoutBodyweight.KINDS,
    ...WorkoutLying.KINDS,
    ...WorkoutStanding.KINDS,
    ...WorkoutPoses.KINDS,
    ...WorkoutHanging.KINDS,
  };

  /** One span of the plan: from an instant, between two keys. */
  interface ISpan {
    /** The instant that opens the span. */
    from: string;

    /** The key at its start. */
    a: IAutoMovieMotionHumanExerciseKey.IKey;

    /** The key at its end. */
    b: IAutoMovieMotionHumanExerciseKey.IKey;
  }

  /**
   * Plan an exercise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number, the hold is negative, or a hanging kind names no bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation One clock of spans, each between two keys; the posture at a second is the two keys' blend placed by the kind's pin, and on the way from and to standing the root is carried between the standing root and the pinned one; on the way off a bar the body is raised by whatever its colliders would sink beyond the share of the supported posture's own sink the way has reached, the reading the floor audit makes, so the floor is a constraint and the way meets the supported posture continuously.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock and spans, the pin's place, the posture function, the laid hands, the supports.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Lengths follow from the body; the floor rule reads the body's own shapes; the first pass limits are stated on the namespace.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three forward kinematics per evaluated second on the way down and up (the pin and the two floor readings), one while working, plus one arm solve per laid hand.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the keyed pin, the colliders' placement the floor audit reads, the placed arm and the standing plan.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock, the spans and the pin's place.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWorkout.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanWorkout.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const kind: IAutoMovieMotionHumanWorkoutKind = KINDS[p.kind];
    const reps: number = p.reps ?? kind.reps;
    HumanBound.whole("reps", reps);
    if (p.hold !== undefined) HumanBound.least("hold", p.hold, 0, "s");
    const stay: boolean = p.stay === true;
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const standing: IAutoMovieMotionHumanPosture = stand
      .plan({ ...context, params: { seconds: 1 } })
      .posture(0);

    // The support a prop gives: its affordance's place as the action starts.
    const borne: IAutoMovieVector3 | null =
      p.on === undefined ? null : WorkoutSupport.at(context, p.on);
    const route: readonly IAutoMovieMotionHumanWorkoutKind.IStep[] = kind.route(
      body,
      borne?.y,
    );
    const first: IAutoMovieMotionHumanWorkoutKind.IStep = route[0]!;
    const stayed = (step: IAutoMovieMotionHumanWorkoutKind.IStep): number =>
      step.held === true && p.hold !== undefined ? p.hold : step.hold;

    // The spans: down from standing, the repetitions, up again.
    const phases: IAutoMovieMotionClock.IPhase[] = [];
    const spans: ISpan[] = [];
    const held: string[] = [];
    const span = (
      from: string,
      seconds: number,
      a: IAutoMovieMotionHumanExerciseKey.IKey,
      b: IAutoMovieMotionHumanExerciseKey.IKey,
    ): void => {
      phases.push({ name: from, seconds });
      spans.push({ from, a, b });
    };
    const stood: IAutoMovieMotionHumanExerciseKey.IKey =
      ExerciseKey.standing(body);
    span("enter", kind.enter, stood, first.key);
    let last: IAutoMovieMotionHumanExerciseKey.IKey = first.key;
    for (let r: number = 1; r <= reps; r++) {
      for (let i: number = 1; i <= route.length; i++) {
        const step: IAutoMovieMotionHumanWorkoutKind.IStep =
          route[i % route.length]!;
        const key: IAutoMovieMotionHumanExerciseKey.IKey =
          i < route.length && kind.alternate === true && r % 2 === 0
            ? ExerciseKey.mirror(step.key)
            : step.key;
        span(`${step.leave}${r}`, step.seconds, last, key);
        span(`${step.event}${r}`, stayed(step), key, key);
        if (step.held === true) held.push(`${step.event}${r}`);
        last = key;
      }
    }
    if (!stay) span("release", kind.enter, last, stood);
    const left: IAutoMovieMotionHumanExerciseKey.IKey = stay ? last : stood;
    span("relax", 0, left, left);
    const clock: IAutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.sequence(phases),
      modifiers,
      { holds: held },
    );
    const duration: number = clock.duration;

    // Where the bearing bones stay.
    const yaw: number = standing.yaw;
    const footed: (
      placed: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanPosture = WorkoutFeet.keep(context, kind, yaw);
    const at: IAutoMovieVector3 = WorkoutPlace.of({
      context,
      kind,
      standing,
      first: first.key,
      borne,
    });

    // How far the supported posture at the far end of each way down or up
    // sinks itself, by span, read once.
    const far: Map<number, number> = new Map();
    const posture = (seconds: number): IAutoMovieMotionHumanPosture => {
      let index: number = 0;
      for (let i: number = 0; i < spans.length; i++)
        if (seconds >= clock.at(spans[i]!.from)) index = i;
      const s: ISpan = spans[index]!;
      const opened: number = clock.at(s.from);
      const length: number =
        (index + 1 < spans.length
          ? clock.at(spans[index + 1]!.from)
          : duration) - opened;
      const x: number =
        length > 1e-9
          ? Math.min(1, Math.max(0, (seconds - opened) / length))
          : 1;
      const u: number = minimumJerk(x).s;
      const placed: IAutoMovieMotionHumanPosture = ExerciseKey.pinned(
        body,
        ExerciseKey.blend(s.a, s.b, u),
        yaw,
        kind.pin,
        at,
      );
      // A stance is where the body already stands.
      if (kind.anchor === "stance") return footed(placed);
      // How far the body is on its support: carried there from standing.
      const down: number =
        s.a === stood ? (s.b === stood ? 0 : u) : s.b === stood ? 1 - u : 1;
      if (down >= 1) return placed;
      const carried: IAutoMovieMotionHumanPosture = {
        ...placed,
        root: Vector3.lerp(standing.root, placed.root, down),
      };
      if (kind.base === "hanging") return carried;

      // The floor is a constraint on the way down and up, read on the body's
      // colliders as the floor audit reads them: the carried root is raised
      // by whatever the body would sink under the floor beyond the share the
      // way has reached of what the supported posture at the way's far end
      // sinks itself, so the way meets that posture continuously. Hands laid
      // on the floor are placed by the arm's solve after this, so a kind
      // that lays them is read without its keyed arms.
      const sunk = (posture: IAutoMovieMotionHumanPosture): number => {
        let lowest: number = 0;
        for (const segment of HumanColliders.placed(
          body,
          poseBones(body, resolveHumanPosture(body, posture)),
        )) {
          if (kind.hands === true && ARM.test(segment.bone)) continue;
          for (const shape of segment.shapes)
            lowest = Math.min(
              lowest,
              physicalShapeBounds(segment.pose, shape).min.y,
            );
        }
        return -lowest;
      };
      const supported: number =
        far.get(index) ??
        sunk(
          ExerciseKey.pinned(
            body,
            s.a === stood ? s.b : s.a,
            yaw,
            kind.pin,
            at,
          ),
        );
      far.set(index, supported);
      const rise: number = Math.max(0, sunk(carried) - down * supported);
      return rise === 0
        ? carried
        : {
            ...carried,
            root: { ...carried.root, y: carried.root.y + rise },
          };
    };

    const work: string = spans[1]!.from;
    const present = (seconds: number): number =>
      stay
        ? clock.progress("enter", work, seconds)
        : clock.envelope(["enter", work], ["release", "relax"], seconds);
    const channels: AutoMovieMotionHumanChannel[] = [
      "root",
      "trunk",
      "head",
      "leftLeg",
      "rightLeg",
      ...(kind.hands === true ? [] : (["leftArm", "rightArm"] as const)),
    ];
    const load: IAutoMovieMotionHumanWorkoutLoad.ILoad | null =
      p.load === undefined
        ? null
        : WorkoutLoad.of(context, p.load, kind.midfoot === true);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels,
        from: 0,
        to: duration,
        write: (
          _: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture =>
          load === null ? posture(seconds) : load.apply(posture(seconds)),
      },
    ];
    if (kind.hands === true) {
      // The palms are laid under where the first posture has the hands.
      const set: IAutoMovieMotionHumanPosture = ExerciseKey.pinned(
        body,
        first.key,
        yaw,
        kind.pin,
        at,
      );
      const forward: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: 0, y: 0, z: 1 },
      );
      for (const side of ["left", "right"] as const) {
        const wrist: IAutoMovieVector3 = ExerciseKey.mean(body, set, [
          `${side}Hand`,
        ]);
        const laid: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.wrist(
          body,
          side,
          {
            point: { x: 0, y: 0, z: 0 },
            facing: { x: 0, y: -1, z: 0 },
            forward,
          },
        );
        const point: IAutoMovieVector3 = {
          x: wrist.x - laid.x,
          y: 0,
          z: wrist.z - laid.z,
        };
        primitives.push(
          ...AutoMovieMotionHumanPlaced.arm({
            body,
            side,
            from: 0,
            to: duration,
            rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
            weight: present,
            place: (): ReturnType<
              IAutoMovieMotionHumanPlaced.IArm["place"]
            > => ({
              point,
              facing: { x: 0, y: -1, z: 0 },
              forward,
            }),
          }),
        );
      }
    }

    const from: number = clock.at(work) / duration;
    const to: number = stay ? 1 : clock.at("release") / duration;
    const contacts: IAutoMovieMotionHumanContactWindow[] = kind.supports.map(
      (
        support: IAutoMovieMotionHumanWorkoutKind.ISupport,
      ): IAutoMovieMotionHumanContactWindow => ({
        part: support.part,
        kind: support.kind,
        from,
        to,
        support: { kind: "ground" },
      }),
    );
    const posed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        primitives,
      });
    const composed: IAutoMovieMotionHumanActionPlan =
      load === null
        ? posed
        : {
            ...posed,
            contacts: [...posed.contacts, ...load.contacts],
            holds: load.holds,
            hands: load.hands,
          };
    return stay
      ? {
          ...composed,
          base:
            kind.base === "seated" ? { kind: "seated" } : { kind: kind.base },
        }
      : composed;
  }

  /** The colliders of an arm, from the shoulder out. */
  const ARM: RegExp = /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;
}
