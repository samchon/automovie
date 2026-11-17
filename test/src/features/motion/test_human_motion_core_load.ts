import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanCarriedLean, HumanForce, HumanLoad } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Loads, a moving support and slips (#3431): `HumanLoad` and the carried
 * lean that reads it.
 *
 * Scenarios, on the masses and centre heights of `EXTREMES`' lightest and
 * heaviest bodies and the average man (38, 118 and 76 kg at 0.80, 1.05 and
 * 0.95 m):
 * 1. Statics: a load `m` held `d` ahead leans the body back by `θ` with
 *    `M h sin θ = m d`, so the combined centre `(M (-h sin θ) + m d) / (M +
 *    m)` lies over the base within 5 mm (the issue's bound), for loads of
 *    5, 10 and 20 kg at 0.3 and 0.5 m; doubling the load leans further
 *    (metamorphic); a load behind leans forward; a load whose moment
 *    exceeds the body's at a right angle is reported (null), never clamped.
 * 2. A carry's lean layer adds half the balanced lean to the spine and half
 *    to the chest when the load is known, and the table's provisional angle
 *    when it is not, unchanged from before #3431.
 * 3. Moving support: the inertial force of a support accelerating at `a` is
 *    `-M a` on the rider, read at a second inside its span and zero outside;
 *    the static tipping bound flips exactly where `h a / g` passes the
 *    base's half-length (a 0.12 m half-length here), 1 % either side.
 * 4. Slip: the required friction is `|a_h| / (g + a_y)`: 0.3 for a
 *    horizontal 0.3 g, under a dry floor's 0.4 and over ice's 0.05 (both
 *    provisional coefficients for the case, not measured); 0.2 for 0.3 g
 *    forward on a floor rising at 0.5 g, which presses the feet harder;
 *    0.5 for 0.3 g sideways with 0.4 g forward, the horizontal magnitude;
 *    infinite for a body not pressed onto the floor.
 * 5. The sustained forces on a person at a second sum, both kinds of value
 *    read, another person's left out.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public lean, layer, inertial force, tipping bound, required friction and sum; a lean that leaves the combined centre off the base, a layer that ignores a known load or changes the table, a force with the wrong sign, a tipping bound off its closed form or a friction ratio misread fails.
 * @evidence contracts/development/testing.md#independent-expectations Static moment balance written out, d'Alembert's inertial force, the centre of pressure's shift `h a / g`, and the required coefficient's definition.
 * @evidence contracts/development/testing.md#distinguishing-cases Three bodies, six loads, ahead and behind, an unbalanceable load, known and unknown masses, both sides of the tipping bound, three floors and an airborne body; the push of a prop belongs to `test_human_motion_prop_dynamics`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of pure functions, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios with their bounds.
 */
export function test_human_motion_core_load(): void {
  const findings: string[] = [];
  const g: number = AutoMovieGravity.STANDARD;
  const bodies: [number, number][] = [
    [38, 0.8],
    [118, 1.05],
    [76, 0.95],
  ];

  // 1. Statics.
  for (const [mass, height] of bodies) {
    for (const load of [5, 10, 20])
      for (const ahead of [0.3, 0.5]) {
        const lean: number | null = HumanLoad.lean({
          mass,
          height,
          load,
          ahead,
        });
        if (lean === null) {
          findings.push(
            `${mass} kg: ${load} kg at ${ahead} m reported unbalanceable`,
          );
          continue;
        }
        const shift: number = height * Math.sin((lean * Math.PI) / 180);
        const combined: number = (mass * shift + load * ahead) / (mass + load);
        if (Math.abs(combined) > 0.005)
          findings.push(
            `${mass} kg with ${load} kg at ${ahead} m: the combined centre lies ${(1000 * combined).toFixed(2)} mm off`,
          );
        if (!(lean < 0))
          findings.push(
            `${mass} kg: a load ahead leans ${lean} degrees, not back`,
          );
      }
    const one: number = HumanLoad.lean({ mass, height, load: 10, ahead: 0.3 })!;
    const two: number = HumanLoad.lean({ mass, height, load: 20, ahead: 0.3 })!;
    if (!(two < one))
      findings.push(
        `${mass} kg: doubling the load leans ${two} against ${one}`,
      );
    const behind: number | null = HumanLoad.lean({
      mass,
      height,
      load: 10,
      ahead: -0.3,
    });
    if (behind === null || !(behind > 0))
      findings.push(`${mass} kg: a load behind leans ${behind}`);
    if (
      HumanLoad.lean({ mass, height, load: 10 * mass, ahead: height }) !== null
    )
      findings.push(`${mass} kg: an unbalanceable load is clamped to a lean`);
  }

  // 2. The carry's layer.
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const context: never = {} as never;
  const known: IAutoMovieMotionHumanPosture = HumanCarriedLean.layer("cradle", {
    mass: 76,
    height: 0.95,
    load: 20,
    ahead: 0.3,
  }).apply(posture, 0, context);
  const balanced: number = HumanLoad.lean({
    mass: 76,
    height: 0.95,
    load: 20,
    ahead: 0.3,
  })!;
  if (
    Math.abs(known.joints.spine![0] - balanced / 2) > 1e-12 ||
    Math.abs(known.joints.chest![0] - balanced / 2) > 1e-12
  )
    findings.push(
      `a known load's layer adds ${known.joints.spine![0]} and ${known.joints.chest![0]}, not half of ${balanced}`,
    );
  for (const carry of ["piggyback", "cradle", "overShoulder"] as const) {
    const unknown: IAutoMovieMotionHumanPosture = HumanCarriedLean.layer(
      carry,
    ).apply(posture, 0, context);
    if (
      Math.abs(unknown.joints.spine![0] - HumanCarriedLean.LEANS[carry] / 2) >
      1e-12
    )
      findings.push(
        `${carry} without a mass leans ${unknown.joints.spine![0]}, not the table's half`,
      );
  }

  // 3. Moving support.
  const braking = (): IAutoMovieVector3 => ({ x: 0, y: 0, z: -3 });
  const inertial: IAutoMovieMotionHumanForce.ISustained = HumanLoad.inertial(
    "a",
    76,
    braking,
    1,
    2,
  );
  const force: IAutoMovieVector3 = HumanForce.at(inertial, 1.5);
  if (Vector3.length(Vector3.subtract(force, { x: 0, y: 0, z: 228 })) > 1e-9)
    findings.push(
      `the inertial force of a 3 m/s² braking is ${JSON.stringify(force)}`,
    );
  if (Vector3.length(HumanForce.at(inertial, 2.5)) !== 0)
    findings.push("the inertial force acts outside its span");
  for (const [, height] of bodies) {
    const bound: number = (0.12 * g) / height;
    if (HumanLoad.tips(0.99 * bound, height, 0.12))
      findings.push(`a centre at ${height} m tips 1 % under the static bound`);
    if (!HumanLoad.tips(1.01 * bound, height, 0.12))
      findings.push(`a centre at ${height} m stands 1 % over the static bound`);
  }

  // 4. Slip.
  const sideways: number = HumanLoad.required({ x: 0.3 * g, y: 0, z: 0 });
  if (Math.abs(sideways - 0.3) > 1e-12)
    findings.push(`a horizontal 0.3 g needs ${sideways}`);
  if (!(sideways < 0.4) || !(sideways > 0.05))
    findings.push("0.3 does not fall between ice's 0.05 and a dry floor's 0.4");
  const pressed: number = HumanLoad.required({ x: 0, y: 0.5 * g, z: 0.3 * g });
  if (Math.abs(pressed - 0.2) > 1e-12)
    findings.push(`0.3 g forward on a floor rising at 0.5 g needs ${pressed}`);
  const both: number = HumanLoad.required({ x: 0.3 * g, y: 0, z: 0.4 * g });
  if (Math.abs(both - 0.5) > 1e-12)
    findings.push(`0.3 g sideways and 0.4 g forward need ${both}, not 0.5`);
  if (HumanLoad.required({ x: 1, y: -g, z: 0 }) !== Number.POSITIVE_INFINITY)
    findings.push("a body in free fall needs finite friction");

  // 5. The sum of sustained forces.
  const sum: IAutoMovieVector3 = HumanLoad.sustained(
    [
      inertial,
      { ...inertial, force: { x: 1, y: 2, z: 3 } },
      { ...inertial, subject: "b" },
    ],
    "a",
    1.5,
  );
  if (Vector3.length(Vector3.subtract(sum, { x: 1, y: 2, z: 231 })) > 1e-9)
    findings.push(`the sustained forces sum to ${JSON.stringify(sum)}`);

  TestValidator.predicate(
    `loads and slips: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
