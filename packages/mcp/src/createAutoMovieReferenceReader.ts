import type { AutoMovieAuthoredDocumentLayer } from "@automovie/evidence";
import * as path from "node:path";

import {
  MAX_SOURCE_BYTES,
  fail,
} from "./internal/referenceError";
import { admitReferencePath, validComponent } from "./internal/referencePath";
import type { IAutoMovieReferenceReader } from "./structures/IAutoMovieReference";
import { createAutoMovieReferenceFileSystem } from "./createAutoMovieReferenceFileSystem";
import type { IAutoMovieReferenceFileSystem } from "./structures/IAutoMovieReferenceFileSystem";
import type { IAutoMovieReferenceIdentity } from "./structures/IAutoMovieReferenceIdentity";
import { admitReferenceInventoryIdentity } from "./internal/admitReferenceInventoryIdentity";
import { appendReferenceInventoryFile } from "./internal/appendReferenceInventoryFile";
import { observeInitialReferenceLayer } from "./internal/observeInitialReferenceLayer";
import { resolveReferenceIoFailure } from "./internal/resolveReferenceIoFailure";

const sameNode = (
  a: IAutoMovieReferenceIdentity,
  b: IAutoMovieReferenceIdentity,
): boolean => a.kind === b.kind && a.device === b.device && a.inode === b.inode;
const sameFile = (
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
 * The namespace is checked before opening, before consuming bytes, and after the
 * bounded handle read. A replacement or concurrent write invalidates the result.
 * Windows observations compare pathname identities separately from descriptor
 * identities; a second resident handle corroborates the latter. Own-open ctime
 * drift is tolerated only inside that read, without ignoring identity or mtime.
 * Node's pathname APIs expose observations, not a kernel-level namespace lock;
 * hostile actors with unrestricted concurrent namespace control remain an OS
 * observation boundary rather than something pure unit tests can certify.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-isolation Binds one physical production root and refuses aliases, links and substitutions before returning source bytes.
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-bounds Distinguishes an absent layer from file, permission, identity and resource failures.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-isolation Compares ancestor realpaths, lstat identities and bounded read-handle metadata around each read.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-bounds Enforces the file, inventory and directory-depth limits without creating source or cache files.
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
  const rootIdentity = await io.lstat(root).catch(resolveReferenceIoFailure);
  if (
    rootIdentity.kind !== "directory" ||
    path.relative(root, await io.realpath(root).catch(resolveReferenceIoFailure)) !== ""
  )
    fail(
      "PATH_IDENTITY_CHANGED",
      "The production root must be its physical directory identity.",
    );
  const rootPath = path.parse(root).root;
  const rootSegments = path
    .relative(rootPath, root)
    .split(path.sep)
    .filter((part) => part.length > 0);
  const pinned: { location: string; identity: IAutoMovieReferenceIdentity }[] =
    [];
  let ancestor = rootPath;
  for (const segment of ["", ...rootSegments]) {
    ancestor = path.join(ancestor, segment);
    const entry = await io.lstat(ancestor).catch(resolveReferenceIoFailure);
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
  const inspectDirectories = async (
    relative: string,
  ): Promise<typeof pinned> => {
    const chain = [...pinned];
    for (const item of pinned) {
      const current = await io.lstat(item.location);
      if (
        !sameNode(item.identity, current) ||
        path.relative(item.location, await io.realpath(item.location)) !== ""
      )
        fail(
          "PATH_IDENTITY_CHANGED",
          "The bound root ancestry changed; restart after inspecting it.",
        );
    }
    let location = root;
    for (const component of relative
      .split("/")
      .filter((part) => part.length > 0)) {
      location = path.join(location, component);
      const entry = await io.lstat(location);
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
  const recheck = async (chain: typeof pinned): Promise<void> => {
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
  const physicalFile = (entry: IAutoMovieReferenceIdentity): void => {
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
  const windows = io.platform === "win32";
  const sameVersion = (
    a: IAutoMovieReferenceIdentity,
    b: IAutoMovieReferenceIdentity,
  ): boolean =>
    a.size === b.size &&
    a.modified === b.modified &&
    (windows || a.changed === b.changed);
  const sameBoundary = (
    a: IAutoMovieReferenceIdentity,
    b: IAutoMovieReferenceIdentity,
  ): boolean =>
    windows
      ? a.kind === b.kind && a.inode === b.inode && sameVersion(a, b)
      : sameFile(a, b);
  return {
    read: async (file) => {
      admitReferencePath(file);
      try {
        const chain = await inspectDirectories(
          file.slice(0, file.lastIndexOf("/")),
        );
        const location = path.join(root, ...file.split("/"));
        const before = await io.lstat(location);
        physicalFile(before);
        if (path.relative(location, await io.realpath(location)) !== "")
          fail(
            "PATH_IDENTITY_CHANGED",
            "The file does not resolve to its declared identity.",
          );
        const handle = await io.open(location);
        try {
          const opened = await handle.stat();
          physicalFile(opened);
          if (!sameBoundary(before, opened))
            fail(
              "PATH_IDENTITY_CHANGED",
              "The source changed before its handle was opened.",
            );
          await recheck(chain);
          const bytes = await handle.read(Number(opened.size));
          if (bytes.byteLength > MAX_SOURCE_BYTES)
            fail("RESOURCE_LIMIT", "Source exceeds the 8 MiB file limit.");
          const after = await handle.stat();
          const resident = await io.lstat(location);
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
            const corroborating = await io.open(location);
            try {
              const current = await corroborating.stat();
              physicalFile(current);
              const final = await io.lstat(location);
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
    list: async (layer: AutoMovieAuthoredDocumentLayer) => {
      admitReferencePath(`docs/${layer}/index.md`);
      const files: string[] = [];
      const walk = async (relative: string, depth: number): Promise<void> => {
        if (depth > 32)
          fail("RESOURCE_LIMIT", "Layer exceeds the 32-level directory limit.");
        const chain = await inspectDirectories(relative);
        const location = path.join(root, ...relative.split("/"));
        for (const name of await io.list(location)) {
          if (name.startsWith(".")) continue;
          if (!validComponent(name))
            fail(
              "INVALID_PATH",
              "Layer contains a noncanonical file or directory name.",
            );
          const file = `${relative}/${name}`;
          const entry = await io.lstat(path.join(location, name));
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
        const initial = await observeInitialReferenceLayer(
          () => inspectDirectories(`docs/${layer}`),
          () => recheck(pinned),
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
