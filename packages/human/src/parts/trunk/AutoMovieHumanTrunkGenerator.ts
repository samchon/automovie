import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanPartGenerator } from "../IAutoMovieHumanPartGenerator";

/**
 * Trunk placeholder: a tube of twenty spans from the crotch to the shoulders, split at the crotch into two thigh stubs, with a stub out of each side to mid upper arm and a band over the shoulders to the neck base.
 *
 * Rows are ellipses at the crotch, hip joints, waist, chest and shoulders, sized by the measured buttock, waist and chest circumferences and the hip and biacromial breadths, with a conventional depth-to-breadth ratio of 0.7. At the crotch one vertex joins the anterior and posterior midline vertices, so each thigh opens from eleven torso vertices and that one; each side's arm stub opens from a two-by-two block of faces left out at the shoulder joint's height. The shoulder band joins the top row to the neck base ring as a six-by-four quad grid with its middle four-by-two block open. The chart runs `u` from 0 in the legs' region up to 1 at the neck and `v` counterclockwise about the vertical from the anterior midline; each stub maps into its opening's region, shrunk toward the opening's centre. The real trunk generator replaces this one.
 *
 * Rings, in order: `neckBase`, `upperArm` left, `upperArm` right, `thigh` left, `thigh` right.
 *
 * @author Samchon
 */
export class AutoMovieHumanTrunkGenerator implements IAutoMovieHumanPartGenerator<"trunk"> {
  public readonly part = "trunk" as const;

  public generate(
    props: IAutoMovieHumanPartGenerator.IProps<"trunk">,
  ): IAutoMovieHumanCage {
    const body = props.measurements.identity.body;
    const landmarks: IAutoMovieHumanLandmarks = props.skeleton.landmarks;
    const joint = (bone: string): IAutoMovieVector3 =>
      props.skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
      )!.position;
    const builder: AutoMovieHumanCageBuilder = new AutoMovieHumanCageBuilder(
      "trunk",
      null,
    );
    const N: number = 20;
    const directions: IAutoMovieVector3[] = AutoMovieHumanCageBuilder.turn(
      AutoMovieHumanVector.of(0, 1, 0),
      AutoMovieHumanVector.of(0, 0, 1),
      N,
    );
    const crest: number = landmarks.left.iliocristale.position.y;
    const notch: number = landmarks.suprasternale.position.y;
    const armY: number = joint("leftUpperArm").y;
    const armR: number =
      (0.9 * body.leftArm.upperArmCircumference) / (2 * Math.PI);
    const shoulder: number = body.biacromialBreadth / 2;
    const rowsSpec: Array<[number, number, number]> = [
      [
        landmarks.ischialSeat.position.y,
        0.9 * (body.hipBreadth / 2),
        0.7 * (body.hipBreadth / 2),
      ],
      [
        joint("leftUpperLeg").y,
        body.hipBreadth / 2,
        depth(body.buttockCircumference, body.hipBreadth / 2),
      ],
      [
        crest + 0.3 * (notch - crest),
        breadth(body.waistCircumference),
        0.7 * breadth(body.waistCircumference),
      ],
      [
        notch - 0.35 * (notch - crest),
        breadth(body.chestCircumference),
        0.7 * breadth(body.chestCircumference),
      ],
      [armY - armR, shoulder, 0.6 * breadth(body.chestCircumference)],
      [armY, shoulder, 0.6 * breadth(body.chestCircumference)],
      [armY + armR, 0.95 * shoulder, 0.55 * breadth(body.chestCircumference)],
    ];
    const U0: number = 0.3;
    const U1: number = 0.85;
    const rows: AutoMovieHumanCageBuilder.IStation[] = rowsSpec.map(
      (
        [y, b, a]: [number, number, number],
        i: number,
      ): AutoMovieHumanCageBuilder.IStation =>
        builder.station(
          AutoMovieHumanCageBuilder.around(
            AutoMovieHumanVector.of(0, y, 0),
            directions,
            (k: number): number =>
              AutoMovieHumanCageBuilder.ellipse(a, b, (2 * Math.PI * k) / N),
          ),
          U0 + ((U1 - U0) * i) / (rowsSpec.length - 1),
        ),
    );
    const skip: Set<number> = new Set([4, 5, 14, 15]);
    for (let i: number = 1; i < rows.length; ++i)
      builder.bridge(rows[i - 1]!, rows[i]!, i >= 5 ? skip : new Set());

