import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeFrame,
  ArchetypeRefusal,
  type ArchetypeSpan,
} from "@automovie/archetypes";
import { Quaternion, Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/** The fixture's affordances. */
type Id = "arm" | "carriage" | "hook";

/** The line's rest length, metres: longer than its ends are apart over part of the sweep, so it goes slack there. */
const REST: number = 0.85;

/**
 * A fixture: an arm on a hinge and a hook on a slider, with a line from the arm's tip to the hook.
 *
 * @param from The line's first end.
 * @returns The fixture at rest.
 */
function fixture(
  from: ArchetypeSpan.End = { part: "arm", at: { x: 0.25, y: 0, z: 0 } },
): Archetype<Id, never> {
  const v: typeof Vector3.create = Vector3.create;
  return new ArchetypeBuilder<Id, never>({
    archetype: "fixture",
    name: "fixture",
    dimensions: {},
  })
    .box("post", v(0.05, 1, 0.05), v(0, 0.5, 0))
    .box("arm", v(0.5, 0.05, 0.05), v(0.25, 1, 0))
    .box("block", v(0.1, 0.1, 0.1), v(0, 0.5, 0.6))
    .affordance({
      id: "arm",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0, 1, 0), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      travel: 90,
      parts: ["arm"],
    })
    .affordance({
      id: "carriage",
      kind: "slider",
      frame: ArchetypeFrame.facing(v(0, 0.5, 0.6), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
      travel: 0.6,
      parts: ["block"],
    })
    .affordance({
      id: "hook",
      kind: "hook",
      frame: ArchetypeFrame.upright(v(0, 0.55, 0.6)),
      extent: null,
      rides: "carriage",
    })
    .span("line", from, { affordance: "hook" }, 0.002, { color: "#222222" }, REST)
    .build(5);
}

/**
 * A span stays a straight line between its two ends whatever the articulations that carry them do, is drawn and collided as a line, and reports itself slack where its ends come closer than its rest length.
 *
 * Scenarios, on a fixture whose 0.5 m arm turns on a hinge and whose hook runs 0.6 m on a slider, with a line of rest length 0.85 m from the arm's tip to the hook:
 * 1. Over a five-by-five sweep of both travels, the line's drawn ends (its centre plus and minus half its height along its axis) are the arm's tip and the hook, each placed here from its rest place, within 1e-9 m.
 * 2. Its drawn length, `span(...).length`, equals the distance between those ends within 1e-9 m.
 * 3. Its collider is among `shapes()`, a capsule of its radius.
 * 4. It is slack at exactly the poses where its ends are closer than 0.85 m, and both kinds of pose occur in the sweep.
 * 5. The built fixture passes the engine's model admission at rest and posed.
 * 6. A span whose ends coincide at rest, one that ends on a part the model lacks, and asking for a span the model does not declare are each refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds an archetype with a span, articulates it across a grid and reads the drawn part, the colliders and the span state; a line left where it was laid, drawn at the wrong length, missing from the colliders or slack at the wrong poses is caught.
 * @evidence contracts/development/testing.md#independent-expectations The ends are placed here: the arm's tip turned about the hinge's upright by its travel with the engine's quaternions, the hook shifted along the slider's axis by its travel. Slack is the definition `ArchetypeSpan` states: ends closer than the rest length.
 * @evidence contracts/development/testing.md#distinguishing-cases An end on a part and an end on a riding affordance, poses on both sides of the rest length, and three refusals; spans on real producers belong to their producers' tests (the bow of #3481).
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_contract_span(): void {
  const findings: string[] = [];
  const rest: Archetype<Id, never> = fixture();
  const tip: IAutoMovieVector3 = { x: 0.5, y: 1, z: 0 };
  const hook: IAutoMovieVector3 = { x: 0, y: 0.55, z: 0.6 };
  let slack: number = 0;
  let taut: number = 0;
  for (let i: number = 0; i <= 4; i++)
    for (let j: number = 0; j <= 4; j++) {
      const arm: number = 22.5 * i;
      const carriage: number = 0.15 * j;
      const posed: Archetype<Id, never> = rest.articulate({ arm, carriage });
      const from: IAutoMovieVector3 = Vector3.add(
        { x: 0, y: 1, z: 0 },
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, arm),
          Vector3.subtract(tip, { x: 0, y: 1, z: 0 }),
        ),
      );
      const to: IAutoMovieVector3 = Vector3.add(hook, { x: carriage, y: 0, z: 0 });
      const distance: number = Vector3.length(Vector3.subtract(to, from));
      const line: IAutoMovieModelPart = posed.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === "line",
      )!;
      const shape: { height: number } =
        line.geometry.type === "primitive" && line.geometry.shape.type === "cylinder"
          ? line.geometry.shape
          : { height: Number.NaN };
      const half: IAutoMovieVector3 = Vector3.scale(
        Quaternion.rotateVector(line.transform!.rotation, { x: 0, y: 1, z: 0 }),
        shape.height / 2,
      );
      const label: string = `arm ${arm} degrees, carriage ${carriage} m`;

      // 1 and 2. The line is drawn between its ends, as long as they are apart.
      if (
        !vclose(Vector3.subtract(line.transform!.translation, half), from, 1e-9) ||
        !vclose(Vector3.add(line.transform!.translation, half), to, 1e-9)
      )
        findings.push(`${label}: the line is not drawn between its ends`);
      const state: ArchetypeSpan.IState = posed.span("line");
      if (
        Math.abs(state.length - distance) > 1e-9 ||
        Math.abs(shape.height - distance) > 1e-9
      )
        findings.push(`${label}: length ${state.length}, not ${distance}`);

      // 3. Its collider.
      const collider: IAutoMoviePhysicalProfile.IShape | undefined = posed
        .shapes()
        .find((s: IAutoMoviePhysicalProfile.IShape): boolean => s.id === "line");
      if (collider?.kind !== "capsule" || collider.radius !== 0.002)
        findings.push(`${label}: the line's collider is ${collider?.kind ?? "missing"}`);

      // 4. Slack exactly where its ends are closer than its rest length.
      if (state.slack !== distance < REST)
        findings.push(`${label}: slack ${state.slack} at ${distance} m`);
      if (state.slack) slack++;
      else taut++;

      // 5. Admitted posed.
      if (!validateModel({ model: posed }).success)
        findings.push(`${label}: the posed model is not admitted`);
    }
  if (slack === 0 || taut === 0)
    findings.push(`the sweep is slack ${slack} times and taut ${taut} times`);
  if (!validateModel({ model: rest }).success)
    findings.push("the fixture is not admitted at rest");

  // 6. Refusals.
  const coincident: unknown = caught(() =>
    fixture({ part: "block", at: { x: 0, y: 0.05, z: 0 } }),
  );
  const ghost: unknown = caught(() =>
    fixture({ part: "ghost", at: { x: 0, y: 0, z: 0 } }),
  );
  const unknown: unknown = caught(() => rest.span("rope"));
  if (!(coincident instanceof ArchetypeRefusal) || coincident.axis !== "line")
    findings.push(`ends at one point: ${String(coincident)}`);
  if (
    !(ghost instanceof ArchetypeRefusal) ||
    ghost.feasible?.kind !== "alternatives" ||
    !ghost.feasible.values.includes("arm")
  )
    findings.push(`an end on a missing part: ${String(ghost)}`);
  if (
    !(unknown instanceof ArchetypeRefusal) ||
    unknown.feasible?.kind !== "alternatives" ||
    unknown.feasible.values.join() !== "line"
  )
    findings.push(`an undeclared span: ${String(unknown)}`);
  TestValidator.equals("a span stays between its ends", findings, []);
}

/** Run an operation and return what it throws, or undefined. */
function caught(operation: () => unknown): unknown {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return undefined;
}
