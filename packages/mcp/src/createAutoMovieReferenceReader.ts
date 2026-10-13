import type { AutoMovieAuthoredDocumentLayer } from "@automovie/evidence";
import * as path from "node:path";

import { MAX_SOURCE_BYTES } from "./internal/MAX_SOURCE_BYTES";
import { fail } from "./internal/fail";
import { admitReferencePath, validComponent } from "./internal/referencePath";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";
import { createAutoMovieReferenceFileSystem } from "./createAutoMovieReferenceFileSystem";
import type { IAutoMovieReferenceFileSystem } from "./structures/IAutoMovieReferenceFileSystem";
import type { IAutoMovieReferenceIdentity } from "./structures/IAutoMovieReferenceIdentity";
import { admitReferenceInventoryIdentity } from "./internal/admitReferenceInventoryIdentity";
import { appendReferenceInventoryFile } from "./internal/appendReferenceInventoryFile";
import { observeInitialReferenceLayer } from "./internal/observeInitialReferenceLayer";
import { resolveReferenceIoFailure } from "./internal/resolveReferenceIoFailure";

const sameNode: (a: IAutoMovieReferenceIdentity, b: IAutoMovieReferenceIdentity) => boolean = (
  a: IAutoMovieReferenceIdentity,
  b: IAutoMovieReferenceIdentity,
): boolean => a.kind === b.kind && a.device === b.device && a.inode === b.inode;
const sameFile: (a: IAutoMovieReferenceIdentity, b: IAutoMovieReferenceIdentity) => boolean = (
  a: IAutoMovieReferenceIdentity,
  b: IAutoMovieReferenceIdentity,
): boolean =>
  sameNode(a, b) &&
  a.size === b.size &&
  a.modified === b.modified &&
  a.changed === b.changed;

/**
 * Bind an absolute production root to a stateless, physically checked Markdown reader.
 *
 * The namespace is checked before opening, before consuming bytes, and after the bounded handle read. A replacement or concurrent write detected by those observations invalidates the result. Windows observations compare pathname identities separately from descriptor identities; a second resident handle corroborates the latter. Own-open ctime drift is tolerated only inside that read, without ignoring identity or mtime. Node's pathname APIs expose observations, not a kernel-level namespace lock; hostile actors with unrestricted concurrent namespace control remain an OS observation boundary rather than something pure unit tests can certify.
 *
 *
 * @evidence contracts/common.md#principled-implementation An absolute physical root and its ancestry are pinned; source reads compare pathname and descriptor identities before and after bounded I/O, with a second resident handle on Windows.
 * @evidence contracts/common.md#clear-and-simple-design Root binding, directory checks, file admission and walk operations stay within one read-only capability rather than exposing arbitrary paths to requests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observed linked and special entries, identity changes and version changes refuse; hidden names are skipped during inventory. Windows own-open ctime tolerance still checks inode, content size and modification time. Path observations cannot lock a hostile namespace or prove every concurrent write was detected.
 * @evidence contracts/common.md#meaningful-documentation The comment states Windows comparison differences and the OS observation limit; read/list return current bounded bytes or canonical identities and sanitize I/O failures.
 * @evidence contracts/performance.md#efficient-algorithms With N enumerated inventory entries including skipped hidden names, Q pinned root ancestors and D layer-relative depth, walking repeats ancestry observations with an O(N(Q + D)) upper bound plus name inspection. Layer descent stops beyond depth 32 and Markdown accumulation stops at entry 10,001, but non-Markdown entries, directory counts, root depth and directory-name arrays are uncapped. A direct read performs O(Q + D) observations and at most 8 MiB plus one overflow byte of I/O; the inventory's depth limit does not govern direct-read paths.
 * @evidence contracts/performance.md#reuse-equivalent-work Pinned root facts are retained but rechecked each operation; current file versions and byte results are never reused merely because paths match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Q root ancestry observations live with the reader; a walk holds ancestry copies and pending name arrays along its at-most-33 active directory frames, plus up to 10,001 attempted Markdown paths. Directory width and path text are uncapped. A read owns its primary descriptor and, on Windows, one corroborating descriptor; finally blocks await each close attempt on success or refusal, but close failure propagates as IO_ERROR and does not prove physical release. Read buffers and inventories are invocation-local rather than cached.
 */
