/**
 * Provenance of the portable body studies: the connected basis they were
 * built from, its extraction receipt and the likeness verdict.
 *
 * Paths are relative to this study directory. The likeness stays unaccepted;
 * source inspection never accepts a person's anatomy or appearance.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Names the licensed neutral body prior and its extraction receipt the studies evaluate.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Points to the selected single-surface asset whose immutable basis the studies compile, without accepting its likeness.
 * @author Samchon
 */
export interface IHumanBodyStudyProvenance {
  /** Study-relative path of the connected basis description. */
  basis: string;

  /** Study-relative path of the basis extraction receipt. */
  receipt: string;

  /** Likeness verdict; source inspection never accepts it. */
  likeness: "unaccepted";
}
