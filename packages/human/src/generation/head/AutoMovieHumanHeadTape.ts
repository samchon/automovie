import { AutoMovieIllinois } from "@automovie/engine";
import type {
  IAutoMovieHumanHeadLayout,
  IAutoMovieHumanHeadTape,
  IAutoMovieHumanHeadTapeBrow,
  IAutoMovieHumanHeadTapeSource,
} from "@automovie/interface";

import { AutoMovieHumanHeadTapeBrow } from "./AutoMovieHumanHeadTapeBrow";
import { AutoMovieHumanHeadTapeSource } from "./AutoMovieHumanHeadTapeSource";

/** One accepted trial and its numerical course maximum. */
type Trial = IAutoMovieHumanHeadTape.Member & {
  power: number;
  course: IAutoMovieHumanHeadTape.ICourse;
};

/**
 * Close the public tape on a numerically maximizing actual source course.
 * ANSUR's above-brow/ear, front-higher/no-side-tilt protocol defines the
 * admissible planes. Closure fixes the existing G datum as an explicit
 * anterior brow-seat placement convention and searches the upper-head
 * original above its Me handover, subject to actual ear inequalities.
 * Neither datum is an additional measured personal tape landmark. Search is a
 * bounded numerical observation, not an interval/global optimality proof.
 *
 * @evidence contracts/common.md#principled-implementation Searches permitted planes on the actual native original and solves one retained cranial fullness family against the independent public tape, using source derivatives and the engine length owner.
 * @evidence contracts/common.md#clear-and-simple-design The caller owns the actual source family and ear attachment datums; this owner returns the selected original part and its measured witness together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No horizontal proxy, reference-fitted tilt, cohort target, mesh or silent target clamp closes the input. Missing brackets, unresolved source courses and an active artificial cranial boundary fail explicitly.
 * @evidence contracts/common.md#meaningful-documentation States protocol constraints, numerical search limits, factory preservation duties and the distinction between actual numerical closure and a global certificate.
 * @evidence contracts/performance.md#efficient-algorithms Each bounded scalar trial creates one original part and one reusable reader; course search has at most512 plane evaluations and scalar closure at most40 trials.
 * @evidence contracts/performance.md#reuse-equivalent-work A trial's admitted source serves every plane; the final chosen actual part is returned to production instead of regenerated from metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains only its current scalar bracket, selected trial and numerical witness; temporary sources/courses are call-owned and there is no global cache.
 */
