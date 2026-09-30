import { Vector3 } from "@automovie/engine";
import { selectHumanFaceHairStations } from "@automovie/human/face/anatomy/hair/selectHumanFaceHairStations";
import { TestValidator } from "@nestia/e2e";

/**
 * A hair ribbon keeps the stations that carry its bends and only those.
 * Scenarios:
 * 1. Fewer than three stations are all kept.
 * 2. A straight run keeps its two ends whatever lies between.
 * 3. A deviation above the tolerance keeps the deepest station, below it drops
 *    it, and a station past the segment's end is measured to that end, not to
 *    the segment's infinite line.
 * 4. A zero tolerance still drops exactly collinear stations and keeps any
 *    other.
 * 5. A closed loop, whose ends coincide, keeps its farthest station.
 * 6. The tolerance is asked once per open segment with that segment's bounds.
 * 7. A zig-zag of a few hundred stations keeps every bend.
 */
export const test_subject_human_hair_station_selection = (): void => {
  const at = (x: number, y = 0) => Vector3.create(x, y, 0);
  const select = (
    points: ReturnType<typeof at>[],
    tolerance: (from: number, to: number) => number = () => 0.1,
  ): number[] => selectHumanFaceHairStations({ points, tolerance });

  TestValidator.equals("empty", select([]), []);
  TestValidator.equals("one", select([at(0)]), [0]);
  TestValidator.equals("two", select([at(0), at(1)]), [0, 1]);

  TestValidator.equals(
    "a straight run keeps its ends",
    select([at(0), at(1), at(2), at(3), at(4)]),
    [0, 4],
  );

  TestValidator.equals(
    "a bend above the tolerance is kept",
    select([at(0), at(1, 0.2), at(2)]),
    [0, 1, 2],
  );
  TestValidator.equals(
    "a bend below the tolerance is dropped",
    select([at(0), at(1, 0.05), at(2)]),
    [0, 2],
  );
  TestValidator.equals(
    "an overshoot beyond the segment is not forgiven by its line",
    select([at(0), at(3), at(1)], () => 0.5),
    [0, 1, 2],
  );

  TestValidator.equals(
    "a zero tolerance drops an exactly collinear station",
    select([at(0), at(1), at(2)], () => 0),
    [0, 2],
  );
  TestValidator.equals(
    "a zero tolerance keeps any other",
    select([at(0), at(1, 1e-9), at(2)], () => 0),
    [0, 1, 2],
  );

  TestValidator.equals(
    "a closed loop keeps its farthest station",
    select([at(0), at(1, 1), at(2, 0), at(1, -0.5), at(0)]),
    [0, 1, 2, 3, 4],
  );
  TestValidator.equals(
    "a loop with no extent drops its repeats",
    select([at(0), at(0), at(0)]),
    [0, 2],
  );

  const asked: [number, number][] = [];
  select([at(0), at(1, 1), at(2, 0), at(3, 1)], (from, to) => {
    asked.push([from, to]);
    return 0.1;
  });
  TestValidator.equals(
    "the tolerance is asked for each open segment",
    asked.sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    [
      [0, 3],
      [1, 3],
    ],
  );

  const long = Array.from({ length: 400 }, (_, index) =>
    at(index, index % 2 === 0 ? 0 : 1),
  );
  const kept = select(long, () => 0.1);
  TestValidator.predicate(
    "a long zig-zag keeps every station and its ends",
    kept.length === long.length &&
      kept[0] === 0 &&
      kept[kept.length - 1] === long.length - 1,
  );
};
