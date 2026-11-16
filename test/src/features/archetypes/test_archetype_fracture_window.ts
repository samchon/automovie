import { createWindow } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A window's glazed sash breaks out of its frame at its declared prototype threshold, and not below it. This checks the breakage API, not a general glass failure law or a pane-shard model.
 *
 * Scenarios, for each kind of window:
 * 1. Its body carries 25 ft-lbf, 33.9 J, as `contact.fracture`: the lowest drop at which Meshulam's 100 lb bag broke through new 1/8 in annealed window glass (IIBEC 2019).
 * 2. A hit 1 J below breaks nothing; a hit at it breaks the sash and its handle out as the `shards` fragment.
 * 3. The remainder is the wall, the jambs and the head, keeping the `sill` and the `aperture` and dropping the sash's articulation and the handle that rides it; it and the fragment pass `validateModel`.
 * 4. The fragment's and the remainder's masses sum to the window's within 1e-9 kg.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Breaks real windows at and below their threshold and reads the pieces' parts, contacts, masses and admission; a pane that breaks below its energy, keeps its handle on the frame, or loses mass is caught.
 * @evidence contracts/development/testing.md#independent-expectations The prototype threshold is Meshulam's lowest 25 ft-lbf bag-impact drop, converted here with the international foot and pound and standard gravity. It is not a measured universal projectile or sash-release threshold.
 * @evidence contracts/development/testing.md#distinguishing-cases Three kinds of window, at and 1 J below the threshold.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_fracture_window(): void {
  const findings: string[] = [];
  const BREAKING: number = 25 * 0.3048 * 0.45359237 * 9.80665;
  const momentum: { x: number; y: number; z: number } = { x: 0, y: 0, z: -3 };
  const ids = (parts: readonly IAutoMovieModelPart[]): string[] =>
    parts
      .map((p: IAutoMovieModelPart): string => p.id)
      .sort((a: string, b: string): number => a.localeCompare(b));
  for (const kind of createWindow.KINDS) {
    const window: ReturnType<typeof createWindow> = createWindow({ kind });
    const fracture: number | undefined = window.body.contact?.fracture;
    if (fracture === undefined || Math.abs(fracture - BREAKING) > 1e-9)
      findings.push(`${kind}: breaks at ${fracture} J`);
    if (window.broken({ energy: BREAKING - 1, momentum }) !== null)
      findings.push(`${kind}: breaks 1 J below its threshold`);
    const broken: ReturnType<typeof window.broken> = window.broken({
      energy: BREAKING,
      momentum,
    });
    if (broken === null || broken.remainder === null) {
      findings.push(`${kind}: does not break at its threshold`);
      continue;
    }
    const shards: (typeof broken.fragments)[number] | undefined =
      broken.fragments.find((f: { id: string }): boolean => f.id === "shards");
    if (
      shards === undefined ||
      JSON.stringify(ids(shards.archetype.parts)) !==
        JSON.stringify(["handle", "sash"])
    ) {
      findings.push(
        `${kind}: the shards are ${JSON.stringify(shards?.archetype.parts.map((p: IAutoMovieModelPart): string => p.id))}`,
      );
      continue;
    }
    const kept: string[] = broken.remainder.affordances.map(
      (a: { id: string }): string => a.id,
    );
    if (JSON.stringify(kept) !== JSON.stringify(["sill", "aperture"]))
      findings.push(`${kind}: the frame keeps ${kept.join(", ")}`);
    for (const piece of [broken.remainder, shards.archetype])
      if (!validateModel({ model: piece }).success)
        findings.push(`${kind}: ${piece.id} is not admitted`);
    const mass: number =
      broken.remainder.body.mass + shards.archetype.body.mass;
    if (Math.abs(mass - window.body.mass) > 1e-9)
      findings.push(
        `${kind}: the pieces weigh ${mass} kg, the window ${window.body.mass} kg`,
      );
  }
  TestValidator.equals(
    "a window's sash breaks out at an annealed pane's break-through energy",
    findings,
    [],
  );
}
