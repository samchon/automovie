import type { AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { EquineFootwork } from "./EquineFootwork";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import { admitQuadrupedPhase } from "./admitQuadrupedPhase";
import type { createQuadruped } from "./createQuadruped";

/**
 * The bounded stride-phase plan of a quadruped ride: the hoof phase against film time, each stride's gait and lead, and each hoof's landing phases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phase clock, the stride decisions and the landing reader with its per-landing overrides.
 * @evidence contracts/development/design.md#principled-representation A monotone phase table over fixed cells of the moving hoof clock, one committed stride per integer phase, and landing phases as stride index plus the gait's fraction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `rideQuadruped`, once or, when a technique holds the hoof clock, again after that hold is known.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An override moves one named landing; the gait table is not changed.
 */
export namespace QuadrupedStridePlan {
  /** Phase cells over the course; each admits one stride decision, so capacity depends on duration rather than an asserted biological period floor. */
  export const STEPS: number = 2000;

  /**
   * One committed stride's gait, lead and explicitly selected rein-back footfalls.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the gait, the lead and the rein-back flag.
   * @evidence contracts/development/design.md#principled-representation The table's stride plus one flag for the diagonal backing pattern.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the landing reader and the stance reader.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStride extends AutoMovieArchetypeQuadrupedGait.IStride {
    /** Backing on alternating diagonals; absent otherwise. */
    reinBack?: true;
  }

  /**
   * Choose the next stride from the route state at its decision and the stride before it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the inputs of a stride decision.
   * @evidence contracts/development/design.md#principled-representation A pure function of the course state and the previous stride.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by the ride from its legs and gait rules.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Decide = (
    state: AutoMovieArchetypeCourse.IState,
    from: IStride,
  ) => IStride;

  /**
   * A moved landing: the phase one hoof's landing of one index takes instead of its gait's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the hoof, its landing index and the new absolute phase.
   * @evidence contracts/development/design.md#principled-representation An absolute phase on the ride's stride clock for one counted landing.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by technique planners such as the jump's takeoff stride.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The planner keeps each hoof's landings increasing; the plan checks it.
   */
  export interface IMoved {
    /** The hoof. */
    limb: AutoMovieArchetypeQuadrupedBody.Limb;
    /** The landing's index, the stride it belongs to under the gait. */
    index: number;
    /** Its new absolute phase. */
    phase: number;
  }

  /**
   * A built plan and its readers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each reader's units.
   * @evidence contracts/development/design.md#principled-representation Phases per cell, strides per index and the readers that map between phase and film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the ride's instants, stances and pose read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPlan {
    /** The phase reached at the course end. */
    total: number;

    /**
     * The stride of an index, held at the ends for virtual neighbours.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the end hold.
     * @evidence contracts/development/implementation.md#principled-implementation A clamped lookup in the committed strides.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clamp and one read.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A virtual neighbour takes the nearest committed stride, never an invented one.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the built table.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    strideOf: (index: number) => IStride;

    /**
     * The phase at a film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the units.
     * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation of the phase table at the moving clock's second, which stands still through pauses and holds.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock read and one interpolation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Seconds outside the course hold the end phases.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work plus the clock's pause scan.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the built table and the clock.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    phaseAt: (seconds: number) => number;

    /**
     * The film second a phase is reached.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the units.
     * @evidence contracts/development/implementation.md#principled-implementation Inverse of the monotone phase table by binary search and interpolation, mapped from the moving clock to film seconds.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One search and one mapping.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A held phase maps to the hold's start.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(log S) for S cells.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the built table and the clock.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    secondsAt: (phase: number) => number;

    /**
     * The absolute landing phase of a hoof's landing of an index.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the phase's origin.
     * @evidence contracts/development/implementation.md#principled-implementation The index plus the stride's gait phase, its rein-back phase, or a technique's moved phase.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One map lookup, else one table phase.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Moved landings were checked to keep each hoof's order.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieArchetypeQuadrupedGait.phase`.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    landing: (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      index: number,
    ) => number;

    /**
     * The index of a hoof's latest landing at or before a phase.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the result.
     * @evidence contracts/development/implementation.md#principled-implementation Start at the phase's stride and step until the landing brackets the phase, which also finds a landing a technique moved across a stride boundary.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Two short loops.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None; landings increase per hoof.
     * @evidence contracts/development/implementation.md#efficient-algorithms A bounded number of landing reads.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `landing`.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    latest: (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      phase: number,
    ) => number;
  }

  /**
   * Build the phase table and stride decisions on a prepared clock.
   *
   * @param species The ride's species and table.
   * @param clock The prepared clock, including any holds.
   * @param decide The stride decision.
   * @param initial The stride assumed before the course.
   * @param moved Landings moved by technique planners.
   * @returns The plan.
   * @throws {AutoMovieArchetypeRefusal} Through `admitQuadrupedPhase` for an unrepresentable advance.
   * @throws {RangeError} When moved landings stop a hoof's landings increasing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and failures.
   * @evidence contracts/development/implementation.md#principled-implementation Integrate each cell's stride frequency at its midpoint on the moving clock; decide each stride at the film second its phase is crossed. Moved landings replace only the named landing's phase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Integrate, then return closures over the table.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-monotone moved landings refuse rather than being reordered.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) cells to build; each phase or seconds read is a binary search, each landing read a map lookup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The clock owns the timing reads; the phase admission owner refuses representability.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains S+1 phases, at most S+2 strides and the moved landings.
   */
  export function build(
    species: createQuadruped.ISpecies,
    clock: QuadrupedRideClock.IClock,
    decide: Decide,
    initial: IStride,
    moved: readonly IMoved[] = [],
  ): IPlan {
    const step: number = (clock.movingEnd - clock.start) / STEPS;
    const first: IStride = decide(clock.at(clock.start), initial);
    const strides: IStride[] = [first, decide(clock.at(clock.start), first)];
    const phases: number[] = [0];
    for (let i: number = 0; i < STEPS; i++) {
      const current: IStride = strides[Math.floor(phases[i]!)]!;
      const next: number = admitQuadrupedPhase(
        species.archetype,
        phases[i]!,
        step,
        clock.timing(current.gait, clock.filmAt(clock.start + (i + 0.5) * step))
          .stride,
        STEPS,
      );
      for (let n: number = Math.floor(phases[i]!) + 1; n <= next; n++)
        strides[n + 1] = decide(
          clock.at(
            clock.filmAt(
              clock.start + (i + (n - phases[i]!) / (next - phases[i]!)) * step,
            ),
          ),
          strides[n]!,
        );
      phases.push(next);
    }
    const overrides: Map<string, number> = new Map(
      moved.map((entry: IMoved): [string, number] => [
        `${entry.limb}:${entry.index}`,
        entry.phase,
      ]),
    );
    const strideOf = (index: number): IStride =>
      strides[Math.max(0, Math.min(strides.length - 1, index))]!;
    const secondsAtPhase = (phase: number): number => {
      let low: number = 0;
      let high: number = STEPS;
      while (high - low > 1) {
        const middle: number = (low + high) >> 1;
        if (phases[middle]! <= phase) low = middle;
        else high = middle;
      }
      return clock.filmAt(
        clock.start +
          (low + (phase - phases[low]!) / (phases[high]! - phases[low]!)) *
            step,
      );
    };
    // Each change of gait or lead turns the landing pattern by a shift chosen at its stride start, so no swing is stretched or squeezed past the steady spans of the two gaits (`gaitChangeShift`); the shift holds until the next change.
    const shifts: number[] = [0];
    for (let n: number = 1; n < strides.length; n++)
      shifts.push(
        shifts[n - 1]! +
          gaitChangeShift(
            species,
            strides[n - 1]!,
            strides[n]!,
            clock.timing(
              strides[n - 1]!.gait,
              secondsAtPhase(Math.min(n, phases[STEPS]!)),
            ),
            clock.timing(
              strides[n]!.gait,
              secondsAtPhase(Math.min(n, phases[STEPS]!)),
            ),
          ),
      );
    const landing = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      index: number,
    ): number => {
      const stride: IStride = strideOf(index);
      return (
        overrides.get(`${limb}:${index}`) ??
        index +
          shifts[Math.max(0, Math.min(shifts.length - 1, index))]! +
          (stride.reinBack
            ? EquineFootwork.reinBackPhase(limb)
            : AutoMovieArchetypeQuadrupedGait.phase(species, stride, limb))
      );
    };
    for (const entry of moved)
      if (
        !(
          landing(entry.limb, entry.index - 1) < entry.phase &&
          entry.phase < landing(entry.limb, entry.index + 1)
        )
      )
        throw new RangeError(
          `A moved ${entry.limb} landing must stay between its neighbours`,
        );
    return {
      total: phases[STEPS]!,
      strideOf,
      phaseAt: (seconds: number): number => {
        const at: number = Math.max(
          0,
          Math.min(STEPS, (clock.movingAt(seconds) - clock.start) / step),
        );
        const i: number = Math.min(STEPS - 1, Math.floor(at));
        return phases[i]! + (phases[i + 1]! - phases[i]!) * (at - i);
      },
      secondsAt: secondsAtPhase,
      landing,
      latest: (
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
        phase: number,
      ): number => {
        let m: number = Math.floor(phase);
        while (landing(limb, m + 1) <= phase) m++;
        while (landing(limb, m) > phase) m--;
        return m;
      },
    };
  }
  /**
   * The turn of the landing pattern at a change of gait or lead: the shift, in strides, added to every landing from the new stride on.
   *
   * A hoof that landed in the stride before lands next at one stride plus the new pattern's phase less the old one's, plus the shift. Its swing in between runs from the old stance's duty to that landing; a steady gait swings for one less its own duty, so the swing may take any span between the two gaits' steady spans of that hoof, and no longer or shorter. Each hoof allows an interval of shifts; the shift nearest zero in the intersection of the four is taken, so a change whose natural pattern already fits is left as it is. Where the four intervals do not meet (the patterns cannot all fit), the middle of the gap between the tightest lower and upper bounds spreads the excess evenly.
   *
   * The description of a gait by each foot's duty factor and the phase of its landing in the stride is Hildebrand's (M. Hildebrand, "Symmetrical gaits of horses", Science 150(3697):701-708, 1965; "Analysis of asymmetrical gaits", Journal of Mammalogy 58(2):131-156, 1977). A change of gait is a change of those phases and duties, and a foot's swing is the stride less its duty, so the swing across a change is bounded by the two gaits' own values.
   *
   * @param species The ride's species and table.
   * @param was The stride before the change.
   * @param will The stride after it.
   * @param before The old gait's timing at the change.
   * @param after The new gait's timing at the change.
   * @returns The shift in strides; zero when nothing changes or a rein-back is involved.
   *
   */
  function gaitChangeShift(
    species: createQuadruped.ISpecies,
    was: IStride,
    will: IStride,
    before: AutoMovieArchetypeQuadrupedGait.ITiming,
    after: AutoMovieArchetypeQuadrupedGait.ITiming,
  ): number {
    if (was.reinBack || will.reinBack) return 0;
    if (
      was.gait === will.gait &&
      (was.lead === will.lead ||
        !AutoMovieArchetypeQuadrupedGait.LEADED.includes(will.gait))
    )
      return 0;
    let low: number = -Infinity;
    let high: number = Infinity;
    for (const limb of LIMBS) {
      const hind: boolean = limb.endsWith("Hind");
      const dutyWas: number = hind
        ? (before.hindDuty ?? before.duty)
        : before.duty;
      const dutyWill: number = hind
        ? (after.hindDuty ?? after.duty)
        : after.duty;
      const natural: number =
        1 +
        AutoMovieArchetypeQuadrupedGait.phase(species, will, limb) -
        AutoMovieArchetypeQuadrupedGait.phase(species, was, limb) -
        dutyWas;
      low = Math.max(low, Math.min(1 - dutyWas, 1 - dutyWill) - natural);
      high = Math.min(high, Math.max(1 - dutyWas, 1 - dutyWill) - natural);
    }
    if (low <= 0 && 0 <= high) return 0;
    return low <= high ? (low > 0 ? low : high) : (low + high) / 2;
  }

  /**
   * The ride's stride events: every hoof landing, `<limb>On`, and each change of gait or lead, `gait:<from>-<to>` and `lead:<from>-<to>`, at the stride start where it takes effect.
   *
   * @param plan The built stride plan.
   * @param standing Whether the ride departs from standing, so the hooves' phase-zero landings are the neutral stance and not events.
   * @param slide Film second hind landings stop being events because an arena slide holds the hinds down; Infinity without one.
   * @returns The events in limb then stride order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each label, the standing and slide exceptions and the order.
   * @evidence contracts/development/implementation.md#principled-implementation Reads each hoof's landing phases up to the plan's total and each stride boundary's gait and lead, mapped to film seconds; a lead change is named only between leaded gaits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two passes; kept with the plan that owns the phases.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(4L + S) for L landings per hoof and S strides.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `landing`, `strideOf` and `secondsAt`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list.
   */
  export function events(
    plan: IPlan,
    standing: boolean,
    slide: number,
  ): IEvent[] {
    const result: IEvent[] = [];
    for (const limb of LIMBS)
      for (let m: number = 0; plan.landing(limb, m) <= plan.total; m++) {
        const phase: number = plan.landing(limb, m);
        if (phase === 0 && standing) continue;
        const seconds: number = plan.secondsAt(phase);
        if (!limb.endsWith("Hind") || seconds < slide)
          result.push({ seconds, label: `${limb}On` });
      }
    for (let n: number = 1; n <= plan.total; n++) {
      const was: IStride = plan.strideOf(n);
      const will: IStride = plan.strideOf(n + 1);
      if (was.gait !== will.gait)
        result.push({
          seconds: plan.secondsAt(n),
          label: `gait:${was.gait}-${will.gait}`,
        });
      else if (
        was.lead !== will.lead &&
        AutoMovieArchetypeQuadrupedGait.LEADED.includes(will.gait)
      )
        result.push({
          seconds: plan.secondsAt(n),
          label: `lead:${was.lead}-${will.lead}`,
        });
    }
    return result;
  }

  /**
   * One named film-second event of the stride plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   * @evidence contracts/development/design.md#principled-representation The shape of a ride's instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `events`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IEvent {
    /** Film second. */
    seconds: number;
    /** The event's name. */
    label: string;
  }

  /** The four hooves in the body's order. */
  const LIMBS: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
    "leftFore",
    "rightFore",
    "leftHind",
    "rightHind",
  ];
}
