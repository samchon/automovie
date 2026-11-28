import { AutoMovieRenderInspectionMarks } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `expandInspectionSweep` lists the units a sweep pattern names and
 * the objects near each.
 *
 * Scenarios:
 *
 * 1. Under margin 1, the unit `a` has the neighbour `b`, 0.5 m away, and not `c`,
 *    9 m away; under margin 0.2 it has none.
 * 2. A matched object whose parent also matches is part of the parent's unit.
 * 3. A pattern that matches nothing and a negative margin are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names margin-sensitive neighbors, nearest matched ancestry and refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the sweep owner using a typed list of paths and native bounds. Reads selected units and their neighbors at two margins and tests invalid requests.
 * @evidence contracts/development/testing.md#independent-expectations The nearest box is separated by 0.5 m, so a 1 m margin admits it and 0.2 m does not. The third box is 9 m away. A matched descendant belongs to its matched parent's unit. An empty match and negative margin refuse.
 */
export function test_render_scene_expand_inspection_sweep(): void {
  const box = (path: string, from: number, to: number) => ({
    path,
    min: { x: from, y: 0, z: 0 },
    max: { x: to, y: 1, z: 1 },
  });
  const objects = [box("a", 0, 1), box("b", 1.5, 2.5), box("c", 10, 11)];
  TestValidator.equals(
    "margin 1",
    AutoMovieRenderInspectionMarks.expandSweep({ objects, pattern: "a", margin: 1 }),
    [{ unit: "a", alone: ["a"], neighbours: ["b"] }],
  );
  TestValidator.equals(
    "margin 0.2",
    AutoMovieRenderInspectionMarks.expandSweep({ objects, pattern: "a", margin: 0.2 }),
    [{ unit: "a", alone: ["a"], neighbours: [] }],
  );
  TestValidator.equals(
    "parent unit",
    AutoMovieRenderInspectionMarks.expandSweep({
      objects: [box("a", 0, 1), box("a/arm", 0, 0.5), box("b", 1.5, 2.5)],
      pattern: "a",
      margin: 1,
    }),
    [{ unit: "a", alone: ["a"], neighbours: ["b"] }],
  );
  TestValidator.error("no match", (): void => {
    AutoMovieRenderInspectionMarks.expandSweep({ objects, pattern: "zzz", margin: 1 });
  });
  TestValidator.error("negative margin", (): void => {
    AutoMovieRenderInspectionMarks.expandSweep({ objects, pattern: "a", margin: -1 });
  });
}