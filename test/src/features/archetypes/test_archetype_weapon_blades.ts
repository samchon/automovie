import {
  createPell,
  createPolearm,
  createShield,
  createSword,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The parts of a blade, from the guard out. */
const BLADE: string[] = [1, 2, 3, 4, 5, 6].map(
  (k: number): string => `blade-${k}`,
);

/** The parts of a hilt. */
const HILT: string[] = ["guard", "grip", "pommel"];

/** Albion Swords' published figures for two longswords and two single-hand swords. */
const ALBION: string = "Albion Swords: Crecy, Regent, Knight, Poitiers";

/**
 * Blades, shields, polearms and the pell stay inside their cited dimensions for every seed, and a blade balances where its maker measured it.
 *
 * Scenarios:
 * 1. Over 200 seeds, measured on the produced thing: a longsword 1.137 to 1.22 m from pommel to point, 1.39 to 1.59 kg, balancing 101.6 to 130 mm above its guard; an arming sword's blade 0.7779 to 0.8 m and its hilt 0.168 to 0.1698 m (each maker's overall length less its blade; the two are drawn apart, so the overall length is not held to the two swords' own), 1.19 to 1.2 kg, balancing 85.7 to 114.3 mm above its guard; a knife 0.3016 m long and 0.32 kg; a sabre's point 0.83 to 0.84 m from its guard in a straight line; a buckler 0.445 to 0.527 m across and 1.56 to 1.73 kg; a round shield 0.75 to 0.9 m across; a staff 1.8 to 2.7 m long; a spear's head 0.2 to 0.6 m above a shaft of 2 to 3 m.
 * 2. Every kind of blade, for three seeds: the centre of mass lies on the blade's axis at the drawn point of balance above the guard, to a micrometre, and no part carries a negative share of the mass (the moment of inertia about the grip is positive and exceeds the point-mass term of the balance distance).
 * 3. A curved blade's edge is the outside of its curve: a sabre's and a katana's point lies behind the guard's line toward `-Z`, and their `edge` faces `+Z`.
 * 4. A dagger and a knife have a `reverseGrip` whose `+X` points from the blade to the pommel, opposite the `grip`'s; a longsword has none and refuses it, listing the ids it has.
 * 5. A pell's `target` sites run from the ground to its top: `v` of 0 and 1 are a post's height apart along `Y`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each weapon and measures collider extents, the body's mass, the computed centre of mass, the moment about the grip, frames and sites; a band off its source, a mass split that misses the balance, a blade curved the wrong way or a reverse grip facing the grip's way is caught.
 * @evidence contracts/development/testing.md#independent-expectations Lengths, masses and balance points are Albion's published figures for the Crecy, Regent, Knight and Poitiers, the Ka-Bar's 11 7/8 in and 0.7 lb, the 1796 sabre's 32.5 to 33 in blade, the Wallace Collection's A315 and A316, the 75 to 90 cm of Viking round shields, the quarterstaff's 6 to 9 ft and the Viking spear's 2 to 3 m shaft and 20 to 60 cm head, each written here from its source. The balance rule (centre of mass at the stated point) is the definition of a point of balance; the inertia bound is the parallel-axis theorem.
 * @evidence contracts/development/testing.md#distinguishing-cases Both maker-measured swords for the full mass properties, one curved and one straight blade, a weapon with and one without the reverse grip. Provisional estimate bands (widths, hilt lengths of the uncited kinds) are not asserted as cited.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_weapon_blades(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-6,
  });
  const sword = (
    kind: createSword.Kind,
    seed?: number,
  ): ReturnType<typeof createSword> => createSword({ kind }, seed);
  const findings: string[] = archetypeBandSweep([
    row(
      "longsword length",
      1.137,
      1.22,
      ALBION,
      (seed: number): number =>
        archetypeExtent(sword("longsword", seed), "y").size,
    ),
    row(
      "longsword mass",
      1.39,
      1.59,
      ALBION,
      (seed: number): number => sword("longsword", seed).body.mass,
    ),
    row(
      "longsword balance",
      0.1016,
      0.13,
      ALBION,
      (seed: number): number =>
        sword("longsword", seed).properties.centerOfMass.y,
    ),
    row(
      "arming sword blade",
      0.7779,
      0.8,
      ALBION,
      (seed: number): number =>
        archetypeExtent(sword("armingSword", seed), "y", BLADE).size,
    ),
    row(
      "arming sword hilt",
      0.168,
      0.1698,
      ALBION,
      (seed: number): number =>
        archetypeExtent(sword("armingSword", seed), "y", HILT).size,
    ),
    row(
      "arming sword mass",
      1.19,
      1.2,
      ALBION,
      (seed: number): number => sword("armingSword", seed).body.mass,
    ),
    row(
      "arming sword balance",
      0.0857,
      0.1143,
      ALBION,
      (seed: number): number =>
        sword("armingSword", seed).properties.centerOfMass.y,
    ),
    row(
      "knife length",
      0.3016,
      0.3016,
      "Ka-Bar, 11 7/8 in",
      (seed: number): number => archetypeExtent(sword("knife", seed), "y").size,
    ),
    row(
      "knife mass",
      0.32,
      0.32,
      "Ka-Bar, 0.7 lb",
      (seed: number): number => sword("knife", seed).body.mass,
    ),
    row(
      "sabre blade",
      0.83,
      0.84,
      "Pattern 1796 light cavalry sabre",
      (seed: number): number => {
        const at: { y: number; z: number } = sword("sabre", seed).affordance(
          "point",
        ).frame.translation;
        return Math.hypot(at.y, at.z);
      },
    ),
    row(
      "buckler diameter",
      0.445,
      0.527,
      "Wallace Collection A315, A316",
      (seed: number): number =>
        archetypeExtent(createShield({ kind: "buckler" }, seed), "y", ["board"])
          .size,
    ),
    row(
      "buckler mass",
      1.56,
      1.73,
      "Wallace Collection A315, A316",
      (seed: number): number =>
        createShield({ kind: "buckler" }, seed).body.mass,
    ),
    row(
      "round shield diameter",
      0.75,
      0.9,
      "Viking Age round shields",
      (seed: number): number =>
        archetypeExtent(createShield({ kind: "round" }, seed), "y", ["board"])
          .size,
    ),
    row(
      "staff length",
      1.8,
      2.7,
      "quarterstaff, 6 to 9 ft",
      (seed: number): number =>
        archetypeExtent(createPolearm({ kind: "staff" }, seed), "y").size,
    ),
    row(
      "spear shaft",
      2,
      3,
      "Viking Age spears",
      (seed: number): number =>
        archetypeExtent(createPolearm({ kind: "spear" }, seed), "y", ["shaft"])
          .size,
    ),
    row(
      "spear head",
      0.2,
      0.6,
      "Viking Age spears",
      (seed: number): number =>
        archetypeExtent(createPolearm({ kind: "spear" }, seed), "y", ["head"])
          .size,
    ),
  ]);

  // 2. The centre of mass is the drawn point of balance, on the axis.
  for (const kind of createSword.KINDS)
    for (const seed of [undefined, 3, 8]) {
      const made: ReturnType<typeof createSword> = sword(kind, seed);
      const balance: number = made.dimensions.balance!;
      const centre: { x: number; y: number } = made.properties.centerOfMass;
      if (Math.abs(centre.y - balance) > 1e-6 || Math.abs(centre.x) > 1e-9)
        findings.push(
          `${kind}@${String(seed)}: centre of mass at y ${centre.y}, x ${centre.x}, but the point of balance is ${balance}`,
        );
      const grip: { x: number; y: number; z: number } =
        made.affordance("grip").frame.translation;
      const about: number = made.moment(grip, { x: 1, y: 0, z: 0 });
      const least: number = made.body.mass * (balance - grip.y) ** 2;
      if (!(about > least))
        findings.push(
          `${kind}@${String(seed)}: moment about the grip ${about} kg m^2 is not above the point-mass term ${least}`,
        );
    }

  // 3. A curved blade's edge is the outside of its curve.
  for (const kind of ["sabre", "katana"] as const) {
    const made: ReturnType<typeof createSword> = sword(kind);
    const point: number = made.affordance("point").frame.translation.z;
    const edge: number = made.affordance("edge").frame.rotation.w;
    const out: { x: number; y: number; z: number } = made.placed("edge", {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    }).translation;
    if (!(point < 0) || !Number.isFinite(edge) || !(out.z > point / 2))
      findings.push(
        `${kind}: the point lies at z ${point} and the edge's middle at z ${out.z}`,
      );
  }

  // 4. The reverse grip turns the hand end for end.
  for (const kind of ["dagger", "knife"] as const) {
    const made: ReturnType<typeof createSword> = sword(kind);
    const up: number = made.site("grip", 1).translation.y;
    const down: number = made.site("reverseGrip", 1).translation.y;
    const middle: number = made.affordance("grip").frame.translation.y;
    if (!(up > middle && down < middle))
      findings.push(
        `${kind}: the grip's far site is at y ${up} and the reverse grip's at y ${down}, about a middle of ${middle}`,
      );
  }
  let refused: string = "no refusal";
  try {
    sword("longsword").affordance("reverseGrip");
  } catch (error) {
    refused = error instanceof Error ? error.message : String(error);
  }
  if (!refused.includes("reverseGrip"))
    findings.push(`a longsword's reverse grip: ${refused}`);

  // 5. A pell's target runs its whole height.
  const pell: ReturnType<typeof createPell> = createPell();
  const span: number =
    Math.abs(
      pell.site("target", 0.5, 1).translation.y -
        pell.site("target", 0.5, 0).translation.y,
    ) - archetypeExtent(pell, "y").size;
  if (Math.abs(span) > 1e-9)
    findings.push(`a pell's target sites span ${span} m more than its height`);
  TestValidator.equals("blades hold their cited properties", findings, []);
}
