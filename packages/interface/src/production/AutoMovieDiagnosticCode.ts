import { AUTOMOVIE_DIAGNOSTIC_CODES } from "./constants/AUTOMOVIE_DIAGNOSTIC_CODES";

/**
 * One stable machine-readable identity from the shipped diagnostic catalog.
 *
 * @evidence contracts/common.md#principled-implementation The indexed-access type derives exactly the literal members of the canonical diagnostic tuple, which the behavioral catalog maps exhaustively so a new producer code requires a corresponding catalog entry.
 * @evidence contracts/common.md#clear-and-simple-design The type reuses the catalog's key set instead of maintaining a second string union that could drift from supported error identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostic identities describe supported refusal classes rather than fixture names; no arbitrary producer string can satisfy this closed literal union.
 * @evidence contracts/common.md#meaningful-documentation Identifies the code as a stable catalog key rather than user-facing prose, with the canonical tuple owning its allowed values.
 * @author Samchon
 */
export type AutoMovieDiagnosticCode =
  (typeof AUTOMOVIE_DIAGNOSTIC_CODES)[number];
