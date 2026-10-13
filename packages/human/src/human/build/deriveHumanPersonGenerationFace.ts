import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import { deriveHumanPersonFace } from "../document/deriveHumanPersonFace";
import type { IAutoMovieHumanPersonGenerationFaceProps } from "../structures/IAutoMovieHumanPersonGenerationFaceProps";

/**
 * The face document a one-skin generation evaluates for a person.
 *
 * Without aliases or drivers, use the established face derivation, including linked population axes. Otherwise copy the face shape directly, refuse either aliased face/body channel or an explicitly authored driver channel, then assign each registered driver its body endpoint gain or zero. The nonempty alias/driver path does not also run linked-population derivation; source registrations must own the required quantities. Neither path changes the caller or calibrates clinical age/sex/endpoint motion.
 *
 * @evidence contracts/common.md#principled-implementation Declared aliases prohibit duplicate subtree authorship and registered drivers transfer actual dimensionless body endpoint gains before face evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Empty registration delegates existing face derivation; the registered path owns only shape copying, duplicate-author checks and gain projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit driver or aliased channel authorship refuses even at zero; registered and linked-population paths remain distinct rather than claiming combined behavior absent from source.
 * @evidence contracts/common.md#meaningful-documentation Prose states branch difference, dimensionless coefficients, zero omission and unchanged document ownership.
 * @evidence contracts/performance.md#efficient-algorithms Registered derivation copies K shape keys and scans A aliases plus D drivers, with one gain lookup per driver; the empty path pays its delegated population derivation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each document/state supplies distinct gain-dependent shape; this projection owns no memoized face evaluation or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registered output owns a shape and shallow document wrapper while borrowing unchanged members; omission follows delegated ownership and no task survives.
 */
export function deriveHumanPersonGenerationFace(
  props: IAutoMovieHumanPersonGenerationFaceProps,
): IAutoMovieHumanFaceBasisDocument {
  const { document, gains, aliases, drivers }: IAutoMovieHumanPersonGenerationFaceProps = props;
  if (aliases.length === 0 && drivers.length === 0)
    return deriveHumanPersonFace(document);
  const shape: IAutoMovieHumanFaceBasisDocument["shape"] = { ...document.face.shape };
  for (const alias of aliases)
    if (
      Object.hasOwn(document.face.shape, alias.face) ||
      Object.hasOwn(document.face.shape, alias.body)
    )
      throw new Error(
        "The generation defines " +
          alias.face +
          " once through the body channel " +
          alias.body +
          "; the face document must not state either.",
      );
  for (const driver of drivers) {
    if (Object.hasOwn(document.face.shape, driver.channel))
      throw new Error(
        "The face document must not state the body endpoint driver " +
          driver.channel +
          ".",
      );
    shape[driver.channel] = gains.get(driver.endpoint) ?? 0;
  }
  return { ...document.face, shape };
}
