import { AutoMovieArchetypeProjectile } from "@automovie/archetypes";
import { AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Each projectile carries the flight data its outcome needs, where a source gave it, and an arrow flies point first.
 *
 * Scenarios, for every read object of every kind, and each kind without one at its seedless draw:
 * 1. The model passes `validateModel`, its drag and contact admitted.
 * 2. Each kind flies and ends as the issue's table, written here, states: an arrow and a bolt along their velocity and sticking, a round shot free and bouncing, a ball free and sticking, a grenade free and rolling, a stone free and bouncing.
 * 3. A kind that bounces or rolls by that table carries the 0.30 restitution of a sphere on soil (Benoît et al. 2022); a sticking kind carries its depth in wood, a musket ball's ¾ in (Scott et al. 2017) and an arrow's 2 in (Pope 1923), except the crossbow bolt, whose depth no source read gave.
 * 4. A sphere's and a stone's drag coefficient is 0.47 (Collins, on Miller and Bailey 1979) and its reference area its cross-section, `pi r^2` of its drawn diameter; an arrow's is 1.5 (Miyazaki et al. 2013) on its shaft's cross-section; a bolt carries no drag, none being read.
 * 5. A round shot's depth is its object's: the 6-pounder's least 3½ ft and the 12-pounder's least 8½ ft (Griffiths 1856).
 * 6. A bolt's centre of mass lies ahead of its middle, toward its steel head, the reason it flies point first. An arrow's head is not drawn, no read giving its size and mass, so its balance waits for that source.
 * 7. A cartridge, loaded and never launched, carries no drag and no contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the simulated object's body data, per-kind motion records, cross-sectional area and centre-of-mass checks.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each public scenic model and reads actual body and physical properties. The assertions distinguish each model's assigned simulation metadata and check area and balance against observed geometry.
 * @evidence contracts/development/testing.md#independent-expectations Uses the fixture's literal reference categories and coefficients. A circular section uses the observed diameter and its ordinary area formula. Centre-of-mass comparisons use the body's measured longitudinal span.
 */
export function test_archetype_projectile_flight_data(): void {
  const findings: string[] = [];
  const inch: number = 0.0254;
  // The launched kinds; a cartridge is loaded, never launched, and carries no flight data.
  type Launched = Exclude<AutoMovieArchetypeProjectile.Kind, "cartridge">;
  const launched: Launched[] = AutoMovieArchetypeProjectile.KINDS.filter(
    (kind: AutoMovieArchetypeProjectile.Kind): kind is Launched => kind !== "cartridge",
  );
  const cartridge: IAutoMovieBody = AutoMovieArchetypeProjectile.create({
    kind: "cartridge",
  }).body;
  if (cartridge.drag !== undefined || cartridge.contact !== undefined)
    findings.push("the cartridge carries flight data");
  // Every read object of every kind, and the kinds without one at their seedless draw.
  const rows: {
    kind: Launched;
    model?: AutoMovieArchetypeProjectile.Model;
  }[] = launched.flatMap(
    (kind: Launched): { kind: Launched; model?: AutoMovieArchetypeProjectile.Model }[] => {
      const models: AutoMovieArchetypeProjectile.Model[] = Object.keys(
        AutoMovieArchetypeProjectile.MODELS[kind] ?? {},
      ) as AutoMovieArchetypeProjectile.Model[];
      return models.length === 0
        ? [{ kind }]
        : models.map((model: AutoMovieArchetypeProjectile.Model) => ({ kind, model }));
    },
  );
  // 2. The issue's table of attitudes and outcomes.
  const table: Readonly<
    Record<
      Launched,
      readonly [
        (typeof AutoMovieArchetypeProjectile.ATTITUDE)[Launched],
        (typeof AutoMovieArchetypeProjectile.OUTCOME)[Launched],
      ]
    >
  > = {
    arrow: ["velocity", "stick"],
    bolt: ["velocity", "stick"],
    roundShot: ["free", "bounce"],
    ball: ["free", "stick"],
    grenade: ["free", "roll"],
    stone: ["free", "bounce"],
  };
  for (const kind of launched)
    if (
      AutoMovieArchetypeProjectile.ATTITUDE[kind] !== table[kind][0] ||
      AutoMovieArchetypeProjectile.OUTCOME[kind] !== table[kind][1]
    )
      findings.push(
        `${kind}: attitude ${AutoMovieArchetypeProjectile.ATTITUDE[kind]}, outcome ${AutoMovieArchetypeProjectile.OUTCOME[kind]}`,
      );

  // The cited figures: a sphere's and an arrow's drag coefficients, the soil restitution, and a ball's and an arrow's depth in wood.
  const SPHERE: number = 0.47;
  const ARROW: number = 1.5;
  const SOIL: number = 0.3;
  const DEPTH: Readonly<Partial<Record<Launched, number>>> = {
    ball: 0.75 * inch,
    arrow: 2 * inch,
  };
  for (const { kind, model } of rows) {
    const made: ReturnType<typeof AutoMovieArchetypeProjectile.create> = AutoMovieArchetypeProjectile.create(
      model === undefined ? { kind } : { kind, model },
    );
    const body: IAutoMovieBody = made.body;
    if (!AutoMovieEngineValidation.validateModel({ model: made }).success)
      findings.push(`${kind}: not admitted`);

    // 3. Restitution where it bounces or rolls, a depth where it sticks.
    const outcome: string = table[kind][1];
    if (outcome !== "stick" && body.restitution !== SOIL)
      findings.push(
        `${kind} ${outcome}s with a restitution of ${body.restitution}`,
      );
    const depth: number | undefined = DEPTH[kind];
    if (
      depth !== undefined &&
      !(Math.abs((body.contact?.embed ?? Number.NaN) - depth) <= 1e-12)
    )
      findings.push(`${kind} sticks ${body.contact?.embed} m deep`);

    // 4. The drag.
    const radius: number = made.dimensions.diameter! / 2;
    if (kind === "bolt") {
      if (body.drag !== undefined)
        findings.push("the bolt carries an unread drag");
    } else if (
      body.drag === undefined ||
      body.drag.coefficient !== (kind === "arrow" ? ARROW : SPHERE) ||
      !(Math.abs(body.drag.area - Math.PI * radius * radius) <= 1e-15)
    )
      findings.push(`${kind}: drag ${JSON.stringify(body.drag)}`);
    if (kind === "bolt") {
      const length: number = made.dimensions.length!;
      if (!(made.properties.centerOfMass.y > length / 2))
        findings.push(
          `${kind}: balanced ${made.properties.centerOfMass.y} m from the nock, behind its middle ${length / 2} m`,
        );
    }
  }
  // 5. Each round shot's own depth.
  for (const [model, feet] of [
    ["sixPounder", 3.5],
    ["twelvePounder", 8.5],
  ] as const) {
    const shot: ReturnType<typeof AutoMovieArchetypeProjectile.create> = AutoMovieArchetypeProjectile.create({
      kind: "roundShot",
      model,
    });
    if (!(Math.abs(shot.body.contact!.embed! - feet * 12 * inch) <= 1e-12))
      findings.push(`${model} embeds ${shot.body.contact!.embed} m`);
  }
  TestValidator.equals(
    "every projectile carries the flight data its outcome needs",
    findings,
    [],
  );
}
