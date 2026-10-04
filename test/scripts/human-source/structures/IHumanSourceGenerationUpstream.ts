/**
 * One pinned upstream source of a generation: where it was acquired, the
 * content digest that identifies it, the digest of each license text and the
 * rights split the license states. `consumed` sources were read by the
 * sampler; the others are recorded for the rights chain only.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationUpstream {
  name: string;
  consumed: boolean;
  locator: string;
  revision: string;
  archiveSha256: string;
  contentSha256: string;
  licenses: Record<string, string>;
  rights: Record<string, string>;
}
