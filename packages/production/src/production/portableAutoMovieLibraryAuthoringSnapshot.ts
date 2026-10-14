import type { IAutoMovieLibraryAuthoringSnapshot } from "./libraryAuthoringSnapshot";

/**
 * Project one library authoring snapshot onto the facts every checkout shares.
 *
 * A snapshot is acquired inside one physical checkout, so it records where that
 * checkout is as well as what it builds. The builder root and the
 * declaration's absolute `location` are the first kind. The snapshot digest
 * covers them so the publication guard detects a different checkout identity;
 * physical root replacement is fenced by project readers, not proved by path
 * text alone. These location facts say nothing about the portable result.
 * Package identity, production kind, the selected configuration, the binding
 * manifest, the design branch and owner populations with their source
 * bindings, the graph-selected owner edges, and every selected source member's
 * normalized digest are the second kind. Each is project-relative or
 * checkout-independent by construction, and a library result depends on all of
 * them.
 *
 * The projection therefore drops exactly the two location facts and the digest
 * that covers them, and keeps every other field, including one the snapshot
 * gains later. Keeping a field that turns out to name the checkout costs a
 * recompile after a move; dropping one that turns out to matter would let a
 * changed input keep an old result current.
 *
 * @evidence contracts/common.md#principled-implementation Object-rest projection removes resident root, resident digest and configuration.location while retaining every other enumerable field; libraryBuildInputFingerprint hashes this checkout-independent projection alongside namespace and content closure.
 * @evidence contracts/common.md#clear-and-simple-design Separates portable result identity from resident publication identity without maintaining a second allowlist of semantic fields. It creates shallow outer/configuration objects while preserving nested references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Drops only explicit location identities and their derived resident digest; retained future location fields can cause recompilation after a move, but an unlisted semantic input is not silently discarded. Path equality alone does not prove physical root identity.
 * @evidence contracts/common.md#meaningful-documentation States removed fields, retained semantics, shallow-reference ownership and separate physical-root fencing; the projection does not freeze or validate the snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Copies F snapshot and G configuration properties in O(F+G) time and shallow storage; source/design arrays and their bytes are referenced rather than traversed or cloned.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This cheap projection is constructed for the attempt's fingerprint; a retained view would still share mutable nested data and require full snapshot equivalence without avoiding its canonical hashing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned shallow projection and its shared nested references; no cache, file handle or task is retained, and canonical encoding releases the attempt's temporary view.
 * @author Samchon
 */
export function portableAutoMovieLibraryAuthoringSnapshot(
  snapshot: IAutoMovieLibraryAuthoringSnapshot,
): Omit<
  IAutoMovieLibraryAuthoringSnapshot,
  "configuration" | "digest" | "root"
> & {
  configuration: Omit<
    IAutoMovieLibraryAuthoringSnapshot["configuration"],
    "location"
  >;
} {
  const { root, digest, configuration, ...semantic }: IAutoMovieLibraryAuthoringSnapshot = snapshot;
  const { location, ...portableConfiguration }: IAutoMovieLibraryAuthoringSnapshot["configuration"] = configuration;
  return { ...semantic, configuration: portableConfiguration };
}
