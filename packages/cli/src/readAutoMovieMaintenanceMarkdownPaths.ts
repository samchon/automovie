import {
  type IScaffoldPhysicalDirectory,
  assertScaffoldPhysicalDirectory,
  captureScaffoldPhysicalDirectory,
} from "@automovie/template";
import * as fs from "node:fs";
import path from "node:path";

/**
 *
 * Directory-only observations used to enumerate a closed maintenance input.
 *
 * Production binds `@automovie/template`'s directory capture and assertion and
 * a `readdirSync` listing; the only other implementations are the CLI tests'
 * fakes. Nothing here reads file content.
 *
 * @evidence contracts/common.md#principled-implementation Three operations, capture, revalidate and list names with kinds, are enough to walk a tree without reading content or following a link.
 * @evidence contracts/common.md#clear-and-simple-design Kept apart from `IAutoMovieMaintenanceObservationIO` because enumeration needs a listing and no file read, while observation needs reads and no listing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Production always binds the fixed defaults; the seam exists so tests can inject a changed or invalid listing, and it alters no production path.
 * @evidence contracts/common.md#meaningful-documentation States the default binding, the test-only alternatives, and that the port never reads content.
 * @evidence contracts/performance.md#cost-and-resources The port fixes call shapes for the walker; each member states its per-call cost. The port caches nothing; the walker decides how often each directory is captured and asserted. Capture and assert open and close one directory descriptor inside the call, and the listing returns a complete array, so no handle stays open between calls.
 * @author Samchon
 */
export interface IAutoMovieMaintenanceDirectoryIO {
  /**
   *
   * Capture one ordinary directory and its physical identity. A missing one
   * throws an `ENOENT` error, which the walker reads as an empty subtree; a
   * link or non-directory throws any other error.
   *
   * @evidence contracts/common.md#principled-implementation The default capture refuses a link or non-directory by `lstat` and pairs descriptor `fstat` identity with `realpathSync.native`, which the walker compares against the root's real path.
   * @evidence contracts/common.md#clear-and-simple-design The walker captures each visited directory once, at entry, and revalidates it through `assert` afterwards.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Throws rather than following a link; reading `ENOENT` as an empty subtree, such as a delivery layer not yet created, is the walker's decision.
   * @evidence contracts/common.md#meaningful-documentation States what is captured and how a missing directory and a link are each reported.
   * @evidence contracts/performance.md#cost-and-resources A constant number of native calls per visited directory. Captures are not kept across walks, because `toc`'s second walk exists to see a changed tree. The default opens the directory read-only only long enough to `fstat` it and closes it in `finally`.
   */
  capture: (target: string) => IScaffoldPhysicalDirectory;

  /**
   *
   * Refuse a changed captured directory. The walker calls it on the root when
   * entering a directory, on the root and the current directory before every
   * entry, and on both at each directory's exit.
   *
   * @evidence contracts/common.md#principled-implementation The default re-captures the directory and compares identity and real path, so a swap during the walk is detected at the next entry.
   * @evidence contracts/common.md#clear-and-simple-design Separate from capture so the walker states where the root and current directory must still hold.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Never re-adopts a changed generation; a change refuses the whole enumeration.
   * @evidence contracts/common.md#meaningful-documentation States when the walker invokes it and what a change means.
   * @evidence contracts/performance.md#cost-and-resources Each call is one full capture; the walker makes two per listed entry and three per visited directory, so these calls dominate a walk's native call count while staying linear in entries. Every call must re-observe, since detecting change since capture is its purpose. Opens and closes one directory descriptor within each call and retains nothing.
   */
  assert: (directory: IScaffoldPhysicalDirectory) => void;

