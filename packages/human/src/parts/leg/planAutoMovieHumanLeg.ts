import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanLimbPlan } from "../IAutoMovieHumanLimbPlan";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";
import { planAutoMovieHumanLegStations } from "./planAutoMovieHumanLegStations";
import { reliefAutoMovieHumanLeg } from "./reliefAutoMovieHumanLeg";
import { shapeAutoMovieHumanLegSection } from "./shapeAutoMovieHumanLegSection";

/**
 * Rows of faces from each station to the next: two across the long gaps of the lower thigh and the calf's taper, one elsewhere, so rows lie about a span of the twelve around apart and gather at the knee. Grade: conventional.
 */
const ROWS: number[] = [1, 1, 2, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1];

/**
 * Lay one leg out for lofting, from mid thigh to the ankle.
 *
 * The stations are those of `planAutoMovieHumanLegStations`, each on the bone it crosses and the knee's on the bisector, so the spine bends through the knee with the bones. The rings and their collars take their ring's centre and reference, the collar carried along the ring's axis to its own level, so the loft continues each ring straight; every other station takes its block-out section from `shapeAutoMovieHumanLegSection` and its relief from `reliefAutoMovieHumanLeg`, and keeps its girth on the limit surface.
 *
 * @param props.measurements The person's measurements
 * @param props.skeleton The person's skeleton at rest
 * @param props.side Which leg
 * @returns The leg's loft plan, its `thigh` ring proximal and its `ankle` ring distal
 */
export function planAutoMovieHumanLeg(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): IAutoMovieHumanLimbPlan {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const {
    stations,
    thighRing,
    ankleRing,
  }: planAutoMovieHumanLegStations.IOutput =
    planAutoMovieHumanLegStations(props);
  const last: number = stations.length - 1;
  // a junction station on its ring's axis, at its own level
  const junction = (
    s: IAutoMovieHumanLegStation,
    ring: IAutoMovieHumanRingShape,
  ): Pick<IAutoMovieHumanLimbPlan.IStation, "centre" | "anterior"> => ({
    centre: V.offset(ring.frame.origin, [
      s.axis,
      V.dot(V.offset(s.origin, [ring.frame.origin, -1]), s.axis),
    ]),
    anterior: ring.frame.reference,
  });
  return {
    part: "leg",
    side: props.side,
    proximal: thighRing,
    distal: ankleRing,
    stations: stations.map(
      (s: IAutoMovieHumanLegStation, i: number): IAutoMovieHumanLimbPlan.IStation => {
        const common = {
          name: s.name,
          axis: s.axis,
          columns: s.count,
          rows: ROWS[i]!,
        };
        if (i <= 1)
          return { ...common, ...junction(s, thighRing), section: null, girth: null };
        if (i >= last - 1)
          return { ...common, ...junction(s, ankleRing), section: null, girth: null };
        return {
          ...common,
          centre: s.origin,
          anterior: s.anterior,
          section: shapeAutoMovieHumanLegSection(s, props.side),
          girth: s.girth,
        };
      },
    ),
    relief: reliefAutoMovieHumanLeg({
      stations,
      leanIndex:
        props.measurements.identity.composition.appendicularLeanMassIndex,
      fat: props.measurements.identity.composition.subcutaneousFat,
      side: props.side,
    }),
  };
}

