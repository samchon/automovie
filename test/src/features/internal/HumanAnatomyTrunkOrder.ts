import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";
import { HumanAnatomyShared } from "./HumanAnatomyShared";
import { HumanAnatomyTrunk } from "./HumanAnatomyTrunk";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The order of the trunk's tapes as the person's inputs give it: wherever two
 * tape inputs differ clearly, the skin's tapes at their ISO 8559-1 sites differ
 * the same way. A chest input over a waist input is a chest over a waist on the
 * skin, for every pair of tapes, so a construction that narrows the chest under
 * the waist, swaps two tapes or flattens the trunk contradicts its own inputs.
 */
export namespace HumanAnatomyTrunkOrder {
  /**
   * Least difference between two tape inputs that fixes their order on the
   * skin, mm. Each reading may miss its input by the ISO 20685-1:2018 Table 4
   * error for large circumferences, so two inputs differing by less than
   * twice that may read either way within the tolerance; the identity rows own
   * those.
   */
  export const CLEAR: number = 2 * HumanAnatomyShared.LARGE;

  /** One tape: its name, its input and its reading on the skin. */
  interface ITape {
    /** Name in the row. */
    label: string;

    /** The person's input, mm; null when the person has none. */
    input: number | null;

    /** The tape read on the skin at its site, mm; NaN when the site is not found. */
    reading: number;
  }

  /**
   * The order rows of one subject.
   *
   * @param subject Skin and public inputs to audit.
   */
  export function rows(subject: HumanAnatomyAudit.ISubject): IRow[] {
    const skin: HumanAnatomy.ISkin = subject.bind();
    const controls: IAutoMovieHumanParameters["body"]["controls"] = subject.params.body.controls;
    const S: number = controls.height.value!;
    const trunk: HumanAnatomyShared.ITrunk = HumanAnatomyTrunk.trunkSites(skin, S);
    const neck: HumanAnatomyShared.INeck = HumanAnatomyTrunk.neckSites(skin, S);

    const tapes: ITape[] = [
      { label: "chest", input: controls.chest.value, reading: trunk.chest.girth },
      { label: "underbust", input: controls.underbust.value, reading: trunk.underbust.girth },
      { label: "waist", input: controls.waist.value, reading: trunk.waist.girth },
      { label: "high hip", input: controls.highHip.value, reading: trunk.highHip.girth },
      { label: "hip", input: controls.hip.value, reading: trunk.hip.girth },
      { label: "neck base", input: controls.neckBase.value, reading: neck.base },
      { label: "neck", input: controls.neck.value, reading: neck.neck },
    ];
    const rows: IRow[] = [];

    for (let i: number = 0; i < tapes.length; i++)
      for (let j: number = i + 1; j < tapes.length; j++) {
        const a: ITape = tapes[i]!;
        const b: ITape = tapes[j]!;

        // A pair whose inputs are missing, close, or whose site the skin does
        // not show asks nothing here: a site not found is the identity row's
        // finding, and close inputs may read either way within the tolerance.
        if (a.input === null || b.input === null || Math.abs(a.input - b.input) <= CLEAR) continue;
        if (!Number.isFinite(a.reading) || !Number.isFinite(b.reading)) continue;

        const above: string = a.input > b.input ? a.label : b.label;
        const below: string = a.input > b.input ? b.label : a.label;
        const sign: number = a.input > b.input ? 1 : -1;

        rows.push({
          person: subject.name,
          site: `trunk tape order: ${above} over ${below} as the inputs say, mm`,
          value: sign * (a.reading - b.reading),
          low: 0,
          high: Infinity,
          unit: "mm",
        });
      }
    return rows;
  }
}
