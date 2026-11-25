import {
  AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  createCart,
  createHorseCart,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieArchetypeRide.towed` keeps a towed archetype's coupling on its
 * leader's hitch while the leader drives its own course.
 *
 * Scenarios, with a one-box leader whose hitch is 1 m up and 1 m back, driving
 * an 18 m straight at 1.5 m/s, towing a horse cart supported by
 * `createCart.towing`:
 *
 * 1. At 0, 1 and 4 s the cart's coupling lies on the leader's hitch within 1e-6 m.
 */
export function test_unit_archetypes_core_archetype_ride_towed(): void {
  const course: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 1.6, z: -2, heading: 35 },
    legs: [{ kind: "straight", length: 18 }],
    cruise: 1.5,
    acceleration: 0.5,
    deceleration: 0.5,
  };
  const leader: AutoMovieArchetypeRide.IRide<"hitch", never> =
    AutoMovieArchetypeRide.along(
      new AutoMovieArchetypeBuilder<"hitch", never>({
        material: "wood",
        name: "tow-leader",
        draw: new AutoMovieArchetypeDrawSession<never>(
          "tow-leader",
          {},
          undefined,
        ),
      })
        .box("base", Vector3.create(1, 1, 1), Vector3.create(0, 0.5, 0))
        .affordance({
          id: "hitch",
          kind: "hook",
          frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, 1, -1)),
          extent: null,
        })
        .build(50),
      course,
    );
  const cart: ReturnType<typeof createHorseCart> = createHorseCart(
    { id: "carrier" },
    1038,
  );
  const ride: ReturnType<typeof AutoMovieArchetypeRide.towed> =
    AutoMovieArchetypeRide.towed(leader, "hitch", cart, "coupling", {
      support: createCart.towing(cart),
    });
  TestValidator.predicate(
    "the coupling stays on the hitch",
    [0, 1, 4].every((seconds: number): boolean => {
      const hitch: IAutoMovieVector3 = leader.frame(
        "hitch",
        seconds,
      ).translation;
      const coupling: IAutoMovieVector3 = ride.frame(
        "coupling",
        seconds,
      ).translation;
      return Vector3.length(Vector3.subtract(coupling, hitch)) <= 1e-6;
    }),
  );
}
