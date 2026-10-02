/**
 * Admit distinct canonical artifact locations inside the caller's sidecar root.
 * The real command resolves native paths and case policy before calling this
 * pure boundary. `root` includes its trailing separator. No filesystem is
 * inspected here. Exclusive creation in the command refuses existing aliases.
 *
 * @evidence contracts/common.md#principled-implementation Both artifacts stay in the private namespace and cannot alias the source, shipped asset or each other.
 * @evidence contracts/common.md#clear-and-simple-design Namespace and distinctness checks precede every write.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No legacy published-path fallback exists.
 * @evidence contracts/common.md#meaningful-documentation States canonicalization, root delimiter and exclusive-creation responsibilities.
 */
export function assertBodyBasisSidecarPaths(input: {
  source: string;
  published: string;
  output: string;
  receipt: string;
  root: string;
}): void {
  if (input.root.length === 0 || !input.output.startsWith(input.root) || !input.receipt.startsWith(input.root))
    throw new Error("Candidate and receipt must stay inside the sidecar root.");
  if (input.output === input.root || input.receipt === input.root)
    throw new Error("Sidecar outputs must name artifacts, not the root itself.");
  if (input.output === input.source || input.output === input.published || input.receipt === input.source || input.receipt === input.published || input.output === input.receipt)
    throw new Error("Sidecar outputs cannot overwrite an input, published basis or each other.");
}
