import type { IAutoMovieHumanGenerated } from "../../../human/src/structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import type { HumanCaptureCamera } from "./HumanCaptureCamera";
import type { normalizeHumanView } from "./normalizeHumanView";

/**
 * Control surface of the single Human page, published as `window.__automovieHuman`.
 *
 * The browser entry, a person at the devtools console and the PNG worker's
 * headless Chrome all drive the same page through this interface, so the
 * interactive view and every served PNG come from one model, one scene and one
 * renderer. Loads prepare a replacement before retiring the displayed model;
 * failed preparation preserves that model and reports the failed request.
 *
 * @evidence contracts/common.md#principled-implementation One implementation (mountHumanViewerPage) serves people, the browser entry and the worker, so the PNG service cannot diverge from the visible page.
 * @evidence contracts/common.md#clear-and-simple-design Loads, display state, capture and inspection are the whole surface; HTTP, caching and archives stay in the Vite plugin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed preparation preserves the displayed generation but rejects the request; no earlier result is returned as a successful replacement.
 * @evidence contracts/common.md#meaningful-documentation States the shared consumers and the failure rule.
 * @evidence contracts/performance.md#efficient-algorithms Display changes restyle the built model; only loads generate.
 * @evidence contracts/performance.md#reuse-equivalent-work The worker reuses one page and model for every frame of a model key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One displayed model and at most one prepared replacement; dispose releases the displayed model with controls and renderer.
 */
export interface IHumanViewerPage {
  /**
   * Generate from a registered alias's typed parameter module.
   *
   * @param alias Registered example name such as `f1`.
   *
   * @evidence contracts/common.md#principled-implementation Validates a registered typed example and generates from its private input snapshot.
   * @evidence contracts/common.md#clear-and-simple-design The URL `?alias=` path and the alias selector both use it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown aliases throw; no default person is substituted.
   * @evidence contracts/common.md#meaningful-documentation States the typed source.
   * @evidence contracts/performance.md#efficient-algorithms One generation and one model build.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses module-shared examples for alias labels; generation owns a validated private snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps the displayed model through preparation, then joins its disposal after committing the replacement.
   */
  loadAlias(alias: string): Promise<IHumanViewerPage.ILoaded>;

  /**
   * Generate from a complete public parameter object validated at runtime.
   *
   * @param candidate Parsed JSON, for example the body of `/human-parameters/f1.json`.
   *
   * @evidence contracts/common.md#principled-implementation Validates the complete public structure and declared ranges, then generates from a private snapshot; example equality determines only the alias label.
   * @evidence contracts/common.md#clear-and-simple-design Used by `?document=` and by the worker's generate command.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects invalid or unknown fields rather than casting or silently repairing input; valid edited parameters are admitted.
   * @evidence contracts/common.md#meaningful-documentation States the admission rule.
   * @evidence contracts/performance.md#efficient-algorithms Validation and copying scale with the input; one generation and model build follow successful admission.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses module-shared examples for alias labels; generation owns a validated private snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps the displayed model through preparation, then joins its disposal after committing the replacement.
   */
  load(candidate: unknown): Promise<IHumanViewerPage.ILoaded>;

  /**
   * Generate from typed parameters supplied by TypeScript code.
   *
   * @param parameters Complete public Human input.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same runtime validation and private snapshot as load before calling AutoMovieHuman.generate.
   * @evidence contracts/common.md#clear-and-simple-design The typed entry for code; JSON goes through load.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Generator errors surface on the status line and reject.
   * @evidence contracts/common.md#meaningful-documentation States the typed-input premise.
   * @evidence contracts/performance.md#efficient-algorithms One generation and one model build.
   * @evidence contracts/performance.md#reuse-equivalent-work No caching: each call generates.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps the displayed model through preparation, then joins its disposal after committing the replacement.
   */
  generate(
    parameters: IAutoMovieHumanParameters,
  ): Promise<IHumanViewerPage.ILoaded>;