  /**
   *
   * Enumerate only entry names and kinds, in the order the platform returns;
   * text is read through the snapshot reader. `link` covers a symbolic link or
   * Windows junction, and `other` covers sockets, FIFOs and devices, which the
   * walker skips.
   *
   * @evidence contracts/common.md#principled-implementation The default `readdirSync(directory, { withFileTypes: true })` tests `isSymbolicLink` first, so a link to a directory is never classified as a directory.
   * @evidence contracts/common.md#clear-and-simple-design Returns names and kinds only; reading content belongs to the observation port.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Classifies every entry without exception; the walker, not the listing, decides that `other` entries and non-Markdown files are skipped silently.
   * @evidence contracts/common.md#meaningful-documentation States the unordered result, each kind's meaning, and that `other` is skipped.
   * @evidence contracts/performance.md#cost-and-resources One directory read per visited directory, linear in its entry count. Each visited directory is listed once per walk, and the walker sorts that one listing. `readdirSync` opens and closes the directory within the call and returns a complete array sized by the entry count, with no cap.
   */
  list: (directory: string) => readonly {
    name: string;
    kind: "directory" | "file" | "link" | "other";
  }[];
}

const directoryIO: IAutoMovieMaintenanceDirectoryIO = {
  capture: captureScaffoldPhysicalDirectory,
  assert: assertScaffoldPhysicalDirectory,
  list: (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      kind: entry.isSymbolicLink()
        ? "link"
        : entry.isDirectory()
          ? "directory"
          : entry.isFile()
            ? "file"
            : "other",
    })),
};

/**
 *
 * Enumerate Markdown paths without following linked or replaced ancestors.
 *
 * `relative` names one directory below the root; the root itself or a path
 * escaping it throws, and a missing directory yields no paths. Returns
 * `/`-separated root-relative paths of files ending in `.md` (case-sensitive),
 * depth first with entries sorted by code unit in each directory. A link
 * anywhere, a directory whose real path leaves the root, or an entry name
 * containing a separator or NUL throws.
 *
 * @evidence contracts/common.md#principled-implementation Depth-first recursion with a code-unit sort per directory, so the same tree always yields the same list; every visited directory must have its lexical path equal to its native real path and lie within the root's real path, and the root and current directory are revalidated before every entry.
 * @evidence contracts/common.md#clear-and-simple-design One walker parameterized by a start directory, with the delivery wrapper supplying the fixed layers; its inline comparator restates the `compareCodeUnits` that the sibling observation module imports from `@automovie/engine`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses links instead of following them; non-Markdown files and `other` entries are skipped silently, and a missing start directory is an empty result rather than an error.
 * @evidence contracts/common.md#meaningful-documentation States the accepted start directory, the output spelling and order, the case-sensitive suffix, and each refusal.
 * @evidence contracts/performance.md#cost-and-resources Linear in visited entries plus a sort per directory; each listed entry costs two directory captures for revalidation, which dominate the native calls, and recursion depth equals directory depth. Within one walk each directory is captured and listed once; nothing is cached between walks because `toc`'s second walk exists to detect a changed population. Holds at most one directory descriptor at a time, inside capture or assert, plus one listing array per recursion level; the output grows with the number of Markdown files, with no cap.
 */
