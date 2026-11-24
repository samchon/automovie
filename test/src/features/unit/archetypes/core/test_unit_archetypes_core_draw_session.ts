import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
  type IAutoMovieArchetypeBand,
  createSki,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** A made-up producer's dimensions. */
type Dimension = "length" | "width" | "mass";

/** The made-up dimensions' units. */
const UNITS: Readonly<Record<Dimension, AutoMovieArchetypeDrawSession.Unit>> = {
  length: "m",
  width: "m",
  mass: "kg",
};

/** Made-up bands for the drawn dimensions. */
const BANDS: Readonly<Record<"width" | "mass", IAutoMovieArchetypeBand>> = {
  width: AutoMovieArchetypeBand.metres(0.1, 0.2, "made up"),
  mass: AutoMovieArchetypeBand.of("kg", 1, 2, "made up"),
};

/** Made-up sizes, each with its length. */
const SIZES: Readonly<
  Record<"short" | "long", Readonly<Partial<Record<Dimension, number>>>>
> = {
  short: { length: 1 },
  long: { length: 2 },
};

/**
 * A draw session records where every value it gives came from, and the archetype a builder makes from it carries that record.
 *
 * Scenarios:
 * 1. Over 50 seeds, every dimension a session draws is in its values with the very band it was drawn in, inside that band, and the same seed gives the same values.
 * 2. A model picked on an axis puts its figures in the values, with no band, its name under the axis and each figure under that axis, every value with its dimension's declared unit; a variant without models records no pick; a band in a unit other than its dimension's is a producer's defect and throws.
 * 3. An archetype built from a session carries the session's values as its dimensions and its provenance, and an articulated copy keeps both.
 * 4. A real producer records its own picks and bands: a ski's provenance names the size its length came from, among LINE's four, and gives its thickness the band ``createSki.BANDS`` declares.
 */
export function test_unit_archetypes_core_draw_session(): void {
  const findings: string[] = [];

  // 1. Drawn values with their bands.
  for (let seed: number = 0; seed < 50; seed++) {
    const draw: AutoMovieArchetypeDrawSession<Dimension> =
      new AutoMovieArchetypeDrawSession<Dimension>("thing", UNITS, seed);
    const drawn: Record<"width" | "mass", number> = draw.dimensions(BANDS);
    const again: Record<"width" | "mass", number> =
      new AutoMovieArchetypeDrawSession<Dimension>(
        "thing",
        UNITS,
        seed,
      ).dimensions(BANDS);
    for (const name of ["width", "mass"] as const) {
      const band: IAutoMovieArchetypeBand | undefined =
        draw.provenance.bands[name];
      if (band !== BANDS[name])
        findings.push(`seed ${seed}: ${name} is not recorded with its band`);
      if (draw.values[name] !== drawn[name] || again[name] !== drawn[name])
        findings.push(`seed ${seed}: ${name} is not one value`);
      if (
        !(
          drawn[name] >= BANDS[name].minimum &&
          drawn[name] <= BANDS[name].maximum
        )
      )
        findings.push(
          `seed ${seed}: ${name} ${drawn[name]} lies outside its band`,
        );
    }
  }

  // 2. A picked model's figures and name.
  const draw: AutoMovieArchetypeDrawSession<Dimension> =
    new AutoMovieArchetypeDrawSession<Dimension>("thing", UNITS, 3);
  draw.dimensions(BANDS);
  const size: AutoMovieArchetypeDrawSession.IModel<
    "short" | "long",
    Dimension
  > = draw.model<"short" | "long">("size", undefined, SIZES);
  draw.model("finish", undefined, {});
  if (
    size.name === undefined ||
    draw.values.length !== SIZES[size.name].length ||
    draw.provenance.models.size !== size.name ||
    draw.provenance.figures.length !== "size" ||
    draw.provenance.units.length !== "m" ||
    draw.provenance.units.mass !== "kg"
  )
    findings.push("a picked model's figures or name went unrecorded");
  if (draw.provenance.bands.length !== undefined)
    findings.push("a model's figure was given a band");
  if (Object.hasOwn(draw.provenance.models, "finish"))
    findings.push("an axis without models recorded a pick");
  try {
    new AutoMovieArchetypeDrawSession<Dimension>("thing", UNITS, 3).dimensions({
      width: AutoMovieArchetypeBand.of("kg", 1, 2, "made up"),
    });
    findings.push("a band in another unit than its dimension's was drawn");
  } catch (error) {
    if (error instanceof AutoMovieArchetypeRefusal || !(error instanceof Error))
      findings.push(
        "a band in another unit was not thrown as a producer's defect",
      );
  }

  // 3. The archetype carries the record, posed or not.
  const built: ReturnType<
    AutoMovieArchetypeBuilder<"top", Dimension>["build"]
  > = new AutoMovieArchetypeBuilder<"top", Dimension>({
    material: "steel",
    name: "thing",
    draw,
  })
    .box("block", Vector3.create(0.1, 0.1, 0.1), Vector3.create(0, 0.05, 0))
    .build(1);
  if (
    JSON.stringify(built.dimensions) !== JSON.stringify(draw.values) ||
    JSON.stringify(built.provenance) !== JSON.stringify(draw.provenance)
  )
    findings.push("the archetype does not carry its session's record");
  if (
    JSON.stringify(built.articulate({}).provenance) !==
    JSON.stringify(built.provenance)
  )
    findings.push("an articulated archetype dropped its record");

  // 4. A real producer's record.
  const ski: ReturnType<typeof createSki> = createSki({}, 5);
  const picked: string | undefined = ski.provenance.models.size;
  if (
    picked === undefined ||
    !(picked in createSki.LENGTHS) ||
    ski.dimensions.length !==
      createSki.LENGTHS[picked as createSki.Length].length
  )
    findings.push(`the ski's length is not recorded from its size, ${picked}`);
  if (ski.provenance.bands.thickness !== createSki.BANDS.thickness)
    findings.push("the ski's thickness is not recorded with its band");

  TestValidator.equals(
    "a session records where every value came from",
    findings,
    [],
  );
}
