/**
 * Two complete configuration candidates; publication remains the caller's operation.
 *
 * @evidence contracts/common.md#principled-implementation Complete Claude JSON and Codex TOML candidates retain unrelated configuration values or bytes.
 * @evidence contracts/common.md#clear-and-simple-design Planning returns two explicit targets while publication remains the caller's operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No candidate is represented as already published or installed.
 * @evidence contracts/common.md#meaningful-documentation Members document project-relative targets and retained unrelated content.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-held values retain only their documented fields; implementations own handles and source-lifetime bounds.
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
