import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandEnds } from "../../internal/archetypeBandEnds";
import { archetypeCatalog } from "../../internal/archetypeCatalog";

/**
 * Every band of every catalog archetype holds a working form at both of its
 * ends: settable, unbroken, and changing the rest geometry it describes.
 *
 * `archetypeBandEnds` builds each row at its seedless middle and at each band's
 * two ends, one dimension at a time, and reports an end that is not settable,
 * broken (a throw, a failed `validateModel`, a part without area, or a part
 * that detached from the form), coupled to another dimension's refusal, or
 * inert. Inert ends of dimensions that move no rest geometry by design, and
 * dimensions a producer's params do not accept, are allow-listed with their
 * reasons; an entry that no longer matches a finding fails the test, so the
 * lists only shrink.
 *
 * Scenarios:
 *
 * 1. A made stool whose leg stands 0.01 m below its seat at the top of its
 *    `legLength` band reports that end broken, its leg detached from the seat,
 *    and no finding at the band's lower end.
 * 2. A made stool that draws a `flare` band but never uses it reports both of the
 *    band's ends inert.
 * 3. A made stool whose params never reach its draw reports both ends of its
 *    `legLength` band not settable, and neither of them inert.
 * 4. Every catalog row has no broken or coupled end, every inert end is on the
 *    inert allow-list and every not-settable end on the not-settable
 *    allow-list, and every allow-list entry still matches a finding.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds every producer at the ends of each of its bands through the catalog's own `create` and judges the built forms: model admission, positive part area, part contacts against the middle, and placed vertex movement. It catches a band end that throws, an end that detaches a part, a band that changes no geometry and a band the params cannot reach; it allows a coarse form's incidental crossings to end inside a band, as long as every part stays joined to the form.
 * @evidence contracts/development/testing.md#independent-expectations The oracle is the band contract itself (`IAutoMovieArchetypeBand`: every value inside the band is a working form of that dimension), the engine's admission and contact report, which archetypes do not own, and #4071's thresholds: a 1e-6 m contact distance and a 1e-9 m vertex tolerance. The made producers' expected findings follow from their stated construction, not from the walk's output. Limit: an end whose part vanished from the form is not measured for detachment, since a count band removes parts by design.
 * @evidence contracts/development/testing.md#distinguishing-cases A detached part, an unused band and an unreachable band are each proved red on a made producer, with the clean lower end of the detaching band as the adjacent negative. The catalog sweep covers every row's every band with a nonzero width; zero-width bands are standards and have no ends to drive. Seeded draws inside the bands belong to `test_archetype_contract_valid`, and each family's cited band values to its family tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios, the made producers' constructions and each allow-list's reasons.
 */
