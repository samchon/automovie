import { AutoMovieDiagnosticCatalogOwner } from "./AutoMovieDiagnosticCatalogOwner";

/**
 * List the complete immutable diagnostic catalog in canonical code order.
 *
 * The lookup is descriptive and read-only. It neither edits production source
 * nor applies the returned correction.
 */
export const listAutoMovieDiagnosticCatalog = AutoMovieDiagnosticCatalogOwner.listAutoMovieDiagnosticCatalog;
