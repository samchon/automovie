import { AutoMovieArchetypeFrame, createShield } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A shield slung on a back hangs by its rearmost face, its front outward.
 *
 * Scenarios, for both read bucklers and the round shield at three seeds:
 * 1. `slung` is a socket at the centre of the shield's rearmost face: on the shield's axis, at the lowest `Z` any of its colliders reaches, so nothing of the shield lies between it and the wearer.
 * 2. Its `+Y` points along `-Z`, toward the wearer, away from the face, and its `+X` across the shield, square to it.
 * 3. The shield with the contact passes `validateModel`, and its face, boss, rim and grip are kept.
 */
export function test_unit_archetypes_weapons_shield_slung(): void {
  const findings: string[] = [];
  const shields: [string, ReturnType<typeof createShield>][] = [
    ["buckler a315", createShield({ kind: "buckler", model: "a315" })],
    ["buckler a316", createShield({ kind: "buckler", model: "a316" })],
    ...[0, 1, 2].map(
      (seed: number): [string, ReturnType<typeof createShield>] => [
        `round shield ${seed}`,
        createShield({ kind: "round" }, seed),
      ],
    ),
  ];
  const close: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): boolean => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= 1e-12;
  for (const [label, shield] of shields) {
    const slung: ReturnType<typeof shield.affordance> =
      shield.affordance("slung");
    const at: IAutoMovieVector3 = slung.frame.translation;
    const back: number = archetypeExtent(shield, "z").low;
    if (
      slung.kind !== "socket" ||
      !(
        Math.abs(at.x) <= 1e-12 &&
        Math.abs(at.y) <= 1e-12 &&
        Math.abs(at.z - back) <= 1e-12
      )
    )
      findings.push(
        `${label}: slung at ${JSON.stringify(at)}, the rearmost face at z ${back}`,
      );
    if (
      !close(AutoMovieArchetypeFrame.axis(slung.frame, "y"), {
        x: 0,
        y: 0,
        z: -1,
      }) ||
      !close(AutoMovieArchetypeFrame.axis(slung.frame, "x"), {
        x: 1,
        y: 0,
        z: 0,
      })
    )
      findings.push(
        `${label}: slung faces ${JSON.stringify(slung.frame.rotation)}`,
      );
    if (!validateModel({ model: shield }).success)
      findings.push(`${label}: not admitted`);
    for (const id of ["grip", "face", "boss", "rim"] as const)
      if (!shield.affordances.some((a: { id: string }): boolean => a.id === id))
        findings.push(`${label}: lost ${id}`);
  }
  TestValidator.equals(
    "a slung shield hangs by its rearmost face",
    findings,
    [],
  );
}
