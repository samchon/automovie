import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
} from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import { AutoMovieArchetypeQuadrupedJoints } from "../AutoMovieArchetypeQuadrupedJoints";
import { AutoMovieArchetypeQuadrupedLameness } from "../AutoMovieArchetypeQuadrupedLameness";
import { AutoMovieArchetypeQuadrupedLocomotion } from "../AutoMovieArchetypeQuadrupedLocomotion";
import { AutoMovieArchetypeQuadrupedMotion } from "../AutoMovieArchetypeQuadrupedMotion";
import { EquineFlightClock } from "../equine/EquineFlightClock";
import { EquineFootwork } from "../equine/EquineFootwork";
import { EquineJump } from "../equine/EquineJump";
import { EquineLateral } from "../equine/EquineLateral";
import { EquinePitch } from "../equine/EquinePitch";
import { EquineRideTerrain } from "../equine/EquineRideTerrain";
import { EquineTuck } from "../equine/EquineTuck";
import { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";
import { QuadrupedPoleSwing } from "./QuadrupedPoleSwing";
import { QuadrupedRideAdmission } from "./QuadrupedRideAdmission";
import { QuadrupedRideClock } from "./QuadrupedRideClock";
import { QuadrupedRidePose } from "./QuadrupedRidePose";
import { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import { QuadrupedSwingChord } from "./QuadrupedSwingChord";
import { QuadrupedSwingGoal } from "./QuadrupedSwingGoal";
import type { QuadrupedTimedCues } from "./QuadrupedTimedCues";
import { QuadrupedTimedRoute } from "./QuadrupedTimedRoute";
import { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";
import { planEquineFlight } from "../equine/planEquineFlight";
import { refuseQuadrupedReach } from "../quadruped/refuseQuadrupedReach";
import { trialEquineFlight } from "../equine/trialEquineFlight";

/**
 * A quadruped going along a course: its root on the path, its trunk rising and
 * falling and its head nodding with the stride, its four limbs stepping in the
 * gait's order, and its gait and lead changing with the speed or as the
 * course's legs name them. Every kind is ridden by this one function, from its
 * species' data (`createQuadruped.species`).
 *
 * The stride's timing is the selected declared table's
 * (`AutoMovieArchetypeQuadrupedGait.timing`) at the course's speed and the
 * animal's withers height, shifted by its normalized `tempo`. The source owner
 * distinguishes observed, derived and authored clocks; absolute clocks stay
 * unscaled, otherwise the table's dynamic-similarity assumption is provisional
 * as `AutoMovieArchetypeQuadrupedGait.scale` states. Each foot lands at its
 * phase of the stride, stays planted for the duty factor's share of it while
 * the body passes over, then swings forward, lifted clear of the ground and of
 * any authored pole its hoof crosses, with its carpus or hock folded; a gait
 * that states its swing height by landmark
 * (`AutoMovieArchetypeQuadrupedGait.IElevation`) lifts the toe to that point of
 * the cannon. A planted foot stays at its recorded world footprint on level
 * straight and curved legs, including signed backing and gait changes. A route
 * pause holds the hoof clock and emits no new touchdown inside its stationary
 * interval. The ride adds an instant for every landing, `leftForeOn`,
 * `rightHindOn` and so on, which a rider's rising trot or a walker's step
 * beside the animal locks to. The tack rides the trunk, so `frame("seat",
 * seconds)` is the moving support a rider sits on and `frame("hitch", seconds)`
 * the one a cart is drawn from; the species' nodding parts turn with the head.
 *
 * The gait of each stride is the one a course leg names, else the one `gait`
 * names, else the one the speed calls for at the species' change points
 * (`QuadrupedChange`), going up above a change point by the species' hysteresis
 * and coming down below it by as much, so a speed hovering at the boundary does
 * not flip the gait every stride. A change is decided at the left fore's
 * landing, the stride's start, and takes the next stride: each foot's landing
 * moves from the old gait's phase to the new one's, so a planted foot stays
 * planted, and the ride names `gait:<from>-<to>` there. A leg may name a `lead`
 * for a leaded gait, whose right lead mirrors the left; a change of lead is a
 * flying change, taken the same way and named `lead:<from>-<to>`.
 *
 * A leg's `equineFootwork` names a horse's technique
 * (`EquineFootwork.Technique`). A lateral figure turns the body off the travel
 * heading (`EquineLateral`), each planted hoof then centred between its neutral
 * points at landing and release; a jump moves the takeoff stride's landings,
 * holds the hoof clock through a ballistic flight and lifts the body over the
 * authored obstacles (`EquineJump`), naming `jumpApproach`, `jumpTakeoff`
 * (final hind liftoff), `jumpLanding` (first fore landing) and `jumpRecovery`;
 * a baulk names `baulkStop` and `baulkSettle` at its halt.
 *
 * Requested gaits and speeds are admitted before timing is read
 * (`QuadrupedRideAdmission`). Virtual landing clocks use the course boundary's
 * state while their spatial samples remain held by the original plan. An
 * explicit standing departure starts with all four neutral hoof anchors, each
 * releasing for the first gait swing without a virtual pre-roll touchdown. An
 * optional authoring table is admitted and copied before planning; it supplies
 * only this ride's clocks and pose ranges.
 *
 * Limb roots remain fixed in their parent's local frame. Four unchanged foot
 * goals and cylinder/capsule soles constrain one body-root height; the gait's
 * bob is its soft preference, while the horizontal course is kept. The shared
 * generic FK must reproduce every solved origin and endpoint.
 *
 * @param animal The animal, as `createQuadruped` or its kind's producer builds
 *   it.
 * @param route The course its root follows, or a planned course such as a timed
 *   one (`AutoMovieArchetypeCourse.timed`), ridden as one leg whose strides
 *   take the gait its speed calls for, or a planned course with named-gait cues
 *   (`AutoMovieArchetypeQuadruped.IRideCued`) whose cued intervals take the named gait; a leg may
 *   name the `gait`, the `lead` and an equine technique.
 * @param gait The gait of every stride whose leg names none; absent, the speed
 *   chooses it.
 * @param table Optional admitted authoring table, replacing only this ride's
 *   gait data.
 * @returns The ride.
 * @throws {AutoMovieArchetypeRefusal} When the animal is no quadruped's, a
 *   supplied table fails AutoMovieArchetypeQuadrupedLocomotion.admit, a gait is
 *   not in the selected table, a requested speed is outside its domain, the
 *   course is malformed, a technique is inadmissible, or its phase advance
 *   exceeds representability/capacity before stride enumeration.
 * @throws {RangeError} For unsupported geometry/carriage or foot goals whose
 *   four fixed chains and body-floor constraint have no common root height.
 */
export function rideQuadrupedImplementation<Affordance extends string, D extends string>(
  animal: AutoMovieArchetype<
    Affordance,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  >,
  route:
    | AutoMovieArchetypeQuadruped.IRideCourse
    | AutoMovieArchetypeCourse.IPlan
    | QuadrupedTimedCues.ICued,
  gait?: AutoMovieArchetypeQuadrupedGait.Gait,
  table?: AutoMovieArchetypeQuadrupedGait.ITable,
): AutoMovieArchetypeRide.IRide<
  Affordance,
  D | AutoMovieArchetypeQuadrupedBody.Dimension
> {
  /** Keep the source dimensions and the solver's quadruped size. */
  type Dimension = D | AutoMovieArchetypeQuadrupedBody.Dimension;
  /** The pose function the ride reads. */
  type Posed = (
    state: AutoMovieArchetypeCourse.IState,
    seconds: number,
  ) => AutoMovieArchetypeRide.IPose<Affordance, Dimension>;
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

  const source: AutoMovieArchetypeQuadruped.ISpecies = AutoMovieArchetypeQuadruped.species(animal);
  const species: AutoMovieArchetypeQuadruped.ISpecies =
    table === undefined
      ? source
      : {
          ...source,
          table: AutoMovieArchetypeQuadrupedLocomotion.admit(table),
        };
  const dimensions: Readonly<
    Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
  > = animal.dimensions;
  const tempo: number = dimensions.tempo ?? 0;
  const withers: number = dimensions.withersHeight!;
  const rig: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read> =
    AutoMovieArchetypeQuadrupedJoints.read(animal.parts);
  const { plan, course, holds }: QuadrupedTimedRoute.IRoute =
    QuadrupedTimedRoute.of(species, route, withers, gait);
  const departure: AutoMovieArchetypeCourse.IState | undefined =
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
  const ground: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined =
    terrain.ground;

  /** Choose the next stride from the current route state or explicit footwork. */
  function decide(
    state: AutoMovieArchetypeCourse.IState,
    from: QuadrupedStridePlan.IStride,
  ): QuadrupedStridePlan.IStride {
    const index: number = QuadrupedRideAdmission.legIndex(plan, state.distance);
    const leg: AutoMovieArchetypeQuadruped.IRideLeg = course.legs[index]!;
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

  const slowest: AutoMovieArchetypeQuadrupedGait.Gait = species.table.order[0]!;
  const fastest: AutoMovieArchetypeQuadrupedGait.Gait =
    species.table.order[species.table.order.length - 1]!;
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
  const limp: AutoMovieArchetypeQuadrupedLameness.Offset | undefined =
    AutoMovieArchetypeQuadrupedLameness.prepare(
      species.archetype,
      course.lameness,
      course.legs,
      gait ?? fastest,
      animal.parts,
      rig.limbs,
    );
  const pose: QuadrupedRidePose.IPrepared<Affordance, Dimension> =
    QuadrupedRidePose.prepare(animal, species, rig);
  const tucks: EquineTuck.IFores = EquineTuck.fores(rig.limbs, withers);

  /**
   * Assemble the stride plan, instants and pose function, with a jump's flight
   * when it is known. A jump's trial assembly, flown without its arc, skips the
   * footing check its displayed ride must pass.
   */
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
      flight === undefined ? holds : [...holds, ...EquineJump.holds(flight)],
    );
    const strides: QuadrupedStridePlan.IPlan = QuadrupedStridePlan.build(
      species,
      clock,
      decide,
      initial,
      moved,
    );

    // Hoof landings and the gait, lead and technique events.
    const instants: EquineFootwork.IInstant[] = [
      ...footwork.instants,
      ...QuadrupedStridePlan.events(
        strides,
        departure !== undefined,
        footwork.slide?.contact ?? Infinity,
      ),
    ];
    const flown: EquineFlightClock.IClock = EquineFlightClock.of(
      flight,
      strides,
      animal.properties.centerOfMass,
    );
    const { takeoff, landing, pitch }: EquineFlightClock.IClock = flown;
    instants.push(...flown.instants);

    /**
     * The body's world placement: the course's, turned by a lateral figure and
     * pitched and lifted through a jump.
     */
    const body = (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
    ): IAutoMovieTransform =>
      EquinePitch.place(
        state.placement,
        EquineLateral.heading(footwork.lateral, seconds),
        pitch === undefined ? undefined : EquinePitch.at(pitch, seconds),
      );
    /**
     * Where a stance plants: the course placement turned by a lateral figure
     * and moved by the jump's fore-aft shift of the limb's shoulder or hip, so
     * a hoof lands within that joint's reach.
     */
    const anchor = (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      fore: boolean,
    ): IAutoMovieTransform =>
      EquinePitch.place(
        state.placement,
        EquineLateral.heading(footwork.lateral, seconds),
        pitch === undefined
          ? undefined
          : {
              y: 0,
              z: EquinePitch.shift(
                EquinePitch.at(pitch, seconds),
                rig.limbs[fore ? "leftFore" : "leftHind"][0]!,
              ),
              pitch: 0,
            },
      );
    const stance: ReturnType<typeof QuadrupedHoofTrack.stances> =
      QuadrupedHoofTrack.stances(
        plan,
        clock,
        strides.secondsAt,
        plan.bends.length > 0 ||
          footwork.lateral.length > 0 ||
          pitch !== undefined
          ? anchor
          : undefined,
        EquineLateral.crossing(footwork.lateral, rig.limbs, animal.parts),
      );

    /**
     * The displayed placement: the body's, tilted by a lameness, pitched by a
     * lean and banked into a bend when asked. As a horse on a circle leans by
     * the gravitational and centripetal prediction (Pfau et al. 2012), the
     * lean-in rolls the body about its long axis on the floor by the
     * steady-turn balance of its speed and curvature; the hooves keep their
     * world footprints (a bend anchors them).
     */
    const place = (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      tilt?: EquinePitch.ITilt,
    ): IAutoMovieTransform => {
      const pitched: IAutoMovieTransform = EquinePitch.lean(
        EquinePitch.place(body(state, seconds), 0, tilt),
        (course.lean?.(seconds) ?? 0) + EquineFootwork.sit(footwork, seconds),
      );
      const inward: number =
        course.leanIn === true ? AutoMovieArchetypeCourse.lean(state) : 0;
      return inward === 0
        ? pitched
        : AutoMovieArchetypeCourse.banked(
            { ...state, placement: pitched },
            inward,
          );
    };
    /** The course state at a second with the displayed placement. */
    const shown = (seconds: number): AutoMovieArchetypeCourse.IState => {
      const state: AutoMovieArchetypeCourse.IState = plan.at(seconds);
      return { ...state, placement: place(state, seconds) };
    };

    // A swing lifts over the poles its hoof crosses, read once per swing where the footing has poles (`QuadrupedPoleSwing`).
    const crossings: QuadrupedPoleSwing.Crossings | undefined = trial
      ? undefined
      : QuadrupedPoleSwing.crossings(ground, animal.parts, shown);

    /**
     * Read the course and derive the four current footprint demands before any
     * geometry sharing.
     */
    const posed: Posed = (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
    ): AutoMovieArchetypeRide.IPose<Affordance, Dimension> => {
      const phase: number = strides.phaseAt(seconds);
      const now: AutoMovieArchetypeQuadrupedGait.Gait = strides.strideOf(
        Math.floor(phase),
      ).gait;
      const timing: AutoMovieArchetypeQuadrupedGait.ITiming = clock.timing(
        now,
        seconds,
      );
      const lame: AutoMovieArchetypeQuadrupedLameness.IOffset | undefined =
        limp?.(strides, phase, timing);
      const placement: IAutoMovieTransform = place(state, seconds, lame?.tilt);
      const current: AutoMovieArchetypeCourse.IState = { ...state, placement };
      const going: number = Math.min(
        1,
        state.speed /
          AutoMovieArchetypeQuadrupedGait.range(species, now, withers).minimum,
      );

      // The trunk sinks as many times a stride as the gait has beats.
      const sink: number =
        ((going *
          AutoMovieArchetypeQuadrupedGait.of(species, now).bob *
          withers) /
          2) *
        (1 -
          Math.cos(
            2 * Math.PI * AutoMovieArchetypeQuadrupedGait.BEATS[now] * phase,
          ));
      const goals: Map<
        AutoMovieArchetypeQuadrupedBody.Limb,
        QuadrupedRidePose.IGoal
      > = new Map();
      for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
        const fore: boolean = limb.endsWith("Fore");
        const rest: readonly IAutoMovieVector3[] = rig.limbs[limb];

        // The stance this foot is in or has just left, and the next one it swings to.
        const m: number = strides.latest(limb, phase);
        const landed: number = strides.landing(limb, m);
        const coming: number = strides.landing(limb, m + 1);
        const which: AutoMovieArchetypeQuadrupedGait.IGait =
          AutoMovieArchetypeQuadrupedGait.of(species, strides.strideOf(m).gait);
        // A swing's lift and fold are its own stride's, the share of them called for by the speed against that stride's gait: read against the gait the body changes to, the share would jump where the body's stride changes mid-swing, folding the swinging limb at once and dropping the trunk the root's reach holds.
        const swinging: number = Math.min(
          1,
          state.speed /
            AutoMovieArchetypeQuadrupedGait.range(
              species,
              strides.strideOf(m).gait,
              withers,
            ).minimum,
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

        // A swing in the jump's flight is carried by the flying body from its own liftoff; a jump admits no lameness, so `place` needs no tilt there.
        const carried: boolean =
          !step.planted &&
          EquineFlightClock.carries(flight, landed + step.from.duty, coming);
        const off: number = strides.secondsAt(landed + step.from.duty);
        const on: number = strides.secondsAt(coming);
        // How far the hoof's leg caps the body's height (`QuadrupedRidePose.IGoal.load`): wholly while planted, since a hoof on the ground cannot leave it before lift-off whatever its ground reaction, and over the swing as far as the hoof still rests on the ground (`QuadrupedSwingChord.weight`, nil at both ends), so the swing leg adapts to the body the planted legs carry and the cap eases continuously at lift-off and touchdown.
        const load: number = step.planted
          ? 1
          : 1 - swinging * QuadrupedSwingChord.weight(step.along);
        const goal: QuadrupedRidePose.IGoal = QuadrupedSwingGoal.of({
          limb,
          index: m,
          gait: which,
          withers,
          rest,
          step,
          following,
          worldAnchors,
          ground,
          trial,
          clear: terrain.clear[limb],
          carried,
          shown,
          current,
          off,
          on,
          going: swinging,
          load,
          crossings,
        });
        goals.set(
          limb,
          carried
            ? tucks[limb](
                goal,
                EquineTuck.weight(seconds, off, takeoff, landing, on, fore),
              )
            : terrain.goal(limb, seconds, goal, placement),
        );
      }

      // The neck and the head, with the tack the species names as riding them, pitch about the neck's root, timed to the footfalls as declared.
      const nod: number =
        going *
          AutoMovieArchetypeQuadrupedMotion.nod(
            species,
            strides.strideOf(Math.floor(phase)),
            phase,
            timing.duty,
          ) +
        (lame?.nod ?? 0);
      const aims: Readonly<
        Record<AutoMovieArchetypeQuadrupedBody.Limb, QuadrupedRidePose.IGoal>
      > = {
        leftFore: goals.get("leftFore")!,
        rightFore: goals.get("rightFore")!,
        leftHind: goals.get("leftHind")!,
        rightHind: goals.get("rightHind")!,
      };
      return {
        // The whole model is posed only when it is read: a contact's frame
        // reads its carrier's chain alone (`QuadrupedRidePose.IPrepared.frame`).
        get archetype(): AutoMovieArchetype<Affordance, Dimension> {
          let archetype: AutoMovieArchetype<Affordance, Dimension>;
          try {
            archetype = pose.sample(aims, nod, -sink);
          } catch (error) {
            throw refuseQuadrupedReach(species.archetype, seconds, error);
          }
          archetype = terrain.tail(archetype, placement);
          if (!trial) ground?.verify(archetype, placement);
          return archetype;
        },
        placement: AutoMovieArchetypeFrame.copy(placement),
        frame: (id: Affordance): IAutoMovieTransform | undefined => {
          try {
            return pose.frame(aims, nod, -sink, id);
          } catch (error) {
            throw refuseQuadrupedReach(species.archetype, seconds, error);
          }
        },
      };
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
        return trialEquineFlight(
          trial.strides,
          trial.clock,
          trial.posed,
          plan,
          animal.properties.centerOfMass,
        );
      },
    );
    assembly = assemble(flight.moved, flight);
  }
  return AutoMovieArchetypeRide.along(
    animal,
    plan,
    assembly.posed,
    assembly.instants,
  );
}
