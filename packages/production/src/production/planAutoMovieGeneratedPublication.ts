import type { IAutoMovieGeneratedManifest } from "@automovie/interface";

/**
 * Prepare changed generated-member writes and the ownership-record write.
 *
 * Removed prior members are resolved first, candidates are resolved and compared in map order, and the manifest is read and compared last. Candidate bytes are detached with Buffer.from even when identical; changed ownership is appended after member writes. Resolution/read failures propagate unchanged, and the transaction owner decides that an empty plan preserves the revision.
 *
 * @evidence contracts/common.md#principled-implementation A set of candidate paths identifies retired members, and exact byte equality decides member/manifest no-ops. productionProjectCommitGenerated supplies fenced resolution and reads under commit coordination; this helper performs no publication or independent namespace admission.
 * @evidence contracts/common.md#clear-and-simple-design One ordered write array separates retirement, candidate replacement and manifest publication while the existing transaction owns revision comparison, input confirmation, application and rollback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absence is the explicit exists/readManifest result, not a swallowed read error. The supported ownership manifest is written last; no failed observation is repaired or unchanged bytes published merely to advance a revision.
 * @evidence contracts/common.md#meaningful-documentation States comparison/refusal order, detached candidate bytes, null retirement contents, last ownership write, empty-plan meaning and guarded callback ownership.
 * @evidence contracts/performance.md#efficient-algorithms For P prior and C candidate members, set construction and traversal cost O(P+C); complete candidate buffers are copied and resident bytes read/copied/compared, including unchanged files. Manifest encoding/comparison adds its full byte count; returned writes retain only changed buffers and retirement paths.
 * @evidence contracts/performance.md#reuse-equivalent-work Byte-identical members and manifest avoid writes, and an empty plan avoids revision publication in the caller. These current fenced reads cannot be reused across later mutable transactions solely from matching paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned changed buffers are owned by the staged transaction, with caller-owned manifest text and newly allocated path records; temporary unchanged copies expire locally. Project callbacks own handles and locks, and candidate/output bytes have no limit imposed here.
 */
export function planAutoMovieGeneratedPublication(
  props: {
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
}
): Array<{ path: string; content: Uint8Array | string | null }> {
  const writes: Array<{ path: string; content: Uint8Array | string | null }> =
    [];
  const nextPaths: Set<string> = new Set(props.files.keys());
  for (const entry of props.previous?.files ?? [])
    if (nextPaths.has(entry.path) === false)
      writes.push({ path: props.resolveMember(entry.path), content: null });
  for (const [relative, bytes] of props.files) {
    const absolute: string = props.resolveMember(relative);
    const content: Buffer = Buffer.from(bytes);
    if (
      props.exists(absolute) === false ||
      Buffer.from(props.readMember(relative)).equals(content) === false
    )
      writes.push({ path: absolute, content });
  }
  const manifest: Uint8Array | null = props.readManifest();
  if (
    manifest === null ||
    Buffer.from(manifest).equals(
      Buffer.from(props.serializedManifest, "utf8"),
    ) === false
  )
    writes.push({
      path: props.manifestPath,
      content: props.serializedManifest,
    });
  return writes;
}
