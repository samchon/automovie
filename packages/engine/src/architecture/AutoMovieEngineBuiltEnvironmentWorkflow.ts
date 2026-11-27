import { type IAutoMoviePlanarPoint, type IAutoMovieViolationCollector, type IAutoMovieSetPieceSupport, type IAutoMovieEnvironmentSupportReport, type IAutoMovieSubjectContribution, type IAutoMovieBuiltEnvironment, type IAutoMovieSpace, type IAutoMovieBuiltConnector, type IAutoMovieBuiltOpening, type IAutoMovieBuiltSpace, type IAutoMovieBuiltPlacementBody, type IAutoMovieResolveBuiltPlacementBody } from "@automovie/interface";
import { appendBuiltRegionDefects as appendBuiltRegionDefectsImplementation } from "./internal/appendBuiltRegionDefects";
import { environmentSupportReport as environmentSupportReportImplementation } from "./internal/environmentSupportReport";
import { lowerBuiltEnvironment as lowerBuiltEnvironmentImplementation } from "./internal/lowerBuiltEnvironment";
import { mergeAutoMovieSpaces as mergeAutoMovieSpacesImplementation } from "./internal/mergeAutoMovieSpaces";
import { requireBuiltConnector as requireBuiltConnectorImplementation } from "./internal/requireBuiltConnector";
import { requireBuiltOpening as requireBuiltOpeningImplementation } from "./internal/requireBuiltOpening";
import { requireBuiltSpace as requireBuiltSpaceImplementation } from "./internal/requireBuiltSpace";
import { resolveBuiltPlacementBody as resolveBuiltPlacementBodyImplementation } from "./internal/resolveBuiltPlacementBody";

/** Public operations for Auto Movie Engine Built Environment Workflow. */
export namespace AutoMovieEngineBuiltEnvironmentWorkflow {
  /**
   * Report a closed region an inside test cannot be run against.
   *
   * The authored contract requires non-negligible area and a simple ring; an
   * even-odd interpretation of self-crossing rings is outside it. Non-finite
   * doubled signed area or magnitude at most `AutoMovieEngineBuiltPlanarEpsilon` (1e-9) gets
   * one `range` finding. Otherwise a self-crossing/touching ring gets one `type`
   * finding, at `path`.
   *
   * @param region Closed ring to judge; for an opening, its arc-bounding hull.
   * @param path Violation path to report at.
   * @param label Name of the region in the messages.
   * @param collector Sink that receives the violations.
   */
  export function appendRegionDefects(region: readonly IAutoMoviePlanarPoint[], path: string, label: string, collector: IAutoMovieViolationCollector): void {
    appendBuiltRegionDefectsImplementation(region, path, label, collector);
  }

  /**
   * Report the support of every staged set piece of a composed environment,
   * without refusing any.
   *
   * Each piece's world box is its runtime model's rest extent carried through its
   * staged transform. Its candidate supports are the walkable surfaces of the
   * stage space, read by `propSupportGap`'s footprint probes, and the box tops of
   * the other pieces whose plan footprints share area with it. As the building
   * sweep does, the support is the highest candidate whose top is at most the
   * underside plus the tolerance, so a chair tucked under a table rests on the
   * floor; when there is none, the lowest candidate above the underside, which
   * makes the piece `sunk`. A gap within the tolerance is `resting`. A piece that
   * does not rest but whose back face (its corners' least distance out along the
   * mount's inward normal) lies within the tolerance of its mounted wall is
   * `wall-borne`. A prop with a declared placement is `declared`, a model with no
   * rest extent `unresolved`, and a piece with no candidate `floating` with no
   * gap. The bodies of each composed building take the verdict
   * `builtEnvironmentSupportSweep` gives that building alone at its placement
   * height: grounded and borne bodies rest, floating ones float with the sweep's
   * clearance and support, and unresolved ones stay unresolved.
   *
   * @param props The staged set, runtime models, props, stage space, wall mounts,
   *   composed buildings and tolerance.
   * @returns One finding per staged piece, in set order.
   * @throws {RangeError} When the tolerance is negative or not finite.
   */
  export function environmentSupportReport(props: IAutoMovieEnvironmentSupportReport.IProps): IAutoMovieSetPieceSupport[] {
    return environmentSupportReportImplementation(props);
  }

