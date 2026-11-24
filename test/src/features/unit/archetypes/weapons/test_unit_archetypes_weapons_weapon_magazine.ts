import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createHandgun,
  createMagazine,
  createPolearm,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A magazine is sized as its makers publish, seats up into a pistol's grip by its base, and a lance is held behind its balance.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a pistol magazine 125.55 mm long and 28.5 mm across its grip, 1.4 oz, all Strike Industries'; a rifle magazine 7.5 in long and 0.87 in across its grip, 5 oz to 146 g.
 * 2. A loaded magazine weighs its rounds more: 237 g for the pistol's 17, 357 g for the rifle's 30.
 * 3. A pistol magazine whose `base` is made to coincide with a full-size pistol's `magazine` socket stands up inside the grip: its feed end above the grip's base by its length, its middle inside the grip's outline.
 * 4. Over 200 seeds a lance's head is 207 to 277 mm and its shaft the Pattern 1894's 2.76 m overall less it, and for ten seeds its `grip` lies behind its centre of mass toward the butt, so a couched lance carries its point forward of the hand.
 */
export function test_unit_archetypes_weapons_weapon_magazine(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "pistol magazine length",
      0.12555,
      0.12555,
      "Strike Industries SI-G-MAG-17",
      (seed: number): number =>
        archetypeExtent(createMagazine({ kind: "pistol" }, seed), "y").size,
    ),
    row(
      "pistol magazine grip",
      0.0285,
      0.0285,
      "Strike Industries SI-G-MAG-17",
      (seed: number): number =>
        createMagazine({ kind: "pistol" }, seed).affordance("grip").aperture!,
    ),
    row(
      "pistol magazine mass",
      1.4 * AutoMovieArchetypeUnits.OUNCE,
      1.4 * AutoMovieArchetypeUnits.OUNCE,
      "Strike Industries SI-G-MAG-17",
      (seed: number): number =>
        createMagazine({ kind: "pistol" }, seed).body.mass,
    ),
    row(
      "rifle magazine length",
      7.5 * AutoMovieArchetypeUnits.INCH,
      7.5 * AutoMovieArchetypeUnits.INCH,
      "Magpul PMAG 30",
      (seed: number): number =>
        archetypeExtent(createMagazine({ kind: "rifle" }, seed), "y").size,
    ),
    row(
      "rifle magazine grip",
      0.87 * AutoMovieArchetypeUnits.INCH,
      0.87 * AutoMovieArchetypeUnits.INCH,
      "T.REX Arms' PMAG table",
      (seed: number): number =>
        createMagazine({ kind: "rifle" }, seed).affordance("grip").aperture!,
    ),
    row(
      "rifle magazine mass",
      5 * AutoMovieArchetypeUnits.OUNCE,
      0.146,
      "Magpul and T.REX Arms",
      (seed: number): number =>
        createMagazine({ kind: "rifle" }, seed).body.mass,
    ),
    row(
      "pistol rounds",
      0.237,
      0.237,
      "GLOCK G17 Gen5, 945 less 708 g",
      (seed: number): number =>
        createMagazine({ kind: "pistol", loaded: true }, seed).body.mass -
        createMagazine({ kind: "pistol" }, seed).body.mass,
    ),
    row(
      "rifle rounds",
      0.357,
      0.357,
      "T.REX Arms, 503 less 146 g",
      (seed: number): number =>
        createMagazine({ kind: "rifle", loaded: true }, seed).body.mass -
        createMagazine({ kind: "rifle" }, seed).body.mass,
    ),
    row(
      "lance shaft",
      2.76 - 0.277,
      2.76 - 0.207,
      "Royal Armouries lances",
      (seed: number): number =>
        archetypeExtent(createPolearm({ kind: "lance" }, seed), "y", ["shaft"])
          .size,
    ),
    row(
      "lance head",
      0.207,
      0.277,
      "Royal Armouries lances",
      (seed: number): number =>
        archetypeExtent(createPolearm({ kind: "lance" }, seed), "y", ["head"])
          .size,
    ),
  ]);

  // 3. A pistol magazine seated by its base on the well's mouth stands up in the grip.
  for (const seed of [0, 1, 2]) {
    const gun: ReturnType<typeof createHandgun> = createHandgun(
      { frame: "fullSize" },
      seed,
    );
    const magazine: ReturnType<typeof createMagazine> = createMagazine(
      { kind: "pistol" },
      seed,
    );
    const well: IAutoMovieTransform = gun.affordance("magazine").frame;
    const base: IAutoMovieTransform = magazine.affordance("base").frame;

    // The magazine's placement P with P * base = well: P = well * base^-1, base^-1 turning by the inverse rotation and shifting by -R^-1 t.
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(base.rotation);
    const placement: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
      well,
      {
        translation: Vector3.scale(
          Quaternion.rotateVector(inverse, base.translation),
          -1,
        ),
        rotation: inverse,
        scale: { x: 1, y: 1, z: 1 },
      },
    );
    const seat = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.point(placement, local);
    const feed: IAutoMovieVector3 = seat(
      magazine.affordance("feed").frame.translation,
    );
    const middle: IAutoMovieVector3 = seat(
      magazine.affordance("grip").frame.translation,
    );
    const grip: Readonly<
      Record<"x" | "z", ReturnType<typeof archetypeExtent>>
    > = {
      x: archetypeExtent(gun, "x", ["grip"]),
      z: archetypeExtent(gun, "z", ["grip"]),
    };
    if (
      Math.abs(feed.y - (well.translation.y + magazine.dimensions.length!)) >
        1e-9 ||
      !(middle.x > grip.x.low && middle.x < grip.x.high) ||
      !(middle.z > grip.z.low && middle.z < grip.z.high)
    )
      findings.push(
        `pistol@${seed}: a seated magazine's feed at ${JSON.stringify(feed)}, middle at ${JSON.stringify(middle)}`,
      );
  }

  // 4. A lance's grip lies behind its balance.
  for (let seed: number = 0; seed < 10; seed++) {
    const lance: ReturnType<typeof createPolearm> = createPolearm(
      { kind: "lance" },
      seed,
    );
    if (
      !(
        lance.affordance("grip").frame.translation.y <
        lance.properties.centerOfMass.y
      )
    )
      findings.push(`lance@${seed}: the grip is not behind the balance`);
  }
  TestValidator.equals(
    "magazines and the lance stay in their cited bands",
    findings,
    [],
  );
}
