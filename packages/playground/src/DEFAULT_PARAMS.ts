import type { IHumanoidParams } from "./IHumanoidParams";

/**
 * Conventional starting dimensions of the procedural proportions editor, in metres. These authored values carry no measured adult-population or clinical-validity claim.
 *
 * The editor copies this eleven-field record at startup and uses it as the complete transfer-validation template; it offers no Reset action. buildHumanoid owns primitive/skeleton assembly; these values supply no anatomical default source, fitted observations or replacement for missing Human assets.
 *
 * One module-level record lives for the page lifetime and owns no worker, GPU handle or timer. Ordinary copies reuse initial data rather than caching a model or authored edit, and mutable copies belong to the page.
 *
 * @author Samchon
 */
export const DEFAULT_PARAMS: IHumanoidParams = {
  hipHeight: 0.9,
  torsoLength: 0.6,
  neckLength: 0.1,
  shoulderWidth: 0.36,
  hipWidth: 0.18,
  upperArmLength: 0.28,
  lowerArmLength: 0.25,
  thighLength: 0.45,
  shinLength: 0.43,
  limbRadius: 0.055,
  headRadius: 0.12,
};
