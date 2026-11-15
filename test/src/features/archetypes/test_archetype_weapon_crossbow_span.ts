import {
  ArchetypeRefusal,
  ArchetypeUnits,
  createBow,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Turning a crossbow's cranequin spans its string: the string comes back by the crank's ratio, the bow's halves bend with it, and its trigger's travel is the trigger affordance's.
 *
 * Scenarios, for the seedless crossbow:
 * 1. At 11 turns of the crank from rest to its full count, the string's travel is the crank's travel times the ratio Payne-Gallwey's cranequin gives, 5½ in over thirty turns (The Crossbow, p. 134), within 1e-12 m; at the full count it is the whole 5½ in.
 * 2. At each of them the nock has come back toward the butt by the string's travel along the stock, within 0.1 mm, each string half runs from its bow tip to the nock, within 1e-9 m, and each tip keeps its braced distance from the bow's centre, the arc of its hinge.
 * 3. The trigger's travel is the affordance's own, the trigger's ⅛ in into the nut (p. 98).
 * 4. Naming the string in a state is refused, its leader being the crank.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Turns a real crossbow's crank and reads the posed string, nock and string halves; a string that does not follow, a wrong ratio, or halves that leave their tips is caught.
 * @evidence contracts/development/testing.md#independent-expectations The ratio is worked here from the book's 5½ in and thirty turns; the nock's place is read off the posed model.
 * @evidence contracts/development/testing.md#distinguishing-cases Rest, nine turns between and the full count, the trigger and one refusal.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_weapon_crossbow_span(): void {
  const findings: string[] = [];
  const bow: ReturnType<typeof createBow> = createBow({ kind: "crossbow" });
  const full: number = 30 * 360;
  const ratio: number = (5.5 * ArchetypeUnits.INCH) / full;
  const braced: IAutoMovieVector3 = bow.affordance("nock").frame.translation;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const centre: IAutoMovieVector3 =
    bow.affordance("upperLimb").frame.translation;
  const reach: Record<string, number> = {
    "string-upper": distance(bow.span("string-upper").from, centre),
    "string-lower": distance(bow.span("string-lower").from, centre),
  };
  for (let k: number = 0; k <= 10; ++k) {
    const turned: number = (k / 10) * full;
    const spanned: ReturnType<typeof createBow> = bow.articulate({
      crank: turned,
    });
    const travel: number = spanned.travel("string");
    if (Math.abs(travel - turned * ratio) > 1e-12)
      findings.push(
        `at ${turned} degrees the string is ${travel} m back, ${turned * ratio} m expected`,
      );
    const nock: IAutoMovieVector3 =
      spanned.affordance("nock").frame.translation;
    if (
      Math.hypot(nock.x - braced.x, nock.y - braced.y) > 1e-4 ||
      Math.abs(braced.z - nock.z - travel) > 1e-4
    )
      findings.push(`at ${turned} degrees the nock is off the stock's line`);
    for (const half of ["string-upper", "string-lower"] as const) {
      const line: ReturnType<typeof spanned.span> = spanned.span(half);
      if (distance(line.to, nock) > 1e-9)
        findings.push(`at ${turned} degrees ${half} leaves the nock`);
      // The bow's half turns about the bow's centre, so its tip keeps its braced distance from it.
      if (Math.abs(distance(line.from, centre) - reach[half]!) > 1e-9)
        findings.push(`at ${turned} degrees the tip of ${half} leaves its arc`);
    }
  }
  if (
    Math.abs(
      bow.articulate({ crank: full }).travel("string") -
        5.5 * ArchetypeUnits.INCH,
    ) > 1e-12
  )
    findings.push("the full count does not span the string its 5½ in");
  if (
    Math.abs(bow.affordance("trigger").travel! - 0.125 * ArchetypeUnits.INCH) >
    1e-12
  )
    findings.push(`the trigger travels ${bow.affordance("trigger").travel} m`);
  let refused: boolean = false;
  try {
    bow.articulate({ string: 0.01 });
  } catch (error) {
    refused = error instanceof ArchetypeRefusal;
  }
  if (!refused) findings.push("naming the string in a state was not refused");
  TestValidator.equals("a crossbow spans by its crank", findings, []);
}
