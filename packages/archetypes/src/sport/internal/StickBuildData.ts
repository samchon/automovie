import { AutoMovieEngineVector3 } from "@automovie/engine";

export namespace StickBuildData {
  /*
   * The ice hockey stick read.
   */
  export const IIHF: string =
    "IIHF Official Rule Book 2026/27, Rule 10.1: no stick longer than 1.63 m from the heel to the end of the shaft, the blade at most 32.0 cm from the heel and 5.0 to 7.6 cm wide (https://test.rulebook.iihf.com/documents/rule-book-2026-27/10); the shaft at most 3 cm wide and 2.5 cm thick in the older Rule 222 (https://stats.iihf.com/hockey/rules/img/sec2.pdf)";

  /*
   * The field hockey stick read.
   */
  export const FIH: string =
    "FIH Rules of Hockey 2026, stick specifications 2.17 and 2.18: at most 105 cm from the top of the handle to the bottom of the head, at most 737 g, passing through a ring of 51 mm inside diameter; the head's open end limited by line C, 100 mm above line X (2.2, 2.8) (https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf)";

  /*
   * World Lacrosse Sixes stick lengths and head opening.
   */
  export const SIXES: string =
    "World Lacrosse Sixes Rules 2026–28, §2.2.1 (https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Sixes-Rule-Book_v2_0526.pdf)";

  /*
   * The cricket bat read.
   */
  export const MCC: string =
    "MCC Laws of Cricket, 2017 Code 3rd Edition 2022, Law 5, bat size limits: overall length at most 38 in (96.52 cm), width 4.25 in (10.8 cm), depth 2.64 in (6.7 cm), edges 1.56 in (4.0 cm), the handle at most 52% of the overall length (https://www.lords.org/getmedia/81bd1d01-c7e7-42f6-ac70-80473a050c32/Laws-of-Cricket-2017-Code-3rd-Edition-2022_1.docx)";

  /*
   * Local model points in metres.
   */
  export const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
}
