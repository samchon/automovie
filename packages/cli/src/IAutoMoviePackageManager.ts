/**
 * The package manager a created production's next steps name, with the enclosing pnpm workspace root when one exists.
 *
 * @evidence contracts/development/design.md#principled-representation The manager and the optional workspace root are exactly what `renderAutoMovieScaffoldNextSteps` needs to print the install location and script commands.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed pair of managers, the two the scaffold documents; `selectAutoMoviePackageManager` produces it and the next-steps renderer consumes it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No free-form manager string or command template lets a caller print undocumented commands.
 * @evidence contracts/development/common.md#meaningful-documentation Each member states what it controls in the printed steps.
 */
export interface IAutoMoviePackageManager {
  /** The manager whose install and script commands the next steps print. */
  manager: "npm" | "pnpm";

  /** Absolute root of the enclosing pnpm workspace, where `pnpm install` runs. */
  workspace?: string;
}
