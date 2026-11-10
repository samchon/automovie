import type { IFilm } from "./IFilm";

/**
 * Select the film one Viewer mount or render plays.
 *
 * An absent or empty name selects the only registered film; with several
 * films, the name is required. An unknown name, an ambiguous absent name or an
 * empty registry throws an error that lists the registered names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states when the name may be omitted and every refusal, and the return names the selected film.
 * @evidence contracts/development/implementation.md#principled-implementation Own-property lookup keeps inherited object keys such as toString from resolving as films, and an omitted name resolves only when one film exists, so a production with several films never plays an unintended one.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure function serves the Viewer entry and the render command, so both select by the same rule.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No film name is special-cased, and nothing falls back to the first film when the choice is ambiguous.
 * @evidence contracts/development/implementation.md#efficient-algorithms Listing the registry is linear in its film count, which is small; lookup is constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call selects from its arguments alone; there is no shared work to reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned pair and an error message are allocated; nothing is retained.
 */
export function selectFilm(
  films: Readonly<Record<string, IFilm>>,
  name: string | null,
): { name: string; film: IFilm } {
  const names: string[] = Object.keys(films);
  if (names.length === 0)
    throw new Error("No film is registered in src/composition/films/index.ts");
  if (name === null || name === "") {
    if (names.length === 1) return { name: names[0]!, film: films[names[0]!]! };
    throw new Error(
      `Select a film with ?film=<name> or --film <name>: ${names.join(", ")}`,
    );
  }
  if (!Object.hasOwn(films, name))
    throw new Error(`Unknown film "${name}"; registered: ${names.join(", ")}`);
  return { name, film: films[name]! };
}
