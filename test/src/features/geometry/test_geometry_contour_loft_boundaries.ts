import { assertContourLoftBoundaryAdmission } from "../internal/assertContourLoftBoundaryAdmission";
import { assertContourLoftBoundaryCompletion } from "../internal/assertContourLoftBoundaryCompletion";
import { assertContourLoftBoundaryCore } from "../internal/assertContourLoftBoundaryCore";

/**
 * Shared cubic boundaries, declared local gaps and source phase authority survive loft publication.
 *
 * Scenarios:
 *
 * 1. Three unequal polygon partitions reuse every middle-ring mesh index with opposite incident traversal; construction remains in metres and each sample evaluates at its declared source phase.
 * 2. Exact half restrictions of a rectangular prism preserve its analytic lateral area, source trace and shared boundaries under unequal phase widths and negative winding.
 * 3. An unsupported closed-to-open continuation uses one before boundary and no after boundary beside a supported strip; a hidden open component retains its zero-boundary unsupported group. Missing, repeated or out-of-range local incidence is diagnosed while independent groups and adjacent intervals remain visible, without inventing a cap or nearest match.
 * 4. Explicit isolated minimum and maximum terminals close a two-cone surface, while a finite unmatched loop remains unresolved.
 * 5. A regular merge between dimensioned rectangles selects a strict interior slit on a cubic with nonuniform parameter speed. Every inserted knot must remain aligned with its original generating phase, including reversed cavity winding.
 * 6. Empty input, invalid tolerance/order and a C0-disconnected source distinguish admitted emptiness, malformed input and a local unresolved curve representation.
 * 7. A split followed by a merge shares both middle contour banks. Global artificial-connector incidence is measured separately from raw-bank reuse and per-strip qualification, without imposing a global embedding or manifold gate.
 * 8. Splitting the collinear cubic [0,10,0,10] at phase 1/4 retains the exact Bernstein endpoint 4.375 and repartitions children against the unchanged 0.25 mm finite-segment control bound. Already qualified explicit restrictions retain ancestry beyond thirty; further adaptive work and unrepresentable compressed paths still refuse. Caller coefficients remain unchanged.
 * 9. Malformed event terminals, coordinates, incidence and names remain local to their identifiable saved brackets. Empty, nonfinite, short and sparse source endpoints, unusable phase metadata and a wrong spatial unit keep independent curves visible without fabricated diagnostic points.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the portable loft source and reads actual mesh indices, construction, phases, primitive ranges, strip observations and unresolved groups. It detects a duplicate shared bank, lost independent geometry under local incidence/event/source failure, unit conversion error, nonfinite diagnostic points, source-phase drift or invented closure. Split/merge composition logs global overfull-edge observations separately from asserted raw-bank sharing; those logs are diagnostics, not an asserted global manifold guarantee. Globally unusable tolerance, section ordering and unidentifiable saved brackets still refuse.
 * @evidence contracts/testing.md#independent-expectations Oriented integer edge incidence establishes shared-bank reuse; a prism's lateral area is perimeter times height and a two-cone complex has every edge paired. A four-corner pair contributes eight elementary triangles and a declared four-corner extremum contributes four, fixing independent-neighbor counts under malformed local metadata. A diagnostic point requires an actual dense finite millimetre endpoint, not a manufactured coordinate. Original Bernstein polynomials determine every declared phase sample. The collinear split endpoint is 30*(3/4)^2*(1/4)+10*(1/4)^3=4.375; clamped projection independently measures child control distances. These are mathematical CPU expectations, not visual, embedding or source-fitting claims.
 * @evidence contracts/testing.md#distinguishing-cases Covers unequal partitions/phase widths, exact restrictions at ancestry depths zero, twenty-nine, thirty and thirty-one versus exhausted adaptive work and invalid compressed paths, both winding senses, shared middle rings, missing/duplicate/out-of-range local incidence versus missing intervals, invalid event terminal/coordinate/incidence/name versus valid extrema and unidentifiable brackets, empty/nonfinite/short/sparse endpoint versus valid diagnostic endpoints, absent/non-array phase metadata and wrong spatial units, empty input, invalid tolerance/order, disconnected C0 and interior nonuniform-speed slits. Fixed-seam minima and low-level identity/degeneracy refusal belong to the strip tests.
 * @evidence contracts/testing.md#execution-ownership The named discoverable entry imports portable engine computation and mathematical test helpers directly. It neither installs consumers nor builds a native artifact or starts a real process, browser or GPU; no test is dynamically registered and no foreign method is replaced.
 */
export function test_geometry_contour_loft_boundaries(): void {
  const context: ReturnType<typeof assertContourLoftBoundaryCore> =
    assertContourLoftBoundaryCore();
  assertContourLoftBoundaryAdmission();
  assertContourLoftBoundaryCompletion(context);
}
