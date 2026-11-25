import * as fs from "node:fs";
import * as path from "node:path";
import { type Document, isMap, parseDocument, stringify, visit } from "yaml";

/**
 * Catalog dependencies and build policy collected from the shipped manifests at
 * build time.
 */
interface IScaffoldSettings {
  automovie: string[];
  catalogs: Record<string, Record<string, string>>;
  allowBuilds: Record<string, boolean>;
}

/**
 * Render pnpm settings for a new production or workspace. Given an existing
 * workspace's directory and YAML, fill missing scaffold catalog entries.
 * Existing pins, overrides, workspace members and build policy keep their
 * values. A linked SDK supplies missing scoped packages when their sibling
 * manifests identify them. Other new entries use the installed scaffold's
 * ranges.
 *
 * @param workspace The new layout or the existing workspace whose catalogs the
 *   CLI needs.
 * @returns Workspace YAML, byte-for-byte unchanged when every required entry
 *   exists.
 * @throws If the shipped settings or workspace YAML cannot be read as required.
 */
export function renderAutoMovieWorkspace(
  workspace: "production" | "workspace" | { directory: string; source: string },
): string {
  const settings: IScaffoldSettings = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../generated/pnpm-workspace.json"),
      "utf8",
    ),
  );
  const manifest: { version: string } = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"),
  );
  const catalogs: Record<string, Record<string, string>> = {
    automovie: Object.fromEntries(
      settings.automovie.map((name: string) => [name, `^${manifest.version}`]),
    ),
    ...settings.catalogs,
  };
  if (typeof workspace === "string")
    return stringify({
      ...(workspace === "workspace"
        ? { packages: ["movies/shorts/*", "movies/series/*", "packages/*"] }
        : {}),
      catalogs,
      allowBuilds: settings.allowBuilds,
    });

  const document: Document = parseDocument(workspace.source, { merge: true });
  if (document.errors.length) throw document.errors[0];
  const root: Map<string, unknown> = mapping(
    document.toJS({ mapAsMap: true }),
    "pnpm-workspace.yaml",
  );
  const current: Map<string, unknown> = mapping(
    root.get("catalogs"),
    "catalogs",
  );
  const sdk: Map<string, unknown> = mapping(
    current.get("automovie"),
    "catalogs.automovie",
  );
  const overrides: Map<string, unknown> = mapping(
    root.get("overrides"),
    "overrides",
  );
  const directories: Set<string> = new Set();
  for (const [name, spec] of new Map([...sdk, ...overrides]))
    if (
      name.startsWith("@automovie/") &&
      typeof spec === "string" &&
      spec.startsWith("link:")
    )
      directories.add(
        path.dirname(path.resolve(workspace.directory, spec.slice(5))),
      );

  let changed: boolean = false;
  for (const [catalog, dependencies] of Object.entries(catalogs)) {
    const entries: Map<string, unknown> = mapping(
      current.get(catalog),
      `catalogs.${catalog}`,
    );
    const missing: [string, string][] = Object.entries(dependencies).filter(
      ([name]) => !entries.has(name),
    );
    if (missing.length === 0) continue;
    if (!changed) isolateMapping(document, ["catalogs"], current);
    isolateMapping(document, ["catalogs", catalog], entries);
    for (const [name, range] of missing) {
      const link: string | undefined =
        catalog === "automovie" && !overrides.has(name)
          ? linkedSibling(workspace.directory, directories, name)
          : undefined;
      document.setIn(["catalogs", catalog, name], link ?? range);
    }
    changed = true;
  }
  return changed ? document.toString() : workspace.source;
}

/**
 * Give this path its own entries, preserving the old values at other uses of
 * its anchor.
 */
function isolateMapping(
  document: Document,
  keys: string[],
  values: Map<string, unknown>,
): void {
  const node = document.getIn(keys, true);
  if (!isMap(node)) {
    document.setIn(keys, document.createNode(values));
    return;
  }
  if (node.anchor)
    visit(document, {
      Alias: (_key, alias) => {
        if (alias.resolve(document) === node)
          return document.createNode(values, { aliasDuplicateObjects: false });
      },
    });
}

/** Read an optional YAML mapping, refusing malformed pnpm settings before edits. */
function mapping(value: unknown, key: string): Map<string, unknown> {
  if (value === undefined || value === null) return new Map();
  if (value instanceof Map) return value;
  throw new Error(`${key} must be a mapping in pnpm-workspace.yaml`);
}

/**
 * Resolve a missing scoped SDK package beside the workspace's linked SDK
 * packages.
 */
function linkedSibling(
  root: string,
  directories: Set<string>,
  name: string,
): string | undefined {
  if (!name.startsWith("@automovie/")) return undefined;
  for (const directory of directories) {
    const candidate: string = path.join(
      directory,
      name.slice("@automovie/".length),
    );
    const file: string = path.join(candidate, "package.json");
    if (
      fs.existsSync(file) &&
      JSON.parse(fs.readFileSync(file, "utf8")).name === name
    )
      return `link:${path.relative(root, candidate).split(path.sep).join("/")}`;
  }
  return undefined;
}
