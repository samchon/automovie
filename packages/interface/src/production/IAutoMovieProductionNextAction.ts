/** One action that moves the production toward a clean compile. */
export interface IAutoMovieProductionNextAction {
  /** Owning surface. */
  owner: "design" | "source" | "compile" | "review" | "render";

  /** Exact package API or coding-agent command to run. */
  action: string;

  /** Exact target or artifact to correct. */
  target: string;

  /** Why this action is next. */
  reason: string;
}
