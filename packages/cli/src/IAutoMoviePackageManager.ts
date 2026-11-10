/** The package manager a created production's next steps name, with the enclosing pnpm workspace root when one exists. */
export interface IAutoMoviePackageManager {
  /** The manager whose install and script commands the next steps print. */
  manager: "npm" | "pnpm";

  /** Absolute root of the enclosing pnpm workspace, where `pnpm install` runs. */
  workspace?: string;
}
