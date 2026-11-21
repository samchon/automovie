import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDrawSession,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeRide,
} from "../core";
import { createCart } from "../vehicles/createCart";
import { HorseHarness } from "./HorseHarness";
import { HorseTeamCourse } from "./HorseTeamCourse";
import type { HorseTeamPlan } from "./HorseTeamPlan";
import { QuadrupedGait } from "./QuadrupedGait";
import { createHorse } from "./createHorse";
import { createQuadruped } from "./createQuadruped";
import { rideHorse } from "./rideHorse";

/** Points a slack trace is laid through, ends included. */
const SAG_POINTS: number = 9;

/**
 * A team of harnessed horses put to one pole vehicle: a pair, a tandem, a four-in-hand, a six-up or a quadriga, each horse on its own ride in its own place, the vehicle drawn by its pole head.
 *
 * The hitch expands into places (`HorseTeamPlan.IPlace`): wheelers abreast `spacing` apart either side of the pole, each with its chest's front at the pole head, and each further rank `length` ahead; a quadriga's outer pair runs abreast of the poled pair as trace horses. Each horse's course is the team's path offset to its place (`HorseTeamCourse`), so in a turn the outside horse travels farther in proportion to its radius, and each horse keeps its own gait phase on its own ride (`rideHorse`). The vehicle is the existing towed contract (`createCart.towing`, `ArchetypeRide.towed`) drawn by a pole head that follows the team's own course at the wheelers' hitch height.
 *
 * The spans are laid between posed parts and vehicle-rigid points: a pole strap from each poled wheeler's inner point of draft to the pole head; the traces of a horse beside the vehicle's front from its points of draft back `trace` metres along the vehicle to the bar at its place; a leader's traces from its points of draft to the lead bar at the pole head beside its place. While drawing every trace is taut. While braking to the course's end the wheelers hold the vehicle on the pole straps and breeching, so their traces slacken, and the leaders, which cannot brake it, slacken theirs; these are authored states, not simulated forces.
 *
 * Refused: a horse count that does not match the hitch, an unharnessed horse, spacing that lets two barrels touch, a rank length shorter than a horse, a course whose first or last leg is not a straight longer than every rank's offset, and a turn whose inside or outside horse would leave the gait's declared speeds, with the least admissible radius; the towing refuses a front axle turned past its lock.
 *
 * @param horses The harnessed horses, in place order: wheelers first, left before right, then each rank forward.
 * @param vehicle A pole vehicle from `createCart`.
 * @param params The hitch, spacings, course and authored states.
 * @returns The team, sampled by film second.
 * @throws {ArchetypeRefusal} As stated above.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the places, the per-horse courses, the vehicle's leader, the spans, the states and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Parallel offset paths at radius-proportional speeds keep every horse in its place on its own ride; the vehicle follows the pole head's exact team path through the shared towing law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Expand the places, admit the geometry, build one ride per horse and one tow, then lay the spans per sample.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No horse is moved rigidly with the vehicle; each strides its own path, and an impossible radius is refused with its feasible minimum.
 * @evidence contracts/development/implementation.md#efficient-algorithms N rides and one towing integration at preparation; N horse samples and one vehicle sample per second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shared ride, towing support and harness parts.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the rides and the tow for the team's lifetime.
 */
