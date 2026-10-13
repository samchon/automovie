/**
 * Two complete configuration candidates; publication remains the caller's operation.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceClientConfigurationPlan {
  /** Scoped Claude registration candidate; the caller decides whether to publish it. */
  claude: {
    /** Project-relative Claude configuration target. */
    path: ".mcp.json";

    /** Complete JSON candidate preserving all unrelated user configuration values. */
    content: string;
  };

  /** Scoped Codex registration candidate with an independently owned managed table. */
  codex: {
    /** Project-relative Codex configuration target. */
    path: ".codex/config.toml";

    /** Complete TOML candidate preserving bytes outside the owned registration span. */
    content: string;
  };
}
