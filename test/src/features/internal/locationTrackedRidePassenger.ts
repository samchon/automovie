import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieModel,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSeated,
  IAutoMoviePropSpec,
  IAutoMovieStageActor,
  IAutoMovieTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";

import { locationTrackedRideFixture } from "./locationTrackedRideFixture";
import { motionHumanBody } from "./motionHumanBody";

/** The existing seated ride law consumes the same baked carrier transform as scene playback. */
export function locationTrackedRidePassenger(
  fixture: ReturnType<typeof locationTrackedRideFixture>,
): {
  film: AutoMovieMotionHumanPerformance;
  actor: Pick<IAutoMovieStageActor, "node" | "position" | "facingDeg">;
  body: ReturnType<typeof motionHumanBody>;
} {
  const { environment, carrier } = fixture;
  const car: IAutoMovieModel = environment.runtime.props.find(
    (prop: IAutoMoviePropSpec): boolean => prop.node === carrier,
  )!.model;
  const placed = (time: number): IAutoMovieMotionHumanObject.Placement => {
    const frame: IAutoMovieTransform = AutoMovieEngineFilm.bakedTransformFromClipsAt(
      environment.runtime.objectMotions,
      carrier,
      time,
    )!;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const seat: IAutoMovieMotionHumanSeated.ISeat = AutoMovieMotionHumanObject.seat(
    car,
    placed(0),
    "seat",
  );
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const actor: Pick<IAutoMovieStageActor, "node" | "position" | "facingDeg"> = {
    node: "passenger",
    position: { ...seat.at, y: 0.38, z: seat.at.z + 0.2 },
    facingDeg: seat.yaw,
  };
  const film: AutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
    seed: "tracked-ride",
    laws: [AutoMovieMotionHumanMount.rideHorse.ride],
    props: [AutoMovieMotionHumanObject.prop(carrier, car, placed(0), placed)],
    performers: [
      {
        subject: actor.node,
        body,
        at: actor.position,
        yaw: actor.facingDeg,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanChain.subject(actor.node)
      .sit({ seat })
      .registered("ride", { on: carrier, duration: 12 }).node,
  });
  return { film, actor, body };
}
