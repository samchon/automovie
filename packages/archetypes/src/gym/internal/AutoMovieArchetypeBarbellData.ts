
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core/index";

export namespace AutoMovieArchetypeBarbellData {
  /*
   * The rule that fixes a competition barbell.
   */
  export const IWF: string =
    "International Weightlifting Federation, Technical and Competition Rules and Regulations, the rules on the barbell: the men's bar 20 kg, 2200 mm long, 28 mm across its grip; the women's bar 15 kg, 2010 mm long, 25 mm across its grip; both 1310 mm between the inner collars with sleeves 50 mm across; the largest discs 450 mm across";

  /*
   * The hands' spacing: from a clean's grip to a snatch's. An estimate, not
   * read at a source.
   */
  export const GRIP: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.4,
    1.2,
    "an estimate: from a grip a little wider than the shoulders to a snatch grip near the collars",
    true,
  );

  /*
   * The load on each side. An estimate of the range a film stages, not a rule.
   */
  export const LOAD: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "kg",
    0,
    100,
    "an estimate of the range a scene loads; the rule's heaviest disc is 25 kg and a side takes several",
    true,
  );
}
