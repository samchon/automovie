import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { layoutAutoMovieHumanRing } from "../../junction/layoutAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { estimateAutoMovieHumanArmTissue } from "./estimateAutoMovieHumanArmTissue";
import { sectionAutoMovieHumanArm } from "./sectionAutoMovieHumanArm";

/** Ring count of both arm junctions, the vertices of every section. */
const COUNT: number = 8;

/**
 * Rounds of the fit that moves the cage until its limit surface passes through the sections. Each round removes at least 8/9 of the remaining error in every mode, the smallest eigenvalue of the bicubic limit stencil being 1/9, so 60 rounds leave under a thousandth.
 */
const FIT_ROUNDS: number = 60;

/**
 * Rounds that rescale the measured girths until the limit surface reproduces them: the sections set girths on smooth curves through their points, and the surface between loops and the open rings' own curves differ from those by a few millimetres, which each round divides out.
 */
const CALIBRATION_ROUNDS: number = 4;

/**
 * Build one arm's control cage from the person's measurements and skeleton.
 *
 * Every section of `sectionAutoMovieHumanArm` becomes one ring of eight cage vertices around the bone axis: above the elbow on the line from the shoulder to the elbow joint centre, below it on the line from the elbow to the wrist joint centre, at the joint on their bisector, so a carrying angle or flexion in the skeleton bends the cage with it. Each section's anterior direction is the rest-pose front projected across its axis, turned by the section's twist toward the medial side, so the vertex lines spiral down the mid-prone forearm and the last ring starts on the palmar surface exactly as the wrist ring does.
 *
 * The section radii describe the surface, not the cage: the cage is fitted so that its limit surface passes through every section point, by the bicubic B-spline limit stencil inside the cage and by the cubic B-spline of the ring itself on the two open rings, whose vertices move only along their layout directions so each stays on its anatomical ray. The two rings are the layouts of `layoutAutoMovieHumanRing` for the `upperArm` and `wrist` sites.
 *
 * The chart runs `u` from the upper cut (0) to the wrist (1) in proportion to length along the bones, and `v` counterclockwise about the distal axis from the anterior mark of each section. Both sides share connectivity; the right arm mirrors the left through the side's own frame, so its faces stay counterclockwise from outside.
 *
 * @param measurements The person
 * @param skeleton The person's skeleton at rest
 * @param side Which arm
 * @returns Cage with the `upperArm` ring first and the `wrist` ring second
 */
