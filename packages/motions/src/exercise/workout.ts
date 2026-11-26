import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPlayback,
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
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanChannel as HumanChannels } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { floorEntry } from "../floor/floorEntry";
import { HumanBound } from "../law/HumanBound";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanColliders } from "../posture/HumanColliders";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutBodyweight } from "./WorkoutBodyweight";
import { WorkoutDance } from "./WorkoutDance";
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
import { hangRings } from "./hangRings";
import { prepareWorkoutBlends } from "./prepareWorkoutBlends";
import { workoutContacts } from "./workoutContacts";
import { workoutFloorClearance } from "./workoutFloorClearance";
import { workoutFloorStance } from "./workoutFloorStance";
import { workoutLaidHands } from "./workoutLaidHands";
import { workoutSpans } from "./workoutSpans";
import { workoutWallSit } from "./workoutWallSit";

/**
 * An exercise, a stretch or a pose done on a support that is not only the feet,
 * or with the feet kept under a moving trunk: the body gets from standing into
 * the exercise's first posture, passes through the postures of each repetition,
 * and gets up again.
 *
 * The physics is kinematic and stated: every posture is a set of joint angles
 * and a whole-body tilt (`WorkoutKind`, `ExerciseKey`), passed through in joint
 * space on minimum-jerk progress, and the body is placed by what bears it. The
 * bones that bear (the toes of a push-up, the hands on a bar, the pelvis on a
 * bench, the feet of a squat) keep their mean place, so the body pivots about
 * its support and rises by what its limbs shorten. Hands that bear on the floor
 * are laid there by the arm's solve and stay. Nothing is integrated: no force,
 * no load and no balance check decides a posture.
 *
 * Events: `enter`; for each repetition `r` the kind's own pairs (such as
 * `lower1`, `bottom1`, `press1`, `top1`; `reach1`, `reachEnd1` for a held
 * pose); `release` and `relax`. With `stay`, the body is left on its support
 * and the plan declares that base. A succeeding exercise with the same floor
 * stance uses the incoming palms and bearing pins. An already lowered entry
 * approaches the first key from its displayed posture.
 *
 * First pass limits: the way down from standing and back is a blend of the two
 * postures with the root carried between them and kept above the floor, so the
 * feet slide while it lasts and no hand helps; equipment (bars, benches,
 * machines, ropes) is not shown and nothing is held; a kind's own table states
 * which of its supports are kept by angles alone.
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
    ...WorkoutDance.KINDS,
  };

  /**
   * Plan an exercise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number, the
   *   hold is negative, or a hanging kind names no bar.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWorkout.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanWorkout.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const kind: IAutoMovieMotionHumanWorkoutKind = KINDS[p.kind];
    const reps: number = HumanBound.whole("count", p.count ?? kind.count);
    if (p.hold !== undefined) HumanBound.least("hold", p.hold, 0, "s");
    const stay: boolean = p.stay === true;
    const floor: workoutFloorStance.IEntry = workoutFloorStance(context, kind);
    const heldFloorStance: boolean = floor.held;
    const entered: IAutoMovieMotionHumanPosture | null = floor.entered;
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const restoresStance: boolean = entered !== null && !stay;
    const standPlan: IAutoMovieMotionHumanActionPlan = stand.plan({
      ...context,
      params: restoresStance ? { hold: 1, sway: 0 } : { hold: 1 },
    });
    const standing: IAutoMovieMotionHumanPosture = standPlan.posture(0);
    // The opening standing reference can inherit a low root. A floor rise
    // returns to the same fully settled foot placement that stand solves.
    const recovery: ReturnType<typeof GymnasticsFlight.freeze> | null =
      restoresStance
        ? GymnasticsFlight.freeze(body, standPlan.posture(standPlan.duration))
        : null;

    // The support a prop gives: its affordance's place as the action starts.
    const borne: IAutoMovieVector3 | null =
      p.on === undefined ? null : WorkoutSupport.at(context, p.on);
    const route: readonly IAutoMovieMotionHumanWorkoutKind.IStep[] = kind.route(
      body,
      borne?.y,
    );
    const first: IAutoMovieMotionHumanWorkoutKind.IStep = route[0]!;
    const neutral: IAutoMovieMotionHumanExerciseKey.IKey =
      ExerciseKey.standing(body);
    const stood: IAutoMovieMotionHumanExerciseKey.IKey =
      recovery === null
        ? neutral
        : { ...neutral, joints: recovery.posture.joints };
    // Even a standing first key gives the second hand time to approach
    // before its declared grip. The 0.25 s setup is an authored stage beat.
    const loaded: boolean = p.load?.other !== undefined;
    const { phases, spans, between, held }: workoutSpans.IPlanned =
      workoutSpans({
        kind,
        route,
        reps,
        stay,
        hold: p.hold,
        stood,
        setup: heldFloorStance
          ? 0.25
          : loaded
            ? Math.max(0.25, kind.enter)
            : kind.enter,
        // Let the next action inherit the recovered two-foot stance.
        relax: recovery === null ? 0 : 0.12,
      });
    const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
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
    const at: IAutoMovieVector3 = WorkoutPlace(
      { context, kind, standing, first: first.key, borne },
      heldFloorStance,
    );
    const pins: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      kind.pin.map(
        (pin: IAutoMovieMotionHumanExerciseKey.Pin): AutoMovieHumanoidBone =>
          pin === "gripLeft" || pin === "gripRight"
            ? body.surfaces.sockets[pin].bone
            : pin,
      ),
    );
    const starts: number[] = spans.map((span: workoutSpans.ISpan): number =>
      clock.at(span.from),
    );
    const blends: ReturnType<typeof prepareWorkoutBlends> =
      prepareWorkoutBlends(spans);
    const floorBones: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      [...HumanColliders.bones(body)].filter(
        (bone: AutoMovieHumanoidBone): boolean =>
          !(kind.hands === true && ARM.test(bone)),
      ),
    );
    const floorClearance: ReturnType<typeof workoutFloorClearance> =
      workoutFloorClearance(body, floorBones);

    // How far the supported posture at the far end of each way down or up
    // sinks itself, by span, read once.
    const pin = (
      key: IAutoMovieMotionHumanExerciseKey.IKey,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture =>
      ExerciseKey.pinned(body, key, yaw, kind.pin, at, pins, read, project);
    const far: Map<IAutoMovieMotionHumanExerciseKey.IKey, number> = new Map();
    if (kind.anchor !== "stance" && kind.base !== "hanging") {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      for (const span of spans) {
        if (span.a !== stood && span.b !== stood) continue;
        const endpoint: IAutoMovieMotionHumanExerciseKey.IKey =
          span.a === stood ? span.b : span.a;
        if (!far.has(endpoint))
          far.set(
            endpoint,
            floorClearance(pin(endpoint, read, project), read, project),
          );
      }
    }
    const emptyBar =
      p.load === undefined && (p.kind === "snatch" || p.kind === "cleanAndJerk")
        ? WorkoutGym.prepareEmptyBar(body, p.kind)
        : undefined;
    function posture(
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        projection ?? prepareHumanPostureProjection(body);
      let lo: number = 0;
      let hi: number = starts.length;
      while (lo < hi) {
        const mid: number = Math.floor((lo + hi) / 2);
        if (seconds >= starts[mid]!) lo = mid + 1;
        else hi = mid;
      }
      const index: number = Math.max(0, lo - 1);
      const s: workoutSpans.ISpan = spans[index]!;
      const opened: number = starts[index]!;
      const length: number =
        (index + 1 < spans.length ? starts[index + 1]! : duration) - opened;
      const x: number =
        length > 1e-9
          ? Math.min(1, Math.max(0, (seconds - opened) / length))
          : 1;
      const u: number = minimumJerk.share(x);
      const key: IAutoMovieMotionHumanExerciseKey.IKey = blends[index]!(u);
      const placed: IAutoMovieMotionHumanPosture = pin(
        emptyBar === undefined ? key : emptyBar(key),
        read,
        project,
      );
      // A stance is where the body already stands.
      if (kind.anchor === "stance") return footed(placed);
      // How far the body is on its support: carried there from standing.
      const down: number =
        s.a === stood ? (s.b === stood ? 0 : u) : s.b === stood ? 1 - u : 1;
      if (down >= 1) return placed;
      const carried: IAutoMovieMotionHumanPosture = {
        ...placed,
        root: Vector3.lerp(
          s.b === stood && recovery !== null
            ? recovery.posture.root
            : standing.root,
          placed.root,
          down,
        ),
      };
      if (kind.base === "hanging") return carried;

      // The floor is a constraint on the way down and up, read on the body's
      // colliders as the floor audit reads them: the carried root is raised
      // by whatever the body would sink under the floor beyond the share the
      // way has reached of what the supported posture at the way's far end
      // sinks itself, so the way meets that posture continuously. Hands laid
      // on the floor are placed by the arm's solve after this, so a kind
      // that lays them is read without its keyed arms.
      const endpoint: IAutoMovieMotionHumanExerciseKey.IKey =
        s.a === stood ? s.b : s.a;
      const supported: number = far.get(endpoint)!;
      const rise: number = Math.max(
        0,
        floorClearance(carried, read, project) - down * supported,
      );
      return rise === 0
        ? carried
        : {
            ...carried,
            root: { ...carried.root, y: carried.root.y + rise },
          };
    }

    const work: string = spans[1]!.from;
    const workAt: number = clock.at(work);
    const from: number = heldFloorStance ? 0 : workAt / duration;
    const to: number = stay ? 1 : clock.at("release") / duration;
    const present = (seconds: number): number => {
      if (heldFloorStance)
        return stay ? 1 : 1 - clock.progress("release", "relax", seconds);
      return stay
        ? clock.progress("enter", work, seconds)
        : clock.envelope(["enter", work], ["release", "relax"], seconds);
    };
    const workoutPosture: IAutoMovieMotionHumanPrimitive["write"] = (
      _base,
      seconds,
      _before,
      resolution,
      projection,
    ) => posture(seconds, resolution, projection);
    const enterPosture: IAutoMovieMotionHumanPrimitive["write"] =
      entered === null
        ? workoutPosture
        : floorEntry.down(
            body,
            entered,
            workAt,
            (seconds: number): number =>
              minimumJerk.share(clock.progress("enter", work, seconds)),
            workoutPosture,
            entered,
          );
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
        : WorkoutLoad(
            context,
            p.load,
            kind.midfoot === true,
            p.kind === "cleanAndJerk" || p.kind === "snatch",
            from,
          );

    /**
     * The time-only keyed contribution, including any load owned by the
     * exercise.
     */
    const write: IAutoMovieMotionHumanPrimitive["write"] = (
      base: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(resolution);
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        projection ?? prepareHumanPostureProjection(body);
      const placed: IAutoMovieMotionHumanPosture = enterPosture(
        base,
        seconds,
        undefined,
        read,
        project,
      );
      return load === null ? placed : load.apply(placed, read, project);
    };
    // The support hand must seat at every authored work key. Entry blends
    // may approach the bar before the declared second grip begins.
    const admit: IAutoMovieMotionHumanWorkoutLoad.ILoad["admit"] = load?.admit;
    if (admit !== undefined) {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const project: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      const tested: Set<IAutoMovieMotionHumanExerciseKey.IKey> = new Set();
      const firstWork: number = clock.at(work);
      spans.forEach((span: workoutSpans.ISpan, index: number): void => {
        const at: number = starts[index]!;
        if (at < firstWork || at > to * duration || tested.has(span.a)) return;
        tested.add(span.a);
        admit(write(standing, at, undefined, read, project));
      });
    }
    const contacts: IAutoMovieMotionHumanContactWindow[] = workoutContacts({
      kind,
      prop: p.on?.prop,
      spans,
      starts,
      between,
      clock,
      from,
      to,
      recovers: recovery !== null,
    });
    const hung: typeof write = hangRings(write, context, contacts, duration);
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      { channels, reads: [], from: 0, to: duration, write: hung },
    ];
    if (kind.hands === true)
      primitives.push(
        ...workoutLaidHands({
          context,
          kind,
          first: first.key,
          yaw,
          at,
          pins,
          held: heldFloorStance,
          restored: recovery?.pose,
          present,
          clock,
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
            ...(loaded
              ? {
                  events: [
                    ...posed.events,
                    { name: "loadReady", share: from },
                  ].sort((a, b): number => a.share - b.share),
                }
              : {}),
            holds: load.holds,
            hands: load.hands,
          };
    const finished: IAutoMovieMotionHumanActionPlan = stay
      ? {
          ...composed,
          base:
            kind.base === "seated" ? { kind: "seated" } : { kind: kind.base },
        }
      : composed;
    const result: IAutoMovieMotionHumanActionPlan = workoutWallSit(
      context,
      finished,
      workAt,
      to * duration,
    );

    // Keep repetition selection in the indexed clock, including zero-length
    // keys. Laid hands still read the earlier channels through composition.
    const merge: ReturnType<typeof HumanChannels.prepareMerge> =
      HumanChannels.prepareMerge(channels);
    HumanPreparedPlayback.attach(result, body, {
      mode: "posture",
      phases: [
        {
          from: 0,
          to: duration,
          sample: (
            ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
          ): IAutoMovieMotionHumanPlayback.ISample => {
            const [seconds, demand, resolution, projection] = args;
            return {
              posture:
                result !== finished ||
                kind.hands === true ||
                demand !== undefined
                  ? result.posture(...args)
                  : merge(
                      standing,
                      hung(
                        standing,
                        seconds,
                        undefined,
                        resolution,
                        projection,
                      ),
                    ),
            };
          },
        },
      ],
    });
    return result;
  }
  /** The colliders of an arm, from the shoulder out. */
  const ARM: RegExp = /(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;
}
