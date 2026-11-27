import {
  AutoMovieArchetypeEnvironment
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironment";
import {
  AutoMovieArchetypeEnvironmentFurnishing
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironmentFurnishing";
import {
  AutoMovieArchetypeDrinkware
} from "@automovie/archetypes";
import {
  AutoMovieEngineSequence,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentModule,
  IAutoMovieMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSeated,
  IAutoMoviePropSpec,
  IAutoMovieQuaternion,
  IAutoMovieStageActor,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanRide,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";

import { bakeEnvironmentPerformance } from "./bakeEnvironmentPerformance";
import type { compileEnvironmentExample } from "./compileEnvironmentExample";
import { environmentExampleBody } from "./environmentExampleBody";

/** An outdoor arrival across a graded sill into a furnished stop. */
export function hillsideStop(): compileEnvironmentExample.IInput {
  const seconds: number = 12;
  const enterAt: number = 7.5;
  const swing: NonNullable<
    Extract<
      AutoMovieArchetypeEnvironment.IBuildingOpening,
      { kind: "door" }
    >["swing"]
  > = {
    from: 0.65,
    to: 6.65,
    degrees: 90,
  };
  const hallWidth: number = 6;
  const cafeSize: { width: number; depth: number } = { width: 8, depth: 6 };
  const totalWidth: number = hallWidth + cafeSize.width;
  const wallThickness: number = 0.15;
  const cafeRoom: { width: number; depth: number } = {
    width: cafeSize.width - wallThickness,
    depth: cafeSize.depth - wallThickness,
  };
  const entryWidth: number = 1.2;
  const grade: number = 1.3;
  const environment: IAutoMovieEnvironment = AutoMovieArchetypeEnvironment.create({
    id: "hill",
    seed: 1037,
    items: {
      terrain: {
        at: { x: -10, y: 0, z: -10 },
        use: AutoMovieArchetypeEnvironment.terrain({
          size: { width: 30, depth: 24 },
          relief: { kind: "plane", slope: { risePerX: 0.1, risePerZ: 0 } },
          pads: {
            station: {
              at: "station",
              outline: [
                { x: 0, z: 0 },
                { x: totalWidth, z: 0 },
                { x: totalWidth, z: cafeSize.depth },
                { x: 0, z: cafeSize.depth },
              ],
              cut: true,
              height: { anchor: "station/ground/entry" },
            },
          },
          paths: {
            approach: {
              width: 2.4,
              points: [{ x: 13, z: 7 }, { anchor: "station/ground/entry" }],
            },
          },
        }),
      },
      station: {
        at: { x: 0, y: grade, z: 0 },
        use: AutoMovieArchetypeEnvironment.building({
          type: "levels",
          wallThickness,
          levels: [
            {
              id: "ground",
              rooms: {
                hall: {
                  type: "rectangle",
                  value: {
                    x: 0,
                    z: 0,
                    width: hallWidth,
                    depth: cafeSize.depth,
                  },
                },
                cafe: {
                  type: "rectangle",
                  value: {
                    x: hallWidth,
                    z: 0,
                    width: cafeSize.width,
                    depth: cafeSize.depth,
                  },
                },
              },
              openings: [
                {
                  id: "entry",
                  kind: "door",
                  between: { from: "hall", to: null },
                  edge: {
                    from: { x: 0, z: 0 },
                    to: { x: hallWidth, z: 0 },
                  },
                  door: { hinge: "right", hardware: "plate" },
                  swing,
                },
                {
                  id: "inside",
                  kind: "passage",
                  between: { from: "hall", to: "cafe" },
                  width: entryWidth,
                  height: 2.1,
                },
              ],
            },
          ],
        }),
      },
      cafe: {
        at: { anchor: "station/ground/cafe" },
        use: (ctx: IAutoMovieEnvironmentModule.IContext) => {
          const entry = ctx.anchor("station/ground/inside").translation;
          return AutoMovieArchetypeEnvironmentFurnishing.cafeKit({
            room: cafeRoom,
            tables: 1,
            keepClear: {
              entry: {
                x: Math.max(
                  entry.x - ctx.frame.translation.x,
                  -cafeRoom.width / 2,
                ),
                z: entry.z - ctx.frame.translation.z - entryWidth / 2,
                width: 1,
                depth: entryWidth,
              },
            },
          })(ctx);
        },
      },
      cup: {
        at: { anchor: "cafe/table-1/stack" },
        use: AutoMovieArchetypeEnvironmentFurnishing.prop({
          model: AutoMovieArchetypeDrinkware.create({ kind: "cup" }),
        }),
      },
    },
  });
  const chairId: string = "hill/cafe/table-1/chair-near";
  const chair: IAutoMoviePropSpec | undefined = environment.runtime.props.find(
    (prop: IAutoMoviePropSpec): boolean => prop.node === chairId,
  );
  const placement: IAutoMovieStageSetPiece | undefined =
    environment.stage.set?.find(
      (piece: IAutoMovieStageSetPiece): boolean => piece.node === chairId,
    );
  if (chair === undefined || placement === undefined)
    throw new Error("The caf챕's named chair was not staged");
  const seat: IAutoMovieMotionHumanSeated.ISeat = AutoMovieMotionHumanObject.seat(
    chair.model,
    {
      position: placement.position,
      rotation: placement.rotation ?? AutoMovieEngineQuaternion.identity(),
    },
    "seat",
  );
  const yaw: number = (seat.yaw * Math.PI) / 180;
  const patron: IAutoMovieStageActor = {
    node: "patron",
    position: {
      x: seat.at.x + 0.2 * Math.sin(yaw),
      y: grade,
      z: seat.at.z + 0.2 * Math.cos(yaw),
    },
    facingDeg: seat.yaw,
  };
  const model: ReturnType<typeof environmentExampleBody> =
    environmentExampleBody();
  const person: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
    model.skeleton,
    model.profile,
  );
  const doorId: string = "hill/station/ground/entry";
  const door = environment.runtime.props.find(
    (prop) => prop.node === doorId,
  )!.model;
  const leaf = environment.stage.set!.find((piece) => piece.node === doorId)!;
  const doorAt = (time: number): IAutoMovieMotionHumanObject.Placement => {
    const value = AutoMovieEngineSequence.sampleClipSequence(
      environment.runtime.objectMotions,
      time,
    ).get(`node:${doorId}:rotation`)?.value;
    const rotation: IAutoMovieQuaternion =
      value === undefined
        ? leaf.rotation!
        : { x: value[0]!, y: value[1]!, z: value[2]!, w: value[3]! };
    return {
      position: leaf.position,
      rotation,
      fixed: true,
    };
  };
  const pull = door.affordances!.find(
    (affordance) => affordance.id === "pull",
  )!;
  const rotation: IAutoMovieQuaternion = leaf.rotation!;
  const position = AutoMovieEngineVector3.add(
    leaf.position,
    AutoMovieEngineQuaternion.rotateVector(rotation, {
      x: pull.frame.translation.x - 0.31,
      y: 0,
      z: 0.38,
    }),
  );
  const forward = AutoMovieEngineQuaternion.rotateVector(rotation, { x: 0, y: 0, z: -1 });
  const opener: IAutoMovieStageActor = {
    node: "opener",
    position: { ...position, y: grade },
    facingDeg: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
  };
  const opening: IAutoMovieMotion = bakeEnvironmentPerformance(
    new AutoMovieMotionHumanPerformance({
      seed: "hillside-door",
      laws: [AutoMovieMotionHumanRide.travelLeaf.openDoor],
      props: [AutoMovieMotionHumanObject.prop(doorId, door, doorAt(0), doorAt)],
      performers: [
        {
          subject: opener.node,
          body: person,
          at: opener.position,
          yaw: opener.facingDeg,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieMotionHumanChain.subject(opener.node).registered("openDoor", {
        door: doorId,
        handle: "pull",
        duration: swing.to + 0.2,
      }).node,
    }),
    opener,
    seconds,
  );
  const sitting: IAutoMovieMotion = bakeEnvironmentPerformance(
    new AutoMovieMotionHumanPerformance({
      seed: "hillside-sit",
      laws: [],
      performers: [
        {
          subject: patron.node,
          body: person,
          at: patron.position,
          yaw: patron.facingDeg,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieMotionHumanChain.subject(patron.node).sit({ seat }).node,
    }),
    patron,
    seconds,
  );
  return {
    id: "hillside-stop",
    summary:
      "The host pulls the door, a visitor steps inside and a patron takes a caf챕 seat.",
    seconds,
    environment,
    visible: ["visitor", doorId],
    actors: [
      {
        node: "visitor",
        position: { x: 3, y: grade, z: -2.5 },
        facingDeg: 0,
        support: [
          {
            from: 0,
            surfaces: environment.stage.space!.walkable.filter(
              (id: string): boolean => id !== `${doorId}/threshold`,
            ),
          },
          { from: swing.to, surfaces: environment.stage.space!.walkable },
        ],
      },
      opener,
      patron,
    ],
    actions: [
      { actor: "visitor", verb: "hold", start: 0, duration: enterAt },
      {
        actor: "visitor",
        verb: "locomote",
        gait: "walk",
        start: enterAt,
        duration: seconds - enterAt,
        to: { kind: "point", point: { x: 3, y: grade, z: 2.5 } },
      },
      {
        actor: opener.node,
        verb: "enact",
        clip: opening.id,
        start: 0,
        duration: seconds,
      },
      {
        actor: patron.node,
        verb: "enact",
        clip: sitting.id,
        start: 0,
        duration: seconds,
      },
    ],
    motions: { [opening.id]: opening, [sitting.id]: sitting },
    camera: {
      position: { x: 10, y: 5.8, z: -12 },
      target: { x: 4, y: 2, z: 0.8 },
    },
  };
}
