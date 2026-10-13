import { type IScaffoldPhysicalDirectory } from "./IScaffoldPhysicalDirectory";
import { assertScaffoldPhysicalDirectory } from "./assertScaffoldPhysicalDirectory";
import { inside } from "./inside";


/**
 * Require captured root and parent generations and physical containment before a scaffold write; a changed generation or escaped real path throws.
 *
 * @evidence contracts/common.md#principled-implementation Both directory captures are revalidated before physical real-path containment is required.
 * @evidence contracts/common.md#clear-and-simple-design This shared gate owns base-versus-parent authority while directory capture owns identity observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching lexical prefix cannot bypass real-path containment or a changed generation.
 * @evidence contracts/common.md#meaningful-documentation The comment states both required directory generations and the thrown escaped-parent condition.
 * @evidence contracts/performance.md#efficient-algorithms Two directory captures and one path-relative comparison cost fixed metadata operations plus path length.
 * @evidence contracts/performance.md#reuse-equivalent-work Ownership is reobserved for each write boundary; previously cached captures do not cache the current verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful capture returns only after its temporary close completes; native close failures propagate through this gate without a release claim. No descriptor or cross-call state is acquired here.
 */
export const assertScaffoldOwnership: (base: IScaffoldPhysicalDirectory, parent: IScaffoldPhysicalDirectory) => void = (
  base: IScaffoldPhysicalDirectory,
  parent: IScaffoldPhysicalDirectory,
): void => {
  assertScaffoldPhysicalDirectory(base);
  assertScaffoldPhysicalDirectory(parent);
  if (inside(base.real, parent.real) === false)
    throw new Error(
      `scaffold file parent escapes its physical base: ${parent.path}`,
    );
};
