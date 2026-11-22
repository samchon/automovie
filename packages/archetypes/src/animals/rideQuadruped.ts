import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRide,
} from "../core";
import { ArchetypeRideWitness } from "../core/ArchetypeRideWitness";
import { EquineArc } from "./EquineArc";
import { EquineFlightClock } from "./EquineFlightClock";
import { EquineFootwork } from "./EquineFootwork";
import { EquineJump } from "./EquineJump";
import { EquineLateral } from "./EquineLateral";
import { EquineObstacle } from "./EquineObstacle";
import { EquinePitch } from "./EquinePitch";
import { EquineRideTerrain } from "./EquineRideTerrain";
import { EquineTuck } from "./EquineTuck";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedFooting } from "./QuadrupedFooting";
import { QuadrupedGait } from "./QuadrupedGait";
import { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";
import { QuadrupedJoints } from "./QuadrupedJoints";
import { QuadrupedLameness } from "./QuadrupedLameness";
import { QuadrupedLocomotion } from "./QuadrupedLocomotion";
import { QuadrupedMotion } from "./QuadrupedMotion";
import { QuadrupedRideAdmission } from "./QuadrupedRideAdmission";
import { QuadrupedRideClock } from "./QuadrupedRideClock";
import { QuadrupedRidePose } from "./QuadrupedRidePose";
import { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import type { QuadrupedTimedCues } from "./QuadrupedTimedCues";
import { QuadrupedTimedRoute } from "./QuadrupedTimedRoute";
import { createQuadruped } from "./createQuadruped";
import { planEquineFlight } from "./planEquineFlight";
import { refuseQuadrupedReach } from "./refuseQuadrupedReach";

/** An altered public course producer retains its original opaque route. */
const NATIVE_PLAN: typeof ArchetypeCourse.plan = ArchetypeCourse.plan;

/**
 * A quadruped going along a course: its root on the path, its trunk rising and falling and its head nodding with the stride, its four limbs stepping in the gait's order, and its gait and lead changing with the speed or as the course's legs name them. Every kind is ridden by this one function, from its species' data (`createQuadruped.species`).
 *
 * The stride's timing is the selected declared table's (`QuadrupedGait.timing`) at the course's speed and the animal's withers height, shifted by its normalized `tempo`. The source owner distinguishes observed, derived and authored clocks; absolute clocks stay unscaled, otherwise the table's dynamic-similarity assumption is provisional as `QuadrupedGait.scale` states. Each foot lands at its phase of the stride, stays planted for the duty factor's share of it while the body passes over, then swings forward, lifted clear of the ground, with its carpus or hock folded; a gait that states its swing height by landmark (`QuadrupedGait.IElevation`) lifts the toe to that point of the actual cannon. A planted foot stays at its recorded world footprint on level straight and curved legs, including signed backing and gait changes. A route pause holds the hoof clock and emits no new touchdown inside its stationary interval. The ride adds an instant for every landing, `leftForeOn`, `rightHindOn` and so on, which a rider's rising trot or a walker's step beside the animal locks to. The tack rides the trunk, so `frame("seat", seconds)` is the moving support a rider sits on and `frame("hitch", seconds)` the one a cart is drawn from; the species' nodding parts turn with the head.
 *
 * The gait of each stride is the one a course leg names, else the one `gait` names, else the one the speed calls for at the species' change points (`QuadrupedChange`), going up above a change point by the species' hysteresis and coming down below it by as much, so a speed hovering at the boundary does not flip the gait every stride. A change is decided at the left fore's landing, the stride's start, and takes the next stride: each foot's landing moves from the old gait's phase to the new one's, so a planted foot stays planted, and the ride names `gait:<from>-<to>` there. A leg may name a `lead` for a leaded gait, whose right lead mirrors the left; a change of lead is a flying change, taken the same way and named `lead:<from>-<to>`.
 *
 * A leg's `equineFootwork` names a horse's technique (`EquineFootwork.Technique`). A lateral figure turns the body off the travel heading (`EquineLateral`), each planted hoof then centred between its neutral points at landing and release; a jump moves the takeoff stride's landings, holds the hoof clock through a ballistic flight and lifts the body over the authored obstacles (`EquineJump`), naming `jumpApproach`, `jumpTakeoff` (final hind liftoff), `jumpLanding` (first fore landing) and `jumpRecovery`; a baulk names `baulkStop` and `baulkSettle` at its halt.
 *
 * Requested gaits and speeds are admitted before timing is read (`QuadrupedRideAdmission`). Virtual landing clocks use the actual course boundary's state while their spatial samples remain held by the original plan. An explicit standing departure starts with all four actual neutral hoof anchors, each releasing for the first gait swing without a virtual pre-roll touchdown. An optional authoring table is admitted and copied before planning; it supplies only this ride's clocks and pose ranges.
 *
 * Limb roots remain fixed in their actual parent's local frame. Four unchanged foot goals and actual cylinder/capsule soles constrain one body-root height; the gait's bob is its soft preference, while the horizontal course is kept. The shared generic FK must reproduce every solved origin and endpoint.
 *
 * @param animal The animal, as `createQuadruped` or its kind's producer builds it.
 * @param route The course its root follows, or a planned course such as a timed one (`ArchetypeCourse.timed`), ridden as one leg whose strides take the gait its speed calls for, or a planned course with named-gait cues (`rideQuadruped.ICued`) whose cued intervals take the named gait; a leg may name the `gait`, the `lead` and an equine technique.
 * @param gait The gait of every stride whose leg names none; absent, the speed chooses it.
 * @param table Optional admitted authoring table, replacing only this ride's gait data.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the animal is no quadruped's, a supplied table fails QuadrupedLocomotion.admit, a gait is not in the selected table, a requested speed is outside its domain, the course is malformed, a technique is inadmissible, or its phase advance exceeds representability/capacity before stride enumeration.
 * @throws {RangeError} For unsupported actual geometry/carriage or foot goals whose four fixed chains and body-floor constraint have no common root height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, where the timing comes from, how the gait is chosen and changed, the techniques and instants added, and what the support frame is.
 * @evidence contracts/development/implementation.md#principled-implementation Integrate declared stride clocks and plan each real foot's stance travel from the course. Swing uses the minimum-jerk path, carried with the body through a jump's held clock. The body placement adds a lateral figure's heading and a jump's ballistic height. The four actual folded chains and body-floor support intersect into one vertical root interval, with the gait bob as a soft preference.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit requests, prepare techniques, assemble the stride plan, instants and stateless pose sampler once, or again when a jump's flight is known.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species case, undeclared-speed clamp, independent proximal translation, distance projection, stretched bone or endpoint-only floor proxy hides an infeasible request. Impossible common-root geometry refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds S phase rows per assembly, one more per jump candidate. A sample uses binary phase searches, existing clock reads, four constant-size reach intersections and closed-form IK solves, two B-bone FK passes and O(P+A+V) emission.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admitted plan/table, phase rows, neutral source chains, prepared solvers, rig and carrier maps serve every sample; no rest animal or solver graph is rebuilt per frame.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the final assembly's S+1 phases, its strides and instants, plus the prepared source; each sample owns independent geometry with no completed-pose cache or external handle.
 */
export function rideQuadruped<Affordance extends string, D extends string>(
  animal: Archetype<Affordance, D | QuadrupedBody.Dimension>,
  route:
    | rideQuadruped.ICourse
    | ArchetypeCourse.IPlan
    | QuadrupedTimedCues.ICued,
  gait?: QuadrupedGait.Gait,
  table?: QuadrupedGait.ITable,
): ArchetypeRide.IRide<Affordance, D | QuadrupedBody.Dimension> {
  /** Keep the source dimensions and the solver's actual quadruped size. */
  type Dimension = D | QuadrupedBody.Dimension;
  /** The pose function the ride and the witness read. */
  type Posed = (
    state: ArchetypeCourse.IState,
    seconds: number,
    witness?: ArchetypeRideWitness.Witness,
  ) => ArchetypeRide.IPose<Affordance, Dimension>;
  /** One assembled stride plan, its clock, instants and pose function. */
  interface IAssembly {
    /** The clock, with any hold. */
    clock: QuadrupedRideClock.IClock;
    /** The stride plan. */
    strides: QuadrupedStridePlan.IPlan;
    /** The pose function. */
    posed: Posed;
    /** The instants the ride adds. */
    instants: readonly EquineFootwork.IInstant[];
  }

  const source: createQuadruped.ISpecies = createQuadruped.species(animal);
  const species: createQuadruped.ISpecies =
    table === undefined
      ? source
      : { ...source, table: QuadrupedLocomotion.admit(table) };
  const dimensions: Readonly<Partial<Record<QuadrupedBody.Dimension, number>>> =
    animal.dimensions;
  const tempo: number = dimensions.tempo ?? 0;
  const withers: number = dimensions.withersHeight!;
  const rig: ReturnType<typeof QuadrupedJoints.read> = QuadrupedJoints.read(
    animal.parts,
  );
  const nativeCourse: boolean =
    Object.getOwnPropertyDescriptor(ArchetypeCourse, "plan")?.value ===
    NATIVE_PLAN;
  const { plan, course, holds }: QuadrupedTimedRoute.IRoute =
    QuadrupedTimedRoute.of(species, route, withers, gait);
  const departure: ArchetypeCourse.IState | undefined =
    QuadrupedHoofTrack.departure(
      plan,
      course.startFromStanding,
      species.archetype,
    );
  QuadrupedRideAdmission.admit(
    species,
    course,
    plan,
    gait,
    tempo,
    withers,
    rig,
    dimensions,
  );
  const terrain: EquineRideTerrain.ITerrain<Affordance, Dimension> =
    EquineRideTerrain.prepare(animal, species, course, plan, gait, rig);
  const footwork: EquineFootwork.IPlan = terrain.footwork;
  const ground: QuadrupedFooting.IPlan | undefined = terrain.ground;

  /** Choose the next stride from the current route state or explicit footwork. */
  function decide(
    state: ArchetypeCourse.IState,
    from: QuadrupedStridePlan.IStride,
  ): QuadrupedStridePlan.IStride {
    const index: number = QuadrupedRideAdmission.legIndex(plan, state.distance);
    const leg: rideQuadruped.ILeg = course.legs[index]!;
    if (footwork.backing.has(index))
      return { gait: "walk", lead: "left", reinBack: true };
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
  }

  const slowest: QuadrupedGait.Gait = species.table.order[0]!;
  const initial: QuadrupedStridePlan.IStride = {
    gait: gait ?? slowest,
    lead: "left",
  };
  const worldAnchors: boolean =
    plan.bends.length > 0 ||
    departure !== undefined ||
    footwork.lateral.length > 0 ||
    footwork.jump !== undefined ||
    course.lean !== undefined ||
    course.lameness !== undefined;
  const limp: QuadrupedLameness.Offset | undefined = QuadrupedLameness.prepare(
    species.archetype,
    course.lameness,
    course.legs,
    gait ?? species.table.order[species.table.order.length - 1]!,
    animal.parts,
    rig.limbs,
  );
  const pose: QuadrupedRidePose.IPrepared<Affordance, Dimension> =
    QuadrupedRidePose.prepare(animal, species, rig, nativeCourse);
  const tucks: EquineTuck.IFores = EquineTuck.fores(rig.limbs, withers);

  /** Assemble the stride plan, instants and pose function, with a jump's flight when it is known. A jump's trial assembly, flown without its arc, skips the footing check its displayed ride must pass. */
  function assemble(
    moved: readonly QuadrupedStridePlan.IMoved[],
    flight?: EquineJump.IFlight,
    trial: boolean = false,
  ): IAssembly {
    const clock: QuadrupedRideClock.IClock = QuadrupedRideClock.create(
      species,
      course,
      plan,
      tempo,
      withers,
      flight === undefined ? holds : [...holds, flight.hold],
    );
    const strides: QuadrupedStridePlan.IPlan = QuadrupedStridePlan.build(
      species,
      clock,
      decide,
      initial,
      moved,
    );

    // Actual hoof landings and the gait, lead and technique events.
    const instants: EquineFootwork.IInstant[] = [
      ...footwork.instants,
      ...QuadrupedStridePlan.events(
        strides,
        departure !== undefined,
        footwork.slide?.contact ?? Infinity,
      ),
    ];
    const {
      push,
      takeoff,
      landing,
      absorb,
      shift,
      instants: cues,
    }: EquineFlightClock.IClock = EquineFlightClock.of(flight, strides, plan);
    instants.push(...cues);

    /** The body's world placement: the course's, turned by a lateral figure and pitched and lifted through a jump. */
    const body = (
      state: ArchetypeCourse.IState,
      seconds: number,
    ): IAutoMovieTransform =>
      EquinePitch.place(
        state.placement,
        EquineLateral.heading(footwork.lateral, seconds),
        flight === undefined
          ? undefined
          : {
              y: EquineArc(seconds, push, takeoff, landing, absorb),
              z: 0,
              pitch: 0,
            },
      );
    const stance: ReturnType<typeof QuadrupedHoofTrack.stances> =
      QuadrupedHoofTrack.stances(
        plan,
        clock,
        strides.secondsAt,
        plan.bends.length > 0 || footwork.lateral.length > 0 ? body : undefined,
        EquineLateral.crossing(footwork.lateral, rig.limbs, animal.parts),
      );

    /** Read the course and derive the four current footprint demands before any geometry sharing. */
    const posed: Posed = (
      state: ArchetypeCourse.IState,
      seconds: number,
      witness?: ArchetypeRideWitness.Witness,
    ): ArchetypeRide.IPose<Affordance, Dimension> => {
      const phase: number = strides.phaseAt(seconds);
      const now: QuadrupedGait.Gait = strides.strideOf(Math.floor(phase)).gait;
      const timing: QuadrupedGait.ITiming = clock.timing(now, seconds);
      const lame: QuadrupedLameness.IOffset | undefined = limp?.(
        strides,
        phase,
        timing,
      );
      const lean: number =
        (course.lean?.(seconds) ?? 0) + EquineFootwork.sit(footwork, seconds);
      const pitched: IAutoMovieTransform = EquinePitch.place(
        EquinePitch.place(body(state, seconds), 0, lame?.tilt),
        0,
        lean === 0
          ? undefined
          : EquinePitch.about({ y: 0, z: 0 }, (-lean * Math.PI) / 180),
      );
      // Asked to lean in, the body leans into a bend by the steady-turn balance of its speed and curvature, rolled about its long axis on the floor; the hooves keep their world footprints (a bend anchors them), as a horse on a circle leans by the gravitational and centripetal prediction (Pfau et al. 2012).
      const inward: number =
        course.leanIn === true ? ArchetypeCourse.lean(state) : 0;
      const placement: IAutoMovieTransform =
        inward === 0
          ? pitched
          : ArchetypeCourse.banked({ ...state, placement: pitched }, inward);
      const current: ArchetypeCourse.IState = { ...state, placement };
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
        const m: number = strides.latest(limb, phase);
        const landed: number = strides.landing(limb, m);
        const coming: number = strides.landing(limb, m + 1);
        const which: QuadrupedGait.IGait = QuadrupedGait.of(
          species,
          strides.strideOf(m).gait,
        );
        const step: ReturnType<typeof QuadrupedHoofTrack.step> =
          QuadrupedHoofTrack.step(
            phase,
            landed,
            coming,
            stance(landed, strides.strideOf(m), fore),
            departure,
          );
        const following: QuadrupedHoofTrack.IStance | undefined = step.planted
          ? undefined
          : stance(coming, strides.strideOf(m + 1), fore);

        // A swing spanning the jump's held clock is carried with the body.
        const carry: QuadrupedHoofTrack.ICarry | undefined = step.planted
          ? undefined
          : EquineFlightClock.carry(
              flight,
              shift,
              seconds,
              landed + step.from.duty,
              coming,
            );
        const height: number =
          which.elevation === undefined
            ? which.lift[end] * withers
            : QuadrupedHoofTrack.elevation(rest, which.elevation, fore);
        // A carried swing rises above the flying body's own floor while the body is aloft, else above the ground; the two coincide at liftoff and landing.
        const goal: QuadrupedRidePose.IGoal = {
          ...QuadrupedHoofTrack.target(
            current,
            rest[4]!,
            step.from,
            following,
            step.along,
            worldAnchors,
            trial ||
              (carry !== undefined &&
                placement.translation.y > state.placement.translation.y)
              ? undefined
              : ground,
            carry,
            rest[0]!.z + rest[4]!.z - rest[3]!.z,
            terrain.clear[limb],
              ),
          ),
          lift: (going * height + (ground?.swingLift ?? 0)) * step.rise,
          fold: going * which.fold[end] * step.rise,
        };
        goals.set(
          limb,
          carry !== undefined
            ? tucks[limb](
                goal,
                EquineTuck.weight(
                  seconds,
                  strides.secondsAt(landed + step.from.duty),
                  takeoff,
                  landing,
                  strides.secondsAt(coming),
                  fore,
                ),
              )
            : terrain.goal(limb, seconds, goal, placement),
        );
      }

      // The neck and the head, with the tack the species names as riding them, pitch about the neck's root, timed to the footfalls as declared.
      const nod: number =
        going *
          QuadrupedMotion.nod(
            species,
            strides.strideOf(Math.floor(phase)),
            phase,
            timing.duty,
          ) +
        (lame?.nod ?? 0);
      let archetype: Archetype<Affordance, Dimension>;
      try {
        archetype = pose.sample(
          {
            leftFore: goals.get("leftFore")!,
            rightFore: goals.get("rightFore")!,
            leftHind: goals.get("leftHind")!,
            rightHind: goals.get("rightHind")!,
          },
          nod,
          -sink,
          witness,
        );
      } catch (error) {
        throw refuseQuadrupedReach(species.archetype, seconds, error);
      }
      archetype = terrain.tail(archetype, placement);
      if (!trial) ground?.verify(archetype, placement);
      return { archetype, placement: ArchetypeFrame.copy(placement) };
    };
    return { clock, strides, posed, instants };
  }

  let assembly: IAssembly = assemble([]);
  if (footwork.jump !== undefined) {
    const flight: EquineJump.IFlight = planEquineFlight(
      species.archetype,
      footwork.jump,
      plan,
      (
        moved: readonly QuadrupedStridePlan.IMoved[],
        trying: EquineJump.IFlight | undefined,
      ): EquineJump.ITrial => {
        const trial: IAssembly = assemble(moved, trying, true);
        return {
          strides: trial.strides,
          clock: trial.clock,
          sample: (seconds: number): EquineObstacle.ISample => {
            const shown: ArchetypeRide.IPose<Affordance, Dimension> =
              trial.posed(plan.at(seconds), seconds);
            return { parts: shown.archetype.parts, placement: shown.placement };
          },
        };
      },
    );
    assembly = assemble(flight.moved, flight);
  }
  const posed: Posed = assembly.posed;
  if (nativeCourse)
    ArchetypeRideWitness.authorize(
      posed,
      plan,
      (seconds: number, witness: ArchetypeRideWitness.Witness) => {
        const state: ArchetypeCourse.IState = plan.at(seconds);
        return { ...posed(state, seconds, witness), course: state };
      },
    );
  return ArchetypeRide.along(animal, plan, posed, assembly.instants);
}

