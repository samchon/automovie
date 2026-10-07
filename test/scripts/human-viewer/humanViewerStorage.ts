import fs from "node:fs";
import path from "node:path";

/**
 * Resolve the resident viewer's mutable directory from HUMAN_VIEWER_STORAGE_ROOT.
 * Unset or empty keeps .shots/human-viewer; a relative override is relative to
 * the repository root, not the client's working directory. Records, inputs,
 * caches, compiles, logs and captures share this directory. Reference photographs
 * keep their separate, read-only default directory.
 *
 * Repository output belongs in the ignored .shots or .wiki trees. Existing
 * ancestors are resolved through the file system before that check, so a Windows
 * junction cannot redirect an apparently ignored path into maintained source or
 * outside the repository. An explicitly selected external directory is allowed
 * when its resolved path also remains outside the repository. No directory is
 * created by resolution, so status and failed configuration stay read-only.
 *
 * @evidence contracts/common.md#principled-implementation Resolves real ancestors before enforcing the ignored-tree boundary and shares one result across the viewer's writers and control readers.
 * @evidence contracts/common.md#clear-and-simple-design One path selection owns the environment override and default for every process.
 * @evidence contracts/common.md#meaningful-documentation States the default, relative-path base, reference separation and refusal boundary.
 * @author Samchon
 */
export function humanViewerStorage(
  root: string,
  value: string | undefined,
): string {
  const within = (directory: string, file: string): boolean => {
    const relative = path.relative(directory, file);
    return (
      relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative))
    );
  };
  const real = (requested: string): string => {
    let existing = requested;
    const missing: string[] = [];
    while (!fs.existsSync(existing)) {
      missing.unshift(path.basename(existing));
      const parent = path.dirname(existing);
      if (parent === existing)
        throw new Error(
          "Viewer storage has no existing filesystem ancestor: " + requested,
        );
      existing = parent;
    }
    if (!fs.statSync(existing).isDirectory())
      throw new Error("Viewer storage requires a directory: " + existing);
    return path.join(fs.realpathSync(existing), ...missing);
  };
  const repository = path.resolve(root);
  const requested = path.resolve(
    repository,
    value === undefined || value === "" ? ".shots/human-viewer" : value,
  );
  const resolvedRoot = real(repository);
  const storage = real(requested);
  const requestedInside = within(repository, requested);
  const resolvedInside = within(resolvedRoot, storage);
  if (requestedInside !== resolvedInside)
    throw new Error(
      "Viewer storage crosses the repository boundary through a filesystem link: " +
        requested,
    );
  if (
    resolvedInside &&
    ![".shots", ".wiki"].some((name) =>
      within(path.join(resolvedRoot, name), storage),
    )
  )
    throw new Error(
      "Repository viewer storage belongs under the ignored .shots or .wiki tree: " +
        storage,
    );
  return storage;
}
