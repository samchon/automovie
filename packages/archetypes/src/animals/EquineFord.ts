import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  type ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeRide,
} from "../core";
import { EquineFordPlan } from "./EquineFordPlan";
import { EquineSwimPose } from "./EquineSwimPose";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { QuadrupedFooting } from "./QuadrupedFooting";
import { QuadrupedFootingClearance } from "./QuadrupedFootingClearance";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedWorldPose } from "./QuadrupedWorldPose";
import { createQuadruped } from "./createQuadruped";
import { rideQuadruped } from "./rideQuadruped";

/** One-sided difference, seconds, for the offset rates at a cut. */
const STEP: number = 1e-5;

/** Stroke phases sampled per cycle when the stroke's lowest sole is read. */
const SWEEP: number = 96;

/**
 * An equid crossing water on one film clock: it wades down a ford on its own legs, floats free and swims with its measured fore and hind strokes, then lands on the far bank and climbs out on its legs again.
 *
 * The water is a horizontal plane at `water`, and every bed and bank is an authored world plane of `footing` (`QuadrupedFooting`). The wading and climbing are the grounded ride (`rideQuadruped`) on that footing, the wading course ending, and the climbing course starting, at the swim's speed. Between them the animal floats with its back `immersion` below the water, its trunk level on the wading course's final heading, travelling straight at the swim speed, its neck raised by `neck` degrees, and each limb paddling its end's measured stroke (`EquineSwimStroke`, `EquineSwimPose`), the diagonal pairs half a cycle apart. Each cut, from the last grounded second into the swim and from the swim into the first grounded second, is inertialized over `transition` seconds (`QuadrupedWorldPose`), so every displayed bar and its velocity are continuous there; within each cut the whole body rises by the actual depth of any solid that would enter a bed (`QuadrupedFootingClearance`), the contact correction applied after an inertialized blend. Each grounded ride runs with its course datum at the authored ground under its start, an exact vertical translation, so a graded bed is followed by its course legs' rise.
 *
 * Named contact changes: `float` when the hooves leave the ford's bed, `swim` when the stroke is established, `<limb>Stroke` at each stroke's start, `land` when the hooves meet the far bank and `climb` when the climbing gait's footholds hold; the wading ride's instants come before `float` and the climbing ride's after `climb`.
 *
 * The crossing is admitted only where the water floats the animal and the far bank can be reached. The floating animal's standing sole level is the water's surface less the immersion and the neutral back's height; the stroke's lowest sole is read from the actual swim pose over one cycle, and each limb's straight reach from its neutral attachment and actual bar lengths. At the last wading second the authored bed under every hoof lies below the stroke's lowest sole, so the swim leaves it; at the first climbing second the bank under every hoof lies at or above the straight reach of the shortest-reaching limb and below the stroke's lowest sole, so the hooves can stand on it yet the stroke never strikes it. Every floating second is checked against the footing for any solid entering a bed, and every second of the established stroke against the water for the head; over the entry cut the head rises out of the grounded ride's carriage.
 *
 * @param animal The equid, in its neutral pose.
 * @param params The water, the footing, the three courses and the authored swim.
 * @returns The crossing, sampled by film second.
 * @throws {ArchetypeRefusal} For malformed swim or water values, water too shallow to float at the end of the wading, a far bank beyond reach or inside the stroke, a head below the water, a swim shorter than its transition or a bed met while swimming; and as the grounded ride refuses its courses and footing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, the three segments, the cut method, the named contact changes, the admission rules and the units.
 * @evidence contracts/development/implementation.md#principled-implementation Grounded segments are the existing footing-aware ride; the swim is closed-form planar forward kinematics of the measured stroke under a straight constant-speed carriage; cuts are Bollo's quintic inertialization captured once from one-sided differences; admission compares the authored beds under the actual hooves with the stroke's actual lowest sweep and the limbs' actual straight reach; a cut's contact correction lifts the body by the exact primitive depth.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit inputs, prepare both grounded rides at their datums and the swim carriage, capture both cut offsets and the admission levels once, then sample by selecting the segment for the film second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bed, bank or water height is inferred; a crossing the geometry does not allow is refused; the cut's contact correction moves the whole body by the measured depth, never one part, and every displayed floating second is still verified.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation reads four grounded samples, one stroke sweep of `SWEEP` phases and a constant number of poses; each sample is one ride sample, or one O(B) swim pose and blend plus one model emission and an O(P·S) footing check.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The prepared rides, the neutral rig, the carriers, the footing and both cut offsets serve every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the two rides, the prepared pose owner, the footing plan and two fixed offsets for the clip's lifetime; each sample's model is the caller's.
 */
