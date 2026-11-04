import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";

/**
 * One registered piece: a part of a person built from that person's typed inputs and the current
 * production code into a component document, without generating the whole person.
 *
 * A piece reads only its person (public inputs and their calibration) and numbers derived from
 * them, never a file, so it builds the same on any checkout. Each part of its document is one thing
 * to judge alone (a guide, a region's knots, one section piece), so parts can be shown, hidden and
 * coloured one by one. `piece=<name>` or `piece=<name>:<argument>` opens it.
 */
export interface IHumanDebugPiece {
  /** Registry name of letters, digits, `.`, `_` and `-`. */
  name: string;

  /** Anatomical region the piece belongs to, a key of `HUMAN_DEBUG_REGIONS`, or `body` for every region. */
  region: string;

  /** One sentence naming what the document shows and what it is built from. */
  description: string;

  /** Arguments the batch render opens this piece with; empty when the piece takes none. */
  arguments: string[];

  /**
   * Build the document.
   *
   * @param person The person.
   * @param argument Text after `:` in the piece name, or null.
   * @returns The document; a throw becomes the page's notice and the image route's error.
   */
  build(person: IHumanDebugPerson, argument: string | null): IHumanDebugDocument;
}
