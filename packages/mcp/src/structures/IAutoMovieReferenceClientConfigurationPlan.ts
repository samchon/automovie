/**
 * Two complete configuration candidates; publication remains the caller's operation.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-transports Preserves the caller's ability to review and publish local registration separately from reference reads.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-transports Names only the two project-local client configuration outputs.
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
