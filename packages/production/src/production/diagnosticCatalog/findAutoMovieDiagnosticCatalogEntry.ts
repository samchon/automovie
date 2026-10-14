import { AutoMovieDiagnosticCatalogOwner } from "./AutoMovieDiagnosticCatalogOwner";
import type { IAutoMovieDiagnosticCatalogEntry } from "./IAutoMovieDiagnosticCatalogEntry";

/**
 * Resolve one diagnostic code without changing project or catalog state.
 * The exact indexed entry is returned for a known code, or null for any other string.
 *
 * Aliases the owner's exact lookup function over its initialized Map; the cast for Map access changes no string and unknown keys return null rather than synthesizing an entry.
 *
 * A direct function binding preserves identity while the owner alone constructs and indexes the catalog.
 *
 * Performs no project edit, repair, fallback-code selection or foreign method replacement; returned recovery guidance is descriptive.
 *
 * Documentation gives unknown-key null behavior, frozen entry identity and the absence of automatic recovery effects.
 *
 * Each call uses Map lookup with string-key processing and no catalog scan; importing the owner incurs one C-code construction/index pass pair and O(C + L) retained data for total code text length L, without asserting worst-case constant lookup time.
 *
 * Known-code lookups share the exact entries returned by list in this module instance; initialization is not invalidated by later registry changes and separate module instances need not share identity.
 *
 * The owner retains its code index and entries for the module lifetime; calls acquire no files, timers or tasks, and returned references carry no release protocol.
 */
export const findAutoMovieDiagnosticCatalogEntry: (code: string) => Readonly<IAutoMovieDiagnosticCatalogEntry> | null = AutoMovieDiagnosticCatalogOwner.findAutoMovieDiagnosticCatalogEntry;
