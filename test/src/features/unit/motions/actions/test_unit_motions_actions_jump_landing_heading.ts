import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanRefusal, jumpLandingHeading } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `jumpLandingHeading` turns a jump's two-foot landing by its twist's fraction:
 * whole twists land facing the flight's heading, a fractional twist lands
 * turned by that fraction of a turn on the level floor, a fractional somersault
 * cannot land upright, and a fractional twist onto a raised point or a prop has
 * no room for both turned footprints.
 *
 * Scenarios, the flight heading 37 degrees toward a floor point:
 *
 * 1. Two whole twists land at 37 degrees.
 * 2. 2¼ twists land at 37 + 90 = 127 degrees; one somersault with half a twist at
 *    37 + 180 = 217.
 * 3. Half a somersault is refused on `turns`.
 * 4. A ¼ twist onto a point 0.3 m up is refused on `to`, onto a named prop on
 *    `on`.
 */
export function test_unit_motions_actions_jump_landing_heading(): void {
  const floor: IAutoMovieVector3 = { x: 1, y: 0, z: 1 };
  TestValidator.equals(
    "whole and fractional twists",
    [
      jumpLandingHeading({ to: floor, rotation: { twist: 2 } }, 37),
      jumpLandingHeading({ to: floor, rotation: { twist: 2.25 } }, 37),
      jumpLandingHeading(
        { to: floor, rotation: { somersault: 1, twist: 0.5 } },
        37,
      ),
    ],
    [37, 127, 217],
  );
  const refused = (
    params: Parameters<typeof jumpLandingHeading>[0],
    axis: string,
  ): boolean => {
    try {
      jumpLandingHeading(params, 37);
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === axis;
    }
    return false;
  };
  TestValidator.predicate(
    "half a somersault",
    refused({ to: floor, rotation: { somersault: 0.5 } }, "turns"),
  );
  TestValidator.predicate(
    "no room for a turned landing",
    refused({ to: { ...floor, y: 0.3 }, rotation: { twist: 0.25 } }, "to") &&
      refused({ to: floor, on: "box", rotation: { twist: 0.25 } }, "on"),
  );
}