export function buildAutoMovieHumanArmCage(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  side: AutoMovieHumanSide,
): IAutoMovieHumanCage {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const identity: IAutoMovieHumanIdentity = measurements.identity;
  const arm: IAutoMovieHumanIdentity.IArm =
    side === "left" ? identity.body.leftArm : identity.body.rightArm;
  const tissue: estimateAutoMovieHumanArmTissue.IOutput =
    estimateAutoMovieHumanArmTissue(identity, arm);
  const joint = (bone: string): IAutoMovieVector3 => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined = skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === `${side}${bone}`,
    );
    if (found === undefined) throw new Error(`skeleton lacks ${side}${bone}`);
    return found.position;
  };
  const upper: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
    skeleton,
    site: "upperArm",
    side,
    part: "arm",
  });
  const wrist: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
    skeleton,
    site: "wrist",
    side,
    part: "arm",
  });
  const elbow: IAutoMovieVector3 = joint("LowerArm");
  const humerus: IAutoMovieVector3 = V.normalize(
    V.offset(elbow, [joint("UpperArm"), -1]),
  );
  const forearm: IAutoMovieVector3 = V.normalize(
    V.offset(joint("Hand"), [elbow, -1]),
  );
  const above: number = V.distance(upper.frame.origin, elbow);
  const below: number = V.distance(elbow, wrist.frame.origin);
  const mirror: number = side === "left" ? 1 : -1;

  // targets: the surface point of every section direction
  const shape = (
    sections: sectionAutoMovieHumanArm.ISection[],
  ): IAutoMovieVector3[][] => {
  const targets: IAutoMovieVector3[][] = sections.map(
    (section: sectionAutoMovieHumanArm.ISection, i: number): IAutoMovieVector3[] => {
      const layout: IAutoMovieHumanRingLayout | null =
        i === 0 ? upper : i === sections.length - 1 ? wrist : null;
      const axis: IAutoMovieVector3 =
        section.level < 0
          ? humerus
          : section.level > 0
            ? forearm
            : V.normalize(V.offset(humerus, [forearm, 1]));
      const centre: IAutoMovieVector3 =
        layout !== null
          ? layout.frame.origin
          : V.offset(elbow, [
              axis,
              section.level * (section.level < 0 ? above : below),
            ]);
      const front: IAutoMovieVector3 = V.normalize(
        V.offset(V.of(0, 0, 1), [axis, -axis.z]),
      );
      const side90: IAutoMovieVector3 = V.cross(axis, front);
      return Array.from({ length: COUNT }, (_: unknown, j: number): IAutoMovieVector3 => {
        const label: number = (((mirror * j) % COUNT) + COUNT) % COUNT;
        const radius: number = section.radii[label]!;
        const direction: IAutoMovieVector3 =
          layout === upper
            ? upper.directions[(COUNT - j) % COUNT]!
            : layout === wrist
              ? wrist.directions[j]!
              : (() => {
                  const angle: number =
                    (mirror * section.twist * Math.PI) / 180 +
                    (2 * Math.PI * j) / COUNT;
                  return V.offset(
                    V.of(0, 0, 0),
                    [front, Math.cos(angle)],
                    [side90, Math.sin(angle)],
                  );
                })();
        return V.offset(centre, [direction, radius]);
      });
    },
  );
  const vertices: IAutoMovieVector3[][] = fit(targets, [
    { origin: upper.frame.origin, directions: targets[0]!.map((p) => direction(p, upper.frame.origin)) },
    {
      origin: wrist.frame.origin,
      directions: targets[targets.length - 1]!.map((p) => direction(p, wrist.frame.origin)),
    },
  ]);
  return vertices;
  };

  // the girths the identity measures, on the cage's own limit surface
  let girths: Pick<
    IAutoMovieHumanIdentity.IArm,
    "upperArmCircumference" | "forearmCircumference" | "wristCircumference"
  > = { ...arm };
  let sections: sectionAutoMovieHumanArm.ISection[] = [];
  let vertices: IAutoMovieVector3[][] = [];
  for (let round: number = 0; round < CALIBRATION_ROUNDS; ++round) {
    sections = sectionAutoMovieHumanArm({ ...arm, ...girths }, tissue);
    vertices = shape(sections);
    const measured: typeof girths = {
      upperArmCircumference: perimeter(vertices[0]!),
      forearmCircumference: forearmMaximum(vertices, sections),
      wristCircumference: perimeter(vertices[vertices.length - 1]!),
    };
    girths = {
      upperArmCircumference:
        (girths.upperArmCircumference * arm.upperArmCircumference) /
        measured.upperArmCircumference,
      forearmCircumference:
        (girths.forearmCircumference * arm.forearmCircumference) /
        measured.forearmCircumference,
      wristCircumference:
        (girths.wristCircumference * arm.wristCircumference) /
        measured.wristCircumference,
    };
  }

  // chart: u along the bones, v around from the anterior mark
  const u: number[] = sections.map(
    (section: sectionAutoMovieHumanArm.ISection): number =>
      (section.level < 0
        ? (1 + section.level) * above
        : above + section.level * below) /
      (above + below),
  );
  const index = (i: number, j: number): number => i * COUNT + (j % COUNT);
  const coordinate = (i: number, v: number): IAutoMovieHumanSurfaceCoordinate => ({
    part: "arm",
    side,
    u: u[i]!,
    v,
  });
  const faces: IAutoMovieHumanCage.IFace[] = [];
  for (let i: number = 0; i + 1 < sections.length; ++i)
    for (let j: number = 0; j < COUNT; ++j)
      faces.push({
        vertices: [index(i, j), index(i, j + 1), index(i + 1, j + 1), index(i + 1, j)],
        coordinates: [
          coordinate(i, j / COUNT),
          coordinate(i, (j + 1) / COUNT),
          coordinate(i + 1, (j + 1) / COUNT),
          coordinate(i + 1, j / COUNT),
        ],
      });
  const last: number = sections.length - 1;
  return {
    vertices: vertices.flat().map(
      (position: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({ position }),
    ),
    faces,
    creases: [],
    rings: [
      {
        site: "upperArm",
        side,
        vertices: Array.from({ length: COUNT }, (_: unknown, k: number): number =>
          index(0, (COUNT - k) % COUNT),
        ),
        start: upper.start,
        frame: upper.frame,
      },
      {
        site: "wrist",
        side,
        vertices: Array.from({ length: COUNT }, (_: unknown, k: number): number =>
          index(last, k),
        ),
        start: wrist.start,
        frame: wrist.frame,
      },
    ],
  };
}

