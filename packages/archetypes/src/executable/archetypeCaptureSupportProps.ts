import { positiveModulo } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeBoat, createCart, rowBoat } from "../vehicles";
import { createCannon } from "../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Rowing, seeded-sea and two-body towing consumers for visual inspection. The
 * straight tandem limbers are an authored kinematic demonstration, not a
 * historical train or ground-contact simulation; axle support lets its rigid
 * body pitch to the unchanged hook heights. The straight path makes both wheel
 * travel distances equal. The leader's wheels do not carry its pintle, so
 * towing reads its unchanged rest model along the course; each displayed leader
 * receives its wheel pose only at the requested second.
 *
 * @returns Named calm/sea rides and three supported towing branches: tandem
 *   limbers, a reverse field gun and a four-wheel wagon with its drawbar
 *   hinge.
 */
export function archetypeCaptureSupportProps(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const boat: ReturnType<typeof AutoMovieArchetypeBoat.create> = AutoMovieArchetypeBoat.create(
    { kind: "rowboat" },
    17,
  );
  const waterCourse: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 12 }],
    cruise: 1.5,
    startSpeed: 1.5,
    endSpeed: 1.5,
  };
  const calm: ReturnType<typeof rowBoat> = rowBoat(boat, waterCourse);
  const sea: ReturnType<typeof rowBoat> = rowBoat(boat, waterCourse, {
    sea: { height: 0.4, heading: 35, seed: 1050 },
  });
  const leading: ReturnType<typeof createCart> = createCart({
    kind: "limber",
    id: "leading-limber",
  });
  const trailing: ReturnType<typeof createCart> = createCart({
    kind: "limber",
    id: "trailing-limber",
  });
  const road: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 12 }],
    cruise: 1,
    startSpeed: 1,
    endSpeed: 1,
  };
  const leader: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.along(leading, road);
  const trailer: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", trailing, "coupling", {
    support: createCart.towing(trailing),
    pose: (
      state: AutoMovieArchetypeCourse.IState,
    ): ReturnType<typeof createCart> => rolling(trailing, state.progress),
  });
  return {
    "rowboat-underway-calm": archetypeCaptureSubject.moving(
      "rowboat",
      calm,
      boat,
    ),
    "towing-limbered-gun": limberedGun(leader),
    "towing-limbered-wagon": limberedWagon(leader),
    "rowboat-underway-sea": archetypeCaptureSubject.moving(
      "rowboat",
      sea,
      boat,
    ),
    "towing-limbers": {
      duration: leader.duration,
      instants: leader.instants,
      members: [
        {
          name: "coupled-limbers",
          at: (seconds: number): { archetype: AutoMovieArchetype } => {
            const front: AutoMovieArchetypeRide.ISample<
              createCart.Affordance,
              createCart.Dimension
            > = leader.at(seconds);
            const rear: AutoMovieArchetypeRide.ISample<
              createCart.Affordance,
              createCart.Dimension
            > = trailer.at(seconds);
            return {
              archetype: AutoMovieArchetypeAssembly.of(
                "capture-towing-limbers",
                "Authored tandem limber tow",
                {
                  leader: {
                    archetype: rolling(front.archetype, front.course.progress),
                    placement: front.placement,
                  },
                  trailer: {
                    archetype: rear.archetype,
                    placement: rear.placement,
                  },
                },
              ),
            };
          },
        },
      ],
    },
  };
}

/**
 * Public wheel articulations use circumference and equivalent [0,360) degrees,
 * preserving signed rolling without changing geometry.
 */
function rolling(
  cart: ReturnType<typeof createCart>,
  distance: number,
): ReturnType<typeof createCart> {
  const angle: number = positiveModulo(
    (360 * distance) / (Math.PI * cart.dimensions.wheelDiameter!),
    360,
  );
  return cart.articulate({ leftSpin: angle, rightSpin: angle });
}

/**
 * The source field gun travels trail first, on its real axle and unchanged
 * limber socket.
 */
function limberedGun(
  leader: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  >,
): archetypeCaptureCatalog.ISubject {
  const gun: ReturnType<typeof createCannon> = createCannon({
    kind: "fieldGun",
  });
  const follower: AutoMovieArchetypeRide.IRide<
    createCannon.Affordance,
    createCannon.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", gun, "limber", {
    support: createCannon.towing(gun),
    pose: (
      state: AutoMovieArchetypeCourse.IState,
    ): ReturnType<typeof createCannon> => {
      const angle: number = positiveModulo(
        (-360 * state.progress) / (Math.PI * gun.dimensions.wheelDiameter!),
        360,
      );
      return gun.articulate({ leftSpin: angle, rightSpin: angle });
    },
  });
  return {
    duration: leader.duration,
    instants: leader.instants,
    members: [
      {
        name: "limber-and-field-gun",
        at: (seconds: number): { archetype: AutoMovieArchetype } => {
          const front: AutoMovieArchetypeRide.ISample<
            createCart.Affordance,
            createCart.Dimension
          > = leader.at(seconds);
          const rear: AutoMovieArchetypeRide.ISample<
            createCannon.Affordance,
            createCannon.Dimension
          > = follower.at(seconds);
          return {
            archetype: AutoMovieArchetypeAssembly.of(
              "capture-limbered-gun",
              "Actual field gun on its limber",
              {
                limber: {
                  archetype: rolling(front.archetype, front.course.progress),
                  placement: front.placement,
                },
                cannon: {
                  archetype: rear.archetype,
                  placement: rear.placement,
                },
              },
            ),
          };
        },
      },
    ],
  };
}

/**
 * The four-wheel wagon steers and pitches only its declared drawbar while both
 * axles stay supported.
 */
function limberedWagon(
  leader: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  >,
): archetypeCaptureCatalog.ISubject {
  const wagon: ReturnType<typeof createCart> = createCart({ kind: "wagon" });
  const follower: AutoMovieArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", wagon, "coupling", {
    support: createCart.towing(wagon),
    pose: (
      state: AutoMovieArchetypeCourse.IState,
    ): ReturnType<typeof createCart> => {
      const front: number = positiveModulo(
        (360 * state.progress) /
          (Math.PI * wagon.dimensions.frontWheelDiameter!),
        360,
      );
      const rear: number = positiveModulo(
        (360 * state.progress) / (Math.PI * wagon.dimensions.wheelDiameter!),
        360,
      );
      return wagon.articulate({
        frontLeftSpin: front,
        frontRightSpin: front,
        rearLeftSpin: rear,
        rearRightSpin: rear,
      });
    },
  });
  return {
    duration: leader.duration,
    instants: leader.instants,
    members: [
      {
        name: "limber-and-wagon",
        at: (seconds: number): { archetype: AutoMovieArchetype } => {
          const front: AutoMovieArchetypeRide.ISample<
            createCart.Affordance,
            createCart.Dimension
          > = leader.at(seconds);
          const rear: AutoMovieArchetypeRide.ISample<
            createCart.Affordance,
            createCart.Dimension
          > = follower.at(seconds);
          return {
            archetype: AutoMovieArchetypeAssembly.of(
              "capture-limbered-wagon",
              "Actual wagon drawbar on a limber",
              {
                limber: {
                  archetype: rolling(front.archetype, front.course.progress),
                  placement: front.placement,
                },
                wagon: { archetype: rear.archetype, placement: rear.placement },
              },
            ),
          };
        },
      },
    ],
  };
}
