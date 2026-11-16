import {
  type Archetype,
  ArchetypeRefusal,
  createCannon,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** An inch, metres. */
const IN: number = 0.0254;

/** A foot, metres. */
const FT: number = 12 * IN;

/** Standard gravity, metres per second squared. */
const G: number = 9.80665;

/**
 * A shot leaves the field gun's muzzle along its bore at its read muzzle velocity, and a drag-free flight from it outranges the manual's 5 degree range.
 *
 * Scenarios:
 * 1. At elevations of -8, 0, 5 and 12 degrees the launch starts at the muzzle socket's place, its direction is a unit vector rising by the sine of the elevation, its speed the manual's 1439 ft/s and its calibre the 3.58 in shot.
 * 2. A drag-free flight at 5 degrees reaches farther than 1,500 m, as the issue's acceptance holds, while the manual's measured range at 5 degrees is 1,523 yd: drag is what shortens it.
 * 3. A mortar, which publishes no muzzle velocity, is refused at `kind`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Launches from the gun at four elevations and from a mortar; a launch off the muzzle, off the bore, at another speed or calibre, or an unrefused mortar is caught.
 * @evidence contracts/development/testing.md#independent-expectations The speed, the calibre and the range are written here from the 1861 manual's pages; the drag-free range is the textbook `v^2 sin 2a / g`.
 * @evidence contracts/development/testing.md#distinguishing-cases Four elevations including both of the gun's ends, and a refused kind.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_cannon_launch(): void {
  const findings: string[] = [];
  const gun: Archetype<createCannon.Affordance, createCannon.Dimension> =
    createCannon({ kind: "fieldGun" }, 1);
  for (const elevation of [-8, 0, 5, 12]) {
    const shot: createCannon.ILaunch = createCannon.launch(gun, { elevation });
    const muzzle: IAutoMovieVector3 = gun
      .articulate({ elevation })
      .affordance("muzzle").frame.translation;
    if (Vector3.length(Vector3.subtract(shot.origin, muzzle)) > 1e-9)
      findings.push(`at ${elevation} degrees the launch is off the muzzle`);
    if (
      Math.abs(Vector3.length(shot.direction) - 1) > 1e-9 ||
      Math.abs(shot.direction.y - Math.sin((elevation * Math.PI) / 180)) > 1e-9
    )
      findings.push(
        `at ${elevation} degrees the direction is ${JSON.stringify(shot.direction)}`,
      );
    if (
      Math.abs(shot.speed - 1439 * FT) > 1e-9 ||
      Math.abs(shot.calibre - 3.58 * IN) > 1e-12
    )
      findings.push(
        `at ${elevation} degrees the speed is ${shot.speed} and the calibre ${shot.calibre}`,
      );
  }
  const speed: number = createCannon.launch(gun).speed;
  const range: number = (speed * speed * Math.sin((10 * Math.PI) / 180)) / G;
  if (!(range > 1500 && range > 1523 * 3 * FT))
    findings.push(`the drag-free range at 5 degrees is ${range} m`);
  let refused: unknown = null;
  try {
    createCannon.launch(createCannon({ kind: "mortar" }, 1));
  } catch (error) {
    refused = error;
  }
  if (!(refused instanceof ArchetypeRefusal && refused.axis === "kind"))
    findings.push("a mortar's launch is not refused");
  TestValidator.equals(
    "a shot leaves along the bore at the read speed",
    findings,
    [],
  );
}
