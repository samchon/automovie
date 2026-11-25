import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieModelPart, IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { type AutoMovieArchetype, type AutoMovieArchetypeCourse, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal, type AutoMovieArchetypeRide } from "../core";
import { AutoMovieArchetypeEquineFordPlan } from "./AutoMovieArchetypeEquineFordPlan";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedDatumRide } from "./AutoMovieArchetypeQuadrupedDatumRide";
import { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import { EquineSwimPose } from "./EquineSwimPose";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { QuadrupedFootingClearance } from "./QuadrupedFootingClearance";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedWorldPose } from "./QuadrupedWorldPose";
import { createQuadruped } from "./createQuadruped";
import { EquineFordConstants } from "./EquineFordConstants";
import { EquineFordBarReads } from "./EquineFordBarReads";

const { STEP, SWEEP } = EquineFordConstants;
const { part, top, shape } = EquineFordBarReads;

/**
 * An equid crossing water on one film clock: it wades down a ford on its own
 * legs, floats free and swims with its measured fore and hind strokes, then
 * lands on the far bank and climbs out on its legs again.
 *
 * The water is a horizontal plane at `water`, and every bed and bank is an
 * authored world plane of `footing` (`AutoMovieArchetypeQuadrupedFooting`). The
 * wading and climbing are the grounded ride (`rideQuadruped`) on that footing,
 * the wading course ending, and the climbing course starting, at the swim's
 * speed. Between them the animal floats with its back `immersion` below the
 * water, its trunk level on the wading course's final heading, travelling
 * straight at the swim speed, its neck raised by `neck` degrees, and each limb
 * paddling its end's measured stroke (`EquineSwimStroke`, `EquineSwimPose`),
 * the diagonal pairs half a cycle apart. Each cut, from the last grounded
 * second into the swim and from the swim into the first grounded second, is
 * inertialized over `transition` seconds (`QuadrupedWorldPose`), so every
 * displayed bar and its velocity are continuous there; within each cut the
 * whole body rises by the depth of any solid that would enter a bed
 * (`QuadrupedFootingClearance`), the contact correction applied after an
 * inertialized blend. Each grounded ride runs with its course datum at the
 * authored ground under its start, an exact vertical translation, so a graded
 * bed is followed by its course legs' rise.
 *
 * Named contact changes: `float` when the hooves leave the ford's bed, `swim`
 * when the stroke is established, `<limb>Stroke` at each stroke's start, `land`
 * when the hooves meet the far bank and `climb` when the climbing gait's
 * footholds hold; the wading ride's instants come before `float` and the
 * climbing ride's after `climb`.
 *
 * The crossing is admitted only where the water floats the animal and the far
 * bank can be reached. The floating animal's standing sole level is the water's
 * surface less the immersion and the neutral back's height; the stroke's lowest
 * sole is read from the swim pose over one cycle, and each limb's straight
 * reach from its neutral attachment and bar lengths. At the last wading second
 * the authored bed under every hoof lies below the stroke's lowest sole, so the
 * swim leaves it; at the first climbing second the bank under every hoof lies
 * at or above the straight reach of the shortest-reaching limb and below the
 * stroke's lowest sole, so the hooves can stand on it yet the stroke never
 * strikes it. Every floating second is checked against the footing for any
 * solid entering a bed, and every second of the established stroke against the
 * water for the head; over the entry cut the head rises out of the grounded
 * ride's carriage.
 *
 * @param animal The equid, in its neutral pose.
 * @param params The water, the footing, the three courses and the authored
 *   swim.
 * @returns The crossing, sampled by film second.
 * @throws {AutoMovieArchetypeRefusal} For malformed swim or water values, water
 *   too shallow to float at the end of the wading, a far bank beyond reach or
 *   inside the stroke, a head below the water, a swim shorter than its
 *   transition or a bed met while swimming; and as the grounded ride refuses
 *   its courses and footing.
 */
export function AutoMovieArchetypeEquineFord<
  Id extends string,
  D extends string,
>(
  animal: AutoMovieArchetype<Id, D | AutoMovieArchetypeQuadrupedBody.Dimension>,
  params: AutoMovieArchetypeEquineFordPlan.IParams,
): AutoMovieArchetypeEquineFordPlan.IClip<
  Id,
  D | AutoMovieArchetypeQuadrupedBody.Dimension
