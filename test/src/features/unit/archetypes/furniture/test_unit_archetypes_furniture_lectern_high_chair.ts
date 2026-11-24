import {
  AutoMovieArchetypeUnits,
  createHighChair,
  createLectern,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * A lectern is Safco's 8915 and a high chair IKEA's ANTILOP.
 *
 * Scenarios:
 * 1. The lectern's reading surface is 23 in wide and 15 3/4 in deep, its back edge 46 in up, sloping 15 degrees down toward `+Z`; its `front` lies on the surface's lower edge.
 * 2. The high chair is 56 x 59 cm on the floor and 90 cm high, its 25 x 22 cm seat 54 cm up, its `seat` on the seat's front edge.
 */
export function test_unit_archetypes_furniture_lectern_high_chair(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The lectern.
  const lectern: ReturnType<typeof createLectern> = createLectern({}, 3);
  const top: IAutoMovieAffordance = lectern.affordance("top");
  near("the surface's width", top.width!, 23 * AutoMovieArchetypeUnits.INCH);
  near("the surface's depth", top.depth!, 15.75 * AutoMovieArchetypeUnits.INCH);
  const normal: ReturnType<typeof Vector3.create> = Quaternion.rotateVector(
    top.frame.rotation,
    Vector3.create(0, 1, 0),
  );
  near(
    "the surface's slope",
    Math.atan2(normal.z, normal.y) / AutoMovieArchetypeUnits.DEGREE,
    15,
  );
  near(
    "the surface's back edge",
    archetypeExtent(lectern, "y").high,
    46 * AutoMovieArchetypeUnits.INCH,
  );
  near(
    "the front edge's height",
    lectern.affordance("front").frame.translation.y,
    (46 - 15.75 * Math.sin(15 * AutoMovieArchetypeUnits.DEGREE)) *
      AutoMovieArchetypeUnits.INCH,
  );

  // 2. The high chair.
  const chair: ReturnType<typeof createHighChair> = createHighChair({}, 3);
  near("the chair's width", archetypeExtent(chair, "x").size, 0.56);
  near("the chair's depth", archetypeExtent(chair, "z").size, 0.59);
  near("the chair's height", archetypeExtent(chair, "y").high, 0.9);
  const seat: IAutoMovieAffordance = chair.affordance("seat");
  near("the seat's height", seat.frame.translation.y, 0.54);
  near("the seat's width", seat.width!, 0.25);
  near("the seat's front edge", seat.frame.translation.z, 0.11);
  TestValidator.equals(
    "a lectern and a high chair stand at their makers' sizes",
    findings,
    [],
  );
}
