import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFriction,
  AutoMovieArchetypeRefusal,
  createBicycle,
  createCar,
  createCart,
  createHorse,
  createMotorcycle,
  createWheelchair,
} from "@automovie/archetypes";
import { Vector3, validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Friction is declared per part from measured material pairs, and a body's friction is its resting pair's.
 *
 * Scenarios:
 * 1. Every measured pair has a static coefficient inside the unit interval, a kinetic one no greater than the least static where one was measured, and a citation; a pair reads the same in either order.
 * 2. A pair no source measured, rubber on ice, is refused, naming the pairs that were.
 * 3. Each producer that declares what it rests on carries that pair's coefficients, as the sources give them: rubber on asphalt 0.84 to 0.98 static (0.91) and 0.72 kinetic for a car, a bicycle and a motorcycle; rubber on dry concrete 1.0 and 0.7 for a wheelchair and a wheelbarrow; a horseshoe on concrete 0.48 and 0.47 for a horse; iron on stone 0.30 to 0.70 static (0.5) with no kinetic for the wagon.
 * 4. A part's declared surface reads back, and its friction against a ground is the pair's; an undeclared part is refused.
 * 5. A model built without a resting pair carries no friction, static or kinetic, and passes model validation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the producers and reads their bodies and parts' friction; a coefficient off its source, a pair read in one order only, an unmeasured pair admitted, or an invented coefficient given to an unread rest is caught.
 * @evidence contracts/development/testing.md#independent-expectations The numbers are OpenStax's Table 5.1 and The Physics Hypertextbook's rows as read, written here as literals, not read back from the table.
 * @evidence contracts/development/testing.md#distinguishing-cases The table, a refused pair, six producers over four grounds and materials, a part query and an unread rest.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_contract_friction(): void {
  const findings: string[] = [];
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;
  const least = (v: number | readonly [number, number]): number =>
    typeof v === "number" ? v : v[0];
  const most = (v: number | readonly [number, number]): number =>
    typeof v === "number" ? v : v[1];

  // The table.
  for (const [key, row] of Object.entries(AutoMovieArchetypeFriction.PAIRS)) {
    const [a, b] = key.split("/") as [
      AutoMovieArchetypeFriction.Material,
      AutoMovieArchetypeFriction.Material,
    ];
    if (!(least(row.static) >= 0 && most(row.static) <= 1))
      findings.push(`${key}: static outside 0 to 1`);
    if (
      row.kinetic !== null &&
      !(least(row.kinetic) >= 0 && most(row.kinetic) <= least(row.static))
    )
      findings.push(`${key}: kinetic exceeds static`);
    if (row.source.length === 0) findings.push(`${key}: no source`);
    if (AutoMovieArchetypeFriction.pair(b, a, "test") !== row)
      findings.push(`${key}: reads differently reversed`);
  }
  try {
    AutoMovieArchetypeFriction.pair("rubber", "ice", "test");
    findings.push("rubber on ice was admitted");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.axis !== "friction"
    )
      findings.push(`rubber on ice failed otherwise: ${String(error)}`);
  }

  // The producers' bodies.
  const rows: readonly [
    string,
    AutoMovieArchetype,
    number,
    number | undefined,
  ][] = [
    ["car", createCar({ kind: "sedan" }, 1), 0.91, 0.72],
    ["bicycle", createBicycle({}, 1), 0.91, 0.72],
    ["motorcycle", createMotorcycle({ kind: "motorcycle" }, 1), 0.91, 0.72],
    ["wheelchair", createWheelchair({ kind: "selfPropelled" }, 1), 1, 0.7],
    ["wheelbarrow", createCart({ kind: "wheelbarrow" }, 1), 1, 0.7],
    ["horse", createHorse({}, 1), 0.48, 0.47],
    ["wagon", createCart({ kind: "wagon" }, 1), 0.5, undefined],
  ];
  for (const [name, model, friction, kinetic] of rows) {
    if (!close(model.body.friction ?? -1, friction))
      findings.push(
        `${name}: static friction ${model.body.friction}, not ${friction}`,
      );
    if (
      kinetic === undefined
        ? model.body.kineticFriction !== undefined
        : !close(model.body.kineticFriction ?? -1, kinetic)
    )
      findings.push(
        `${name}: kinetic friction ${model.body.kineticFriction}, not ${kinetic}`,
      );
  }

  // A part's surface.
  const car: AutoMovieArchetype = createCar({ kind: "sedan" }, 1);
  const tyre: string =
    car.parts.find(
      (p: { id: string }): boolean => car.surface(p.id) === "rubber",
    )?.id ?? "";
  if (tyre === "" || !close(least(car.friction(tyre, "concrete").static), 1))
    findings.push("the car's tyre is not rubber on concrete");
  try {
    car.friction(
      car.parts.find(
        (p: { id: string }): boolean => car.surface(p.id) === null,
      )!.id,
      "concrete",
    );
    findings.push("an undeclared part's friction was given");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.axis !== "surface"
    )
      findings.push(`an undeclared part failed otherwise: ${String(error)}`);
  }

  // An unread rest.
  const plain: AutoMovieArchetype = new AutoMovieArchetypeBuilder<never, never>(
    {
      material: "steel",
      name: "box",
      draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
    },
  )
    .box("body", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
    .build(1);
  if ("friction" in plain.body || "kineticFriction" in plain.body)
    findings.push(
      `an unread rest carries friction ${plain.body.friction} and ${plain.body.kineticFriction}`,
    );
  if (!validateModel({ model: plain }).success)
    findings.push("an unread rest fails model validation");
  TestValidator.equals("friction comes from measured pairs", findings, []);
}
