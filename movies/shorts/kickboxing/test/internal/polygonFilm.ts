import type { IAutoMovieSchedule } from "@automovie/engine";

import { composeKickboxing } from "../../src/composition/films/composeKickboxing";
import { CameraTrack } from "../../src/interactions/cinematography/CameraTrack";
import { FinishSight } from "../../src/interactions/cinematography/FinishSight";
import { BoutLaws } from "../../src/interactions/kickboxing/BoutLaws";
import type { IRingCast } from "../../src/interactions/kickboxing/IRingCast";
import { RefereeTrack } from "../../src/interactions/officiating/RefereeTrack";
import { polygonCast } from "./polygonCast";

/** The whole film resolved once per test process on polygon men: its schedule and the referee and camera tracks. */
export function polygonFilm(): polygonFilm.IFilm {
  if (cached) return cached;
  const cast: IRingCast = polygonCast();
  const schedule: IAutoMovieSchedule = BoutLaws.resolve(
    cast,
    composeKickboxing(cast, DURATION),
    SEED,
  );
  const referee: RefereeTrack.ITrack = RefereeTrack.resolve(
    cast,
    schedule,
    DURATION,
  );
  const camera: CameraTrack.ISample[] = CameraTrack.resolve(
    cast,
    schedule,
    referee,
    DURATION,
    FinishSight.volumes(cast, schedule, referee),
  );
  cached = { cast, schedule, referee, camera, duration: DURATION, seed: SEED };
  return cached;
}

/** Companion types of {@link polygonFilm}. */
export namespace polygonFilm {
  /** The resolved film. */
  export interface IFilm {
    cast: IRingCast;
    schedule: IAutoMovieSchedule;
    referee: RefereeTrack.ITrack;
    camera: CameraTrack.ISample[];
    duration: number;
    seed: string;
  }
}

/** The film seed the production mounts with: the film's name. */
const SEED: string = "kickboxing";

/** The film's running time, seconds (screenplay). */
const DURATION: number = 180;

let cached: polygonFilm.IFilm | undefined;
