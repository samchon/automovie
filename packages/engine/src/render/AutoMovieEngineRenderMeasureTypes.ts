import type {
  IAutoMovieMeasureRenderSimulation,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderSubject,
  IAutoMovieRenderTargetSettings,
} from "@automovie/interface";

/** Type-only data contracts for Auto Movie Engine Render Measure. */
export namespace AutoMovieEngineRenderMeasureTypes {
  /** One track's feed render targets and its most feeds shown at once. */
  export interface IFeedTrack {
    /** The track's mask owner, `surface-graphic:<node>/<surface>`. */
    owner: string;

    /**
     * Texture allocations its keys' feed layers hold: each layer's target and,
     * under a film's optics, its response stage's targets.
     */
    targets: number;

    /** Bytes those targets hold. */
    bytes: number;

    /** Most feed layers one key shows, each one scene pass per frame. */
    passes: number;
  }

  /** The tracks with feeds and their sums. */
  export interface IFeedResult {
    /** One row per track with at least one feed layer, in track order. */
    tracks: IFeedTrack[];

    /** Every texture allocation the shot's feeds hold. */
    targets: number;

    /** Bytes of those allocations. */
    bytes: number;

    /** Most scene passes the feeds add to one frame. */
    passes: number;
  }

  /** The subject, the raster, the frame so far and the sinks. */
  export interface IFilmStageProps {
    /** The measured subject; only `film` and `scene.medium` are read. */
    subject: IAutoMovieRenderSubject;

    /** The target settings whose drawing buffer the beauty pass draws into. */
    settings?: IAutoMovieRenderTargetSettings;

    /** Draw calls of the opaque frame, before any pass. */
    drawCalls: number;

    /** Triangles of the opaque frame, before any pass. */
    triangles: number;

    /** The lights that render a shadow map with every scene pass. */
    casters: readonly IFilmStageCaster[];

    /** Appends one owner row. */
    add: IAutoMovieMeasureRenderSimulation.IProps["add"];

    /** Receives a gap for each total the missing raster leaves unknown. */
    gaps: IAutoMovieRenderAnalysisGap[];
  }

  /** One shadow caster's per-pass cost, as the texture phase lists it. */
  export interface IFilmStageCaster {
    /** Depth views the caster renders the opaque frame into. */
    depthFaces: number;

    /** Fullscreen filtering draws of a VSM caster. */
    filterDraws: number;
  }

  /** Draw calls and triangles of some passes. */
  export interface IFilmStagePass {
    /** Draw calls. */
    draws: number;

    /** Triangles. */
    triangles: number;
  }

  /** One stage's allocations and passes. */
  export interface IFilmStageRow {
    /** The `render-pass:film-*` owner. */
    owner: string;

    /** The setting that makes the stage allocate and draw. */
    source: string;

    /** Texture allocations. */
    targets: number;

    /** Their bytes at the raster; NaN without one. */
    bytes: number;

    /** The further draw calls and triangles of one frame. */
    passes: IFilmStagePass;
  }

  /** What the film stage adds to the frame's totals. */
  export interface IFilmStageResult {
    /** Texture allocations, or null when no settings give the raster. */
    targets: number | null;

    /** Their bytes, or null when no settings give the raster. */
    bytes: number | null;

    /** Further draw calls, or null when glare's raster is unknown. */
    drawCalls: number | null;

    /** Further triangles, or null when glare's raster is unknown. */
    triangles: number | null;
  }
}
