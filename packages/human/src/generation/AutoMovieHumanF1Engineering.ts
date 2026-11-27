import type {
  IAutoMovieHumanF1Engineering,
  IAutoMovieHumanF1NativeLaw,
} from "@automovie/interface";

/** Shared source-field conversion for the campaign's explicit engineering falsifiers. */
export namespace AutoMovieHumanF1Engineering {

  const ONE: IAutoMovieHumanF1Engineering.IRatios = { hip: 1, omphalion: 1, underbust: 1, bust: 1, neck: 1 };
  const KEYS: readonly (keyof IAutoMovieHumanF1Engineering.IRatios)[] = [
    "hip",
    "omphalion",
    "underbust",
    "bust",
    "neck",
  ];
  // Existing ANSUR engineering response, four-decimal coefficients:
  // packages/human/docs/work/provisional-statistical-response-priors.md
  // traces the exact SURVEY.female ANSUR1988 n2208 re-solve/rounding.
  // End-driver widths use ANSUR II n1986 except underbust1988; response
  // CV/beta use1988. rho .8483 is a delta-method ratio approximation,
  // not the observed chest-omphalion correlation or a held-all inverse.
  // test/src/reference-conics/FamilyConicLimbLaw.ts (survey correlations,
  // population/site tables and its step2/2.5 report), and the discarded
  // 042ffc7dec FamilyConicTrunkLaw.ts conditional-response record. Primary
  // survey definitions remain packages/human/docs/sources/ansur-ii.md and
  // ansur-1988-boundary-people.md; the mixed source protocols are qualified P.
  // Flexed
  // biceps/forearm and skin source sites have different protocols: P, not a
  // newly validated clinical regression or individual population inference.
  const CVS: readonly number[] = [0.0622, 0.1045, 0.0662, 0.07, 0.0484];
  const RESPONSES: readonly {
    name:
      | "upperArm"
      | "elbow"
      | "forearm"
      | "wrist"
      | "rootLeg"
      | "knee"
      | "calf";
    cv: number;
    beta: readonly number[];
  }[] = [
    {
      name: "upperArm",
      cv: 0.0807,
      beta: [0.361, 0.0439, 0.133, 0.1551, 0.2062],
    },
    {
      name: "elbow",
      cv: 0.0562,
      beta: [0.398, -0.0476, 0.1685, 0.0874, 0.3217],
    },
    {
      name: "forearm",
      cv: 0.0594,
      beta: [0.3054, -0.1302, 0.1306, 0.1383, 0.4021],
    },
    {
      name: "wrist",
      cv: 0.0455,
      beta: [0.315, -0.2287, 0.2412, -0.0013, 0.388],
    },
    {
      name: "rootLeg",
      cv: 0.0776,
      beta: [0.8463, -0.0043, -0.0401, 0.08, 0.066],
    },
    {
      name: "knee",
      cv: 0.0638,
      beta: [0.7491, -0.0481, 0.0622, -0.0935, 0.1568],
    },
    {
      name: "calf",
      cv: 0.0657,
      beta: [0.6549, -0.2382, 0.1821, 0.0033, 0.1226],
    },
  ];
  const scale = (size: IAutoMovieHumanF1NativeLaw.ISize, k: number): IAutoMovieHumanF1NativeLaw.ISize => ({
    depth: size.depth * k,
    breadth: size.breadth * k,
  });
  const copy = (f: IAutoMovieHumanF1NativeLaw.IFields): IAutoMovieHumanF1NativeLaw.IFields => ({
    ...f,
    wall: { ...f.wall },
    roots: { ...f.roots },
    arm: { ...f.arm },
    leg: { ...f.leg },
    extremities: { ...f.extremities },
    lengths: {
      ...f.lengths,
      phalanges: Object.fromEntries(
        Object.entries(f.lengths.phalanges).map(
          ([digit, bones]): [string, [number, number, number]] => [
            digit,
            [...bones],
          ],
        ),
      ),
    },
  });