> {
  type Dimension = D | AutoMovieArchetypeQuadrupedBody.Dimension;
  const { water, transition, swim } = params;
  const refuse = (axis: string, value: unknown, reason: string): never => {
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: animal.archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix: "Author the water, banks and swim so the animal floats where it leaves the ford and can stand where it reaches the far bank.",
    });
  };
  if (!(transition > 0))
    refuse(
      "transition",
      transition,
      "the cut's decay must be positive seconds",
    );
  for (const key of ["length", "speed", "cycle"] as const)
    if (!(swim[key] > 0))
      refuse(`swim.${key}`, swim[key], "must be finite and positive");
  if (swim.length / swim.speed < transition)
    refuse(
      "swim.length",
      swim.length,
      "the swim is shorter than its entry transition",
    );

  const footing: AutoMovieArchetypeQuadrupedFooting.IPlan =
    AutoMovieArchetypeQuadrupedFooting.prepare(
      animal.archetype,
      params.footing,
      false,
    )!;

  // The grounded wading, ending at the swim's speed.
  const entry: AutoMovieArchetypeRide.IRide<Id, Dimension> = grounded(
    params.entry,
    params.start,
    params.entry.speed ?? 0,
    swim.speed,
  );
  const float: number = entry.duration;
  const land: number = float + swim.length / swim.speed;
  const end: IAutoMovieTransform = entry.plan.at(float).placement;
  const ahead: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(end, "z");
  const forward: IAutoMovieVector3 = Vector3.normalize({
    x: ahead.x,
    y: 0,
    z: ahead.z,
  });
  const heading: number = (Math.atan2(forward.x, forward.z) * 180) / Math.PI;

  // The floating carriage: the neutral back `immersion` below the water.
  const trunk: IAutoMovieModelPart = part(animal, "trunk");
  const level: number = water - swim.immersion - top(trunk);
  const yaw: IAutoMovieTransform["rotation"] = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    heading,
  );
  const carriage = (seconds: number): IAutoMovieTransform => ({
    translation: Vector3.add(
      { x: end.translation.x, y: level, z: end.translation.z },
      Vector3.scale(forward, swim.speed * (seconds - float)),
    ),
    rotation: { ...yaw },
    scale: { ...AutoMovieArchetypeFrame.UNIT },
  });
  const exit: IAutoMovieTransform = carriage(land);
  const left: IAutoMovieTransform = entry.at(float).placement;

  // The grounded climbing, starting at the swim's speed where the swim ends.
  const recovery: AutoMovieArchetypeRide.IRide<Id, Dimension> = grounded(
    params.recovery,
    { x: exit.translation.x, z: exit.translation.z, heading },
    swim.speed,
    params.recovery.speed ?? 0,
  );

  const species: createQuadruped.ISpecies = createQuadruped.species(animal);
  const world: QuadrupedWorldPose.IPrepared<Id, Dimension> = QuadrupedWorldPose(
    animal,
    QuadrupedCarriage.of(animal, species),
  );
  const swimming = (seconds: number): QuadrupedWorldPose.IPose =>
    EquineSwimPose(
      world.neutral,
      carriage(seconds),
      phases((seconds - float) / swim.cycle),
      swim.neck,
    );

  // Admission: the ford floats the animal, the stroke's lowest sole and the far bank's soles.
  const floating: AutoMovieArchetype<Id, Dimension> = world.emit(
    swimming(float),
    carriage(float),
  );
  const sweep: number =
    level +
    Math.min(
      ...Array.from({ length: SWEEP }, (_: unknown, k: number): number => {
        const model: AutoMovieArchetype<Id, Dimension> = world.emit(
          EquineSwimPose(
            world.neutral,
            AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
            phases(k / SWEEP),
            swim.neck,
          ),
          AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
        );
        return Math.min(
          ...AutoMovieArchetypeQuadrupedBody.LIMBS.map(
            (limb: AutoMovieArchetypeQuadrupedBody.Limb): number =>
              QuadrupedRestFloor(
                part(model, AutoMovieArchetypeQuadrupedBody.BONES[limb][3]),
              ),
          ),
        );
      }),
    );
  // The lowest sole each limb reaches hanging straight down from its neutral attachment; the shortest-reaching limb bounds a foothold.
  const reach: number =
    level +
    Math.max(
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.map(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): number =>
          world.neutral.get(AutoMovieArchetypeQuadrupedBody.BONES[limb][0])!
            .translation.y -
          AutoMovieArchetypeQuadrupedBody.BONES[limb].reduce(
            (sum: number, bone: AutoMovieArchetypeQuadrupedBody.Bone): number =>
              sum + shape(part(animal, bone)).height,
            0,
          ),
      ),
    );
  const wading: readonly number[] = soles(entry.at(float));
  if (Math.max(...wading) >= sweep)
    refuse(
      "entry",
      wading,
      `the ford's bed under the last wading hooves rises to the stroke's lowest sole at ${sweep} m, so the water does not float the animal there`,
    );
  const banked: readonly number[] = soles(recovery.at(0));
  if (Math.min(...banked) < reach)
    refuse(
      "bank",
      banked,
      `the far bank lies below ${reach} m, the lowest sole every floating limb reaches hanging straight down`,
    );
  if (Math.max(...banked) >= sweep)
    refuse(
      "bank",
      banked,
      `the far bank rises to the stroke's lowest sole at ${sweep} m before the swim ends`,
    );
  head(floating, carriage(float));

  // Both cuts' offsets, captured once.
  const read = (
    sample: AutoMovieArchetypeRide.ISample<Id, Dimension>,
  ): QuadrupedWorldPose.IPose => world.read(sample.archetype, sample.placement);
  const into: QuadrupedWorldPose.IOffset = world.capture(
    read(entry.at(float)),
    read(entry.at(float - STEP)),
    swimming(float),
    swimming(float + STEP),
    STEP,
  );
  const out: QuadrupedWorldPose.IOffset = world.capture(
    swimming(land),
    swimming(land - STEP),
    read(recovery.at(0)),
    read(recovery.at(STEP)),
    STEP,
  );

  const instants: AutoMovieArchetypeEquineFordPlan.IInstant[] = [
    ...entry.instants.filter(
      (instant: AutoMovieArchetypeEquineFordPlan.IInstant): boolean =>
        instant.seconds < float,
    ),
    { seconds: float, label: "float" },
    { seconds: float + transition, label: "swim" },
    { seconds: land, label: "land" },
    { seconds: land + transition, label: "climb" },
    ...recovery.instants
      .map(
        (
          instant: AutoMovieArchetypeEquineFordPlan.IInstant,
        ): AutoMovieArchetypeEquineFordPlan.IInstant => ({
          seconds: instant.seconds + land,
          label: instant.label,
        }),
      )
      .filter(
        (instant: AutoMovieArchetypeEquineFordPlan.IInstant): boolean =>
          instant.seconds > land + transition,
      ),
  ];
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
    for (
      let k: number = Math.ceil(-AutoMovieArchetypeEquineFordPlan.PHASES[limb]);
      float + (k + AutoMovieArchetypeEquineFordPlan.PHASES[limb]) * swim.cycle <
      land;
      k++
    )
      instants.push({
        seconds:
          float +
          (k + AutoMovieArchetypeEquineFordPlan.PHASES[limb]) * swim.cycle,
        label: `${limb}Stroke`,
      });
  instants.sort(
    (
      p: AutoMovieArchetypeEquineFordPlan.IInstant,
      q: AutoMovieArchetypeEquineFordPlan.IInstant,
    ): number => p.seconds - q.seconds,
  );

  return {
    duration: land + recovery.duration,
    events: { float, swim: float + transition, land, climb: land + transition },
    instants,
    sample,
  };

  /** One stateless displayed second of the crossing. */
  function sample(
    seconds: number,
  ): AutoMovieArchetypeEquineFordPlan.ISample<Id, Dimension> {
    if (seconds < float) {
      const grounded: AutoMovieArchetypeRide.ISample<Id, Dimension> =
        entry.at(seconds);
      return {
        archetype: grounded.archetype,
        placement: grounded.placement,
        phase: "wading",
      };
    }
    if (seconds < land) {
      const elapsed: number = seconds - float;
      const placement: IAutoMovieTransform = carriage(seconds);
      if (elapsed >= transition) {
        const archetype: AutoMovieArchetype<Id, Dimension> = world.emit(
          swimming(seconds),
          placement,
        );
        footing.verify(archetype, placement);
        head(archetype, placement);
        return { archetype, placement, phase: "swimming" };
      }
      const bridged: IAutoMovieTransform = QuadrupedWorldPose.bridge(
        {
          ...left,
          translation: Vector3.add(
            left.translation,
            Vector3.scale(forward, swim.speed * elapsed),
          ),
        },
        placement,
        elapsed / transition,
      );
      return {
        archetype: supported(
          world.blend(into, transition, elapsed, swimming(seconds)),
          bridged,
        ),
        placement: bridged,
        phase: "floating",
      };
    }
    const grounded: AutoMovieArchetypeRide.ISample<Id, Dimension> = recovery.at(
      seconds - land,
    );
    const elapsed: number = seconds - land;
    if (elapsed >= transition)
      return {
        archetype: grounded.archetype,
        placement: grounded.placement,
        phase: "climbing",
      };
    const bridged: IAutoMovieTransform = QuadrupedWorldPose.bridge(
      carriage(seconds),
      grounded.placement,
      elapsed / transition,
    );
    return {
      archetype: supported(
        world.blend(out, transition, elapsed, read(grounded)),
        bridged,
      ),
      placement: bridged,
      phase: "landing",
    };
  }

  /**
   * Emit a blended cut pose, lifted by the depth of any solid in a bed, then
   * verified.
   */
  function supported(
    pose: QuadrupedWorldPose.IPose,
    placement: IAutoMovieTransform,
  ): AutoMovieArchetype<Id, Dimension> {
    const first: AutoMovieArchetype<Id, Dimension> = world.emit(
      pose,
      placement,
    );
    const lift: number = QuadrupedFootingClearance(
      params.footing,
      first,
      placement,
    );
    const archetype: AutoMovieArchetype<Id, Dimension> =
      lift === 0
        ? first
        : world.emit(
            {
              root: {
                ...pose.root,
                translation: Vector3.add(pose.root.translation, {
                  x: 0,
                  y: lift,
                  z: 0,
                }),
              },
              local: pose.local,
            },
            placement,
          );
    footing.verify(archetype, placement);
    return archetype;
  }

  /**
   * A grounded segment at the ground's datum under its start
   * (`AutoMovieArchetypeQuadrupedDatumRide`).
   */
  function grounded(
    leg: AutoMovieArchetypeEquineFordPlan.IGrounded,
    start: AutoMovieArchetypeCourse.ICourse["start"],
    startSpeed: number,
    endSpeed: number,
  ): AutoMovieArchetypeRide.IRide<Id, Dimension> {
    return AutoMovieArchetypeQuadrupedDatumRide(
      animal,
      {
        start,
        legs: leg.legs,
        cruise: leg.cruise,
        acceleration: leg.acceleration,
        deceleration: leg.deceleration,
        startSpeed,
        endSpeed,
        footing: params.footing,
      },
      leg.gait,
    );
  }

  /** Each limb's stroke phase: the diagonal pairs half a cycle apart. */
  function phases(
    cycles: number,
  ): Record<AutoMovieArchetypeQuadrupedBody.Limb, number> {
    return {
      leftFore: cycles + AutoMovieArchetypeEquineFordPlan.PHASES.leftFore,
      rightFore: cycles + AutoMovieArchetypeEquineFordPlan.PHASES.rightFore,
      leftHind: cycles + AutoMovieArchetypeEquineFordPlan.PHASES.leftHind,
      rightHind: cycles + AutoMovieArchetypeEquineFordPlan.PHASES.rightHind,
    };
  }

  /**
   * The authored bed height under each hoof of a grounded sample, planted or
   * swinging.
   */
  function soles(
    grounded: AutoMovieArchetypeRide.ISample<Id, Dimension>,
  ): number[] {
    return AutoMovieArchetypeQuadrupedBody.LIMBS.map(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): number => {
        const hoof: IAutoMovieModelPart = part(
          grounded.archetype,
          AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
        );
        return footing.landing(
          AutoMovieArchetypeFrame.compose(grounded.placement, hoof.transform!)
            .translation,
          Quaternion.identity(),
        ).point.y;
      },
    );
  }

  /** Refuse a head whose solid meets the water. */
  function head(
    model: AutoMovieArchetype<Id, Dimension>,
    placement: IAutoMovieTransform,
  ): void {
    const solid: IAutoMovieModelPart = part(model, "head");
    const lowest: number = QuadrupedRestFloor({
      ...solid,
      transform: AutoMovieArchetypeFrame.compose(placement, solid.transform!),
    });
    if (!(lowest > water))
      refuse(
        "swim.neck",
        swim.neck,
        `the head's lowest surface at ${lowest} m does not clear the water at ${water} m`,
      );
  }
}
