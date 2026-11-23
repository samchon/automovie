import {
  type AutoMovieArchetype,
  type IAutoMovieArchetypeBand,
  createHandgun,
  createLongGun,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** How many seeds are swept: the 200 of the archetype campaign's acceptance law (#3365). */
const SEEDS: number = 200;

/** The contacts the firearm laws read on every gun, and the two more on a long gun. */
const CONTACTS: Readonly<{
  every: readonly string[];
  long: readonly string[];
}> = {
  every: ["grip", "trigger", "muzzle", "sight"],
  long: ["foreEnd", "butt"],
};

/**
 * Each period and repeating firearm stays inside its bands, says which are provisional, and offers the contacts the firearm laws read.
 *
 * Scenarios, over 200 seeds of each new kind (the musket, the bolt-action rifle, the lever action, the revolver and the flintlock pistol):
 * 1. Every drawn dimension lies inside the band the archetype records it was drawn in.
 * 2. The lock time of every new kind is marked provisional: none is read at a primary source.
 * 3. Each has a `grip`, a `trigger`, a `muzzle` and a `sight`, and a long gun a `foreEnd` and a `butt`; each publishes a muzzle velocity and a lock time.
 * 4. For three seeds, every flintlock, the musket's and the pistol's, has a `cock`, its thumb piece the `spur` (a handle riding the cock), a `frizzen` and a `pan`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and reads its dimensions against its recorded bands and its contacts by id; a value outside its band, an unmarked lock time or a missing contact is caught.
 * @evidence contracts/development/testing.md#independent-expectations The contact ids are the firearm laws' (`HumanWeaponFirearm`), written here; the bands are read from the archetype's own provenance, so the check is that the draw honours what it records.
 * @evidence contracts/development/testing.md#distinguishing-cases Five kinds over two producers, each across its models and bands.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_weapon_firearm_eras_bands(): void {
  const findings: string[] = [];
  const sweep = <Dimension extends string>(
    label: string,
    make: (seed: number) => AutoMovieArchetype<string, Dimension>,
    long: boolean,
  ): void => {
    for (let seed: number = 0; seed < SEEDS; seed++) {
      const gun: AutoMovieArchetype<string, Dimension> = make(seed);
      const d: Readonly<Partial<Record<Dimension, number>>> = gun.dimensions;
      for (const [name, band] of Object.entries(gun.provenance.bands) as [
        Dimension,
        IAutoMovieArchetypeBand,
      ][]) {
        const value: number = d[name]!;
        if (!(value >= band.minimum - 1e-12 && value <= band.maximum + 1e-12))
          findings.push(
            `${label}@${seed}: ${name} ${value} outside ${band.minimum} to ${band.maximum}`,
          );
      }
      const lock: IAutoMovieArchetypeBand | undefined = (
        gun.provenance.bands as Readonly<
          Record<string, IAutoMovieArchetypeBand>
        >
      )["lockTime"];
      if (lock !== undefined && lock.provisional !== true)
        findings.push(
          `${label}@${seed}: its lock time is not marked provisional`,
        );
      for (const name of ["muzzleVelocity", "lockTime"])
        if ((d as Readonly<Record<string, number>>)[name] === undefined)
          findings.push(`${label}@${seed}: no ${name}`);
      const ids: readonly string[] = gun.affordances.map(
        (a: { id: string }): string => a.id,
      );
      for (const id of [...CONTACTS.every, ...(long ? CONTACTS.long : [])])
        if (!ids.includes(id)) findings.push(`${label}@${seed}: no ${id}`);
    }
  };
  for (const kind of ["musket", "rifle", "leverAction"] as const)
    sweep(
      kind,
      (seed: number): AutoMovieArchetype<string, createLongGun.Dimension> =>
        createLongGun({ kind }, seed),
      true,
    );
  for (const frame of ["revolver", "flintlock"] as const)
    sweep(
      frame,
      (seed: number): AutoMovieArchetype<string, createHandgun.Dimension> =>
        createHandgun({ frame }, seed),
      false,
    );
  // 4. Every flintlock, the musket's and the pistol's, offers the lock a drill works: the cock with its spur riding it, the frizzen and the pan.
  for (const seed of [0, 1, 2])
    for (const [label, lock] of [
      ["musket", createLongGun({ kind: "musket" }, seed)],
      ["flintlock", createHandgun({ frame: "flintlock" }, seed)],
    ] as const) {
      const ids: readonly string[] = lock.affordances.map(
        (a: { id: string }): string => a.id,
      );
      for (const id of ["cock", "spur", "frizzen", "pan"])
        if (!ids.includes(id))
          findings.push(`${label}@${seed}: its lock has no ${id}`);
      const spur: { kind: string; rides?: string } | undefined =
        lock.affordances.find((a: { id: string }): boolean => a.id === "spur");
      if (
        spur !== undefined &&
        (spur.kind !== "handle" || spur.rides !== "cock")
      )
        findings.push(`${label}@${seed}: the spur does not ride the cock`);
    }
  TestValidator.equals(
    "the period and repeating firearms stay in their bands",
    findings,
    [],
  );
}