/**
 * Companion types and constants of {@link rideQuadruped}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type and constant states what it is.
 * @evidence contracts/development/design.md#principled-representation A course whose legs may name a gait, a lead and a technique, and the phase table's resolution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a caller of the ride states; the gait data is the species'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace rideQuadruped {
  /** A per-sample trunk pitch: degrees, positive nose-down, at a film second. */
  export type Lean = (seconds: number) => number;

  /** A timed path with named-gait cues over film-second intervals, as a rider's aid asks for a gait (`QuadrupedTimedCues`). */
  export type ICued = QuadrupedTimedCues.ICued;

  /** One named-gait cue of a timed path. */
  export type ICue = QuadrupedTimedCues.ICue;

  /** A course leg that may name its gait, its lead and an equine technique. */
  export type ILeg = ArchetypeCourse.Leg & {
    /** The gait the leg is taken at; the speed chooses when absent. */
    gait?: QuadrupedGait.Gait;
    /** The lead of a leaded gait on the leg; the left when absent. */
    lead?: QuadrupedGait.Lead;
    /** Optional film-specific hoof work, lateral figure, jump or baulk on a supported individual equine route. */
    equineFootwork?: EquineFootwork.Technique;
  };

  /** A quadruped's course: a course whose legs may name their gait and lead. */
  export interface ICourse extends Omit<ArchetypeCourse.ICourse, "legs"> {
    /** Begin a zero-speed course with all four actual neutral hoof anchors. */
    startFromStanding?: true;
    /** Independently authored world landing surfaces and optional pole obstacles. */
    footing?: QuadrupedFooting.IScene;
    /** A lame limb and its grade, at the walk or trot (`QuadrupedLameness`); an unnamed leg's automatic gait is checked as the fastest it could reach. */
    lameness?: QuadrupedLameness.ILameness;
    /** An optional trunk pitch about the root at each film second, degrees, positive nose-down, such as a draught horse's forward lean into its load; the planted hooves keep their footprints. */
    lean?: Lean;
    /** Lean the body into its bends by the steady-turn balance of speed and curvature (`ArchetypeCourse.lean`), rolled about its long axis on the floor with the hooves on their footprints, as a lunged horse does; upright when absent. */
    leanIn?: true;
    /** The legs in order, at least one. */
    legs: readonly ILeg[];
  }
}
