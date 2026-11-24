import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Companion types of {@link HumanContactWindow}. */
export namespace HumanContactWindow {
  /** The body parts a contact window can name, as data. */
  export const PARTS = [
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
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanContactWindow["part"]
  >[];

  /**
   * The ways a part bears, as data. `bear` is a part that carries weight
   * without being a foot's plant: a knee or a shin on the floor, a palm on a
   * vault, a forearm on a table.
   */
  export const KINDS = [
    "plant",
    "pivot",
    "grip",
    "seat",
    "lie",
    "strike",
    "bear",
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanContactWindow["kind"]
  >[];

  /**
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

  /** The kinds that bear the body's weight when no `load` says otherwise. */
  export const BEARING: readonly IAutoMovieMotionHumanContactWindow["kind"][] =
    ["plant", "pivot", "seat", "lie", "bear"];

  /**
   * The samples per second a foot path is read at: the source's rate
   * ("Supersample data to 60 fps", `generate_database.py` below).
   */
  export const RATE: number = 60;

  /**
   * The toe speed below which a foot is in contact, metres per second
   * (`contact_velocity_threshold = 0.15`, `generate_database.py`).
   */
  export const THRESHOLD: number = 0.15;

  /**
   * The width of the majority vote over the contact samples
   * (`ndimage.median_filter(..., size=6, mode='nearest')`,
   * `generate_database.py`).
   */
  export const FILTER: number = 6;

  /**
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
   * @param props The declared windows, the plan's length and its toe path.
   * @returns The windows, the feet's timed by their path.
   * @throws {Error} When the plan is shorter than the four samples the source's
   *   end extrapolation reads.
   */
  export function fromPath(props: IPath): IAutoMovieMotionHumanContactWindow[] {
    const count: number = Math.floor(props.duration * RATE) + 1;
    if (count < 4)
      throw new Error(
        `A plan of ${props.duration} s holds fewer than the four samples a toe's velocity is extrapolated from`,
      );
    const seconds = (sample: number): number =>
      Math.min(props.duration, sample / RATE);
    const kept: IAutoMovieMotionHumanContactWindow[] = props.windows.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        !(FEET.includes(w.part as Foot) && BEARING.includes(w.kind)),
    );
    // Both toes at every sample, read once.
    const sampled: readonly Toes[] = Array.from(
      { length: count },
      (_: unknown, sample: number): Toes => props.toes(seconds(sample)),
    );
    const timed: IAutoMovieMotionHumanContactWindow[] = FEET.flatMap(
      (foot: Foot): IAutoMovieMotionHumanContactWindow[] => {
        const declared: IAutoMovieMotionHumanContactWindow[] =
          props.windows.filter(
            (w: IAutoMovieMotionHumanContactWindow): boolean =>
              w.part === foot && BEARING.includes(w.kind),
          );
        if (declared.length === 0) return [];
        const runs: readonly IRun[] = contacts(
          sampled.map((toes: Toes): IAutoMovieVector3 => toes[foot]),
        );
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
            return intent === undefined
              ? []
              : [
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
    return [...kept, ...timed];
  }

  /** A foot a path times. */
  export type Foot = "leftFoot" | "rightFoot";

  /** What a foot's windows are timed from. */
  export interface IPath {
    /** The plan's windows as the law declares them. */
    windows: readonly IAutoMovieMotionHumanContactWindow[];

    /** The plan's length, seconds. */
    duration: number;

    /**
     * Both feet's toe joints at an action second, each in the frame of the
     * support it bears on, metres.
     */
    toes: (seconds: number) => Toes;
  }

  /** Both feet's toe joints, metres. */
  export type Toes = Readonly<Record<Foot, IAutoMovieVector3>>;

  /** A run of samples in contact, inclusive. */
  export interface IRun {
    /** The run's first sample. */
    first: number;

    /** The run's last sample. */
    last: number;
  }

  /**
   * The contact runs of one toe path sampled at `RATE`: the source's velocity,
   * threshold and median filter.
   */
  function contacts(points: readonly IAutoMovieVector3[]): IRun[] {
    const n: number = points.length;
    const velocities: IAutoMovieVector3[] = points.map(
      (point: IAutoMovieVector3, t: number): IAutoMovieVector3 =>
        t === 0 || t === n - 1
          ? point
          : Vector3.add(
              Vector3.scale(
                Vector3.subtract(points[t + 1]!, point),
                0.5 * RATE,
              ),
              Vector3.scale(
                Vector3.subtract(point, points[t - 1]!),
                0.5 * RATE,
              ),
            ),
    );
    velocities[0] = Vector3.subtract(
      velocities[1]!,
      Vector3.subtract(velocities[3]!, velocities[2]!),
    );
    velocities[n - 1] = Vector3.add(
      velocities[n - 2]!,
      Vector3.subtract(velocities[n - 2]!, velocities[n - 3]!),
    );
    const raw: boolean[] = velocities.map(
      (velocity: IAutoMovieVector3): boolean =>
        Vector3.length(velocity) < THRESHOLD,
    );
    const before: number = Math.floor(FILTER / 2);
    const after: number = Math.floor((FILTER - 1) / 2);
    const filtered: boolean[] = raw.map((_: boolean, t: number): boolean => {
      let on: number = 0;
      for (let k: number = t - before; k <= t + after; k++)
        if (raw[Math.min(n - 1, Math.max(0, k))]) on++;
      return on >= FILTER - before;
    });
    const runs: IRun[] = [];
    filtered.forEach((on: boolean, t: number): void => {
      if (!on) return;
      const last: IRun | undefined = runs.at(-1);
      if (last !== undefined && last.last === t - 1) last.last = t;
      else runs.push({ first: t, last: t });
    });
    return runs;
  }

  /** The feet a path times. */
  const FEET: readonly Foot[] = ["leftFoot", "rightFoot"];
}
