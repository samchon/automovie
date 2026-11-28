import { runResolveDriversCopyScenario } from "../internal/runResolveDriversCopyScenario";

/**
 * Copy drivers read sampled values or rest transforms, blend selected components and refuse out-of-range influences and sampled widths.
 *
 * Scenarios:
 * 1. Full influence copies translation, scale and the checked quaternion components from rest into new channels.
 * 2. Translation-only half influence blends sampled10/20 into15 and keeps rotation absent.
 * 3. Negative/above-one influences throw.
 * 4. Missing sampled owner/source nodes, short translation and extra rotation components throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the shared copy cases through actual resolveDrivers and observes sampled arrays, deferred count, absent rotation and refusal messages, catching lost rest fallback, wrong blend direction or accepted malformed inputs.
 * @evidence contracts/development/testing.md#independent-expectations Full influence selects authored source translation5 and scale4, half influence averages10/20 to15, and the authored unit Y quarter-turn supplies two checked quaternion components. These partial rotation checks do not independently establish all four components or unit norm.
 * @evidence contracts/development/common.md#meaningful-documentation Full influence copies transform components and half translation influence blends only the requested channel. Invalid influences, missing nodes and malformed widths refuse.
 */
export function test_resolve_drivers_copy(): void {
  runResolveDriversCopyScenario();
}
