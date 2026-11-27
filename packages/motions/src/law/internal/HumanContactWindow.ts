import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Companion types of HumanContactWindow.
 */
export namespace HumanContactWindow {
  /*
   * The body parts a contact window can name, as data.
   */
  export const PARTS: readonly IAutoMovieMotionHumanContactWindow["part"][] = [
    "leftFoot",
    "rightFoot",
    "leftHand",
    "rightHand",
    "seat",
    "back",
    "leftUpperArm",
    "rightUpperArm",
    "leftLowerArm",
    "rightLowerArm",
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "head",
    "chest",
  ];

  /*
   * The ways a part bears, as data. `bear` is a part that carries weight
   * without being a foot's plant: a knee or a shin on the floor, a palm on a
   * vault, a forearm on a table.
   */
  export const KINDS: readonly IAutoMovieMotionHumanContactWindow["kind"][] = [
    "plant",
    "pivot",
    "grip",
    "seat",
    "lie",
    "strike",
    "bear",
  ];

  /*
   * The surface region each part touches with when a window names no `region`:
   * a foot's sole, a hand's palm, the seat bones, the upper back, the outer
   * face of an arm segment, the front of a thigh and a knee, the back of the
   * head and the breastbone. The one table the audits read a window's contact
   * point from.
   */
  export const REGIONS: Readonly<
    Record<IAutoMovieMotionHumanContactWindow["part"], AutoMovieHumanoidRegion>
  > = {
    leftFoot: "soleLeft",
    rightFoot: "soleRight",
    leftHand: "palmLeft",
    rightHand: "palmRight",
    seat: "seat",
    back: "upperBack",
    leftUpperArm: "upperArmLeft",
    rightUpperArm: "upperArmRight",
    leftLowerArm: "forearmLeft",
    rightLowerArm: "forearmRight",
    leftUpperLeg: "thighFrontLeft",
    rightUpperLeg: "thighFrontRight",
    leftLowerLeg: "kneeLeft",
    rightLowerLeg: "kneeRight",
    head: "headBack",
    chest: "sternum",
  };

  /*
   * The kinds that bear the body's weight when no `load` says otherwise.
   */
  export const BEARING: readonly IAutoMovieMotionHumanContactWindow["kind"][] =
    ["plant", "pivot", "seat", "lie", "bear"];

  /*
   * The samples per second a foot path is read at: the source's rate
   * ("Supersample data to 60 fps", `generate_database.py` below).
   */
  export const RATE: number = 60;

  /*
   * The toe speed below which a foot is in contact, metres per second
   * (`contact_velocity_threshold = 0.15`, `generate_database.py`).
   */
  export const THRESHOLD: number = 0.15;

  /*
   * The width of the majority vote over the contact samples
   * (`ndimage.median_filter(..., size=6, mode='nearest')`,
   * `generate_database.py`).
   */
  export const FILTER: number = 6;

  /*
   * How far the animated toe may leave a locked contact before the lock lets
   * go, metres (`ik_unlock_radius = 0.2f`, `controller.cpp` below).
   */
  export const UNLOCK: number = 0.2;

  /*
   * The half-life of the blend into and out of a lock, seconds
   * (`ik_blending_halflife = 0.1f`, `controller.cpp`).
   */
  export const HALFLIFE: number = 0.1;

