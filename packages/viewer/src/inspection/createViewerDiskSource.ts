import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Own the byte and membership witness of a host's declared disk inputs. Source, emitted modules and data remain separate files in the receipt; changing a source file does not certify that its emitted module was rebuilt. The application supplies its actual input roots and explicit files. Missing roots are recorded, so creation of a previously absent output changes the revision. Symlinks are followed with real-directory cycle protection.
 *
 * Refresh reads current bytes before publishing a revision. Files outside the supplied scope, including browser-transformed responses, are not certified by this witness. Callers must still check the revision after candidate load.
 *
 * @evidence contracts/common.md#principled-implementation Refreshes actual declared file bytes and missing membership into a sorted SHA-256 receipt, following symlink directories with real-path cycle protection.
 * @evidence contracts/common.md#clear-and-simple-design The existing disk owner separates current revision/input/error state from application-supplied source, emitted and data scopes; it creates no new watcher service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Changing source does not certify rebuilt output or browser response bytes, outside-scope files are unclaimed and a null-prototype input map preserves arbitrary relative filename keys.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies declared scope, missing outputs, current-byte refresh and source-versus-emitted limitations before candidate load.
 * @evidence contracts/performance.md#efficient-algorithms Refresh walks declared membership, sorts F paths and reads/hashes total B bytes, costing O(F log F+B) plus filesystem traversal with O(F) witnesses and one full file buffer at a time.
 * @evidence contracts/performance.md#reuse-equivalent-work Identical sorted byte/membership receipts keep the revision but every refresh reads actual bytes; no mtime/size shortcut certifies unchanged content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner retains only its latest input-digest/error receipt and declared paths; walk sets and byte buffers leave each refresh, file count/individual bytes are uncapped and synchronous reads leave no open handles.
 */
export function createViewerDiskSource(props: {
  /** Checkout root used to name retained source receipts. */
  root: string;
  /** Input trees, including ordinary compiler output when actually consumed. */
  directories: readonly string[];
  /** Configuration, HTML or other inputs outside those trees. */
  files: readonly string[] | (() => readonly string[]);
}): {
  current: () => {
    revision: string;
    inputs: Record<string, string>;
    error?: string;
  };
  refresh: () => boolean;
  watched: string[];
} {
  const roots: string[] = props.directories.map((file: string): string =>
    path.resolve(file),
  );
  const explicit: () => string[] = (): string[] =>
    (typeof props.files === "function" ? props.files() : props.files).map(
      (file: string): string => path.resolve(file),
    );
  let current:
    | { revision: string; inputs: Record<string, string>; error?: string }
    | undefined;
  const refresh: () => boolean = (): boolean => {
    try {
      const files: Set<string> = new Set(explicit());
      const visited: Set<string> = new Set();
      const missing: Set<string> = new Set();
      const walk: (directory: string) => void = (directory: string): void => {
        if (!fs.existsSync(directory)) {
          missing.add(directory);
          return;
        }
        const real: string = fs.realpathSync(directory);
        if (visited.has(real)) return;
        visited.add(real);
        for (const entry of fs.readdirSync(directory, {
          withFileTypes: true,
        })) {
          const file: string = path.join(directory, entry.name);
          const stat: fs.Dirent | fs.Stats = entry.isSymbolicLink()
            ? fs.statSync(file)
            : entry;
          if (stat.isDirectory()) walk(file);
          else if (stat.isFile()) files.add(file);
        }
      };
      roots.forEach(walk);
      const inputs: Record<string, string> = Object.create(null) as Record<
        string,
        string
      >;
      for (const file of [...files, ...missing].sort(
        (left: string, right: string): number =>
          left < right ? -1 : left > right ? 1 : 0,
      )) {
        const name: string = path
          .relative(props.root, file)
          .replaceAll("\\", "/");
        inputs[name] =
          fs.existsSync(file) && fs.statSync(file).isFile()
            ? createHash("sha256").update(fs.readFileSync(file)).digest("hex")
            : "missing";
      }
      const revision: string = createHash("sha256")
        .update(JSON.stringify(inputs))
        .digest("hex");
      const changed: boolean =
        current === undefined ||
        current.revision !== revision ||
        current.error !== undefined;
      current = { revision, inputs };
      return changed;
    } catch (cause) {
      const error: string =
        cause instanceof Error ? cause.message : String(cause);
      const changed: boolean = current === undefined || current.error !== error;
      current = {
        revision: current?.revision ?? "",
        inputs: current?.inputs ?? {},
        error,
      };
      return changed;
    }
  };
  refresh();
  return {
    /** Current declared disk receipt; an error refuses a new candidate. */
    current: (): {
      revision: string;
      inputs: Record<string, string>;
      error?: string;
    } => current!,
    /** Refresh current membership and bytes; true requests a source notification. */
    refresh,
    /** Exact watcher roots and explicit paths owned by this source witness. */
    watched: [...roots, ...explicit()],
  };
}
