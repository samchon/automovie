import type {
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanParameters,
} from "@automovie/interface";
import {
  HumanPopulationAccess,
  HumanPopulationAnchors,
  HumanPopulationAudit,
  f1,
  f2,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The scenarios of
 * `test_unit_motions_executable_human_population_anchors_ratio`.
 */
namespace ScenarioHumanPopulationAnchorsRatio {
  /**
   * `HumanPopulationAnchors.ratio` carries a course the survey does not measure
   * by the surveyed measure nearest it: the mean, over the sex's reference
   * people, of the course over what the survey expects of its carrier given their
   * own inputs. A carrier that is itself given is expected at the reference's own
   * value.
   *
   * The reference women are `f1` and `f2`.
   *
   * Scenarios:
   *
   * 1. The thumb rides the hand length, given the hand length: the ratio is the two
   *    women's mean thumb over hand length.
   * 2. The head above nasion rides the head length, given the head length: the mean
   *    of their head height less face height over head length.
   * 3. Every anchor carries a positive ratio for both sexes.
   */
  export function test_unit_motions_executable_human_population_anchors_ratio(): void {
    const women: IAutoMovieHumanParameters[] = [f1, f2];
    const mean = (read: (p: IAutoMovieHumanParameters) => number): number =>
      women.reduce(
        (sum: number, p: IAutoMovieHumanParameters): number => sum + read(p),
        0,
      ) / women.length;

    // 1. The thumb.
    TestValidator.predicate(
      "the mean thumb over hand length",
      nclose(
        HumanPopulationAnchors.ratio(
          "female",
          HumanPopulationAnchors.ANCHORS.thumbLength,
        ),
        mean(
          (p: IAutoMovieHumanParameters): number =>
            p.extremities!.hands!.left.thumbLength /
            p.extremities!.hands!.left.handLength,
        ),
        1e-12,
      ),
    );

    // 2. The head above nasion.
    TestValidator.predicate(
      "the mean vertex-to-nasion over head length",
      nclose(
        HumanPopulationAnchors.ratio(
          "female",
          HumanPopulationAnchors.ANCHORS.vertexToNasion,
        ),
        mean(
          (p: IAutoMovieHumanParameters): number =>
            (p.head.height - p.head.faceHeight) / p.head.length,
        ),
        1e-12,
      ),
    );

    // 3. Every anchor.
    TestValidator.predicate(
      "every anchor positive",
      Object.values(HumanPopulationAnchors.ANCHORS).every(
        (anchor: HumanPopulationAnchors.IAnchor): boolean =>
          HumanPopulationAnchors.ratio("female", anchor) > 0 &&
          HumanPopulationAnchors.ratio("male", anchor) > 0,
      ),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_audit`. */
namespace ScenarioHumanPopulationAudit {
  /**
   * `HumanPopulationAudit.audit` lists every check of a person's inputs: each
   * declared body domain, the declared sex, each surveyed range once per side of
   * a paired input, and each population relation once per side, each relation's
   * band its sex's ANSUR 1988 mean plus and minus three deviations.
   *
   * The reference woman `f1` gives both hands, both feet and both ears. Her
   * natural waist is 673.627 mm and her hip 991.406 mm; women's waist over hip is
   * 0.7503 (SD 0.0431), and their cephalic index band runs from `77.23 - 3 *
   * 3.52` to `85.17 + 3 * 5.40`.
   *
   * Scenarios:
   *
   * 1. Her 23 declared domains are each read once.
   * 2. Audited as a woman her sex row reads 1; audited as a man, 0.
   * 3. Her waist-over-hip row reads her own ratio against the women's band.
   * 4. The cephalic index row carries the united band.
   * 5. Two hands, two feet and two ears give 34 range rows and 32 relation rows;
   *    without hands and feet the paired rows vanish, 24 and 20 remain.
   */
  export function test_unit_motions_executable_human_population_audit(): void {
    const rows: HumanPopulationAudit.IRow[] = HumanPopulationAudit.audit(
      "f1",
      "female",
      f1,
    );
    const count = (of: HumanPopulationAudit.IRow[], prefix: string): number =>
      of.filter((row: HumanPopulationAudit.IRow): boolean =>
        row.site.startsWith(prefix),
      ).length;
    const site = (
      of: HumanPopulationAudit.IRow[],
      name: string,
    ): HumanPopulationAudit.IRow =>
      of.find((row: HumanPopulationAudit.IRow): boolean => row.site === name)!;

    // 1. Domains.
    TestValidator.equals("one row per domain", count(rows, "domain: "), 23);

    // 2. The declared sex.
    TestValidator.equals(
      "the sex row",
      [
        site(rows, "sex declared on a female body").value,
        site(
          HumanPopulationAudit.audit("f1", "male", f1),
          "sex declared on a male body",
        ).value,
      ],
      [1, 0],
    );

    // 3. Waist over hip.
    const waist: HumanPopulationAudit.IRow = site(
      rows,
      "relation: natural waist / hip",
    );
    TestValidator.predicate(
      "her ratio against the women's band",
      nclose(waist.value, 673.6269910921733 / 991.406328716076, 1e-9) &&
        nclose(waist.low, 0.7503 - 3 * 0.0431, 1e-12) &&
        nclose(waist.high, 0.7503 + 3 * 0.0431, 1e-12),
    );

    // 4. The cephalic index.
    const cephalic: HumanPopulationAudit.IRow = site(
      rows,
      "relation: cephalic index",
    );
    TestValidator.predicate(
      "the united cephalic band",
      nclose(cephalic.low, 77.23 - 3 * 3.52, 1e-12) &&
        nclose(cephalic.high, 85.17 + 3 * 5.4, 1e-12),
    );

    // 5. Paired inputs.
    const bare: IAutoMovieHumanParameters = structuredClone(f1);
    delete bare.extremities;
    const plain: HumanPopulationAudit.IRow[] = HumanPopulationAudit.audit(
      "bare",
      "female",
      bare,
    );
    TestValidator.equals(
      "a row per side of a paired input",
      [
        count(rows, "surveyed female range: "),
        count(rows, "relation: "),
        count(plain, "surveyed female range: "),
        count(plain, "relation: "),
      ],
      [34, 32, 24, 20],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_ellipse`. */
namespace ScenarioHumanPopulationEllipse {
  /**
   * How far Ramanujan's first approximation may fall from the exact perimeter of
   * the 10 by 5 mm ellipse, mm: its truncation error leads with `-h³ / 512` of
   * `pi (a + b)`, `h = ((a - b) / (a + b))²` (Almkvist and Berndt 1988, Amer.
   * Math. Monthly 95:585), doubled here for the higher terms at `h = 1/9`.
   */
  const RAMANUJAN: number = (Math.PI * 15 * (1 / 9) ** 3) / 256;

  /**
   * `HumanPopulationAccess.ellipse` is Ramanujan's first approximation of an
   * ellipse's perimeter, `pi (3 (a + b) - sqrt((3a + b)(a + 3b)))`.
   *
   * Scenarios:
   *
   * 1. A circle of radius 10 mm has perimeter `20 pi` exactly.
   * 2. The 10 by 5 mm ellipse's perimeter is `40 E(sqrt(3) / 2)` = 48.4422411 mm
   *    (the complete elliptic integral of the second kind); the approximation
   *    falls short of it by its `h³ / 512` truncation error.
   * 3. The perimeter is symmetric in its semi-axes.
   */
  export function test_unit_motions_executable_human_population_ellipse(): void {
    TestValidator.predicate(
      "a circle and an ellipse",
      nclose(HumanPopulationAccess.ellipse(10, 10), 20 * Math.PI, 1e-12) &&
        nclose(HumanPopulationAccess.ellipse(10, 5), 48.4422411, RAMANUJAN) &&
        nclose(
          HumanPopulationAccess.ellipse(5, 10),
          HumanPopulationAccess.ellipse(10, 5),
          1e-12,
        ),
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_feet`. */
namespace ScenarioHumanPopulationFeet {
  /**
   * `HumanPopulationAccess.feet` reads a person's two feet, left then right, and
   * none when the inputs omit them.
   *
   * Scenarios:
   *
   * 1. The reference woman `f1` gives her left then her right foot, whose lengths
   *    differ by a hundredth of a micrometre.
   * 2. Without extremities there is no foot.
   */
  export function test_unit_motions_executable_human_population_feet(): void {
    const bare: IAutoMovieHumanParameters = structuredClone(f1);
    delete bare.extremities;
    TestValidator.equals(
      "two feet in order, or none",
      [HumanPopulationAccess.feet(f1), HumanPopulationAccess.feet(bare)],
      [[f1.extremities!.feet!.left, f1.extremities!.feet!.right], []],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_hands`. */
namespace ScenarioHumanPopulationHands {
  /**
   * `HumanPopulationAccess.hands` reads a person's two hands, left then right,
   * and none when the inputs omit them.
   *
   * Scenarios:
   *
   * 1. The reference woman `f1` gives her left then her right hand.
   * 2. Without extremities there is no hand.
   */
  export function test_unit_motions_executable_human_population_hands(): void {
    const bare: IAutoMovieHumanParameters = structuredClone(f1);
    delete bare.extremities;
    TestValidator.equals(
      "two hands, or none",
      [HumanPopulationAccess.hands(f1), HumanPopulationAccess.hands(bare)],
      [[f1.extremities!.hands!.left, f1.extremities!.hands!.right], []],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_measures`. */
namespace ScenarioHumanPopulationMeasures {
  /**
   * `HumanPopulationAccess.measures` resolves a person's body measures: a
   * supplied measure is kept as given.
   *
   * Scenarios:
   *
   * 1. The reference woman's supplied stature, waist and hip come back unchanged.
   */
  export function test_unit_motions_executable_human_population_measures(): void {
    const resolved: IAutoMovieHumanBodyMeasures =
      HumanPopulationAccess.measures(f1);
    TestValidator.equals(
      "the supplied measures",
      [
        resolved.stature,
        resolved.waistCircumference,
        resolved.hipCircumference,
      ],
      [1696.9285583496094, 673.6269910921733, 991.406328716076],
    );
  }
}

/** The scenarios of `test_unit_motions_executable_human_population_passes`. */
namespace ScenarioHumanPopulationPasses {
  /**
   * `HumanPopulationAudit.passes` admits a row whose value lies in its closed
   * band.
   *
   * Scenarios:
   *
   * 1. A value inside the band and one on each bound pass.
   * 2. A value just below the low bound or above the high bound fails.
   */
  export function test_unit_motions_executable_human_population_passes(): void {
    const row = (value: number): HumanPopulationAudit.IRow => ({
      person: "p",
      site: "s",
      value,
      low: 1,
      high: 2,
      unit: "mm",
    });
    TestValidator.equals(
      "inside, on the bounds and outside",
      [1.5, 1, 2, 0.999, 2.001].map((value: number): boolean =>
        HumanPopulationAudit.passes(row(value)),
      ),
      [true, true, true, false, false],
    );
  }
}

/**
 * The `human_population_audit` family's own logic, one scenario group per
 * namespace above: each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_human_population_audit(): void {
  ScenarioHumanPopulationAnchorsRatio.test_unit_motions_executable_human_population_anchors_ratio();
  ScenarioHumanPopulationAudit.test_unit_motions_executable_human_population_audit();
  ScenarioHumanPopulationEllipse.test_unit_motions_executable_human_population_ellipse();
  ScenarioHumanPopulationFeet.test_unit_motions_executable_human_population_feet();
  ScenarioHumanPopulationHands.test_unit_motions_executable_human_population_hands();
  ScenarioHumanPopulationMeasures.test_unit_motions_executable_human_population_measures();
  ScenarioHumanPopulationPasses.test_unit_motions_executable_human_population_passes();
}