export function test_archetype_contract_band_ends(): void {
  // 1. A leg that stands 0.01 m below its seat at the top of its band detaches.
  const detached: archetypeBandEnds.IFinding[] = archetypeBandEnds({
    name: "stool-detached",
    create: (_seed?: number | string, dimensions?: Dimensions) =>
      stool({ ...dimensions }, "drop"),
  });
  TestValidator.equals(
    "a leg below its seat at the band's top detaches",
    detached.map(
      (f: archetypeBandEnds.IFinding): string =>
        `${f.dimension} ${f.end} ${f.kind}`,
    ),
    ["legLength maximum broken"],
  );
  TestValidator.predicate(
    "the detached pair is the leg and the seat",
    detached[0]?.detail.startsWith("seat detached from leg") === true ||
      detached[0]?.detail.startsWith("leg detached from seat") === true,
  );

  // 2. A band drawn but never used is inert at both ends.
  TestValidator.equals(
    "an unused band is inert",
    archetypeBandEnds({
      name: "stool-inert",
      create: (_seed?: number | string, dimensions?: Dimensions) =>
        stool({ ...dimensions }, "flare"),
    }).map(
      (f: archetypeBandEnds.IFinding): string =>
        `${f.dimension} ${f.end} ${f.kind}`,
    ),
    ["flare minimum inert", "flare maximum inert"],
  );

  // 3. A dimension the params never reach is not settable, and only that.
  TestValidator.equals(
    "a band the params cannot reach is not settable and not inert",
    archetypeBandEnds({
      name: "stool-unsettable",
      create: (_seed?: number | string, dimensions?: Dimensions) =>
        stool({ ...dimensions }, "deaf"),
    }).map(
      (f: archetypeBandEnds.IFinding): string =>
        `${f.dimension} ${f.end} ${f.kind}`,
    ),
    ["legLength minimum not settable", "legLength maximum not settable"],
  );

  // 4. The catalog: every finding is fixed or allow-listed, and no entry is stale.
  const findings: archetypeBandEnds.IFinding[] = archetypeCatalog().flatMap(
    (row: archetypeCatalog.IRow): archetypeBandEnds.IFinding[] =>
      archetypeBandEnds(row),
  );
  const excused: (
    list: readonly IAllowed[],
    finding: archetypeBandEnds.IFinding,
  ) => boolean = (
    list: readonly IAllowed[],
    finding: archetypeBandEnds.IFinding,
  ): boolean =>
    list.some(
      (entry: IAllowed): boolean =>
        entry.rows.test(finding.row) && entry.dimension === finding.dimension,
    );
  TestValidator.equals(
    "every band end is a working, responsive form",
    findings
      .filter(
        (f: archetypeBandEnds.IFinding): boolean =>
          !(f.kind === "inert" && excused(INERT, f)) &&
          !(f.kind === "not settable" && excused(UNSETTABLE, f)),
      )
      .map(
        (f: archetypeBandEnds.IFinding): string =>
          `${f.row} ${f.dimension} ${f.end} ${f.kind}: ${f.detail}`,
      ),
    [],
  );
  const stale: (
    list: readonly IAllowed[],
    kind: archetypeBandEnds.Kind,
  ) => string[] = (
    list: readonly IAllowed[],
    kind: archetypeBandEnds.Kind,
  ): string[] =>
    list
      .filter(
        (entry: IAllowed): boolean =>
          !findings.some(
            (f: archetypeBandEnds.IFinding): boolean =>
              f.kind === kind &&
              entry.rows.test(f.row) &&
              entry.dimension === f.dimension,
          ),
      )
      .map((entry: IAllowed): string => `${entry.rows} ${entry.dimension}`);
  TestValidator.equals(
    "every inert allow-list entry still matches an inert end",
    stale(INERT, "inert"),
    [],
  );
  TestValidator.equals(
    "every not-settable allow-list entry still matches an unsettable end",
    stale(UNSETTABLE, "not settable"),
    [],
  );
}

/** Dimension values fixed on a made producer. */
type Dimensions = archetypeCatalog.Dimensions;

/**
 * One allow-listed dimension: the rows it covers, the dimension and why its
 * finding is accepted.
 */
interface IAllowed {
  /** The rows the entry covers. */
  rows: RegExp;

  /** The dimension whose finding is accepted. */
  dimension: string;

  /** Why the finding is accepted. */
  reason: string;
}

/**
 * Inert dimensions that move no rest geometry by design: an articulation's
 * limit or ratio, a mass or timing property, an affordance's place, or a figure
 * the seedless middle's read model supersedes.
 */
