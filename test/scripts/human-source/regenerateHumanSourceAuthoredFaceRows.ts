import type { IHumanSourceAuthoredCompilation } from "./structures/IHumanSourceAuthoredCompilation.ts";
import type { IHumanSourceCut } from "./structures/IHumanSourceCut.ts";
import type { IHumanSourceFaceReproduction } from "./structures/IHumanSourceFaceReproduction.ts";
import { readHumanSourceAuthoredEndpoint } from "./readHumanSourceAuthoredEndpoint.ts";

/** Replace recipe-matched head rows with actual current provider deltas.
 * Historical residual controls retain their local displacement through
 * explicit native support stencils. This transport is a prototype convention
 * and remains a carried derivative, never an upstream-regenerated or observed
 * expression. Retired points never appear in the emitted root. Both sides of
 * the head/body cut consume the same ordered interpolation stencil.
 */
export function regenerateHumanSourceAuthoredFaceRows(
  historical: IHumanSourceFaceReproduction,
  original: IHumanSourceCut,
  current: IHumanSourceAuthoredCompilation,
): IHumanSourceFaceReproduction {
  const cut = current.skin.partition.cut;
  const g1Targets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(historical.g1Targets)) {
    const recipe = historical.recipes[name];
    const delta = readHumanSourceAuthoredEndpoint({ name, original, root: current.root, packet: current.packet,
      reader: current.reader, originalRows: rows, recipe, shiftMetres: historical.shifts[name] });
    const output: number[] = [];
    cut.faceSamples.forEach(({ a, b, t }, vertex) => {
      const value = [0, 1, 2].map((axis) => (1 - t) * delta[3 * a + axis] + t * delta[3 * b + axis]);
      if (value.some((coordinate) => !Number.isFinite(coordinate))) throw new Error(`Current face endpoint ${name} is nonfinite.`);
      if (value.some((coordinate) => coordinate !== 0)) output.push(cut.faceToG1[vertex], ...value);
    });
    g1Targets[name] = output;
  }
  return { ...historical, g1Targets,
    rows: historical.rows.map((row) => row.surface !== "Human" ? row : { ...row, regeneration: null, p1: null, p2: null,
      note: row.recipe === null ? "Historical residual displacement transported through original native support; performed acceptance pending."
        : "Actual current-provider recipe delta on the new root; historical recipe recovery is separate from current shape acceptance." }),
    checks: { ...historical.checks, currentProviderRootVertices: current.root.topology.vertexCount,
      currentHeadVertices: cut.faceToG1.length, currentHeadEndpoints: Object.keys(g1Targets).length } };
}
