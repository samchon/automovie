

/** Source ids remain stable; this label only makes the navigator readable. */
export const viewLabel: (id: string) => string = (id: string): string =>
  id.replace(/[-_.]+/g, " ").replace(/\b\w/g, (letter: string) : string => letter.toUpperCase());
