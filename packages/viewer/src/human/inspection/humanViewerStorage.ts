import fs from "node:fs";
import path from "node:path";

/**
 * Resolve the resident viewer's mutable directory from HUMAN_VIEWER_STORAGE_ROOT. Unset or empty keeps .shots/human-viewer; a relative override is relative to the repository root, not the client's working directory. Records, inputs, caches, compiles, logs and captures share this directory. Reference photographs keep their separate, read-only default directory.
 *
 * Repository output belongs in the ignored .shots or .wiki trees. Existing ancestors are resolved through the file system before that check, so a Windows junction cannot redirect an apparently ignored path into maintained source or outside the repository. An explicitly selected external directory is allowed when its resolved path also remains outside the repository. No directory is created by resolution, so status and failed configuration stay read-only.
 *
 * @evidence contracts/common.md#principled-implementation Requested root-relative storage resolves existing physical ancestors before repository/ignored-tree containment checks, permitting explicitly external directories only when they remain external.
 * @evidence contracts/common.md#clear-and-simple-design A component-aware containment helper and ancestor resolver separate lexical request policy from physical filesystem location.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Junctions cannot redirect a lexically ignored or external path across repository ownership boundaries, and a file ancestor is refused rather than treated as a directory.
 * @evidence contracts/common.md#meaningful-documentation The comment defines default/relative paths, shared mutable storage, separate reference ownership, physical link checks and read-only resolution.
 * @evidence contracts/performance.md#efficient-algorithms Resolution walks missing path ancestors and checks fixed ignored roots; front-inserting missing names can cost quadratic work in missing depth, which is path depth rather than a source-tree traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Filesystem ownership must reflect this request's current ancestors, so no previous physical-root resolution is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary missing components and path strings remain invocation-local, filesystem calls are synchronous and no directory or descriptor is created or retained.
 *
 * @author Samchon
 */
export function humanViewerStorage(
  root: string,
  value: string | undefined,
): string {
  const within: (directory: string, file: string) => boolean = (
    directory: string,
    file: string,
  ): boolean => {
    const relative: string = path.relative(directory, file);
    return (
      relative === "" ||
      (relative !== ".." &&
        !relative.startsWith(".." + path.sep) &&
        !path.isAbsolute(relative))
    );
  };
  const real: (requested: string) => string = (requested: string): string => {
    let existing: string = requested;
    const missing: string[] = [];
    while (!fs.existsSync(existing)) {
      missing.unshift(path.basename(existing));
      const parent: string = path.dirname(existing);
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
  const repository: string = path.resolve(root);
  const requested: string = path.resolve(
    repository,
    value === undefined || value === "" ? ".shots/human-viewer" : value,
  );
  const resolvedRoot: string = real(repository);
  const storage: string = real(requested);
  const requestedInside: boolean = within(repository, requested);
  const resolvedInside: boolean = within(resolvedRoot, storage);
  if (requestedInside !== resolvedInside)
    throw new Error(
      "Viewer storage crosses the repository boundary through a filesystem link: " +
        requested,
    );
  if (
    resolvedInside &&
    ![".shots", ".wiki"].some((name: string): boolean =>
      within(path.join(resolvedRoot, name), storage),
    )
  )
    throw new Error(
      "Repository viewer storage belongs under the ignored .shots or .wiki tree: " +
        storage,
    );
  return storage;
}
