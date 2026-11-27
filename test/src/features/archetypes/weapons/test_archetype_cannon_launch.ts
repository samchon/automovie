import { type AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal, AutoMovieArchetypeCannon } from "@automovie/archetypes";
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
 * 4. Mutating one launch's origin leaves the gun's muzzle and later launches unchanged.
 * 5. A naval 32-pounder's 6.14 and 6.20 in shot gauges launch inside its 6.41 in bore; a bore never fills in for an unknown shot. Nonpositive/non-finite speed or shot diameter and absent clearance are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Launches from the gun at four elevations and from a mortar; a launch off the muzzle, off the bore, at another speed or calibre, or an unrefused mortar is caught.
 * @evidence contracts/development/testing.md#independent-expectations Field-gun speed, calibre and range are the 1861 manual's; the drag-free range is v² sin(2a)/g. Naval shot gauges 6.14/6.20 in and bore 6.41 in are distinct columns of Griffiths 1856 p. 59. Positive clearance and finite positive launch data follow the declared launch contract; authored generic metadata isolate refusal decisions.
 * @evidence contracts/development/testing.md#distinguishing-cases Four field elevations, a refused kind, origin ownership, both naval shot gauges, unknown shot diameter, nonpositive/non-finite speed and shot size, and zero/negative/non-finite bore clearance.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists all five scenarios, the ballistic references, size-versus-bore distinction, refusals and launch-origin ownership.
 */
export function test_archetype_cannon_launch(): void {
  const findings: string[] = [];
  const gun: AutoMovieArchetype<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = AutoMovieArchetypeCannon.create({ kind: "fieldGun" }, 1);
  for (const elevation of [-8, 0, 5, 12]) {
    const shot: AutoMovieArchetypeCannon.ILaunch = AutoMovieArchetypeCannon.launch(gun, { elevation });
    const muzzle: IAutoMovieVector3 = gun
      .articulate({ elevation })
      .affordance("muzzle").frame.translation;
    if (!(Vector3.length(Vector3.subtract(shot.origin, muzzle)) <= 1e-9))
      findings.push(`at ${elevation} degrees the launch is off the muzzle`);
    if (
      !(
        Math.abs(Vector3.length(shot.direction) - 1) <= 1e-9 &&
        Math.abs(shot.direction.y - Math.sin((elevation * Math.PI) / 180)) <=
          1e-9
      )
    )
      findings.push(
        `at ${elevation} degrees the direction is ${JSON.stringify(shot.direction)}`,
      );
    if (
      !(
        Math.abs(shot.speed - 1439 * FT) <= 1e-9 &&
        Math.abs(shot.calibre - 3.58 * IN) <= 1e-12
      )
    )
      findings.push(
        `at ${elevation} degrees the speed is ${shot.speed} and the calibre ${shot.calibre}`,
      );
  }
  const speed: number = AutoMovieArchetypeCannon.launch(gun).speed;
  const range: number = (speed * speed * Math.sin((10 * Math.PI) / 180)) / G;
  if (!(range > 1500 && range > 1523 * 3 * FT))
    findings.push(`the drag-free range at 5 degrees is ${range} m`);
  let refused: unknown = null;
  try {
    AutoMovieArchetypeCannon.launch(AutoMovieArchetypeCannon.create({ kind: "mortar" }, 1));
  } catch (error) {
    refused = error;
  }
  if (
    !(refused instanceof AutoMovieArchetypeRefusal && refused.axis === "kind")
  )
    findings.push("a mortar's launch is not refused");
  const launch: AutoMovieArchetypeCannon.ILaunch = AutoMovieArchetypeCannon.launch(gun);
  const original: IAutoMovieVector3 = {
    ...gun.affordance("muzzle").frame.translation,
  };
  launch.origin.x += 1;
  if (
    !(
      Vector3.length(
        Vector3.subtract(gun.affordance("muzzle").frame.translation, original),
      ) <= 1e-12 &&
      Vector3.length(
        Vector3.subtract(AutoMovieArchetypeCannon.launch(gun).origin, original),
      ) <= 1e-12
    )
  )
    findings.push("mutating a launch origin changed the gun or a later launch");
  for (const diameter of [6.14, 6.2]) {
    const naval: ReturnType<typeof AutoMovieArchetypeCannon.create> = AutoMovieArchetypeCannon.create({
      kind: "navalGun",
      ball: diameter * IN,
    });
    const shot: AutoMovieArchetypeCannon.ILaunch = AutoMovieArchetypeCannon.launch(naval);
    if (
      !(
        Math.abs(shot.calibre - diameter * IN) <= 1e-12 &&
        shot.calibre < 6.41 * IN
      )
    )
      findings.push(`naval shot ${diameter} in was replaced by its bore`);
  }
  for (const ball of [undefined, 0, -1, Number.NaN, Infinity, -Infinity])
    if (!refuses(metadata(ball), "ball"))
      findings.push(`unknown or invalid shot diameter ${ball} was accepted`);
  for (const speed of [0, -1, Number.NaN, Infinity, -Infinity])
    if (!refuses(metadata(1, speed), "muzzleVelocity"))
      findings.push(`invalid launch speed ${speed} was accepted`);
  for (const bore of [0, -1, 1, 0.5, Number.NaN, Infinity, -Infinity])
    if (!refuses(metadata(1, 1, bore), "bore"))
      findings.push(`invalid or insufficient bore ${bore} was accepted`);
  const authored: AutoMovieArchetypeCannon.ILaunch = AutoMovieArchetypeCannon.launch(metadata(1));
  if (authored.calibre !== 1 || authored.speed !== 1)
    findings.push("valid authored launch data were replaced or refused");
  TestValidator.equals(
    "a shot leaves along the bore at the read speed",
    findings,
    [],
  );

  /** Authored metadata isolate launch admission without altering a producer or its methods. */
  function metadata(
    ball: number | undefined,
    speed: number = 1,
    bore: number = 2,
  ): AutoMovieArchetype<AutoMovieArchetypeCannon.Affordance, AutoMovieArchetypeCannon.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeCannon.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "cannon",
        AutoMovieArchetypeCannon.UNITS,
        undefined,
        {},
      );
    draw.derive("muzzleVelocity", speed);
    draw.derive("bore", bore);
    if (ball !== undefined) draw.derive("ball", ball);
    return new AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCannon.Affordance,
      AutoMovieArchetypeCannon.Dimension
    >({
      name: "launch metadata fixture",
      material: "steel",
      draw,
    })
      .box("body", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
      .affordance({
        id: "muzzle",
        kind: "socket",
        direction: "along",
        extent: null,
        frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      })
      .build(1);
  }

  /** Observe the public structured repair axis, never replace a launch implementation. */
  function refuses(
    model: AutoMovieArchetype<AutoMovieArchetypeCannon.Affordance, AutoMovieArchetypeCannon.Dimension>,
    axis: string,
  ): boolean {
    try {
      AutoMovieArchetypeCannon.launch(model);
    } catch (error) {
      return error instanceof AutoMovieArchetypeRefusal && error.axis === axis;
    }
    return false;
  }
}
