import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeRefusal,
  ArchetypeRide,
} from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedGait } from "./QuadrupedGait";
import { QuadrupedJoints } from "./QuadrupedJoints";
import { QuadrupedLocomotion } from "./QuadrupedLocomotion";
import { QuadrupedMotion } from "./QuadrupedMotion";
import { QuadrupedRideClock } from "./QuadrupedRideClock";
import { QuadrupedRidePose } from "./QuadrupedRidePose";
import { admitQuadrupedPhase } from "./admitQuadrupedPhase";
import { createQuadruped } from "./createQuadruped";

/**
 * A quadruped going along a course: its root on the path, its trunk rising and falling and its head nodding with the stride, its four limbs stepping in the gait's order, and its gait and lead changing with the speed or as the course's legs name them. Every kind is ridden by this one function, from its species' data (`createQuadruped.species`).
 *
 * The stride's timing is the selected declared table's (`QuadrupedGait.timing`) at the course's speed and the animal's withers height, shifted by its normalized `tempo`. The source owner distinguishes observed, derived and authored clocks; absolute clocks stay unscaled, otherwise the table's dynamic-similarity assumption is provisional as `QuadrupedGait.scale` states. Each foot lands at its phase of the stride, stays planted for the duty factor's share of it while the body passes over, then swings forward, lifted clear of the ground, with its carpus or hock folded. A planted foot stays where it landed on a straight leg at any speed, steady or changing, and across a change of gait; on a turn it is carried along the model's own fore-and-aft line, so it slides sideways by the turn's sagitta over one stance. The ride adds an instant for every landing, `leftForeOn`, `rightHindOn` and so on, which a rider's rising trot or a walker's step beside the animal locks to. The tack rides the trunk, so `frame("seat", seconds)` is the moving support a rider sits on and `frame("hitch", seconds)` the one a cart is drawn from; the species' nodding parts turn with the head.
 *
 * The gait of each stride is the one a course leg names, else the one `gait` names, else the one the speed calls for at the species' change points (`QuadrupedChange`), going up above a change point by the species' hysteresis and coming down below it by as much, so a speed hovering at the boundary does not flip the gait every stride. A change is decided at the left fore's landing, the stride's start, and takes the next stride: each foot's landing moves from the old gait's phase to the new one's, so a planted foot stays planted, and the ride names `gait:<from>-<to>` there. A leg may name a `lead` for a leaded gait, whose right lead mirrors the left; a change of lead is a flying change, taken the same way and named `lead:<from>-<to>`.
 *
 * Cruise, explicit positive speed marks and named gait requests are admitted
 * before timing is read. Gaps between declared gait domains are refused.
 * Virtual landing clocks use the actual course boundary's state while their
 * spatial samples remain held by the original plan. Already committed legacy
 * Froude/mass/overlap handovers can retain an endpoint clock only with actual
 * adjacent-gait domain support; speed-availability rules do not bridge gaps.
 * Genuine zero-speed ramps retain the minimum clock over vMin²/(2a).
 *
 * An optional authoring table is admitted and copied before planning. It supplies
 * only this ride's clocks and pose ranges; the animal's species identity, body
 * data, nodding parts and registered default table remain owned by the producer.
 * The table's producer states which values are measured and which are authored.
 *
 * The fixed phase planner permits one stride decision per cell. It refuses
 * nonrepresentable advances and periods shorter than that plan's cell width
 * before enumerating events; this explicit capacity is not a biological limit.
 *
 * Limb roots remain fixed in their actual parent's local frame. Four unchanged
 * foot goals and actual cylinder/capsule soles constrain one body-root height;
 * the gait's bob is its soft preference, while the horizontal course is kept.
 * Terminal directions retain their actual neutral carriage and the relative
 * carpus/hock fold is solved without a translated shoulder or stretched bar.
 * The shared generic FK must reproduce every solved origin and endpoint.
 *
 * @param animal The animal, as `createQuadruped` or its kind's producer builds it.
 * @param course The course its root follows; a leg may name the `gait` and the `lead` it is taken at.
 * @param gait The gait of every stride whose leg names none; absent, the speed chooses it.
 * @param table Optional admitted authoring table, replacing only this ride's gait data. Explicit authored clocks remain separate from the species' measured default; the source species and animal are unchanged.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the animal is no quadruped's, a supplied table fails QuadrupedLocomotion.admit, a gait is not in the selected table, a requested speed is outside its domain, the course is malformed, or its phase advance exceeds representability/capacity before stride enumeration.
 * @throws {RangeError} For unsupported actual geometry/carriage or foot goals whose four fixed chains and body-floor constraint have no common root height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, where the timing comes from, how the gait is chosen and changed, the instants added, what the support frame is and what happens below the gait's slowest speed.
 * @evidence contracts/development/implementation.md#principled-implementation Integrate declared stride clocks and plan each real foot's stance travel from the course. Swing uses the existing minimum-jerk path; exact terminal solid clearance converts its lift to an endpoint goal. The four actual folded chains and body-floor support intersect into one vertical root interval, with the gait bob as a soft preference. Four oriented closed-form solves preserve fixed parent-local attachments and real lengths, then shared actual-rig FK must achieve every requested joint before emitting parts and contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit requests and actual source, prepare the bounded phase/landing plan and reusable pose owner, then compute four foot goals plus nod/bob for each stateless actual-rig sample.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species case, undeclared-speed clamp, independent proximal translation, distance projection, stretched bone or endpoint-only floor proxy hides an infeasible request. Source-carried contacts and actual geometry are emitted by the same FK; impossible common-root geometry refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds S phase rows once. A sample uses binary phase searches, existing R-row clock reads, exact support over P actual body parts, four constant-size reach intersections/closed-form IK solves, two B-bone FK passes and O(P+A+V) independent geometry/contact emission. No per-frame physical simulation or iterative IK is used.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admitted plan/table, bounded phase rows, neutral source chains, prepared oriented solvers, real rig/reader and explicit carrier maps serve every sample; no rest animal or solver graph is rebuilt per frame.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources For S phase cells, retained phases are at most S+1, stride/lookahead records S+2 and animal events 5S+4 plus C course events. Prepared source/rig data are bounded by the actual model; each sample owns independent geometry, transforms and contact frames with no completed-pose cache or external handle.
 */
