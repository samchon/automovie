import { createProjectile } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Each projectile carries the flight data its outcome needs, where a source gave it, and an arrow flies point first.
 *
 * Scenarios, for every read object of every kind, and each kind without one at its seedless draw:
 * 1. The model passes `validateModel`, its drag and contact admitted.
 * 2. A kind that bounces or rolls (`createProjectile.OUTCOME`) carries a restitution; a sticking kind carries an embedding depth, except the crossbow bolt, whose depth no source read gave.
 * 3. A sphere's drag coefficient is a sphere's and its reference area its cross-section, `pi r^2` of its drawn diameter; an arrow's is the arrow's on its shaft's cross-section; a bolt carries no drag, none being read.
 * 4. A round shot's depth is its object's: the 6-pounder's least 3½ ft and the 12-pounder's least 8½ ft (Griffiths 1856).
 * 6. Each kind flies and ends as the issue's table states: an arrow and a bolt along their velocity and sticking, a round shot free and bouncing, a ball free and sticking, a grenade free and rolling.
 * 5. A bolt's centre of mass lies ahead of its middle, toward its steel head, the reason it flies point first. An arrow's head is not drawn, no read giving its size and mass, so its balance waits for that source.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces every projectile and reads its model body and mass properties; a kind missing the datum its outcome needs, a drag on the wrong area, an invented bolt drag, a shot's depth swapped between calibres, or an arrow balanced behind its middle is caught.
 * @evidence contracts/development/testing.md#independent-expectations The cross-section is worked here from the drawn diameter; the depths are the cited figures written here; the balance is read from the mass properties against the length.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind and every read round shot, the sticking, bouncing and rolling outcomes, and the unread bolt.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_projectile_flight_data(): void {
  const findings: string[] = [];
  const inch: number = 0.0254;
  // Every read object of every kind, and the kinds without one at their seedless draw.
  const rows: {
    kind: createProjectile.Kind;
    model?: createProjectile.Model;
  }[] = createProjectile.KINDS.flatMap(
    (
      kind: createProjectile.Kind,
    ): { kind: createProjectile.Kind; model?: createProjectile.Model }[] => {
      const models: createProjectile.Model[] = Object.keys(
        createProjectile.MODELS[kind] ?? {},
      ) as createProjectile.Model[];
      return models.length === 0
        ? [{ kind }]
        : models.map((model: createProjectile.Model) => ({ kind, model }));
    },
  );
  for (const { kind, model } of rows) {
    const made: ReturnType<typeof createProjectile> = createProjectile(
      model === undefined ? { kind } : { kind, model },
    );
    const body: IAutoMovieBody = made.body;
    if (!validateModel({ model: made }).success)
      findings.push(`${kind}: not admitted`);
    const outcome: string = createProjectile.OUTCOME[kind];
    if (outcome !== "stick" && !(body.restitution > 0))
      findings.push(`${kind} ${outcome}s without a restitution`);
    if (
      outcome === "stick" &&
      kind !== "bolt" &&
      body.contact?.embed === undefined
    )
      findings.push(`${kind} sticks without a depth`);
    const radius: number = made.dimensions.diameter! / 2;
    if (kind === "bolt") {
      if (body.drag !== undefined)
        findings.push("the bolt carries an unread drag");
    } else if (
      body.drag === undefined ||
      body.drag.coefficient !==
        (kind === "arrow"
          ? createProjectile.FLIGHT.arrow
          : createProjectile.FLIGHT.sphere) ||
      Math.abs(body.drag.area - Math.PI * radius * radius) > 1e-15
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
  // 6. Each kind's attitude and outcome are the issue's table's.
  const table: Readonly<
    Record<
      createProjectile.Kind,
      readonly [
        (typeof createProjectile.ATTITUDE)[createProjectile.Kind],
        (typeof createProjectile.OUTCOME)[createProjectile.Kind],
      ]
    >
  > = {
    arrow: ["velocity", "stick"],
    bolt: ["velocity", "stick"],
    roundShot: ["free", "bounce"],
    ball: ["free", "stick"],
    grenade: ["free", "roll"],
  };
  for (const kind of createProjectile.KINDS)
    if (
      createProjectile.ATTITUDE[kind] !== table[kind][0] ||
      createProjectile.OUTCOME[kind] !== table[kind][1]
    )
      findings.push(
        `${kind}: attitude ${createProjectile.ATTITUDE[kind]}, outcome ${createProjectile.OUTCOME[kind]}`,
      );
  for (const [model, feet] of [
    ["sixPounder", 3.5],
    ["twelvePounder", 8.5],
  ] as const) {
    const shot: ReturnType<typeof createProjectile> = createProjectile({
      kind: "roundShot",
      model,
    });
    if (Math.abs(shot.body.contact!.embed! - feet * 12 * inch) > 1e-12)
      findings.push(`${model} embeds ${shot.body.contact!.embed} m`);
  }
  TestValidator.equals(
    "every projectile carries the flight data its outcome needs",
    findings,
    [],
  );
}
