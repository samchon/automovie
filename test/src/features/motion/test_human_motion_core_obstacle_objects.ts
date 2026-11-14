import { createDoor, createTable } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObstacle } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A placed object is an obstacle of its own colliders and openings
 * (`HumanObstacle.object`): a door stands in a path's way but for its clear
 * opening, and a table, which has none, stands in it whole.
 *
 * The scene: a hinged lever door at the middle of its bands, its threshold's
 * middle 2 m ahead and facing the way, and a dining table at the middle of
 * its bands, its middle 2 m ahead and turned a quarter turn. A body 0.45 m
 * broad and 1.75 m tall walks straight stretches along the way from the
 * origin's line, 4 m long.
 *
 * Scenarios, the door:
 * 1. The obstacle has the door's one opening, its `aperture` affordance with
 *    that affordance's width and height, and its solid runs from the floor
 *    to the top of the frame's head.
 * 2. A stretch through the opening's middle is free.
 * 3. A stretch 0.1 m inside the opening's edge is blocked as too narrow: the
 *    opening leaves 0.2 m about it and the body needs 0.45 m.
 * 4. A body 0.1 m taller than the opening, through its middle, is blocked
 *    for headroom, with the opening's height against its own.
 * 5. A stretch through the middle of a jamb is blocked as a solid, where it
 *    meets the door before the door's own plane.
 *
 * Scenarios, the table:
 * 6. The obstacle has no opening, and its solid runs from the floor to the
 *    table's height over the top's rectangle turned a quarter turn: its
 *    footprint spans the top's depth across the way and its length along
 *    it, since the legs stand inside the top.
 * 7. A stretch through its middle is blocked as a solid where it meets the
 *    top's near edge, half the table's length before its middle.
 * 8. A stretch 0.3 m beside it is free.
 * 9. A model with no colliders is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes through the public builder and asks the public query about stretches across them; a door that blocks its own opening or lets a path through its jamb, a narrow or low opening accepted, a table with a gap, a footprint that is not its top's, or an object without colliders accepted fails.
 * @evidence contracts/development/testing.md#independent-expectations Every expected measure is read off the archetype's own record, not its colliders: the opening from its affordance, the door's top and jamb from its parts, the table's from its drawn dimensions, and the room about a crossing is the opening's width less twice the offset.
 * @evidence contracts/development/testing.md#distinguishing-cases An object with an opening and one without, a free crossing, a narrow one, a low one, a solid crossing beside an opening, a turned placement, a stretch beside an object and a refusal.
 * @evidence contracts/development/testing.md#execution-ownership Plain geometry on two archetypes; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene with its measures and the 9 scenarios with their numbers.
 */
