import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";

/**
 * Validates declared optional account paths and active obligation targets.
 *
 * The reader returns a contract's H2 count or undefined for a missing target. Authored H2s and aggregate accounts share ordinary coverage in native lint.
 *
 * @evidence contracts/common.md#principled-implementation Declared accounts and supplemental owners populate one stage map; residents must have active owners and enabled accounts must reference existing nonempty H2 obligations.
 * @evidence contracts/common.md#clear-and-simple-design This validator owns account identity and active target presence while native coverage owns authored H2s and aggregate account relationships.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate account paths, target identities and disabled resident files refuse rather than being silently merged.
 * @evidence contracts/common.md#meaningful-documentation The comment states optional account paths and H2 lookup meaning; readH2Count undefined means a missing target.
 * @evidence contracts/performance.md#efficient-algorithms For A accounts, S supplemental owners and R residents, map/set passes cost expected O(A+S+R) plus one target lookup per enabled account.
 * @evidence contracts/performance.md#reuse-equivalent-work One ownership map and target set serve all resident and duplicate checks; H2 reader effects remain explicit and are not memoized here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the H2 reader; local maps retain only names/stages until return and acquire no descriptor.
 */
export function validateAutoMoviePopulationAccountHosts(props: {
  accounts: readonly {
    layer: string;
    stage: AutoMovieEvidenceStage;
    account: string;
    target: string;
    enabled: boolean;
  }[];
  residents: readonly string[];
  supplemental: readonly { file: string; stage: AutoMovieEvidenceStage }[];
  readH2Count: (projectRelative: string) => number | undefined;
}): void {
  const allowed: Map<string, AutoMovieEvidenceStage> = new Map<string, AutoMovieEvidenceStage>();
  for (const entry of props.supplemental) allowed.set(entry.file, entry.stage);
  const targets: Set<string> = new Set<string>();
  for (const entry of props.accounts) {
    if (allowed.has(entry.account))
      throw new Error(
        `${entry.account}: population account has multiple declarations or collides with a reserved account.`,
      );
    allowed.set(entry.account, entry.stage);
    const identity: string = `${entry.layer}:${entry.target}`;
    if (targets.has(identity))
      throw new Error(
        `${entry.account}: ${entry.target} already has a population account in ${entry.layer}.`,
      );
    targets.add(identity);
  }
  for (const resident of props.residents) {
    const stage: AutoMovieEvidenceStage | undefined = allowed.get(resident);
    if (stage === undefined)
      throw new Error(
        `${resident}: population accounts contain an unowned file.`,
      );
    if (stage === "disabled")
      throw new Error(
        `${resident}: a disabled layer cannot retain a population account.`,
      );
  }
  for (const entry of props.accounts) {
    if (!entry.enabled) continue;
    const obligations: number | undefined = props.readH2Count(entry.target);
    if (obligations === undefined)
      throw new Error(
        `${entry.account}: population obligation target ${entry.target} is missing.`,
      );
    if (obligations === 0)
      throw new Error(
        `${entry.account}: population obligation target ${entry.target} has no H2 obligations.`,
      );
  }
}
