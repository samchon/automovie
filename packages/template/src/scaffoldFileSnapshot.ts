import * as fs from "node:fs";
import * as path from "node:path";

import { combineScaffoldFailures } from "./combineScaffoldFailures";
import { publishNativeScaffoldFile } from "./nativeScaffoldPublication";
import { scaffoldPhysicalIdentity } from "./scaffoldPhysicalIdentity";
import type { ScaffoldFilePublicationOutcome } from "./scaffoldPublication";

/**
 * One ordinary directory captured by physical identity, so later steps can
 * prove they still operate on the same directory rather than on whatever its
 * path names now.
 *
 * @evidence contracts/common.md#principled-implementation A path can be renamed, replaced, or redirected through a link between two calls, so the capture pairs the lexical path with the device-and-inode identity read from an opened descriptor and with the native real path; a later capture that differs in either value proves the directory changed.
 * @evidence contracts/common.md#clear-and-simple-design Three strings are the whole state the ownership checks compare, and the record has no methods, so capturing and revalidating stay in the functions that own them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries no flag that skips a revalidation or trusts a directory without its identity.
 * @evidence contracts/common.md#meaningful-documentation The comment states why identity is captured with the path, and each member states its source and the comparison it serves.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record of three strings chooses no algorithm; capture cost belongs to the functions that build it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is the reused value itself; `ensureScaffoldFileDirectory` decides when a cached one may be reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The record holds three strings and no descriptor; the descriptor that produced the identity is closed before the record exists.
 * @author Samchon
 */
export interface IScaffoldPhysicalDirectory {
  /**
   * `<device>:<inode>` read through a descriptor opened on the directory,
   * which on Windows reports the volume serial number that a path-based stat
   * may report as 0.
   */
  identity: string;

  /** Absolute lexical path of the directory. */
  path: string;

  /**
   * Native real path, compared against the scaffold root's to refuse a
   * directory that a link or junction places outside it.
   */
  real: string;
}

/** Captured pathname generation of one existing ordinary single-link file. */
interface IScaffoldFileSnapshot {
  /**
   * `<device>:<inode>` from a pathname stat. It is compared only with other
   * pathname stats, because a Windows pathname stat and a handle stat can
   * report different device numbers.
   */
  identity: string;

  /** Absolute pathname whose resident was captured. */
  path: string;

  /** `written` plus the change time. */
  version: string;

  /** Identity, size, and modification time: what a writer of the file moves. */
  written: string;
}

/**
 * Create or capture the scaffold root directory without following a linked
 * ancestor into it.
 *
 * The nearest existing ancestor of `directory` is captured first; each
 * missing level is then created with a plain `mkdir`, after revalidating the
 * level above it, and captured as a new, empty, ordinary directory.
 *
 * @param directory Root path, resolved against the working directory.
 * @returns The captured root.
 * @throws When an existing level is a link or not a directory, when a captured
 *   level changes during creation, when a level created here is not empty,
 *   or when an ancestor cannot be read for a reason other than being missing.
 *
 * @evidence contracts/common.md#principled-implementation The walk climbs with `path.dirname` until a level exists, which ends at the file-system root, then creates downward with non-recursive `mkdirSync`, so every created level has a captured parent; a level created by someone else between the climb and the `mkdir` makes `mkdir` throw `EEXIST` instead of being adopted.
 * @evidence contracts/common.md#clear-and-simple-design This function owns only the root and its missing ancestors; descendants of the root belong to `ensureScaffoldFileDirectory`, which checks containment against this capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only `ENOENT` and `ENOTDIR` are treated as missing levels; any other capture error propagates, and an unexpected entry in a level created here is refused rather than tolerated.
 * @evidence contracts/common.md#meaningful-documentation The comment states the climb, the create-and-capture order, every refusal, and how the path is resolved.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the number of path levels, with a constant number of stats, opens, and real-path reads per level; `missing.unshift` is quadratic only in that depth, which is a handful of levels.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call captures the current file-system state that the caller is about to rely on, so an earlier capture is not equivalent; `publishFiles` calls this once per publication.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every descriptor opened to read an identity is closed inside `physicalDirectoryIdentity` before the capture returns; the function keeps only the list of missing levels for the duration of the call.
 */
