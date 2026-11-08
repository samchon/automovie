import { test_engine_node_clock } from "./features/engine/test_engine_node_clock";
import { test_geometry_quadratic_program } from "./features/geometry/test_geometry_quadratic_program";
import { test_geometry_quadratic_workspace } from "./features/geometry/test_geometry_quadratic_workspace";

/** Collect the public clock and actual reactor results under Node-only libraries. */
function main(): void {
  const failures: string[] = [];
  for (const run of [
    test_engine_node_clock,
    test_geometry_quadratic_workspace,
    test_geometry_quadratic_program,
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
