
/** Return a fresh own-enumerable-field record with one key renamed and its original member references preserved; malformed-schema cases keep field count while changing the contract key. */
export const renameSemanticMaskKey: (value: object, from: string, to: string) => Record<string, unknown> = (
  value: object,
  from: string,
  to: string,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(value).map(([key, member]: [string, unknown]): [string, unknown] => [
      key === from ? to : key,
      member,
    ]),
  );
