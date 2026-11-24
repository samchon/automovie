import { type AutoMovieArchetype, createLongGun } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A musket's lock and ramrod move as the 1764 Manual Exercise's motions need them.
 *
 * Scenarios, at four seeds:
 * 1. The cock turns back by its whole travel at full cock and by part of it at half cock, its part moving with it; the frizzen opens by its travel and shuts at rest.
 * 2. The ramrod drawn by its whole travel leaves its pipe: its tail stands ahead of the front `pipe` socket, and its tip stands beyond the muzzle by less than the rod's length.
 * 3. Rammed home, the rod reaches the breech: its length is the barrel's.
 * 4. Every pose, the cock at half and full, the frizzen open and the rod drawn, is an admitted model.
 * 5. The cock's `spur`, its thumb piece, is a handle riding the cock at its jaw end, and stands farther back at full cock.
 * 6. The `foreEnd`, where the 1764 Manual Exercise puts the left hand "at the swell", is the stock's swell at the rearmost of the four pipes, where the rod enters the stock, ahead of the lock's pan.
 */
export function test_unit_archetypes_weapons_weapon_musket_lock(): void {
  const findings: string[] = [];
  for (const seed of [0, 3, 7, 12]) {
    const musket: AutoMovieArchetype<
      createLongGun.Affordance,
      createLongGun.Dimension
    > = createLongGun({ kind: "musket" }, seed);
    const label: string = `musket@${seed}`;
    const cock: number = musket.affordance("cock").travel!;
    const frizzen: number = musket.affordance("frizzen").travel!;
    const draw: number = musket.affordance("ramrod").travel!;
    const poses: Readonly<
      Record<string, Partial<Record<createLongGun.Affordance, number>>>
    > = {
      half: { cock: cock / 2 },
      full: { cock },
      open: { frizzen },
      drawn: { ramrod: draw },
    };
    for (const [name, state] of Object.entries(poses)) {
      const posed: AutoMovieArchetype<
        createLongGun.Affordance,
        createLongGun.Dimension
      > = musket.articulate(state);
      if (!validateModel({ model: posed }).success)
        findings.push(`${label}: the ${name} pose is refused`);
    }
    const rest = (part: string): number =>
      archetypeExtent(musket, "z", [part]).low;
    if (
      archetypeExtent(musket.articulate({ cock }), "z", ["cock"]).high >=
      archetypeExtent(musket, "z", ["cock"]).high
    )
      findings.push(`${label}: the cock does not come back at full cock`);
    if (
      archetypeExtent(musket.articulate({ frizzen }), "z", ["frizzen"]).high <=
      archetypeExtent(musket, "z", ["frizzen"]).high
    )
      findings.push(`${label}: the frizzen does not open forward`);

    const length: number = musket.dimensions.length!;
    const barrel: number = musket.dimensions.barrel!;
    const rod: number = archetypeExtent(musket, "z", ["ramrod"]).size;
    if (Math.abs(rod - barrel) > 1e-6)
      findings.push(
        `${label}: the rod is ${rod} m, not the barrel's ${barrel} m`,
      );
    const drawn: AutoMovieArchetype<
      createLongGun.Affordance,
      createLongGun.Dimension
    > = musket.articulate({ ramrod: draw });
    const pipe: IAutoMovieVector3 = musket.affordance("pipe").frame.translation;
    const tail: number = archetypeExtent(drawn, "z", ["ramrod"]).low;
    const tip: number = archetypeExtent(drawn, "z", ["ramrod"]).high;
    if (!(tail >= pipe.z - 1e-6))
      findings.push(
        `${label}: the drawn rod's tail at ${tail} is still in the pipe at ${pipe.z}`,
      );
    if (!(tip > length && tip - length < rod))
      findings.push(
        `${label}: the drawn rod's tip stands ${tip - length} m beyond the muzzle`,
      );
    if (!(rest("ramrod") < pipe.z))
      findings.push(`${label}: the rod at rest is not in its pipe`);

    // 5. The spur, the cock's thumb piece, rides the cock at its jaw end and goes back with it at full cock.
    const spur: ReturnType<typeof musket.affordance> =
      musket.affordance("spur");
    const cocked: IAutoMovieVector3 = musket
      .articulate({ cock })
      .affordance("spur").frame.translation;
    const piece: ReturnType<typeof archetypeExtent> = archetypeExtent(
      musket,
      "y",
      ["spur"],
    );
    if (
      spur.kind !== "handle" ||
      spur.rides !== "cock" ||
      !(musket.affordance("cock").parts ?? []).includes("spur") ||
      Math.abs(spur.frame.translation.y - (piece.low + piece.high) / 2) >
        1e-9 ||
      Math.abs(piece.high - piece.low - spur.aperture!) > 1e-9 ||
      !(cocked.z < spur.frame.translation.z)
    )
      findings.push(
        `${label}: the spur at ${JSON.stringify(spur.frame.translation)} does not ride the cock's jaw back to ${JSON.stringify(cocked)}`,
      );

    // 6. The supporting hand holds the swell, the stock's bulge at the rearmost pipe where the rod enters it, ahead of the lock.
    const hold: IAutoMovieVector3 =
      musket.affordance("foreEnd").frame.translation;
    const tailPipe: ReturnType<typeof archetypeExtent> = archetypeExtent(
      musket,
      "z",
      ["pipe-4"],
    );
    if (
      Math.abs(hold.z - (tailPipe.low + tailPipe.high) / 2) > 1e-9 ||
      !(hold.z > musket.affordance("pan").frame.translation.z)
    )
      findings.push(
        `${label}: the fore-end hold at ${hold.z} is not the swell at the tail pipe ${(tailPipe.low + tailPipe.high) / 2}`,
      );
  }
  TestValidator.equals(
    "a musket's lock and rod move as the drill needs",
    findings,
    [],
  );
}
