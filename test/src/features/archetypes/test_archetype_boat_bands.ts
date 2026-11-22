import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  createBoat,
} from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Each boat stays inside its bands and seats its people where its sources put them.
 *
 * Scenarios:
 * 1. Over 200 seeds each kind's every drawn dimension lies inside its band, and every band cites its source.
 * 1b. Each kind's every dimension fixed a micrometre past either end of its band is refused on that dimension.
 * 2. A rowboat's rowing thwart stands 0.17 of the oarlocks' span below their pivot and its aft edge 0.22 of the span ahead of them (WoodenBoat's oar geometry table); its rower faces the stern and its stern seat faces the bow.
 * 3. A canoe's seats stand their seat height above its bottom and face the bow.
 * 4. A launch's five thwarts stand 7 in below its gunwale and 28 in apart (the Peake boat), its rowers facing the stern.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws each kind across seeds and reads its dimensions and seats; a value outside its band, a band without a source, or a seat off its sourced place or facing the wrong way is caught.
 * @evidence contracts/development/testing.md#independent-expectations The 0.17 and 0.22 shares, the 7 in and the 28 in are the sources' figures written here, worked from the boat's drawn beam, depth and draft.
 * @evidence contracts/development/testing.md#distinguishing-cases Three kinds over 200 seeds, both ends of every band, a rower facing aft and a paddler facing forward.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_boat_bands(): void {
  const findings: string[] = [];
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  for (const kind of createBoat.KINDS) {
    for (const band of Object.values(createBoat.BANDS[kind]))
      if (band === undefined || band.source.length === 0)
        findings.push(`${kind}: a band without a source`);
    for (let seed: number = 0; seed < 200; seed++) {
      const boat: AutoMovieArchetype<
        createBoat.Affordance,
        createBoat.Dimension
      > = createBoat({ kind }, seed);
      for (const [dimension, band] of Object.entries(createBoat.BANDS[kind])) {
        const value: number | undefined =
          boat.dimensions[dimension as createBoat.Dimension];
        if (
          band !== undefined &&
          !(
            value !== undefined &&
            value >= band.minimum &&
            value <= band.maximum
          )
        )
          findings.push(
            `${kind}@${seed}: ${dimension} ${value} outside its band`,
          );
      }
    }
  }
  // 1b. A step past either end of every band is refused on that dimension.
  for (const kind of createBoat.KINDS)
    for (const [dimension, band] of Object.entries(createBoat.BANDS[kind]) as [
      createBoat.Dimension,
      { minimum: number; maximum: number } | undefined,
    ][]) {
      if (band === undefined) continue;
      for (const value of [band.minimum - 1e-6, band.maximum + 1e-6]) {
        let refused: string | null = null;
        try {
          createBoat({ kind, [dimension]: value });
        } catch (error) {
          refused =
            error instanceof AutoMovieArchetypeRefusal
              ? error.axis
              : String(error);
        }
        if (refused !== dimension)
          findings.push(
            `${kind} with a ${dimension} of ${value} was refused at ${refused}`,
          );
      }
    }
  const at = (
    boat: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension>,
    id: createBoat.Affordance,
  ): IAutoMovieVector3 => boat.affordance(id).frame.translation;
  const facing = (
    boat: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension>,
    id: createBoat.Affordance,
  ): number =>
    Math.sign(AutoMovieArchetypeFrame.axis(boat.affordance(id).frame, "z").z);
  for (const seed of [0, 3, 7, 12]) {
    const row: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension> =
      createBoat({ kind: "rowboat" }, seed);
    const d: Readonly<Partial<Record<createBoat.Dimension, number>>> =
      row.dimensions;
    const span: number = d.beam!;
    const pivot: number = d.depth! - d.draft! + createBoat.LOCK;
    const seat: IAutoMovieVector3 = at(row, "thwart0");
    if (!close(seat.y, pivot - 0.17 * span) || !close(seat.z, 0.22 * span))
      findings.push(
        `rowboat@${seed}: the rowing thwart is off WoodenBoat's geometry`,
      );
    if (facing(row, "thwart0") !== -1 || facing(row, "sternSeat") !== 1)
      findings.push(`rowboat@${seed}: a seat faces the wrong way`);
    const canoe: AutoMovieArchetype<
      createBoat.Affordance,
      createBoat.Dimension
    > = createBoat({ kind: "canoe" }, seed);
    const bottom: number = -createBoat.DRAFT.canoe;
    for (const id of ["thwart0", "thwart1"] as const)
      if (
        !close(at(canoe, id).y, bottom + canoe.dimensions.seatHeight!) ||
        facing(canoe, id) !== 1
      )
        findings.push(
          `canoe@${seed}: ${id} is off its seat height or faces aft`,
        );
  }
  const launch: AutoMovieArchetype<
    createBoat.Affordance,
    createBoat.Dimension
  > = createBoat({ kind: "launch" });
  const gunwale: number = launch.dimensions.depth! - createBoat.DRAFT.launch;
  const seats: number[] = (
    ["thwart0", "thwart1", "thwart2", "thwart3", "thwart4"] as const
  ).map((id: createBoat.Affordance): number => {
    if (
      !close(at(launch, id).y, gunwale - 7 * AutoMovieArchetypeUnits.INCH) ||
      facing(launch, id) !== -1
    )
      findings.push(
        `launch: ${id} is off 7 in below the gunwale or faces forward`,
      );
    return at(launch, id).z;
  });
  for (let k: number = 1; k < seats.length; k++)
    if (!close(seats[k]! - seats[k - 1]!, 28 * AutoMovieArchetypeUnits.INCH))
      findings.push(`launch: thwarts ${k - 1} and ${k} are not 28 in apart`);
  TestValidator.equals("the boats stand inside their bands", findings, []);
}
