/**
 * An attached part of the generation, referenced in the published basis it
 * is carried from rather than copied, with the reason it is not regenerated.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationPart {
  id: string;
  basis: string;
  basisSha256: string;
  vertices: number;
  endpoints: number;
  provenance: string;
}