export async function createAutoMovieReferenceReader(
  root: string,
  io: IAutoMovieReferenceFileSystem = createAutoMovieReferenceFileSystem(),
): Promise<IAutoMovieReferenceReader> {
  if (!path.isAbsolute(root) || path.resolve(root) !== root)
    fail(
      "INVALID_ROOT",
      "Bind an absolute, normalized production root at startup.",
    );
  const rootIdentity: IAutoMovieReferenceIdentity = await io.lstat(root).catch(resolveReferenceIoFailure);
  if (
    rootIdentity.kind !== "directory" ||
    path.relative(root, await io.realpath(root).catch(resolveReferenceIoFailure)) !== ""
  )
    fail(
      "PATH_IDENTITY_CHANGED",
      "The production root must be its physical directory identity.",
    );
  const rootPath: string = path.parse(root).root;
  const rootSegments: string[] = path
    .relative(rootPath, root)
    .split(path.sep)
    .filter((part: string) : boolean => part.length > 0);
  const pinned: { location: string; identity: IAutoMovieReferenceIdentity }[] =
    [];
  let ancestor: string = rootPath;
  for (const segment of ["", ...rootSegments]) {
    ancestor = path.join(ancestor, segment);
    const entry: IAutoMovieReferenceIdentity = await io.lstat(ancestor).catch(resolveReferenceIoFailure);
    if (
      entry.kind !== "directory" ||
      path.relative(ancestor, await io.realpath(ancestor).catch(resolveReferenceIoFailure)) !==
        ""
    )
      fail(
        "PATH_IDENTITY_CHANGED",
        "Root ancestry must contain only physical directories.",
      );
    pinned.push({ location: ancestor, identity: entry });
  }
  if (!sameNode(rootIdentity, pinned[pinned.length - 1].identity))
    fail(
      "PATH_IDENTITY_CHANGED",
      "The production root changed while it was bound.",
    );
  const inspectDirectories: (relative: string) => Promise<typeof pinned> = async (
    relative: string,
  ): Promise<typeof pinned> => {
    const chain: typeof pinned = [...pinned];
    for (const item of pinned) {
      const current: IAutoMovieReferenceIdentity = await io.lstat(item.location);
      if (
        !sameNode(item.identity, current) ||
        path.relative(item.location, await io.realpath(item.location)) !== ""
      )
        fail(
          "PATH_IDENTITY_CHANGED",
          "The bound root ancestry changed; restart after inspecting it.",
        );
    }
    let location: string = root;
    for (const component of relative
      .split("/")
      .filter((part: string) : boolean => part.length > 0)) {
      location = path.join(location, component);
      const entry: IAutoMovieReferenceIdentity = await io.lstat(location);
      if (
        entry.kind !== "directory" ||
        path.relative(location, await io.realpath(location)) !== ""
      )
        fail(
          "PATH_IDENTITY_CHANGED",
          "A reference ancestor is not its physical directory identity.",
        );
      chain.push({ location, identity: entry });
    }
    return chain;
  };
  const recheck: (chain: typeof pinned) => Promise<void> = async (chain: typeof pinned): Promise<void> => {
    for (const item of chain)
      if (
        !sameNode(item.identity, await io.lstat(item.location)) ||
        path.relative(item.location, await io.realpath(item.location)) !== ""
      )
        fail(
          "PATH_IDENTITY_CHANGED",
          "A reference ancestor changed while the source was read.",
        );
  };
  const physicalFile: (entry: IAutoMovieReferenceIdentity) => void = (entry: IAutoMovieReferenceIdentity): void => {
    if (entry.kind !== "file" || entry.links !== 1n)
      fail(
        "PATH_IDENTITY_CHANGED",
        "Reference sources must be regular files with exactly one link.",
      );
    if (entry.size > BigInt(MAX_SOURCE_BYTES))
      fail("RESOURCE_LIMIT", "Source exceeds the 8 MiB file limit.");
  };
  // Windows pathname stats and handle stats can have different device ids,
  // and our own read-only opens can advance ctime. Compare like observations
  // and corroborate the held handle with a second resident handle instead.
  const windows: boolean = io.platform === "win32";
  const sameVersion: (a: IAutoMovieReferenceIdentity, b: IAutoMovieReferenceIdentity) => boolean = (
    a: IAutoMovieReferenceIdentity,
    b: IAutoMovieReferenceIdentity,
  ): boolean =>
    a.size === b.size &&
    a.modified === b.modified &&
    (windows || a.changed === b.changed);
  const sameBoundary: (a: IAutoMovieReferenceIdentity, b: IAutoMovieReferenceIdentity) => boolean = (
    a: IAutoMovieReferenceIdentity,
    b: IAutoMovieReferenceIdentity,
  ): boolean =>
    windows
      ? a.kind === b.kind && a.inode === b.inode && sameVersion(a, b)
      : sameFile(a, b);
  return {
    read: async (file: string) : Promise<Uint8Array> => {
      admitReferencePath(file);
      try {
        const chain: typeof pinned = await inspectDirectories(
          file.slice(0, file.lastIndexOf("/")),
        );
        const location: string = path.join(root, ...file.split("/"));
        const before: IAutoMovieReferenceIdentity = await io.lstat(location);
        physicalFile(before);
        if (path.relative(location, await io.realpath(location)) !== "")
          fail(
            "PATH_IDENTITY_CHANGED",
            "The file does not resolve to its declared identity.",
          );
        const handle: Awaited<ReturnType<IAutoMovieReferenceFileSystem["open"]>> = await io.open(location);
        try {
          const opened: IAutoMovieReferenceIdentity = await handle.stat();
          physicalFile(opened);
          if (!sameBoundary(before, opened))
            fail(
              "PATH_IDENTITY_CHANGED",
              "The source changed before its handle was opened.",
            );
          await recheck(chain);
          const bytes: Uint8Array = await handle.read(Number(opened.size));
          if (bytes.byteLength > MAX_SOURCE_BYTES)
            fail("RESOURCE_LIMIT", "Source exceeds the 8 MiB file limit.");
          const after: IAutoMovieReferenceIdentity = await handle.stat();
          const resident: IAutoMovieReferenceIdentity = await io.lstat(location);
          physicalFile(after);
          physicalFile(resident);
          if (
            !sameNode(opened, after) ||
            !sameVersion(opened, after) ||
            !sameNode(before, resident) ||
            !sameVersion(before, resident) ||
            !sameBoundary(after, resident) ||
            BigInt(bytes.byteLength) !== after.size ||
            path.relative(location, await io.realpath(location)) !== ""
          )
            fail(
              "PATH_IDENTITY_CHANGED",
              "The source changed during its read; fetch a fresh reference.",
            );
          if (windows) {
            const corroborating: Awaited<ReturnType<IAutoMovieReferenceFileSystem["open"]>> = await io.open(location);
            try {
              const current: IAutoMovieReferenceIdentity = await corroborating.stat();
              physicalFile(current);
              const final: IAutoMovieReferenceIdentity = await io.lstat(location);
              physicalFile(final);
              if (
                !sameNode(after, current) ||
                !sameVersion(after, current) ||
                !sameNode(before, final) ||
                !sameVersion(before, final) ||
                !sameBoundary(current, final) ||
                path.relative(location, await io.realpath(location)) !== ""
              )
                fail(
                  "PATH_IDENTITY_CHANGED",
                  "The resident handle no longer identifies the read source.",
                );
            } finally {
              await corroborating.close();
            }
          }
          await recheck(chain);
          return bytes;
        } finally {
          await handle.close();
        }
      } catch (error) {
        return resolveReferenceIoFailure(error);
      }
    },
    list: async (layer: AutoMovieAuthoredDocumentLayer) : Promise<readonly string[]> => {
      admitReferencePath(`docs/${layer}/index.md`);
      const files: string[] = [];
      const walk: (relative: string, depth: number) => Promise<void> = async (relative: string, depth: number): Promise<void> => {
        if (depth > 32)
          fail("RESOURCE_LIMIT", "Layer exceeds the 32-level directory limit.");
        const chain: typeof pinned = await inspectDirectories(relative);
        const location: string = path.join(root, ...relative.split("/"));
        for (const name of await io.list(location)) {
          if (name.startsWith(".")) continue;
          if (!validComponent(name))
            fail(
              "INVALID_PATH",
              "Layer contains a noncanonical file or directory name.",
            );
          const file: string = `${relative}/${name}`;
          const entry: IAutoMovieReferenceIdentity = await io.lstat(path.join(location, name));
          if (entry.kind === "directory") await walk(file, depth + 1);
          else {
            admitReferenceInventoryIdentity(entry);
            if (name.endsWith(".md")) {
              appendReferenceInventoryFile(files, file);
            }
          }
        }
        await recheck(chain);
      };
      try {
        // Only absence of the requested population root means an empty layer.
        const initial: typeof pinned | null = await observeInitialReferenceLayer(
          (): Promise<typeof pinned> => inspectDirectories(`docs/${layer}`),
          (): Promise<void> => recheck(pinned),
        );
        if (initial === null) return [];
        await walk(`docs/${layer}`, 0);
        return files;
      } catch (error) {
        return resolveReferenceIoFailure(error);
      }
    },
  };
}
