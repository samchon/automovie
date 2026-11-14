/**
 * The name a page shows for an archetype's producer: `createLongTool` reads
 * as "Long tool".
 *
 * @param producer The producer's export name in `@automovie/archetypes`.
 * @returns Its name in words.
 */
export function formatArchetypeLabel(producer: string): string {
  return producer
    .replace(/^create/, "")
    .replace(
      /(?!^)[A-Z]/g,
      (letter: string): string => ` ${letter.toLowerCase()}`,
    );
}
