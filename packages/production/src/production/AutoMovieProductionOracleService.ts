import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { measureAutoMovieGeometry } from "@automovie/engine";
import { AutoMovieProductionFrameCapture, IAutoMovieBuildProjectOutput, IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieGeneratedManifest, IAutoMoviePreviewFrameInput, IAutoMoviePreviewFrameOutput, IAutoMovieQueryGeometryInput, IAutoMovieQueryGeometryOutput } from "@automovie/interface";
import path from "node:path";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { readAutoMovieFilmTimeline } from "./filmTimeline";
import { AutoMovieBuildStatusProvider } from "./AutoMovieBuildStatusProvider";
import { oracleServiceReadCompiledShots } from "./oracleServiceReadCompiledShots";
import { oracleServiceQueryFailure } from "./oracleServiceQueryFailure";
import { oracleServicePreview } from "./oracleServicePreview";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";

/**
 * Expose current geometry queries and opaque-host preview capture over one admitted project.
 *
 * @evidence contracts/common.md#principled-implementation Current manifest and optional source-status observation bind query/capture to builder-owned artifacts before engine geometry or render publication.
 * @evidence contracts/common.md#clear-and-simple-design The factory shares this project/service in its namespace bundle; extracted preview owns the larger async pipeline through late getters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional buildStatus permits freshness bypass and host-supplied pixels/runtime are not core visual proof; no in-repository direct query caller was found while preview has capture/repaint consumers.
 * @evidence contracts/common.md#meaningful-documentation Public result/error shapes and defaults remain unchanged; preview field reads occur inside its async helper though AsyncFunction reflection is no longer preserved.
 * @evidence contracts/performance.md#efficient-algorithms Query pays source status, graph/all-shot/timeline and engine costs; preview pays opaque capture/decode and repeated resident-bundle verification/publication.
 * @evidence contracts/performance.md#reuse-equivalent-work Namespace service handles share host/project state, but this class caches neither geometry nor pixels; current source-status reuse belongs to its injected owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The service retains project/host/status closures for its lifetime; operation buffers are local and capture-host disposal remains externally owned.
 */
export class AutoMovieProductionOracleService {
  /** Bind current project state and optional host evidence adapters. */
  public constructor(
    private readonly project: AutoMovieProductionProject,
    private readonly capture?: AutoMovieProductionFrameCapture,
    private readonly buildStatus?: AutoMovieBuildStatusProvider,
  ) {}

  /**
   * Measure one current geometry selector, returning classified engine/read failures without a fabricated result.
   *
   * @evidence contracts/common.md#principled-implementation Manifest fingerprint and optional current-status checks precede exact compiled-shot byte/schema reads and the canonical engine measureAutoMovieGeometry operation.
   * @evidence contracts/common.md#clear-and-simple-design Geometry measurement remains in the engine; this service owns project acquisition and output provenance.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All shot files are read, duplicate shot ids can overwrite in the map, and status/manifest failures before the try propagate synchronously rather than always becoming diagnostics.
   * @evidence contracts/common.md#meaningful-documentation Only film-time reads the timeline, after compiled shots; unavailable compile has null fingerprint/result.
   * @evidence contracts/performance.md#efficient-algorithms Source status, graph acquisition, all shot parse/hash/sort and selected engine/timeline traversal dominate work.
   * @evidence contracts/performance.md#reuse-equivalent-work One shot map feeds this request, but separate queries reread current bytes and this method owns no geometry cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed map/graph references last through the call; returned result/diagnostics escape and project readers own handle release.
   */
  public query(
    input: IAutoMovieQueryGeometryInput,
  ): IAutoMovieQueryGeometryOutput {
    const request: IAutoMovieQueryGeometryInput["request"] = input.request;
    const generated: IAutoMovieGeneratedManifest | null = this.project.generatedManifest();
    const generatedManifestPath: string = normalizeSlash(
      path.relative(
        this.project.root,
        this.project.trackedStatePath("generated-manifest.json"),
      ),
    );
    if (generated === null)
      return oracleServiceQueryFailure(request.query, null, {
        code: "compile-missing",
        category: "error",
        phase: "compile",
        target: request.query,
        path: generatedManifestPath,
        message:
          "No current compile exists. Build the current source through the production builder before using the geometry API.",
      });
    const freshness: IAutoMovieDiagnostic | null = this.freshnessDiagnostic(generated);
    if (freshness !== null)
      return oracleServiceQueryFailure(request.query, generated.inputFingerprint, freshness);
    try {
      const graph: IAutoMovieProductionDesignGraph = this.project.graph();
      const shots: ReadonlyMap<string, IAutoMovieCompiledShotSource> = oracleServiceReadCompiledShots(this.project, generated.inputFingerprint);
      const result: ReturnType<typeof measureAutoMovieGeometry> = measureAutoMovieGeometry({
        request,
        design: graph,
        compiled: shots,
        // Read only for the question that needs it, after the compiled shots,
        // which is the order a film-time answer has always read them in.
        timeline:
          request.query === "film-time"
            ? readAutoMovieFilmTimeline(
                this.project,
                generated.inputFingerprint,
              )
            : null,
      });
      return {
        query: request.query,
        compileFingerprint: generated.inputFingerprint,
        result,
        diagnostics: [],
      };
    } catch (error) {
      return oracleServiceQueryFailure(request.query, generated.inputFingerprint, {
        code: "geometry-selector-invalid",
        category: "error",
        phase: "compile",
        target: request.query,
        path: null,
        message:
          error instanceof Error
            ? error.message
            : "Geometry query failed. Correct its current selectors.",
      });
    }
  }