  /**
   * Display an already generated result.
   *
   * @param result Output of `AutoMovieHuman.generate`.
   *
   * @evidence contracts/common.md#principled-implementation Builds and displays the given typed result without regenerating.
   * @evidence contracts/common.md#clear-and-simple-design Shares the load path, so display rules are identical.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Accepts only the typed result, not JSON.
   * @evidence contracts/common.md#meaningful-documentation States that no generation runs.
   * @evidence contracts/performance.md#efficient-algorithms One model build.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the caller's result object.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Keeps the displayed model through preparation, then joins its disposal after committing the replacement.
   */
  loadGenerated(
    result: IAutoMovieHumanGenerated,
  ): Promise<IHumanViewerPage.ILoaded>;

  /**
   * Serialize the displayed generated result as JSON, the `/human-images/<alias>.model.json` publication.
   *
   * @returns `JSON.stringify` of `{ parameters, model }`; throws when nothing is loaded.
   *
   * @evidence contracts/common.md#principled-implementation Serializes the exact displayed result, so the publication and the PNGs share one model.
   * @evidence contracts/common.md#clear-and-simple-design The worker reads the publication through this one call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws when nothing is loaded instead of returning an old model.
   * @evidence contracts/common.md#meaningful-documentation States the payload shape.
   * @evidence contracts/performance.md#efficient-algorithms O(model size); tens of megabytes for the current generator.
   * @evidence contracts/performance.md#reuse-equivalent-work Called once per generation by the worker.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one string owned by the caller.
   */
  serialize(): string;

  /**
   * Switch the interactive view's pass.
   *
   * @param pass Pass to show; overlay and construction throw when the model has no construction part.
   *
   * @evidence contracts/common.md#principled-implementation Restyles the displayed model for the pass and mirrors it into the URL.
   * @evidence contracts/common.md#clear-and-simple-design Same restyle path as selection changes and captures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pass without construction throws instead of showing the surface.
   * @evidence contracts/common.md#meaningful-documentation States the failure.
   * @evidence contracts/performance.md#efficient-algorithms One restyle of the built model.
   * @evidence contracts/performance.md#reuse-equivalent-work No regeneration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The styling releases the previous pass's derived resources.
   */
  setPass(pass: IHumanViewerPage.Pass): void;

  /**
   * Move the interactive camera to a named capture camera at the viewport's own aspect.
   *
   * @param name One of {@link HumanCaptureCamera.names}.
   *
   * @evidence contracts/common.md#principled-implementation Uses HumanCaptureCamera.place, the capture framing rule, with the viewport aspect.
   * @evidence contracts/common.md#clear-and-simple-design One camera table for page and PNGs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown names throw.
   * @evidence contracts/common.md#meaningful-documentation States that only the aspect differs from the capture.
   * @evidence contracts/performance.md#efficient-algorithms Constant work and one redraw.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the page camera and controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires nothing.
   */
  setCamera(name: string): void;

  /**
   * Select lofting curves for the interactive view (see `normalizeHumanCurves` for the grammar).
   *
   * @param curves Comma list of curve ids and `*` globs; empty clears. An unmatched pattern throws and keeps the previous selection.
   *
   * @evidence contracts/common.md#principled-implementation Normalizes, resolves against the model and restyles only after resolution succeeds.
   * @evidence contracts/common.md#clear-and-simple-design The URL, list, text field and click picking all end here.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unmatched patterns throw rather than showing an unselected view.
   * @evidence contracts/common.md#meaningful-documentation States grammar source and failure.
   * @evidence contracts/performance.md#efficient-algorithms One resolution and one restyle.
   * @evidence contracts/performance.md#reuse-equivalent-work The resolution is kept for later pass changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the resolved id lists.
   */
  setCurves(curves: string): IHumanViewerPage.ISelection;