  /*
   * Segment-length falsifiers: each long bone, the hand, the foot and the fingers' bones at 0.9 and 1.1 of F1's own
   * joint-centre length, one at a time and every limb length together. They are engineering ends of the length law
   * (`AutoMovieHumanF1NativeCourse`), not percentiles: ANSUR II women's acromion-radiale length is 311.2 mm with a
   * standard deviation of 17.2 and radiale-stylion 241.3 with 15.2 (`docs/sources/ansur-ii.md`), coefficients of
   * variation of 0.055 and 0.063, so a tenth is 1.6 to 1.8 standard deviations of a limb segment taken alone. Trunk
   * lengths are left out: the builder refuses them.
   */
  const LENGTH_RATIOS: readonly number[] = [0.9, 1.1];
  const LIMB_LENGTHS: readonly (
    | "upperArm"
    | "forearm"
    | "thigh"
    | "shank"
    | "handLength"
    | "handBreadth"
    | "footLength"
    | "footBreadth"
  )[] = [
    "upperArm",
    "forearm",
    "thigh",
    "shank",
    "handLength",
    "handBreadth",
    "footLength",
    "footBreadth",
  ];

  /*
   * The length cases' fields by case id, each a copy of the base with the named lengths scaled.
   */
  function lengthCases(base: IAutoMovieHumanF1NativeLaw.IFields): [string, IAutoMovieHumanF1NativeLaw.IFields][] {
    const out: [string, IAutoMovieHumanF1NativeLaw.IFields][] = [];
    for (const k of LENGTH_RATIOS) {
      for (const key of LIMB_LENGTHS) {
        const f: IAutoMovieHumanF1NativeLaw.IFields = copy(base);
        f.lengths[key] = base.lengths[key] * k;
        out.push(["length-" + key + "-" + k, f]);
      }
      const fingers: IAutoMovieHumanF1NativeLaw.IFields = copy(base);
      for (const bones of Object.values(fingers.lengths.phalanges))
        for (let b: number = 0; b < 3; ++b) bones[b] = bones[b]! * k;
      out.push(["length-phalanges-" + k, fingers]);
      const all: IAutoMovieHumanF1NativeLaw.IFields = copy(base);
      for (const key of LIMB_LENGTHS)
        if (key !== "handBreadth" && key !== "footBreadth")
          all.lengths[key] = base.lengths[key] * k;
      for (const bones of Object.values(all.lengths.phalanges))
        for (let b: number = 0; b < 3; ++b) bones[b] = bones[b]! * k;
      out.push(["length-limbs-" + k, all]);
    }
    return out;
  }

  /*
   * One explicitly selected converter response, before any part or loft.
   */
  function fieldsAt(
    base: IAutoMovieHumanF1NativeLaw.IFields,
    r: IAutoMovieHumanF1Engineering.IRatios,
    mode: "bust-only" | "all-site",
  ): IAutoMovieHumanF1NativeLaw.IFields {
    const f: IAutoMovieHumanF1NativeLaw.IFields = copy(base);
    if (mode === "all-site") {
      f.wall.hipSkin = scale(base.wall.hipSkin, r.hip);
      f.wall.omphalionWall = scale(base.wall.omphalionWall, r.omphalion);
      f.wall.underbustWall = scale(base.wall.underbustWall, r.underbust);
      f.wall.bustWall = scale(base.wall.bustWall, r.bust);
      f.wall.neckSkin = scale(base.wall.neckSkin, r.neck);
      f.roots.breast = scale(base.roots.breast, r.underbust);
    }
    for (const row of RESPONSES) {
      const k: number =
        1 +
        row.cv *
          row.beta.reduce(
            (sum: number, beta: number, j: number): number =>
              sum + (beta * (r[KEYS[j]!] - 1)) / CVS[j]!,
            0,
          );
      if (!(Number.isFinite(k) && k > 0))
        throw new Error(
          "conditional source response is nonpositive: " + row.name,
        );
      if (row.name === "rootLeg") f.roots.leg = scale(base.roots.leg, k);
      else if (row.name === "knee" || row.name === "calf")
        f.leg[row.name] = scale(base.leg[row.name], k);
      else f.arm[row.name] = scale(base.arm[row.name], k);
    }
    f.roots.arm = scale(
      base.roots.arm,
      f.arm.upperArm.depth / base.arm.upperArm.depth,
    );
    const wrist: number = f.arm.wrist.depth / base.arm.wrist.depth;
    f.extremities.hand = {
      ...base.extremities.hand,
      depth: base.extremities.hand.depth * wrist,
    };
    f.extremities.finger = {
      ...base.extremities.finger,
      depth: base.extremities.finger.depth * wrist,
    };
    return f;
  }

