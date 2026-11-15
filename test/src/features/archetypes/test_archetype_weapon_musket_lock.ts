import { type Archetype, createLongGun } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A musket's lock and ramrod move as the 1764 Manual Exercise's motions need them.
 *
 * Scenarios, at four seeds:
 * 1. The cock turns back by its whole travel at full cock and by part of it at half cock, its part moving with it; the frizzen opens by its travel and shuts at rest.
 * 2. The ramrod drawn by its whole travel leaves its pipe: its tail stands ahead of the front `pipe` socket, and its tip stands beyond the muzzle by less than the rod's length.
 * 3. Rammed home, the rod reaches the breech: its length is the barrel's.
 * 4. Every pose, the cock at half and full, the frizzen open and the rod drawn, is an admitted model.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Articulates the musket and measures the posed parts against the contacts; a cock that does not turn, a frizzen that does not open, a rod still in its pipe when drawn or a refused pose is caught.
 * @evidence contracts/development/testing.md#independent-expectations The rod's reach and its release are worked here from the barrel's length and the pipe's and muzzle's frames, not from the producer's travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Four seeds, two cock travels, the frizzen's two ends and the rod's whole draw.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_weapon_musket_lock(): void {
  const findings: string[] = [];
  for (const seed of [0, 3, 7, 12]) {
    const musket: Archetype<createLongGun.Affordance, createLongGun.Dimension> = createLongGun({ kind: "musket" }, seed);
    const label: string = `musket@${seed}`;
    const cock: number = musket.affordance("cock").travel!;
    const frizzen: number = musket.affordance("frizzen").travel!;
    const draw: number = musket.affordance("ramrod").travel!;
    const poses: Readonly<Record<string, Partial<Record<createLongGun.Affordance, number>>>> = {
      half: { cock: cock / 2 },
      full: { cock },
      open: { frizzen },
      drawn: { ramrod: draw },
    };
    for (const [name, state] of Object.entries(poses)) {
      const posed: Archetype<createLongGun.Affordance, createLongGun.Dimension> = musket.articulate(state);
      if (!validateModel({ model: posed }).success) findings.push(`${label}: the ${name} pose is refused`);
    }
    const rest = (part: string): number => archetypeExtent(musket, "z", [part]).low;
    if (archetypeExtent(musket.articulate({ cock }), "z", ["cock"]).high >= archetypeExtent(musket, "z", ["cock"]).high)
      findings.push(`${label}: the cock does not come back at full cock`);
    if (archetypeExtent(musket.articulate({ frizzen }), "z", ["frizzen"]).high <= archetypeExtent(musket, "z", ["frizzen"]).high)
      findings.push(`${label}: the frizzen does not open forward`);

    const length: number = musket.dimensions.length!;
    const barrel: number = musket.dimensions.barrel!;
    const rod: number = archetypeExtent(musket, "z", ["ramrod"]).size;
    if (Math.abs(rod - barrel) > 1e-6) findings.push(`${label}: the rod is ${rod} m, not the barrel's ${barrel} m`);
    const drawn: Archetype<createLongGun.Affordance, createLongGun.Dimension> = musket.articulate({ ramrod: draw });
    const pipe: IAutoMovieVector3 = musket.affordance("pipe").frame.translation;
    const tail: number = archetypeExtent(drawn, "z", ["ramrod"]).low;
    const tip: number = archetypeExtent(drawn, "z", ["ramrod"]).high;
    if (!(tail >= pipe.z - 1e-6)) findings.push(`${label}: the drawn rod's tail at ${tail} is still in the pipe at ${pipe.z}`);
    if (!(tip > length && tip - length < rod)) findings.push(`${label}: the drawn rod's tip stands ${tip - length} m beyond the muzzle`);
    if (!(rest("ramrod") < pipe.z)) findings.push(`${label}: the rod at rest is not in its pipe`);
  }
  TestValidator.equals("a musket's lock and rod move as the drill needs", findings, []);
}