export const ensureScaffoldBaseDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const absolute: string = path.resolve(directory);
  const missing: string[] = [];
  let cursor: string = absolute;
  let ownership: IScaffoldPhysicalDirectory;
  while (true) {
    try {
      ownership = captureScaffoldPhysicalDirectory(cursor);
      break;
    } catch (error) {
      if (missingPath(error) === false) throw error;
      missing.unshift(cursor);
      const parent: string = path.dirname(cursor);
      if (parent === cursor) throw error;
      cursor = parent;
    }
  }
  for (const target of missing) {
    assertScaffoldPhysicalDirectory(ownership);
    fs.mkdirSync(target);
    assertScaffoldPhysicalDirectory(ownership);
    ownership = captureEmptyScaffoldPhysicalDirectory(target);
  }
  return ownership;
};

/** Capture one ordinary directory, refusing a symbolic link or junction. */
const captureScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const absolute: string = path.resolve(directory);
  const status: fs.BigIntStats = fs.lstatSync(absolute, { bigint: true });
  if (status.isSymbolicLink() || status.isDirectory() === false)
    throw new Error(
      `scaffold directory is not one ordinary directory: ${absolute}`,
    );
  return {
    identity: physicalDirectoryIdentity(absolute, status),
    path: absolute,
    real: path.resolve(fs.realpathSync.native(absolute)),
  };
};

/**
 * Derive a directory's physical identity from an opened descriptor.
 *
 * A path-based stat is not a reliable device source everywhere: Node on
 * Windows can report device 0 for a directory reached by path while `fstat` on
 * the opened directory reports the volume serial, which is also what the
 * native parent handle reports at publication. The inode equality check pins
 * the descriptor to the directory the caller just inspected.
 */
const physicalDirectoryIdentity = (
  absolute: string,
  status: fs.BigIntStats,
): string => {
  const descriptor: number = fs.openSync(absolute, fs.constants.O_RDONLY);
  try {
    const opened: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
    if (opened.isDirectory() === false || opened.ino !== status.ino)
      throw new Error(
        `scaffold directory changed while its identity was captured: ${absolute}`,
      );
    return scaffoldPhysicalIdentity(opened);
  } finally {
    fs.closeSync(descriptor);
  }
};

/**
 * Require that a captured directory's path still names the same ordinary
 * directory with the same real path.
 *
 * @param ownership The earlier capture.
 * @throws When the path is now missing, a link, not a directory, or a
 *   different directory, or when its real path moved.
 *
 * @evidence contracts/common.md#principled-implementation Revalidation recaptures the path and compares identity and real path, the two values that change when a directory is replaced or redirected, while a rename of an unrelated sibling leaves both intact.
 * @evidence contracts/common.md#clear-and-simple-design The check reuses the capture function instead of a second stat routine, so capture and revalidation cannot disagree on what identity means.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mismatch always throws; there is no tolerance for a changed identity and no retry.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two compared values and every condition that throws.
 * @evidence contracts/performance.md#efficient-algorithms One `lstat`, one open with `fstat` and close, and one native real-path read per call, constant in the directory's contents.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The function exists to observe the file system again, so a cached answer would remove the check it performs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The descriptor opened by the capture is closed in `finally` before the comparison; nothing is retained after the call.
 */
export const assertScaffoldPhysicalDirectory = (
  ownership: IScaffoldPhysicalDirectory,
): void => {
  const current: IScaffoldPhysicalDirectory = captureScaffoldPhysicalDirectory(
    ownership.path,
  );
  if (
    current.identity !== ownership.identity ||
    current.real !== ownership.real
  )
    throw new Error(`scaffold directory changed generation: ${ownership.path}`);
};

/** Capture a directory this module just created and require it to be empty. */
const captureEmptyScaffoldPhysicalDirectory = (
  directory: string,
): IScaffoldPhysicalDirectory => {
  const ownership: IScaffoldPhysicalDirectory =
    captureScaffoldPhysicalDirectory(directory);
  const before: fs.BigIntStats = fs.lstatSync(ownership.path, { bigint: true });
  if (physicalDirectoryIdentity(ownership.path, before) !== ownership.identity)
    throw new Error(`scaffold directory changed generation: ${ownership.path}`);
  const entries: string[] = fs.readdirSync(ownership.path);
  const after: fs.BigIntStats = fs.lstatSync(ownership.path, { bigint: true });
  if (
    physicalDirectoryIdentity(ownership.path, after) !== ownership.identity ||
    physicalVersion(after) !== physicalVersion(before)
  )
    throw new Error(
      `scaffold directory changed while inspected: ${ownership.path}`,
    );
  assertScaffoldPhysicalDirectory(ownership);
  if (entries.length !== 0)
    throw new Error(
      `new scaffold directory is unexpectedly non-empty: ${ownership.path}`,
    );
  return ownership;
};

