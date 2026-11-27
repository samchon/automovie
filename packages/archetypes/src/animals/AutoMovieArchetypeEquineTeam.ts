import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeCart } from "../vehicles/AutoMovieArchetypeCart";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { AutoMovieArchetypeEquineTeamPlan } from "./AutoMovieArchetypeEquineTeamPlan";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { EquineHarness } from "./EquineHarness";
import { EquineTeamCourse } from "./EquineTeamCourse";
import { createQuadruped } from "./createQuadruped";
import { rideHorse } from "./rideHorse";

/** Points a slack trace is laid through, ends included. */
const SAG_POINTS: number = 9;

/**
 * A team of harnessed horses put to one pole vehicle: a pair, a tandem, a
 * four-in-hand, a six-up or a quadriga, each horse on its own ride in its own
 * place, the vehicle drawn by its pole head.
 *
 * The hitch expands into places (`AutoMovieArchetypeEquineTeamPlan.IPlace`):
 * wheelers abreast `spacing` apart either side of the pole, each with its
 * chest's front at the pole head, and each further rank `length` ahead; a
 * quadriga's outer pair runs abreast of the poled pair as trace horses. Each
 * horse's course is the team's path offset to its place (`EquineTeamCourse`),
 * so in a turn the outside horse travels farther in proportion to its radius,
 * and each horse keeps its own gait phase on its own ride (`rideHorse`). The
 * vehicle is the existing towed contract (`createCart.towing`,
 * `AutoMovieArchetypeRide.towed`) drawn by a pole head that follows the team's
 * own course at the wheelers' hitch height.
 *
 * The spans are laid between posed parts and vehicle-rigid points: a pole strap
 * from each poled wheeler's inner point of draft to the pole head; the traces
 * of a horse beside the vehicle's front from its points of draft back `trace`
 * metres along the vehicle to the bar at its place; a leader's traces from its
 * points of draft to the lead bar at the pole head beside its place. When the
 * vehicle has a box driver's hand stations (`leftLineGrip`, `rightLineGrip`),
 * each horse's reins run from its bit rings to the hand on their side, the near
 * reins to the left hand; the team's `vehicle` ride is the moving support that
 * driver, or a postilion's horse ride from `rides`, is carried on. While
 * drawing every trace is taut. While braking to the course's end the wheelers
 * hold the vehicle on the pole straps and breeching, so their traces slacken,
 * and the leaders, which cannot brake it, slacken theirs; these are authored
 * states, not simulated forces.
 *
 * Refused: a horse count that does not match the hitch, an unharnessed horse,
 * spacing that lets two barrels touch, a rank length shorter than a horse, a
 * course whose first or last leg is not a straight longer than every rank's
 * offset, and a turn whose inside or outside horse would leave the gait's
 * declared speeds, with the least admissible radius; the towing refuses a front
 * axle turned past its lock.
 *
 * @param horses The harnessed horses, in place order: wheelers first, left
 *   before right, then each rank forward.
 * @param vehicle A pole vehicle from `createCart`.
 * @param params The hitch, spacings, course and authored states.
 * @returns The team, sampled by film second.
 * @throws {AutoMovieArchetypeRefusal} As stated above.
 */
export function AutoMovieArchetypeEquineTeam(
  horses: readonly AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >[],
  vehicle: AutoMovieArchetype<AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Dimension>,
  params: AutoMovieArchetypeEquineTeamPlan.IParams,
): AutoMovieArchetypeEquineTeamPlan.ITeam<
  AutoMovieArchetypeCart.Affordance,
  AutoMovieArchetypeCart.Dimension
