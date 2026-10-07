import type { IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * Read a numerical scalar, closed choice or explicit null operation a person
 * document states at a catalogue path, or undefined when it is omitted.
 * Composite records never become an editor control through this reader.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Reads the current value of a listed input from the working person document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Distinguishes an authored value from an omitted one without inventing a default.
 * @author Samchon
 */
export function readConnectedPersonInput(document: IAutoMovieHumanPersonDocument, path: readonly string[]): number | string | null | undefined {
  let node: unknown = document;
  for (const key of path) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, key)) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" || typeof node === "string" || node === null ? node : undefined;
}
