import { sampleCompiledEffect } from "@automovie/engine";
import type { IAutoMovieCompiledEffect } from "@automovie/interface";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PhysicalLegacyEffectFixtures as Legacy } from "../../internal/PhysicalLegacyEffectFixtures";

/** All original effect landings enter shared compiled streams with at least the original particle budget and persistent blood stains. */
export async function test_physical_legacy_effects(): Promise<void> {
  const record: Legacy.IRecord = JSON.parse(
    await readFile(
      path.join(
        import.meta.dirname,
        "../../fixtures/physical/kickboxing-audit-effects.json",
      ),
      "utf8",
    ),
  );
  const geometry: { contacts: { action: { id: string }; gap: number }[] } =
    JSON.parse(
      await readFile(
        path.join(
          import.meta.dirname,
          "../../fixtures/physical/kickboxing-legacy.json",
        ),
        "utf8",
      ),
    );
  const effects: ReturnType<typeof Legacy.compile> = Legacy.compile(
    record.impacts,
    new Map(
      geometry.contacts.map(
        (contact: (typeof geometry.contacts)[number]): [string, number] => [
          contact.action.id,
          contact.gap,
        ],
      ),
    ),
  );
  const findings: string[] = [];
  const emitted: number = effects.reduce(
    (sum: number, effect: IAutoMovieCompiledEffect): number =>
      sum + effect.recipe.emission.burst,
    0,
  );
  if (emitted < record.droplets.length)
    findings.push(
      `shared emission ${emitted} below ${record.droplets.length} original droplets`,
    );
  let stains: number = 0;
  for (const effect of effects) {
    const early: number = Math.max(0, effect.start - 1 / 120);
    if (sampleCompiledEffect(effect, early).particles.length !== 0)
      findings.push(`${effect.id}: particles before contact`);
    const seconds: number = effect.start + 0.1;
    const captured: string = JSON.stringify(
      sampleCompiledEffect(effect, seconds),
    );
    const late: ReturnType<typeof sampleCompiledEffect> = sampleCompiledEffect(
      effect,
      179,
    );
    if (effect.recipe.motion.ballistic?.retainStains) {
      stains += late.particles.length;
      if (
        !late.particles.every(
          (particle: (typeof late.particles)[number]): boolean =>
            particle.position.y === 0.002 && particle.normal?.y === 1,
        )
      )
        findings.push(`${effect.id}: unstable floor stain`);
    }
    if (JSON.stringify(sampleCompiledEffect(effect, seconds)) !== captured)
      findings.push(`${effect.id}: seek changes shared stream`);
  }
  if (
    stains <
    record.droplets.filter(
      (droplet: (typeof record.droplets)[number]): boolean =>
        droplet.stain !== undefined,
    ).length
  )
    findings.push("shared path loses original persistent stain count");
  assert.deepEqual(
    findings,
    [],
    "all original contact-driven shared effect outcomes",
  );
}
