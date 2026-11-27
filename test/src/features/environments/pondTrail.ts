import { AutoMovieEnvironment, AutoMovieEnvironmentFurnishing } from "@automovie/archetypes/environments";
import { AutoMovieArchetypeSeat } from "@automovie/archetypes/furniture";
import { Quaternion, Transform, AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieModel,
  IAutoMovieStageActor,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { createModel } from "../internal/createModel";
import { bakeEnvironmentPerformance } from "./bakeEnvironmentPerformance";
import type { compileEnvironmentExample } from "./compileEnvironmentExample";
import { environmentExampleBody } from "./environmentExampleBody";

/** A trail and water edge with instances, a bench and a supplied mesh. */
export function pondTrail(): compileEnvironmentExample.IInput {
  const base: IAutoMovieModel = createModel(null);
  const marker: IAutoMovieModel = {
    ...base,
    id: "trail-mark",
    name: "Trail marker",
    parts: [
      {
        ...base.parts[0]!,
        geometry: {
          type: "mesh",
          mesh: AutoMovieEngineGeometry.extrudeProfile({
            profile: [
              { x: -0.4, y: 0 },
              { x: 0.4, y: 0 },
              { x: 0.2, y: 1.3 },
              { x: -0.2, y: 1.3 },
            ],
            depth: 0.24,
          }),
        },
      },
    ],
  };
  const environment: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "pond",
    seed: 24,
    items: {
      terrain: {
        use: AutoMovieEnvironment.terrain({
          size: { width: 24, depth: 20 },
          water: {
            pond: {
              outline: [
                { x: 9, z: 8 },
                { x: 14, z: 8 },
                { x: 14, z: 12 },
                { x: 9, z: 12 },
              ],
              height: 0,
            },
          },
          paths: {
            circuit: {
              points: [
                { x: 3, z: 5 },
                { x: 18, z: 5 },
              ],
              width: 2,
            },
          },
          trees: {
            grove: { center: { x: 19, z: 14 }, radius: 2, count: 24, scale: 0.2 },
          },
          amenities: { bench: { x: 15, z: 6 } },
        }),
      },
      bench: {
        use: AutoMovieEnvironmentFurnishing.prop({ model: AutoMovieArchetypeSeat.create({ kind: "bench" }) }),
        at: { anchor: "terrain/amenities/bench" },
      },
      marker: {
        use: AutoMovieEnvironment.model({
          model: marker,
          anchors: {
            summit: Transform.of({ x: 0, y: 1.3, z: 0 }, Quaternion.identity()),
          },
        }),
        at: { anchor: "terrain/paths/circuit/end" },
      },
    },
  });
  const seconds: number = 7;
  const walker: IAutoMovieStageActor = {
    node: "walker",
    position: { x: 10, y: 0, z: 5 },
    facingDeg: 90,
  };
  const destination: IAutoMovieVector3 = { x: 17, y: 0, z: 5 };
  const model: ReturnType<typeof environmentExampleBody> =
    environmentExampleBody();
  const walk: HumanPerformance = new HumanPerformance({
    seed: "pond-walk",
    laws: [],
    performers: [
      {
        subject: walker.node,
        body: AutoMovieMotionHumanBody.create(model.skeleton, model.profile),
        at: walker.position,
        yaw: walker.facingDeg,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject(walker.node).walk({
      to: destination,
      pace: "normal",
    }).node,
  });
  const motion: ReturnType<typeof bakeEnvironmentPerformance> =
    bakeEnvironmentPerformance(walk, walker, seconds);
  return {
    id: "pond-trail",
    summary: "A walker follows the dry trail toward a marker and a bench.",
    seconds,
    environment,
    visible: ["walker", "pond/marker"],
    actors: [walker],
    actions: [
      {
        actor: walker.node,
        verb: "enact",
        clip: motion.id,
        start: 0,
        duration: seconds,
      },
    ],
    motions: { [motion.id]: motion },
    camera: {
      position: { x: 30, y: 19, z: -12 },
      target: { x: 12, y: 0, z: 10 },
    },
  };
}