/** Uniform cubic B-spline weights at parameter t of one span. */
const basis = (t: number): [number, number, number, number] => [
  (1 - t) ** 3 / 6,
  (3 * t ** 3 - 6 * t ** 2 + 4) / 6,
  (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6,
  t ** 3 / 6,
];

/** Length of the closed cubic B-spline of a control loop, which is the limit of an open ring and, blended across loops, of a section of the surface. */
const perimeter = (control: IAutoMovieVector3[]): number => {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const SAMPLES: number = 16;
  const points: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < control.length; ++k)
    for (let s: number = 0; s < SAMPLES; ++s) {
      const w: [number, number, number, number] = basis(s / SAMPLES);
      points.push(
        V.offset(
          V.of(0, 0, 0),
          ...w.map((weight: number, a: number): [IAutoMovieVector3, number] => [
            control[(k - 1 + a + control.length) % control.length]!,
            weight,
          ]),
        ),
      );
    }
  return points.reduce(
    (sum: number, p: IAutoMovieVector3, i: number): number =>
      sum + V.distance(p, points[(i + 1) % points.length]!),
    0,
  );
};

/**
 * Largest girth of the forearm's upper half on the limit surface. The cage is a regular grid, so between interior loops the limit is the bicubic B-spline of four consecutive loops; a section at one parameter is the closed B-spline of their blend.
 */
const forearmMaximum = (
  cage: IAutoMovieVector3[][],
  sections: sectionAutoMovieHumanArm.ISection[],
): number => {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const STEPS: number = 8;
  let best: number = 0;
  sections.forEach((section: sectionAutoMovieHumanArm.ISection, i: number): void => {
    if (section.level <= 0 || section.level >= 0.5 || i + 2 >= cage.length) return;
    for (let s: number = 0; s < STEPS; ++s) {
      const w: [number, number, number, number] = basis(s / STEPS);
      const loop: IAutoMovieVector3[] = cage[i]!.map(
        (_: IAutoMovieVector3, j: number): IAutoMovieVector3 =>
          V.offset(
            V.of(0, 0, 0),
            ...w.map((weight: number, a: number): [IAutoMovieVector3, number] => [
              cage[i - 1 + a]![j]!,
              weight,
            ]),
          ),
      );
      best = Math.max(best, perimeter(loop));
    }
  });
  return best;
};

/** Unit direction from a ring's origin to one of its points. */
const direction = (
  point: IAutoMovieVector3,
  origin: IAutoMovieVector3,
): IAutoMovieVector3 =>
  AutoMovieHumanVector.normalize(AutoMovieHumanVector.offset(point, [origin, -1]));

/** An open ring whose vertices slide only along their directions. */
interface IOpening {
  origin: IAutoMovieVector3;
  directions: IAutoMovieVector3[];
}

/**
 * Move the cage until its Catmull-Clark limit surface passes through the targets.
 *
 * Inside the grid a regular vertex's limit is the tensor product of the cubic B-spline weights 1/6, 4/6, 1/6 over its 3 by 3 neighbourhood; on an open ring it is the ring's own cubic B-spline, because the boundary edges are sharp. Each round adds the remaining error to every vertex, a stable fixed-point iteration since every eigenvalue of the stencil lies between 1/9 and 1; ring vertices take only the part of their error along their direction.
 */
const fit = (
  targets: IAutoMovieVector3[][],
  openings: [IOpening, IOpening],
): IAutoMovieVector3[][] => {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const rows: number = targets.length;
  let cage: IAutoMovieVector3[][] = targets.map((row: IAutoMovieVector3[]) => [...row]);
  const at = (i: number, j: number): IAutoMovieVector3 =>
    cage[i]![(j + COUNT) % COUNT]!;
  const W: [number, number, number] = [1 / 6, 4 / 6, 1 / 6];
  for (let round: number = 0; round < FIT_ROUNDS; ++round)
    cage = cage.map((row: IAutoMovieVector3[], i: number): IAutoMovieVector3[] =>
      row.map((point: IAutoMovieVector3, j: number): IAutoMovieVector3 => {
        const opening: IOpening | null =
          i === 0 ? openings[0] : i === rows - 1 ? openings[1] : null;
        let limit: IAutoMovieVector3 = V.of(0, 0, 0);
        if (opening !== null)
          for (let b: number = -1; b <= 1; ++b)
            limit = V.offset(limit, [at(i, j + b), W[b + 1]!]);
        else
          for (let a: number = -1; a <= 1; ++a)
            for (let b: number = -1; b <= 1; ++b)
              limit = V.offset(limit, [at(i + a, j + b), W[a + 1]! * W[b + 1]!]);
        const error: IAutoMovieVector3 = V.offset(targets[i]![j]!, [limit, -1]);
        if (opening === null) return V.offset(point, [error, 1]);
        const d: IAutoMovieVector3 = opening.directions[j]!;
        return V.offset(point, [d, V.dot(error, d)]);
      }),
    );
  return cage;
};
