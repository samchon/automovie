import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/** Hash conservative on-disk source inventories used by the image session.
 * These observations do not certify which modules the running host loaded or prevent concurrent edits.
 *
 * @evidence contracts/common.md#principled-implementation SHA-256 commits to explicitly listed host files or sorted package-source paths and bytes; filesystem errors reject rather than inventing an identity.
 * @evidence contracts/common.md#clear-and-simple-design Host policy and broader source invalidation have separate entry points sharing one explicit runtime inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither timestamps nor watcher silence replace byte hashing; the inventory is conservative and is not proof of the loaded import graph or an atomic filesystem snapshot.
 * @evidence contracts/common.md#meaningful-documentation States on-disk scope and the limits of loaded-code and concurrent-edit verification.
 * @evidence contracts/performance.md#efficient-algorithms Each call reads its full selected byte population; source additionally enumerates and sorts paths, without parsing modules or generating geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Calls deliberately reobserve bytes instead of caching by timestamps; the session compares returned commitments to decide reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each call owns local hash/path buffers and async file reads only; no watcher, open handle or persistent identity cache is retained here.
 */
export class HumanImageSourceIdentity {
  /** Hash the listed host/worker files and dependency configuration as currently stored.
   *
   * @evidence contracts/common.md#principled-implementation An explicit ordered inventory feeds file bytes into Node SHA-256; missing files or read failures reject.
   * @evidence contracts/common.md#clear-and-simple-design Host-change admission uses one policy inventory rather than discovering speculative imports.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The digest observes disk bytes only and cannot assert that the running host loaded those same bytes or that all reads were simultaneous.
   * @evidence contracts/common.md#meaningful-documentation Documents fixed inventory and on-disk observation instead of claiming loaded-module attestation.
   * @evidence contracts/performance.md#efficient-algorithms Work is linear in the listed files' combined bytes, with one read buffer at a time and no package traversal.
   * @evidence contracts/performance.md#reuse-equivalent-work Every call rehashes current bytes; comparison and host invalidation belong to HumanImageSession.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Local hash state is finalized and temporary buffers become collectible after reads; async file calls retain no application-level open handles.
   */
  public static async host(root: string): Promise<string> {
    const digest: ReturnType<typeof createHash> = createHash("sha256");
    for (const name of [
      "pnpm-lock.yaml",
      "packages/playground/vite.config.ts",
      "packages/playground/scripts/playgroundViteConfig.ts",
      ...HumanImageSourceIdentity.runtime(),
      "packages/playground/src/human-images/HumanImageArchive.ts",
      "packages/playground/src/human-images/HumanImageRegistry.ts",
      "packages/playground/src/human-images/createHumanImagePlugin.ts",
      "packages/playground/src/human-images/HumanImageParameterRequest.ts",
    ])
      digest.update(await HumanImageSourceIdentity.hostFile(root, name));
    return digest.digest("hex");
  }

