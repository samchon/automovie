import { AutoMovieHumanCourseRuns as Runs } from "./AutoMovieHumanCourseRuns";
import { AutoMovieViewAxisJet as AxisJet } from "@automovie/engine";
import type {
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieHumanMaterialCourse,
} from "@automovie/interface";

/**
 * A person's course read in the reference's material stations: the section of material station `s` stands where the person's course
 * puts its own station `m(s)`, `m` the material map that carries every station by its place within its run
 * (`AutoMovieHumanCourseRuns.smooth`).
 *
 * This is how a segment length enters a family (the Human skill's Centres Before Curves, step 3). A family's knots, tips, relief
 * windows, rails, sites and scale profiles are all stations of one material coordinate, the reference's arclength; a longer bone does
 * not move any of those numbers, it stretches the stretch of course between its two joint centres that they are laid along. So a
 * length changes only the course, and every function of the station (the outlines, the fullness, a junction a port was calibrated on, a
 * scale profile's sites) keeps its own domain and its own continuity. The alternative, mapping every knot and window into the person's
 * arclength, leaves each consumer that holds a station of its own (a protected junction, a rail, a profile's anchor) reading another
 * section than its neighbour does.
 *
 * The course is no longer parameterized by arclength: its speed is `m'(s)`, the run's ratio. `m` is twice differentiable, so the
 * frame's 2-jet is exact by the chain rule and the lofted surface keeps the course's own continuity.
 */
export namespace AutoMovieHumanMaterialCourse {
  /**
   * The person's course in material stations.
   *
   * With `F` the course's frame as a function of its own station and `m` the map, `G(s) = F(m(s))`, so `G' = F' m'` and
   * `G'' = F'' m'^2 + F' m''` for the origin and both chart directions. A requested outline parameter converts that station jet once
   * through the engine's jet owner. The shared identity map returns the given course itself, so a person at the reference's lengths
   * reads the reference's course object and stays bit for bit.
   *
   * @param axis The person's course in its own stations, mm of arclength for a jointed course.
   * @param map The material map from the reference's stations to the person's, with its first two derivatives.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Function composition with the chain rule for the 2-jet; no finite difference and no resampling of the course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One identity branch, one frame read and one jet conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A course without a jet keeps none rather than a made one; a singular base jet stays null; a map whose slope is not finite and positive at the read station is refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One map read and one base read per query, constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The identity map borrows the given course; the map's jet serves value and derivatives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned course retains the given course and map only.
   * @evidence contracts/development/common.md#meaningful-documentation States the composition, its derivatives, the speed's meaning and the identity case.
   */
  export function create(axis: IAutoMovieViewAxis.IAxis, map: Runs.IMap): IAutoMovieViewAxis.IAxis {
    if (map === Runs.identity) return axis;
    const base: NonNullable<IAutoMovieViewAxis.IAxis["jet"]> | undefined = axis.jet;
    return {
      at: (station: number): IAutoMovieLoftSectionFrame => axis.at(map(station)),
      ...(base === undefined
        ? {}
        : {
            jet: (station: number, parameter?: IAutoMovieConstructionOutlineParameter): IAutoMovieViewAxisJet.IJet | null => {
              const [to, first, second]: [number, number, number] = map.jet(station);
              if (!(Number.isFinite(first) && first > 0 && Number.isFinite(second)))
                throw new Error("material course: the map does not rise at station " + station);
              const jet: IAutoMovieViewAxisJet.IJet | null = base(to);
              if (jet === null) return null;
              const moved = (key: "origin" | "u" | "v", order: 1 | 2): [number, number, number] =>
                [0, 1, 2].map((k: number): number =>
                  order === 1 ? jet.first[key][k]! * first : jet.second[key][k]! * first * first + jet.first[key][k]! * second,
                ) as [number, number, number];
              return AxisJet.parameter(
                {
                  value: jet.value,
                  first: { origin: moved("origin", 1), u: moved("u", 1), v: moved("v", 1) },
                  second: { origin: moved("origin", 2), u: moved("u", 2), v: moved("v", 2) },
                },
                parameter,
                station,
              );
            },
          }),
    };
  }

  /**
   * The material map of a jointed family from the reference's course to a person's: its run ends are the exact joints of each course
   * (`AutoMovieHumanCourseRuns.joints`) and each interior end's blend window is the reference turn's own half length, the stretch the
   * joint already bends over. Courses whose joints are the same numbers give the shared identity.
   *
   * @param reference The reference course's centres and turn half lengths.
   * @param person The person's course: the same centres through the person's frames, with the turns' half lengths at the person.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A segment's length moves its far joint, its run's stations keep their place within the run and the next run translates (the limb law's station law, #3151 step 2), made twice differentiable across each turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two joint readings handed to the one smooth map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unequal centre counts are refused; an inadmissible course and overlapping windows are refused by their owners.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two course preparations and one tridiagonal solve, linear in the centres.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal joints share the identity map.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The map retains two run arrays, the windows and the solved ratios.
   * @evidence contracts/development/common.md#meaningful-documentation Names the run ends, the windows and the identity case.
   */
  export function map(
    reference: { centres: readonly Runs.V3[]; halves: readonly number[] },
    person: { centres: readonly Runs.V3[]; halves: readonly number[] },
    hold?: IHold,
  ): Runs.IMap {
    if (reference.centres.length !== person.centres.length) throw new Error("material course: the two courses name different centres");
    const [from, to]: number[][] =
      reference.centres.length < 3
        ? [[0, Runs.length(reference.centres)], [0, Runs.length(person.centres)]]
        : [Runs.joints(reference.centres, reference.halves), Runs.joints(person.centres, person.halves)];
    const halves: readonly number[] = reference.centres.length < 3 ? [] : reference.halves;
    if (hold === undefined) return Runs.smooth(from!, to!, halves);
    if (!(hold.station > 0 && hold.window >= 0 && hold.station < from![1]! && hold.station < to![1]!))
      throw new Error("material course: the held root must end inside the first run of both courses");

    // The held root is a run of its own with the same end on both courses, so its ratio is one but for what the window lends.
    return Runs.smooth([0, hold.station, ...from!.slice(1)], [0, hold.station, ...to!.slice(1)], [hold.window, ...halves]);
  }

  /** The host-owned root run and its blend window. */
  export type IHold = IAutoMovieHumanMaterialCourse.IHold;
}
