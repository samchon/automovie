import {
  type AutoMovieArchetype,
  AutoMovieArchetypeArticulation,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeMarks,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { Quaternion, Vector3, validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieConstraintViolation,
  IAutoMovieMark,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/** The fixture's articulations. */
type Id = "swing" | "slide" | "flap" | "press";

/** The fixture's travels: a leaf swinging 90 degrees each way, a carriage running 0.3 m forward and 0.2 m back, a one-way flap of 60 degrees, and a button of 0.01 m that states a reverse its kind ignores. */
const TRAVEL: Readonly<Record<Id, { travel: number; reverse?: number }>> = {
  swing: { travel: 90, reverse: 90 },
  slide: { travel: 0.3, reverse: 0.2 },
  flap: { travel: 60 },
  press: { travel: 0.01, reverse: 0.005 },
};

/**
 * A fixture with every articulation of `TRAVEL`, each binding one part.
 *
 * @param swing The `swing` hinge's stated travels.
 * @returns The fixture at rest.
 */
function fixture(
  swing: { travel: number; reverse?: number } = TRAVEL.swing,
): AutoMovieArchetype<Id, never> {
  const v: typeof Vector3.create = Vector3.create;
  const facing = (at: IAutoMovieVector3): IAutoMovieAffordance["frame"] =>
    AutoMovieArchetypeFrame.facing(at, v(0, 1, 0), v(1, 0, 0));
  return new AutoMovieArchetypeBuilder<Id, never>({
    material: "steel",
    name: "fixture",
    draw: new AutoMovieArchetypeDrawSession<never>("fixture", {}, undefined),
  })
    .box("base", v(1, 0.1, 1), v(0, 0.05, 0))
    .box("leaf", v(0.4, 0.3, 0.02), v(0.3, 0.5, 0))
    .box("carriage", v(0.1, 0.1, 0.1), v(0, 0.2, 0))
    .box("flap-leaf", v(0.4, 0.3, 0.02), v(-0.5, 0.5, 0))
    .box("cap", v(0.02, 0.02, 0.02), v(0, 0.8, 0))
    .affordance({
      id: "swing",
      kind: "hinge",
      frame: facing(v(0.1, 0.5, 0)),
      extent: null,
      ...swing,
      parts: ["leaf"],
    })
    .affordance({
      id: "slide",
      kind: "slider",
      frame: facing(v(0, 0.2, 0)),
      extent: null,
      ...TRAVEL.slide,
      parts: ["carriage"],
    })
    .affordance({
      id: "flap",
      kind: "hinge",
      frame: facing(v(-0.3, 0.5, 0)),
      extent: null,
      ...TRAVEL.flap,
      parts: ["flap-leaf"],
    })
    .affordance({
      id: "press",
      kind: "button",
      frame: facing(v(0, 0.8, 0)),
      extent: null,
      ...TRAVEL.press,
      parts: ["cap"],
    })
    .build(10);
}

/** Where a part's centre is in its model. */
function centre(
  archetype: AutoMovieArchetype<Id, never>,
  part: string,
): IAutoMovieVector3 {
  return archetype.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === part,
  )!.transform!.translation;
}

/** Run an operation and return the refusal it raises, or null when it raises none or something else. */
function refused(operation: () => unknown): AutoMovieArchetypeRefusal | null {
  try {
    operation();
  } catch (error) {
    return error instanceof AutoMovieArchetypeRefusal ? error : null;
  }
  return null;
}

/** The paths of a model's violations, or none when it is admitted. */
function faults(model: IAutoMovieModel): string[] {
  const validation: IAutoMovieValidation = validateModel({ model });
  return validation.success
    ? []
    : validation.violations.map(
        (v: IAutoMovieConstraintViolation): string => v.path,
      );
}

/**
 * An articulation that states a `reverse` moves the other way from rest as far as it states, and one that states none keeps its one-way range.
 *
 * Scenarios, on a fixture with a hinge of 90 degrees each way, a slider of 0.3 m forward and 0.2 m back, a one-way hinge of 60 degrees and a button of 0.01 m that states a reverse:
 * 1. The ranges are the hinge's -90 to 90 degrees, the slider's -0.2 to 0.3 m, the one-way hinge's 0 to 60 degrees and the button's 0 to 0.01 m: a button's press has no other way, so its reverse is ignored.
 * 2. At -60 degrees the leaf sits where turning its rest centre the other way about the hinge's upright puts it, the mirror of +60 across the hinge's plane, and at -0.2 m the carriage has run 0.2 m along the slider's `-X`, within 1e-9 m.
 * 3. A degree past -90, a centimetre past -0.2 m, and any travel below 0 on the one-way hinge and the button are refused with the range, whose least end is the stated reverse or 0.
 * 4. The engine admits the fixture and refuses a reverse of 0, a negative one and a non-finite one at the affordance's `reverse`.
 * 5. The slider's mark runs from its other way's end to its forward one: 0.5 m long, its ends 0.2 m behind and 0.3 m ahead of the rest frame along `+X`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a model with each kind of range, poses it either way and reads the moved parts, the refusals, the engine's admission and the marks; a reverse that is ignored, turns the wrong way, is admitted on a kind without another way, lets a travel past its end through, or is admitted when not positive is caught.
 * @evidence contracts/development/testing.md#independent-expectations The ranges are the fixture's stated travels; the expected places are computed here by turning and shifting the rest centres about the hinge's upright and along the slider's axis, not by calling the articulation code.
 * @evidence contracts/development/testing.md#distinguishing-cases A turning and a sliding articulation with a reverse, a one-way articulation without, and a kind that ignores the field; both sides of each end; three malformed values.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_contract_reverse(): void {
  const model: AutoMovieArchetype<Id, never> = fixture();
  const findings: string[] = [];
  const affordance = (id: Id): IAutoMovieAffordance => model.affordance(id);

  // 1. The ranges.
  for (const [id, minimum, maximum] of [
    ["swing", -TRAVEL.swing.reverse!, TRAVEL.swing.travel],
    ["slide", -TRAVEL.slide.reverse!, TRAVEL.slide.travel],
    ["flap", 0, TRAVEL.flap.travel],
    ["press", 0, TRAVEL.press.travel],
  ] as const) {
    const range: { minimum: number | null; maximum: number | null } =
      AutoMovieArchetypeArticulation.range(affordance(id));
    if (range.minimum !== minimum || range.maximum !== maximum)
      findings.push(
        `${id} ranges ${range.minimum} to ${range.maximum}, not ${minimum} to ${maximum}`,
      );
  }

  // 2. Either way from rest.
  const pivot: IAutoMovieVector3 = affordance("swing").frame.translation;
  const turned = (degrees: number): IAutoMovieVector3 =>
    Vector3.add(
      pivot,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, degrees),
        Vector3.subtract(centre(model, "leaf"), pivot),
      ),
    );
  const back: IAutoMovieVector3 = centre(
    model.articulate({ swing: -60 }),
    "leaf",
  );
  const ahead: IAutoMovieVector3 = centre(
    model.articulate({ swing: 60 }),
    "leaf",
  );
  if (!vclose(back, turned(-60), 1e-9) || !(Math.abs(back.z + ahead.z) < 1e-9))
    findings.push(
      `the leaf at -60 degrees is at ${JSON.stringify(back)}, not ${JSON.stringify(turned(-60))}`,
    );
  const run: IAutoMovieVector3 = Vector3.subtract(
    centre(model.articulate({ slide: -TRAVEL.slide.reverse! }), "carriage"),
    centre(model, "carriage"),
  );
  if (
    !vclose(
      run,
      Vector3.scale(
        AutoMovieArchetypeFrame.axis(affordance("slide").frame, "x"),
        -TRAVEL.slide.reverse!,
      ),
      1e-9,
    )
  )
    findings.push(`the carriage at its reverse ran ${JSON.stringify(run)}`);

  // 3. Past either end.
  for (const [id, travel, minimum] of [
    ["swing", -TRAVEL.swing.reverse! - 1, -TRAVEL.swing.reverse!],
    ["slide", -TRAVEL.slide.reverse! - 0.01, -TRAVEL.slide.reverse!],
    ["flap", -1, 0],
    ["press", -0.001, 0],
  ] as const) {
    const state: Partial<Record<Id, number>> = { [id]: travel };
    const refusal: AutoMovieArchetypeRefusal | null = refused(() =>
      model.articulate(state),
    );
    if (
      refusal === null ||
      refusal.feasible?.kind !== "range" ||
      refusal.feasible.minimum !== minimum
    )
      findings.push(
        `${id} at ${travel} is not refused with its least end ${minimum}`,
      );
  }

  // 4. The engine's admission.
  if (faults(model).length !== 0)
    findings.push(`the fixture is refused at ${faults(model).join(", ")}`);
  for (const reverse of [0, -10, Number.NaN]) {
    const at: string[] = faults(
      fixture({ travel: TRAVEL.swing.travel, reverse }),
    );
    if (!at.some((path: string): boolean => path.endsWith(".reverse")))
      findings.push(`a reverse of ${reverse} is admitted: ${at.join(", ")}`);
  }

  // 5. The slider's mark.
  const points: readonly number[] = AutoMovieArchetypeMarks.of("fixture", [
    affordance("slide"),
  ]).flatMap((m: IAutoMovieMark): number[] =>
    m.shape.type === "segments" ? m.shape.points : [],
  );
  const frame: IAutoMovieAffordance["frame"] = affordance("slide").frame;
  const along: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(frame, "x");
  const ends: IAutoMovieVector3[] = [0, 3]
    .filter((k: number): boolean => k + 2 < points.length)
    .map(
      (k: number): IAutoMovieVector3 =>
        Vector3.create(points[k]!, points[k + 1]!, points[k + 2]!),
    );
  if (
    ends.length !== 2 ||
    !vclose(
      ends[0]!,
      Vector3.add(
        frame.translation,
        Vector3.scale(along, -TRAVEL.slide.reverse!),
      ),
      1e-9,
    ) ||
    !vclose(
      ends[1]!,
      Vector3.add(frame.translation, Vector3.scale(along, TRAVEL.slide.travel)),
      1e-9,
    )
  )
    findings.push(`the slider's mark runs ${JSON.stringify(ends)}`);
  TestValidator.equals(
    "a reverse moves an articulation the other way",
    findings,
    [],
  );
}