  /**
   * Resolve the original five tape-driven engineering cases and distinct direct-field falsifiers.
   *
   * A bust tape target is not converted: it needs a change of the breast mound, which is split between the trunk's
   * tape hull, two reliefs and a rigid cap and has no single representation yet. "bust-only" therefore stays
   * explicitly unavailable with that diagnostic, and "all-site" scales the wall calipers and the cap's base by
   * their site ratios, checks every wall tape, and records the bust tape as the one unmet, named check. No
   * projection is solved and no wall caliper is changed to meet a bust target.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Full-field wall depth/breadth responses and recorded conditional limb priors are explicit; a bust target is reported as an unmet named check, because no representation exists to convert it, while calipers and skeleton stay as supplied.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One request table feeds one resolver and one typed capture handoff; the supplied evaluator reads the same native forward definitions without another part/loft solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unconverted bust target stays explicit (unavailable for bust-only, a named residual for all-site). No caliper is relaxed, no margin is tuned, and combined site ends are not labelled a joint person percentile.
   * @evidence contracts/development/common.md#meaningful-documentation Names fixed input meanings, source-tape qualification, numerical tolerance and the separation of resolved fields from geometry acceptance.
   * @evidence contracts/development/implementation.md#efficient-algorithms A bounded case table with one tape reading per tape-driven case; each evaluator owns its native preparation cost, no whole skin is built here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One supplied F1 calibration/tape reading serves every request and remains immutable; the returned fields are the actual downstream capture inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the bounded case output and per-solve probes only; no source, reference file, global cache or process is owned.
   */
  export function resolve(
    base: IAutoMovieHumanF1NativeLaw.IFields,
    baseline: IAutoMovieHumanF1Engineering.IReading | null,
    measure: (fields: IAutoMovieHumanF1NativeLaw.IFields) => IAutoMovieHumanF1Engineering.IReading,
    tolerance: number,
  ): IAutoMovieHumanF1Engineering.IResolvedCase[] {
    if (!(Number.isFinite(tolerance) && tolerance > 0))
      throw new Error("source tape tolerance must be positive and finite");
    const qualification: string[] = [
      "F1 provisional bare native-source proxies; no clinical/posture equivalence is inferred.",
      "Original per-site survey ends are engineering falsifiers, not a joint whole-person percentile.",
      "Wall calipers are primary; girths are derived checks. The converter explicitly selects isotropic wall tissue for all-site and recorded conditional limb response; a bust tape target is not converted, because the breast mound has no single representation yet, and stays an unmet named check.",
      "Digit depth follows wrist as a qualified unsupported prior; foot/toe and ankle remain held without a survey relation.",
      "Mixed protocol response P: ANSURII n1986 endpoints except underbust1988, ANSUR1988 n2208 conditional CV/beta; .8483 is a delta-method ratio approximation, not observed correlation or a multivariate held-all inverse. See packages/human/docs/work/provisional-statistical-response-priors.md.",
      "Resolved fields are not operator, anatomical, crack or visual acceptance.",
    ];
    const out: IAutoMovieHumanF1Engineering.IResolvedCase[] = [];
    const direct = (
      id: string,
      fields: IAutoMovieHumanF1NativeLaw.IFields,
      mode: "f1" | "support" | "full-field",
    ): void => {
      out.push({
        id,
        fields,
        rawDrivers: {
          mode,
          ratios: { ...ONE },
          hipJointCentreBreadth: fields.hipJointCentreBreadth,
        },
        resolution: {
          status: "resolved",
          target: null,
          actual: null,
          residual: null,
          reason: null,
        },
        girthResiduals: null,
        qualification: [...qualification],
      });
    };
    direct("f1", copy(base), "f1");
    for (const [id, sign, mode] of [
      ["bust5", -1, "bust-only"],
      ["bust95", 1, "bust-only"],
      ["allsite5", -1, "all-site"],
      ["allsite95", 1, "all-site"],
    ] as const) {
      const ratios: IAutoMovieHumanF1Engineering.IRatios = { ...ONE };
      if (mode === "bust-only")
        ratios.bust =
          1 + sign * 1.645 * (82.7 / 946.9) * Math.sqrt(1 - 0.8483 ** 2);
      else {
        ratios.hip = 1 + sign * 1.645 * (75.9 / 1021.2);
        ratios.omphalion = 1 + sign * 1.645 * (99.9 / 860.9);
        ratios.underbust = 1 + sign * 1.645 * (51 / 769.7);
        ratios.bust = 1 + sign * 1.645 * (82.7 / 946.9);
        ratios.neck = 1 + sign * 1.645 * (19.2 / 329.8);
      }
      const fields: IAutoMovieHumanF1NativeLaw.IFields = fieldsAt(base, ratios, mode);
      const target: number | null =
        baseline === null ? null : baseline.girths.bust * ratios.bust;
      const item: IAutoMovieHumanF1Engineering.IResolvedCase = {
        id,
        fields,
        rawDrivers: {
          mode,
          ratios,
          hipJointCentreBreadth: fields.hipJointCentreBreadth,
        },
        resolution: {
          status: "unavailable",
          target,
          actual: null,
          residual: null,
          reason: "not evaluated",
        },
        girthResiduals: null,
        qualification: [
          ...qualification,
          "Published source statistics/rounded conditional coefficients follow the existing ANSUR engineering record; protocol substitutions stay provisional.",
        ],
      };
      if (baseline === null || target === null) {
        item.resolution.reason =
          "F1 source tape unavailable; no tape target or inverse is fabricated";
        out.push(item);
        continue;
      }
      try {
        // The bust target needs a change of the breast mound, which has no single representation yet: the
        // builder generates only F1's own projection, so the bust tape stays an unmet, named check.
        const missing: string =
          "bust girth target is unresolved: the breast mound has no single representation yet (trunk tape hull, reliefs and cap), so no projection is solved and the breast stays F1's";
        const got: IAutoMovieHumanF1Engineering.IReading = measure(fields);
        const residuals = Object.fromEntries(
          KEYS.map((key) => [
            key,
            got.girths[key] - baseline.girths[key] * ratios[key],
          ]),
        ) as IAutoMovieHumanF1Engineering.IRatios;
        item.girthResiduals = residuals;
        item.qualification.push(missing);
        if (mode === "bust-only")
          item.resolution = {
            status: "unavailable",
            target,
            actual: got.girths.bust,
            residual: got.girths.bust - target,
            reason: missing,
          };
        else {
          // All-site: a case is resolved only when every requested check holds, and the bust tape cannot, so
          // the case is infeasible with each unmet tape named.
          const unmet: string[] = KEYS.filter(
            (key): boolean => key !== "bust" && Math.abs(residuals[key]) > tolerance,
          );
          item.resolution = {
            status: "infeasible",
            target,
            actual: got.girths.bust,
            residual: got.girths.bust - target,
            reason:
              "unmet check: bust tape; " + missing +
              (unmet.length === 0 ? "" : "; also unmet with no caliper changed to compensate: " + unmet.join(", ")),
          };
        }
      } catch (error: unknown) {
        item.resolution = {
          status: "unavailable",
          target,
          actual: null,
          residual: null,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
      out.push(item);
    }
    for (const breadth of [193.28, 183.28, 203.28, 173.28, 213.28])
      direct(
        "support-" + breadth,
        { ...copy(base), hipJointCentreBreadth: breadth },
        "support",
      );
    for (const k of [0.8, 1.2]) {
      direct(
        "projection-" + k,
        { ...copy(base), breastProjection: base.breastProjection * k },
        "full-field",
      );
      const f = copy(base);
      for (const key of Object.keys(f.wall) as (keyof IAutoMovieHumanF1NativeLaw.IFields["wall"])[])
        if (key !== "headSkin") f.wall[key] = scale(f.wall[key], k);
      for (const key of Object.keys(f.roots) as (keyof IAutoMovieHumanF1NativeLaw.IFields["roots"])[])
        if (key !== "nose") f.roots[key] = scale(f.roots[key], k);
      direct("tissue-" + k, f, "full-field");
    }
    for (const sign of [-1, 1]) {
      const f = copy(base);
      let address: number = 0;
      for (const group of [f.wall, f.roots, f.arm, f.leg, f.extremities])
        for (const key of Object.keys(group)) {
          const record = group as Record<string, IAutoMovieHumanF1NativeLaw.ISize>;
          const size = record[key]!;
          const delta: number = sign * (0.02 + (0.02 * address++) / 20);
          record[key] = {
            depth: size.depth * (1 + delta),
            breadth: size.breadth * (1 - delta),
          };
        }
      f.hipJointCentreBreadth = base.hipJointCentreBreadth + sign * 7;
      direct("tagged-fields-" + (sign > 0 ? "plus" : "minus"), f, "full-field");
    }
    for (const [id, fields] of lengthCases(base))
      direct(id, fields, "full-field");
    return out;
  }
}