/**
 * Resolve, creating where missing, every directory between the captured root
 * and `directory`, and return the capture of `directory`.
 *
 * Each level is checked against the root and the level above it before it is
 * read, created, or reused. A level created here must be empty. A level whose
 * real path leaves the root's real path is refused, which catches a junction
 * or symbolic link at any depth.
 *
 * @param props.base Captured scaffold root.
 * @param props.cache Captures of levels already resolved in this publication,
 *   keyed by absolute path. The function adds every level it captures; a hit
 *   is revalidated before use.
 * @param props.directory Directory to resolve, inside the root.
 * @returns The capture of `directory`, or `base` when they are the same.
 * @throws When `directory` is outside the root lexically or physically, or any
 *   level fails revalidation.
 *
 * @evidence contracts/common.md#principled-implementation Containment is decided twice: lexically with `path.relative`, which rejects `..` and absolute results, and physically by comparing native real paths, because a link can make a lexically contained path resolve elsewhere; creation uses non-recursive `mkdirSync` after revalidating the parent so only a captured parent receives a new level.
 * @evidence contracts/common.md#clear-and-simple-design The function owns descendant levels and their per-publication cache, while the caller owns the cache's lifetime and the root capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cached level is still revalidated before reuse, and only a missing level is created; any other capture failure propagates.
 * @evidence contracts/common.md#meaningful-documentation The comment states the per-level checks, the cache's key and ownership, the return for the root itself, and each refusal.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the depth of `directory` below the root, with a constant number of captures per level; a cache hit replaces the capture and creation of a level with one revalidation.
 * @evidence contracts/performance.md#reuse-equivalent-work A level captured for an earlier file of the same publication is reused from `props.cache` when its absolute path matches, and equivalence is proved by revalidating its identity and real path before use; a changed level throws rather than being recaptured.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns `props.cache`, which grows by one capture per distinct directory in the publication and holds no descriptor; every descriptor opened during capture is closed before the capture returns.
 */
export const ensureScaffoldFileDirectory = (props: {
  base: IScaffoldPhysicalDirectory;
  cache: Map<string, IScaffoldPhysicalDirectory>;
  directory: string;
}): IScaffoldPhysicalDirectory => {
  const absolute: string = path.resolve(props.directory);
  const relative: string = path.relative(props.base.path, absolute);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(`scaffold directory escapes its base: ${absolute}`);
  let current: IScaffoldPhysicalDirectory = props.base;
  if (relative.length === 0) return current;
  for (const segment of relative.split(path.sep)) {
    const target: string = path.join(current.path, segment);
    assertScaffoldPhysicalDirectory(props.base);
    assertScaffoldPhysicalDirectory(current);
    let child: IScaffoldPhysicalDirectory | undefined = props.cache.get(target);
    if (child === undefined) {
      try {
        child = captureScaffoldPhysicalDirectory(target);
      } catch (error) {
        if (missingPath(error) === false) throw error;
        assertScaffoldPhysicalDirectory(props.base);
        assertScaffoldPhysicalDirectory(current);
        fs.mkdirSync(target);
        assertScaffoldPhysicalDirectory(props.base);
        assertScaffoldPhysicalDirectory(current);
        child = captureEmptyScaffoldPhysicalDirectory(target);
      }
      if (inside(props.base.real, child.real) === false)
        throw new Error(
          `scaffold directory escapes its physical base: ${target}`,
        );
      props.cache.set(target, child);
    } else assertScaffoldPhysicalDirectory(child);
    current = child;
  }
  return current;
};

