import { runResolveDriversCopyScenario } from "../../../internal/runResolveDriversCopyScenario";

/**
 * Copy drivers read sampled values or rest transforms, blend selected components and refuse out-of-range influences and sampled widths.
 *
 * Scenarios:
 * 1. Full influence copies translation, scale and the checked quaternion components from rest into new channels.
 * 2. Translation-only half influence blends sampled10/20 into15 and keeps rotation absent.
 * 3. Negative/above-one influences throw.
 * 4. Missing sampled owner/source nodes, short translation and extra rotation components throw.
 */
export function test_unit_engine_resolve_drivers_copy(): void {
  runResolveDriversCopyScenario();
}
