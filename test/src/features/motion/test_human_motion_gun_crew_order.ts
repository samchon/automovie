import type { AutoMovieComposition } from "@automovie/engine";
import { HumanGunCrew } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A field gun's crew (#3489) composes its duties in the NPS drill's order,
 * each synced to the end of the one before it, and the lanyard to the
 * gunner's command.
 *
 * Scenarios:
 * 1. The drill is one parallel group of twelve duties: the cover, the
 *    sponge, the pass, the load, the ram, the prick, the lay, the primer,
 *    three steps clear and the pull.
 * 2. The sponge waits on the cover's start; every later duty but the steps
 *    clear and the pull waits on the end of the one before it, in the
 *    drill's order.
 * 3. Nos. 1 to 3 step clear after the primer is hooked.
 * 4. The pull waits on the command's cue instant.
 * 5. Every duty is performed by the role the drill gives it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the composition the crew builds; a duty out of order, synced to the wrong instant or given to the wrong role fails.
 * @evidence contracts/development/testing.md#independent-expectations The order and the roles are the NPS drill's, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases The first duty, the chained ones, the steps clear and the commanded pull.
 * @evidence contracts/development/testing.md#execution-ownership Builds the composition in memory; no performance is resolved.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios.
 */
export function test_human_motion_gun_crew_order(): void {
  const roles: HumanGunCrew.IRoles = {
    gunner: "g",
    n1: "a",
    n2: "b",
    n3: "c",
    n4: "d",
    n5: "e",
  };
  const drill: AutoMovieComposition = HumanGunCrew.drill(roles, {
    gun: "gun",
    rammer: "rammer",
    charge: "charge",
    wire: "wire",
    primer: "primer",
    lanyard: "lanyard",
    bore: 1.6,
    vent: 0.08,
    lay: 90,
    pull: 0.3,
    clear: {
      n1: { x: -2, y: 0, z: 0 },
      n2: { x: 2, y: 0, z: 0 },
      n3: { x: -2, y: 0, z: -1 },
    },
    command: { of: "orders", event: "fire" },
  });
  TestValidator.equals("the drill is one parallel group", drill.kind, "parallel");
  if (drill.kind !== "parallel") return;
  const parts: readonly AutoMovieComposition[] = drill.parts;
  TestValidator.equals("twelve duties", parts.length, 12);

  // Each part is one chain of one duty, or one synced to an instant.
  const intent = (node: AutoMovieComposition) => {
    const inner: AutoMovieComposition =
      node.kind === "sequence" ? node.parts.at(-1)! : node;
    const at = inner.kind === "at" ? inner : undefined;
    const leaf: AutoMovieComposition = at === undefined ? inner : at.part;
    return {
      at,
      intent: leaf.kind === "intent" ? leaf.intent : undefined,
    };
  };
  const read = parts.map(intent);
  const names: string[] = read.map((r) => r.intent?.capability ?? "");
  TestValidator.equals("the duties in the drill's order", names, [
    "coverVent",
    "spongeBore",
    "passCharge",
    "loadCharge",
    "ramCharge",
    "prickVent",
    "layGun",
    "hookPrimer",
    "standClear",
    "standClear",
    "standClear",
    "pullLanyard",
  ]);
  TestValidator.equals(
    "the duties by role",
    read.map((r) => r.intent?.subject),
    ["c", "a", "e", "b", "a", "c", "g", "d", "a", "b", "c", "d"],
  );
  TestValidator.equals(
    "each duty waits on the instant before it",
    read.map((r) => (r.at === undefined ? "" : `${r.at.anchor}:${r.at.event}`)),
    [
      "",
      "coverVent:start",
      "spongeBore:end",
      "passCharge:end",
      "loadCharge:end",
      "ramCharge:end",
      "prickVent:end",
      "layGun:end",
      "hookPrimer:end",
      "hookPrimer:end",
      "hookPrimer:end",
      "orders:fire",
    ],
  );
}
