/** Read the authored key-to-noun mapping used by every part relation checker.
 * This pure reader returns only explicit mappings and preserves their order. */
export const modelParts = (body: string) => [...(body.match(/^부재 대응: (.+)$/m)?.[1] ?? "")
  .matchAll(/`([^`]+)`=([^;.]+)/g)].map(([, key, noun]) => ({ key, noun: noun.trim() }));
