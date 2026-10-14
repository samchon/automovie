import { AutoMovieDiagnosticCatalogOwner } from "./AutoMovieDiagnosticCatalogOwner";
import type { IAutoMovieDiagnosticCatalogEntry } from "./IAutoMovieDiagnosticCatalogEntry";

/**
 * List the complete immutable diagnostic catalog in canonical code order.
 *
 * The returned array, entries and references are frozen; guidance describes caller-owned corrections without performing them.
 *
 * Aliases the owner's exact list function, returning entries constructed once in maintained code order from code overrides or exhaustive typed family guidance. Runtime registry mutation after construction is not observed.
 *
 * This public binding exposes the canonical owner without a second constructor, cache or invocation wrapper.
 *
 * Returns descriptive data without editing source, certifying repairs or replacing foreign methods; revision and override values belong to the diagnostic contract.
 *
 * Documentation gives ordered population, nested frozen values, shared identity and caller-owned recovery authority.
 *
 * Each call returns the resident array in constant work with no traversal or copy; importing the owner constructs and indexes C codes once with O(C + L) retained data for total code text length L.
 *
 * Every call in this module instance returns the same initialized array and entries; there is no refresh for later registry mutation or equivalence across separate module instances.
 *
 * The module owns the catalog and private index for its module lifetime, with population determined by initialized codes; the binding acquires no handle or task and transfers no cleanup duty.
 */
export const listAutoMovieDiagnosticCatalog: () => readonly Readonly<IAutoMovieDiagnosticCatalogEntry>[] = AutoMovieDiagnosticCatalogOwner.listAutoMovieDiagnosticCatalog;
