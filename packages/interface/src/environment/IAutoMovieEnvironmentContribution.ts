import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieStageSetPiece } from "../authoring/IAutoMovieStageSetPiece";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieSubjectContribution } from "../production/IAutoMovieSubjectContribution";
import type { IAutoMovieSpace } from "../scene/IAutoMovieSpace";

/**
 * A placed module's portable stage and world records, with named attachment frames.
 *
 * @evidence contracts/development/design.md#principled-representation Producers allocate owned identities from the instance id and return all positions and support surfaces in world metres. Named rigid frames follow the same placement. Object clips carry shot-local seconds and cite the emitted nodes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses canonical stage, model, prop, architecture and world records. Omitted populations contribute no records. Anchors give the other modules places to attach without parsing geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A module owns its records, including all internal references. The composer retains their identities and neither infers contacts from a mesh nor resolves arbitrary imported references by rewriting strings.
 * @evidence contracts/development/common.md#meaningful-documentation States the world frame and owned identities, the local anchor paths, optional population semantics, and the object clip clock.
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
}
