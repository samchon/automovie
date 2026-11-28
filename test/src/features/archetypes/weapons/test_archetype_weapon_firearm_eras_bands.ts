import { type AutoMovieArchetype, type IAutoMovieArchetypeBand, AutoMovieArchetypeHandgun, AutoMovieArchetypeLongGun } from "@automovie/archetypes";
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
 * @evidence contracts/development/common.md#meaningful-documentation Names the era sweep, recorded dimension bounds, provisional metadata and required animation contact IDs.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each public scenic variant for the seeded samples and checks actual dimensions against its provenance plus the expected local animation contacts.
 * @evidence contracts/development/testing.md#independent-expectations The required IDs are literal fixtures from the motion contact vocabulary. The dimension assertions check agreement with returned provenance and the provisional label.
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
      (seed: number): AutoMovieArchetype<string, AutoMovieArchetypeLongGun.Dimension> =>
        AutoMovieArchetypeLongGun.create({ kind }, seed),
      true,
    );
  for (const frame of ["revolver", "flintlock"] as const)
    sweep(
      frame,
      (seed: number): AutoMovieArchetype<string, AutoMovieArchetypeHandgun.Dimension> =>
        AutoMovieArchetypeHandgun.create({ frame }, seed),
      false,
    );
  // 4. Every flintlock, the musket's and the pistol's, offers the lock a drill works: the cock with its spur riding it, the frizzen and the pan.
  for (const seed of [0, 1, 2])
    for (const [label, lock] of [
      ["musket", AutoMovieArchetypeLongGun.create({ kind: "musket" }, seed)],
      ["flintlock", AutoMovieArchetypeHandgun.create({ frame: "flintlock" }, seed)],
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