export function HorseTeam(
  horses: readonly Archetype<createHorse.Affordance, createHorse.Dimension>[],
  vehicle: Archetype<createCart.Affordance, createCart.Dimension>,
  params: HorseTeamPlan.IParams,
): HorseTeamPlan.ITeam<createCart.Affordance, createCart.Dimension> {
  const refuse = (
    axis: string,
    value: unknown,
    reason: string,
    minimum: number | null = null,
  ): never => {
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "horse",
      axis,
      value,
      feasible:
        minimum === null
          ? null
          : { kind: "range", minimum, maximum: null, unit: "m" },
      reason,
      fix: "Put harnessed horses to a pole vehicle in a hitch whose turns their gait can follow.",
    });
  };
  for (const key of [
    "spacing",
    "length",
    "cruise",
    "rate",
    "sag",
    "trace",
  ] as const)
    if (!(Number.isFinite(params[key]) && params[key] > 0))
      refuse(key, params[key], "must be finite and positive");
  const layout: readonly HorseTeamPlan.IPlace[] = places();
  if (horses.length !== layout.length)
    refuse(
      "horses",
      horses.length,
      `a ${params.hitch} needs ${layout.length} horses`,
    );
  const rigs: createHorse.IRig[] = horses.map(
    (
      horse: Archetype<createHorse.Affordance, createHorse.Dimension>,
      k: number,
    ): createHorse.IRig => {
      if (
        !horse.affordances.some(
          (a: IAutoMovieAffordance): boolean => a.id === "hitch",
        )
      )
        refuse(
          `horses[${k}]`,
          horse.name,
          "the horse wears no driving harness",
        );
      return createHorse.rig(horse.dimensions);
    },
  );
  const widest: number = Math.max(
    ...rigs.map((rig: createHorse.IRig): number => 2 * rig.barrel),
  );
  if (!(params.spacing > widest))
    refuse(
      "spacing",
      params.spacing,
      "horses abreast would touch barrels",
      widest,
    );
  const longest: number = Math.max(
    ...rigs.map((rig: createHorse.IRig): number => rig.nose.z - rig.buttock.z),
  );
  if (
    layout.some((place: HorseTeamPlan.IPlace): boolean => place.ahead > 0) &&
    !(params.length > longest)
  )
    refuse(
      "length",
      params.length,
      "a leader would stand on its wheeler",
      longest,
    );

  // Each place's distance ahead of the pole head: the chest's front at the pole head, ranks `length` apart.
  const placed: HorseTeamPlan.IPlace[] = layout.map(
    (place: HorseTeamPlan.IPlace, k: number): HorseTeamPlan.IPlace => ({
      ...place,
      ahead: place.ahead - HorseHarness.chest(rigs[k]!, Math.PI / 2).z,
    }),
  );
  const first: (typeof params.legs)[number] | undefined = params.legs[0];
  const final: (typeof params.legs)[number] | undefined = params.legs.at(-1);
  const reach: number = Math.max(
    ...placed.map((place: HorseTeamPlan.IPlace): number =>
      Math.abs(place.ahead),
    ),
  );
  if (
    first?.kind !== "straight" ||
    final?.kind !== "straight" ||
    !(first.length > reach && final.length > reach)
  )
    refuse(
      "legs",
      params.legs.length,
      `the first and last legs must be straights longer than ${reach} m`,
    );
  turns(placed);

  const rides: ArchetypeRide.IRide<
    createHorse.Affordance,
    createHorse.Dimension
  >[] = horses.map(
    (
      horse: Archetype<createHorse.Affordance, createHorse.Dimension>,
      k: number,
    ): ArchetypeRide.IRide<createHorse.Affordance, createHorse.Dimension> =>
      rideHorse(horse, HorseTeamCourse(params, placed[k]!), params.gait),
  );
  const head: ArchetypeRide.IRide<"hitch", never> = ArchetypeRide.along(
    new ArchetypeBuilder<"hitch", never>({
      material: "steel",
      name: "team pole head",
      draw: new ArchetypeDrawSession<never>("teamPoleHead", {}, undefined),
    })
      .box(
        "head",
        { x: 0.01, y: 0.01, z: 0.01 },
        { x: 0, y: horses[0]!.affordance("hitch").frame.translation.y, z: 0 },
      )
      .affordance({
        id: "hitch",
        kind: "hook",
        frame: ArchetypeFrame.upright({
          x: 0,
          y: horses[0]!.affordance("hitch").frame.translation.y,
          z: 0,
        }),
        extent: null,
      })
      .build(1),
    HorseTeamCourse(params, { role: "wheeler", lateral: 0, ahead: 0 }),
  );
  const towed: ArchetypeRide.ITowedRide<
    createCart.Affordance,
    createCart.Dimension
  > = ArchetypeRide.towed(head, "hitch", vehicle, "coupling", {
    support: createCart.towing(vehicle),
  });
  const brake: number = params.stop
    ? head.duration - params.cruise / params.rate
    : head.duration;
  const coupling: IAutoMovieVector3 =
    vehicle.affordance("coupling").frame.translation;

  return { duration: head.duration, brake, places: placed, rides, at };

  /** One displayed second. */
  function at(
    seconds: number,
  ): HorseTeamPlan.ISample<createCart.Affordance, createCart.Dimension> {
    const stage: HorseTeamPlan.Stage = seconds >= brake ? "brake" : "pull";
    const samples: ArchetypeRide.ISample<
      createHorse.Affordance,
      createHorse.Dimension
    >[] = rides.map(
      (
        ride: ArchetypeRide.IRide<
          createHorse.Affordance,
          createHorse.Dimension
        >,
      ): ArchetypeRide.ISample<createHorse.Affordance, createHorse.Dimension> =>
        ride.at(seconds),
    );
    const carried: ArchetypeRide.ISample<
      createCart.Affordance,
      createCart.Dimension
    > = towed.at(seconds);
    const onVehicle = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      ArchetypeFrame.point(carried.placement, local);
    const lines: ArchetypeRide.ILineState[] = [];
    placed.forEach((place: HorseTeamPlan.IPlace, k: number): void => {
      const sample: ArchetypeRide.ISample<
        createHorse.Affordance,
        createHorse.Dimension
      > = samples[k]!;
      const spread: number = rigs[k]!.draft.x;
      for (const [side, sign] of HorseHarness.SIDES) {
        const from: IAutoMovieVector3 = part(
          sample,
          HorseHarness.ENDS.draft[side],
        );
        const to: IAutoMovieVector3 = onVehicle({
          x: coupling.x + place.lateral + sign * spread,
          y: coupling.y,
          z: coupling.z - (place.ahead < 0 ? params.trace : 0),
        });
        lines.push({
          id: `trace-${k}-${side}`,
          radius: createCart.TRACE,
          points:
            stage === "brake"
              ? HorseHarness.slack(from, to, params.sag, SAG_POINTS)
              : [from, to],
        });
      }
      if (
        place.role === "wheeler" &&
        place.lateral !== 0 &&
        Math.abs(place.lateral) < params.spacing
      )
        lines.push({
          id: `pole-strap-${k}`,
          radius: createCart.TRACE,
          points: [
            part(
              sample,
              HorseHarness.ENDS.draft[place.lateral > 0 ? "right" : "left"],
            ),
            onVehicle(coupling),
          ],
        });
    });
    return {
      stage,
      horses: samples,
      breeching: placed.map(
        (place: HorseTeamPlan.IPlace): boolean =>
          stage === "brake" && place.role === "wheeler",
      ),
      vehicle: carried.archetype,
      placement: carried.placement,
      lines,
    };
  }

  /** The hitch's places before their chest offsets: role, lateral offset and rank distance. */
  function places(): HorseTeamPlan.IPlace[] {
    const half: number = params.spacing / 2;
    const pair = (
      role: HorseTeamPlan.Role,
      ahead: number,
    ): HorseTeamPlan.IPlace[] => [
      { role, lateral: half, ahead },
      { role, lateral: -half, ahead },
    ];
    switch (params.hitch) {
      case "pair":
        return pair("wheeler", 0);
      case "tandem":
        return [
          { role: "wheeler", lateral: 0, ahead: 0 },
          { role: "leader", lateral: 0, ahead: params.length },
        ];
      case "fourInHand":
        return [...pair("wheeler", 0), ...pair("leader", params.length)];
      case "sixUp":
        return [
          ...pair("wheeler", 0),
          ...pair("leader", params.length),
          ...pair("leader", 2 * params.length),
        ];
      case "quadriga":
        return [
          ...pair("wheeler", 0),
          { role: "leader", lateral: 3 * half, ahead: 0 },
          { role: "leader", lateral: -3 * half, ahead: 0 },
        ];
    }
  }

  /** Refuse a turn whose inside or outside horse would leave its gait's declared speeds, naming the least radius. */
  function turns(layout: readonly HorseTeamPlan.IPlace[]): void {
    let least: number = 0;
    layout.forEach((place: HorseTeamPlan.IPlace, k: number): void => {
      const range: ReturnType<typeof QuadrupedGait.range> = QuadrupedGait.range(
        createQuadruped.species(horses[k]!),
        params.gait,
        horses[k]!.dimensions.withersHeight!,
      );
      const d: number = Math.abs(place.lateral);
      const inner: number =
        params.cruise > range.minimum
          ? (d * params.cruise) / (params.cruise - range.minimum)
          : Infinity;
      const outer: number =
        range.maximum > params.cruise
          ? (d * params.cruise) / (range.maximum - params.cruise)
          : Infinity;
      least = Math.max(least, d === 0 ? 0 : Math.max(inner, outer));
    });
    params.legs.forEach(
      (leg: (typeof params.legs)[number], k: number): void => {
        if (leg.kind === "turn" && !(leg.radius >= least))
          refuse(
            `legs[${k}].radius`,
            leg.radius,
            "a team horse would leave its gait's speeds in this turn",
            least,
          );
      },
    );
  }
}

/** A posed part's world origin. */
function part(
  sample: ArchetypeRide.ISample<createHorse.Affordance, createHorse.Dimension>,
  id: string,
): IAutoMovieVector3 {
  const found: IAutoMovieModelPart = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  )!;
  return ArchetypeFrame.compose(sample.placement, found.transform!).translation;
}
