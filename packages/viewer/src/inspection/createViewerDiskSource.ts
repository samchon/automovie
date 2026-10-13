import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Own the byte and membership witness of a host's declared disk inputs.
 * Source, emitted modules and data remain separate files in the receipt;
 * changing a source file does not certify that its emitted module was rebuilt.
 * The application supplies its actual input roots and explicit files. Missing
 * roots are recorded, so creation of a previously absent output changes the
 * revision. Symlinks are followed with real-directory cycle protection.
 *
 * Refresh reads current bytes before publishing a revision. Files outside the
 * supplied scope, including browser-transformed responses, are not certified
 * by this witness. Callers must still check the revision after candidate load.
 *
 * @evidence contracts/common.md#principled-implementation Ordered path-to-byte digests and missing-root entries identify the declared disk inputs; failed reads retain the previous receipt with a refusal instead of publishing partial membership. Sequential reads do not claim an atomic filesystem snapshot.
 * @evidence contracts/common.md#clear-and-simple-design One refresh owns traversal, hashing and revision changes, while the application supplies maintained membership, publication admission and watcher scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Standard Node filesystem reads and SHA-256 cover caller-declared inputs; real-directory cycle detection limits repeated traversal without substituting cache results or treating source edits as rebuilt modules.
 * @evidence contracts/common.md#meaningful-documentation Names input ownership, missing roots, symlink traversal, source/output separation and the caller's post-load revision check.
 */
export function createViewerDiskSource(props: {
  /** Checkout root used to name retained source receipts. */
  root: string;
  /** Input trees, including ordinary compiler output when actually consumed. */
  directories: readonly string[];
  /** Configuration, HTML or other inputs outside those trees. */
  files: readonly string[] | (() => readonly string[]);
}) {
  const roots = props.directories.map((file) => path.resolve(file));
  const explicit = (): string[] => (typeof props.files === "function" ? props.files() : props.files)
    .map((file) => path.resolve(file));
  let current: { revision: string; inputs: Record<string, string>; error?: string };
  const refresh = (): boolean => {
    try {
      const files = new Set(explicit());
      const visited = new Set<string>();
      const missing = new Set<string>();
      const walk = (directory: string): void => {
        if (!fs.existsSync(directory)) { missing.add(directory); return; }
        const real = fs.realpathSync(directory);
        if (visited.has(real)) return;
        visited.add(real);
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const file = path.join(directory, entry.name);
          const stat = entry.isSymbolicLink() ? fs.statSync(file) : entry;
          if (stat.isDirectory()) walk(file);
          else if (stat.isFile()) files.add(file);
        }
      };
      roots.forEach(walk);
      const inputs: Record<string, string> = {};
      for (const file of [...files, ...missing].sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) {
        const name = path.relative(props.root, file).replaceAll("\\", "/");
        inputs[name] = fs.existsSync(file) && fs.statSync(file).isFile()
          ? createHash("sha256").update(fs.readFileSync(file)).digest("hex")
          : "missing";
      }
      const revision = createHash("sha256").update(JSON.stringify(inputs)).digest("hex");
      const changed = current === undefined || current.revision !== revision || current.error !== undefined;
      current = { revision, inputs };
      return changed;
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : String(cause);
      const changed = current === undefined || current.error !== error;
      current = { revision: current?.revision ?? "", inputs: current?.inputs ?? {}, error };
      return changed;
    }
  };
  refresh();
  return {
    /** Current declared disk receipt; an error refuses a new candidate. */
    current: () => current,
    /** Refresh current membership and bytes; true requests a source notification. */
    refresh,
    /** Exact watcher roots and explicit paths owned by this source witness. */
    watched: [...roots, ...explicit()],
  };
}
