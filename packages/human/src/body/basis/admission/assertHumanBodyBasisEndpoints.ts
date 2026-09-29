import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import { assertSparseRows } from "../assertSparseRows";

/**
 * Reconcile the shaped rig landmarks with the already admitted skin rows.
 *
 * A named endpoint may move skin alone, landmarks alone, or both; the
 * present r16 basis has many skin-only rows. Every declared endpoint
 * must move at least one resident vertex or landmark, so a misspelled
 * name cannot silently evaluate to zero. Landmark indices address the
 * immutable ordered IDs and their displacement rows are metres.
 */
export function assertHumanBodyBasisEndpoints(
  basis: IAutoMovieHumanBodyBasis,
  endpoints: ReadonlySet<string>,
  resident: Set<string>,
): void {
  const landmarks = basis.landmarks.ids.length;
  for (const [name, rows] of Object.entries(basis.landmarks.targets)) {
    if (!endpoints.has(name))
      throw new Error(
        "Body landmark rows name an undeclared endpoint: " + name,
      );
    assertSparseRows(rows, landmarks, "landmark " + name);
    resident.add(name);
  }
  if ([...endpoints].some((name) => !resident.has(name)))
    throw new Error(
      "Every declared body endpoint must move at least one resident vertex or landmark.",
    );
}
