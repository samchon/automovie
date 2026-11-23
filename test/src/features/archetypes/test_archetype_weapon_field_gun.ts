import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createCannon,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * The 6-pdr field gun on its M1841 carriage is the 1862 Ordnance Manual's, measured on the produced thing: its tube's and its carriage's tables agree where the muzzle stands, its vent is where the manual and Gibbon put it, and its elevation raises the muzzle about the trunnions.
 *
 * Scenarios:
 * 1. The trunnions' axis stands 43.1 in above the ground and 0.5 in behind the axle; the wheels are 57 in high and their centres 60 in apart; the gun weighs the piece's 884 lb with the carriage's 900.
 * 2. The muzzle stands 5.91 in ahead of the wheels' front (p. 74), which is also the tube's 34.91 in from the trunnions (p. 19) less the trunnions' 0.5 in behind the axle and the wheel's 28.5 in radius: the two tables agree on the produced gun.
 * 3. The trail's end lies 116.6 in behind the wheels' front, and the stock touches the ground.
 * 4. The vent's orifice is on the breech's top over its entry a quarter of the 3.67 in bore ahead of the bore's bottom, moved to the rear by its rise through the metal at 80 degrees to the axis, its `+Y` up and to the rear along the vent.
 * 5. At 12 degrees of elevation the muzzle rises by 34.91 in times the sine of 12 degrees, and at 8 degrees of depression (a travel of -8) it falls by 34.91 in times the sine of 8 degrees; the elevation goes no higher than 12 and no lower than -8 (p. 74).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the gun, measures its colliders and frames, and articulates its elevation; a figure off the manual's, a vent at the wrong end or leaning forward, a muzzle off the wheels' front, or an elevation about the wrong axis or the wrong way is caught.
 * @evidence contracts/development/testing.md#independent-expectations The manual's tables for the tube (p. 19) and the carriage (pp. 68, 74), its vent (p. 16), and Gibbon's rear-leaning vent (p. 306); scenario 2 checks one table against the other.
 * @evidence contracts/development/testing.md#distinguishing-cases The gun at rest and elevated, a fixed point (the trunnions), a riding one (the muzzle, the vent), the carriage's ends and its wheels.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_weapon_field_gun(): void {
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const findings: string[] = [];
  const near: (name: string, got: number, wanted: number) => void = (
    name: string,
    got: number,
    wanted: number,
  ): void => {
    if (Math.abs(got - wanted) > 1e-9)
      findings.push(`${name}: ${got}, ${wanted} expected`);
  };
  const gun: ReturnType<typeof createCannon> = createCannon({
    kind: "fieldGun",
  });

  // 1. The trunnions, the wheels and the weight.
  const trunnions: ReturnType<typeof gun.affordance> =
    gun.affordance("elevation");
  near("trunnions' height", trunnions.frame.translation.y, 43.1 * inch);
  near("trunnions behind the axle", trunnions.frame.translation.z, -0.5 * inch);
  near(
    "wheel height",
    archetypeExtent(gun, "y", ["wheel-left"]).size,
    57 * inch,
  );
  near(
    "track",
    gun.affordance("leftSpin").frame.translation.x -
      gun.affordance("rightSpin").frame.translation.x,
    60 * inch,
  );
  near("weight", gun.body.mass, (884 + 900) * AutoMovieArchetypeUnits.POUND);

  // 2. The muzzle ahead of the wheels' front, by both tables.
  const front: number = archetypeExtent(gun, "z", ["wheel-left"]).high;
  const muzzle: ReturnType<typeof gun.affordance> = gun.affordance("muzzle");
  near(
    "muzzle ahead of the wheels",
    muzzle.frame.translation.z - front,
    5.91 * inch,
  );
  near(
    "muzzle by the tube's table",
    muzzle.frame.translation.z,
    (34.91 - 0.5) * inch,
  );

  // 3. The trail.
  near(
    "trail's end behind the wheels' front",
    front - archetypeExtent(gun, "z", ["trail"]).low,
    116.6 * inch,
  );
  near("stock on the ground", archetypeExtent(gun, "y", ["stock"]).low, 0);

  // 4. The vent.
  const vent: ReturnType<typeof gun.affordance> = gun.affordance("vent");
  const lean: number = (80 * Math.PI) / 180;
  near(
    "vent on the breech's top",
    vent.frame.translation.y,
    (43.1 + 10.3 / 2) * inch,
  );
  near(
    "vent's orifice",
    vent.frame.translation.z,
    (34.91 - 0.5 - 57.5 + 3.67 / 4 - (10.3 / 2 - 3.67 / 2) / Math.tan(lean)) *
      inch,
  );
  const out: ReturnType<typeof AutoMovieArchetypeFrame.axis> =
    AutoMovieArchetypeFrame.axis(vent.frame, "y");
  near("vent leans up", out.y, Math.sin(lean));
  near("vent leans to the rear", out.z, -Math.cos(lean));

  // 5. The elevation.
  const raised: ReturnType<typeof createCannon> = gun.articulate({
    elevation: 12,
  });
  near(
    "muzzle raised at 12 degrees",
    raised.affordance("muzzle").frame.translation.y -
      muzzle.frame.translation.y,
    34.91 * inch * Math.sin((12 * Math.PI) / 180),
  );
  const lowered: ReturnType<typeof createCannon> = gun.articulate({
    elevation: -8,
  });
  near(
    "muzzle lowered at 8 degrees of depression",
    muzzle.frame.translation.y -
      lowered.affordance("muzzle").frame.translation.y,
    34.91 * inch * Math.sin((8 * Math.PI) / 180),
  );
  for (const beyond of [13, -9]) {
    let refused: boolean = false;
    try {
      gun.articulate({ elevation: beyond });
    } catch {
      refused = true;
    }
    if (!refused)
      findings.push(`an elevation of ${beyond} degrees was not refused`);
  }

  TestValidator.equals(
    "the field gun is the 1862 Ordnance Manual's",
    findings,
    [],
  );
}
