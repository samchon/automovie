import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
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
 * Rounds that rescale the forearm girth until the limit surface reproduces it: the sections set girths on smooth curves through their points, and the surface between loops differs from those by a few millimetres, which each round divides out.
 */
const CALIBRATION_ROUNDS: number = 4;

/**
 * Build one arm's control cage from the person's measurements and skeleton.
 *
 * Every section of `sectionAutoMovieHumanArm` becomes one loop of eight cage vertices around the bone axis: above the elbow on the line from the shoulder to the elbow joint centre, below it on the line from the elbow to the wrist joint centre, at the joint on their bisector, so a carrying angle or flexion in the skeleton bends the cage with it. Each section's anterior direction is the rest-pose front projected across its axis, turned by the section's twist toward the medial side, so the vertex lines spiral down the mid-prone forearm and the last loop starts on the palmar surface exactly as the wrist ring does.
 *
 * The two end loops are the junction's: the `upperArm` and `wrist` rings of `shapeAutoMovieHumanRing`, vertex for vertex, so the trunk and the hand meet them without either part adapting. The interior section radii describe the surface, not the cage: interior vertices are fitted so the limit surface passes through every section point by the bicubic B-spline limit stencil, each moving only along its own ray from its loop's centre. The loops are unevenly spaced around the elbow, and fitting along the limb would push neighbouring loops past each other and fold the surface.
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
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === `${side}${bone}`,
      );
    if (found === undefined) throw new Error(`skeleton lacks ${side}${bone}`);
    return found.position;
  };
  const ring = (site: "upperArm" | "wrist"): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({ skeleton, measurements, site, side, part: "arm" });
  const upper: IAutoMovieHumanRingShape = ring("upperArm");
  const wrist: IAutoMovieHumanRingShape = ring("wrist");
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

  // the cage of one set of sections: end loops from the junction, interior loops fitted
  const shape = (
    sections: sectionAutoMovieHumanArm.ISection[],
  ): IAutoMovieVector3[][] => {
    const last: number = sections.length - 1;
    const centres: IAutoMovieVector3[] = [];
    const targets: IAutoMovieVector3[][] = sections.map(
      (
        section: sectionAutoMovieHumanArm.ISection,
        i: number,
      ): IAutoMovieVector3[] => {
        if (i === 0) {
          centres.push(upper.frame.origin);
          return Array.from(
            { length: COUNT },
            (_: unknown, j: number): IAutoMovieVector3 =>
              upper.positions[(COUNT - j) % COUNT]!,
          );
        }
        if (i === last) {
          centres.push(wrist.frame.origin);
          return [...wrist.positions];
        }
        const axis: IAutoMovieVector3 =
          section.level < 0
            ? humerus
            : section.level > 0
              ? forearm
              : V.normalize(V.offset(humerus, [forearm, 1]));
        const centre: IAutoMovieVector3 = V.offset(elbow, [
          axis,
          section.level * (section.level < 0 ? above : below),
        ]);
        centres.push(centre);
        const front: IAutoMovieVector3 = V.normalize(
          V.offset(V.of(0, 0, 1), [axis, -axis.z]),
        );
        const toward: IAutoMovieVector3 = V.cross(axis, front);
        return Array.from(
          { length: COUNT },
          (_: unknown, j: number): IAutoMovieVector3 => {
            const label: number = (((mirror * j) % COUNT) + COUNT) % COUNT;
            const angle: number =
              (mirror * section.twist * Math.PI) / 180 +
              (2 * Math.PI * j) / COUNT;
            return V.offset(centre, [
              V.offset(
                V.of(0, 0, 0),
                [front, Math.cos(angle)],
                [toward, Math.sin(angle)],
              ),
              section.radii[label]!,
            ]);
          },
        );
      },
    );
    return fit(targets, centres);
  };

  // the forearm girth the identity measures, on the cage's own limit surface
  let girth: number = arm.forearmCircumference;
  let sections: sectionAutoMovieHumanArm.ISection[] = [];
  let vertices: IAutoMovieVector3[][] = [];
  for (let round: number = 0; round < CALIBRATION_ROUNDS; ++round) {
    sections = sectionAutoMovieHumanArm(
      { ...arm, forearmCircumference: girth },
      tissue,
    );
    vertices = shape(sections);
    girth *= arm.forearmCircumference / forearmMaximum(vertices, sections);
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
  const coordinate = (
    i: number,
    v: number,
  ): IAutoMovieHumanSurfaceCoordinate => ({
    part: "arm",
    side,
    u: u[i]!,
    v,
  });
  const faces: IAutoMovieHumanCage.IFace[] = [];
  for (let i: number = 0; i + 1 < sections.length; ++i)
    for (let j: number = 0; j < COUNT; ++j)
      faces.push({
        vertices: [
          index(i, j),
          index(i, j + 1),
          index(i + 1, j + 1),
          index(i + 1, j),
        ],
        coordinates: [
          coordinate(i, j / COUNT),
          coordinate(i, (j + 1) / COUNT),
          coordinate(i + 1, (j + 1) / COUNT),
          coordinate(i + 1, j / COUNT),
        ],
      });
  const last: number = sections.length - 1;
  return {
    vertices: vertices
      .flat()
      .map(
        (position: IAutoMovieVector3): IAutoMovieHumanCage.IVertex => ({
          position,
        }),
      ),
    faces,
    creases: [],
    rings: [
      {
        site: "upperArm",
        side,
        vertices: Array.from(
          { length: COUNT },
          (_: unknown, k: number): number => index(0, (COUNT - k) % COUNT),
        ),
        start: upper.start,
        frame: upper.frame,
      },
      {
        site: "wrist",
        side,
        vertices: Array.from(
          { length: COUNT },
          (_: unknown, k: number): number => index(last, k),
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

/** Length of the closed cubic B-spline of a control loop, which blended across loops is a section of the surface. */
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
          ...w.map(
            (weight: number, a: number): [IAutoMovieVector3, number] => [
              control[(k - 1 + a + control.length) % control.length]!,
              weight,
            ],
          ),
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
  sections.forEach(
    (section: sectionAutoMovieHumanArm.ISection, i: number): void => {
      if (section.level <= 0 || section.level >= 0.5 || i + 2 >= cage.length)
        return;
      for (let s: number = 0; s < STEPS; ++s) {
        const w: [number, number, number, number] = basis(s / STEPS);
        const loop: IAutoMovieVector3[] = cage[i]!.map(
          (_: IAutoMovieVector3, j: number): IAutoMovieVector3 =>
            V.offset(
              V.of(0, 0, 0),
              ...w.map(
                (weight: number, a: number): [IAutoMovieVector3, number] => [
                  cage[i - 1 + a]![j]!,
                  weight,
                ],
              ),
            ),
        );
        best = Math.max(best, perimeter(loop));
      }
    },
  );
  return best;
};

