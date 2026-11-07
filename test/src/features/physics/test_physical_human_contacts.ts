import { TestValidator } from "@nestia/e2e";

import { measurePhysicalHumanContacts } from "../internal/measurePhysicalHumanContacts";

/** Real Human face/cover/slip classification and monotone head response share native soft-glove contact, rather than injected head impulses. */
export async function test_physical_human_contacts(): Promise<void> {
  const observations: Awaited<ReturnType<typeof measurePhysicalHumanContacts>> =
    await measurePhysicalHumanContacts();
  const findings: string[] = [];
  const summarize: (row: (typeof observations)[number]) => string = (
    row: (typeof observations)[number],
  ): string =>
    JSON.stringify({
      kind: row.kind,
      motion: row.motion,
      speed: row.speed,
      peak: row.peak,
      guardError: row.guardError,
      gaps: row.gaps,
      contacts: row.contacts.map(
        (
          receipt: (typeof row.contacts)[number],
        ): {
          a: { body: string; bone: string; shape: string; material: string };
          b: { body: string; bone: string; shape: string; material: string };
          seconds: number;
          endSeconds: number;
          impulse: number | null;
          compression: number;
          samples: number | undefined;
        } => ({
          a: receipt.a,
          b: receipt.b,
          seconds: receipt.seconds,
          endSeconds: receipt.endSeconds,
          impulse: receipt.impulse,
          compression: receipt.compression,
          samples: receipt.samples?.length,
        }),
      ),
    });
  for (const row of observations) {
    const face: typeof row.contacts = row.contacts.filter(
      (receipt: (typeof row.contacts)[number]): boolean =>
        [receipt.a, receipt.b].some(
          (side: {
            body: string;
            bone: string;
            shape: string;
            material: string;
          }): boolean => side.body === "human" && side.bone === "head",
        ),
    );
    const gloves: typeof row.contacts = row.contacts.filter(
      (receipt: (typeof row.contacts)[number]): boolean =>
        receipt.a.material === "glove" && receipt.b.material === "glove",
    );
    if (
      row.kind === "hit" &&
      ((row.motion === "jab"
        ? row.contacts.length !== 1
        : row.contacts.length < 1) ||
        (row.motion === "jab" ? face.length !== 1 : face.length < 1) ||
        !(face[0]!.impulse! > 0))
    )
      findings.push(`face ${row.speed} m/s: ${summarize(row)}`);
    if (
      row.kind === "guard" &&
      ((row.motion === "jab" ? gloves.length !== 1 : gloves.length < 1) ||
        face.length !== 0)
    )
      findings.push(`guard: ${summarize(row)}`);
    if (row.kind === "slip" && row.contacts.length !== 0)
      findings.push(`slip: ${summarize(row)}`);
    if (
      row.motion === "free" &&
      row.kind === "hit" &&
      (face.length < 2 ||
        row.gaps.length !== face.length - 1 ||
        row.gaps.some((gap: number): boolean => gap <= 0))
    )
      findings.push(
        `passive recontact lacks an actual positive-clearance interval: ${summarize(row)}`,
      );
    if (
      row.contacts.some(
        (receipt: (typeof row.contacts)[number]): boolean =>
          receipt.source !== "solver" || !(receipt.impulse! > 0),
      )
    )
      findings.push(`${row.kind}: contact lacks solved momentum`);
  }
  for (const motion of ["free", "jab"] as const) {
    const hits: typeof observations = observations.filter(
      (row: (typeof observations)[number]): boolean =>
        row.kind === "hit" && row.motion === motion,
    );
    if (!(hits[0]!.peak > 0.001 && hits[1]!.peak > hits[0]!.peak))
      findings.push(
        `${motion} incoming speed does not increase actual head displacement: ${JSON.stringify(hits.map((row: (typeof hits)[number]): { speed: number; peak: number } => ({ speed: row.speed, peak: row.peak })))}`,
      );
  }
  TestValidator.equals("complete actual Human contact matrix", findings, []);
}
