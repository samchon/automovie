import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createHorse } from "./createHorse";

/** Measured warmbloods. */
const JENSEN: string =
  "Jensen et al. 2019, Acta Vet Scand 61, Table 2, 38 adult warmbloods (https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML)";

/** Stirrup leather lengths by rider height. */
const LEATHERS: string =
  "half of the 1.15 to 1.55 m stirrup leathers Kingdom Equestrian lists by rider height (https://www.kingdomequestrian.co.uk/blogs/help-advice/stirrup-leather-buying-guide); how a leather's length becomes the tread's drop is an estimate";

/**
 * The band of each free dimension of a saddle horse, with the source it was read at; `createHorse.BANDS` is this table.
 */
export const HORSE_BANDS: Readonly<
  Record<createHorse.Dimension, IArchetypeBand>
> = {
  withersHeight: ArchetypeBand.metres(
    1.58,
    1.8,
    `${JENSEN}: height at withers 172 cm, range 158 to 180`,
  ),
  mass: ArchetypeBand.of(
    "kg",
    478,
    718,
    `${JENSEN}: body mass 640 kg, range 478 to 718`,
  ),
  girth: ArchetypeBand.metres(
    1.89,
    2.13,
    `${JENSEN}: heart girth at the withers 204 cm, range 189 to 213`,
  ),
  seatSize: ArchetypeBand.metres(
    0.406,
    0.457,
    "Wintec saddle seat sizes, 16 to 18 in from the saddle nail to the middle of the cantle (https://wintec-saddles.com.au/pages/measuring-your-seat-size)",
  ),
  stirrupDrop: ArchetypeBand.metres(0.575, 0.775, LEATHERS, true),
  stirrupWidth: ArchetypeBand.metres(
    0.11,
    0.13,
    "stirrup tread widths of 110 to 130 mm by boot size, a Kingdom Equestrian chart seen only in search results",
    true,
  ),
  reinWidth: ArchetypeBand.metres(
    0.0159,
    0.0191,
    "Dover Saddlery, snaffle reins 5/8 and 3/4 in wide (https://www.doversaddlery.com/pages/reins-for-english-riding-disciplines)",
  ),
  tempo: ArchetypeBand.of(
    "",
    -1,
    1,
    "one standard deviation of stride time either side of the mean, Robilliard, Pfau and Wilson 2007, Tables 2 and 3 (https://journals.biologists.com/jeb/article/210/2/187/17107/Gait-characterisation-and-classification-in-horses)",
  ),
};
