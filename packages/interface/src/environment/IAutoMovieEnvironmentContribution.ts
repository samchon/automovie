import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSubjectContribution } from "../production/IAutoMovieSubjectContribution";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import type { IAutoMovieWallMount } from "./IAutoMovieWallMount";

/**
 * A placed module's portable stage and world records, with named attachment
 * frames.
 */
export interface IAutoMovieEnvironmentContribution extends Pick<
  IAutoMovieSubjectContribution,
  | "surfaces"
  | "landmarks"
  | "routes"
  | "effectRecipes"
  | "effectZones"
  | "instanceSets"
> {
  /** World-space rigid attachment frames keyed by local slash-separated paths. */
  anchors?: Readonly<Record<string, IAutoMovieTransform>>;

  /** Renderable models made available to the shot runtime. */
  models?: readonly IAutoMovieModel[];

  /** World-space scene nodes made available to the stage. */
  set?: readonly IAutoMovieStageSetPiece[];

  /** World-space semantic support spaces from which the stage is assembled. */
  spaces?: readonly IAutoMovieSpace[];

  /** Prop records whose node, model, placement and reference identities agree. */
  props?: readonly IAutoMoviePropSpec[];

  /** Architectural records used to check declared prop relationships. */
  builtEnvironments?: readonly IAutoMovieBuiltEnvironment[];

  /** Object clips over the shot clock, targeting the staged nodes. */
  objectMotions?: readonly IAutoMovieClip[];

  /**
   * Set pieces a furnishing `wall` relation placed, each with its wall's inner
   * face.
   */
  mounts?: readonly IAutoMovieWallMount[];
}
