import { IAutoMovieAnalysisTarget, IAutoMovieEnvironmentContext } from "@automovie/interface";
import { IAutoMovieAnalysisSolid } from "./IAutoMovieAnalysisSolid";
import { IAutoMovieAnalysisLuminaire } from "./IAutoMovieAnalysisLuminaire";
import { IAutoMovieAnalysisWorkplane } from "./IAutoMovieAnalysisWorkplane";

/**
 * Everything one daylight or artificial-light study is configured with.
 *
 * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `IAutoMovieDaylightRequest` binds one reproducible lighting study to its revision, environment, plane, blockers, sources, sky model, sampling density, and targets.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The request is the complete state boundary from which daylight and artificial-light metrics are calculated or explicitly refused.
 */
export interface IAutoMovieDaylightRequest {
  /**
   * Stable run identity.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary The request `id` gives the lighting study a stable run identity independent of its subject.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state This key anchors the sealed run and its deterministic sampling labels.
   */
  id: string;
  /**
   * Logical space or surface being studied.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `subject` names the logical room or surface whose illuminance evidence is being produced.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The subject label persists in the result so sampled optical state stays attributable to the studied element.
   */
  subject: string;
  /**
   * Design revision being read.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `inputRevision` records which design state the workplane and shading evidence represent.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The revision is sealed into the run so later summaries can classify obsolete lighting measurements as stale.
   */
  inputRevision: string;
  /**
   * Read-only external world.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `context` contributes the read-only sun, sky irradiance, and neighbouring blockers used by the lighting study.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The external state is validated, looked up by instant, and combined with building-owned shades without transferring ownership.
   */
  context: IAutoMovieEnvironmentContext;
  /**
   * Instant id to study, or null for an artificial-light-only study.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `instant` selects the declared sun and sky state, while null deliberately requests artificial light alone.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The nullable key controls environment lookup and the explicit not-run outcome when neither natural nor artificial source exists.
   */
  instant: string | null;
  /**
   * Measurement grid.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `workplane` states the exact surface, face, dimensions, and resolution on which light is judged.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The oriented grid is expanded into ordered cell-centre positions and a shared measurement normal.
   */
  workplane: IAutoMovieAnalysisWorkplane;
  /**
   * Building-owned convex shading solids such as a canopy or a fin.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `shades` declares the building-owned blockers that may remove sun, sky, or luminaire rays from a sample.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state These convex solids join context occluders in the same analytic ray test while retaining their authored ownership.
   */
  shades: readonly IAutoMovieAnalysisSolid[];
  /**
   * Artificial sources contributing to the same plane.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `luminaires` enumerates only the authored artificial sources included in the workplane result.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The validated point sources contribute deterministic inverse-square illuminance after visibility testing.
   */
  luminaires: readonly IAutoMovieAnalysisLuminaire[];
  /**
   * Sky luminance distribution requested.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `sky` declares the luminance distribution the author expects rather than letting the solver choose silently.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The model string is checked against the supported isotropic distribution and otherwise produces an explicit unsupported run.
   */
  sky: string;
  /**
   * Sky-vault sample count per measurement point; a positive whole number.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `diffuseSamples` fixes the authored resolution of each sky-visibility estimate.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The positive count selects a deterministic cosine-weighted hemisphere sequence and enters the settings digest.
   */
  diffuseSamples: number;
  /**
   * Targets the production declares for this study.
   *
   * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary Lighting `targets` declare the thresholds used to judge supported illuminance and contrast metrics.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The validated list is matched by metric key and that metric's declared unit during deterministic result construction.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
