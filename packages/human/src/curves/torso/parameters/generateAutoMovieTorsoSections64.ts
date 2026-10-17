import type { IAutoMovieHumanMeasurements } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { ITorsoMeasurements as T } from "../family/ITorsoMeasurements";
import type { IAutoMovieTorsoIdentity64 as I } from "./IAutoMovieTorsoIdentity64";

/** Generate six sparse horizontal courses from one superellipse/mass rule, including a lower derivative support and the internal axillary core. Dimensions and y use the existing skeleton's canonical rest frame; the returned ratios use trunkLengthMm. Root lanes are fixed angular samples, not separately fitted points. Public girth targets are waist, underbust and chest; lower-thorax girth is their declared interpolation. */
export function generateAutoMovieTorsoSections64(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  resolved: I.Resolved,
  powers: Readonly<Record<string, number>> = {},
): Pick<
  T.Value,
  | "trunkLengthMm"
  | "frame"
  | "pairedLaneRatios"
  | "sections"
  | "sectionFullness"
  | "foldMedianHeightRatio"
  | "foldRootHeightRatio"
> & {
  /** Three public girths plus an interpolated lower-thorax target, in millimetres of ideal taut convex tape. */
  targetGirthMm: Readonly<Record<string, number>>;
} {
  const body: IAutoMovieHumanMeasurements["identity"]["body"] =
    measurements.identity.body;
  const d: I.Independent = resolved.independent;
  const length: number = resolved.trunkLengthMm;
  const relativeY: (worldY: number) => number = (worldY: number): number =>
    worldY - resolved.origin[1];
  const column: readonly IAutoMovieHumanSkeleton.IJoint[] = [
    "spine",
    "chest",
    "upperChest",
    "neck",
  ].map(
    (name: string): IAutoMovieHumanSkeleton.IJoint =>
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === name,
      )!,
  );
  const centerZ: (y: number) => number = (y: number): number => {
    let i: number = 0;
    while (i < column.length - 2 && y > column[i + 1]!.position.y) i++;
    const a: IAutoMovieHumanSkeleton.IJoint = column[i]!;
    const b: IAutoMovieHumanSkeleton.IJoint = column[i + 1]!;
    return (
      a.position.z +
      ((y - a.position.y) / (b.position.y - a.position.y)) *
        (b.position.z - a.position.z) -
      resolved.origin[2]
    );
  };
  const anteriorLane: number =
    d.chestPeakSeparationMm / d.relaxedChestBreadthMm;
  // One common bilateral half-breadth lane; this is a sampling convention, not a clinical muscle landmark.
  const posteriorLane: number = 0.5;
  const rootInner: number = Math.cos(Math.PI / 16);
  const rootOuter: number = Math.cos(Math.PI / 8);
  const smooth: (x: number) => number = (x: number): number =>
    x * x * (3 - 2 * x);
  const mound: (r: number, peak: number) => number = (
    r: number,
    peak: number,
  ): number => (r <= peak ? smooth(r / peak) : smooth((1 - r) / (1 - peak)));
  const section: (
    y: number,
    breadth: number,
    depth: number,
    fraction: number,
    mass: readonly [number, number],
    power?: number,
  ) => T.Section = (
    y: number,
    breadth: number,
    depth: number,
    fraction: number,
    mass: readonly [number, number],
    power: number = 2,
  ): T.Section => {
    const z: number = centerZ(y);
    const round: (r: number) => number = (r: number): number =>
      Math.pow(Math.max(0, 1 - Math.pow(r, power)), 1 / power);
    const front: number = depth * fraction;
    const back: number = depth * (1 - fraction);
    const frontAt: (r: number, side: 0 | 1) => number = (
      r: number,
      side: 0 | 1,
    ): number => {
      const median: number = front - mass[side];
      const amplitude: number = front - median * round(anteriorLane);
      return z + median * round(r) + amplitude * mound(r, anteriorLane);
    };
    const backAt: (r: number) => number = (r: number): number => {
      const median: number = back - d.spinalGrooveDepthMm;
      const amplitude: number = back - median * round(posteriorLane);
      return z - median * round(r) - amplitude * mound(r, posteriorLane);
    };
    return {
      heightRatio: relativeY(y) / length,
      centerLateralRatio: 0,
      halfBreadthRatio: breadth / (2 * length),
      leftRootInnerXRatio: rootInner,
      leftRootOuterXRatio: rootOuter,
      rightRootInnerXRatio: rootInner,
      rightRootOuterXRatio: rootOuter,
      leftFlankDepthRatio: z / length,
      leftAnteriorRootInnerDepthRatio: frontAt(rootInner, 0) / length,
      leftAnteriorRootOuterDepthRatio: frontAt(rootOuter, 0) / length,
      leftAnteriorDepthRatio: frontAt(anteriorLane, 0) / length,
      medianAnteriorDepthRatio: (z + front - (mass[0] + mass[1]) / 2) / length,
      rightAnteriorDepthRatio: frontAt(anteriorLane, 1) / length,
      rightAnteriorRootOuterDepthRatio: frontAt(rootOuter, 1) / length,
      rightAnteriorRootInnerDepthRatio: frontAt(rootInner, 1) / length,
      rightFlankDepthRatio: z / length,
      rightPosteriorDepthRatio: backAt(posteriorLane) / length,
      medianPosteriorDepthRatio: (z - back + d.spinalGrooveDepthMm) / length,
      leftPosteriorDepthRatio: backAt(posteriorLane) / length,
    };
  };
  // Proportional girth scaling supplies an unmeasured under-thorax breadth convention.
  const underBreadth: number =
    (d.relaxedChestBreadthMm * body.underbustCircumference) /
    body.chestCircumference;
  const waist: T.Section = section(
    body.waistHeight,
    body.waistBreadth,
    body.waistDepth,
    d.waistAnteriorFraction,
    [0, 0],
    powers.waistNative,
  );
  // Repeat waist dimensions below the boundary to set its radius slope; this row is not emitted lower abdomen.
  const ghost: T.Section = {
    ...waist,
    heightRatio:
      waist.heightRatio -
      (d.underfoldHeightMm - body.waistHeight) / (4 * length),
  };
  const rows: Record<string, T.Section> = {
    waistBelowDerivativeSupport: ghost,
    waistNative: waist,
    lowerThorax: section(
      (body.waistHeight + d.underfoldHeightMm) / 2,
      (body.waistBreadth + underBreadth) / 2,
      (body.waistDepth + d.underbustDepthMm) / 2,
      (d.waistAnteriorFraction + d.chestAnteriorFraction) / 2,
      [0, 0],
      powers.lowerThorax,
    ),
    underfoldProxy: section(
      d.underfoldHeightMm,
      underBreadth,
      d.underbustDepthMm,
      d.chestAnteriorFraction,
      [0, 0],
      powers.underfoldProxy,
    ),
    chestMassProminence: section(
      d.chestHeightMm,
      d.relaxedChestBreadthMm,
      body.chestDepth,
      d.chestAnteriorFraction,
      d.pairedMassProjectionMm,
      powers.chestMassProminence,
    ),
    // Internal torso branch core; the separate axillary guides continue to the external arm collar.
    axillaryThorax: section(
      resolved.axillaHeightMm,
      d.relaxedChestBreadthMm,
      d.underbustDepthMm,
      d.chestAnteriorFraction,
      [0, 0],
    ),
  };
  const fullness: Record<
    string,
    { flank: number; anterior: number; posterior: number }
  > = {};
  for (const name of Object.keys(rows))
    fullness[name] = { flank: 1, anterior: 1, posterior: 1 };
  return {
    trunkLengthMm: length,
    frame: {
      origin: [0, 0, 0],
      basisX: [1, 0, 0],
      basisY: [0, 1, 0],
      basisZ: [0, 0, 1],
    },
    pairedLaneRatios: {
      anterior: [anteriorLane, anteriorLane],
      posterior: [posteriorLane, posteriorLane],
    },
    sections: rows,
    sectionFullness: fullness,
    foldMedianHeightRatio: relativeY(d.underfoldHeightMm) / length,
    foldRootHeightRatio:
      relativeY((d.underfoldHeightMm + resolved.axillaHeightMm) / 2) / length,
    targetGirthMm: {
      waistNative: body.waistCircumference,
      lowerThorax: (body.waistCircumference + body.underbustCircumference) / 2,
      underfoldProxy: body.underbustCircumference,
      chestMassProminence: body.chestCircumference,
    },
  };
}