const INERT: readonly IAllowed[] = [
  {
    rows: /^door-hinged-/,
    dimension: "latchTurn",
    reason:
      "the latch's turn is an articulation's limit; the latch rests undrawn",
  },
  {
    rows: /^window-(hung|sliding)$/,
    dimension: "travel",
    reason: "the sash's run is an articulation's limit; the sash rests closed",
  },
  {
    rows: /^switch-(rocker|button)$/,
    dimension: "travel",
    reason: "how far the face is pressed is an articulation's limit",
  },
  ...(
    ["doorSwing", "bonnetSwing", "bootSwing", "recline", "pedalTravel"] as const
  ).map(
    (dimension: string): IAllowed => ({
      rows: /^car-/,
      dimension,
      reason:
        "an opening's, a back's or a pedal's widest travel is an articulation's limit; each rests closed, upright or released",
    }),
  ),
  ...(["steeringRatio", "lockTurns"] as const).map(
    (dimension: string): IAllowed => ({
      rows: /^car-/,
      dimension,
      reason:
        "how the road wheels follow the steering wheel sets articulation ranges, not rest geometry",
    }),
  ),
  {
    rows: /^cart-cart$/,
    dimension: "clearance",
    reason:
      "clearance sets the shafts' length only where the read model gives none; the seedless middle's first model reads its shafts",
  },
  {
    rows: /^(horse|pony|donkey|mule)$/,
    dimension: "breechingDrop",
    reason:
      "the breeching's seat applies in harness; the catalog's bare equid wears no breeching",
  },
  {
    rows: /^(horse|ox|camel|deer|pony|donkey|mule)$/,
    dimension: "tempo",
    reason: "stride timing moves no rest geometry",
  },
  {
    rows: /^cannon-fieldGun$/,
    dimension: "recoil",
    reason: "the carriage's run back on firing is an articulation's limit",
  },
  {
    rows: /^cannon-navalGun$/,
    dimension: "ball",
    reason: "the shot's diameter is a launch figure; the gun carries no shot",
  },
  {
    rows: /^siegeEngine-/,
    dimension: "winchRatio",
    reason: "the windlass's turns per arm turn is an articulation ratio",
  },
  {
    rows: /^longGun-shotgun$/,
    dimension: "travel",
    reason: "the pump's slide is an articulation's limit",
  },
  {
    rows: /^longGun-/,
    dimension: "sightHeight",
    reason: "the sight line places an affordance; no sight part is modelled",
  },
  {
    rows: /^sword-/,
    dimension: "balance",
    reason: "the point of balance is a mass property",
  },
  {
    rows: /^rock-/,
    dimension: "gravity",
    reason: "specific gravity is a density, a mass property",
  },
  {
    rows: /^tree-/,
    dimension: "moisture",
    reason: "the green wood's moisture is a mass property",
  },
  ...(["hold", "spacing"] as const).map(
    (dimension: string): IAllowed => ({
      rows: /^vaultingPole$/,
      dimension,
      reason: "the hands' places are grip affordances on the pole",
    }),
  ),
  {
    rows: /^instrument-uprightPiano$/,
    dimension: "dip",
    reason: "a key's dip is an articulation's limit; the keys rest up",
  },
];

/** Dimensions a producer's params do not accept, with why; none today. */
const UNSETTABLE: readonly IAllowed[] = [];

/** The made stool's band source. */
const MADE: string = "a made stool of this test, not read at a source";

/**
 * A made stool of one seat on one leg, in one of three variants:
 *
 * - `drop`: the leg's top stands 0.01 m below the seat at the top of its
 *   `legLength` band and meets it everywhere else;
 * - `flare`: it also draws a `flare` band of 0 to 10 degrees and never uses it;
 * - `deaf`: its draw ignores the params, so no dimension can be fixed.
 *
 * The seat is a 0.4 m square 0.05 m thick whose underside stands at
 * `legLength`; the leg is a 0.05 m square post from the floor to the seat.
 */
function stool(
  params: Dimensions,
  variant: "drop" | "flare" | "deaf",
): AutoMovieArchetype {
  const bands: Readonly<
    Record<"legLength" | "flare", IAutoMovieArchetypeBand>
  > = {
    legLength: AutoMovieArchetypeBand.metres(0.4, 0.5, MADE),
    flare: AutoMovieArchetypeBand.of("degrees", 0, 10, MADE),
  };
  const draw: AutoMovieArchetypeDrawSession<"legLength" | "flare"> =
    new AutoMovieArchetypeDrawSession<"legLength" | "flare">(
      `stool-${variant}`,
      { legLength: "m", flare: "degrees" },
      undefined,
      variant === "deaf" ? {} : params,
    );
  const d: Partial<Record<"legLength" | "flare", number>> = draw.dimensions(
    variant === "flare" ? bands : { legLength: bands.legLength },
  );
  const seat: number = d.legLength!;
  const top: number =
    variant === "drop" && seat === bands.legLength.maximum ? seat - 0.01 : seat;
  const builder: AutoMovieArchetypeBuilder<"top", "legLength" | "flare"> =
    new AutoMovieArchetypeBuilder<"top", "legLength" | "flare">({
      material: "wood",
      name: "made stool",
      draw,
    });
  builder.box(
    "seat",
    Vector3.create(0.4, 0.05, 0.4),
    Vector3.create(0, seat + 0.025, 0),
  );
  builder.box(
    "leg",
    Vector3.create(0.05, top, 0.05),
    Vector3.create(0, top / 2, 0),
  );
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, seat + 0.05, 0)),
    extent: [
      Vector3.create(-0.2, 0, -0.2),
      Vector3.create(0.2, 0, -0.2),
      Vector3.create(0.2, 0, 0.2),
      Vector3.create(-0.2, 0, 0.2),
    ],
  });
  return builder.build(3);
}
