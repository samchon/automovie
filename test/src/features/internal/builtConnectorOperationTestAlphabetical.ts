/** Order authored space identifiers lexically for deterministic adjacency assertions. */
export const builtConnectorOperationTestAlphabetical = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);
