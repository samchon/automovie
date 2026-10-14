import { runResolveDriversCopyScenario } from "../internal/runResolveDriversCopyScenario";

/**
 * Copy drivers read sampled values or rest transforms, blend selected components and refuse malformed influences, flags and sampled widths.
 *
 * Scenarios:
 * 1. Full influence copies translation, scale and the checked quaternion components from rest into new channels.
 * 2. Translation-only half influence blends sampled10/20 into15 and keeps rotation absent.
 * 3. NaN/negative/above-one influences and a nonboolean translation flag throw.
 * 4. Missing sampled owner/source nodes, short translation, array-like rotation and extra rotation components throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the shared copy cases through actual resolveDrivers and observes sampled arrays, deferred count, absent rotation and refusal messages, catching lost rest fallback, wrong blend direction or accepted malformed inputs.
 * @evidence contracts/testing.md#independent-expectations Full influence selects authored source translation5 and scale4, half influence averages10/20 to15, and the authored unit Y quarter-turn supplies two checked quaternion components. These partial rotation checks do not independently establish all four components or unit norm.
 * @evidence contracts/testing.md#distinguishing-cases Rest/new channels and sampled/replaced channels contrast full/half influence and enabled/disabled components, with malformed influence, flags, missing nodes and width neighbors; dependency ordering and cyclic graphs have separate entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous test_resolve_drivers_copy delegates its existing portable cases to runResolveDriversCopyScenario, which owns direct product calls without dynamic registration, a process, renderer or foreign replacement.
 */
export function test_resolve_drivers_copy(): void {
  runResolveDriversCopyScenario();
}