export namespace AutoMovieHumanHeadTape {
  /**
   * Close the retained1.6..6 cranial diagonal-transfer family on its actual tape.
   * The factory must preserve all four guide curves, public calipers and the
   * original neck/face field below nasion while changing cranial fullness.
   * Ear attachment points must come from that unchanged material region.
   * Existing G supplies the fixed anterior-seat convention independently
   * of the tape target; Me bounds upper-source ownership, not a tape measure.
   *
   * Cost: every residual is a member whose course maximum needs many complete
   * course measurements. The closure therefore tracks the maximum by
   * continuation between members and certifies only the final member with the
   * complete search (see `solve`), instead of scanning every member
   * completely; the public target, the 1e-8 mm allowance and every refusal
   * are unchanged, and a failed certification repeats the former complete
   * procedure.
   *
   * @evidence contracts/common.md#principled-implementation A sign-changing scalar bracket and safeguarded secants solve the numerically maximizing native-source length against plan.tape; the existing1.6..6 representation range is not a cohort measurement.
   * @evidence contracts/common.md#clear-and-simple-design The actual factory owns shape authoring and this function returns its selected source with the measured witness.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not modify the target, calipers, lower source or ear datums, and an unavailable bracket is not silently saturated at a family end.
   * @evidence contracts/common.md#meaningful-documentation States the source factory's preservation contract, anatomical region and numerical/global-certificate limits.
   * @evidence contracts/performance.md#efficient-algorithms Two bracket members and at most40 source/maximum trials; each trial reuses one original reader and no loft is constructed.
   * @evidence contracts/performance.md#reuse-equivalent-work The chosen actual source is retained directly; scalar trials share immutable public input and attachment data.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the bracket and selected trial remain retained during solving; the final caller owns the returned source/witness.
   */
  export function close(
    plan: IAutoMovieHumanHeadLayout,
    factory: IAutoMovieHumanHeadTape.CloseFactory,
    attachments: readonly IAutoMovieHumanHeadTape.P2[],
  ): IAutoMovieHumanHeadTape.IResult {
    if (
      !(Number.isFinite(plan.tape) && plan.tape > 0) ||
      attachments.length === 0 ||
      attachments.some(
        (point: IAutoMovieHumanHeadTape.P2): boolean =>
          !point.every(Number.isFinite) || point[1] > plan.nasion,
      )
    )
      throw new Error(
        "Head tape needs a positive public target and unchanged below-nasion ear attachment datums",
      );
    const allowance: number = 1e-8 * Math.max(1, plan.scale);

    // A continued closure tracks the course maximum from member to member and
    // certifies the final member by the complete search. Should the complete
    // maximum differ from the tracked one (a different local maximum became
    // the largest), the closure is solved again with the complete search on
    // every member, which is the former procedure.
    const continued: IAutoMovieHumanHeadTape.IResult | null = solve(
      plan,
      factory,
      attachments,
      allowance,
      "continued",
    );
    if (continued !== null) return continued;
    const complete: IAutoMovieHumanHeadTape.IResult | null = solve(
      plan,
      factory,
      attachments,
      allowance,
      "complete",
    );
    if (complete === null)
      throw new Error(
        "Actual head tape complete-search closure did not certify its own final member",
      );
    return complete;
  }

  /**
   * One scalar closure of the family against the public tape.
   *
   * The family's course length increases with the cranial power over the
   * retained 1.6..6 range, so the residual `length - tape` changes sign
   * across it. Its root is found by the engine's Illinois regula falsi
   * (`AutoMovieIllinois`; Dowell and Jarratt, BIT 11, 1971), which keeps the
   * sign bracket like the former safeguarded secant but replaces its forced
   * bisection on every fourth step by the Illinois halving of a stagnant end,
   * converging superlinearly at this simple root. Each residual is one member
   * with its course maximum; members are memoised by power, and the previous
   * best member's posterior coordinate seeds the next maximum. The final
   * member is re-maximized by the complete search, and the result is
   * published only when that certified length meets the unchanged 1e-8 mm
   * allowance; otherwise null tells the caller to repeat with `complete`.
   */
  function solve(
    plan: IAutoMovieHumanHeadLayout,
    factory: (power: number) => IAutoMovieHumanHeadTape.Member,
    attachments: readonly IAutoMovieHumanHeadTape.P2[],
    allowance: number,
    mode: IAutoMovieHumanHeadTapeBrow.Mode,
  ): IAutoMovieHumanHeadTape.IResult | null {
    const trials: Map<number, Trial> = new Map();
    let best: Trial | null = null;
    const trial: (power: number) => Trial = (power: number): Trial => {
      const previous: Trial | undefined = trials.get(power);
      if (previous !== undefined) return previous;
      const member: IAutoMovieHumanHeadTape.Member = factory(power);
      const reader: IAutoMovieHumanHeadTapeSource.IReader =
        AutoMovieHumanHeadTapeSource.of(member.part);
      const current: Trial = {
        ...member,
        power,
        course: AutoMovieHumanHeadTapeBrow.maximum(
          reader,
          member.plan.menton,
          member.plan.landmarks.glabella[1],
          attachments,
          best?.course.coordinates,
          best === null ? "complete" : mode,
        ),
      };
      trials.set(power, current);
      if (
        best === null ||
        Math.abs(current.course.lengthMm - plan.tape) <
          Math.abs(best.course.lengthMm - plan.tape)
      )
        best = current;
      return current;
    };
    const low: Trial = trial(1.6);
    const high: Trial = trial(6);
    if (
      !(
        (low.course.lengthMm - plan.tape) *
          (high.course.lengthMm - plan.tape) <=
        0
      )
    )
      throw new Error(
        `Public head tape has no retained-family bracket: target=${plan.tape}, source lengths=${low.course.lengthMm},${high.course.lengthMm}`,
      );
    AutoMovieIllinois.root(
      (power: number): number => trial(power).course.lengthMm - plan.tape,
      1.6,
      6,
      allowance,
      40,
    );
    const selected: Trial = (best as Trial | null) ?? low;
    if (Math.abs(selected.course.lengthMm - plan.tape) > allowance)
      throw new Error(
        `Actual head tape scalar solve is unresolved: ${selected.course.lengthMm} versus ${plan.tape}`,
      );

    // The published course is the complete search's maximum on the selected
    // member, whatever search tracked it during the closure.
    const certified: IAutoMovieHumanHeadTape.ICourse =
      mode === "complete"
        ? selected.course
        : AutoMovieHumanHeadTapeBrow.maximum(
            AutoMovieHumanHeadTapeSource.of(selected.part),
            selected.plan.menton,
            selected.plan.landmarks.glabella[1],
            attachments,
            selected.course.coordinates,
            "complete",
          );
    if (Math.abs(certified.lengthMm - plan.tape) > allowance) return null;
    return {
      plan: selected.plan,
      part: selected.part,
      power: selected.power,
      course: certified,
      targetMm: plan.tape,
    };
  }

