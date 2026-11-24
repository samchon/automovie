import type { AutoMovieArchetype } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * Every working affordance of every archetype states what its frame's `+Y` is (`IAutoMovieAffordance.direction`): `along` the object toward that point, or the `normal` of a working face, so a grasp chooser reads it instead of guessing from an angle.
 *
 * The expected table is each archetype's own documentation of its working points: a muzzle, a blade's or a spear's point, a pole's, a javelin's or a baton's end, a racket's sweet spot, a golf club's or a hammer throw's head, a torch's lens, a pen's, a screwdriver's, a fork's, a tube's or a lipstick's tip, a sponge's end, a worm's and a priming wire's point, a cannon's vent and its primer's eye, an atlatl's spur, a vessel's lip and mouth, a cigarette's ends, a musket cartridge's torn end, a lighter's and a light's flame, and a loaf's and a drumstick's bitten end run `along`; an apple's bitten side, a bat's or a baton's strike, a racket's, a club's, a hammer's, a spoon's, a saw's, a cloth's, a broom's, a rammer's, a handspike's, a comb's, a toothbrush's, a razor's, a tissue's, a sheet's, a book's, a watch's and a shield's faces, a shield's boss and rim, a sponge-and-rammer's two named heads, an ox's poll, horn bases and hocks, a blade's edges and flat, a glove's pocket and a device's lens and screen are `normal`.
 *
 * Scenarios, for every row of the archetype catalog at the middle of its bands:
 * 1. Each working affordance the table names for the row's producer (or for the row's own kind where kinds differ) that the row declares states the table's direction.
 * 2. A row of a producer the table names declares at least one of them.
 * 3. No other affordance of any row states a direction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds every catalog archetype and reads its declared affordances; a working point left without its direction, one with the other direction, or a direction on a contact that is no working point fails with the row and the id.
 * @evidence contracts/development/testing.md#independent-expectations The table is written here from each archetype's documented frames, not read from the builders.
 * @evidence contracts/development/testing.md#distinguishing-cases Both directions, kinds of one producer that differ (a hammer's face against a screwdriver's tip), and producers with no working point.
 * @evidence contracts/development/testing.md#execution-ownership Builds each catalog archetype once in memory; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the contract, where the table comes from and the 3 scenarios.
 */
export function test_archetype_contract_direction(): void {
  const along = "along" as const;
  const normal = "normal" as const;
  type Table = Readonly<Record<string, "along" | "normal">>;
  const PRODUCERS: Readonly<Record<string, Table>> = {
    drinkware: { lip: along, mouth: along },
    device: { lens: normal, screen: normal, speaker: normal },
    tree: { trunk: normal },
    fireRing: { rim: normal, fire: along },
    smoking: { mouth: along, flame: along },
    longTool: { face: normal },
    handgun: { muzzle: along },
    longGun: { muzzle: along },
    cannon: { muzzle: along, vent: along, primer: along },
    club: { strike: normal },
    sword: { edge: normal, falseEdge: normal, flat: normal, point: along },
    shield: { face: normal, boss: normal, rim: normal },
    polearm: { tip: along, butt: along },
    wearable: { face: normal },
    cleaning: { face: normal },
    torch: { lens: along },
    vaultingPole: { tip: along },
    racket: { face: normal, sweetSpot: along },
    golfClub: { face: normal, head: along },
    glove: { pocket: normal },
    boxingGlove: { face: normal },
    stick: { blade: normal },
    cue: { tip: along },
    javelin: { point: along },
    hammerThrow: { head: along },
    relayBaton: { front: along, back: along },
    light: { light: along },
    ox: { head: normal, horns: normal, hind: normal },
  };
  const KINDS: Readonly<Record<string, Table>> = {
    "stationery-book": { face: normal },
    "stationery-paper": { face: normal },
    "stationery-pen": { face: along },
    "stationery-clipboard": { face: normal },
    "stationery-map": { face: normal },
    "careItem-tissue": { face: normal },
    "careItem-comb": { face: normal },
    "careItem-toothbrush": { face: normal },
    "careItem-razor": { face: normal },
    "careItem-tube": { face: along },
    "careItem-lipstick": { face: along },
    "tool-hammer": { face: normal },
    "tool-saw": { face: normal },
    "tool-spoon": { face: normal },
    "tool-screwdriver": { face: along },
    "tool-fork": { face: along },
    "microphone-handheld": { head: along },
    "longTool-fishingRod": { tip: along },
    "longTool-spongeRammer": {
      face: normal,
      tip: along,
      rammer: normal,
      sponge: normal,
    },
    "longTool-worm": { face: along },
    "tool-primingWire": { face: along },
    "projectile-arrow": { tip: along },
    "projectile-bolt": { tip: along },
    "projectile-cartridge": { end: along },
    "tool-ladle": { face: normal },
    "tool-knife": { face: normal },
    "food-bread": { bite: along },
    "food-apple": { bite: normal },
    "food-drumstick": { bite: along },
    "ball-puck": { rim: normal },
    "stick-lacrosse": { blade: normal, scoop: normal },
    "longTool-sling": {},
    "longTool-atlatl": { spur: along },
  };
  // Rows of those producers that have no working point: a remote, a hat, a helmet, spectacles and a sling, whose pouch holds a stone it throws from the hand.
  const OPTIONAL: ReadonlySet<string> = new Set([
    "longTool-sling",
    "device-remote",
    "wearable-hat",
    "wearable-helmet",
    "wearable-spectacles",
  ]);
  const complaints: string[] = [];
  for (const row of archetypeCatalog()) {
    const model: AutoMovieArchetype = row.create();
    const table: Table | undefined =
      KINDS[row.name] ?? PRODUCERS[row.name.split("-")[0]!];
    let declared: number = 0;
    for (const a of model.affordances as readonly IAutoMovieAffordance[]) {
      const wanted: "along" | "normal" | undefined = table?.[a.id];
      if (wanted === undefined) {
        if (a.direction !== undefined)
          complaints.push(
            `${row.name}.${a.id} states ${a.direction}, no working point`,
          );
        continue;
      }
      declared++;
      if (a.direction !== wanted)
        complaints.push(
          `${row.name}.${a.id} states ${a.direction ?? "nothing"}, ${wanted} expected`,
        );
    }
    if (table !== undefined && declared === 0 && !OPTIONAL.has(row.name))
      complaints.push(`${row.name} declares none of its working points`);
  }
  TestValidator.equals(
    "every working affordance states its direction",
    complaints,
    [],
  );
}
