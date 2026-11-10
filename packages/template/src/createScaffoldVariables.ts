import { AUTOMOVIE_TEMPLATE_CATALOGS } from "./AUTOMOVIE_TEMPLATE_CATALOGS";
import { AUTOMOVIE_TEMPLATE_VERSIONS } from "./AUTOMOVIE_TEMPLATE_VERSIONS";

/**
 * The token table for the `production` and `workspace` scaffold layers.
 *
 * `{{name}}` is the admitted project name and `{{skills}}` the path from the rendered directory to the shared `.agents/skills` tree. Every `{{version:<key>}}` resolves to the build-time {@link AUTOMOVIE_TEMPLATE_VERSIONS} range for `"release"`, or to the named-catalog specifier `catalog:<name>` from {@link AUTOMOVIE_TEMPLATE_CATALOGS} for `"catalog"`, so a workspace production takes its versions from the workspace root's `pnpm-workspace.yaml`.
 *
 * @param props The admitted name, the skills path, and how dependency versions are written.
 * @returns A fresh token table.
 * @throws When a version key has no catalog in catalog mode.
 *
 * @evidence contracts/development/implementation.md#principled-implementation A pnpm `catalog:<name>` specifier resolves through the workspace's named `catalogs`, so writing it for every version key defers each range to the catalog the workspace root renders from the same version table.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner builds every layer's table; the renderers choose only the name, the skills path and the dependency mode.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The keys are exactly the version table's plus `name` and `skills`, with no per-file value; an unknown token still fails rendering.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states every token, both dependency modes and why the catalog mode exists.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the fixed version table.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A render builds its table once.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned table is owned by the caller and holds one string per key.
 */
export const createScaffoldVariables: (props: {
  /** Admitted project name. */
  name: string;

  /** Path from the rendered directory to the shared `.agents/skills`, with `/` separators. */
  skills: string;

  /** `"release"` writes the build-time ranges; `"catalog"` writes `catalog:<name>` for a workspace production. */
  dependencies: "release" | "catalog";
}) => Record<string, string> = (props: {
  name: string;
  skills: string;
  dependencies: "release" | "catalog";
}): Record<string, string> => {
  const variables: Record<string, string> = {
    name: props.name,
    skills: props.skills,
  };
  for (const [key, value] of Object.entries(AUTOMOVIE_TEMPLATE_VERSIONS)) {
    if (props.dependencies === "release") {
      variables[`version:${key}`] = value;
      continue;
    }
    const catalog: string | undefined = AUTOMOVIE_TEMPLATE_CATALOGS[key];
    if (catalog === undefined)
      throw new Error(`version key "${key}" has no workspace catalog`);
    variables[`version:${key}`] = `catalog:${catalog}`;
  }
  return variables;
};