    // Shoulder band to the neck base.
    const neck: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "neckBase",
      side: null,
      part: "trunk",
    });
    const collar: AutoMovieHumanCageBuilder.IStation = builder.open(
      neck,
      (): number => (1.15 * body.neckCircumference) / (2 * Math.PI),
      1,
    );
    const grid: Map<string, [number, AutoMovieHumanCageBuilder.IChart]> =
      new Map();
    const top: AutoMovieHumanCageBuilder.IStation = rows[rows.length - 1]!;
    OUTER.forEach(([i, j]: [number, number], k: number): void => {
      grid.set(`${i},${j}`, [top.vertices[k]!, top.coordinates[k]!]);
    });
    INNER.forEach(([i, j]: [number, number], k: number): void => {
      grid.set(`${i},${j}`, [collar.vertices[k]!, collar.coordinates[k]!]);
    });
    for (let i: number = 0; i < 6; ++i)
      for (let j: number = 0; j < 4; ++j) {
        if (i >= 1 && i <= 4 && j >= 1 && j <= 2) continue;
        const corners: Array<[number, AutoMovieHumanCageBuilder.IChart]> = (
          [
            [i, j],
            [i, j + 1],
            [i + 1, j + 1],
            [i + 1, j],
          ] as const
        ).map(([a, b]: readonly [number, number]) => grid.get(`${a},${b}`)!);
        builder.face(
          corners.map(
            ([v]: [number, AutoMovieHumanCageBuilder.IChart]): number => v,
          ) as [number, number, number, number],
          corners.map(
            ([, c]: [number, AutoMovieHumanCageBuilder.IChart]) => c,
          ) as [
            AutoMovieHumanCageBuilder.IChart,
            AutoMovieHumanCageBuilder.IChart,
            AutoMovieHumanCageBuilder.IChart,
            AutoMovieHumanCageBuilder.IChart,
          ],
        );
      }

    // Arm stubs from the shoulder openings to mid upper arm.
    for (const [side, cells] of ARM_OPENINGS) {
      const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
        skeleton: props.skeleton,
        site: "upperArm",
        side,
        part: "trunk",
      });
      const opening: AutoMovieHumanCageBuilder.IStation = {
        vertices: cells.map(
          ([r, c]: [number, number]): number => rows[r]!.vertices[c]!,
        ),
        coordinates: cells.map(
          ([r, c]: [number, number]) => rows[r]!.coordinates[c]!,
        ),
      };
      const centre: AutoMovieHumanCageBuilder.IChart = {
        u: rows[5]!.coordinates[0]!.u,
        v: (side === "left" ? 5 : 15) / N,
      };
      const ring: AutoMovieHumanCageBuilder.IStation = builder.open(
        layout,
        (): number =>
          (side === "left" ? body.leftArm : body.rightArm)
            .upperArmCircumference /
          (2 * Math.PI),
        0,
      );
      ring.coordinates = shrink(opening.coordinates, centre, 0.4);
      const middle: AutoMovieHumanCageBuilder.IStation = builder.blend(
        opening,
        ring,
        0.5,
      );
      builder.bridge(opening, middle);
      builder.bridge(middle, ring);
    }

    // Crotch and thigh stubs.
    const P: AutoMovieHumanCageBuilder.IStation = rows[0]!;
    const crotchY: number = landmarks.ischialSeat.position.y;
    const crotch: number = builder.vertex(
      AutoMovieHumanVector.of(
        0,
        crotchY - 0.075 * (crotchY - joint("leftLowerLeg").y),
        0,
      ),
    );
    for (const [side, order] of LEG_LOOPS) {
      const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
        skeleton: props.skeleton,
        site: "thigh",
        side,
        part: "trunk",
      });
      const centreV: number = side === "left" ? 0.25 : 0.75;
      const loop: AutoMovieHumanCageBuilder.IStation = {
        vertices: order.map((k: number): number =>
          k === -1 ? crotch : P.vertices[k]!,
        ),
        coordinates: order.map(
          (k: number): AutoMovieHumanCageBuilder.IChart =>
            k === -1
              ? { u: 0.4 * U0, v: centreV }
              : { u: U0, v: side === "right" && k === 0 ? 1 : k / N },
        ),
      };
      const leg = side === "left" ? body.leftLeg : body.rightLeg;
      const ring: AutoMovieHumanCageBuilder.IStation = builder.open(
        layout,
        (): number => (0.85 * leg.thighCircumference) / (2 * Math.PI),
        0,
      );
      ring.coordinates = shrink(
        loop.coordinates,
        { u: 0.75 * U0, v: centreV },
        0.35,
      );
      const middle: AutoMovieHumanCageBuilder.IStation = builder.blend(
        loop,
        ring,
        0.5,
      );
      builder.bridge(loop, middle);
      builder.bridge(middle, ring);
    }
    return builder.build();
  }
}

