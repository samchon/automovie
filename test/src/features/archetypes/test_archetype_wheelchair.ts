import {
  type IArchetypeBand,
  createWheelchair,
  rideWheelchair,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A wheelchair is drawn inside its maker's bands, built at the sizes it drew, declares its contacts at the places the sheet measures, and rolls its wheels, and a self-propelled chair's rims with them, by the distance.
 *
 * Scenarios, for both kinds over 100 seeds:
 * 1. Every drawn dimension lies inside its band.
 * 2. The built chair measures what it drew: its width across the rear wheels and its height at the push handles within 1 mm, its length from the rear wheels' back to the footplates' front within 1 mm.
 * 3. The seat's front edge is at the seat height and `seatDepth` deep; each armrest bar is `armHeight` above the seat at its side and runs the seat's depth; each footplate is `footDrop` below the seat; the push handles' grips are at the overall height behind the back; each kind of contact is the kind the act reads (`seat`, `bar`, `pedal`, `handle`); within 1 mm.
 * 4. A self-propelled chair has both rims, `wheel` contacts riding their wheels' spin, with the rim's radius; a transport chair has none.
 * 5. Rolled 3 m by `rideWheelchair`, each wheel's spin is 3 over its circumference turns, modulo a turn, within 1e-9 degrees, and a rim's site has gone round with it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the chairs, measures their parts, reads their contacts and rides them; a dimension outside its band, a chair built at another size, a contact misplaced or of the wrong kind, a rim on a transport chair, or a wheel that skids is caught.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the Karma Medical 2025 sheet's as `createWheelchair.BANDS` cites them; the places are that sheet's definitions (seat height at the front edge, armrest to seat, footrest to seat); rolling without slipping turns a wheel once per circumference.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds, every dimension, every contact kind, a chair with and without rims, a still and a rolled chair.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_wheelchair(): void {
  const findings: string[] = [];
  for (const kind of createWheelchair.KINDS)
    for (let seed: number = 0; seed < 100; seed++) {
      const chair: ReturnType<typeof createWheelchair> = createWheelchair({ kind }, seed);
      const d: Readonly<Partial<Record<createWheelchair.Dimension, number>>> = chair.dimensions;
      const label: string = `${kind}@${seed}`;
      const close = (a: number, b: number, what: string): void => {
        if (!(Math.abs(a - b) <= 1e-3)) findings.push(`${label}: ${what} ${a}, not ${b}`);
      };

      // 1. Inside the bands.
      for (const [name, band] of Object.entries(createWheelchair.BANDS[kind]) as [createWheelchair.Dimension, IArchetypeBand][])
        if (!(d[name]! >= band.minimum && d[name]! <= band.maximum))
          findings.push(`${label}: ${name} ${d[name]} outside its band`);

      // 2. Built at the drawn size.
      const x: { low: number; high: number } = archetypeExtent(chair, "x", ["wheel-left", "wheel-right"]);
      const y: { low: number; high: number } = archetypeExtent(chair, "y");
      const z: { low: number; high: number } = archetypeExtent(chair, "z", ["wheel-left", "footplate-left"]);
      close(x.high - x.low, d.width!, "width");
      close(y.high, d.height!, "height");
      close(z.high - z.low, d.length!, "length");

      // 3. The contacts at the sheet's places, of the kinds acts read.
      const at = (id: createWheelchair.Affordance): IAutoMovieVector3 =>
        chair.affordance(id).frame.translation;
      const kindOf = (id: createWheelchair.Affordance): IAutoMovieAffordance["kind"] =>
        chair.affordance(id).kind;
      close(at("seat").y, d.seatHeight!, "seat height");
      close(chair.affordance("seat").depth!, d.seatDepth!, "seat depth");
      for (const side of ["left", "right"] as const) {
        const arm: IAutoMovieAffordance = chair.affordance(`${side}Arm`);
        close(arm.frame.translation.y - 0.015, d.seatHeight! + d.armHeight!, `${side} armrest height`);
        close(arm.length!, d.seatDepth!, `${side} armrest length`);
        close(at(`${side}Footplate`).y - 0.005, d.seatHeight! - d.footDrop!, `${side} footplate`);
        close(at(`${side}Handle`).y, d.height!, `${side} handle height`);
        for (const [id, wanted] of [
          [`${side}Arm`, "bar"],
          [`${side}Footplate`, "pedal"],
          [`${side}Handle`, "handle"],
        ] as const)
          if (kindOf(id) !== wanted) findings.push(`${label}: ${id} is a ${kindOf(id)}`);
      }
      if (kindOf("seat") !== "seat") findings.push(`${label}: the seat is a ${kindOf("seat")}`);

      // 4. Rims on a self-propelled chair only.
      const rims: IAutoMovieAffordance[] = chair.affordances.filter((a: IAutoMovieAffordance): boolean => a.id.endsWith("Rim"));
      if (kind === "transport" ? rims.length !== 0 : rims.length !== 2 || rims.some((r: IAutoMovieAffordance): boolean => r.kind !== "wheel" || !r.rides?.endsWith("Spin") || r.radius !== createWheelchair.RIM / 2))
        findings.push(`${label}: rims ${rims.map((r: IAutoMovieAffordance): string => r.id).join()}`);
    }

  // 5. Rolling.
  const chair: ReturnType<typeof createWheelchair> = createWheelchair({}, 5);
  const ride: ReturnType<typeof rideWheelchair> = rideWheelchair(chair, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 3 }],
    cruise: 1,
    acceleration: 0.5,
    deceleration: 0.5,
  });
  const rolled: ReturnType<typeof createWheelchair> = ride.at(ride.duration).archetype;
  const turns: number = 3 / (Math.PI * chair.dimensions.wheelDiameter!);
  const expected: number = (((turns * 360) % 360) + 360) % 360;
  for (const id of ["leftSpin", "rightSpin"] as const)
    if (Math.abs(rolled.travel(id) - expected) > 1e-9)
      findings.push(`${id} at ${rolled.travel(id)}, not ${expected}`);
  const centre: IAutoMovieVector3 = chair.affordance("leftSpin").frame.translation;
  const site = (archetype: ReturnType<typeof createWheelchair>): IAutoMovieVector3 =>
    Vector3.subtract(archetype.site("leftRim", 0).translation, centre);
  const before: IAutoMovieVector3 = site(chair);
  const after: IAutoMovieVector3 = site(rolled);
  const angle: number = (Math.atan2(after.z * before.y - after.y * before.z, after.y * before.y + after.z * before.z) * 180) / Math.PI;
  if (Math.abs((((angle - expected) % 360) + 540) % 360 - 180) > 1e-6)
    findings.push(`the rim's site went round ${angle}, not ${expected}`);
  TestValidator.equals("a wheelchair is its maker's chair", findings, []);
}
