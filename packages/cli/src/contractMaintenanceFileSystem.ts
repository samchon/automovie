import { compareCodeUnits } from "@automovie/engine";
import {
  type IScaffoldFileSnapshot,
  type IScaffoldPhysicalDirectory,
  assertScaffoldFileSnapshot,
  assertScaffoldPhysicalDirectory,
  captureScaffoldPhysicalDirectory,
  readScaffoldFileSnapshot,
} from "@automovie/template";
import * as path from "node:path";

/**
 *
 * Physical observations supplied to maintenance without granting mutation.
 * Every read returns the descriptor-verified generation beside its bytes.
 *
 * Production binds `@automovie/template`'s snapshot functions; the only other
 * implementations are the race fakes in the CLI tests. A missing directory or
 * file is reported by an error whose `code` is `ENOENT`, which observation
 * treats as absence; any other error is a refusal.
 *
 * @evidence contracts/common.md#principled-implementation A port of four synchronous operations whose identity is `dev:ino` and whose generation is `dev:ino:size:mtimeNs:ctimeNs`, so a swapped or edited entry changes a compared string; it has no create, write or delete member.
 * @evidence contracts/common.md#clear-and-simple-design Exactly the four calls observation and its revalidation make; listing lives in `IAutoMovieMaintenanceDirectoryIO` because only the Markdown walker enumerates entries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Production always binds the template functions; the injectable seam lets tests reproduce generation races and changes no production behavior.
 * @evidence contracts/common.md#meaningful-documentation States the read-only grant, the default binding, the `ENOENT` absence convention, and that any other error refuses.
 * @evidence contracts/performance.md#cost-and-resources The port fixes call shapes, not an algorithm; each member states its own per-call cost. The port shares nothing itself; `observeAutoMovieMaintenanceFiles` decides which captures to cache by path. Every member returns without holding a descriptor: the default binding opens at most one per call and closes it in `finally`, so only returned values outlive a call.
 * @author Samchon
 */
export interface IAutoMovieMaintenanceObservationIO {
  /**
   *
   * Capture one ordinary directory at a native absolute path, or throw: an
   * `ENOENT` error when it is missing, which observation treats as an absent
   * ancestor, and any other error for a link, junction or non-directory.
   *
   * @evidence contracts/common.md#principled-implementation The default `captureScaffoldPhysicalDirectory` refuses a link or non-directory by `lstat`, takes identity from `fstat` on a descriptor whose inode must match the `lstat` inode, and records `realpathSync.native` as `real`.
   * @evidence contracts/common.md#clear-and-simple-design One capture answers both "is this an ordinary directory" and "which generation is it", and observation caches the answer by lexical path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws instead of following a link; only observation decides that `ENOENT` makes every path below this ancestor absent.
   * @evidence contracts/common.md#meaningful-documentation States the native absolute input, the `ENOENT` meaning for observation, and that links and junctions throw.
   * @evidence contracts/performance.md#cost-and-resources A constant number of native calls per capture (`lstat`, open, `fstat`, close, native realpath), made once per distinct ancestor in one observation. A capture is a fresh native observation by design; reuse across paths is the observation's directory map, not this member's. The default binding opens one read-only directory descriptor to `fstat` it and closes it in `finally` before returning three strings.
   */
  directory(target: string): IScaffoldPhysicalDirectory;

  /**
   *
   * Throw unless a captured directory still has its identity and native real
   * path. A missing directory throws its native error, which observation
   * propagates instead of treating as absence.
   *
   * @evidence contracts/common.md#principled-implementation The default `assertScaffoldPhysicalDirectory` re-captures the lexical path and compares `identity` and `real`, so a replaced directory or a newly linked ancestor fails while the spelling stays the same.
   * @evidence contracts/common.md#clear-and-simple-design Kept apart from capture so callers state where a generation must still hold: around each ancestor step and after each file read.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Compares and never re-adopts a changed generation; disappearance here is a refusal even though disappearance before capture is absence.
   * @evidence contracts/common.md#meaningful-documentation States what is compared and that a missing directory refuses here.
   * @evidence contracts/performance.md#cost-and-resources One full capture per call; observation calls it for every captured directory after each file, so these calls dominate an observation's native call count. Each call must observe the filesystem again, because its purpose is detecting change since the cached capture. Like capture, the default binding opens and closes one directory descriptor within the call and retains nothing.
   */
  assertDirectory(directory: IScaffoldPhysicalDirectory): void;

