
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core";

export namespace BallBuildData {
  /*
   * A diameter band from a rule's circumference limits, metres.
   */
  export const round = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(
      minimum / Math.PI,
      maximum / Math.PI,
      source,
      provisional,
    );

  /*
   * A mass band, kilograms.
   */
  export const kg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /*
   * IFAB, Laws of the Game, Law 2, the ball.
   */
  export const IFAB: string =
    "IFAB Laws of the Game, Law 2 (https://www.theifab.com/laws/latest/the-ball/)";

  /*
   * FIFA Futsal, size and mass range.
   */
  export const FUTSAL: string =
    "FIFA Futsal Laws of the Game 2025–26, Law 2 (https://www.stxref.org/wp-content/uploads/2025-26-FIFA-Futsal-LOTG.pdf)";

  /*
   * FIBA, Official Basketball Rules 2026, Basketball Equipment, Table 1.
   */
  export const FIBA: string =
    "FIBA Official Basketball Rules 2026, Basketball Equipment, 2.4 and Table 1, size 7 (https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-equipment-v1-0.pdf)";

  /*
   * FIVB, Official Volleyball Rules 2025-2028, rule 3.1.
   */
  export const FIVB: string =
    "FIVB Official Volleyball Rules 2025-2028, French edition, 3.1 (https://www.fivb.com/wp-content/uploads/2025/06/FIVB-Volleyball_Rules2025_2028-FR-v04.pdf)";

  /*
   * IHF, Ball Regulations, Article 2.1, size 3 with resin.
   */
  export const IHF: string =
    "IHF Technical Regulations, Ball Regulations, 9 December 2020, Article 2.1, size 3 with resin (https://www.ihf.info/sites/default/files/2025-02/13A%20-%20Ball%20Regulations_E.pdf)";

  /*
   * ITF, Rules of Tennis 2026, Appendix I, Types 1 and 2.
   */
  export const ITF: string =
    "ITF Rules of Tennis 2026, Appendix I, Types 1 and 2 (https://www.world.tennis/media/7221/2026-rules-of-tennis-english.pdf)";

  /*
   * ITTF 2026 Statutes, Law 2.3.
   */
  export const ITTF: string =
    "ITTF Statutes 2026, 2.3 (https://documents.ittf.sport/sites/default/files/public/2026-02/2026_Statutes_v1_consolidated_clean.pdf)";

  /*
   * ITTF acceptance mass interval for one ball, distinct from batch means.
   */
  export const ITTF_MASS: string =
    "ITTF Technical Leaflet T3, §B.1, individual ball mass (https://nttc.nl/wp-content/uploads/2015/05/ITTF_T3.pdf)";

  /*
   * FIP padel rules, ball specifications.
   */
  export const FIP: string =
    "FIP Rules of Padel, The Ball (https://www.padelfip.com/documents/)";

  /*
   * World Squash singles rules, double yellow dot ball.
   */
  export const WSF: string =
    "World Squash Singles Rules, Appendix 7 (https://worldsquashofficiating.com/rules-of-squash/)";

  /*
   * Official Baseball Rules 2024, rule 3.01.
   */
  export const OBR: string =
    "Official Baseball Rules 2024, rule 3.01 (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

  /*
   * The R&A Rules of Equipment, Part 4.
   */
  export const RANDA: string =
    "R&A Rules of Equipment, Part 4, 4.2 and 4.3 (https://www.randa.org/roe/the-rules-of-equipment/part-4-conformance-of-balls)";

  /*
   * MCC Laws of Cricket, Law 4, the men's ball.
   */
  export const MCC: string =
    "MCC Laws of Cricket, 2017 Code 3rd Edition 2022, Law 4, weight and size (https://www.lords.org/getmedia/81bd1d01-c7e7-42f6-ac70-80473a050c32/Laws-of-Cricket-2017-Code-3rd-Edition-2022_1.docx)";

  /*
   * USBC Equipment Specifications and Certifications Manual, bowling balls.
   */
  export const USBC: string =
    "USBC Equipment Specifications and Certifications Manual, bowling ball weight and physical specifications (https://bowl.com/getmedia/7b8b2ee2-cd3a-4fe1-ba31-1389d8fc9bbf/es_manual.pdf)";

  /*
   * World Rugby, Law 2.
   */
  export const RUGBY: string =
    "World Rugby Law 2: length in line 280 to 300 mm, circumference in width 580 to 620 mm (2015 edition, https://passport.world.rugby/media/i0ejgzmf/ball_pressure_en.pdf); 410 to 460 g (Law 2.3, https://passport.world.rugby/laws-of-the-game/laws-by-number/2-ball/)";

  /*
   * NFL Official Playing Rules 2026, Rule 2, Section 1.
   */
  export const NFL: string =
    "NFL Official Playing Rules 2026, Rule 2, Section 1: long axis 11 to 11 1/4 in, short circumference 21 to 21 1/4 in, 14 to 15 oz (https://static.www.nfl.com/image/upload/fl_attachment/league/tqivdkzt9mu6wdgsh1ku.pdf)";

  /*
   * IIHF Rule Book 2026/27, Rule 13.1, the puck.
   */
  export const PUCK: string =
    "IIHF Official Rule Book 2026/27, Rule 13.1: 2.5 cm thick, 7.6 cm in diameter, 156 to 170 g (https://test.rulebook.iihf.com/documents/rule-book-2026-27/13)";

  /*
   * FIH Rules of Hockey 2026, equipment specification 3.1.
   */
  export const FIH: string =
    "FIH Rules of Hockey 2026, equipment §3.1 (https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf)";

  /*
   * World Lacrosse Sixes 2026–28, ball specifications.
   */
  export const SIXES: string =
    "World Lacrosse Sixes Rules 2026–28, §2.1.1 (https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Sixes-Rule-Book_v2_0526.pdf)";

  /*
   * WPA equipment specifications for standard pool balls.
   */
  export const WPA: string =
    "WPA Recommended Equipment Specifications, Balls (https://www.wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

  /*
   * WBSC Fast Pitch Rules, completed 12-inch ball.
   */
  export const WBSC: string =
    "WBSC Official Rules of Softball, Fast Pitch 2026–2029, Appendix 3 B.1 (https://static.wbsc.org/uploads/federations/0/cms/documents/c4423d39-179f-04ec-9054-99f919b1f85b.pdf)";
}
