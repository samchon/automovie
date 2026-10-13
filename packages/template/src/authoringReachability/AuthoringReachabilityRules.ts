import { AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES } from "@automovie/ingest";
import type { IAutoMovieExternalMotionAdoptionMode, IAutoMovieProductionDesign } from "@automovie/interface";
import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";

/**
 * One authority for the published capability grammar and its typed runtime
 * registries. Matrix construction and inspection consume these same route
 * definitions, so a field or choice cannot drift between the advertised plan
 * and its refusal boundary. No named production or authored asset is supplied.
 */
export namespace AuthoringReachabilityRules {
  /**
   * The route field population comes from the public ProductionDesign keys, not a separate hand-maintained field vocabulary.
   */
  export type AutoMovieProductionDesignField = keyof IAutoMovieProductionDesign;

  /**
   * The closed capability grammar distinguishes common routes, timed source/acceptance routes and field-level design rows.
   */
  export type AutoMovieAuthoringCapability =
    | "settings"
    | "design-branches"
    | "production-design-field"
    | "production-sources"
    | "film-sources"
    | "external-model-inspection"
    | "acceptance"
    | "camera-actions";

  /**
   * Only the actual shipped project README, document router and 3D modeling skill are advertised instruction routes.
   */
  export type AutoMovieAuthoringRoute = "README.md" | "docs/README.md" | ".agents/skills/3d-modeling/SKILL.md";

  /**
   * A supported route supplies its source owner, authored input and actual public consumer before a matrix row can claim applicability.
   *
   * @author Samchon
   */
  export interface IAuthoringRouteDefinition {
    /** Closed values accepted by the consumer, absent for an open input. */
    choices?: readonly string[];

    /** Installed public boundary that evaluates this authored input. */
    consumer: string;

    /** Project-owned source or document where the choice is authored. */
    owner: string;

    /** Shipped instruction path that reaches this source and consumer. */
    route: AutoMovieAuthoringRoute;

    /** Original value or record passed to the public consumer. */
    input: string;
  }

  /**
   * Each production field binds its existing runtime consumer and installed instruction route, with optional closed choices.
   *
   * @author Samchon
   */
  export interface IProductionFieldRouteDefinition {
    /** Closed consumer choices when the public field has a literal union. */
    choices?: readonly string[];

    /** Existing public runtime or validator that consumes the field. */
    consumer: string;

    /** Shipped instruction route naming that consumer and authoring boundary. */
    route: AutoMovieAuthoringRoute;
  }

  const VISUAL_DELIVERY_REGISTRY = {
    deterministic: true,
    repainted: true,
    mixed: true,
  } satisfies Record<IAutoMovieProductionDesign["visualDelivery"], true>;

  const EXTERNAL_MOTION_MODE_REGISTRY = {
    native: true,
    "humanoid-retarget": true,
  } satisfies Record<IAutoMovieExternalMotionAdoptionMode["kind"], true>;

  const RENDER_TIER_REGISTRY = {
    proxy: true,
    final: true,
  } satisfies Record<
    keyof NonNullable<IAutoMovieProductionDesign["renderTiers"]>,
    true
  >;

  const VISUAL_DELIVERIES = Object.freeze(Object.keys(VISUAL_DELIVERY_REGISTRY));

  const EXTERNAL_MOTION_MODES = Object.freeze(
    Object.keys(EXTERNAL_MOTION_MODE_REGISTRY),
  );

  const RENDER_TIERS = Object.freeze(Object.keys(RENDER_TIER_REGISTRY));

  /**
   * Runtime copy of the route union, so a row handed to the inspector at runtime
   * is held to the same closed document set the type admits at compile time.
   */
  export const ROUTE_REGISTRY = { "README.md": true, "docs/README.md": true, ".agents/skills/3d-modeling/SKILL.md": true } satisfies Record<AutoMovieAuthoringRoute, true>;

  /**
   * One typed registry owns the production-kind vocabulary consumed by publication and unknown-kind admission.
   */
  export const KIND_REGISTRY = {
    film: true,
    brief: true,
    library: true,
  } satisfies Record<AutoMovieAuthoringProductionKind, true>;

  const field = (
    consumer: string,
    route: AutoMovieAuthoringRoute,
    choices?: readonly string[],
  ): IProductionFieldRouteDefinition => ({
    ...(choices === undefined ? {} : { choices }),
    consumer,
    route,
  });