  /**
   * Curve ids of the displayed model, in model order; empty when nothing is loaded.
   *
   * @evidence contracts/common.md#principled-implementation Reads the displayed model's construction part ids.
   * @evidence contracts/common.md#clear-and-simple-design Lets callers discover valid selections.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never a fixed list.
   * @evidence contracts/common.md#meaningful-documentation States the empty case.
   * @evidence contracts/performance.md#efficient-algorithms O(parts).
   * @evidence contracts/performance.md#reuse-equivalent-work Callers keep the list per model.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a caller-owned array.
   */
  curves(): string[];

  /**
   * Render one named camera, pass and curve selection with the requested display and inspection conditions and read back its PNG.
   *
   * Reference comparison requires the matching named camera and surface pass,
   * empty selection and no free-view or inspection overrides. Interactive pass,
   * selection, display, lighting and canvas size are restored afterwards; the
   * interactive camera is retained.
   *
   * @param camera One of {@link HumanCaptureCamera.names}.
   * @param pass Pass to render.
   * @param curves Curve selection for this frame; empty renders without highlight.
   * @param view Free-view query text including camera overrides, isolate, fit, garment, hair, material and light; empty keeps the named camera and reference appearance.
   *
   * @evidence contracts/common.md#principled-implementation Applies the frame's pass, selection and canonical view, draws at 1200 x 1200 with the shared framing rule plus explicit free-view and inspection overrides, records visible conditions and restores interactive display and lighting in a finally block.
   * @evidence contracts/common.md#clear-and-simple-design The only capture path, used by the worker for every PNG URL.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws while busy or empty instead of drawing a stale model.
   * @evidence contracts/common.md#meaningful-documentation States the restored state and parameters.
   * @evidence contracts/performance.md#efficient-algorithms Up to nine restyles including restoration, one draw and one PNG encode.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the loaded model across every frame of its key.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a data URL owned by the caller; derived styling resources are replaced on restore.
   */
  capture(
    camera: string,
    pass: IHumanViewerPage.Pass,
    curves: string,
    view: string,
  ): IHumanViewerPage.ICapture;

  /**
   * Current page state for inspection; `generation` is 0 when nothing is loaded.
   *
   * @evidence contracts/common.md#principled-implementation Reads the live page state.
   * @evidence contracts/common.md#clear-and-simple-design Lets the worker detect a reloaded page by its generation counter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports failures through `failed` instead of hiding them.
   * @evidence contracts/common.md#meaningful-documentation States the empty-state value.
   * @evidence contracts/performance.md#efficient-algorithms Constant work plus copies of the selection lists.
   * @evidence contracts/performance.md#reuse-equivalent-work No recomputation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a caller-owned record.
   */
  snapshot(): IHumanViewerPage.ISnapshot;

  /**
   * Apply free-view variables to the interactive view.
   *
   * @param query URL query text such as `az=0&el=90&ortho=1&isolate=1&fit=selection&garment=0`; empty returns to the named camera.
   * @returns The canonical text.
   *
   * @evidence contracts/common.md#principled-implementation Parses with normalizeHumanView, applies isolation and garment/hair/material inspection display to the model and re-places the camera with the capture rule; lighting follows that same parsed view.
   * @evidence contracts/common.md#clear-and-simple-design The URL, the toolbar and automation share this entry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed variables, isolation without a selection and fit without a selection throw and keep the previous view.
   * @evidence contracts/common.md#meaningful-documentation States the accepted variables and failures.
   * @evidence contracts/performance.md#efficient-algorithms Success performs two restyles and one placement; failure during application restores the prior display with two further restyles.
   * @evidence contracts/performance.md#reuse-equivalent-work No regeneration.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the canonical text.
   */
  setView(query: string): string;
  /**
   * Draw the 2D diagnostic diagram of one or more lofting curves (see `drawHumanCurveDiagram`).
   *
   * @param alias Registered fallback used only without a loaded result; null requires actual loaded parameters.
   * @param curves Canonical curve list: `<chain>/<k>`, `<chain>/axis` with globs, `<chain>@<s>` and `<chain>@<from>:<to>:<step>`.
   * @param format `svg` returns the document; `png` rasterizes it in the page at 1200 x 1200.
   * @returns The SVG text or a PNG data URL.
   *
   * @evidence contracts/common.md#principled-implementation Reevaluates the shape law with the loaded result's actual parameters, or an admitted alias only without a loaded result; PNG rasterizes the same SVG.
   * @evidence contracts/common.md#clear-and-simple-design The worker serves alias and current-input `/human-curves/` requests through this method.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing loaded parameters and alias, unknown ids and invalid stations throw; a loaded result never substitutes an alias.
   * @evidence contracts/common.md#meaningful-documentation States nullable alias fallback, curve grammar and formats; law reevaluation is not mesh measurement.
   * @evidence contracts/performance.md#efficient-algorithms No model generation; only requested chains are evaluated.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses actual parameter references and the loaded law evaluator.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The PNG canvas is a temporary element released after encoding.
   */
  diagram(
    alias: string | null,
    curves: string,
    format: "svg" | "png",
  ): Promise<string>;