  /**
   * Lower one building record to ordinary subject contributions.
   *
   * Visible element transforms are composed parent-to-child and flattened into
   * world-space set pieces because staged scene nodes are world TRS. The original
   * hierarchy remains in `builtEnvironments` for spatial queries and evidence.
   *
   * An opening's current operating state contributes its joint displacement
   * during lowering. A record without operations contributes no such
   * displacement; its authored transforms still compose through the hierarchy.
   *
   * A declared population leaves as the compact instance set it already is, never
   * expanded into set pieces. That is what makes the building the one owner of
   * its own repeated parts: the set the production world stages and the set a
   * space query measures are the same record, so no second copy of a placement
   * law can drift away from the first. The `instanceSets` key is omitted rather
   * than emitted empty when the record has no population, so such a record merges
   * exactly as it did before populations existed.
   *
   * Node ids are `<environment id>/<element id>` and stage space ids are
   * `<environment id>/<space id>`; only elements with a model become set pieces,
   * in element order. Each stage space carries its own surfaces in record order
   * and the walkable ids among them in the record's walkable order. The returned
   * contribution shares the environment's own model, surface and population
   * objects rather than copying them. A record that fails
   * `validateBuiltEnvironment` throws an `Error` naming its first violation.
   *
   * @param environment Building record to lower.
   * @returns The models, set pieces, stage spaces, building record and compact
   *   populations the building contributes.
   */
  export function lowerBuiltEnvironment(environment: IAutoMovieBuiltEnvironment): IAutoMovieSubjectContribution {
    return lowerBuiltEnvironmentImplementation(environment);
  }

  /**
   * Merge several subject-owned support spaces into one stage space.
   *
   * Surfaces and walkable ids are concatenated in input order under the new `id`;
   * the input spaces' own ids are dropped. Nothing is renamed or deduplicated, so
   * a surface id two inputs share appears twice and is refused by `validateSpace`
   * when the merged space is validated. The surface objects are shared with the
   * inputs, not copied.
   *
   * @param id Id of the merged stage space.
   * @param spaces Spaces whose surfaces and walkable ids are combined.
   * @returns A new stage space holding every input's surfaces and walkable ids.
   */
  export function mergeAutoMovieSpaces(id: string, spaces: readonly IAutoMovieSpace[]): IAutoMovieSpace {
    return mergeAutoMovieSpacesImplementation(id, spaces);
  }

  /**
   * The connector one id names, or a thrown `Error` naming both the environment
   * and the missing id.
   *
   * Every connector-addressed query refuses an undeclared id with this one
   * message. The first connector declared under the id is returned; duplicate ids
   * are a contradiction `validateBuiltEnvironment` refuses, not one this lookup
   * re-decides.
   */
  export function requireConnector(environment: IAutoMovieBuiltEnvironment, connectorId: string): IAutoMovieBuiltConnector {
    return requireBuiltConnectorImplementation(environment, connectorId);
  }

  /**
   * The opening one id names, or a thrown `Error` naming both the environment and
   * the missing id.
   *
   * Every opening-addressed query refuses an undeclared id with this one message,
   * because an empty answer would read as a real opening with no operable panel.
   * The first opening declared under the id is returned; duplicate ids are a
   * contradiction `validateBuiltEnvironment` refuses, not one this lookup
   * re-decides.
   *
   * @param environment Building record holding the opening.
   * @param openingId Id of the opening to resolve.
   * @returns The environment's own opening record, not a copy.
   */
  export function requireOpening(environment: IAutoMovieBuiltEnvironment, openingId: string): IAutoMovieBuiltOpening {
    return requireBuiltOpeningImplementation(environment, openingId);
  }

  /**
   * The logical space one id names, or a thrown `Error` naming both the
   * environment and the missing id.
   *
   * Every space-addressed query refuses an undeclared id with this one message,
   * because an id that resolves to nothing is the caller's mistake and an empty
   * answer would read as a real room holding nothing. The first space declared
   * under the id is returned; duplicate ids are a contradiction
   * `validateBuiltEnvironment` refuses, not one this lookup re-decides.
   */
  export function requireSpace(environment: IAutoMovieBuiltEnvironment, spaceId: string): IAutoMovieBuiltSpace {
    return requireBuiltSpaceImplementation(environment, spaceId);
  }

  /**
   * Resolve one building element or population to its reported box and part-box
   * proxies, or null when unresolved.
   *
   * Element parts come from the supplied lookup, permitting one-element
   * measurement or a batch table. Their union has element-origin-point basis when
   * both corners are equal and element-geometry-bounds otherwise. A point can
   * arise from the world-origin fallback or genuine degenerate geometry.
   * Populations delegate to {@link builtInstanceSetPlacementBounds}: compact
   * layouts use an envelope law, explicit layouts fold stored transforms, and
   * along-route throws.
   *
   * Null, undefined or empty part answers resolve to null; the existing part
   * lookups use them for undeclared or transform-only elements. An undeclared
   * population id also returns null.
   */
  export function resolvePlacementBody(props: IAutoMovieResolveBuiltPlacementBody.IProps): IAutoMovieBuiltPlacementBody | null {
    return resolveBuiltPlacementBodyImplementation(props);
  }
}
