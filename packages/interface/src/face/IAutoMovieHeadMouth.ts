/**
 * Mouth and lip traits of an {@link IAutoMovieHead}: signed weights in
 * `[-2, 2]`, with omission leaving the template unchanged.
 *
 * `smile` is a resting identity shape, not an expression. `flattenHead`
 * renames `lipFullness`, `upperLipHeight` and `lowerLipHeight` to `lipFull`,
 * `upperLipH` and `lowerLipH`, and the other fields to same-stem names
 * (`mouthWidth`, `cupidsBow`, `philtrum`, `mouthHeight`, `mouthSmile`).
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.mouth` in `flattenHead` renames all eight leaves one-to-one, three of them to shortened names that the documentation lists so a template author can match targets.
 * @evidence contracts/common.md#clear-and-simple-design One flat record holds the mouth's placement, both lips and the philtrum region, and the upper and lower lip get separate heights because `AutoMovieHeadParameterName` names a separate target for each.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `smile` is a static template target, not a stand-in for the expression contract, and no lip leaf is derived from another.
 * @evidence contracts/common.md#meaningful-documentation States the range and neutral meaning, that `smile` is identity rather than expression, and every morph name including the shortened ones; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadMouth {
  /** Mouth width: `+` wider, `-` narrower. */
  width?: number;

  /** Fullness of both lips: `+` fuller, `-` thinner. */
  lipFullness?: number;

  /** Upper-lip vermilion height: `+` taller, `-` thinner. */
  upperLipHeight?: number;

  /** Lower-lip vermilion height: `+` taller, `-` thinner. */
  lowerLipHeight?: number;

  /** Cupid's-bow definition: `+` sharper peaks, `-` a flatter upper lip line. */
  cupidsBow?: number;

  /** Philtrum volume: `+` deeper ridges, `-` smoother. */
  philtrum?: number;

  /** Vertical mouth position: `+` higher, `-` lower. */
  height?: number;

  /** Resting corner lift: `+` up into a slight smile, `-` down. */
  smile?: number;
}