/**
 * Write one scaffold file into a captured parent directory and report the
 * effect.
 *
 * A missing file is created through {@link publishNativeScaffoldFile},
 * relative to a handle on `parent`. With `force`, an existing file is instead
 * rewritten in place, and only when it is one ordinary file that exactly one
 * directory entry names: the descriptor that truncates it must stay the file
 * the pathname names before the truncation, after the write, and after the
 * final readback. Without `force`, an existing file meets the exclusive
 * create and is refused as `target-competitor`.
 *
 * An in-place rewrite reports `refused` (`create-failed`) for any failure
 * before truncation and `partial` with the bytes written for any failure
 * after it. A link to the file created between the descriptor's link-count
 * check and the truncation is not seen, and the rewrite then reaches it.
 *
 * @param props.base Captured scaffold root; `parent` must lie inside it.
 * @param props.bytes Exact file content.
 * @param props.force Rewrite an existing file instead of refusing it.
 * @param props.parent Captured directory that must be `target`'s parent.
 * @param props.target Path of the file.
 * @returns The frozen outcome.
 * @throws Before any write, when `target` is not directly inside `parent`,
 *   when `base` or `parent` fails revalidation, or, with `force`, when an
 *   existing `target` is a link, not a file, or has more than one link.
 *
 * @evidence contracts/common.md#principled-implementation A new file uses the native exclusive create relative to the parent handle, which cannot follow a link or replace an entry; an existing file is rewritten through `ftruncate` and positioned writes on one descriptor, and every check compares that descriptor's identity, size, and modification time with a fresh pathname capture, leaving the change time out because Windows moves it when this module's own verification opens the file; the link race named in the comment is the unresolved limitation.
 * @evidence contracts/common.md#clear-and-simple-design This function owns the choice between creating and rewriting and the ownership checks against `base`; the native adapter owns handle-relative creation, and the private rewrite helper owns the descriptor sequence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed rewrite is never cleaned up or retried; it is reported as `refused` or `partial` from whether truncation happened, and a multiply linked file is refused because rewriting its inode would change every other name for it.
 * @evidence contracts/common.md#meaningful-documentation The comment states both paths, the admission for a rewrite, the refusal without `force`, how failures map to outcomes, the remaining race, each parameter, and what throws before any write.
 * @evidence contracts/performance.md#efficient-algorithms A create costs what `publishNativeScaffoldFile` costs; a rewrite is one write pass and one readback pass over the file plus a constant number of stats and pathname opens, linear in its size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call writes one file and re-observes it, which is an effect that must not be shared; directory captures it receives are reused by the caller's cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A rewrite owns its file descriptor and each pathname descriptor opened for a resident check, and closes every one in all paths before returning, combining a close failure with the earlier failure; a create delegates its handles to the native adapter, which closes them.
 */
export const writeScaffoldFile = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  force: boolean;
  parent: IScaffoldPhysicalDirectory;
  target: string;
}): ScaffoldFilePublicationOutcome => {
  const target: string = path.resolve(props.target);
  if (path.dirname(target) !== props.parent.path)
    throw new Error(`scaffold file changed declared parent: ${target}`);
  assertScaffoldOwnership(props.base, props.parent);
  if (props.force) {
    let existing: IScaffoldFileSnapshot | null;
    try {
      existing = captureScaffoldFile(target);
    } catch (error) {
      if (missingPath(error) === false) throw error;
      existing = null;
    }
    if (existing !== null)
      return overwriteScaffoldFile({
        base: props.base,
        bytes: props.bytes,
        existing,
        parent: props.parent,
      });
  }
  return publishNativeScaffoldFile({
    bytes: props.bytes,
    childName: path.basename(target),
    expectedParentIdentity: props.parent.identity,
    parentPath: props.parent.path,
  });
};

/**
 * Replace one existing ordinary single-link scaffold file in place.
 *
 * The link count is read from the descriptor this operation writes through
 * rather than from a pathname stat, so the decision and the write look at the
 * same file. Rewriting the inode is admissible only while exactly one entry
 * names it, because every other name would observe the write.
 */