export function EquineFord<Id extends string, D extends string>(
  animal: Archetype<Id, D | QuadrupedBody.Dimension>,
  params: EquineFordPlan.IParams,
): EquineFordPlan.IClip<Id, D | QuadrupedBody.Dimension> {
  type Dimension = D | QuadrupedBody.Dimension;
  const { water, transition, swim } = params;
  const refuse = (axis: string, value: unknown, reason: string): never => {
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: animal.archetype,
      axis,
      value,
      feasible: null,
      reason,
      fix: "Author the water, banks and swim so the animal floats where it leaves the ford and can stand where it reaches the far bank.",
    });
  };
  if (!Number.isFinite(water))
    refuse("water", water, "the water's surface must be a finite height");
  if (!(Number.isFinite(transition) && transition > 0))
    refuse(
      "transition",
      transition,
      "the cut's decay must be positive seconds",
    );
  for (const key of ["length", "speed", "cycle"] as const)
    if (!(Number.isFinite(swim[key]) && swim[key] > 0))
      refuse(`swim.${key}`, swim[key], "must be finite and positive");
  for (const key of ["immersion", "neck"] as const)
    if (!Number.isFinite(swim[key]))
      refuse(`swim.${key}`, swim[key], "must be finite");
  if (swim.length / swim.speed < transition)
    refuse(
      "swim.length",
      swim.length,
      "the swim is shorter than its entry transition",
    );

  const footing: QuadrupedFooting.IPlan = QuadrupedFooting.prepare(
    animal.archetype,
    params.footing,
    false,
  )!;

  // The grounded wading, ending at the swim's speed.
  const entry: ArchetypeRide.IRide<Id, Dimension> = grounded(
    params.entry,
    params.start,
    params.entry.speed ?? 0,
    swim.speed,
  );
  const float: number = entry.duration;
  const land: number = float + swim.length / swim.speed;
  const end: IAutoMovieTransform = entry.plan.at(float).placement;
  const ahead: IAutoMovieVector3 = ArchetypeFrame.axis(end, "z");
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
    scale: { ...ArchetypeFrame.UNIT },
  });
  const exit: IAutoMovieTransform = carriage(land);

  // The grounded climbing, starting at the swim's speed where the swim ends.
  const recovery: ArchetypeRide.IRide<Id, Dimension> = grounded(
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
  const floating: Archetype<Id, Dimension> = world.emit(
    swimming(float),
    carriage(float),
  );
  const sweep: number =
    level +
    Math.min(
      ...Array.from({ length: SWEEP }, (_: unknown, k: number): number => {
        const model: Archetype<Id, Dimension> = world.emit(
          EquineSwimPose(
            world.neutral,
            ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
            phases(k / SWEEP),
            swim.neck,
          ),
          ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
        );
        return Math.min(
          ...QuadrupedBody.LIMBS.map((limb: QuadrupedBody.Limb): number =>
            QuadrupedRestFloor(part(model, QuadrupedBody.BONES[limb][3])),
          ),
        );
      }),
    );
  // The lowest sole each limb reaches hanging straight down from its neutral attachment; the shortest-reaching limb bounds a foothold.
  const reach: number =
    level +
    Math.max(
      ...QuadrupedBody.LIMBS.map(
        (limb: QuadrupedBody.Limb): number =>
          world.neutral.get(QuadrupedBody.BONES[limb][0])!.translation.y -
          QuadrupedBody.BONES[limb].reduce(
            (sum: number, bone: QuadrupedBody.Bone): number =>
              sum + length(part(animal, bone)),
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
    sample: ArchetypeRide.ISample<Id, Dimension>,
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

  const instants: EquineFordPlan.IInstant[] = [
    ...entry.instants.filter(
      (instant: EquineFordPlan.IInstant): boolean => instant.seconds < float,
    ),
    { seconds: float, label: "float" },
    { seconds: float + transition, label: "swim" },
    { seconds: land, label: "land" },
    { seconds: land + transition, label: "climb" },
    ...recovery.instants
      .map(
        (instant: EquineFordPlan.IInstant): EquineFordPlan.IInstant => ({
          seconds: instant.seconds + land,
          label: instant.label,
        }),
      )
      .filter(
        (instant: EquineFordPlan.IInstant): boolean =>
          instant.seconds > land + transition,
      ),
  ];
  for (const limb of QuadrupedBody.LIMBS)
    for (
      let k: number = Math.ceil(-EquineFordPlan.PHASES[limb]);
      float + (k + EquineFordPlan.PHASES[limb]) * swim.cycle < land;
      k++
    )
      instants.push({
        seconds: float + (k + EquineFordPlan.PHASES[limb]) * swim.cycle,
        label: `${limb}Stroke`,
      });
  instants.sort(
    (p: EquineFordPlan.IInstant, q: EquineFordPlan.IInstant): number =>
      p.seconds - q.seconds,
  );

  return {
    duration: land + recovery.duration,
    events: { float, swim: float + transition, land, climb: land + transition },
    instants,
    sample,
  };

  /** One stateless displayed second of the crossing. */
  function sample(seconds: number): EquineFordPlan.ISample<Id, Dimension> {
    if (!Number.isFinite(seconds))
      throw new RangeError("A crossing is sampled at a finite film second");
    if (seconds < float) {
      const grounded: ArchetypeRide.ISample<Id, Dimension> = entry.at(seconds);
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
        const archetype: Archetype<Id, Dimension> = world.emit(
          swimming(seconds),
          placement,
        );
        footing.verify(archetype, placement);
        head(archetype, placement);
        return { archetype, placement, phase: "swimming" };
      }
      return {
        archetype: supported(
          world.blend(into, transition, elapsed, swimming(seconds)),
          placement,
        ),
        placement,
        phase: "floating",
      };
    }
    const grounded: ArchetypeRide.ISample<Id, Dimension> = recovery.at(
      seconds - land,
    );
    const elapsed: number = seconds - land;
    if (elapsed >= transition)
      return {
        archetype: grounded.archetype,
        placement: grounded.placement,
        phase: "climbing",
      };
    return {
      archetype: supported(
        world.blend(out, transition, elapsed, read(grounded)),
        grounded.placement,
      ),
      placement: grounded.placement,
      phase: "landing",
    };
  }

  /** Emit a blended cut pose, lifted by the actual depth of any solid in a bed, then verified. */
  function supported(
    pose: QuadrupedWorldPose.IPose,
    placement: IAutoMovieTransform,
  ): Archetype<Id, Dimension> {
    const first: Archetype<Id, Dimension> = world.emit(pose, placement);
    const lift: number = QuadrupedFootingClearance(
      params.footing,
      first,
      placement,
    );
    const archetype: Archetype<Id, Dimension> =
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
   * A grounded ride on the footing whose course datum is the authored ground under its start: the ride runs over the footing lowered by that height and its samples are raised by it, an exact vertical translation, since a course starts on Y=0 and keeps its body near its datum.
   */
  function grounded(
    leg: EquineFordPlan.IGrounded,
    start: ArchetypeCourse.ICourse["start"],
    startSpeed: number,
    endSpeed: number,
  ): ArchetypeRide.IRide<Id, Dimension> {
    const datum: number = footing.landing(
      { x: start.x, y: 0, z: start.z },
      Quaternion.identity(),
    ).point.y;
    const ride: ArchetypeRide.IRide<Id, Dimension> = rideQuadruped(
      animal,
      {
        start,
        legs: leg.legs,
        cruise: leg.cruise,
        acceleration: leg.acceleration,
        deceleration: leg.deceleration,
        startSpeed,
        endSpeed,
        footing: {
          ...params.footing,
          planes: params.footing.planes.map(
            (plane: QuadrupedFooting.IPlane): QuadrupedFooting.IPlane => ({
              ...plane,
              origin: { ...plane.origin, y: plane.origin.y - datum },
            }),
          ),
        },
      },
      leg.gait,
    );
    const raise = (placement: IAutoMovieTransform): IAutoMovieTransform => ({
      ...placement,
      translation: Vector3.add(placement.translation, { x: 0, y: datum, z: 0 }),
    });
    return {
      ...ride,
      at: (seconds: number): ArchetypeRide.ISample<Id, Dimension> => {
        const sample: ArchetypeRide.ISample<Id, Dimension> = ride.at(seconds);
        return { ...sample, placement: raise(sample.placement) };
      },
      frame: (id: Id, seconds: number): IAutoMovieTransform =>
        raise(ride.frame(id, seconds)),
    };
  }

  /** Each limb's stroke phase: the diagonal pairs half a cycle apart. */
  function phases(cycles: number): Record<QuadrupedBody.Limb, number> {
    return {
      leftFore: cycles + EquineFordPlan.PHASES.leftFore,
      rightFore: cycles + EquineFordPlan.PHASES.rightFore,
      leftHind: cycles + EquineFordPlan.PHASES.leftHind,
      rightHind: cycles + EquineFordPlan.PHASES.rightHind,
    };
  }

  /** The authored bed height under each hoof of a grounded sample, planted or swinging. */
  function soles(grounded: ArchetypeRide.ISample<Id, Dimension>): number[] {
    return QuadrupedBody.LIMBS.map((limb: QuadrupedBody.Limb): number => {
      const hoof: IAutoMovieModelPart = part(
        grounded.archetype,
        QuadrupedBody.BONES[limb][3],
      );
      return footing.landing(
        ArchetypeFrame.compose(grounded.placement, hoof.transform!).translation,
        Quaternion.identity(),
      ).point.y;
    });
  }

  /** Refuse a head whose solid meets the water. */
  function head(
    model: Archetype<Id, Dimension>,
    placement: IAutoMovieTransform,
  ): void {
    const solid: IAutoMovieModelPart = part(model, "head");
    const lowest: number = QuadrupedRestFloor({
      ...solid,
      transform: ArchetypeFrame.compose(placement, solid.transform!),
    });
    if (!(lowest > water))
      refuse(
        "swim.neck",
        swim.neck,
        `the head's lowest surface at ${lowest} m does not clear the water at ${water} m`,
      );
  }
}
/** An actual part of a model. */
function part(
  model: Pick<Archetype, "parts">,
  id: string,
): IAutoMovieModelPart {
  const found: IAutoMovieModelPart | undefined = model.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (found?.transform === undefined || found.transform === null)
    throw new RangeError(`The crossing needs the transformed ${id} part`);
  return found;
}

/** An actual bar's length, joint to joint, metres. */
function length(bar: IAutoMovieModelPart): number {
  if (
    bar.geometry.type !== "primitive" ||
    (bar.geometry.shape.type !== "capsule" &&
      bar.geometry.shape.type !== "cylinder")
  )
    throw new RangeError(`The crossing needs the actual ${bar.id} bar`);
  return bar.geometry.shape.height;
}

/** The highest surface of an actual bar, metres in its model. */
function top(bar: IAutoMovieModelPart): number {
  if (
    bar.geometry.type !== "primitive" ||
    (bar.geometry.shape.type !== "capsule" &&
      bar.geometry.shape.type !== "cylinder")
  )
    throw new RangeError("The crossing needs the actual trunk bar");
  const shape: typeof bar.geometry.shape = bar.geometry.shape;
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(
    bar.transform!.rotation,
    {
      x: 0,
      y: 1,
      z: 0,
    },
  );
  const radial: number =
    shape.type === "capsule"
      ? shape.radius
      : shape.radius * Math.sqrt(Math.max(0, 1 - axis.y * axis.y));
  return (
    bar.transform!.translation.y +
    (Math.abs(axis.y) * shape.height) / 2 +
    radial
  );
}
