import { AutoMovieHumanConicLoft } from "./AutoMovieHumanConicLoft";
import { AutoMovieViewJointedCourse } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicPose,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * A conic family carried to a pose: what a change of its course's joint angles asks of the family besides moving its centres.
 *
 * A jointed course (`AutoMovieViewAxis.jointed`) rounds each interior centre by a turn of arclength `2 half`, which leaves both
 * neighbouring segments at the set-back `d` from the centre; between two turns the course is the segment's own line, a straight run.
 * The straight runs are bone and the turn is the joint, so a pose must keep each run on its bone:
 *
 * 1. **Set-back.** `d = half g(angle)` with `g` a function of the turn's angle alone (`share`, read from the engine's own preparation).
 *    At another angle the same `half` gives another set-back, and every station past the turn slides along its bone. A posed turn
 *    therefore takes `half' = half g(angle) / g(angle')`, which keeps `d`, and the turn's arclength changes by `2 (half' - half)`.
 * 2. **Stations.** Every station of the family (`knots`, `tips`, relief windows, roll knots) is carried by a piecewise-linear map from
 *    the reference course to the posed one (`map`). A run's skin rides one segment, the bone that ends at the run's far centre, so
 *    every station of a run keeps its distance from that centre; the first run keeps its distances from the first centre. A turn's span
 *    is mapped linearly onto what lies between its neighbours' runs: its own changed arclength and, where a run's near centre stands on
 *    another segment than its bone (a built corner fixed in the parent), whatever length the line between the two centres gained or
 *    lost. That length is absorbed at the joint the turn stands for, not along the bone.
 * 3. **Twist.** The chart is carried from `up` through each turn by that turn's own rotation, so a joint's rotation about its bone's
 *    axis moves no centre and leaves the chart where it was, while everything on the segments past it turns. The posed family takes a
 *    `roll` (`AutoMovieHumanConicLoft.IRoll`) that brings the chart on each run to where that run's segment carries the reference chart;
 *    along a run the roll goes linearly from the angle of the run before it, at its proximal joint, to its own at its distal joint, as a
 *    twist chain spreads a forearm's pronation along its length, and it holds its value across a turn.
 *
 * At the reference pose all three are exact no-ops: the halves, the stations and the arrays that hold them are the family's own.
 */
export namespace AutoMovieHumanConicPose {

  /** Twists under this many radians are none: far above the rounding of an angle between unit vectors (1e-16), far below any joint's motion. */
  const NO_TWIST: number = 1e-12;

  /**
   * A turn's set-back as a share of its half arclength, by its angle: the engine's own preparation of a made corner of that angle with a
   * half of 1 mm between two segments of 1 km (the set-back is linear in the half and does not read the lengths). A straight joint has
   * no turn; its share is the limit 1 of a vanishing angle, where the turn lies along both segments.
   */
  export function share(angle: number): number {
    if (angle === 0) return 1;
    const made: IAutoMovieViewJointedCourse.ICourse | string =
      AutoMovieViewJointedCourse.prepare(
        [
          [-1e6, 0, 0],
          [0, 0, 0],
          [1e6 * Math.cos(angle), 1e6 * Math.sin(angle), 0],
        ],
        [1],
      );
    if (typeof made === "string")
      throw new Error("pose: no turn of " + angle + " rad: " + made);
    return made.turns[0]!.setback;
  }

  /** The turn angle at each interior centre, radians, as the engine reads it: `atan2(|a x b|, a . b)` of the neighbouring unit directions. */
  export function angles(centres: readonly AutoMovieVector3Tuple[]): number[] {
    const directions: AutoMovieVector3Tuple[] = centres
      .slice(1)
      .map((p: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple => {
        const d: AutoMovieVector3Tuple = [
          p[0] - centres[i]![0],
          p[1] - centres[i]![1],
          p[2] - centres[i]![2],
        ];
        const l: number = Math.hypot(d[0], d[1], d[2]);
        return [d[0] / l, d[1] / l, d[2] / l];
      });
    return directions
      .slice(1)
      .map((b: AutoMovieVector3Tuple, i: number): number => {
        const a: AutoMovieVector3Tuple = directions[i]!;
        const n: AutoMovieVector3Tuple = [
          a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0],
        ];
        return Math.atan2(
          Math.hypot(n[0], n[1], n[2]),
          a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
        );
      });
  }

  /**
   * The halves that keep every turn's set-back when a course's centres move: `half' = half g(angle) / g(angle')`. At unchanged angles
   * the given array itself is returned.
   */
  export function halves(
    reference: readonly AutoMovieVector3Tuple[],
    given: number[],
    posed: readonly AutoMovieVector3Tuple[],
  ): number[] {
    const [from, to]: number[][] = [angles(reference), angles(posed)];
    const out: number[] = given.map((half: number, i: number): number =>
      from![i] === to![i] ? half : (half * share(from![i]!)) / share(to![i]!),
    );
    return out.every((half: number, i: number): boolean => half === given[i])
      ? given
      : out;
  }

  /** A course's runs and turns in arclength. A straight joint keeps its half as the stretch its set-backs span, which the engine walks as plain line. */
  export function course(
    centres: readonly AutoMovieVector3Tuple[],
    given: readonly number[],
  ): IAutoMovieHumanConicPose.ICourse {
    const lengths: number[] = centres
      .slice(1)
      .map((p: AutoMovieVector3Tuple, i: number): number =>
        Math.hypot(
          p[0] - centres[i]![0],
          p[1] - centres[i]![1],
          p[2] - centres[i]![2],
        ),
      );
    const turned: number[] = angles(centres);
    const setbacks: number[] = turned.map(
      (angle: number, i: number): number => given[i]! * share(angle),
    );
    const starts: number[] = [];
    let s: number = 0;
    for (let i: number = 0; i < turned.length; ++i) {
      s += lengths[i]! - (i >= 1 ? setbacks[i - 1]! : 0) - setbacks[i]!;
      starts.push(s);
      s += 2 * given[i]!;
    }
    return {
      lengths,
      angles: turned,
      halves: [...given],
      setbacks,
      starts,
      total: s + lengths.at(-1)! - (setbacks.at(-1) ?? 0),
    };
  }

  /** The stations where a course's law changes: its start, each turn's start and end, and its end. */
  function breaks(c: IAutoMovieHumanConicPose.ICourse): number[] {
    return [
      0,
      ...c.starts.flatMap((start: number, i: number): number[] => [
        start,
        start + 2 * c.halves[i]!,
      ]),
      c.total,
    ];
  }

  /**
   * The map of stations from a reference course to its posed course, of slope 1 on every run and before the first centre and past the
   * last, and linear across each turn's span. A run after a turn ends where the posed course's run ends, at its far centre's set-back,
   * and keeps its reference length back from there; the first run starts at the first centre. Each turn's span lies between its
   * neighbours' runs, so it takes the turn's own change of arclength and any change of the following segment's length. Null when the
   * two courses' breakpoints are the same numbers, where the map is the identity; a span left without length is refused.
   */
  export function map(
    reference: IAutoMovieHumanConicPose.ICourse,
    posed: IAutoMovieHumanConicPose.ICourse,
  ): IAutoMovieHumanConicPose.MapResult {
    const x: number[] = breaks(reference);
    const to: number[] = breaks(posed);
    // The posed breakpoints: each turn's start as the engine dates it, and each turn's span ending where the next run, of its reference
    // length, starts.
    const y: number[] = to.map((station: number, i: number): number =>
      i >= 2 && i % 2 === 0 && i + 1 < to.length
        ? to[i + 1]! - (x[i + 1]! - x[i]!)
        : station,
    );
    if (
      y.some(
        (station: number, i: number): boolean =>
          i >= 1 && !(station > y[i - 1]!) && x[i]! > x[i - 1]!,
      )
    )
      throw new Error("pose: a turn's span is left without length");
    if (x.every((s: number, i: number): boolean => s === y[i])) return null;
    return (station: number): number => {
      if (station <= x[0]!) return y[0]! + (station - x[0]!);
      for (let i: number = 1; i < x.length; ++i)
        if (station <= x[i]!)
          return x[i] === x[i - 1]
            ? y[i]!
            : y[i - 1]! +
                ((y[i]! - y[i - 1]!) * (station - x[i - 1]!)) /
                  (x[i]! - x[i - 1]!);
      return y.at(-1)! + (station - x.at(-1)!);
    };
  }

  /**
   * The roll that brings a posed family's chart on each run to where the run's segment carries the reference chart.
   *
   * On run `k` the angle is read at the run's middle: from the posed course's own chart `u`, carried from `up` by the turns alone, toward
   * `v`, to the reference course's own `u` there, carried likewise, as `carried` maps it into the pose. Each angle is taken on the branch nearest the run
   * before it, and an angle under `NO_TWIST` is none. The roll's knots stand at each run's two ends, with the angle of the run before
   * (the first run: its own) at its start and its own at its end, so the roll holds across every turn; it is the local eased law
   * (`AutoMovieHumanConicLoft.IRoll.eases`), each knot's ease the half length of the turn beside it, none at the course's two ends,
   * and where a run is shorter than its two eases together they share it in proportion. A run whose two angles are equal therefore
   * holds that angle exactly: one natural cubic through every knot stood 1e-9 rad off zero on the thigh of a leg whose foot alone
   * had turned, and a root whose planes must agree to 64 machine epsilons refused it. Absent when no run's angle reaches `NO_TWIST`.
   *
   * @param reference The family as stored, in the reference pose.
   * @param posed Its centres, halves and `up` at the pose, without a roll.
   * @param carried A direction of the reference pose on run `k`, as that run's segment carries it to the pose.
   */
  export function twist(reference: IAutoMovieHumanConicLoft.IFamily, posed: Pick<IAutoMovieHumanConicLoft.IFamily, "centres" | "halves" | "up">, carried: (run: number, direction: AutoMovieVector3Tuple) => AutoMovieVector3Tuple): IAutoMovieHumanConicLoft.IRoll | undefined {
    // A posed course the engine does not admit has no chart to read; the family is refused with the engine's own rule when it is lofted.
    if (typeof AutoMovieViewJointedCourse.prepare(posed.centres, posed.halves) === "string") return undefined;
    const [from, to]: IAutoMovieHumanConicPose.ICourse[] = [course(reference.centres, reference.halves), course(posed.centres, posed.halves)];
    const ends = (c: IAutoMovieHumanConicPose.ICourse): [number, number][] => c.lengths.map((_: number, k: number): [number, number] => [k === 0 ? 0 : c.starts[k - 1]! + 2 * c.halves[k - 1]!, k < c.starts.length ? c.starts[k]! : c.total]);
    const [runs, placed]: [number, number][][] = [ends(from!), ends(to!)];
    // Both charts are read as the turns alone carry them: a family's own roll rides on top of either and is no twist of a joint.
    const [stored, moved] = [AutoMovieHumanConicLoft.axis({ centres: reference.centres, halves: reference.halves, up: reference.up }), AutoMovieHumanConicLoft.axis({ centres: posed.centres, halves: posed.halves, up: posed.up })];
    const turned: number[] = [];
    for (let k: number = 0; k < runs!.length; ++k) {
      const target: AutoMovieVector3Tuple = carried(k, stored.at((runs![k]![0] + runs![k]![1]) / 2).u);
      const frame = moved.at((placed![k]![0] + placed![k]![1]) / 2);
      const angle: number = Math.atan2(target[0] * frame.v[0] + target[1] * frame.v[1] + target[2] * frame.v[2], target[0] * frame.u[0] + target[1] * frame.u[1] + target[2] * frame.u[2]);
      const before: number = turned.at(-1) ?? 0;
      const branch: number = angle + 2 * Math.PI * Math.round((before - angle) / (2 * Math.PI));
      turned.push(Math.abs(branch) < NO_TWIST ? 0 : branch);
    }
    if (turned.every((angle: number): boolean => angle === 0)) return undefined;
    const knots: number[] = [];
    const values: number[] = [];
    const eases: number[] = [];
    placed!.forEach(([start, end]: [number, number], k: number): void => {
      // The halves of the turns at this run's two ends, sharing the run where it is shorter than both.
      const [before, after]: [number, number] = [k === 0 ? 0 : to!.halves[k - 1]!, k < to!.halves.length ? to!.halves[k]! : 0];
      const share: number = before + after > end - start ? (end - start) / (before + after) : 1;
      // A joint without a turn's span leaves the run's start on the knot before it, which holds the same angle.
      if (knots.length === 0 || start > knots.at(-1)!) {
        knots.push(start);
        values.push(turned[Math.max(0, k - 1)]!);
        eases.push(before * share);
      }
      knots.push(end);
      values.push(turned[k]!);
      eases.push(after * share);
    });
    return { knots, values, eases };
  }

  /**
   * A family carried to a pose: its centres and `up` as given, its halves keeping every set-back, its stations mapped, and the roll its
   * joints' twists ask for. Its section values, layout and relief nets are the family's own arrays; where no station moves, so are its
   * `knots`, `tips` and reliefs. `station` maps a station of the reference family to the posed one.
   *
   * A family that already rolls its chart (`roll`) keeps that roll on mapped knots; such a family whose joints also twist is refused,
   * since one roll would have to carry both. A family's origin line (`origin`) is its own array too: one shift per knot in the section
   * chart, which the posed course carries with its frames, so it needs no mapping when the knots' stations are mapped.
   *
   * `stations` says what moved the centres. A pose (`"pose"`) keeps every bone's length, so the stations are mapped by `map`, of slope
   * one on every run. A person's segment lengths (`"material"`) stretch the runs themselves: the family keeps its stations as the
   * reference's material coordinate and its consumer reads the person's course through `AutoMovieHumanMaterialCourse`, so no station is
   * mapped here and `station` is null. The pose map must not carry a length: it puts a bone's whole change of length into the span of
   * the turn before it, and refuses a bone shortened by more than that span.
   */
  export function repose(family: IAutoMovieHumanConicLoft.IFamily, centres: AutoMovieVector3Tuple[], up: AutoMovieVector3Tuple, carried: (run: number, direction: AutoMovieVector3Tuple) => AutoMovieVector3Tuple, stations: "pose" | "material" = "pose"): { family: IAutoMovieHumanConicLoft.IFamily; station: ((station: number) => number) | null } {
    const posed: number[] = halves(family.centres, family.halves, centres);
    const station: ((station: number) => number) | null = centres.length < 3 || stations === "material" ? null : map(course(family.centres, family.halves), course(centres, posed));
    const twisted: IAutoMovieHumanConicLoft.IRoll | undefined = centres.length < 3 ? undefined : twist(family, { centres, halves: posed, up }, carried);
    if (twisted !== undefined && family.roll !== undefined) throw new Error("pose: " + family.name + " rolls its chart and its joints twist");
    const tip = (end: IAutoMovieHumanConicLoft.ITip | null): IAutoMovieHumanConicLoft.ITip | null => (end === null || station === null ? end : { ...end, from: station(end.from), tip: station(end.tip) });
    return {
      station,
      family: {
        ...family,
        centres,
        halves: posed,
        up,
        ...(twisted !== undefined ? { roll: twisted } : family.roll === undefined || station === null ? {} : { roll: { ...family.roll, knots: family.roll.knots.map(station) } }),
        ...(station === null
          ? {}
          : {
              knots: family.knots.map(station),
              ...(family.tips === undefined ? {} : { tips: [tip(family.tips[0]), tip(family.tips[1])] as [IAutoMovieHumanConicLoft.ITip | null, IAutoMovieHumanConicLoft.ITip | null] }),
              ...(family.reliefs === undefined ? {} : { reliefs: family.reliefs.map((relief: NonNullable<IAutoMovieHumanConicLoft.IFamily["reliefs"]>[number]): NonNullable<IAutoMovieHumanConicLoft.IFamily["reliefs"]>[number] => ({ ...relief, stations: [station(relief.stations[0]), station(relief.stations[1])] })) }),
            }),
      },
    };
  }
}
