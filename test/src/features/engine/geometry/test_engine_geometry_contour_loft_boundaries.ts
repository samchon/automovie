import { assertContourLoftBoundaryAdmission } from "../../internal/assertContourLoftBoundaryAdmission";
import { assertContourLoftBoundaryCompletion } from "../../internal/assertContourLoftBoundaryCompletion";
import { assertContourLoftBoundaryCore } from "../../internal/assertContourLoftBoundaryCore";

/**
 * The contour loft publishes shared cubic boundaries, declared local gaps and
 * each sample's source phase; its cases live in three shared assertion
 * modules, one per concern.
 *
 * Scenarios:
 *
 * 1. Core (`assertContourLoftBoundaryCore`): unequal polygon partitions reuse
 *    every middle-ring index with opposite traversal, in metres at their
 *    declared phases; half restrictions of a rectangular prism keep its
 *    lateral area; a split followed by a merge shares both middle banks.
 * 2. Admission (`assertContourLoftBoundaryAdmission`): empty input, invalid
 *    tolerance or order and a C0-disconnected source are told apart; malformed
 *    terminals, coordinates, incidence and names stay local to their brackets.
 * 3. Completion (`assertContourLoftBoundaryCompletion`): unsupported closed-to-
 *    open continuations, isolated terminals closing a two-cone surface, a
 *    regular merge's interior slit aligned with its generating phases, and the
 *    collinear cubic [0, 10, 0, 10] split at 1/4 keeping its endpoint 4.375.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates shared phase geometry, admission failures and terminal or slit completion by named assertion suite.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the boundary core, admission and completion assertions on the actual contour loft and checks emitted topology and scoped diagnostics.
 * @evidence contracts/development/testing.md#independent-expectations A rectangular prism's split restrictions preserve its lateral area. Shared boundary points need the same index with opposite traversal. Cubic subdivision at one quarter independently gives 4.375.
 */
export function test_engine_geometry_contour_loft_boundaries(): void {
  const context: ReturnType<typeof assertContourLoftBoundaryCore> =
    assertContourLoftBoundaryCore();
  assertContourLoftBoundaryAdmission();
  assertContourLoftBoundaryCompletion(context);
}