  /**
   *
   * Throw unless `lstat` of `snapshot.path` still matches its identity and full
   * version, including `ctimeNs`. Call it before reopening the file, because on
   * Windows the reopen itself advances `ctimeNs`.
   *
   * @evidence contracts/common.md#principled-implementation The default `assertScaffoldFileSnapshot` compares a fresh `lstat` identity and `dev:ino:size:mtimeNs:ctimeNs` with the snapshot, which is exact only while this operation has not opened the file again.
   * @evidence contracts/common.md#clear-and-simple-design A pathname-only check separate from `file`, so revalidation confirms a generation without reading content.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no tolerance: the ctime exemption exists only in the later generation comparison of this operation's own reread.
   * @evidence contracts/common.md#meaningful-documentation States the full-version comparison and why the call must precede the reopen.
   * @evidence contracts/performance.md#cost-and-resources One `lstat` per call and no content read. The check exists to observe the file again after planning, so a cached answer would defeat it. `lstat` opens no descriptor, and the call keeps nothing.
   */
  assertFile(snapshot: IScaffoldFileSnapshot): void;

  /**
   *
   * Read one ordinary, unlinked file completely through one descriptor. Returns
   * its bytes, the pathname snapshot captured after the descriptor closed, and
   * the identity and version the descriptor itself reported. A missing file
   * throws an `ENOENT` error.
   *
   * @evidence contracts/common.md#principled-implementation The default `readScaffoldFileSnapshot` admits the path by `lstat`, checks the opened descriptor against that snapshot before and after `readFileSync(descriptor)`, closes it, then re-captures the pathname, so the bytes belong to one generation.
   * @evidence contracts/common.md#clear-and-simple-design One member returns bytes and both identities because observation records pathname and descriptor generations separately.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Keeps descriptor identity beside the pathname snapshot instead of equating them, because Windows path and handle device ids can differ; no default bytes stand in for a failed read.
   * @evidence contracts/common.md#meaningful-documentation States the single-descriptor read, the three returned facts and when each was captured, and the `ENOENT` signal.
   * @evidence contracts/performance.md#cost-and-resources One full read of the file plus a constant number of stats, so cost is linear in file size. Observation reads each path once per observation; the revalidation's second read is deliberate and compared, not shared. Holds one descriptor during the call and closes it in `finally`, aggregating a close failure with a read failure; the returned bytes grow with file size, with no cap.
   */
  file(target: string): {
    bytes: Uint8Array;
    snapshot: IScaffoldFileSnapshot;
    identity: string;
    version: string;
  };
}

/**
 *
 * Plan-bound physical inventory of a closed set of project-relative paths:
 * each path's file generation or null when absent, every existing ancestor
 * directory even when the path itself is absent, and the decoded sources.
 *
 * Record keys are the requested `/`-separated paths; directory and snapshot
 * paths are native absolute spellings. The record and its maps are frozen, and
 * the maps have no prototype, so a key such as `__proto__` is ordinary.
 *
 * @evidence contracts/common.md#principled-implementation Records pathname snapshots, descriptor identities and fatally decoded UTF-8 sources per path, so revalidation can compare each against a fresh read; absence is an explicit null rather than a missing key.
 * @evidence contracts/common.md#clear-and-simple-design Five views keyed consistently by the same paths; `files` and `descriptors` stay separate because pathname and handle generations are compared separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses null-prototype maps instead of special-casing reserved key names, and supplies no default source for an absent file.
 * @evidence contracts/common.md#meaningful-documentation States the key spelling, the null and omission meanings, directory order, the decoding rule, and the frozen ownership.
 * @evidence contracts/performance.md#cost-and-resources A frozen result record linear in requested paths and directories; the observation that fills it owns the cost. The TOC writer reuses its directory captures as write parents and its file snapshots as replacement authority instead of capturing them again; that is valid only after `assertAutoMovieMaintenanceObservation` found every identity unchanged. Holds every decoded source for the life of one command, growing with the requested paths and their bytes with no cap, and holds no descriptor.
 * @author Samchon
 */
