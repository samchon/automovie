import type { AutoMovieArchetypeCourse } from "../core";
import type { AutoMovieArchetypeEquineTeamPlan } from "./AutoMovieArchetypeEquineTeamPlan";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * One team horse's own course: the team's path offset to its place in the
 * hitch, travelled so that it keeps that place.
 *
 * A horse `lateral` metres left of the pole's line travels the parallel path:
 * the same straights, and each turn about the same centre at radius `R -
 * lateral` for a left turn and `R + lateral` for a right one, so the outside
 * horse travels farther in proportion to its radius. To keep abreast it runs
 * each turn at the team's speed times its radius over the pole's. A horse
 * `ahead` metres along the path starts that far ahead and ends that far beyond,
 * its first and last straights shortened and lengthened by it. Each change of
 * speed is taken at the authored `rate` in a short piece split from the start
 * of the leg it enters, exactly as long as that change needs (`|u^2 - u0^2| /
 * (2 rate)`), since a course takes a leg's speed change at the leg's start when
 * speeding up and at its end when slowing (`AutoMovieArchetypeCourse`); the
 * horse therefore lags or leads its exact place by `(u - u0)^2 / (2 rate)`
 * metres once the change is done, about a millimetre for the speed ratios of a
 * team's turns. With `stop` the last straight brakes to rest at the same rate.
 *
 * @param team The team's course.
 * @param place The horse's place.
 * @returns The horse's course.
 * @throws {RangeError} When a speed change does not fit inside the leg it
 *   enters.
 */
export function EquineTeamCourse(
  team: AutoMovieArchetypeEquineTeamPlan.IParams,
  place: AutoMovieArchetypeEquineTeamPlan.IPlace,
): rideQuadruped.ICourse {
  const heading: number = (team.start.heading * Math.PI) / 180;
  const legs: rideQuadruped.ILeg[] = [];
  const speeds: number[] = [];
  let previous: number = team.cruise;
  team.legs.forEach((leg: AutoMovieArchetypeCourse.Leg, k: number): void => {
    const scaled: rideQuadruped.ILeg =
      leg.kind === "turn"
        ? { ...leg, radius: leg.radius - place.lateral * Math.sign(leg.angle) }
        : {
            ...leg,
            length:
              leg.length -
              (k === 0 ? place.ahead : 0) +
              (k === team.legs.length - 1 ? place.ahead : 0),
          };
    const speed: number =
      leg.kind === "turn" && scaled.kind === "turn"
        ? (team.cruise * scaled.radius) / leg.radius
        : team.cruise;
    if (speed !== previous) {
      const piece: number =
        Math.abs(speed * speed - previous * previous) / (2 * team.rate);
      const span: number =
        scaled.kind === "turn"
          ? (Math.abs(scaled.angle) * Math.PI * scaled.radius) / 180
          : scaled.length;
      if (!(piece < span))
        throw new RangeError(
          `A team horse's change to ${speed} m/s needs ${piece} m, more than its ${span} m leg`,
        );
      if (scaled.kind === "turn") {
        const angle: number =
          (Math.sign(scaled.angle) * ((piece / scaled.radius) * 180)) / Math.PI;
        legs.push(
          { ...scaled, angle },
          { ...scaled, angle: scaled.angle - angle },
        );
      } else
        legs.push(
          { ...scaled, length: piece },
          { ...scaled, length: scaled.length - piece },
        );
      speeds.push(speed, speed);
    } else {
      legs.push(scaled);
      speeds.push(speed);
    }
    previous = speed;
  });
  if (team.stop) speeds[speeds.length - 1] = 0;
  return {
    start: {
      x:
        team.start.x +
        Math.sin(heading) * place.ahead +
        Math.cos(heading) * place.lateral,
      z:
        team.start.z +
        Math.cos(heading) * place.ahead -
        Math.sin(heading) * place.lateral,
      heading: team.start.heading,
    },
    legs,
    cruise: Math.max(...speeds, team.cruise),
    acceleration: team.rate,
    deceleration: team.rate,
    startSpeed: team.cruise,
    speeds,
  };
}
