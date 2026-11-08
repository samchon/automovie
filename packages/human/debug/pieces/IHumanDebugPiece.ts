import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../people/IHumanDebugPerson";

/**
 * One registered diagnostic builder producing a component document from current production code.
 *
 * Its declared input scope may be the person's public inputs/calibration or fixed diagnostic
 * inputs. Some builders first calibrate or prepare the whole person; a small displayed component
 * does not imply a partial generation. The builder reads no file. Each part of its document is one thing
 * to judge alone (a guide, a region's knots, one section piece), so parts can be shown, hidden and
 * coloured one by one. `piece=<name>` or `piece=<name>:<argument>` opens it.
 *
 * @evidence contracts/common.md#principled-implementation Declares the existing registry's real per-builder input scope; fixed diagnostics and analytic studies do not become generated-person anatomy.
 * @evidence contracts/common.md#clear-and-simple-design One builder contract serves named components without imposing a false partial-generation guarantee.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type adds no alternate generator, fixture or runtime exemption; existing builders retain their own production checks and documented inputs.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes displayed component size, builder input ownership and possible whole-person preparation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface executes no algorithm; the selected builder owns construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Builder-specific source and calibration owners determine reuse; this type introduces no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resources; its caller owns the returned document through the ordinary view lifetime.
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
