import { AutoMovieEngineMath } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../../core";
import { AutoMovieArchetypeBoat, AutoMovieArchetypeCart } from "../../vehicles";
import { AutoMovieArchetypeCannon } from "../../weapons";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/*
 * Rowing, seeded-sea and two-body towing consumers for visual inspection. The
 * straight tandem limbers are an authored kinematic demonstration, not a
 * historical train or ground-contact simulation; axle support lets its rigid
 * body pitch to the unchanged hook heights. The straight path makes both wheel
 * travel distances equal. The leader's wheels do not carry its pintle, so
 * towing reads its unchanged rest model along the course; each displayed leader
 * receives its wheel pose only at the requested second.
 * Returns: Named calm/sea rides and three supported towing branches: tandem
 * limbers, a reverse field gun and a four-wheel wagon with its drawbar
 * hinge.
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
  const calm: ReturnType<typeof AutoMovieArchetypeBoat.row> = AutoMovieArchetypeBoat.row(boat, waterCourse);
  const sea: ReturnType<typeof AutoMovieArchetypeBoat.row> = AutoMovieArchetypeBoat.row(boat, waterCourse, {
    sea: { height: 0.4, heading: 35, seed: 1050 },
  });
  const leading: ReturnType<typeof AutoMovieArchetypeCart.create> = AutoMovieArchetypeCart.create({
    kind: "limber",
    id: "leading-limber",
  });
  const trailing: ReturnType<typeof AutoMovieArchetypeCart.create> = AutoMovieArchetypeCart.create({
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
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  > = AutoMovieArchetypeRide.along(leading, road);
  const trailer: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", trailing, "coupling", {
    support: AutoMovieArchetypeCart.towing(trailing),
    pose: (
      state: AutoMovieArchetypeCourse.IState,
    ): ReturnType<typeof AutoMovieArchetypeCart.create> => rolling(trailing, state.progress),
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
              AutoMovieArchetypeCart.Affordance,
              AutoMovieArchetypeCart.Dimension
            > = leader.at(seconds);
            const rear: AutoMovieArchetypeRide.ISample<
              AutoMovieArchetypeCart.Affordance,
              AutoMovieArchetypeCart.Dimension
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

/*
 * Public wheel articulations use circumference and equivalent [0,360) degrees,
 * preserving signed rolling without changing geometry.
 */
function rolling(
  cart: ReturnType<typeof AutoMovieArchetypeCart.create>,
  distance: number,
): ReturnType<typeof AutoMovieArchetypeCart.create> {
  const angle: number = AutoMovieEngineMath.positiveModulo(
    (360 * distance) / (Math.PI * cart.dimensions.wheelDiameter!),
    360,
  );
  return cart.articulate({ leftSpin: angle, rightSpin: angle });
}

/*
 * The source field gun travels trail first, on its real axle and unchanged
 * limber socket.
 */
function limberedGun(
  leader: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  >,
): archetypeCaptureCatalog.ISubject {
  const gun: ReturnType<typeof AutoMovieArchetypeCannon.create> = AutoMovieArchetypeCannon.create({
    kind: "fieldGun",
  });
  const follower: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", gun, "limber", {
    support: AutoMovieArchetypeCannon.towing(gun),
    pose: (
      state: AutoMovieArchetypeCourse.IState,
    ): ReturnType<typeof AutoMovieArchetypeCannon.create> => {
      const angle: number = AutoMovieEngineMath.positiveModulo(
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
            AutoMovieArchetypeCart.Affordance,
            AutoMovieArchetypeCart.Dimension
          > = leader.at(seconds);
          const rear: AutoMovieArchetypeRide.ISample<
            AutoMovieArchetypeCannon.Affordance,
            AutoMovieArchetypeCannon.Dimension
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

/*
 * The four-wheel wagon steers and pitches only its declared drawbar while both
 * axles stay supported.
 */
function limberedWagon(
  leader: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  >,
): archetypeCaptureCatalog.ISubject {
  const wagon: ReturnType<typeof AutoMovieArchetypeCart.create> = AutoMovieArchetypeCart.create({ kind: "wagon" });
  const follower: AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeCart.Affordance,
    AutoMovieArchetypeCart.Dimension
  > = AutoMovieArchetypeRide.towed(leader, "pintle", wagon, "coupling", {
    support: AutoMovieArchetypeCart.towing(wagon),
    pose: (
      state: AutoMovieArchetypeCourse.IState,
    ): ReturnType<typeof AutoMovieArchetypeCart.create> => {
      const front: number = AutoMovieEngineMath.positiveModulo(
        (360 * state.progress) /
          (Math.PI * wagon.dimensions.frontWheelDiameter!),
        360,
      );
      const rear: number = AutoMovieEngineMath.positiveModulo(
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
            AutoMovieArchetypeCart.Affordance,
            AutoMovieArchetypeCart.Dimension
          > = leader.at(seconds);
          const rear: AutoMovieArchetypeRide.ISample<
            AutoMovieArchetypeCart.Affordance,
            AutoMovieArchetypeCart.Dimension
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
