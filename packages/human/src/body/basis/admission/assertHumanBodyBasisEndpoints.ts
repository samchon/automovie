import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertSparseRows } from "../assertSparseRows";

/**
 * Reconcile the shaped rig landmarks with the already admitted skin rows.
 *
 * A named endpoint may move skin alone, landmarks alone, or both; the present r16 basis has many skin-only rows. Every declared endpoint must move at least one resident vertex or landmark, so a misspelled name cannot silently evaluate to zero. Landmark indices address the immutable ordered IDs and their displacement rows are metres.
 *
 * @evidence contracts/common.md#principled-implementation Declared endpoint membership and sparse landmark-row admission reconcile source target identities with at least one resident skin or landmark population.
 * @evidence contracts/common.md#clear-and-simple-design Skin/shape admission supplies endpoints and resident targets; this boundary adds validated landmark residency and checks completeness once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin-only or landmark-only endpoints are permitted source distinctions, but undeclared rows and unresident targets cannot silently evaluate as zero.
 * @evidence contracts/common.md#meaningful-documentation The prose gives endpoint alternatives, ordered landmark indexing and meter displacement; resident is an accumulator updated as rows pass admission.
 * @evidence contracts/performance.md#efficient-algorithms A full landmark-target and endpoint scan costs O(T+E) set lookups plus sparse-row entries; every target must be visited to prove residency.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller's existing resident set and declared endpoint set are reused across skin/landmark admission without recomputing skin rows.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary entry/endpoint arrays expire after admission; resident gains up to T names and remains caller-owned even when a later check fails.
 */
export function assertHumanBodyBasisEndpoints(
  basis: IAutoMovieHumanBodyBasis,
  endpoints: ReadonlySet<string>,
  resident: Set<string>,
): void {
  const landmarks: number = basis.landmarks.ids.length;
  for (const [name, rows] of Object.entries(basis.landmarks.targets)) {
    if (!endpoints.has(name))
      throw new Error(
        "Body landmark rows name an undeclared endpoint: " + name,
      );
    assertSparseRows(rows, landmarks, "landmark " + name);
    resident.add(name);
  }
  if ([...endpoints].some((name: string): boolean => !resident.has(name)))
    throw new Error(
      "Every declared body endpoint must move at least one resident vertex or landmark.",
    );
}
