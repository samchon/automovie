import { TestValidator } from "@nestia/e2e";

import { manorSpatialState } from "../../../../experimental/medieval-baron-manor/src/manorSpatialState";
import { nclose, throwsError, vclose } from "../internal/predicates";

const room = (id: string, left: number, right: number) => ({
  id,
  level: 0,
  polygon: [
    [left, -1],
    [right, -1],
    [right, 1],
    [left, 1],
  ],
});

const derive = (rooms: ReturnType<typeof room>[]) =>
  manorSpatialState(
    {
      entries: [],
      rooms,
      boundaries: [
        {
          id: "partition",
          a: [0, -1],
          b: [0, 1],
          level: 0,
          exterior: false,
          openings: [{ id: "connecting-door", at: 1, w: 0.8, h: 2 }],
        },
      ],
    },
    { prototypes: [], sets: [], singletons: [] },
    new Map(),
  ).environment;

/**
 * A direct-source door connects both measured rooms or refuses their absence.
 * No serialized artifact or generated-project layout participates.
 *
 * Scenarios:
 * 1. A partition between two rectangles retains both endpoints and passage size.
 * 2. Each missing side, both missing sides, and a self-connection are refused.
 */
export const test_manor_door_connections = (): void => {
  const west = room("west-room", -2, -0.1);
  const east = room("east-room", 0.1, 2);
  const passage = derive([west, east]).connectors.find(
    (connector) => connector.id === "connecting-door/passage",
  );
  TestValidator.predicate(
    "the connecting door has a passage",
    passage !== undefined,
  );
  if (passage === undefined) throw new Error("Missing connecting passage");
  TestValidator.equals("from room", passage.from, "east-room");
  TestValidator.equals("to room", passage.to, "west-room");
  TestValidator.equals("bidirectional", passage.bidirectional, true);
  TestValidator.equals("boundary owner", passage.elements, ["partition"]);
  TestValidator.predicate(
    "declared width",
    passage.width !== undefined && nclose(passage.width, 0.8),
  );
  TestValidator.predicate(
    "declared height",
    passage.clearHeight !== undefined && nclose(passage.clearHeight, 2),
  );
  TestValidator.equals("two threshold endpoints", passage.route.length, 2);
  TestValidator.predicate(
    "front threshold",
    vclose(passage.route[0], { x: 0.5, y: 0.45, z: 0 }),
  );
  TestValidator.predicate(
    "back threshold",
    vclose(passage.route[1], { x: -0.5, y: 0.45, z: 0 }),
  );
  for (const [label, rooms, message] of [
    [
      "missing from",
      [west],
      "Unresolved manor door connection: connecting-door on partition (from=missing, to=west-room)",
    ],
    [
      "missing to",
      [east],
      "Unresolved manor door connection: connecting-door on partition (from=east-room, to=missing)",
    ],
    [
      "both missing",
      [],
      "Unresolved manor door connection: connecting-door on partition (from=missing, to=missing)",
    ],
    [
      "same room",
      [room("shared-room", -2, 2)],
      "Self-connected manor door: connecting-door on partition (room=shared-room)",
    ],
  ] satisfies [string, ReturnType<typeof room>[], string][])
    TestValidator.predicate(
      label,
      throwsError(() => derive(rooms), message),
    );
};
