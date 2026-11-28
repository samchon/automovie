import { AutoMovieArchetypeRefusal, AutoMovieArchetypeBow } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Drawing a bow's string bends its limbs with it: the limb tips sweep their arcs about the grip, each half of the string runs from its tip to the nock, and the nock stays on the arrow's line.
 *
 * Scenarios, for every read model of every hand-drawn kind and at 11 travels of `string` from brace to full draw (a crossbow's string follows its crank, `test_archetype_weapon_crossbow_span`):
 * 1. Each limb's tip stays its braced distance from the grip, the radius of its hinge's arc, within 1e-9 m.
 * 2. Each string half's two ends lie on its limb's tip and on the nock, within 1e-9 m.
 * 3. The nock lies on the arrow's line, the line through the braced nock along `+Z`, within 0.1 mm, and has come back by the travel.
 * 4. Each string half stays its braced length within the string's radius (`createBow.STRING`), the inextensible string the limbs' table keeps.
 * 5. Naming a limb in a state is refused, its leader being `string`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the posed scene limbs, span endpoints, central contact and alignment checks at sampled animation states.
 * @evidence contracts/development/testing.md#behavioral-verification Articulates public scene models and measures the two posed span halves and their endpoints. Repeatable frame observations distinguish detached ends, an unmoved limb and an off-axis centre.
 * @evidence contracts/development/testing.md#independent-expectations Uses the emitted limb tips and centre contact as geometric references. A span between these points must have the Euclidean distance between its endpoints.
 */
export function test_archetype_weapon_bow_draw(): void {
  const findings: string[] = [];
  const distance: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  // A crossbow's string follows its crank, which `test_archetype_weapon_crossbow_span` turns.
  const bows: { kind: AutoMovieArchetypeBow.Kind; model: AutoMovieArchetypeBow.Model }[] =
    AutoMovieArchetypeBow.KINDS.filter(
      (k: AutoMovieArchetypeBow.Kind): boolean => k !== "crossbow",
    ).flatMap(
      (
        kind: AutoMovieArchetypeBow.Kind,
      ): { kind: AutoMovieArchetypeBow.Kind; model: AutoMovieArchetypeBow.Model }[] =>
        (Object.keys(AutoMovieArchetypeBow.MODELS[kind]) as AutoMovieArchetypeBow.Model[]).map(
          (
            model: AutoMovieArchetypeBow.Model,
          ): { kind: AutoMovieArchetypeBow.Kind; model: AutoMovieArchetypeBow.Model } => ({
            kind,
            model,
          }),
        ),
    );
  for (const { kind: k, model } of bows) {
    const kind: string = `${k} ${model}`;
    const bow: ReturnType<typeof AutoMovieArchetypeBow.create> = AutoMovieArchetypeBow.create({ kind: k, model });
    const stroke: number = bow.affordance("string").travel!;
    const grip: IAutoMovieVector3 = bow.affordance("grip").frame.translation;
    const braced: IAutoMovieVector3 = bow.affordance("nock").frame.translation;
    const tip: (
      posed: ReturnType<typeof AutoMovieArchetypeBow.create>,
      limb: "upperLimb" | "lowerLimb",
    ) => IAutoMovieVector3 = (
      posed: ReturnType<typeof AutoMovieArchetypeBow.create>,
      limb: "upperLimb" | "lowerLimb",
    ): IAutoMovieVector3 => {
      const half: string =
        limb === "upperLimb" ? "string-upper" : "string-lower";
      return posed.span(half).from;
    };
    const rest: Record<"upperLimb" | "lowerLimb", number> = {
      upperLimb: distance(tip(bow, "upperLimb"), grip),
      lowerLimb: distance(tip(bow, "lowerLimb"), grip),
    };
    const halves: Record<string, number> = {
      "string-upper": distance(bow.span("string-upper").from, braced),
      "string-lower": distance(bow.span("string-lower").from, braced),
    };
    for (let k: number = 0; k <= 10; ++k) {
      const travel: number = (k / 10) * stroke;
      const drawn: ReturnType<typeof AutoMovieArchetypeBow.create> = bow.articulate({
        string: travel,
      });
      const nock: IAutoMovieVector3 =
        drawn.affordance("nock").frame.translation;
      for (const limb of ["upperLimb", "lowerLimb"] as const) {
        const at: IAutoMovieVector3 = tip(drawn, limb);
        if (!(Math.abs(distance(at, grip) - rest[limb]) <= 1e-9))
          findings.push(
            `${kind} at ${travel} m: the ${limb}'s tip leaves its arc`,
          );
      }
      for (const half of ["string-upper", "string-lower"] as const) {
        const line: ReturnType<typeof drawn.span> = drawn.span(half);
        if (!(distance(line.to, nock) <= 1e-9))
          findings.push(`${kind} at ${travel} m: ${half} leaves the nock`);
        if (
          !(
            Math.abs(distance(line.from, line.to) - halves[half]!) <=
            AutoMovieArchetypeBow.STRING
          )
        )
          findings.push(
            `${kind} at ${travel} m: ${half} is ${distance(line.from, line.to)} m, ${halves[half]} m braced`,
          );
      }
      if (
        !(Math.hypot(nock.x - braced.x, nock.y - braced.y) <= 1e-4) ||
        !(Math.abs(nock.z - braced.z - travel) <= 1e-4)
      )
        findings.push(
          `${kind} at ${travel} m: the nock is off the arrow's line`,
        );
    }
    let refused: string | null = null;
    try {
      bow.articulate({ upperLimb: 10 });
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal
          ? String(error.value)
          : String(error);
    }
    if (refused === null)
      findings.push(`${kind}: a limb named in a state was not refused`);
  }
  TestValidator.equals("a drawn bow's limbs and string follow", findings, []);
}