  /**
   * Numerically maximize regular front-higher/no-side-tilt cranial courses.
   *
   * @evidence contracts/common.md#principled-implementation Actual plane anchors range above glabella and within the retained cranial region; both ear attachment inequalities are checked in world sagittal coordinates before original-source integration.
   * @evidence contracts/common.md#clear-and-simple-design The best admitted coarse start at each posterior-coordinate column receives simplex refinement under one shared evaluation budget, avoiding a single basin selected only by the longest coarse sample.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only explicit range/anatomical exclusions and the original crown-pole endpoint are skipped. All producer, callback, getter, source/frame and quadrature errors propagate unchanged. An active artificial boundary or exhausted search resolution is refused; numerical search is not a global certificate.
   * @evidence contracts/common.md#meaningful-documentation States region, protocol inequalities, regular-course restriction and explicit numerical resolution.
   * @evidence contracts/performance.md#efficient-algorithms At most512 attempted plane measurements, each reusing the same admitted source and shared quadrature.
   * @evidence contracts/performance.md#reuse-equivalent-work Scalar closure can supply the previous optimum as an additional seed; all members borrow identical original scalar preparations.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The call retains only its best witness, source reader and scalar counters; no evaluated-plane or geometry cache survives.
   */
  export function maximum(
    reader: IAutoMovieHumanHeadTapeSource.IReader,
    region: IAutoMovieHumanHeadTape.MaximumRegion,
    attachments: readonly IAutoMovieHumanHeadTape.P2[],
    seed?: IAutoMovieHumanHeadTape.MaximumSeed,
  ): IAutoMovieHumanHeadTape.ICourse {
    const [first, brow, crown]: readonly [number, number, number] = region;
    if (
      !(
        reader.source.domain[0] <= first &&
        first < brow &&
        brow < crown &&
        crown === reader.source.domain[1]
      )
    )
      throw new Error(
        "Head tape source has no ordered original cranial region",
      );
    let evaluations: number = 0;
    let unavailable: number = 0;
    let best: IAutoMovieHumanHeadTape.ICourse | null = null;
    const coarse: IAutoMovieHumanHeadTape.ICourse[] = [];
    const measuredPlanes: Map<string, IAutoMovieHumanHeadTape.ICourse | null> =
      new Map();
    const evaluate: (
      u: number,
      v: number,
    ) => IAutoMovieHumanHeadTape.ICourse | null = (
      u: number,
      v: number,
    ): IAutoMovieHumanHeadTape.ICourse | null => {
      if (u < 0 || u > 1 || v < 0 || v > 1) return null;
      const key: string = `${u},${v}`;
      if (measuredPlanes.has(key)) return measuredPlanes.get(key)!;
      if (evaluations >= 512) return null;
      evaluations++;
      if (
        u === 1 &&
        (reader.part.pole === "top" || reader.part.pole === "both")
      ) {
        unavailable++;
        return null;
      }
      const front: number = brow + u * (crown - brow);
      const back: number = first + v * (front - first);
      const plane: IAutoMovieHumanHeadTapeSource.IPlane =
        AutoMovieHumanHeadTapeSource.plane(reader, front, back);
      if (
        attachments.some(
          (point: IAutoMovieHumanHeadTape.P2): boolean =>
            plane.a + plane.b * point[0] < point[1],
        )
      )
        return null;
      const measured: ReturnType<typeof AutoMovieHumanHeadTapeSource.measure> =
        AutoMovieHumanHeadTapeSource.measure(reader, plane, 2);
      const course: IAutoMovieHumanHeadTape.ICourse = {
        plane,
        ...measured,
        coordinates: [u, v],
        resolution: 1,
        evaluations,
        unavailable,
      };
      measuredPlanes.set(key, course);
      return course;
    };
    for (const u of [0, 0.5, 1])
      for (const v of [0, 0.5, 1]) {
        const candidate: IAutoMovieHumanHeadTape.ICourse | null = evaluate(
          u,
          v,
        );
        if (candidate !== null) coarse.push(candidate);
        if (
          candidate !== null &&
          (best === null || candidate.lengthMm > best.lengthMm)
        )
          best = candidate;
      }
    if (seed !== undefined) {
      const candidate: IAutoMovieHumanHeadTape.ICourse | null = evaluate(
        seed[0],
        seed[1],
      );
      if (
        candidate !== null &&
        (best === null || candidate.lengthMm > best.lengthMm)
      )
        best = candidate;
    }
    if (best === null)
      throw new Error(
        "No admitted original head tape plane in the anatomical source region",
      );
    const starts: IAutoMovieHumanHeadTape.ICourse[] = [best];
    for (const v of [0, 0.5, 1]) {
      const column: IAutoMovieHumanHeadTape.ICourse | undefined = coarse
        .filter(
          (course: IAutoMovieHumanHeadTape.ICourse): boolean =>
            course.coordinates[1] === v,
        )
        .sort(
          (
            a: IAutoMovieHumanHeadTape.ICourse,
            b: IAutoMovieHumanHeadTape.ICourse,
          ): number => b.lengthMm - a.lengthMm,
        )[0];
      if (column !== undefined && !starts.includes(column)) starts.push(column);
    }
    const maxima: IAutoMovieHumanHeadTape.ICourse[] = starts.map(refine);
    maxima.sort(
      (
        a: IAutoMovieHumanHeadTape.ICourse,
        b: IAutoMovieHumanHeadTape.ICourse,
      ): number => b.lengthMm - a.lengthMm,
    );
    const selected: IAutoMovieHumanHeadTape.ICourse = maxima[0]!;
    const step: number = selected.resolution;
    const upperBoundary: boolean = selected.coordinates[0] >= 1 - 2 * step;
    const lowerBoundary: boolean = selected.coordinates[1] <= 2 * step;
    if (upperBoundary || lowerBoundary)
      throw new Error(
        `Head tape maximum unresolved: ${JSON.stringify({ upperBoundary, lowerBoundary, region, coordinates: selected.coordinates, step, evaluations, unavailable, lengthMm: selected.lengthMm, differenceMm: selected.differenceMm, plane: selected.plane })}`,
      );
    return { ...selected, evaluations, unavailable };

    /** Refine one admitted basin; no producer failure is classified as an unavailable candidate. */
    function refine(
      initial: IAutoMovieHumanHeadTape.ICourse,
    ): IAutoMovieHumanHeadTape.ICourse {
      const simplex: IAutoMovieHumanHeadTape.ICourse[] = [initial];
      for (const component of [0, 1] as const) {
        let vertex: IAutoMovieHumanHeadTape.ICourse | null = null;
        for (const direction of [1, -1]) {
          const point: [number, number] = [...initial.coordinates];
          point[component] += direction / 8;
          vertex = evaluate(...point);
          if (vertex !== null) break;
        }
        if (vertex === null)
          throw new Error(
            "Head tape has no admitted nondegenerate numerical simplex",
          );
        simplex.push(vertex);
      }
      let step: number = Infinity;
      while (evaluations < 512) {
        simplex.sort(
          (
            a: IAutoMovieHumanHeadTape.ICourse,
            b: IAutoMovieHumanHeadTape.ICourse,
          ): number => b.lengthMm - a.lengthMm,
        );
        const leader: IAutoMovieHumanHeadTape.ICourse = simplex[0]!;
        step = Math.max(
          ...simplex
            .slice(1)
            .map((vertex: IAutoMovieHumanHeadTape.ICourse): number =>
              Math.hypot(
                vertex.coordinates[0] - leader.coordinates[0],
                vertex.coordinates[1] - leader.coordinates[1],
              ),
            ),
        );
        if (step <= 1e-7) break;
        const worst: IAutoMovieHumanHeadTape.ICourse = simplex[2]!;
        const centre: [number, number] = leader.coordinates.map(
          (value: number, index: number): number =>
            (value + simplex[1]!.coordinates[index]!) / 2,
        ) as [number, number];
        const moved: (
          factor: number,
        ) => IAutoMovieHumanHeadTape.ICourse | null = (
          factor: number,
        ): IAutoMovieHumanHeadTape.ICourse | null =>
          evaluate(
            centre[0] + factor * (centre[0] - worst.coordinates[0]),
            centre[1] + factor * (centre[1] - worst.coordinates[1]),
          );
        const reflected: IAutoMovieHumanHeadTape.ICourse | null = moved(1);
        if (reflected !== null && reflected.lengthMm > leader.lengthMm) {
          const expanded: IAutoMovieHumanHeadTape.ICourse | null = moved(2);
          simplex[2] =
            expanded !== null && expanded.lengthMm > reflected.lengthMm
              ? expanded
              : reflected;
        } else if (
          reflected !== null &&
          reflected.lengthMm > simplex[1]!.lengthMm
        )
          simplex[2] = reflected;
        else {
          const outside: boolean =
            reflected !== null && reflected.lengthMm > worst.lengthMm;
          const contracted: IAutoMovieHumanHeadTape.ICourse | null = moved(
            outside ? 0.5 : -0.5,
          );
          if (
            contracted !== null &&
            contracted.lengthMm >
              (outside ? reflected!.lengthMm : worst.lengthMm)
          )
            simplex[2] = contracted;
          else
            for (let index: number = 1; index < 3; index++) {
              const vertex: IAutoMovieHumanHeadTape.ICourse = simplex[index]!;
              const shrunk: IAutoMovieHumanHeadTape.ICourse | null = evaluate(
                (leader.coordinates[0] + vertex.coordinates[0]) / 2,
                (leader.coordinates[1] + vertex.coordinates[1]) / 2,
              );
              if (shrunk === null)
                throw new Error(
                  "Head tape numerical contraction has no admitted source plane",
                );
              simplex[index] = shrunk;
            }
        }
      }
      simplex.sort(
        (
          a: IAutoMovieHumanHeadTape.ICourse,
          b: IAutoMovieHumanHeadTape.ICourse,
        ): number => b.lengthMm - a.lengthMm,
      );
      const selected: IAutoMovieHumanHeadTape.ICourse = simplex[0]!;
      const exhausted: boolean = !(step <= 1e-7);
      if (exhausted)
        throw new Error(
          `Head tape numerical search budget unresolved: ${JSON.stringify({ region, coordinates: selected.coordinates, step, evaluations, unavailable })}`,
        );
      return { ...selected, resolution: step, evaluations, unavailable };
    }
  }
}
