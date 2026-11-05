import type { IFilm } from "./IFilm";

/**
 * Select the film one Viewer mount or render plays.
 *
 * An absent or empty name selects the only registered film; with several
 * films, the name is required. An unknown name, an ambiguous absent name or an
 * empty registry throws an error that lists the registered names.
 *
 * @evidence contracts/common.md#implementation-and-ownership Own-property lookup keeps inherited keys such as toString from resolving as films, and an omitted name resolves only when one film exists, so no film plays by accident; the Viewer entry and render share this rule.
 * @evidence contracts/common.md#authoring-interface Pass the registry and the requested name or null; the result names the selected film, and every refusal throws with the registered names.
 */
export function selectFilm(
  films: Readonly<Record<string, IFilm>>,
  name: string | null,
): { name: string; film: IFilm } {
  const names: string[] = Object.keys(films);
  if (names.length === 0)
    throw new Error("No film is registered in src/films/index.ts");
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
