import type { IGalleryCatalogue } from "./structures/IGalleryCatalogue";
import type { IGalleryRequest } from "./structures/IGalleryRequest";

/**
 * The gallery's request in the page's address, so a link shows the same
 * subject in the same state.
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
      seed: "",
      state: {},
      affordances: true,
    };
  }

  /**
   * Read a request from a query.
   *
   * @param search The address's query, with or without its leading `?`.
   * @param catalogue The catalogue the request must name a subject of.
   * @returns The request; the catalogue's first subject when the query names none it has, and a subject's first variant when the query names none it has.
   */
  export function decode(
    search: string,
    catalogue: IGalleryCatalogue,
  ): IGalleryRequest {
    const query: URLSearchParams = new URLSearchParams(search);
    const subject: IGalleryCatalogue.ISubject | undefined = catalogue.groups
      .flatMap((group: IGalleryCatalogue.IGroup) => group.subjects)
      .find(
        (s: IGalleryCatalogue.ISubject): boolean =>
          s.id === query.get("subject"),
      );
    if (subject === undefined) return initial(catalogue);

    const variant: string | null = query.get("variant");
    const state: Record<string, number> = {};
    for (const [key, text] of query) {
      const value: number = Number(text);
      if (key.startsWith(MOVE) && text !== "" && Number.isFinite(value))
        state[key.slice(MOVE.length)] = value;
    }
    return {
      subject: subject.id,
      variant: subject.variants.some((v): boolean => v.id === variant)
        ? variant!
        : (subject.variants[0]?.id ?? ""),
      seed: query.get("seed") ?? "",
      state,
      affordances: query.get("affordances") !== "0",
    };
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
    if (request.seed !== "") query.set("seed", request.seed);
    if (!request.affordances) query.set("affordances", "0");
    for (const [id, value] of Object.entries(request.state))
      if (value !== 0) query.set(`${MOVE}${id}`, String(value));
    return `?${query.toString()}`;
  }
}