const overwriteScaffoldFile = (props: {
  base: IScaffoldPhysicalDirectory;
  bytes: Uint8Array;
  existing: IScaffoldFileSnapshot;
  parent: IScaffoldPhysicalDirectory;
}): ScaffoldFilePublicationOutcome => {
  const target: string = props.existing.path;
  let descriptor: number;
  try {
    descriptor = fs.openSync(target, "r+");
  } catch (error) {
    return Object.freeze({
      error,
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  }
  const progress: { bytesWritten: number } = { bytesWritten: 0 };
  let failure: unknown = undefined;
  let mutated: boolean = false;
  let completedIdentity: string | undefined;
  let completedSnapshot: IScaffoldFileSnapshot | undefined;
  try {
    const opened: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
    assertOrdinarySingleLinkFile(opened, target);
    assertScaffoldFileDescriptor(
      props.existing,
      descriptor,
      writtenVersion(opened),
    );
    assertScaffoldOwnership(props.base, props.parent);
    fs.ftruncateSync(descriptor, 0);
    mutated = true;
    writeScaffoldDescriptor(descriptor, target, props.bytes, progress);
    const completed: fs.BigIntStats = fs.fstatSync(descriptor, {
      bigint: true,
    });
    completedIdentity = scaffoldPhysicalIdentity(completed);
    if (completed.size !== BigInt(props.bytes.byteLength))
      throw new Error(`scaffold file changed final size: ${target}`);
    assertScaffoldFileDescriptor(
      captureScaffoldFile(target),
      descriptor,
      writtenVersion(completed),
    );
    assertScaffoldDescriptorBytes(descriptor, target, props.bytes);
    const finalStatus: fs.BigIntStats = fs.fstatSync(descriptor, {
      bigint: true,
    });
    if (writtenVersion(finalStatus) !== writtenVersion(completed))
      throw new Error(`scaffold file changed after final readback: ${target}`);
    const resident: IScaffoldFileSnapshot = captureScaffoldFile(target);
    assertScaffoldFileDescriptor(
      resident,
      descriptor,
      writtenVersion(finalStatus),
    );
    completedSnapshot = assertOpenedScaffoldFileSnapshot(resident);
    assertScaffoldOwnership(props.base, props.parent);
  } catch (error) {
    failure = error;
  }
  try {
    fs.closeSync(descriptor);
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "overwritten scaffold file close",
    );
  }
  if (failure === undefined)
    try {
      assertScaffoldFileSnapshot(completedSnapshot!);
      assertScaffoldOwnership(props.base, props.parent);
    } catch (error) {
      failure = error;
    }
  if (failure !== undefined && mutated === false)
    return Object.freeze({
      error: failure,
      reason: "create-failed" as const,
      status: "refused" as const,
    });
  return failure === undefined
    ? Object.freeze({
        fileIdentity: completedIdentity!,
        parentIdentity: props.parent.identity,
        status: "completed" as const,
      })
    : Object.freeze({
        bytesWritten: progress.bytesWritten,
        error: failure,
        parentIdentity: props.parent.identity,
        status: "partial" as const,
      });
};

/** Capture one existing ordinary single-link file through its pathname. */
const captureScaffoldFile = (file: string): IScaffoldFileSnapshot => {
  const absolute: string = path.resolve(file);
  const status: fs.BigIntStats = fs.lstatSync(absolute, { bigint: true });
  assertOrdinarySingleLinkFile(status, absolute);
  return {
    identity: scaffoldPhysicalIdentity(status),
    path: absolute,
    version: physicalVersion(status),
    written: writtenVersion(status),
  };
};

/**
 * Verify a held descriptor against its captured pathname generation: the
 * pathname still names the snapshot's file, the descriptor still shows
 * `expectedWritten`, and a fresh pathname open shows the same written state.
 */
const assertScaffoldFileDescriptor = (
  snapshot: IScaffoldFileSnapshot,
  descriptor: number,
  expectedWritten: string,
): void => {
  assertOpenedScaffoldFileSnapshot(snapshot);
  const opened: fs.BigIntStats = fs.fstatSync(descriptor, { bigint: true });
  assertOrdinarySingleLinkFile(opened, snapshot.path);
  if (writtenVersion(opened) !== expectedWritten)
    throw new Error(
      `scaffold file descriptor changed generation: ${snapshot.path}`,
    );
  const residentDescriptor: number = fs.openSync(snapshot.path, "r");
  let failure: unknown = undefined;
  try {
    const resident: fs.BigIntStats = fs.fstatSync(residentDescriptor, {
      bigint: true,
    });
    assertOrdinarySingleLinkFile(resident, snapshot.path);
    if (writtenVersion(resident) !== writtenVersion(opened))
      throw new Error(
        `scaffold file descriptor changed resident generation: ${snapshot.path}`,
      );
    assertOpenedScaffoldFileSnapshot(snapshot);
  } catch (error) {
    failure = error;
  }
  try {
    fs.closeSync(residentDescriptor);
  } catch (closeError) {
    failure = combineScaffoldFailures(
      failure,
      closeError,
      "resident scaffold file close",
    );
  }
  if (failure !== undefined)
    throw failure instanceof Error
      ? failure
      : new Error(`scaffold file verification failed: ${snapshot.path}`, {
          cause: failure,
        });
};

/**
 * Recapture a snapshot's pathname while this operation holds descriptors on
 * it and require the same file and written state. The change time is left
 * out: Windows advances it whenever any handle opens the path, including this
 * module's own verification opens, while identity, size, and modification time
 * still move only on a real change.
 */
const assertOpenedScaffoldFileSnapshot = (
  snapshot: IScaffoldFileSnapshot,
): IScaffoldFileSnapshot => {
  const current: IScaffoldFileSnapshot = captureScaffoldFile(snapshot.path);
  if (
    current.identity !== snapshot.identity ||
    current.written !== snapshot.written
  )
    throw new Error(
      `scaffold file changed while its descriptor was open: ${snapshot.path}`,
    );
  return current;
};

/**
 * Require the exact captured generation, change time included, after every
 * descriptor of this operation has closed.
 */
const assertScaffoldFileSnapshot = (snapshot: IScaffoldFileSnapshot): void => {
  const current: IScaffoldFileSnapshot = captureScaffoldFile(snapshot.path);
  if (
    current.identity !== snapshot.identity ||
    current.version !== snapshot.version
  )
    throw new Error(
      `scaffold file changed after descriptor close: ${snapshot.path}`,
    );
};

/**
 * Admission for the in-place rewrite: a regular file, not a symbolic link,
 * that exactly one directory entry names, because the rewrite changes the
 * inode every other name would show.
 */
const assertOrdinarySingleLinkFile = (
  status: fs.BigIntStats,
  file: string,
): void => {
  if (
    status.isSymbolicLink() ||
    status.isFile() === false ||
    status.nlink !== 1n
  )
    throw new Error(
      `scaffold file is not one ordinary single-link file: ${file}`,
    );
};

const assertScaffoldOwnership = (
  base: IScaffoldPhysicalDirectory,
  parent: IScaffoldPhysicalDirectory,
): void => {
  assertScaffoldPhysicalDirectory(base);
  assertScaffoldPhysicalDirectory(parent);
  if (inside(base.real, parent.real) === false)
    throw new Error(
      `scaffold file parent escapes its physical base: ${parent.path}`,
    );
};

/** Write `bytes` from offset 0 through `descriptor`, then flush it. */
const writeScaffoldDescriptor = (
  descriptor: number,
  target: string,
  bytes: Uint8Array,
  progress: { bytesWritten: number },
): void => {
  let offset: number = 0;
  while (offset < bytes.byteLength) {
    const written: number = fs.writeSync(
      descriptor,
      bytes,
      offset,
      bytes.byteLength - offset,
      offset,
    );
    if (written === 0)
      throw new Error(`scaffold file stopped while written: ${target}`);
    offset += written;
    progress.bytesWritten = offset;
  }
  fs.fsyncSync(descriptor);
};

/** Read the whole file back through `descriptor` and require `bytes` exactly. */
const assertScaffoldDescriptorBytes = (
  descriptor: number,
  target: string,
  bytes: Uint8Array,
): void => {
  const readback: Buffer = Buffer.alloc(bytes.byteLength);
  let offset: number = 0;
  while (offset < readback.length) {
    const read: number = fs.readSync(
      descriptor,
      readback,
      offset,
      readback.length - offset,
      offset,
    );
    if (read === 0)
      throw new Error(`scaffold file stopped during readback: ${target}`);
    offset += read;
  }
  if (readback.equals(bytes) === false)
    throw new Error(`scaffold file changed during readback: ${target}`);
};

/** Identity, size, and modification time: the part of a stat a writer moves. */
const writtenVersion = (status: fs.BigIntStats): string =>
  `${scaffoldPhysicalIdentity(status)}:${status.size}:${status.mtimeNs}`;

/** `writtenVersion` plus the change time, which a rename also moves. */
const physicalVersion = (status: fs.BigIntStats): string =>
  `${writtenVersion(status)}:${status.ctimeNs}`;

const inside = (root: string, target: string): boolean => {
  const relative: string = path.relative(root, target);
  return (
    relative.length === 0 ||
    (relative !== ".." &&
      relative.startsWith(`..${path.sep}`) === false &&
      path.isAbsolute(relative) === false)
  );
};

const missingPath = (error: unknown): boolean =>
  (error as NodeJS.ErrnoException).code === "ENOENT" ||
  (error as NodeJS.ErrnoException).code === "ENOTDIR";
