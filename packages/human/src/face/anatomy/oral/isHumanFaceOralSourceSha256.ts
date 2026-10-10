/**
 * Admit the publisher's exact lowercase 64-character SHA-256 wire identity.
 * Length admission makes a final line terminator invalid rather than relying
 * on the regular expression end anchor's pre-newline matching semantics.
 * @author Samchon
 */
export function isHumanFaceOralSourceSha256(value: string): boolean {
  return value.length === 64 && /^[a-f0-9]{64}$/.test(value);
}