  /*
   * A plan's foot windows timed by its planned toe path.
   *
   * A port of orangeduck/Motion-Matching, `resources/generate_database.py` at
   * 346e8baa90e724b26c65ebfdf49729ebecb06b15 (MIT, "Copyright (c) 2021 Daniel
   * Holden"), lines 135-176: the toe's velocity by central difference at
   * `RATE`, `0.5 * (p[t+1] - p[t]) * 60 + 0.5 * (p[t] - p[t-1]) * 60`, the
   * first and last samples extrapolated as `v[0] = v[1] - (v[3] - v[2])` and
   * `v[-1] = v[-2] + (v[-2] - v[-3])`; a foot in contact where the toe's speed
   * is below `THRESHOLD`; then each foot's samples cleaned by a median filter
   * of `FILTER` samples in `nearest` mode, "a kind of majority vote" that
   * removes short runs. scipy's median filter takes the sample at rank `size //
   * 2` of the window from `size // 2` before the sample to `(size - 1) // 2`
   * after it, the ends repeating their edge sample, so a sample is in contact
   * where at least `FILTER - FILTER // 2` of its window are. The source reads
   * its toe joints only, with no height test; the toe here is each foot's
   * `Toes` bone origin, the metatarsophalangeal joint, read in the frame of the
   * support it bears on (contacts.md, "Measure slip ... in its frame"), which
   * on a static support is the world's.
   *
   * The law keeps its intent: which foot bears on which support, and how
   * (`kind`, `support`, `region`, `load`), as its declared windows state it. A
   * contact run of a foot becomes one window carrying the first declared
   * bearing window of that foot it overlaps, timed by the run; a run that
   * overlaps none, a foot the law holds in the air, bears on nothing. Every
   * other window is kept as declared.
   *
   * Each foot's contact is then locked as the same source's controller locks it
   * (`controller.cpp` `contact_update` with `spring.h`'s
   * `inertialize_transition`, `inertialize_update` and
   * `decay_spring_damper_implicit`, `common.h`'s `fast_negexpf`), run over the
   * toe's samples at the step `1 / RATE`: a contact that begins locks the toe
   * where it is shown, a contact that ends or an animated toe farther than
   * `UNLOCK` from the lock lets it go, and each change blends out by a
   * critically damped offset of half-life `HALFLIFE`. The source projects the
   * locked point onto its ground at the foot's height (`contact_point.y =
   * foot_height`); the lock is projected onto the plan's floor beneath it
   * (`IPath.floor`) the same way, and keeps the shown toe's height where the
   * plan gives no floor. The lock's offset from the animated toe at each sample
   * is what `locked` lays on the plan's leg goals, read linearly between
   * samples. Where the plan gives a floor, the shown contact is also held at
   * least at it, as the source clamps its IK target above its ground.
   * Parameter props: The declared windows, the plan's length and its toe path.
   * Returns: The windows, the feet's timed by their path, and the locks'
   * offsets.
   * When the plan is shorter than the four samples the source's
   * end extrapolation reads.
   */
  export function fromPath(props: IPath): IContacts {
    const count: number = Math.floor(props.duration * RATE) + 1;
    if (count < 4)
      throw new Error(
        `A plan of ${props.duration} s holds fewer than the four samples a toe's velocity is extrapolated from`,
      );
    const seconds = (sample: number): number =>
      Math.min(props.duration, sample / RATE);
    const kept: IAutoMovieMotionHumanContactWindow[] = props.windows.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        !(
          (w.part === "leftFoot" || w.part === "rightFoot") &&
          BEARING.includes(w.kind)
        ),
    );
    // Both toes at every sample, read once.
    const sampled: readonly Toes[] = Array.from(
      { length: count },
      (_: unknown, sample: number): Toes => props.toes(seconds(sample)),
    );
    const states: Record<Foot, readonly boolean[]> = {
      leftFoot: contacts(
        sampled.map((toes: Toes): IAutoMovieVector3 => toes.leftFoot),
      ),
      rightFoot: contacts(
        sampled.map((toes: Toes): IAutoMovieVector3 => toes.rightFoot),
      ),
    };
    // Each foot's contact labels, the source's `curr_bone_contacts`: the
    // detected runs a declared bearing window keeps, so a foot the law holds in
    // the air is never locked.
    const labels: Record<Foot, boolean[]> = {
      leftFoot: new Array<boolean>(count).fill(false),
      rightFoot: new Array<boolean>(count).fill(false),
    };
    const timed: IAutoMovieMotionHumanContactWindow[] = FEET.flatMap(
      (foot: Foot): IAutoMovieMotionHumanContactWindow[] => {
        const declared: IAutoMovieMotionHumanContactWindow[] =
          props.windows.filter(
            (w: IAutoMovieMotionHumanContactWindow): boolean =>
              w.part === foot && BEARING.includes(w.kind),
          );
        if (declared.length === 0) return [];
        const runs: readonly IRun[] = runsOf(states[foot]);
        return runs.flatMap(
          (run: IRun): IAutoMovieMotionHumanContactWindow[] => {
            const from: number = seconds(run.first);
            const to: number = seconds(run.last);
            const intent: IAutoMovieMotionHumanContactWindow | undefined =
              declared.find(
                (w: IAutoMovieMotionHumanContactWindow): boolean =>
                  w.from * props.duration <= to &&
                  from <= w.to * props.duration,
              );
            if (intent === undefined) return [];
            for (let s: number = run.first; s <= run.last; ++s)
              labels[foot][s] = true;
            return [
              {
                ...intent,
                from: from / props.duration,
                to: to / props.duration,
              },
            ];
          },
        );
      },
    );
    return {
      windows: [...kept, ...timed],
      offsets: {
        leftFoot: locks(
          sampled.map((toes: Toes): IAutoMovieVector3 => toes.leftFoot),
          labels.leftFoot,
          props.floor === undefined
            ? undefined
            : (toe: IAutoMovieVector3): number => props.floor!("leftFoot", toe),
        ),
        rightFoot: locks(
          sampled.map((toes: Toes): IAutoMovieVector3 => toes.rightFoot),
          labels.rightFoot,
          props.floor === undefined
            ? undefined
            : (toe: IAutoMovieVector3): number =>
                props.floor!("rightFoot", toe),
        ),
      },
    };
  }

  /*
   * A plan's posture with each foot's lock laid on its leg goal: the goal's
   * point and bend moved by the lock's offset from the animated toe at the
   * second (`fromPath`), as the source's controller moves the heel's IK target
   * by the locked contact's offset (`controller.cpp`). A leg with no world goal
   * is left as it is.
   * Parameter posture: The plan's posture at the second.
   * Parameter path: The plan's contacts, timed and locked.
   * Parameter seconds: The action's second.
   * Parameter duration: The plan's length, seconds.
   * Returns: The posture with its feet locked.
   */
  export function locked(
    posture: IAutoMovieMotionHumanPosture,
    path: IContacts,
    seconds: number,
    duration: number,
  ): IAutoMovieMotionHumanPosture {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const foot of FEET) {
      const leg: AutoMovieHumanLimb =
        foot === "leftFoot" ? "leftLeg" : "rightLeg";
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[leg];
      if (goal === undefined || goal.on !== undefined) continue;
      const table: readonly IAutoMovieVector3[] = path.offsets[foot];
      const at: number = Math.min(
        table.length - 1,
        Math.max(0, Math.min(seconds, duration) * RATE),
      );
      const k: number = Math.min(table.length - 2, Math.floor(at));
      const offset: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
        table[k]!,
        table[k + 1]!,
        at - k,
      );
      limbs[leg] = {
        ...goal,
        point: AutoMovieEngineVector3.add(goal.point, offset),
        bend: AutoMovieEngineVector3.add(goal.bend, offset),
      };
    }
    return { ...posture, limbs };
  }

  /*
   * A foot a path times.
   */
  export type Foot = "leftFoot" | "rightFoot";

  /*
   * What a foot's windows are timed from.
   */
  export interface IPath {
    /*
     * The plan's windows as the law declares them.
     */
    windows: readonly IAutoMovieMotionHumanContactWindow[];

    /*
     * The plan's length, seconds.
     */
    duration: number;

    /*
     * Both feet's toe joints at an action second, each in the frame of the
     * support it bears on, metres.
     */
    toes: (seconds: number) => Toes;

    /*
     * The least height a foot's toe joint may be shown at over the support
     * beneath a point of its frame, metres: that support's height there plus
     * the toe joint's height above its sole, the source's `ik_foot_height`
     * clamp (`controller.cpp`) over the plan's own supports. Absent, no lock is
     * clamped.
     */
    floor?: (foot: Foot, toe: IAutoMovieVector3) => number;
  }

  /*
   * Both feet's toe joints, metres.
   */
  export type Toes = Readonly<Record<Foot, IAutoMovieVector3>>;

  /*
   * A plan's feet timed and locked by their toe path.
   */
  export interface IContacts {
    /*
     * The plan's windows, the feet's timed by their path.
     */
    windows: IAutoMovieMotionHumanContactWindow[];

    /*
     * Each foot's lock offset from its animated toe at every sample of `RATE`,
     * world metres.
     */
    offsets: Readonly<Record<Foot, readonly IAutoMovieVector3[]>>;
  }

  /*
   * A run of samples in contact, inclusive.
   */
  export interface IRun {
    /*
     * The run's first sample.
     */
    first: number;

    /*
     * The run's last sample.
     */
    last: number;
  }

  /*
   * The contact states of one toe path sampled at `RATE`: the source's
   * velocity, threshold and median filter.
   */
  function contacts(points: readonly IAutoMovieVector3[]): boolean[] {
    const n: number = points.length;
    const velocities: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3, t: number): IAutoMovieVector3 =>
        t === 0 || t === n - 1
          ? point
          : AutoMovieEngineVector3.add(
              AutoMovieEngineVector3.scale(
                AutoMovieEngineVector3.subtract(points[t + 1]!, point),
                0.5 * RATE,
              ),
              AutoMovieEngineVector3.scale(
                AutoMovieEngineVector3.subtract(point, points[t - 1]!),
                0.5 * RATE,
              ),
            ),
    );
    // Four samples put index 3 at the endpoint. Establish its velocity
    // before the start's extrapolation, which reads that index as velocity.
    velocities[n - 1] = AutoMovieEngineVector3.add(
      velocities[n - 2]!,
      AutoMovieEngineVector3.subtract(velocities[n - 2]!, velocities[n - 3]!),
    );
    velocities[0] = AutoMovieEngineVector3.subtract(
      velocities[1]!,
      AutoMovieEngineVector3.subtract(velocities[3]!, velocities[2]!),
    );
    const raw: boolean[] = velocities.map(
      (velocity: IAutoMovieVector3): boolean =>
        AutoMovieEngineVector3.length(velocity) < THRESHOLD,
    );
    const before: number = Math.floor(FILTER / 2);
    const after: number = Math.floor((FILTER - 1) / 2);
    const filtered: boolean[] = raw.map((_: boolean, t: number): boolean => {
      let on: number = 0;
      for (let k: number = t - before; k <= t + after; k++)
        if (raw[Math.min(n - 1, Math.max(0, k))]) on++;
      return on >= FILTER - before;
    });
    return filtered;
  }

  /*
   * The runs of consecutive samples in contact.
   */
  function runsOf(states: readonly boolean[]): IRun[] {
    const runs: IRun[] = [];
    states.forEach((on: boolean, t: number): void => {
      if (!on) return;
      const last: IRun | undefined = runs.at(-1);
      if (last !== undefined && last.last === t - 1) last.last = t;
      else runs.push({ first: t, last: t });
    });
    return runs;
  }

  /*
   * One foot's lock offsets over its samples: the source's `contact_update` run
   * at the step `1 / RATE` from `contact_reset`, its blends by
   * `inertialize_transition` and `inertialize_update`, the offset of the shown
   * contact from the animated toe after each update, held above the floor
   * beneath it where one is given.
   */
  function locks(
    points: readonly IAutoMovieVector3[],
    states: readonly boolean[],
    floor?: (toe: IAutoMovieVector3) => number,
  ): IAutoMovieVector3[] {
    const dt: number = 1 / RATE;
    const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    // contact_reset.
    let state: boolean = false;
    let lock: boolean = false;
    let position: IAutoMovieVector3 = points[0]!;
    let point: IAutoMovieVector3 = points[0]!;
    let target: IAutoMovieVector3 = points[0]!;
    let offsetX: IAutoMovieVector3 = zero;
    let offsetV: IAutoMovieVector3 = zero;
    const out: IAutoMovieVector3[] = [];
    points.forEach((input: IAutoMovieVector3, t: number): void => {
      const inputState: boolean = states[t]!;
      const inputVelocity: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.subtract(input, target),
        1 / (dt + EPSILON),
      );
      target = input;

      // inertialize_update: decay the offset, then add it to the fed input.
      const y: number = (4 * LN2) / (HALFLIFE + DAMPING_EPSILON) / 2;
      const j1: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        offsetV,
        AutoMovieEngineVector3.scale(offsetX, y),
      );
      const eydt: number = negexp(y * dt);
      offsetX = AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.add(offsetX, AutoMovieEngineVector3.scale(j1, dt)),
        eydt,
      );
      offsetV = AutoMovieEngineVector3.scale(
        AutoMovieEngineVector3.subtract(offsetV, AutoMovieEngineVector3.scale(j1, y * dt)),
        eydt,
      );
      position = AutoMovieEngineVector3.add(lock ? point : input, offsetX);

      const unlock: boolean = lock && AutoMovieEngineVector3.distance(point, input) > UNLOCK;
      if (!state && inputState) {
        lock = true;
        // contact_point.y = foot_height: the floor beneath the lock.
        point = {
          ...position,
          y: floor === undefined ? input.y : floor(position),
        };
        offsetX = AutoMovieEngineVector3.subtract(AutoMovieEngineVector3.add(input, offsetX), point);
        offsetV = AutoMovieEngineVector3.add(inputVelocity, offsetV);
      } else if ((lock && state && !inputState) || unlock) {
        lock = false;
        offsetX = AutoMovieEngineVector3.subtract(AutoMovieEngineVector3.add(point, offsetX), input);
        offsetV = AutoMovieEngineVector3.subtract(offsetV, inputVelocity);
      }
      state = inputState;

      // The shown contact never passes through the support beneath it: its
      // height is held at least the floor's there (`controller.cpp`,
      // `contact_position_clamp.y = maxf(contact_position_clamp.y,
      // ik_foot_height)`), the lock's own state left unclamped as there.
      const shown: IAutoMovieVector3 =
        floor === undefined
          ? position
          : { ...position, y: Math.max(position.y, floor(position)) };
      out.push(AutoMovieEngineVector3.subtract(shown, input));
    });
    return out;
  }

  /*
   * `fast_negexpf` (`common.h`): the source's approximation of `exp(-x)`.
   */
  function negexp(x: number): number {
    return 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  }

  /*
   * `contact_update`'s `eps`, the finite difference's guard.
   */
  const EPSILON: number = 1e-8;

  /*
   * `halflife_to_damping`'s `eps`.
   */
  const DAMPING_EPSILON: number = 1e-5;

  /*
   * `LN2f`, `common.h`.
   */
  const LN2: number = 0.69314718056;

  /*
   * The feet a path times.
   */
  const FEET: readonly Foot[] = ["leftFoot", "rightFoot"];
}
