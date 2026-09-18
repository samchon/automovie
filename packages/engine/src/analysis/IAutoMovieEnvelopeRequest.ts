import { IAutoMovieAnalysisTarget, IAutoMovieEnvironmentContext } from "@automovie/interface";
import { IAutoMovieEnvelopeAssembly } from "./IAutoMovieEnvelopeAssembly";
import { IAutoMovieEnvelopeBridge } from "./IAutoMovieEnvelopeBridge";
import { IAutoMovieIndoorCondition } from "./IAutoMovieIndoorCondition";

/**
 * Everything one envelope study is configured with.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeRequest` binds one revision's indoor and outdoor conditions to explicit assemblies, bridges, and performance targets.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The request closes the input network used to produce paired thermal and moisture runs from the same envelope state.
 */
export interface IAutoMovieEnvelopeRequest {
  /**
   * Stable study identity; each produced run suffixes its own domain.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment The envelope request `id` identifies the shared study from which its thermal and moisture runs are derived.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This base key is deterministically suffixed by domain so paired environmental outcomes stay related but distinct.
   */
  id: string;
  /**
   * Logical space the envelope encloses.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `subject` names the logical interior whose enclosure load and condensation evidence are reported.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The label is preserved across both domain runs so their resolved outcomes remain attributable to one space.
   */
  subject: string;
  /**
   * Design revision being read.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `inputRevision` records the exact design state whose envelope capacity was calculated.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The revision enters both sealed records so a later rollup can reject superseded environmental evidence.
   */
  inputRevision: string;
  /**
   * Read-only external world.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `context` supplies the validated external temperature state used as the envelope's outdoor boundary.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The read-only environment is resolved by instant and contributes no undeclared climate assumptions to the load network.
   */
  context: IAutoMovieEnvironmentContext;
  /**
   * Instant supplying the exterior boundary condition, or null.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `instant` selects the declared exterior condition, while null leaves the unavailable boundary explicit.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The nullable key controls context lookup and makes both domain runs `not-run` when no outside temperature is resolved.
   */
  instant: string | null;
  /**
   * Indoor air.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `indoor` contributes the explicitly authored temperature and humidity against which the enclosure is tested.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This condition feeds both the thermal gradient and the dew-point comparison in the resolved scenario.
   */
  indoor: IAutoMovieIndoorCondition;
  /**
   * Envelope build-ups; at least one.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `assemblies` enumerate every planar envelope path included in fabric loss and surface-risk results.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The nonempty collection is validated, solved individually, sampled spatially, and summed into environmental capacity metrics.
   */
  assemblies: readonly IAutoMovieEnvelopeAssembly[];
  /**
   * Linear thermal bridges.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `bridges` list the authored linear losses added outside the planar assembly calculation.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Each bridge is resolved to an assembly and contributes `psi * length * deltaT` to the total heat load.
   */
  bridges: readonly IAutoMovieEnvelopeBridge[];
  /**
   * Targets the production declares for this study.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Envelope `targets` declare the thermal and moisture thresholds the authored design is expected to meet.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The shared target list is validated once and resolved against metrics in each of the two domain runs.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