export const readAutoMovieMaintenanceMarkdownPaths = (
  root: IScaffoldPhysicalDirectory,
  relative: string,
  io: IAutoMovieMaintenanceDirectoryIO = directoryIO,
): string[] => {
  const target = path.resolve(root.path, relative);
  const scoped = path.relative(root.path, target);
  if (
    scoped === "" ||
    scoped === ".." ||
    scoped.startsWith(`..${path.sep}`) ||
    path.isAbsolute(scoped)
  )
    throw new Error("Maintenance Markdown directory escapes its root.");
  const output: string[] = [];
  const visit = (directory: string): void => {
    io.assert(root);
    let owned: IScaffoldPhysicalDirectory;
    try {
      owned = io.capture(directory);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        io.assert(root);
        return;
      }
      throw error;
    }
    const physical = path.relative(root.real, owned.real);
    if (
      path.relative(owned.path, owned.real) !== "" ||
      physical === ".." ||
      physical.startsWith(`..${path.sep}`) ||
      path.isAbsolute(physical)
    )
      throw new Error(
        `Maintenance Markdown directory is linked or outside its root: ${directory}.`,
      );
    for (const entry of [...io.list(directory)].sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    )) {
      io.assert(root);
      io.assert(owned);
      if (
        entry.name === "" ||
        entry.name === "." ||
        entry.name === ".." ||
        /[/\\\0]/u.test(entry.name)
      )
        throw new Error(
          "Maintenance directory returned an invalid child name.",
        );
      const child = path.join(directory, entry.name);
      if (entry.kind === "link")
        throw new Error(`Maintenance Markdown entry is linked: ${child}.`);
      if (entry.kind === "directory") visit(child);
      else if (entry.kind === "file" && entry.name.endsWith(".md"))
        output.push(path.relative(root.path, child).split(path.sep).join("/"));
    }
    io.assert(owned);
    io.assert(root);
  };
  visit(target);
  return output;
};

/**
 *
 * Close delivery maintenance over scripts and both screenplay passes.
 *
 * Concatenates the walks of `docs/scripts`, `docs/screenplays` and
 * `docs/final/screenplays`, in that order; a missing layer contributes nothing.
 *
 * @evidence contracts/common.md#principled-implementation Enumerates the three delivery layers with the shared walker in a fixed order, so the concatenated list is deterministic and comparable by position.
 * @evidence contracts/common.md#clear-and-simple-design A three-element `flatMap` over the walker; the same layer names are restated in `@automovie/template`'s `planAutoMovieProjectDeliveryTocs` and `planAutoMovieDeliveryTocPublication`, so a new layer must be added in both packages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three paths are the contract's delivery layers, a real supported difference rather than a consumer special case.
 * @evidence contracts/common.md#meaningful-documentation States the layers, their order, and that a missing layer is empty.
 * @evidence contracts/performance.md#cost-and-resources Cost is the sum of three walks, linear in their entries; the layers do not overlap, so no entry is visited twice. `run` calls it before planning and again before writing and compares the lists; returning a fresh array each time is what lets that comparison see an added sibling. Owns no resource beyond the walker calls it sequences; its only allocation is the concatenated array.
 */
export const readAutoMovieDeliveryMaintenanceMarkdownPaths = (
  root: IScaffoldPhysicalDirectory,
  io: IAutoMovieMaintenanceDirectoryIO = directoryIO,
): string[] =>
  ["docs/scripts", "docs/screenplays", "docs/final/screenplays"].flatMap(
    (relative) => readAutoMovieMaintenanceMarkdownPaths(root, relative, io),
  );

/**
 *
 * Recheck the complete enumerated population, including newly added siblings.
 *
 * Throws unless both lists match in length, order and spelling, so both must
 * come from the same deterministic walk.
 *
 * @evidence contracts/common.md#principled-implementation Element-wise exact equality of two ordered lists that the same deterministic walk produced, so any addition, removal or rename between walks shows as a difference.
 * @evidence contracts/common.md#clear-and-simple-design A pure comparison kept apart from enumeration so the TOC command states its recheck explicitly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses on any difference, including a reorder, instead of merging or adopting the newer list.
 * @evidence contracts/common.md#meaningful-documentation States the exact-match rule and that both inputs must come from the same walk.
 * @evidence contracts/performance.md#cost-and-resources Linear in list length, exiting at once on a length mismatch. Compares two lists it is handed and produces nothing to share. Compares the two arrays in place and allocates nothing except the error it throws on a mismatch.
 */
export const assertAutoMovieMaintenanceMarkdownInventory = (
  expected: readonly string[],
  current: readonly string[],
): void => {
  if (
    expected.length !== current.length ||
    expected.some((file, index) => file !== current[index])
  )
    throw new Error(
      "Maintenance Markdown population changed after planning; rediscover before retrying.",
    );
};