/** Shoulder band grid points on the top row, in its vertex order: `i` from the right (-X) to the left, `j` from the back to the front. */
const OUTER: Array<[number, number]> = [
  [3, 4],
  [4, 4],
  [5, 4],
  [6, 4],
  [6, 3],
  [6, 2],
  [6, 1],
  [6, 0],
  [5, 0],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 0],
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 4],
  [2, 4],
];

/** Shoulder band grid points on the neck base ring, in its vertex order. */
const INNER: Array<[number, number]> = [
  [3, 3],
  [4, 3],
  [5, 3],
  [5, 2],
  [5, 1],
  [4, 1],
  [3, 1],
  [2, 1],
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 3],
];

/** Each arm opening's boundary as (row, column) cells, counterclockwise about the lateral axis from anterior. */
const ARM_OPENINGS: Array<[AutoMovieHumanSide, Array<[number, number]>]> = [
  [
    "left",
    [
      [5, 4],
      [4, 4],
      [4, 5],
      [4, 6],
      [5, 6],
      [6, 6],
      [6, 5],
      [6, 4],
    ],
  ],
  [
    "right",
    [
      [5, 16],
      [6, 16],
      [6, 15],
      [6, 14],
      [5, 14],
      [4, 14],
      [4, 15],
      [4, 16],
    ],
  ],
];

/** Each thigh opening as crotch-row columns counterclockwise about the downward axis from anterior; -1 is the crotch vertex. */
const LEG_LOOPS: Array<[AutoMovieHumanSide, number[]]> = [
  ["left", [2, 1, 0, -1, 10, 9, 8, 7, 6, 5, 4, 3]],
  ["right", [18, 17, 16, 15, 14, 13, 12, 11, 10, -1, 0, 19]],
];

/** Chart coordinates pulled toward a centre, keeping a fraction of their offset. */
const shrink = (
  coordinates: AutoMovieHumanCageBuilder.IChart[],
  centre: AutoMovieHumanCageBuilder.IChart,
  keep: number,
): AutoMovieHumanCageBuilder.IChart[] =>
  coordinates.map((c: AutoMovieHumanCageBuilder.IChart) => ({
    u: centre.u + (c.u - centre.u) * keep,
    v: centre.v + (c.v - centre.v) * keep,
  }));

/** Ramanujan's perimeter of an ellipse with semi-axes `a` and `b`. */
const perimeter = (a: number, b: number): number =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/** Half breadth of an ellipse of the given circumference and depth-to-breadth ratio 0.7. */
const breadth = (circumference: number): number =>
  circumference / perimeter(0.7, 1);

/** Half depth of an ellipse of the given circumference and half breadth, by bisection. */
const depth = (circumference: number, b: number): number => {
  let lo: number = 0;
  let hi: number = circumference;
  for (let i: number = 0; i < 60; ++i) {
    const mid: number = (lo + hi) / 2;
    if (perimeter(mid, b) < circumference) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
