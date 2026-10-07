/**
 * One pinned upstream source of a generation: where it was acquired, the
 * content digest that identifies it, the digest of each license text and the
 * rights split the license states. `consumed` sources were read by the
 * sampler; the others are recorded for the rights chain only.
 *
 * `licenses` holds the digest of each license text that ships inside the
 * archive, and is empty when the archive ships none. `rights` then carries
 * the determination in words: `data` and `code` name the license of each
 * kind of content, `attribution` the required credit line, and the evidence
 * keys say which official text or embedded header was actually read. An
 * `unknown` key states what those texts leave undecided and `handling` what
 * the producer does meanwhile; neither is resolved by assumption.
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
