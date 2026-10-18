import { IAutoMovieContourLoft64 as L } from "../../../packages/engine/src/geometry/curve/IAutoMovieContourLoft64.ts";
import { tessellateAutoMovieContourLoft64 } from "../../../packages/engine/src/geometry/curve/tessellateAutoMovieContourLoft64.ts";
import type { IAutoMovieModel } from "../../../packages/interface/src/model/IAutoMovieModel.ts";
import { RecoveryMeshSections as R } from "./RecoveryMeshSections.ts";

/**
 * Generate a surface from saved cubic coefficients and explicit contour continuation only.
 * The engine shares each generating boundary across its incident slabs. Unmet fitting
 * tolerances and strip-quality failures remain visible and unqualified. An actual missing
 * incidence or unrepresentable primitive remains a local gap rather than a quality warning.
 * Optional work observation changes timing records only; saved generating inputs are immutable.
 *
 * @evidence contracts/common.md#principled-implementation The existing engine contour loft consumes complete cubic coefficients, explicit per-slab curve incidence and declared terminals to generate independent vertices, faces, normals and construction.
 * @evidence contracts/common.md#clear-and-simple-design One engine invocation owns shared section boundaries; the adapter admits the bundle, keeps strip qualification/work records separate from missing geometry, and wraps the generated mesh in the interface model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, source normals or source addresses are admitted. Numerical target misses and strip topology/link/orientation warnings never remove returned finite geometry. Actual unresolved incidence remains explicit without fallback or forced closure.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes displayability from qualification, work observations, shared curve authority, actual local gaps and source-independent engine generation.
 * @evidence contracts/performance.md#efficient-algorithms Admission and report gathering are O(K+P) for K sections and P reports; the existing engine owns tessellation costs and shared boundary sampling.
 * @evidence contracts/performance.md#reuse-equivalent-work One engine result supplies both model and construction, and camera changes need no regeneration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Generated model buffers, actual construction and diagnostics transfer to the caller; the adapter retains no source mesh, cache or handle.
 */
export function reconstructRecovery(
  bundle: R.Bundle,
  options: { observeWork?: boolean } = {},
): {
  model: IAutoMovieModel;
  construction: L.IResult["construction"];
  diagnostics: string[];
  unresolved: L.IResult["unresolved"];
  stripObservations: NonNullable<L.IResult["stripObservations"]>;
  primitiveRanges: NonNullable<L.IResult["primitiveRanges"]>;
  interactionObservations: NonNullable<L.IResult["interactionObservations"]>;
} {
  if (
    bundle.schema !== "automovie-recovery-curves-v1" ||
    bundle.reports.length !== bundle.loft.sections.length ||
    !bundle.loft.intervals
  )
    throw new Error(
      "A generic cubic bundle with explicit curve continuation is required",
    );
  const diagnostics: string[] = [...bundle.diagnostics];
  for (let i: number = 0; i < bundle.loft.sections.length; i++) {
    const report: R.Bundle["reports"][number] = bundle.reports[i]!;
    const section: L.ISection = bundle.loft.sections[i]!;
    if (
      report.coordinateMm !== section.coordinateMm ||
      report.fits.length !== section.loops.length
    )
      throw new Error(
        "Recovery quality reports are not aligned with their curve authority",
      );
    for (const diagnostic of report.diagnostics)
      diagnostics.push(`${section.coordinateMm} mm: ${diagnostic}`);
  }
  const generated: L.IResult = tessellateAutoMovieContourLoft64({
    ...bundle.loft,
    observeWork: options.observeWork ?? false,
  });
  const model: IAutoMovieModel = {
    id: "recovered-curves",
    name: null,
    origin: "generated",
    parts: [],
    skeleton: null,
    body: null,
    materials: [],
    asset: null,
  };
  if (generated.mesh.indices!.length > 0)
    model.parts.push({
      id: "recovery.curve-loft",
      name: null,
      geometry: { type: "mesh", mesh: generated.mesh },
      material: null,
      attachedBone: null,
      transform: null,
    });
  return {
    model,
    construction: generated.construction,
    diagnostics,
    unresolved: generated.unresolved,
    stripObservations: generated.stripObservations ?? [],
    primitiveRanges: generated.primitiveRanges ?? [],
    interactionObservations: generated.interactionObservations ?? [],
  };
}