> {
  const refuse = (
    axis: string,
    value: unknown,
    reason: string,
    minimum: number | null = null,
  ): never => {
    throw new AutoMovieArchetypeRefusal({
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
    if (!(params[key] > 0))
      refuse(key, params[key], "must be finite and positive");
  const layout: readonly AutoMovieArchetypeEquineTeamPlan.IPlace[] = places();
  if (horses.length !== layout.length)
    refuse(
      "horses",
      horses.length,
      `a ${params.hitch} needs ${layout.length} horses`,
    );
  const rigs: AutoMovieArchetypeEquine.IRig[] = horses.map(
    (
      horse: AutoMovieArchetype<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      >,
      k: number,
    ): AutoMovieArchetypeEquine.IRig => {
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
      return AutoMovieArchetypeEquine.rig(horse.dimensions);
    },
  );
  const widest: number = Math.max(
    ...rigs.map((rig: AutoMovieArchetypeEquine.IRig): number => 2 * rig.barrel),
  );
  if (!(params.spacing > widest))
    refuse(
      "spacing",
      params.spacing,
      "horses abreast would touch barrels",
      widest,
    );
  const longest: number = Math.max(
    ...rigs.map(
      (rig: AutoMovieArchetypeEquine.IRig): number =>
        rig.nose.z - rig.buttock.z,
    ),
  );
  if (
    layout.some(
      (place: AutoMovieArchetypeEquineTeamPlan.IPlace): boolean =>
        place.ahead > 0,
    ) &&
    !(params.length > longest)
  )
    refuse(
      "length",
      params.length,
      "a leader would stand on its wheeler",
      longest,
    );

  // Each place's distance ahead of the pole head: the chest's front at the pole head, ranks `length` apart.
  const placed: AutoMovieArchetypeEquineTeamPlan.IPlace[] = layout.map(
    (
      place: AutoMovieArchetypeEquineTeamPlan.IPlace,
      k: number,
    ): AutoMovieArchetypeEquineTeamPlan.IPlace => ({
      ...place,
      ahead: place.ahead - EquineHarness.chest(rigs[k]!, Math.PI / 2).z,
    }),
  );
  const first: (typeof params.legs)[number] | undefined = params.legs[0];
  const final: (typeof params.legs)[number] | undefined = params.legs.at(-1);
  const reach: number = Math.max(
    ...placed.map((place: AutoMovieArchetypeEquineTeamPlan.IPlace): number =>
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

  const rides: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >[] = horses.map(
    (
      horse: AutoMovieArchetype<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      >,
      k: number,
    ): AutoMovieArchetypeRide.IRide<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    > => rideHorse(horse, EquineTeamCourse(params, placed[k]!), params.gait),
  );
  const head: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(
      new AutoMovieArchetypeBuilder<"hitch", never>({
        material: "steel",
        name: "team pole head",
        draw: new AutoMovieArchetypeDrawSession<never>(
          "teamPoleHead",
          {},
          undefined,
        ),
      })
        .box(
          "head",
          { x: 0.01, y: 0.01, z: 0.01 },
          { x: 0, y: horses[0]!.affordance("hitch").frame.translation.y, z: 0 },
        )
        .affordance({
          id: "hitch",
          kind: "hook",
          frame: AutoMovieArchetypeFrame.upright({
            x: 0,
            y: horses[0]!.affordance("hitch").frame.translation.y,
            z: 0,
          }),
          extent: null,
        })
        .build(1),
      EquineTeamCourse(params, { role: "wheeler", lateral: 0, ahead: 0 }),
    );
  const towed: AutoMovieArchetypeRide.ITowedRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  > = AutoMovieArchetypeRide.towed(head, "hitch", vehicle, "coupling", {
    support: AutoMovieArchetypeCart.towing(vehicle),
  });
  const brake: number = params.stop
    ? head.duration - params.cruise / params.rate
    : head.duration;
  const coupling: IAutoMovieVector3 =
    vehicle.affordance("coupling").frame.translation;

  const reined: boolean = vehicle.affordances.some(
    (a: IAutoMovieAffordance): boolean => a.id === "leftLineGrip",
  );

  return {
    duration: head.duration,
    brake,
    places: placed,
    rides,
    vehicle: towed,
    at,
  };

  /** One displayed second. */
  function at(
    seconds: number,
  ): AutoMovieArchetypeEquineTeamPlan.ISample<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  > {
    const stage: AutoMovieArchetypeEquineTeamPlan.Stage =
      seconds >= brake ? "brake" : "pull";
    const samples: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >[] = rides.map(
      (
        ride: AutoMovieArchetypeRide.IRide<
          AutoMovieArchetypeEquine.Affordance,
          AutoMovieArchetypeEquine.Dimension
        >,
      ): AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > => ride.at(seconds),
    );
    const carried: AutoMovieArchetypeRide.ISample<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    > = towed.at(seconds);
    const onVehicle = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.point(carried.placement, local);
    const lines: AutoMovieArchetypeRide.ILineState[] = [];
    placed.forEach(
      (place: AutoMovieArchetypeEquineTeamPlan.IPlace, k: number): void => {
        const sample: AutoMovieArchetypeRide.ISample<
          AutoMovieArchetypeEquine.Affordance,
          AutoMovieArchetypeEquine.Dimension
        > = samples[k]!;
        const spread: number = rigs[k]!.draft.x;
        for (const [side, sign] of EquineHarness.SIDES) {
          const from: IAutoMovieVector3 = part(
            sample,
            EquineHarness.ENDS.draft[side],
          );
          const to: IAutoMovieVector3 = onVehicle({
            x: coupling.x + place.lateral + sign * spread,
            y: coupling.y,
            z: coupling.z - (place.ahead < 0 ? params.trace : 0),
          });
          lines.push({
            id: `trace-${k}-${side}`,
            radius: AutoMovieArchetypeCart.TRACE,
            points:
              stage === "brake"
                ? EquineHarness.slack(from, to, params.sag, SAG_POINTS)
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
            radius: AutoMovieArchetypeCart.TRACE,
            points: [
              part(
                sample,
                EquineHarness.ENDS.draft[place.lateral > 0 ? "right" : "left"],
              ),
              onVehicle(coupling),
            ],
          });

        // The reins from each bit ring to the box driver's hand on its side.
        if (reined)
          for (const [side] of EquineHarness.SIDES)
            lines.push({
              id: `rein-${k}-${side}`,
              radius: AutoMovieArchetypeCart.LINE / 2,
              points: [
                part(sample, EquineHarness.ENDS.bit[side]),
                AutoMovieArchetypeFrame.compose(
                  carried.placement,
                  carried.archetype.affordance(`${side}LineGrip`).frame,
                ).translation,
              ],
            });
      },
    );
    return {
      stage,
      horses: samples,
      breeching: placed.map(
        (place: AutoMovieArchetypeEquineTeamPlan.IPlace): boolean =>
          stage === "brake" && place.role === "wheeler",
      ),
      vehicle: carried.archetype,
      placement: carried.placement,
      lines,
    };
  }

  /**
   * The hitch's places before their chest offsets: role, lateral offset and
   * rank distance.
   */
  function places(): AutoMovieArchetypeEquineTeamPlan.IPlace[] {
    const half: number = params.spacing / 2;
    const pair = (
      role: AutoMovieArchetypeEquineTeamPlan.Role,
      ahead: number,
    ): AutoMovieArchetypeEquineTeamPlan.IPlace[] => [
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

  /**
   * Refuse a turn whose inside or outside horse would leave its gait's declared
   * speeds, naming the least radius.
   */
  function turns(
    layout: readonly AutoMovieArchetypeEquineTeamPlan.IPlace[],
  ): void {
    let least: number = 0;
    layout.forEach(
      (place: AutoMovieArchetypeEquineTeamPlan.IPlace, k: number): void => {
        const range: ReturnType<typeof AutoMovieArchetypeQuadrupedGait.range> =
          AutoMovieArchetypeQuadrupedGait.range(
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
      },
    );
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
  sample: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  id: string,
): IAutoMovieVector3 {
  const found: IAutoMovieModelPart = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  )!;
  return AutoMovieArchetypeFrame.compose(sample.placement, found.transform!)
    .translation;
}
