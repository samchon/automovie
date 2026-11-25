import { test_engine_node_clock } from "./features/engine/test_engine_node_clock";
import { test_engine_geometry_quadratic_memory } from "./features/engine/geometry/test_engine_geometry_quadratic_memory";
import { test_engine_geometry_quadratic_program } from "./features/engine/geometry/test_engine_geometry_quadratic_program";

/** Collect the public clock and actual reactor results under Node-only libraries. */
function main(): void {
  const failures: string[] = [];
  for (const run of [
    test_engine_node_clock,
    test_engine_geometry_quadratic_memory,
    test_engine_geometry_quadratic_program,
  ]) {
    try {
      run();
      console.log(`PASS ${run.name}`);
    } catch (error) {
      failures.push(`${run.name}: ${String(error)}`);
      console.error(`FAIL ${run.name}:`, error);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}

main();