  /**
   * Delegate one preview to its async pipeline while retaining late private reads and original capture receiver.
   *
   * @evidence contracts/common.md#principled-implementation Getters defer project/capture observation to the async helper, and freshness delegation reads the original service at each pipeline check.
   * @evidence contracts/common.md#clear-and-simple-design This façade preserves private field ownership while the named helper holds capture/publication logic below the file limit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No field or adapter evaluation occurs during context construction; optional status and opaque host evidence retain their existing limits, and AsyncFunction reflection changes.
   * @evidence contracts/common.md#meaningful-documentation Direct helper-Promise return preserves rejection for first project/getter failures without an extra async adoption wrapper.
   * @evidence contracts/performance.md#efficient-algorithms Context creation adds fixed allocation to the helper's full status, capture, verification and publication cost.
   * @evidence contracts/performance.md#reuse-equivalent-work The same original project/capture/status aliases remain live across later checks, without an eager snapshot.
   * @evidence contracts/performance.md#bound-retention-and-release-resources One operation context retains the receiver until its Promise settles; host resources and disk publication lifetimes stay with their actual owners.
   */
  public preview(input: IAutoMoviePreviewFrameInput): Promise<IAutoMoviePreviewFrameOutput> {
    const owner: AutoMovieProductionOracleService = this;
    return oracleServicePreview({
      get project(): AutoMovieProductionProject { return owner.project; },
      get capture(): AutoMovieProductionFrameCapture | undefined { return owner.capture; },
      captureReceiver: owner,
      freshnessDiagnostic: (generated: IAutoMovieGeneratedManifest): IAutoMovieDiagnostic | null => owner.freshnessDiagnostic(generated),
    }, input);
  }

  private freshnessDiagnostic(
    generated: IAutoMovieGeneratedManifest,
  ): IAutoMovieDiagnostic | null {
    const generatedManifestPath: string = normalizeSlash(
      path.relative(
        this.project.root,
        this.project.trackedStatePath("generated-manifest.json"),
      ),
    );
    if (this.buildStatus === undefined) return null;
    const status: IAutoMovieBuildProjectOutput = this.buildStatus();
    if (status.builder.inputFingerprint !== generated.inputFingerprint)
      return {
        code: "generated-stale",
        category: "error",
        phase: "compile",
        target: "generated-manifest",
        path: generatedManifestPath,
        message: `Generated input ${generated.inputFingerprint} differs from current ${status.builder.inputFingerprint}. Build the current source through the production builder before requesting oracle evidence.`,
      };
    const error: IAutoMovieDiagnostic | undefined = status.diagnostics.find(
      (diagnostic: IAutoMovieDiagnostic) : boolean => diagnostic.category === "error",
    );
    if (status.success === false || error !== undefined)
      return {
        code: "compile-current-invalid",
        category: "error",
        phase: "compile",
        target: "generated-manifest",
        path: generatedManifestPath,
        message: `Current source does not pass the read-only builder gate${error === undefined ? "" : `: ${error.message}`}. Correct it and build the current source through the production builder before requesting oracle evidence.`,
      };
    return null;
  }
}
