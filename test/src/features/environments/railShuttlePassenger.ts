import { AutoMovieEngineQuaternion, AutoMovieEngineTransform, AutoMovieEngineVector3, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieEnvironment,
  IAutoMovieModel,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSupportTransfer,
  IAutoMovieRigidTransform,
  IAutoMovieStageActor,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSupport,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";

import { motionHumanBody } from "../internal/motionHumanBody";

/** Board the parked shuttle, ride on the aisle, and alight on the second platform. */
export function railShuttlePassenger(
  environment: IAutoMovieEnvironment,
  exitFrom: number,
): { film: AutoMovieMotionHumanPerformance; actor: IAutoMovieStageActor } {
  const carrier: string = "rail/shuttle/carrier";
  const car: IAutoMovieModel = environment.runtime.props.find(
    (prop) => prop.node === carrier,
  )!.model;
  const placement = (time: number): IAutoMovieRigidTransform => {
    const frame: IAutoMovieTransform = AutoMovieEngineFilm.bakedTransformFromClipsAt(
      environment.runtime.objectMotions,
      carrier,
      Math.max(0, time),
    )!;
    return { position: frame.translation, rotation: frame.rotation };
  };
  const point = (
    contact: string,
    time: number,
    x: number,
  ): IAutoMovieVector3 => {
    const local: IAutoMovieVector3 = car.affordances!.find(
      (item) => item.id === contact,
    )!.frame.translation;
    const frame = placement(time);
    return AutoMovieEngineVector3.add(
      frame.position,
      AutoMovieEngineQuaternion.rotateVector(frame.rotation, { ...local, x: local.x + x }),
    );
  };
  const origin = platform(environment, "origin");
  const destination = platform(environment, "destination");
  const facingDeg: number = -90;
  const actor: IAutoMovieStageActor = {
    node: "rail-passenger",
    position: { ...origin.center, x: origin.innerEdge + 0.28 },
    facingDeg,
  };
  const crossing: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSupportTransfer> =
    {
      name: "railDockTransfer",
      interrupts: AutoMovieMotionHumanStance.stand.interrupts,
      plan: AutoMovieMotionHumanSupport.supportTransfer,
    };
  const wait: IAutoMovieMotionHumanActionLaw = {
    name: "railCarWait",
    interrupts: AutoMovieMotionHumanStance.stand.interrupts,
    plan: (context) =>
      AutoMovieMotionHumanStance.stand.plan({
        ...context,
        params: {
          sway: 0,
          hold: exitFrom - context.start,
          on: { prop: carrier },
        },
      }),
  };
  const threshold = { prop: carrier, surface: "threshold" };
  const film: AutoMovieMotionHumanPerformance = new AutoMovieMotionHumanPerformance({
    seed: "rail-passenger",
    props: [
      origin.prop,
      destination.prop,
      AutoMovieMotionHumanObject.prop(carrier, car, placement(0), placement),
    ],
    laws: [crossing, wait],
    performers: [
      {
        subject: actor.node,
        body: motionHumanBody("m-average"),
        at: actor.position,
        yaw: actor.facingDeg,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanChain.subject(actor.node)
      .stand({ hold: 0.8, sway: 0, on: { prop: origin.prop.subject } })
      .registered(crossing.name, {
        from: { prop: origin.prop.subject, surface: "floor" },
        to: threshold,
        landing: { x: 0.02, z: 0 },
        lead: "left",
        seconds: 2,
      })
      .walk({
        to: point("aisle", 0, 0),
        face: facingDeg,
        pace: "normal",
        on: { prop: carrier },
      })
      .registered(wait.name)
      // Leave room for the outward-facing toes on the narrow step before crossing.
      .walk({
        to: point("threshold", exitFrom, -0.07),
        face: -facingDeg,
        pace: "normal",
        on: { prop: carrier },
      })
      .registered(crossing.name, {
        from: threshold,
        to: { prop: destination.prop.subject, surface: "floor" },
        landing: {
          x: destination.innerEdge + 0.15 - destination.center.x,
          z: 0,
        },
        lead: "right",
        seconds: 2,
      })
      .stand({ hold: 0.8, sway: 0, on: { prop: destination.prop.subject } })
      .node,
  });
  return { film, actor };
}

/** Expose the emitted shuttle platform as the named motion support. */
function platform(
  environment: IAutoMovieEnvironment,
  stop: string,
): {
  center: IAutoMovieVector3;
  innerEdge: number;
  prop: IAutoMovieMotionHumanProp;
} {
  const id: string = `rail/shuttle/stops/${stop}`;
  const patch = environment.stage.space!.surfaces.find(
    (surface) => surface.id === id,
  );
  if (patch?.height?.kind !== "constant")
    throw new Error(`Missing level shuttle platform ${id}`);
  const xs: number[] = patch.polygon.map((point) => point.x);
  const zs: number[] = patch.polygon.map((point) => point.z);
  const minX: number = Math.min(...xs);
  const maxX: number = Math.max(...xs);
  const minZ: number = Math.min(...zs);
  const maxZ: number = Math.max(...zs);
  const center: IAutoMovieVector3 = {
    x: (minX + maxX) / 2,
    y: patch.height.value,
    z: (minZ + maxZ) / 2,
  };
  const prop: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    id,
    {
      affordances: [
        {
          id: "floor",
          kind: "surface",
          frame: AutoMovieEngineTransform.identity(),
          extent: null,
          width: maxX - minX,
          depth: maxZ - minZ,
        },
      ],
    },
    { position: center, rotation: AutoMovieEngineQuaternion.identity(), fixed: true },
  );
  return { center, innerEdge: minX, prop };
}