export interface IAutoMovieMaintenanceObservation {
  /** Root first, then each existing ancestor directory in capture order. */
  directories: readonly IScaffoldPhysicalDirectory[];

  /** Pathname generation of each requested path, or null for an absent one. */
  files: Readonly<Record<string, IScaffoldFileSnapshot | null>>;

  /** Held-descriptor identity and generation, separately from pathname metadata. */
  descriptors: Readonly<
    Record<string, Pick<IScaffoldFileSnapshot, "identity" | "version"> | null>
  >;

  /**
   * Exact sources, with absent targets omitted; invalid UTF-8 throws during
   * observation, and a leading byte-order mark is kept.
   */
  sources: Readonly<Record<string, string>>;

  /** Physical project root used throughout this operation. */
  root: IScaffoldPhysicalDirectory;
}

const defaultIO: IAutoMovieMaintenanceObservationIO = {
  directory: captureScaffoldPhysicalDirectory,
  assertDirectory: assertScaffoldPhysicalDirectory,
  assertFile: assertScaffoldFileSnapshot,
  file: readScaffoldFileSnapshot,
};

const missing = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "ENOENT";

const inside = (root: string, target: string): boolean => {
  const relative = path.relative(root, target);
  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

/**
 *
 * Read a closed maintenance population through every physical ancestor.
 * Missing targets are observations, while links, changed parents and read
 * failures are refusals. No directory is created during planning.
 *
 * Paths are `/`-separated and project-relative; a backslash, NUL, colon, or
 * empty, `.` or `..` segment throws. The root must be reached without a link,
 * tested as its lexical path equalling its native real path, so on Windows an
 * 8.3 short-name or `subst` spelling of an unlinked root is refused as well.
 *
 * @evidence contracts/common.md#principled-implementation Walks each path's ancestors from the captured root, capturing each directory once and refusing one whose real path leaves the root's real path or differs from its own lexical path, then reads the file through a descriptor-verified snapshot and decodes it with a fatal UTF-8 decoder; treating "lexical path equals native real path" as "no link" is the premise that also refuses a short-name or `subst` root.
 * @evidence contracts/common.md#clear-and-simple-design One function owns traversal, the capture cache and the frozen result, while the IO port owns every native call; it creates nothing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Turns only `ENOENT` into absence and propagates every other error; paths are deduplicated and sorted by code unit so caller order cannot change the result; the short-name and `subst` refusal is a false refusal left uncompensated.
 * @evidence contracts/common.md#meaningful-documentation States the path grammar, absence versus refusal, the no-create rule, and the root test with its Windows consequence.
 * @evidence contracts/performance.md#cost-and-resources Each ancestor is captured once, but after every path the loop re-asserts every directory captured so far, so native calls grow with paths times directories although only that path's own ancestor chain bears on its read, and the final root check and `assertAutoMovieMaintenanceObservation` re-check all directories anyway; each present file is read once and the path list is sorted once. Paths sharing an ancestor reuse its capture through the `directories` map keyed by lexical path; the map lives for one call, and a cached capture is re-asserted by identity and real path before it authorizes another read. Holds at most one file descriptor at a time, inside `io.file`, which the default port closes before returning; retained memory is the captures and decoded sources in the returned record, linear in paths and bytes with no cap.
 */
export const observeAutoMovieMaintenanceFiles = (props: {
  root: string | IScaffoldPhysicalDirectory;
  paths: readonly string[];
  io?: IAutoMovieMaintenanceObservationIO;
}): IAutoMovieMaintenanceObservation => {
  const io = props.io ?? defaultIO;
  const root =
    typeof props.root === "string"
      ? io.directory(path.resolve(props.root))
      : props.root;
  io.assertDirectory(root);
  if (path.relative(root.path, root.real) !== "")
    throw new Error("Maintenance root is reached through a linked ancestor.");
  const directories = new Map<string, IScaffoldPhysicalDirectory>([
    [root.path, root],
  ]);
  const files = Object.create(null) as Record<
    string,
    IScaffoldFileSnapshot | null
  >;
  const sources = Object.create(null) as Record<string, string>;
  const descriptors = Object.create(null) as Record<
    string,
    Pick<IScaffoldFileSnapshot, "identity" | "version"> | null
  >;
  for (const relative of [...new Set(props.paths)].sort(compareCodeUnits)) {
    const segments = relative.split("/");
    if (
      relative.includes("\\") ||
      relative.includes("\0") ||
      relative.includes(":") ||
      segments.some((segment) => ["", ".", ".."].includes(segment))
    )
      throw new Error(`Invalid maintenance path: ${relative}.`);
    const target = path.resolve(root.path, ...segments);
    let parent = root;
    let absent = false;
    for (const segment of segments.slice(0, -1)) {
      const next = path.join(parent.path, segment);
      let directory = directories.get(next);
      if (directory === undefined) {
        try {
          directory = io.directory(next);
        } catch (error) {
          if (!missing(error)) throw error;
          absent = true;
          break;
        }
        if (
          !inside(root.real, directory.real) ||
          path.relative(directory.path, directory.real) !== ""
        )
          throw new Error(
            `Maintenance ancestor escapes its root: ${relative}.`,
          );
        directories.set(next, directory);
      }
      io.assertDirectory(parent);
      io.assertDirectory(directory);
      parent = directory;
    }
    files[relative] = null;
    descriptors[relative] = null;
    if (!absent)
      try {
        const observed = io.file(target);
        if (observed.snapshot.path !== target)
          throw new Error(
            `Maintenance file observation changed path: ${relative}.`,
          );
        files[relative] = Object.freeze({ ...observed.snapshot });
        descriptors[relative] = Object.freeze({
          identity: observed.identity,
          version: observed.version,
        });
        sources[relative] = new TextDecoder("utf-8", {
          fatal: true,
          ignoreBOM: true,
        }).decode(observed.bytes);
      } catch (error) {
        if (!missing(error)) throw error;
      }
    for (const directory of directories.values()) io.assertDirectory(directory);
  }
  io.assertDirectory(root);
  return Object.freeze({
    directories: Object.freeze(
      [...directories.values()].map((directory) =>
        Object.freeze({ ...directory }),
      ),
    ),
    files: Object.freeze(files),
    descriptors: Object.freeze(descriptors),
    sources: Object.freeze(sources),
    root: Object.freeze({ ...root }),
  });
};

/**
 *
 * Reopen the planner's population without adopting a competitor generation.
 * The returned fresh read is useful for publication planning, but only after
 * all original file and ancestor identities have remained equal.
 *
 * Every captured directory and every present file's pathname generation is
 * asserted before anything is reopened; the same paths are then observed again
 * from the captured root and compared by `assertAutoMovieMaintenanceGeneration`.
 * A newly added path is not detected here; the Markdown inventory recheck
 * covers that.
 *
 * @evidence contracts/common.md#principled-implementation Checks pathname generations, ctime included, before its own reopen (Windows advances ctime on open), then re-reads and compares identity, ctime-free version and exact text, so any change between planning and publication throws.
 * @evidence contracts/common.md#clear-and-simple-design Composes the port's per-entry checks, one observation and the pure comparison, adding no comparison rule of its own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses on any difference rather than adopting the newer generation; the ctime tolerance it relies on is stated, with its basis, on the comparison.
 * @evidence contracts/common.md#meaningful-documentation States the order of checks, the re-observation from the captured root, the returned fresh read, and what it does not detect.
 * @evidence contracts/performance.md#cost-and-resources One capture per directory and one `lstat` per present file, then a full observation that reads every present file again, then a comparison linear in paths plus total source length. Returns the fresh observation so `run` plans publication from it instead of reading a third time; the first observation cannot stand in for the re-read because an independent read is the point. Holds the expected and the fresh record at once, so peak memory is two copies of every source; descriptors are opened one at a time and closed by the port.
 */
export const assertAutoMovieMaintenanceObservation = (
  expected: IAutoMovieMaintenanceObservation,
  io: IAutoMovieMaintenanceObservationIO = defaultIO,
): IAutoMovieMaintenanceObservation => {
  for (const directory of expected.directories) io.assertDirectory(directory);
  for (const file of Object.values(expected.files))
    if (file !== null) io.assertFile(file);
  const current = observeAutoMovieMaintenanceFiles({
    root: expected.root,
    paths: Object.keys(expected.files),
    io,
  });
  assertAutoMovieMaintenanceGeneration(expected, current);
  return current;
};

/**
 *
 * Compare an admitted inventory with the result of our own subsequent reads.
 * Current may extend the population, but every expected file and ancestor must
 * still be represented. This pure subset comparison ignores only own-open
 * ctime drift; it does not replace the full snapshot admission before IO.
 *
 * Throws an `Error` naming the first changed root, ancestor or path.
 *
 * @evidence contracts/common.md#principled-implementation Compares the root's identity, path and real path exactly, each expected directory by identity and real path through a map of current directories, and each expected path by consistent presence across snapshot, descriptor and source, then by identity, version without its last field, and exact text.
 * @evidence contracts/common.md#clear-and-simple-design A pure function over two records, kept apart from IO so the comparison rule lives in one place and is checkable without a filesystem.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Drops the trailing `ctimeNs` field of pathname and descriptor versions because Windows advances ctime whenever a handle opens the path; the tolerance applies on every OS, so a change that moves only ctime, such as a POSIX `chmod`, passes while identity, size, mtime and text must still match.
 * @evidence contracts/common.md#meaningful-documentation States the subset semantics, the ctime exemption, that it does not replace pre-IO admission, and the thrown error.
 * @evidence contracts/performance.md#cost-and-resources Linear: one map over current directories, one lookup per expected directory, and constant work per expected path plus text comparison proportional to source length. A pure comparison of two records it is handed; it computes nothing a later caller could share. Allocates one map of current directories for the call and retains nothing after returning.
 */
export const assertAutoMovieMaintenanceGeneration = (
  expected: IAutoMovieMaintenanceObservation,
  current: IAutoMovieMaintenanceObservation,
): void => {
  if (
    expected.root.identity !== current.root.identity ||
    expected.root.path !== current.root.path ||
    expected.root.real !== current.root.real
  )
    throw new Error("Maintenance root changed during extended observation.");
  const directories = new Map(
    current.directories.map((directory) => [directory.path, directory]),
  );
  for (const directory of expected.directories) {
    const observed = directories.get(directory.path);
    if (
      observed?.identity !== directory.identity ||
      observed.real !== directory.real
    )
      throw new Error(
        `Maintenance ancestor changed during extended observation: ${directory.path}.`,
      );
  }
  for (const relative of Object.keys(expected.files)) {
    if (
      !Object.hasOwn(current.files, relative) ||
      !Object.hasOwn(expected.descriptors, relative) ||
      !Object.hasOwn(current.descriptors, relative)
    )
      throw new Error(
        `Maintenance extended observation omitted an input: ${relative}.`,
      );
    const before = expected.files[relative]!;
    const after = current.files[relative]!;
    const beforeDescriptor = expected.descriptors[relative]!;
    const afterDescriptor = current.descriptors[relative]!;
    if (
      (before === null) !== (beforeDescriptor === null) ||
      (after === null) !== (afterDescriptor === null) ||
      (before === null) !== (expected.sources[relative] === undefined) ||
      (after === null) !== (current.sources[relative] === undefined)
    )
      throw new Error(
        `Maintenance extended observation has inconsistent authority: ${relative}.`,
      );
    if (
      (before === null) !== (after === null) ||
      (before !== null &&
        after !== null &&
        (before.identity !== after.identity ||
          before.version.split(":").slice(0, -1).join(":") !==
            after.version.split(":").slice(0, -1).join(":"))) ||
      expected.sources[relative] !== current.sources[relative] ||
      (beforeDescriptor !== null &&
        afterDescriptor !== null &&
        (beforeDescriptor.identity !== afterDescriptor.identity ||
          beforeDescriptor.version.split(":").slice(0, -1).join(":") !==
            afterDescriptor.version.split(":").slice(0, -1).join(":")))
    )
      throw new Error(`Maintenance input changed after planning: ${relative}.`);
  }
};
