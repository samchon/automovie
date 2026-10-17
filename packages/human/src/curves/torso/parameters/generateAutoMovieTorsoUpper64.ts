import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { ITorsoMeasurements as T } from "../family/ITorsoMeasurements";
import { TorsoFamily } from "../family/TorsoFamily";
import { TorsoMath as M } from "../family/TorsoMath";
import type { IAutoMovieTorsoIdentity64 as I } from "./IAutoMovieTorsoIdentity64";

/** Derive median, shoulder and external axillary courses from the real neck, existing joints and physical supplements. A cervical-exit, actual acromial-cover and deltoid-transition rule supplies shoulder samples; midpoint sag/thickness supplies branch supports. These are explicit engineering conventions rather than measured T-pose skin. Throws if the real neck or suprasternale lies outside the supported upper-thorax bridge. */
export function generateAutoMovieTorsoUpper64(props: {
  /** Existing actual 55-bone skeleton; no regional joint-length reconstruction occurs here. */
  skeleton: IAutoMovieHumanSkeleton;

  /** Actual parent context used for world-to-spine conversion of the supplied neck. */
  context: Pick<
    AutoMovieCurveParentContext,
    "point" | "direction" | "inversePoint" | "inverseDirection"
  >;

  /** Actual face-owned world neck section and full longitudinal derivative; no inferred boundary substitute is accepted. */
  neck: C.Boundary;

  /** Common lower-trunk course rules before world placement; the upper-thorax supports anchor the upper courses. */
  profile: Pick<
    T.Value,
    | "trunkLengthMm"
    | "frame"
    | "pairedLaneRatios"
    | "sections"
    | "sectionFullness"
  >;

  /** Physical supplement values, actual skeleton origin and explicit convention provenance. */
  resolved: I.Resolved;

  /** Public suprasternale rest height in millimetres used for the upper-sternal transition station. */
  suprasternaleHeightMm: number;
}): Pick<
  T.Value,
  | "upperArms"
  | "branchFrames"
  | "shoulders"
  | "upperMedian"
  | "externalBranches"