  /**
   * Every public production-design field has one actual consumer route, with literal choices derived from the matching interface unions.
   */
  export const PRODUCTION_DESIGN_FIELD_ROUTES = {
    id: field(
      "@automovie/production validateAutoMovieProductionGraph identity validation",
      "README.md",
    ),
    title: field(
      "@automovie/production validateAutoMovieProductionGraph text validation",
      "README.md",
    ),
    logline: field(
      "@automovie/production validateAutoMovieProductionGraph text validation",
      "README.md",
    ),
    targetRuntimeSeconds: field(
      "@automovie/production validateAutoMovieProductionGraph runtime validation",
      "README.md",
    ),
    visualDelivery: field(
      "@automovie/production validateAutoMovieProductionGraph delivery configuration validation",
      "README.md",
      VISUAL_DELIVERIES,
    ),
    visualDeliveryLanes: field(
      "@automovie/production validateAutoMovieProductionGraph occurrence-lane validation",
      "README.md",
    ),
    mixedVisualDeliveryPolicy: field(
      "@automovie/production validateAutoMovieProductionGraph lane-crossing validation",
      "README.md",
    ),
    storyClock: field(
      "@automovie/engine autoMovieStoryTime",
      "README.md",
    ),
    lighting: field(
      "@automovie/engine resolveProductionLighting",
      "README.md",
    ),
    renderBudgets: field(
      "@automovie/render assessAutoMovieRenderBudget",
      "README.md",
    ),
    externalMotions: field(
      "@automovie/ingest adoptAutoMovieExternalMotion",
      "README.md",
      EXTERNAL_MOTION_MODES,
    ),
    captionReadabilityProfiles: field(
      "@automovie/production validateAutoMovieProductionGraph caption profile validation",
      "README.md",
    ),
    sound: field(
      "@automovie/engine deriveProductionSoundPlan",
      "README.md",
    ),
    renderTiers: field(
      "@automovie/production validateAutoMovieProductionGraph render tier validation",
      "README.md",
      RENDER_TIERS,
    ),
    repaint: field(
      "@automovie/production validateAutoMovieProductionGraph repaint configuration validation",
      "README.md",
    ),
    simulation: field(
      "@automovie/production validateAutoMovieProductionGraph simulation configuration validation",
      "docs/README.md",
    ),
    environmentContext: field(
      "@automovie/engine validateAutoMovieEnvironmentContext",
      "README.md",
    ),
    frameFormat: field(
      "@automovie/engine resolveProductionFrameRate",
      "README.md",
    ),
    artDirection: field(
      "@automovie/production validateAutoMovieProductionGraph art-direction validation",
      "README.md",
    ),
    deliverables: field(
      "@automovie/production validateAutoMovieProductionGraph deliverable validation",
      "README.md",
    ),
  } satisfies Record<
    AutoMovieProductionDesignField,
    IProductionFieldRouteDefinition
  >;

  /**
   * Common capabilities name their project-owned source, exact input and existing public consumer without inventing a generated project emitter.
   */
  export const BASE_ROUTE_DEFINITIONS = {
    settings: {
      owner: "docs/settings",
      input: "Markdown H2 evidence hosts",
      consumer: "@automovie/evidence production graph",
      route: "README.md",
    },
    "design-branches": {
      owner:
        "docs/{maps,models,spaces,materials,instances,motions,systems} -> src/<branch>",
      input:
        "reviewed TypeScript values passed directly to selected package APIs",
      consumer:
        "@automovie/engine geometry, material, spatial, instance and motion APIs",
      route: "docs/README.md",
    },
    "production-sources": {
      owner: "project-authored TypeScript modules under src",
      input: "lint.config.ts source populations and their typed source exports",
      consumer:
        "@automovie/evidence source graph and selected public runtime APIs",
      route: "README.md",
    },
    "external-model-inspection": {
      choices: AUTO_MOVIE_EXTERNAL_MODEL_INGEST_PROFILES,
      owner: "project-owned external bytes and their reviewed source adoption",
      input: "exact source bytes and an explicit inspection profile",
      consumer:
        "@automovie/ingest inspectAutoMovieExternalModelBytes; automovie inspect-external",
      route: "README.md",
    },
  } satisfies Record<
    Exclude<
      AutoMovieAuthoringCapability,
      "production-design-field" | "film-sources" | "acceptance" | "camera-actions"
    >,
    IAuthoringRouteDefinition
  >;
}