  /**
   * Stop rendering and release the model, controls and renderer.
   *
   * @evidence contracts/common.md#principled-implementation Retires the model, then the controls, the render loop and the DOM, each in a finally so one failure cannot skip the rest.
   * @evidence contracts/common.md#clear-and-simple-design The single teardown, called on pagehide.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cleanup failures propagate.
   * @evidence contracts/common.md#meaningful-documentation States what is released.
   * @evidence contracts/performance.md#efficient-algorithms Linear in owned resources.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated calls share one closing promise.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Leaves no model, listener or renderer.
   */
  dispose(): Promise<void>;
}

export namespace IHumanViewerPage {
  /**
   * Render pass: `surface` is every non-construction part, `construction` only
   * parts whose id starts with `human.construction.`, `overlay` both.
   *
   * @evidence contracts/common.md#principled-implementation The three values are the passes the verification skill requires: surface, construction over surface, construction alone.
   * @evidence contracts/common.md#clear-and-simple-design A closed union shared by URL parsing, page and worker.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass falls back to another when its parts are missing.
   * @evidence contracts/common.md#meaningful-documentation States which parts each value shows.
   * @evidence contracts/performance.md#efficient-algorithms A type only.
   * @evidence contracts/performance.md#reuse-equivalent-work All passes share one built model.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A type only.
   */
  export type Pass = "surface" | "overlay" | "construction";

  /**
   * Facts about one displayed generation.
   *
   * @evidence contracts/common.md#principled-implementation Counts and bounds are read from the generated model and built object.
   * @evidence contracts/common.md#clear-and-simple-design One record answers load callers and the worker receipt.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Null marks an unknown alias or time instead of a placeholder.
   * @evidence contracts/common.md#meaningful-documentation Each field states its unit or null meaning.
   * @evidence contracts/performance.md#efficient-algorithms One entry per part.
   * @evidence contracts/performance.md#reuse-equivalent-work Computed once per generation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Plain data.
   */
  export interface ILoaded {
    /** Page-local counter, incremented by every successful load; a reload restarts it. */
    generation: number;

    /** Registered alias of the parameters, or null for typed code input. */
    alias: string | null;

    /** Wall-clock milliseconds spent in `AutoMovieHuman.generate`, or null for `loadGenerated`. */
    generateMilliseconds: number | null;

    /** Model parts with their mesh sizes; non-mesh geometry reports zero counts. */
    parts: Array<{ id: string; vertices: number; triangles: number }>;

    /** Whole surface bounds in metres, the framing basis of every camera. */
    bounds: { min: number[]; max: number[] };

    /** Whether the model has at least one construction part. */
    construction: boolean;
  }

  /**
   * A resolved curve selection.
   *
   * @evidence contracts/common.md#principled-implementation Holds the canonical value with the ids it resolved to on the displayed model.
   * @evidence contracts/common.md#clear-and-simple-design The same record feeds snapshots, URLs and PNG metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ids come from the model, never from the pattern text.
   * @evidence contracts/common.md#meaningful-documentation Each field states its id form.
   * @evidence contracts/performance.md#efficient-algorithms Ordered arrays bounded by the model's parts.
   * @evidence contracts/performance.md#reuse-equivalent-work Kept between pass changes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Plain data.
   */
  export interface ISelection {
    /** Canonical pattern list, empty for no selection. */
    curves: string;

