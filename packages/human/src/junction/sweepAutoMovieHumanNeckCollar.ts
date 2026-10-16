import { IAutoMovieSweep, IAutoMovieSweepSection } from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";
import { planAutoMovieHumanNeckCut } from "./planAutoMovieHumanNeckCut";

/**
 * The shared neck cut and one parallel support form a straight collar.
 *
 * Both stations use the B-spline of the shared ring's raw controls and the
 * same rotation. Thus no distant head or base spline changes its axial tangent.
 * The two owners use equal support distances and opposite traversal. This is
 * a geometric continuation of one shared definition, not an anatomical offset.
 *
 * @param props Shared ring, cut plan and the part traversing its collar
 * @returns The support-to-cut sweep, model metres
 */
export function sweepAutoMovieHumanNeckCollar(props: {
  ring: IAutoMovieHumanRingShape;
  plan: ReturnType<typeof planAutoMovieHumanNeckCut>;
  side: "head" | "neck";
}): IAutoMovieSweep {
  const normal: IAutoMovieVector3 = props.ring.frame.normal;
  const reference: IAutoMovieVector3 = props.ring.frame.reference;
  const a: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    AutoMovieHumanVector.of(0, 0, 0),
    [reference, props.side === "head" ? -1 : 1],
  );
  const b: IAutoMovieVector3 = AutoMovieHumanVector.cross(normal, a);
  const origin: IAutoMovieVector3 = props.ring.frame.origin;
  const support: IAutoMovieVector3 = AutoMovieHumanVector.offset(origin,
    [normal, -props.plan.support]);
  const controls: IAutoMovieVector3[] = props.ring.positions;
  const section: IAutoMovieSweepSection = {
    type: "bspline",
    points: controls.map((point: IAutoMovieVector3): {x: number; y: number} => {
      const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(point, [origin, -1]);
      return {x: AutoMovieHumanVector.dot(d, a) / 1000,
        y: AutoMovieHumanVector.dot(d, b) / 1000};
    }),
  };
  const metres: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: point.x / 1000, y: point.y / 1000, z: point.z / 1000,
  });
  return {
    spine: {points: [support, origin].map(metres), normal: a},
    stations: [0, 1].map((at: number): IAutoMovieSweep.IStation => ({
      at, section, rotation: quaternionFromAutoMovieBasis(a, b, normal),
    })),
  };
}
