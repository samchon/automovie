export namespace StationeryDrawData {
  /*
   * Book trim sizes: a print service's list, and the UK paperback formats from a
   * secondary source.
   */
  export const BOOK: string =
    "Amazon KDP print options, trim sizes 12.7 x 20.32 cm to 15.6 x 23.39 cm (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6); the smaller end is the UK A-format paperback, 110 x 178 mm (Wikipedia, Book size, https://en.wikipedia.org/wiki/Book_size)";

  /*
   * Book thickness from a page count and a paper caliper, neither read at a
   * primary source.
   */
  export const THICKNESS: string =
    "150 to 650 pages inside the 24 to 828 page range of Amazon KDP (https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6) at about 0.06 mm per page, a printer's spine formula seen only in search results";

  /*
   * Office paper sizes from a secondary source.
   */
  export const PAPER: string =
    "ISO 216 A4, 210 x 297 mm, and US Letter, 216 x 279 mm (Wikipedia, Paper size, https://en.wikipedia.org/wiki/Paper_size)";

  /*
   * A ballpoint pen from a secondary source, with the precision handle band.
   */
  export const PEN: string =
    "BIC Cristal, 14.45 cm without and 14.9 cm with its cap (Wikipedia, Bic Cristal, https://en.wikipedia.org/wiki/Bic_Cristal); barrel inside the 6 to 13 mm precision handle band of NIOSH 2004-164 (https://www.cdc.gov/niosh/docs/2004-164/pdfs/2004-164.pdf)";

  /*
   * Michelin's folded road map: its folded size read at the maker, its thickness
   * and mass seen only in listings.
   */
  export const MAP: string =
    "Michelin regional map, folded 11 x 25 cm (https://boutique.laventure.michelin.com/en/product/ouest-france-map-of-calvados-michelin/); 0.7 cm thick and 89 to 90 g, Michelin maps 333, 585 and 707 seen only in search results";
}