export function rideQuadruped<Affordance extends string, D extends string>(
  animal: Archetype<Affordance, D | QuadrupedBody.Dimension>,
  course: rideQuadruped.ICourse,
  gait?: QuadrupedGait.Gait,
  table?: QuadrupedGait.ITable,
): ArchetypeRide.IRide<Affordance, D | QuadrupedBody.Dimension> {
  const source: createQuadruped.ISpecies = createQuadruped.species(animal);
  const species: createQuadruped.ISpecies =
    table === undefined
      ? source
      : { ...source, table: QuadrupedLocomotion.admit(table) };
  const dimensions: Readonly<Partial<Record<QuadrupedBody.Dimension, number>>> =
    animal.dimensions;
  const tempo: number = dimensions.tempo ?? 0;
  const withers: number = dimensions.withersHeight!;
  const domains: readonly {
    gait: QuadrupedGait.Gait;
    minimum: number;
    maximum: number;
  }[] = species.table.order.map(
    (
      which: QuadrupedGait.Gait,
    ): {
      gait: QuadrupedGait.Gait;
      minimum: number;
      maximum: number;
    } => ({ gait: which, ...QuadrupedGait.range(species, which, withers) }),
  );
  if (gait !== undefined)
    QuadrupedGait.timing(species, gait, course.cruise, tempo, withers);
  const rig: ReturnType<typeof QuadrupedJoints.read> = QuadrupedJoints.read(
    animal.parts,
  );
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan(
    species.archetype,
    course,
  );
  const clock: QuadrupedRideClock.IClock = QuadrupedRideClock.create(
    species,
    course,
    plan,
    tempo,
    withers,
  );
  const selected: (speed: number) => QuadrupedGait.Gait = (
    speed: number,
  ): QuadrupedGait.Gait =>
    QuadrupedChange.called(
      species,
      speed,
      species.table.order[0]!,
      dimensions,
      rig.limbs.leftHind[0]!.y,
    );
  if (
    gait === undefined &&
    course.legs.some(
      (leg: rideQuadruped.ILeg): boolean => leg.gait === undefined,
    )
  )
    admitSpeed(undefined, course.cruise);
  const copied: (frame: IAutoMovieTransform) => IAutoMovieTransform = (
    frame: IAutoMovieTransform,
  ): IAutoMovieTransform => ({
    translation: { ...frame.translation },
    rotation: { ...frame.rotation },
    scale: { ...frame.scale },
  });

  // The leg holding each distance, and the gait and lead it names, by the legs the plan measured.
  const legAt: (distance: number) => rideQuadruped.ILeg = (
    distance: number,
  ): rideQuadruped.ILeg => {
    let k: number = 0;
    while (
      k < plan.legSpans.length - 1 &&
      distance >= plan.legSpans[k]!.from + plan.legSpans[k]!.span
    )
      k++;
    return course.legs[k]!;
  };
  course.legs.forEach((leg: rideQuadruped.ILeg, k: number): void => {
    const fastest: number = plan.legSpans[k]!.fastest;
    const which: QuadrupedGait.Gait = leg.gait ?? gait ?? selected(fastest);
    const limits: { minimum: number; maximum: number } = QuadrupedGait.range(
      species,
      which,
      withers,
    );
    if (fastest >= limits.minimum) admitSpeed(leg.gait ?? gait, fastest);
  });
  course.speeds?.forEach((speed: number, index: number): void => {
    if (speed > 0) admitSpeed(course.legs[index]!.gait ?? gait, speed);
  });
  for (const [speed, distance] of [
    [course.startSpeed ?? 0, 0],
    [course.endSpeed ?? 0, plan.length],
  ] as const)
    if (speed > 0) admitSpeed(legAt(distance).gait ?? gait, speed);

  /** Requested named gaits are strict; automatic requests need actual declared coverage. */
  function admitSpeed(
    which: QuadrupedGait.Gait | undefined,
    speed: number,
  ): void {
    if (which !== undefined) {
      QuadrupedGait.timing(species, which, speed, tempo, withers);
      return;
    }
    if (
      domains.some(
        (domain: (typeof domains)[number]): boolean =>
          speed >= domain.minimum && speed <= domain.maximum,
      )
    )
      return;
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: species.archetype,
      axis: "speed",
      value: speed,
      feasible: null,
      reason: `no declared gait covers ${speed} m/s; available domains: ${domains.map((domain: (typeof domains)[number]): string => `${domain.gait} [${domain.minimum}, ${domain.maximum}]`).join(", ")}`,
      fix: "Choose a covered speed or supply explicitly authored gait clocks covering it.",
    });
  }

  // The stride's gait as the speed calls for it, from the one it is in.
  const decide: (
    state: ArchetypeCourse.IState,
    from: QuadrupedGait.IStride,
  ) => QuadrupedGait.IStride = (
    state: ArchetypeCourse.IState,
    from: QuadrupedGait.IStride,
  ): QuadrupedGait.IStride => {
    const leg: rideQuadruped.ILeg = legAt(state.distance);
    return {
      gait:
        leg.gait ??
        gait ??
        QuadrupedChange.called(
          species,
          state.speed,
          from.gait,
          dimensions,
          rig.limbs.leftHind[0]!.y,
        ),
      lead: leg.lead ?? "left",
    };
  };

  // Phase against time, each stride at its own gait; a stride's gait is decided at the start of the one before it.
  const step: number = (clock.end - clock.start) / rideQuadruped.STEPS;
  const slowest: QuadrupedGait.Gait = species.table.order[0]!;
  const first: QuadrupedGait.IStride = decide(clock.at(clock.start), {
    gait: gait ?? slowest,
    lead: "left",
  });
  const strides: QuadrupedGait.IStride[] = [
    first,
    decide(clock.at(clock.start), first),
  ];
  const phases: number[] = [0];
  for (let i: number = 0; i < rideQuadruped.STEPS; i++) {
    const current: QuadrupedGait.IStride = strides[Math.floor(phases[i]!)]!;
    const next: number = admitQuadrupedPhase(
      species.archetype,
      phases[i]!,
      step,
      clock.timing(current.gait, clock.start + (i + 0.5) * step).stride,
      rideQuadruped.STEPS,
    );
    for (let n: number = Math.floor(phases[i]!) + 1; n <= next; n++)
      strides[n + 1] = decide(
        clock.at(
          clock.start + (i + (n - phases[i]!) / (next - phases[i]!)) * step,
        ),
        strides[n]!,
      );
    phases.push(next);
  }
  const strideOf: (m: number) => QuadrupedGait.IStride = (
    m: number,
  ): QuadrupedGait.IStride =>
    strides[Math.max(0, Math.min(strides.length - 1, m))]!;
  const phaseAt: (seconds: number) => number = (seconds: number): number => {
    const at: number = Math.max(
      0,
      Math.min(rideQuadruped.STEPS, (seconds - clock.start) / step),
    );
    const i: number = Math.min(rideQuadruped.STEPS - 1, Math.floor(at));
    return phases[i]! + (phases[i + 1]! - phases[i]!) * (at - i);
  };
  const secondsAt: (phase: number) => number = (phase: number): number => {
    let low: number = 0;
    let high: number = rideQuadruped.STEPS;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (phases[middle]! <= phase) low = middle;
      else high = middle;
    }
    return (
      clock.start +
      (low + (phase - phases[low]!) / (phases[high]! - phases[low]!)) * step
    );
  };

  // Each foot's landing in a stride: the stride's gait's phase on its lead.
  const landing: (limb: QuadrupedBody.Limb, m: number) => number = (
    limb: QuadrupedBody.Limb,
    m: number,
  ): number => m + QuadrupedGait.phase(species, strideOf(m), limb);

  // Every landing of every foot, and every change of gait or lead.
  const instants: { seconds: number; label: string }[] = [];
  const total: number = phases[rideQuadruped.STEPS]!;
  for (const limb of QuadrupedBody.LIMBS)
    for (let m: number = 0; landing(limb, m) <= total; m++)
      instants.push({
        seconds: secondsAt(landing(limb, m)),
        label: `${limb}On`,
      });
  for (let n: number = 1; n < strides.length - 1 && n <= total; n++) {
    const was: QuadrupedGait.IStride = strides[n]!;
    const will: QuadrupedGait.IStride = strides[n + 1]!;
    if (was.gait !== will.gait)
      instants.push({
        seconds: secondsAt(n),
        label: `gait:${was.gait}-${will.gait}`,
      });
    else if (was.lead !== will.lead && QuadrupedGait.LEADED.includes(will.gait))
      instants.push({
        seconds: secondsAt(n),
        label: `lead:${was.lead}-${will.lead}`,
      });
  }

  // Each foot's stance uses its end's declared duty when supplied; legacy
  // tables keep their common fore duty. Travel ends at that foot's own lift.
  const stance: (
    at: number,
    which: QuadrupedGait.Gait,
    fore: boolean,
  ) => { duty: number; from: number; travel: number } = (
    at: number,
    which: QuadrupedGait.Gait,
    fore: boolean,
  ): { duty: number; from: number; travel: number } => {
    const seconds: number = secondsAt(at);
    const landed: ArchetypeCourse.IState = plan.at(seconds);
    const timing: QuadrupedGait.ITiming = clock.timing(which, seconds);
    const duty: number = fore ? timing.duty : (timing.hindDuty ?? timing.duty);
    return {
      duty,
      from: landed.distance,
      travel: plan.at(secondsAt(at + duty)).distance - landed.distance,
    };
  };

  const pose: QuadrupedRidePose.IPrepared<
    Affordance,
    D | QuadrupedBody.Dimension
  > = QuadrupedRidePose.prepare(animal, species, rig);
  return ArchetypeRide.along(
    animal,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<Affordance, D | QuadrupedBody.Dimension> => {
      const phase: number = phaseAt(plan.when(state.distance));
      const now: QuadrupedGait.Gait = strideOf(Math.floor(phase)).gait;
      const going: number = Math.min(
        1,
        state.speed / QuadrupedGait.range(species, now, withers).minimum,
      );

      // The trunk sinks as many times a stride as the gait has beats.
      const sink: number =
        ((going * QuadrupedGait.of(species, now).bob * withers) / 2) *
        (1 - Math.cos(2 * Math.PI * QuadrupedGait.BEATS[now] * phase));
      const goals: Map<QuadrupedBody.Limb, QuadrupedRidePose.IGoal> = new Map();
      for (const limb of QuadrupedBody.LIMBS) {
        const fore: boolean = limb.endsWith("Fore");
        const end: "fore" | "hind" = fore ? "fore" : "hind";
        const rest: readonly IAutoMovieVector3[] = rig.limbs[limb];

        // The stance this foot is in or has just left, and the next one it swings to.
        let m: number = Math.floor(phase);
        if (landing(limb, m) > phase) m--;
        const landed: number = landing(limb, m);
        const coming: number = landing(limb, m + 1);
        const which: QuadrupedGait.IGait = QuadrupedGait.of(
          species,
          strideOf(m).gait,
        );
        const local: number = phase - landed;
        const current: { duty: number; from: number; travel: number } = stance(
          landed,
          strideOf(m).gait,
          fore,
        );
        const planted: boolean = local < current.duty;
        const swing: number = planted
          ? 0
          : (local - current.duty) / (coming - landed - current.duty);
        const path: { along: number; rise: number } =
          QuadrupedMotion.swing(swing);

        // Planted, the foot goes back through the model by what the body has travelled since it landed, half the stance's travel ahead of its rest place at the landing; swinging, it is brought from where it lifted to where it lands next by the minimum-jerk path, clearing the ground by the swing's lift at the middle.
        const ahead: number = planted
          ? current.travel / 2 - (state.distance - current.from)
          : -current.travel / 2 +
            ((current.travel +
              stance(coming, strideOf(m + 1).gait, fore).travel) /
              2) *
              path.along;
        goals.set(limb, {
          z: rest[4]!.z + ahead,
          lift: going * which.lift[end] * withers * path.rise,
          fold: going * which.fold[end] * path.rise,
        });
      }

      // The neck and the head, with the tack the species names as riding them, pitch about the neck's root, timed to the footfalls as declared.
      const nod: number =
        going *
        QuadrupedMotion.nod(
          species,
          strideOf(Math.floor(phase)),
          phase,
          clock.timing(now, plan.when(state.distance)).duty,
        );
      return {
        archetype: pose.sample(
          {
            leftFore: goals.get("leftFore")!,
            rightFore: goals.get("rightFore")!,
            leftHind: goals.get("leftHind")!,
            rightHind: goals.get("rightHind")!,
          },
          nod,
          -sink,
        ),
        placement: copied(state.placement),
      };
    },
    instants,
  );
}

/**
 * Companion types and constants of {@link rideQuadruped}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type and constant states what it is.
 * @evidence contracts/development/design.md#principled-representation A course whose legs may name a gait and a lead, and the phase table's resolution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a caller of the ride states; the gait data is the species'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace rideQuadruped {
  /** Phase cells over the course; each admits one stride decision, so capacity depends on duration rather than an asserted biological period floor. */
  export const STEPS: number = 2000;

  /**
   * A course leg that may name its gait and its lead.
   *
   */
  export type ILeg = ArchetypeCourse.Leg & {
    /** The gait the leg is taken at; the speed chooses when absent. */
    gait?: QuadrupedGait.Gait;

    /** The lead of a leaded gait on the leg; the left when absent. */
    lead?: QuadrupedGait.Lead;
  };

  /**
   * A quadruped's course: a course whose legs may name their gait and lead.
   *
   */
  export interface ICourse extends Omit<ArchetypeCourse.ICourse, "legs"> {
    /** The legs in order, at least one. */
    legs: readonly ILeg[];
  }
}
