import type { IGalleryCatalogue } from "./structures/IGalleryCatalogue";
import type { IGalleryRequest } from "./structures/IGalleryRequest";

/**
 * The gallery's request in the page's address, so a link shows the same subject
 * in the same state.
 *
 * The query carries `subject`, `variant`, `seed`, `affordances=0` when the
 * marks are off, and one `move.<id>` per articulation away from rest.
 */
export namespace GalleryAddress {
  /** The prefix of an articulation's key. */
  const MOVE: string = "move.";

  /**
   * The request a catalogue opens with: its first subject in its first variant.
   *
   * @param catalogue The catalogue.
   * @returns The request.
   */
  export function initial(catalogue: IGalleryCatalogue): IGalleryRequest {
    const subject: IGalleryCatalogue.ISubject | undefined =
      catalogue.groups[0]?.subjects[0];
    return {
      subject: subject?.id ?? "",
      variant: subject?.variants[0]?.id ?? "",
      seed: null,
      state: {},
      affordances: true,
    };
  }

  /**
   * Read a request from a query.
   *
   * @param search The address's query, with or without its leading `?`.
   * @param catalogue The catalogue the request must name a subject of.
   * @returns The request, using a canonical subject for any saved alias and the
   *   catalogue's first subject when the query is unknown.
   */
  export function decode(
    search: string,
    catalogue: IGalleryCatalogue,
  ): IGalleryRequest {
    const query: URLSearchParams = new URLSearchParams(search);
    const address: IGalleryCatalogue.ITarget = canonical(
      catalogue,
      query.get("subject") ?? "",
      query.get("variant") ?? "",
    );
    const subject: IGalleryCatalogue.ISubject | undefined = catalogue.groups
      .flatMap((group: IGalleryCatalogue.IGroup) => group.subjects)
      .find(
        (s: IGalleryCatalogue.ISubject): boolean => s.id === address.subject,
      );
    if (subject === undefined) return initial(catalogue);

    // The address carries the seed as the decimal digits encode wrote.
    const seed: string | null = query.get("seed");
    const state: Record<string, number> = {};
    for (const [key, text] of query) {
      const value: number = Number(text);
      if (key.startsWith(MOVE) && text !== "" && Number.isFinite(value))
        state[key.slice(MOVE.length)] = value;
    }
    return {
      subject: subject.id,
      variant: subject.variants.some((v): boolean => v.id === address.variant)
        ? address.variant
        : (subject.variants[0]?.id ?? ""),
      seed: seed === null || seed === "" ? null : Number(seed),
      state,
      affordances: query.get("affordances") !== "0",
    };
  }

  /**
   * Resolve a saved dispatcher and variant to their displayed producer and
   * variant. Missing and unknown variants keep the dispatcher's former first
   * choice.
   *
   * @param catalogue The catalogue whose aliases name the replacements.
   * @param subject The saved subject, possibly a former dispatcher.
   * @param variant The saved variant under that subject.
   * @returns The displayed subject and variant; the input unchanged when it
   *   names no alias.
   */
  export function canonical(
    catalogue: IGalleryCatalogue,
    subject: string,
    variant: string,
  ): IGalleryCatalogue.ITarget {
    const alias: IGalleryCatalogue.IAlias | undefined = catalogue.aliases?.find(
      (entry: IGalleryCatalogue.IAlias): boolean => entry.id === subject,
    );
    const selected: IGalleryCatalogue.IAliasVariant | undefined =
      alias?.variants.find(
        (entry: IGalleryCatalogue.IAliasVariant): boolean =>
          entry.id === variant,
      ) ?? alias?.variants[0];
    return selected === undefined
      ? { subject, variant }
      : { subject: selected.subject, variant: selected.variant };
  }

  /**
   * Write a request as a query.
   *
   * @param request The request.
   * @returns The query, with its leading `?`.
   */
  export function encode(request: IGalleryRequest): string {
    const query: URLSearchParams = new URLSearchParams();
    query.set("subject", request.subject);
    if (request.variant !== "") query.set("variant", request.variant);
    if (request.seed !== null) query.set("seed", String(request.seed));
    if (!request.affordances) query.set("affordances", "0");
    for (const [id, value] of Object.entries(request.state))
      if (value !== 0) query.set(`${MOVE}${id}`, String(value));
    return `?${query.toString()}`;
  }
}
