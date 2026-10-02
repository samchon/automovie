import type { IAutoMovieGeneratedManifest } from "@automovie/interface";

/**
 * Stage the exact changed closure of one generated result under its commit lock.
 *
 * The project authority supplies fenced path resolution and resident reads.
 * This policy owns retirement of prior manifest members, byte-identical no-op
 * detection, copying caller-owned candidate bytes and the manifest write. It
 * prepares writes without publishing them; the shared transaction still owns
 * revision comparison, freshness checks, apply, verification and rollback.
 *
 * Removed members are resolved first, candidate members are checked in their
 * map order, and the manifest is compared last. This preserves the existing
 * refusal order and places the ownership record after its member writes. The
 * returned empty plan must not advance a revision. Read and resolution errors
 * propagate unchanged, so an unsafe or unreadable resident file cannot become
 * a missing-file repair.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-change-impact-visibility Selects only retired or changed generated members and a changed ownership record, leaving byte-identical output out of the publication plan.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-change-impact-invariant Preserves identical generated members and stages only the closure changed by the current derivation without advancing state itself.
 */
export const planAutoMovieGeneratedPublication = (props: {
  /** Previously admitted ownership record, or no resident manifest. */
  previous: IAutoMovieGeneratedManifest | null;

  /** Exact current candidates, copied before they enter the shared transaction. */
  files: ReadonlyMap<string, Uint8Array>;

  /** Bytes serialized by the project record writer, without another encoding. */
  serializedManifest: string;

  /** Fenced resolution of one generated member to its resident write address. */
  resolveMember: (relative: string) => string;

  /** Host observation of whether the resolved member currently exists. */
  exists: (absolute: string) => boolean;

  /** Fenced exact read of a resident generated member. */
  readMember: (relative: string) => Uint8Array;

  /** Resident state address of the generated ownership record. */
  manifestPath: string;

  /** Fenced current manifest bytes; absence remains distinct from empty bytes. */
  readManifest: () => Uint8Array | null;
}): Array<{ path: string; content: Uint8Array | string | null }> => {
  const writes: Array<{ path: string; content: Uint8Array | string | null }> = [];
  const nextPaths = new Set(props.files.keys());
  for (const entry of props.previous?.files ?? [])
    if (nextPaths.has(entry.path) === false)
      writes.push({ path: props.resolveMember(entry.path), content: null });
  for (const [relative, bytes] of props.files) {
    const absolute = props.resolveMember(relative);
    const content = Buffer.from(bytes);
    if (
      props.exists(absolute) === false ||
      Buffer.from(props.readMember(relative)).equals(content) === false
    )
      writes.push({ path: absolute, content });
  }
  const manifest = props.readManifest();
  if (
    manifest === null ||
    Buffer.from(manifest).equals(Buffer.from(props.serializedManifest, "utf8")) === false
  )
    writes.push({ path: props.manifestPath, content: props.serializedManifest });
  return writes;
};
