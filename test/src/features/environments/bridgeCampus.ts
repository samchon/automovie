import { createLift, createPassage, AutoMovieEnvironment, AutoMovieEnvironmentFurnishing } from "@automovie/archetypes/environments";
import { AutoMovieArchetypeSeat } from "@automovie/archetypes/furniture";
import type {
  IAutoMovieEnvironment,
  IAutoMovieStageActor,
} from "@automovie/interface";

import { bakeEnvironmentPerformance } from "./bakeEnvironmentPerformance";
import type { compileEnvironmentExample } from "./compileEnvironmentExample";
import { environmentLiftActor } from "./environmentLiftActor";
import { environmentLiftSchedule } from "./environmentLiftSchedule";

/** Occupied upper and lower floors in two blocks linked by a bridge and lift. */
export function bridgeCampus(): compileEnvironmentExample.IInput {
  const west: ReturnType<typeof tower> = tower("east");
  const east: ReturnType<typeof tower> = tower("west");
  const schedule: readonly createLift.IKey[] = environmentLiftSchedule;
  const lift: ReturnType<typeof createLift> = createLift({
    car: { callHeight: 1.18 },
    stops: { ground: 0, upper: 3.4 },
    landingDepth: 1.2,
    gap: 0.055,
    schedule,
  });
  const environment: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "campus",
    seed: 1036,
    items: {
      west: { use: west },
      east: { use: east, at: { x: 11, y: 0, z: 0 } },
      span: {
        use: createPassage({
          kind: "bridge",
          from: { opening: "west/upper/bridge" },
          to: { opening: "east/upper/bridge" },
          width: 1.8,
        }),
      },
      lift: { use: lift, at: { x: 15, y: 0, z: -1.255 } },
      gym: {
        use: AutoMovieEnvironmentFurnishing.gymKit({ room: [8, 8], stations: 1 }),
        at: { anchor: "east/ground/room" },
      },
      garden: {
        at: { x: 3, y: 0, z: 8 },
        use: AutoMovieEnvironment.terrain({
          size: [14, 6],
          paths: {
            promenade: {
              points: [
                [1, 2],
                [13, 2],
              ],
              width: 1.5,
            },
          },
          trees: {
            grove: { center: [7, 4.5], radius: 1.1, count: 11, scale: 0.15 },
          },
          amenities: { seat: [4, 3] },
        }),
      },
      bench: {
        at: { anchor: "garden/amenities/seat" },
        use: AutoMovieEnvironmentFurnishing.prop({ model: AutoMovieArchetypeSeat.create({ kind: "bench" }) }),
      },
    },
  });
  const ground: IAutoMovieStageActor = {
    node: "resident",
    position: { x: 4, y: 0, z: 4 },
    facingDeg: 0,
    support: [{ from: 0, surfaces: ["campus/west/ground/room/floor"] }],
  };
  const upper: IAutoMovieStageActor = {
    node: "traveller",
    position: { x: 4, y: 3.4, z: 4 },
    facingDeg: 90,
    support: [
      {
        from: 0,
        surfaces: [
          "campus/west/upper/room/floor",
          "campus/west/upper/bridge/threshold",
          "campus/span/deck",
          "campus/east/upper/bridge/threshold",
          "campus/east/upper/room/floor",
        ],
      },
    ],
  };
  const rider: ReturnType<typeof environmentLiftActor> = environmentLiftActor({
    environment,
    id: "campus/lift",
    lift,
    schedule,
  });
  // The shot lasts as long as the lift's schedule and its rider's act.
  const seconds: number = Math.max(
    rider.film.duration,
    schedule[schedule.length - 1]!.seconds,
  );
  const transfer: ReturnType<typeof bakeEnvironmentPerformance> =
    bakeEnvironmentPerformance(rider.film, rider.actor, seconds);
  return {
    id: "bridge-campus",
    summary:
      "Two actors start on aligned floors while the upper traveller crosses a bridge.",
    seconds,
    environment,
    visible: ["traveller", "campus/lift/cab"],
    actors: [ground, upper, rider.actor],
    actions: [
      {
        actor: ground.node,
        verb: "locomote",
        gait: "walk",
        start: 0,
        duration: 2,
        to: { kind: "point", point: { x: 4, y: 0, z: 6 } },
      },
      {
        actor: upper.node,
        verb: "locomote",
        gait: "walk",
        start: 0,
        duration: seconds,
        to: { kind: "point", point: { x: 15, y: 3.4, z: 4 } },
      },
      {
        actor: rider.actor.node,
        verb: "enact",
        clip: transfer.id,
        start: 0,
        duration: seconds,
      },
    ],
    motions: { [transfer.id]: transfer },
    camera: {
      position: { x: 10, y: 11, z: -26 },
      target: { x: 9.5, y: 3, z: 3.5 },
    },
  };
}

/** Share a two-level footprint and change only the bridge's side. */
function tower(side: "east" | "west"): ReturnType<typeof AutoMovieEnvironment.building> {
  const x: number = side === "east" ? 8 : 0;
  const liftOpening: AutoMovieEnvironment.Building.Opening = {
    id: "lift",
    kind: "passage",
    between: ["room", null],
    edge: [
      [0, 0],
      [8, 0],
    ],
    width: 1.8,
    height: 2.2,
  };
  return AutoMovieEnvironment.building({
    levels: [
      {
        id: "ground",
        height: 2.8,
        rooms: { room: [0, 0, 8, 8] },
        openings: side === "west" ? [liftOpening] : [],
      },
      {
        id: "upper",
        elevation: 3.4,
        height: 2.8,
        rooms: { room: [0, 0, 8, 8] },
        openings: [
          {
            id: "bridge",
            kind: "passage",
            between: ["room", null],
            edge: [
              [x, 0],
              [x, 8],
            ],
            width: 1.8,
            height: 2.2,
          },
          ...(side === "west" ? [liftOpening] : []),
        ],
      },
    ],
  });
}
