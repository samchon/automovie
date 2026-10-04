/**
 * The rigid anchor of the head partition for the endpoints in `targets`. Its
 * delta for an endpoint is the mean of that endpoint's rows on the named body
 * landmarks; a row on a head-only vertex is stored relative to it, so the
 * evaluator adds the anchor delta to the whole head once and the field is the
 * same absolute upstream row on both sides of the cut.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationAnchor {
  landmarks: string[];
  rule: string;
  targets: string[];
}