    /** Selected curve ids in selection order. */
    selected: string[];

    /** CSS colour of each selected curve, by selection order. */
    colours: string[];

    /** Skin interval ids (part ids without `human.skin.`) the selected curves shape. */
    shaped: string[];

    /** CSS colour of each shaped interval: the colour of the first selected curve shaping it. */
    shapedColours: string[];
  }

  /**
   * One rendered PNG with the conditions that produced it.
   *
   * @evidence contracts/common.md#principled-implementation Every field is read from the draw that produced the pixels.
   * @evidence contracts/common.md#clear-and-simple-design The worker forwards it with the model key as the frame receipt.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The capture time is the draw time, not a later save time.
   * @evidence contracts/common.md#meaningful-documentation Each field states its meaning and unit.
   * @evidence contracts/performance.md#efficient-algorithms Dominated by the base64 PNG of about 0.3 MB.
   * @evidence contracts/performance.md#reuse-equivalent-work The session caches the decoded PNG by frame identity.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Plain data owned by the caller.
   */
  export interface ICapture {
    /** `data:image/png;base64,...` read from the 1200 x 1200 drawing buffer. */
    png: string;

    /** ISO UTC time of the draw. */
    capturedUtc: string;

    /** Render conditions recorded with the PNG. */
    metadata: {
      /** Generation counter of the rendered model. */
      generation: number;

      /** Registered alias, or null. */
      alias: string | null;

      /** Rendered pass. */
      pass: Pass;

      /** Canonical free-view text of this frame, empty for the named camera alone. */
      view: string;

      /** Applied development display conditions; visibleParts states the actual isolation/pass result and camera.light plus hemisphere state the actual illumination. Clay replaces only skin materials, keeping geometry and normals unchanged. */
      inspection: Pick<
        normalizeHumanView.IView,
        "garment" | "hair" | "material" | "light"
      >;

      /** Curve selection of this frame. */
      curves: ISelection;

      /** Part ids visible in this pass. */
      visibleParts: string[];

      /** Camera placement. */
      camera: HumanCaptureCamera.IPlacement;

      /** Whole surface bounds in metres. */
      bounds: { min: number[]; max: number[] };

      /** Drawing buffer size and pixel ratio. */
      canvas: { width: number; height: number; pixelRatio: number };

      /** Scene background as a CSS hex colour. */
      background: string;

      /** Hemisphere light colours and intensity. */
      hemisphere: { sky: string; ground: string; intensity: number };

      /** WebGL vendor and renderer strings, unmasked when the browser exposes them. */
      renderer: { vendor: string; renderer: string };
    };
  }

  /**
   * Inspectable page state.
   *
   * @evidence contracts/common.md#principled-implementation Mirrors the page's live state.
   * @evidence contracts/common.md#clear-and-simple-design One record for automation and debugging.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts `failed` exposes errors instead of hiding them.
   * @evidence contracts/common.md#meaningful-documentation Each field states its meaning.
   * @evidence contracts/performance.md#efficient-algorithms Small, apart from the parameter reference.
   * @evidence contracts/performance.md#reuse-equivalent-work Parameters are referenced, not copied.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Plain data.
   */
  export interface ISnapshot {
    /** Current generation counter, 0 before the first success. */
    generation: number;

    /** Loaded alias, or null. */
    alias: string | null;

    /** Interactive pass. */
    pass: Pass;

    /** Canonical free-view text of the interactive view. */
    view: string;

    /** Interactive curve selection. */
    curves: ISelection;

    /** Status line text. */
    status: string;

    /** Whether a load is in progress. */
    busy: boolean;

    /** Whether the status line reports a failure. */
    failed: boolean;

    /** Parameters of the displayed model, or null. */
    parameters: IAutoMovieHumanParameters | null;
  }
}
