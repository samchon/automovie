import {
  type preparePhysicalGeometry as Geometry,
  planPhysicalContactTargets,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { FighterBody } from "../motion/fighter/FighterBody";
import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";
import type { BoutTargetSource } from "./BoutTargetSource";
import { boutContactTargetInput } from "./boutContactTargetInput";

/** Use the same simultaneous generic fitting for authoring and geometry inspection: real weapon/receiver relationships, protective witnesses, complete profile self contacts, floor and currently planted supports share one bounded solve. */
export function fitBoutContactTargets(
  source: BoutTargetSource,
  id: FilmPlan.ActorId,
  seconds: number,
  targets: Readonly<Record<string, P.ITransform>>,
  actual: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
  geometry: Geometry.IQueries,
  frame: FighterBody.Frame,
  goals: Readonly<Record<string, IAutoMovieVector3>>,
): ReturnType<typeof planPhysicalContactTargets> {
  return planPhysicalContactTargets(
    boutContactTargetInput(
      source,
      id,
      seconds,
      targets,
      actual,
      geometry,
      frame,
      goals,
    ),
  );
}
