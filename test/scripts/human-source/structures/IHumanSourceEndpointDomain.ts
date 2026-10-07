/** Actual population ownership of one declared face endpoint. A part-only
 * endpoint has no skin contribution; it is not unavailable geometry and gains
 * no fabricated zero skin rows. An alias names its single current root owner.
 * @author Samchon
 */
export interface IHumanSourceEndpointDomain {
  endpoint: string;
  skinContribution: boolean;
  rootEndpoint: string | null;
  partSurfaces: string[];
  landmarkContribution: boolean;
}