/**
 * Move the interior loops until the Catmull-Clark limit surface passes through the targets; the end loops are the junction rings and stay.
 *
 * A regular interior vertex's limit is the tensor product of the cubic B-spline weights 1/6, 4/6, 1/6 over its 3 by 3 neighbourhood. Each round moves every interior vertex along its own ray from its loop's centre by the part of the remaining error along that ray, a stable fixed-point iteration since every eigenvalue of the stencil lies between 1/9 and 1.
 */
const fit = (
  targets: IAutoMovieVector3[][],
  centres: IAutoMovieVector3[],
): IAutoMovieVector3[][] => {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const rows: number = targets.length;
  const rays: IAutoMovieVector3[][] = targets.map(
    (row: IAutoMovieVector3[], i: number): IAutoMovieVector3[] =>
      row.map(
        (p: IAutoMovieVector3): IAutoMovieVector3 =>
          V.normalize(V.offset(p, [centres[i]!, -1])),
      ),
  );
  let cage: IAutoMovieVector3[][] = targets.map(
    (row: IAutoMovieVector3[]): IAutoMovieVector3[] => [...row],
  );
  const at = (i: number, j: number): IAutoMovieVector3 =>
    cage[i]![(j + COUNT) % COUNT]!;
  const W: [number, number, number] = [1 / 6, 4 / 6, 1 / 6];
  for (let round: number = 0; round < FIT_ROUNDS; ++round)
    cage = cage.map(
      (row: IAutoMovieVector3[], i: number): IAutoMovieVector3[] =>
        i === 0 || i === rows - 1
          ? row
          : row.map((point: IAutoMovieVector3, j: number): IAutoMovieVector3 => {
              let limit: IAutoMovieVector3 = V.of(0, 0, 0);
              for (let a: number = -1; a <= 1; ++a)
                for (let b: number = -1; b <= 1; ++b)
                  limit = V.offset(limit, [
                    at(i + a, j + b),
                    W[a + 1]! * W[b + 1]!,
                  ]);
              const error: IAutoMovieVector3 = V.offset(targets[i]![j]!, [
                limit,
                -1,
              ]);
              const ray: IAutoMovieVector3 = rays[i]![j]!;
              return V.offset(point, [ray, V.dot(error, ray)]);
            }),
    );
  return cage;
};
