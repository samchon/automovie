/**
 * Version ranges of the AutoMovie workspace packages, keyed by package
 * directory name, as the scaffold's `{{version:<key>}}` tokens receive them.
 *
 * The build reads each `packages/<key>/package.json` and supplies `^` plus its
 * `version`; {@link resolveAutoMovieTemplateDependencyVersions} copies every
 * value unchanged into the generated version table. Each value is an npm range
 * that a generated project's `package.json` writes as the package's
 * dependency.
 *
 * @evidence contracts/common.md#principled-implementation A caret range on the package's own version admits compatible patch and minor releases under npm semver, which is how a generated project should follow the workspace it was built from.
 * @evidence contracts/common.md#clear-and-simple-design One required field per workspace package makes a missing package a type error at the build script instead of a missing token at render time; reading the manifests stays in the build script.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record holds every workspace package uniformly, with no field defaulted or special-cased for one package.
 * @evidence contracts/common.md#meaningful-documentation The comment states the keys, where each value comes from, its form, and where it ends up; the members name the published package each range belongs to.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record of twelve strings chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record is read once to build one version table and coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds twelve strings and no handle.
 * @author Samchon
 */
export interface IAutoMovieWorkspacePackageVersions {
  /** Range of `@automovie/archetypes`. */
  archetypes: string;

  /** Range of `automovie`, the command-line package. */
  cli: string;

  /** Range of `@automovie/engine`. */
  engine: string;

  /** Range of `@automovie/evidence`. */
  evidence: string;

  /** Range of `@automovie/human`. */
  human: string;

  /** Range of `@automovie/ingest`. */
  ingest: string;

  /** Range of `@automovie/interface`. */
  interface: string;

  /** Range of `@automovie/mcp`. */
  mcp: string;

  /** Range of `@automovie/production`. */
  production: string;

  /** Range of `@automovie/render`. */
  render: string;

  /** Range of `@automovie/template`. */
  template: string;

  /** Range of `@automovie/viewer`. */
  viewer: string;
}
