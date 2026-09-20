/**
 * An authored closed lingual body in millimetres, not an MRI reconstruction.
 * Independent dimensions describe the visible body, dorsum and median groove;
 * the two closed endpoints do not model the tongue's actual muscular roots.
 * A named resident material supplies its finish without changing other tissues.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates tongue volume and median groove from oral depth, lips and enamel.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Declares local lingual dimensions and observed oral placement without embedding a person preset.
 */
export interface IPortraitTongueShape {
  /** Transverse body semiaxis in [5,35] mm. */
  halfWidth: number;
  /** Anterior-to-posterior body length in [20,70] mm. */
  length: number;
  /** Vertical body semiaxis in [2,15] mm. */
  halfThickness: number;
  /** Superior mid-body centreline rise in [0,15] mm at the observed expression. */
  dorsumRise: number;
  /** Median groove depression in [0,3] mm, strictly less than halfThickness. */
  grooveDepth: number;
  /** Gaussian transverse groove scale in [0.2,8] mm. */
  grooveWidth: number;
  /** Inferior placement from the observed lower oral anchor in [0,15] mm. */
  drop: number;
  /** Posterior tip placement from the observed lower oral anchor in [0,30] mm. */
  recess: number;
  /** Nonempty existing material identity, independent of enamel and vermilion. */
  material: string;
}