> {
  const d: I.Independent = props.resolved.independent;
  const length: number = props.profile.trunkLengthMm;
  const family: TorsoFamily = new TorsoFamily(
    props.profile as T.Value,
    [0, 0, 0],
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  );
  const ay: number = family.rows.at(-1)!.y;
  const nativePoint: (p: C.Vector) => C.Vector = (p: C.Vector): C.Vector =>
    props.context.inversePoint("spine", p);
  const neckP: C.Span[] = props.neck.section.spans.map(
    (span: C.Span): C.Span => span.map(nativePoint) as unknown as C.Span,
  );
  const frontNeck: C.Vector = neckP[0]![0];
  const backNeck: C.Vector = neckP[2]![0];
  const ny: number = frontNeck[1];
  if (!(ny > ay))
    throw new Error(
      "Actual mid-neck must lie above the actual upper-thorax course",
    );
  const upperMedian: Record<
    string,
    {
      features: Record<
        string,
        { heightFraction: number; depthChangeOverHeight: number }
      >;
    }
  > = {};
  for (const [name, lane, end] of [
    ["upperSternalColumn", 4, frontNeck],
    ["upperSpinalColumn", 10, backNeck],
  ] as const) {
    const start: C.Vector = family.sample(ay, lane);
    const notchY: number =
      props.suprasternaleHeightMm - props.resolved.origin[1];
    const fraction: number = (notchY - ay) / (ny - ay);
    if (!(fraction > 0 && fraction < 1))
      throw new Error(
        "Suprasternale must remain inside actual axilla-to-neck bridge",
      );
    const notchZ: number =
      start[2] +
      fraction * (end[2] - start[2]) -
      (name === "upperSternalColumn" ? d.clavicularHollowDepthMm : 0);
    upperMedian[name] = {
      features: {
        thoracicApproach: {
          heightFraction: fraction / 2,
          depthChangeOverHeight: (notchZ - start[2]) / (2 * (ny - ay)),
        },
        suprasternalTransition: {
          heightFraction: fraction,
          depthChangeOverHeight: (notchZ - start[2]) / (ny - ay),
        },
        cervicalApproach: {
          heightFraction: (1 + fraction) / 2,
          depthChangeOverHeight: ((notchZ + end[2]) / 2 - start[2]) / (ny - ay),
        },
      },
    };
  }
  const upperArms: Partial<T.Value["upperArms"]> = {};
  const branchFrames: Partial<T.Value["branchFrames"]> = {};
  const shoulders: Partial<T.Value["shoulders"]> = {};
  const externalBranches: Partial<T.Value["externalBranches"]> = {};
  for (const [index, side] of (["left", "right"] as const).entries()) {
    const sign: number = side === "left" ? 1 : -1;
    const joint: IAutoMovieHumanSkeleton.IJoint | undefined =
      props.skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === side + "UpperArm",
      );
    if (!joint) throw new Error("Actual upper-arm joint and tail required");
    const nativeOrigin: C.Vector = [
      joint.position.x,
      joint.position.y,
      joint.position.z,
    ];
    const tail: C.Vector = [joint.tail.x, joint.tail.y, joint.tail.z];
    const axis: C.Vector = M.unit(M.sub(tail, nativeOrigin));
    const v: C.Vector = M.unit(M.sub([0, 0, 1], M.mul(axis, axis[2])));
    const u: C.Vector = M.unit(M.cross(v, axis));
    const o: C.Vector = M.add(
      nativeOrigin,
      M.mul(M.sub(tail, nativeOrigin), 0.25),
    );
    const ratio: number = d.upperArmBreadthDepthRatio[index]!;
    // Ramanujan's algebraic ellipse circumference is a sizing convention here;
    // actual emitted cubic collar length is independently reported by checks.
    const radiusV: number =
      d.proximalUpperArmCircumferenceMm[index]! /
      (Math.PI * (3 * (ratio + 1) - Math.sqrt((3 * ratio + 1) * (ratio + 3))));
    const radiusU: number = ratio * radiusV;
    upperArms[side] = {
      frame: {
        origin: M.sub(o, nativeOrigin),
        basisX: u,
        basisY: axis,
        basisZ: v,
      },
      skin: {
        positiveUHalfBreadthMm: radiusU,
        negativeUHalfBreadthMm: radiusU,
        anteriorHalfDepthMm: radiusV,
        posteriorHalfDepthMm: radiusV,
        positiveUDepthOffsetMm: 0,
        negativeUDepthOffsetMm: 0,
        anteriorBreadthOffsetMm: 0,
        posteriorBreadthOffsetMm: 0,
      },
      continuationHandleLengthMm: Math.min(radiusU, radiusV) / 4,
    };
    branchFrames[side] = {
      origin: M.sub(props.resolved.origin, nativeOrigin),
      basisX: [1, 0, 0],
      basisY: [0, 1, 0],
      basisZ: [0, 0, 1],
    };
    const relativeOrigin: C.Vector = M.sub(o, props.resolved.origin);
    const poles: C.Vector[] = [
      M.add(relativeOrigin, M.mul(u, radiusU)),
      M.add(relativeOrigin, M.mul(v, radiusV)),
      M.sub(relativeOrigin, M.mul(u, radiusU)),
      M.sub(relativeOrigin, M.mul(v, radiusV)),
    ];
    const neckLat: C.Vector = neckP[side === "left" ? 1 : 3]![0];
    const shoulderSpan: number = M.length(M.sub(relativeOrigin, neckLat));
    const courses: Record<string, T.Course> = {};
    for (const [name, start, end, across] of [
      [
        "trapeziusDeltoidCrest",
        neckLat,
        poles[side === "left" ? 0 : 2]!,
        [0, 0, 1],
      ],
      [
        "clavicleAnteriorDeltoid",
        M.bez(neckP[side === "left" ? 0 : 3]!, 0.5),
        poles[1]!,
        [0, 1, 0],
      ],
      [
        "scapularPosteriorDeltoid",
        M.bez(neckP[side === "left" ? 1 : 2]!, 0.5),
        poles[3]!,
        [0, 1, 0],
      ],
    ] as readonly (readonly [string, C.Vector, C.Vector, C.Vector])[]) {
      // Gray's Anatomy (1918), surface anatomy of the upper extremity, locates
      // the clavicle-to-acromion support beneath trapezius and deltoid. That
      // qualitative account supplies attachments, not a soft-tissue norm:
      // https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/
      // The explicit thickness/hollow supplements remain geometric conventions.
      const acromion: IAutoMovieHumanSkeleton["landmarks"]["left"]["acromion"]["position"] =
        props.skeleton.landmarks[side].acromion.position;
      const cervicale: IAutoMovieHumanSkeleton["landmarks"]["cervicale"]["position"] =
        props.skeleton.landmarks.cervicale.position;
      const clavicale: IAutoMovieHumanSkeleton["landmarks"]["left"]["clavicale"]["position"] =
        props.skeleton.landmarks[side].clavicale.position;
      const bonyCover: C.Vector = M.sub(
        [acromion.x, acromion.y, acromion.z],
        props.resolved.origin,
      );
      const rootDrop: number =
        start[1] - (cervicale.y - props.resolved.origin[1]);
      if (rootDrop <= 0)
        throw new Error("Cervical exit must lie below the actual neck cut");
      const exitFraction: number =
        rootDrop / (rootDrop + Math.abs(end[0] - start[0]));
      const exitChord: C.Vector = M.add(
        start,
        M.mul(M.sub(end, start), exitFraction),
      );
      // The first lateral excursion is tied to the cervical drop and shoulder
      // run, rather than a fixed fraction of a long neck-to-arm chord. The
      // anterior support follows the actual clavicale/acromion bone segment.
      const clavicleFraction: number =
        (exitChord[0] + props.resolved.origin[0] - clavicale.x) /
        (acromion.x - clavicale.x);
      const clavicleRoot: C.Vector = [
        exitChord[0],
        clavicale.y +
          clavicleFraction * (acromion.y - clavicale.y) -
          props.resolved.origin[1] +
          d.deltoidSuperiorThicknessMm / 2,
        clavicale.z +
          clavicleFraction * (acromion.z - clavicale.z) -
          props.resolved.origin[2] -
          d.clavicularHollowDepthMm,
      ];
      const neckExit: C.Vector =
        name === "clavicleAnteriorDeltoid"
          ? clavicleRoot
          : [exitChord[0], start[1] - rootDrop, exitChord[2]];
      const cover: C.Vector =
        name === "trapeziusDeltoidCrest"
          ? M.add(bonyCover, [0, d.deltoidSuperiorThicknessMm, 0])
          : M.add(bonyCover, [
              0,
              d.deltoidSuperiorThicknessMm / 2,
              name === "clavicleAnteriorDeltoid"
                ? radiusV - d.clavicularHollowDepthMm
                : -radiusV - d.posteriorShoulderThicknessMm,
            ]);
      // Carry the acromial direction into the actual arm axis. A chord
      // midpoint lost this turning information and concentrated the roll at
      // the cover. This common Hermite shoulder-cap convention uses physical
      // support separation, not a per-body target or a copied control table.
      const capLength: number = M.length(M.sub(end, cover));
      const cap: C.Span = M.hermite(
        cover,
        end,
        M.mul(M.unit(M.sub(cover, neckExit)), capLength),
        M.mul(axis, capLength),
        1,
      );
      const points: C.Vector[] = [start, neckExit, cover, M.bez(cap, 0.5), end];
      const lengths: number[] = points
        .slice(1)
        .map((point: C.Vector, j: number): number =>
          M.length(M.sub(point, points[j]!)),
        );
      if (lengths.some((value: number): boolean => value <= 0))
        throw new Error(
          "Distinct cervical-exit and acromial-cover courses required",
        );
      const total: number = lengths.reduce(
        (sum: number, v: number): number => sum + v,
        0,
      );
      const phaseStations: number[] = M.cumulative(
        lengths.map((v: number): number => v / total),
      );
      const features: Record<string, T.Feature> = {};
      for (const [j, label] of [
        "neckShoulderExit",
        "acromialCover",
        "deltoidTransition",
      ].entries()) {
        const point: C.Vector = points[j + 1]!;
        const tangent: C.Vector =
          j === 1
            ? M.sub(cover, neckExit)
            : j === 2
              ? M.angularDerivative(cap, 0.5)
              : M.sub(points[j + 2]!, points[j]!);
        const normal: C.Vector = M.unit(M.cross(tangent, across));
        const q: C.Vector = M.mul(M.sub(point, neckLat), 1 / shoulderSpan);
        features[label] = {
          lateralOffsetRatio: sign * q[0],
          verticalOffsetRatio: q[1],
          anteriorOffsetRatio: q[2],
          surfaceNormalElevationDeg: (Math.asin(normal[1]) * 180) / Math.PI,
          surfaceNormalAzimuthDeg:
            (Math.atan2(normal[2], normal[0]) * 180) / Math.PI,
        };
      }
      courses[name] = { features, phaseStations };
    }
    shoulders[side] = { courses };
    const branches: Record<string, T.Offset> = {};
    for (const [name, lane, end, displacement] of [
      [
        "floorMid",
        side === "left" ? 0 : 8,
        poles[side === "left" ? 2 : 0]!,
        [0, -d.axillaryFloorDropMm, 0],
      ],
      [
        "anteriorFoldMid",
        side === "left" ? 2 : 6,
        poles[1]!,
        [0, 0, d.pairedMassProjectionMm[index]! / 2],
      ],
      [
        "posteriorFoldMid",
        side === "left" ? 11 : 9,
        poles[3]!,
        [0, 0, -d.posteriorShoulderThicknessMm / 2],
      ],
    ] as readonly (readonly [string, number, C.Vector, C.Vector])[]) {
      const middle: C.Vector = M.mul(
        M.add(M.mul(M.add(family.sample(ay, lane), end), 0.5), displacement),
        1 / length,
      );
      branches[name] = {
        lateralOffsetRatio: middle[0],
        verticalOffsetRatio: middle[1],
        anteriorOffsetRatio: middle[2],
      };
    }
    externalBranches[side] = branches;
  }
  return {
    upperArms: upperArms as T.Value["upperArms"],
    branchFrames: branchFrames as T.Value["branchFrames"],
    shoulders: shoulders as T.Value["shoulders"],
    upperMedian,
    externalBranches: externalBranches as T.Value["externalBranches"],
  };
}
