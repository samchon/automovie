/**
 * The revision domains an edit moved.
 *
 * @evidence contracts/common.md#principled-implementation Reports browser/face/body/person digest names whose completed recomputation differed from the prior revision values.
 * @evidence contracts/common.md#clear-and-simple-design Keeps source identity changes separate from candidate replacement and numerical-cache decisions in callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty array is no observed digest movement, not successful rendering or proof no unsupported source effect exists.
 * @evidence contracts/common.md#meaningful-documentation Documents produced domain labels although the plain string array does not structurally restrict callers to them.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result performs no hash; revision owners traverse/hash dependency inputs then compare four completed strings.
 * @evidence contracts/performance.md#reuse-equivalent-work Completed revisions are retained for immediate reads, while each edit batch owns recomputation rather than reusing a prior moved list.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current producers return at most four labels with no native handle; source worker/watcher lifetime remains separate.
 *
 * @author Samchon
 */
export interface IHumanViewerMovedDomains {
  /** Domains whose digest changed (`browser`, `face`, `body`, `person`). */
  moved: string[];
}
