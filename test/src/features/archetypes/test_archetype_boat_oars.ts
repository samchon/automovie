import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
  createBoat,
  rowBoat,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A rowed rowboat's oars keep their handles at the oarlocks, put their blades in the water only between catch and finish, and stroke at the rate the speed sets.
 *
 * Scenarios, for a rowboat rowed 40 m straight at 1.5 m/s, already at that speed when the course begins and still at it when it ends, so no rate of speeding up or slowing enters, read every twentieth of a second through its first five strokes; the handle's held run is read off the boat's handle contact and each blade's corners off its own posed box:
 * 1. Each handle stays its inboard length less half its grip from its oarlock's pivot, the inboard Shaw and Tenney's half span plus 2 in, within 1e-9 m.
 * 2. Each blade's lowest corner is below the water only while the stroke is between a catch and the next finish, the drive taking Kleshnev's 0.84 r + 25.1 percent of the cycle at the stroke rate r held inside 26 to 36.5 strokes a minute.
 * 3. The ride names `catch1` to `catch5`, each where the boat has covered that many strokes' distance, within 1e-6 m.
 * 4. Rowing a canoe is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Rows the boat and reads its handles' and blades' world places at each read; a handle sliding off its oarlock, a blade in the water on the recovery or out of it mid-drive, or catches at another rate is caught.
 * @evidence contracts/development/testing.md#independent-expectations The inboard rule and Kleshnev's rhythm are written here from their sources; the blade's corners are worked from its posed part, not from the ride's own phase.
 * @evidence contracts/development/testing.md#distinguishing-cases Both oars through five strokes, the drive and the recovery, and a boat without oars.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_boat_oars(): void {
  const findings: string[] = [];
  const boat: AutoMovieArchetype<createBoat.Affordance, createBoat.Dimension> =
    createBoat({ kind: "rowboat" }, 5);
  const d: Readonly<Partial<Record<createBoat.Dimension, number>>> =
    boat.dimensions;
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 40 }],
    cruise: 1.5,
    startSpeed: 1.5,
    endSpeed: 1.5,
  };
  // The handle's held run, read off the boat's own handle contact.
  const grip: number = boat.affordance("leftHandle").length!;
  const ride: AutoMovieArchetypeRide.IRide<
    createBoat.Affordance,
    createBoat.Dimension
  > = rowBoat(boat, course);
  const inboard: number = d.beam! / 2 + 2 * AutoMovieArchetypeUnits.INCH;
  const pivotY: number = d.depth! - d.draft! + createBoat.LOCK;
  const share: number =
    (0.84 * Math.min(Math.max((60 * 1.5) / rowBoat.STROKE, 26), 36.5) + 25.1) /
    100;
  const catches: readonly { seconds: number; label: string }[] =
    ride.instants.filter((i: { label: string }): boolean =>
      i.label.startsWith("catch"),
    );
  for (let k: number = 1; k <= 5; k++) {
    const instant: { seconds: number; label: string } | undefined =
      catches.find((i: { label: string }): boolean => i.label === `catch${k}`);
    if (
      instant === undefined ||
      Math.abs(ride.at(instant.seconds).course.distance - k * rowBoat.STROKE) >
        1e-6
    )
      findings.push(`catch${k} is not at ${k} strokes' distance`);
  }
  const end: number =
    catches.find((i: { label: string }): boolean => i.label === "catch6")
      ?.seconds ?? ride.duration;
  for (
    let seconds: number = catches[0]?.seconds ?? 0;
    seconds < end;
    seconds += 0.05
  ) {
    const sample: AutoMovieArchetypeRide.ISample<
      createBoat.Affordance,
      createBoat.Dimension
    > = ride.at(seconds);
    const phase: number = (sample.course.distance / rowBoat.STROKE) % 1;
    const driving: boolean = phase > 1e-6 && phase < share - 1e-6;
    const recovering: boolean = phase > share + 1e-6 && phase < 1 - 1e-6;
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const pivot: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
        sample.placement,
        AutoMovieArchetypeFrame.upright(
          Vector3.create((sign * d.beam!) / 2, pivotY, 0),
        ),
      ).translation;
      const handle: IAutoMovieVector3 = ride.frame(
        `${side}Handle`,
        seconds,
      ).translation;
      if (
        Math.abs(
          Vector3.length(Vector3.subtract(handle, pivot)) -
            (inboard - grip / 2),
        ) > 1e-9
      )
        findings.push(
          `${side} handle leaves its oarlock at ${seconds.toFixed(2)} s`,
        );
      const low: number = lowest(
        sample.archetype.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === `blade-${side}`,
        )!,
        sample.placement,
      );
      if (driving && !(low < 0))
        findings.push(
          `${side} blade is out of the water mid-drive at ${seconds.toFixed(2)} s`,
        );
      if (recovering && !(low > 0))
        findings.push(
          `${side} blade is in the water on the recovery at ${seconds.toFixed(2)} s`,
        );
    }
  }
  try {
    rowBoat(createBoat({ kind: "canoe" }), course);
    findings.push("a canoe was rowed");
  } catch (error) {
    if (!(error instanceof AutoMovieArchetypeRefusal))
      findings.push(`a canoe failed otherwise: ${String(error)}`);
  }
  TestValidator.equals("the oars row as the stroke cycle asks", findings, []);
}

/**
 * A blade's lowest corner above the water.
 *
 * @param blade The posed blade part, a box whose own size gives its corners.
 * @param placement The boat's placement.
 * @returns The corner's height, metres.
 */
function lowest(
  blade: IAutoMovieModelPart,
  placement: IAutoMovieTransform,
): number {
  if (
    blade.geometry.type !== "primitive" ||
    blade.geometry.shape.type !== "box"
  )
    throw new Error(`the blade ${blade.id} is not a box`);
  const size: { width: number; height: number; depth: number } =
    blade.geometry.shape;
  let least: number = Number.POSITIVE_INFINITY;
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1]) {
        const local: IAutoMovieVector3 = Vector3.add(
          blade.transform!.translation,
          Quaternion.rotateVector(
            blade.transform!.rotation,
            Vector3.create(
              (x * size.width) / 2,
              (y * size.height) / 2,
              (z * size.depth) / 2,
            ),
          ),
        );
        least = Math.min(
          least,
          AutoMovieArchetypeFrame.compose(
            placement,
            AutoMovieArchetypeFrame.upright(local),
          ).translation.y,
        );
      }
  return least;
}