  /** Hash sorted .ts/.json paths and bytes across five package src trees, the Human page modules and runtime files.
   * The inventory includes unused files and absolute paths, so relocation or unrelated source edits invalidate it.
   *
   * @evidence contracts/common.md#principled-implementation Recursive regular-file enumeration and deterministic lexical sorting feed path strings and exact bytes to SHA-256, with read errors propagated.
   * @evidence contracts/common.md#clear-and-simple-design One conservative inventory gives parent and child the same session invalidation policy without another module loader.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This broader-than-consumed inventory is not an import-closure certificate, a dependency-runtime digest or an atomic filesystem snapshot.
   * @evidence contracts/common.md#meaningful-documentation Names extensions, package scope, absolute-path sensitivity and conservative invalidation.
   * @evidence contracts/performance.md#efficient-algorithms For E directory entries, F selected files and B selected bytes, enumeration/hash work is O(E+B), sorting O(F log F), and memory holds selected paths, traversal depth and up to 64 file buffers from the current read window.
   * @evidence contracts/performance.md#reuse-equivalent-work Full rehashing detects byte edits without relying on mtime; completed model/frame reuse is decided separately by the session.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Path arrays, traversal frames and hash state are local to the call; no source snapshot, watcher or persistent cache survives return.
   */
  public static async source(root: string): Promise<string> {
    const digest: ReturnType<typeof createHash> = createHash("sha256");
    const names: string[] = [];
    // Sibling directories are listed concurrently; order is restored by the sort below.
    const visit: (directory: string) => Promise<void> = async (
      directory: string,
    ): Promise<void> => {
      const nested: Promise<void>[] = [];
      for (const entry of await fs.readdir(directory, {
        withFileTypes: true,
      })) {
        const name: string = path.join(directory, entry.name);
        if (entry.isDirectory() && !/^(?:node_modules|fixtures?|scratch)$/i.test(entry.name)) nested.push(visit(name));
        else if (entry.isFile() && /\.(?:ts|json)$/.test(entry.name))
          names.push(name);
      }
      await Promise.all(nested);
    };
    await Promise.all([
      ...["human", "viewer", "engine", "interface", "recovery"].map(
        (pack: string): Promise<void> =>
          visit(path.join(root, "packages", pack, "src")),
      ),

      // The worker renders through the Human page, so its modules join the key.
      ...["human", "human-parameters"].map(
        (directory: string): Promise<void> =>
          visit(path.join(root, "packages/playground/src", directory)),
      ),
    ]);
    for (const name of [
      "packages/playground/human.html",
      "packages/playground/src/human-view.ts",
      "pnpm-lock.yaml",
      "packages/playground/vite.config.ts",
      ...HumanImageSourceIdentity.runtime(),
    ])
      names.push(path.join(root, name));
    names.sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));

    // Sequential awaits cost about 2.5 s for ~3,000 files on Windows, so reads
    // run in windows of 64 while the digest still consumes them in sorted order.
    for (let start: number = 0; start < names.length; start += 64) {
      const window: string[] = names.slice(start, start + 64);
      const contents: Buffer[] = await Promise.all(
        window.map((name: string): Promise<Buffer> => fs.readFile(name)),
      );
      window.forEach((name: string, index: number): void => {
        digest.update(name);
        digest.update(contents[index]!);
      });
    }
    return digest.digest("hex");
  }

  /** Read one fixed host dependency within the checkout, bounded to 16 MiB.
   * Real paths reject escaped links; a handle stat bounds the allocation and a
   * second stat rejects size changes during the read. The handle always closes.
   *
   * @evidence contracts/common.md#principled-implementation Resolves the fixed dependency inside the checkout, stats its handle, then reads exactly the observed regular-file size and rejects changes.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the host inventory's bounded read in its existing identity owner, independently of retired diagnostic protocols.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects escaped paths, oversized files and incomplete reads; this does not make concurrent same-size writes atomic.
   * @evidence contracts/common.md#meaningful-documentation States the 16 MiB allocation ceiling, path boundary and handle lifetime.
   * @evidence contracts/performance.md#efficient-algorithms Reads B observed bytes in O(B) work with one allocation of B bytes, at most 16 MiB.
   * @evidence contracts/performance.md#reuse-equivalent-work Each host observation reads current bytes rather than trusting an mtime cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned buffer belongs to the hash caller; finally closes the sole file handle on every path.
   */
  private static async hostFile(root: string, name: string): Promise<Buffer> {
    const base: string = await fs.realpath(root);
    const filename: string = await fs.realpath(path.join(root, name));
    const relative: string = path.relative(base, filename);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      throw new Error("Human host dependency escapes the checkout");
    const handle: Awaited<ReturnType<typeof fs.open>> = await fs.open(filename, "r");
    try {
      const before: Awaited<ReturnType<typeof handle.stat>> = await handle.stat();
      if (!before.isFile() || before.size > 16 * 1024 * 1024)
        throw new Error("Human host dependency is not a bounded regular file");
      const bytes: Buffer = Buffer.alloc(before.size);
      let offset: number = 0;
      while (offset < bytes.length) {
        const read: Awaited<ReturnType<typeof handle.read>> = await handle.read(bytes, offset, bytes.length - offset, offset);
        if (read.bytesRead === 0) throw new Error("Human host dependency ended during its read");
        offset += read.bytesRead;
      }
      if ((await handle.stat()).size !== before.size)
        throw new Error("Human host dependency changed during its read");
      return bytes;
    } finally {
      await handle.close();
    }
  }

  /** Fixed worker/HTTP implementation inventory, with no specimen discovery. */
  private static runtime(): string[] {
    return [
      "HumanImageSession.ts",
      "HumanImageSourceIdentity.ts",
      "HumanImageProcess.ts",
      "humanImageProcessEntry.ts",
    ].map(
      (name: string): string => "packages/playground/src/human-images/" + name,
    );
  }
}
