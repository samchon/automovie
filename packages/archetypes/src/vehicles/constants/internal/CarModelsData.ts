import { AutoMovieArchetypeUnits } from "../../../core";
import type { AutoMovieArchetypeCar } from "../../AutoMovieArchetypeCar";

/*
 * The hatchbacks, read at their maker's specification pages.
 */
export const HONDA: string =
  "Honda UK specifications (https://www.honda.co.uk/cars/new/jazz-hybrid/specifications.html, https://www.honda.co.uk/cars/new/civic-hybrid/specifications.html)";

/*
 * The sedans, read at a secondary source: one search for each maker's sheet
 * found none.
 */
export const TOYOTA: string =
  "the Toyota Corolla (E210) saloon and Camry (XV70) infoboxes, secondary: one search for each maker's sheet found none (https://en.wikipedia.org/wiki/Toyota_Corolla_(E210), https://en.wikipedia.org/wiki/Toyota_Camry_(XV70))";

/*
 * The short van, read at its maker's technical specification.
 */
export const TRANSIT: string =
  "Ford Transit Custom 2023 technical specification, L1H1 van, p. 3 (https://www.fordpers.be/content/documents/news/2023/2023_10_09_transit_custom_2023_technical_specification_eu.pdf)";

/*
 * The long van, read at a dealer's guide only: one search for the maker's sheet
 * found none.
 */
export const TRANSIT_LONG: string =
  "the vansdirect.co.uk sizing guide's L2 H1 Transit Custom, secondary: one search for Ford's L2 sheet found none (https://www.vansdirect.co.uk/load-sizing-guide/ford-transit-custom-dimensions/)";

/*
 * A tyre's outer diameter from its size (`AutoMovieArchetypeUnits.tyre`).
 */
export const tyre: typeof AutoMovieArchetypeUnits.tyre = AutoMovieArchetypeUnits.tyre;

/*
 * The Jazz's body, every grade's but the Crosstar's: 4089 x 1694 x 1526 mm on a
 * 2517 mm wheelbase.
 */
export const JAZZ: Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>> =
  {
    length: 4.089,
    width: 1.694,
    height: 1.526,
    wheelbase: 2.517,
  };

/*
 * The Civic's body, every grade's: 4560 x 1802 x 1408 mm on a 2734 mm
 * wheelbase.
 */
export const CIVIC: Readonly<
  Partial<Record<AutoMovieArchetypeCar.Dimension, number>>
> = {
  length: 4.56,
  width: 1.802,
  height: 1.408,
  wheelbase: 2.734,
};

/*
 * The Transit Custom's front overhang, metres: 958 mm from the front of the van
 * to the front wheels' centre, CarExpert's MK3 listings and a Ford brochure
 * seen in search results, secondary; with the 992 mm rear overhang it closes
 * both bodies exactly, 958 + 3,100 + 992 = 5,050 mm and 958 + 3,500 + 992 =
 * 5,450 mm.
 */
export const TRANSIT_NOSE: number = 0.958;

/*
 * The Transit Custom L1's read figures, the L2's load length being derived from
 * them: Ford's specification, p. 3.
 */
export const TRANSIT_L1: Readonly<
  Partial<Record<AutoMovieArchetypeCar.Dimension, number>>
> = {
  length: 5.05,
  width: 2.032,
  wheelbase: 3.1,
  frontOverhang: TRANSIT_NOSE,
  mass: 1892,
  loadLength: 2.394,
};

/*
 * The Transit Custom L2's overall length, metres: the dealer's guide's 5,450
 * mm.
 */
export const TRANSIT_L2_LENGTH: number = 5.45;

/*
 * The Transit Custom's tyres: 215/65 R16C on its standard wheels, 215/60 R17C
 * on its optional ones (p. 2).
 */
export const TRANSIT_TYRES: Readonly<
  Partial<
    Record<
      AutoMovieArchetypeCar.Tyre,
      Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>
    >
  >
> = {
  r16c: { wheelDiameter: tyre(215, 65, 16) },
  r17c: { wheelDiameter: tyre(215, 60, 17) },
};

/*
 * The Ranger's tyres, by wheel option rather than drive: 255/70R17 on the
 * 17-inch wheels, 255/65R18 on the 18-inch (p. 2).
 */
export const RANGER_TYRES: Readonly<
  Partial<
    Record<
      AutoMovieArchetypeCar.Tyre,
      Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>
    >
  >
> = {
  r17: { wheelDiameter: tyre(255, 70, 17) },
  r18: { wheelDiameter: tyre(255, 65, 18) },
};
