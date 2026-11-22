import { positiveModulo } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../core";
import { createBoat, createCart, rowBoat } from "../vehicles";
import { createCannon } from "../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Actual rowing, seeded-sea and two-body towing consumers for visual inspection.
 * The straight tandem limbers are an authored kinematic demonstration, not a
 * historical train or ground-contact simulation; actual axle support lets its
 * rigid body pitch to the unchanged hook heights. The straight path makes both
 * actual wheel travel distances equal. The leader's wheels do not carry its
 * pintle, so towing reads its unchanged rest model along the actual course;
 * each displayed leader receives its wheel pose only at the requested second.
 *
 * @returns Named calm/sea rides and three supported towing branches: tandem limbers, a reverse field gun and a four-wheel wagon with its actual drawbar hinge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names rowing/oar cycles, seeded sea motion, public towing, authored course values and the unchanged model/ground-contact limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Public rowBoat owns strokes and sea response; AutoMovieArchetypeRide.towed owns coupling and trailing heading. The leader's fixed pintle is independent of wheel articulation, so its actual unposed public along ride supplies towing while display members apply the identical wheel pose. Actual circumference, signed course distance and positiveModulo retain equivalent degrees in [0,360), including reverse rotation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the public boat/limbers and their rides, then add actual field-gun and wagon followers using that same leader and return spatially coherent subjects without changing catalog or renderer code.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No performer, Motion/Human import, invented hitch, geometry override, capture-only wave law or approximate towing algorithm replaces the public consumers.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each 12-second follower takes 720 default RK4 steps, or 2,881 rate evaluations with three hitch reads each plus one initial leader read. Sharing an unposed leader removes all 25,932 unnecessary leader articulations from preparation of the three followers per catalog. Each displayed member applies its leader wheel pose once, then assembles actual parts in linear model-size work; public towing still owns its prepared trajectories.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Calm/sea rides share the same boat/course, and every towing sample reuses its prepared rides and source geometry. All leader, limber, reverse-gun and wagon wheel branches reuse the engine's positiveModulo owner for the same cyclic angle representation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned subjects retain five source models and their prepared rides for the catalog lifetime; samples are not cached and no process or external handle is acquired.
 */
export function archetypeCaptureSupportProps(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const boat: ReturnType<typeof createBoat> = createBoat(
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
    sea: { height: 0.4, heading: 35, seed: "canonical-rowing-sea" },
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

/** Public wheel articulations use actual circumference and equivalent [0,360) degrees, preserving signed rolling without changing geometry. */
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

/** The source field gun travels trail first, on its real axle and unchanged limber socket. */
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

/** The actual four-wheel wagon steers and pitches only its declared drawbar while both axles stay supported. */
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
