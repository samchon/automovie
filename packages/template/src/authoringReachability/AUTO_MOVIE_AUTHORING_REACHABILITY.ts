import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import type { IAutoMovieAuthoringReachabilityRow } from "./IAutoMovieAuthoringReachabilityRow";
import { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";
type AutoMovieAuthoringCapability = AuthoringReachabilityRules.AutoMovieAuthoringCapability;
type AutoMovieProductionDesignField = AuthoringReachabilityRules.AutoMovieProductionDesignField;
type IAuthoringRouteDefinition = AuthoringReachabilityRules.IAuthoringRouteDefinition;
type IProductionFieldRouteDefinition = AuthoringReachabilityRules.IProductionFieldRouteDefinition;
const PRODUCTION_DESIGN_FIELD_ROUTES = AuthoringReachabilityRules.PRODUCTION_DESIGN_FIELD_ROUTES;
const BASE_ROUTE_DEFINITIONS = AuthoringReachabilityRules.BASE_ROUTE_DEFINITIONS;
import { AUTO_MOVIE_CAMERA_ACTIONS } from "./AUTO_MOVIE_CAMERA_ACTIONS";
import { AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS } from "./AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS";

const KINDS = AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS;

/**
 * Design rows describe source values and the public APIs that accept them.
 * They do not promise an installed emitter, fixed source filename, serialized
 * project store, or ready-made renderer. A project authors its own composition
 * and passes these values to the selected validation or runtime boundary.
 */
const PRODUCTION_DESIGN_OWNER =
  "docs/settings and project-authored source under src";

const PRODUCTION_DESIGN_INPUT =
  "@automovie/interface IAutoMovieProductionDesign value in a caller-owned design graph";

const applicable = (
  kind: AutoMovieAuthoringProductionKind,
  capability: AutoMovieAuthoringCapability,
  definition: IAuthoringRouteDefinition,
  designField: AutoMovieProductionDesignField | null = null,
): IAutoMovieAuthoringReachabilityRow => ({
  capability,
  choices: definition.choices ?? null,
  consumer: definition.consumer,
  field: designField,
  inapplicableReason: null,
  kind,
  owner: definition.owner,
  route: definition.route,
  input: definition.input,
});

const inapplicable = (
  kind: AutoMovieAuthoringProductionKind,
  capability: AutoMovieAuthoringCapability,
  reason: string,
  designField: AutoMovieProductionDesignField | null = null,
): IAutoMovieAuthoringReachabilityRow => ({
  capability,
  choices: null,
  consumer: null,
  field: designField,
  inapplicableReason: reason,
  kind,
  owner: null,
  route: null,
  input: null,
});

const fieldRows = (
  kind: AutoMovieAuthoringProductionKind,
): IAutoMovieAuthoringReachabilityRow[] =>
  (
    Object.entries(PRODUCTION_DESIGN_FIELD_ROUTES) as Array<
      [AutoMovieProductionDesignField, IProductionFieldRouteDefinition]
    >
  ).map(([name, definition]) =>
    kind === "library"
      ? inapplicable(
          kind,
          "production-design-field",
          `A library selects reusable source capabilities rather than a timed-production design; production-design.${name} belongs to that timed composition.`,
          name,
        )
      : applicable(
          kind,
          "production-design-field",
          {
            ...definition,
            owner: PRODUCTION_DESIGN_OWNER,
            input: PRODUCTION_DESIGN_INPUT,
          },
          name,
        ),
  );

const timedRows = (
  kind: "film" | "brief",
): IAutoMovieAuthoringReachabilityRow[] => [
  applicable(kind, "film-sources", {
    owner: kind === "film" ? "docs/final/screenplays" : "docs/briefs",
    input: "IAutoMovieDefinedShot exports and caller-owned sequence inputs",
    consumer: "@automovie/engine compileDefinedShot and cutSequence",
    route:
      kind === "film"
        ? "README.md"
        : "README.md",
  }),
  applicable(kind, "acceptance", {
    owner: "project-authored shot contracts and review expectations under src",
    input:
      "IAutoMovieDefinedShot registration, build callback, context and runtime",
    consumer: "@automovie/engine compileDefinedShot contract realization",
    route: "README.md",
  }),
  applicable(kind, "camera-actions", {
    choices: AUTO_MOVIE_CAMERA_ACTIONS,
    owner: "project-authored frame actions under src",
    input: 'IAutoMovieActionCall verb "frame" move',
    consumer: "@automovie/engine compileCameraMove",
    route: "README.md",
  }),
];

const LIBRARY_ROWS: IAutoMovieAuthoringReachabilityRow[] = [
  inapplicable(
    "library",
    "film-sources",
    "A library has no timed edit or film-source population.",
  ),
  inapplicable(
    "library",
    "acceptance",
    "A library has no shot or film to target.",
  ),
  inapplicable(
    "library",
    "camera-actions",
    "A library has no shot camera; neutral inspection owns its views.",
  ),
];

const commonRows = (
  kind: AutoMovieAuthoringProductionKind,
): IAutoMovieAuthoringReachabilityRow[] =>
  Object.entries(BASE_ROUTE_DEFINITIONS).map(([capability, definition]) =>
    applicable(
      kind,
      capability as keyof typeof BASE_ROUTE_DEFINITIONS,
      definition,
    ),
  );

/** Canonical production-kind capability matrix shipped to every author. */
export const AUTO_MOVIE_AUTHORING_REACHABILITY: readonly IAutoMovieAuthoringReachabilityRow[] =
  Object.freeze(
    KINDS.flatMap((kind) => [
      ...commonRows(kind),
      ...(kind === "library" ? LIBRARY_ROWS : timedRows(kind)),
      ...fieldRows(kind),
    ]).map((row) => Object.freeze(row)),
  );
