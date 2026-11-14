import type { Archetype } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type IHumanProp,
} from "@automovie/motions";

import { archetypeExtent } from "./archetypeExtent";
import { motionHumanBody } from "./motionHumanBody";

/**
 * Place archetypes in one performance through the public chain and report every way one is not where the scene put it.
 *
 * Each row's archetype becomes a prop (`HumanObject.prop`) on a line along `+X`, 3 m apart, turned by the row's heading and set on a support of the row's height (the floor's 0, or a table top); one average man stands a second 5 m behind the line. The performance must plan, and each prop must then rest where it was put:
 * 1. its frame at the film's end is its placement;
 * 2. its lowest collider point stands on its support, within a millimetre, so the archetype's origin is on its own underside;
 * 3. every affordance it declares is a named point of the prop, at the affordance's own place in the world.
 *
 * @param rows The archetypes, with the height each rests at and its heading.
 * @returns One line per finding, with the numbers; empty when every one is placed.
 */
export function archetypePlaced(
  rows: readonly archetypePlaced.IRow[],
): string[] {
  const findings: string[] = [];
  const props: IHumanProp[] = rows.map(
    (row: archetypePlaced.IRow, index: number): IHumanProp =>
      HumanObject.prop(row.name, row.archetype, {
        at: { x: 3 * index, y: row.on ?? 0, z: 0 },
        yaw: row.yaw ?? 0,
      }),
  );
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "placed",
      laws: [],
      props,
      performers: [
        {
          subject: "a",
          body: motionHumanBody("m-average"),
          at: { x: 0, y: 0, z: -5 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").stand({ seconds: 1 }).node,
    });
  } catch (error) {
    return [
      `the placing performance: ${error instanceof Error ? error.message : String(error)}`,
    ];
  }
  rows.forEach((row: archetypePlaced.IRow, index: number): void => {
    const placed: IHumanProp.IFrame = performance.prop(row.name, 1);
    const at: IAutoMovieVector3 = { x: 3 * index, y: row.on ?? 0, z: 0 };

    // 1. Where it was put.
    if (Vector3.length(Vector3.subtract(placed.position, at)) > 1e-9)
      findings.push(
        `${row.name}: rests at (${placed.position.x}, ${placed.position.y}, ${placed.position.z}), (${at.x}, ${at.y}, ${at.z}) expected`,
      );

    // 2. On its support: a turn about the vertical keeps every height.
    const low: number = placed.position.y + archetypeExtent(row.archetype, "y").low;
    if (Math.abs(low - at.y) > 1e-3)
      findings.push(
        `${row.name}: its lowest point is ${((low - at.y) * 1000).toFixed(1)} mm from its support, within 1 mm expected`,
      );

    // 3. Its contacts as the prop's named points, in the world.
    const prop: IHumanProp = props[index]!;
    for (const affordance of row.archetype.affordances) {
      const point:
        | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
        | undefined = prop.points[affordance.id];
      if (point === undefined) {
        findings.push(`${row.name}: declares ${affordance.id} but the prop names no such point`);
        continue;
      }
      const world: IAutoMovieVector3 = Vector3.add(
        placed.position,
        Quaternion.rotateVector(placed.rotation, point.point),
      );
      const expected: IAutoMovieVector3 = Vector3.add(
        at,
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, row.yaw ?? 0),
          affordance.frame.translation,
        ),
      );
      if (Vector3.length(Vector3.subtract(world, expected)) > 1e-9)
        findings.push(
          `${row.name}/${affordance.id}: stands ${Vector3.length(Vector3.subtract(world, expected))} m from its place`,
        );
    }
  });
  return findings;
}

/** Companion type of {@link archetypePlaced}. */
export namespace archetypePlaced {
  /** One archetype to place. */
  export interface IRow {
    /** The prop's subject id, `<producer>-<kind>`. */
    name: string;

    /** The archetype. */
    archetype: Archetype;

    /** The height of what it rests on, metres: a table top for a thing set down on one; the floor's 0 when absent. */
    on?: number;

    /** Its heading about `+Y`, degrees; 0 when absent. */
    yaw?: number;
  }
}