export function test_human_motion_core_obstacle_objects(): void {
  const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const body: HumanObstacle.INeed = { breadth: 0.45, height: 1.75 };
  const read = (
    scene: HumanObstacle.IObstacle,
    x: number,
    need: HumanObstacle.INeed = body,
  ): unknown => {
    const block: HumanObstacle.IBlock | null = HumanObstacle.blocking(
      [scene],
      at(x, 0),
      at(x, 4),
      need,
    );
    return block === null
      ? "free"
      : [
          block.subject,
          block.cause,
          block.aperture ?? "",
          block.short === undefined
            ? ""
            : `${block.short.has.toFixed(3)} of ${block.short.needs.toFixed(3)}`,
        ];
  };
  const round = (value: number): number => Number(value.toFixed(6)) + 0;

  // The door, read off its own record.
  const door: ReturnType<typeof createDoor> = createDoor({ kind: "hinged" });
  const part = (id: string): IAutoMovieModelPart =>
    door.parts.find((p: IAutoMovieModelPart): boolean => p.id === id)!;
  const head: IAutoMovieModelPart = part("head");
  const headTop: number =
    head.transform!.translation.y +
    (head.geometry.type === "primitive" && head.geometry.shape.type === "box"
      ? head.geometry.shape.height / 2
      : NaN);
  const opening: IAutoMovieAffordance = door.affordance("aperture");
  const clear: number = opening.width!;
  const middle: number = opening.frame.translation.x;
  const doorway: HumanObstacle.IObstacle = HumanObstacle.object("door", door, {
    at: at(0, 2),
    yaw: 0,
  });

  // 1. Its opening and its heights.
  TestValidator.equals(
    "a door is an obstacle with its own opening",
    [
      (doorway.apertures ?? []).map((a: HumanObstacle.IAperture): unknown[] => [
        a.id,
        round(a.width),
        round(a.height),
      ]),
      round(doorway.bottom),
      round(doorway.top),
    ],
    [[["aperture", round(clear), round(opening.height!)]], 0, round(headTop)],
  );
  // 2 to 4. Through the opening.
  TestValidator.equals(
    "a door lets a body through its opening as the opening allows",
    [
      read(doorway, middle),
      read(doorway, middle + clear / 2 - 0.1),
      read(doorway, middle, { breadth: 0.45, height: opening.height! + 0.1 }),
    ],
    [
      "free",
      ["door", "narrow", "aperture", "0.200 of 0.450"],
      [
        "door",
        "headroom",
        "aperture",
        `${opening.height!.toFixed(3)} of ${(opening.height! + 0.1).toFixed(3)}`,
      ],
    ],
  );
  // 5. Through a jamb.
  const jamb: number = part("jamb-left").transform!.translation.x;
  const struck: HumanObstacle.IBlock | null = HumanObstacle.blocking(
    [doorway],
    at(jamb, 0),
    at(jamb, 4),
    body,
  );
  TestValidator.equals(
    "a door's jamb is a solid before the door's plane",
    struck === null
      ? "free"
      : [struck.cause, round(struck.at.x), struck.distance < 2],
    ["solid", round(jamb), true],
  );

  // The table, turned a quarter turn.
  const table: ReturnType<typeof createTable> = createTable({ kind: "dining" });
  const height: number = table.dimensions.height!;
  const length: number = table.dimensions.length!;
  const depth: number = table.dimensions.depth!;
  const desk: HumanObstacle.IObstacle = HumanObstacle.object("table", table, {
    at: at(0, 2),
    yaw: 90,
  });
  const xs: number[] = desk.footprint.map(
    (p: IAutoMovieVector3): number => p.x,
  );
  const zs: number[] = desk.footprint.map(
    (p: IAutoMovieVector3): number => p.z,
  );

  // 6. Its solid.
  TestValidator.equals(
    "a table is an obstacle of its top's rectangle, turned with it",
    [
      desk.apertures ?? [],
      round(desk.bottom),
      round(desk.top),
      round(Math.min(...xs)),
      round(Math.max(...xs)),
      round(Math.min(...zs)),
      round(Math.max(...zs)),
    ],
    [
      [],
      0,
      round(height),
      round(-depth / 2),
      round(depth / 2),
      round(2 - length / 2),
      round(2 + length / 2),
    ],
  );
  // 7, 8. Across it and beside it.
  const across: HumanObstacle.IBlock | null = HumanObstacle.blocking(
    [desk],
    at(0, 0),
    at(0, 4),
    body,
  );
  TestValidator.equals(
    "a table blocks a path across it at its near edge and not one beside it",
    [
      across === null ? "free" : [across.cause, round(across.distance)],
      read(desk, depth / 2 + 0.3),
    ],
    [["solid", round(2 - length / 2)], "free"],
  );

  // 9. Nothing to stand in the way.
  let refused: string = "";
  try {
    HumanObstacle.object(
      "ghost",
      { affordances: [] },
      { at: at(0, 2), yaw: 0 },
    );
  } catch (error) {
    refused = (error as Error).message;
  }
  TestValidator.equals(
    "an object without colliders is refused",
    refused.includes("ghost") && refused.includes("no colliders"),
    true,
  );
}
