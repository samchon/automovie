import {
  AutoMoviePchip64,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanSurfaceMeasurements as M } from "../structures/IAutoMovieHumanSurfaceMeasurements";
import { AutoMovieHumanSurfaceBuilder64 } from "./AutoMovieHumanSurfaceBuilder64";
import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";
import { generateAutoMovieHumanSection64 } from "./generateAutoMovieHumanSection64";

/**
 * Generate the implemented charts of one neutral rest definition.
 * The initial exterior is the chest/waist/buttock envelope; both end cycles
 * remain open. Shoulder/axilla, neck/head apertures, pelvis/groin and extremities
 * are explicit missing incident regions, rather than filled tubes or old skin.
 * This is an incomplete Human layout, not a complete-body reconstruction.
 *
 * Stations use the caller's physical heights and independently admitted B/D/G.
 * The one skeleton supplies the sagittal axis by a declared shape-preserving
 * interpolation of spine centres. Coefficient-wise PCHIP derivatives include
 * this centre motion; Hermite rows use dP/d(-height), not normalized slopes.
 * Only the supplied stations carry measurement targets; intermediate sections
 * are an engineering interpolation and have no clinical measurement guarantee.
 */
export function generateAutoMovieHumanSurfaceDefinition(props: {
  skeleton: IAutoMovieHumanSkeleton;
  measurements: M;
}): D {
  const input: M = props.measurements;
  if (input === null || typeof input !== "object" || input.version !== 1 ||
      (input.qualification !== "measured-neutral-T" &&
       input.qualification !== "authored-convention"))
    throw new Error("A versioned neutral-rest measurement qualification is required");
  if (input.trunk === undefined || input.trunk === null || typeof input.trunk !== "object")
    throw new Error("No implemented surface chart has physical observations");
  if (Object.keys(input).some((key: string): boolean =>
      !["version", "qualification", "trunk"].includes(key)) ||
      Object.keys(input.trunk).some((key: string): boolean =>
        !["chest", "waist", "buttock"].includes(key)))
    throw new Error("Unrecognized physical-rest measurement field");
  const named: readonly (keyof NonNullable<M["trunk"]>)[] = ["chest", "waist", "buttock"];
  const samples: M.Section[] = named.map(
    (name: keyof NonNullable<M["trunk"]>): M.Section => input.trunk![name],
  );
  for (const sample of samples)
    if (sample === null || typeof sample !== "object" ||
        ![sample.heightMm, sample.breadthMm, sample.depthMm,
          sample.perimeterMm, sample.anteriorFraction].every(Number.isFinite) ||
        !(sample.heightMm > 0 && sample.anteriorFraction > 0 && sample.anteriorFraction < 1) ||
        Object.keys(sample).some((key: string): boolean =>
          !["heightMm", "breadthMm", "depthMm", "perimeterMm", "anteriorFraction"].includes(key)))
      throw new Error("Finite positive-height physical sections and an interior anterior fraction are required");
  const stations: number[] = samples.map((sample: M.Section): number => -sample.heightMm);
  if (stations.some((s: number, i: number): boolean => i > 0 && s <= stations[i-1]!))
    throw new Error("Physical planes must be ordered chest above waist above buttock");
  const supports: IAutoMovieHumanSkeleton.IJoint[] = props.skeleton.joints.filter(
    (joint: IAutoMovieHumanSkeleton.IJoint): boolean =>
      ["hips", "spine", "chest", "upperChest", "neck"].includes(joint.bone),
  ).sort((a: IAutoMovieHumanSkeleton.IJoint, b: IAutoMovieHumanSkeleton.IJoint): number =>
    a.position.y - b.position.y);
  if (supports.length !== 5)
    throw new Error("The common skeleton must supply all five trunk support centres");
  const sagittal: AutoMoviePchip64 = new AutoMoviePchip64(
    supports.map((joint: IAutoMovieHumanSkeleton.IJoint): number => joint.position.y),
    supports.map((joint: IAutoMovieHumanSkeleton.IJoint): number => joint.position.z),
  );
  /** The terminal support axis continues linearly outside the spinal centres. */
  function axisZ(height: number): number {
    const below: boolean = height < supports[0]!.position.y;
    const above: boolean = height > supports.at(-1)!.position.y;
    if (!below && !above) return sagittal.at(height);
    const a: IAutoMovieHumanSkeleton.IJoint = below ? supports[0]! : supports.at(-2)!;
    const b: IAutoMovieHumanSkeleton.IJoint = below ? supports[1]! : supports.at(-1)!;
    return a.position.z + (height-a.position.y) *
      (b.position.z-a.position.z)/(b.position.y-a.position.y);
  }
  const generated: ReturnType<typeof generateAutoMovieHumanSection64>[] = samples.map(
    (sample: M.Section, i: number): ReturnType<typeof generateAutoMovieHumanSection64> =>
      generateAutoMovieHumanSection64({
        name: `trunk.${named[i]}`,
        breadthMm: sample.breadthMm, depthMm: sample.depthMm,
        perimeterMm: sample.perimeterMm,
        centreMm: [0, sample.heightMm,
          axisZ(sample.heightMm) + (sample.anteriorFraction - 0.5) * sample.depthMm],
        breadthAxis: [1, 0, 0], anteriorAxis: [0, 0, 1],
      }),
  );
  // Limiting coefficients independently would lose the linear shared-tangent
  // relation. Interpolate the angular nodes and their one shared outgoing
  // handle separately, then derive BOTH neighboring coefficients and full jets.
  const nodes: C.Vector[][] = generated.map(
    (sample: ReturnType<typeof generateAutoMovieHumanSection64>): C.Vector[] =>
      sample.curve.spans.map((span: C.Span): C.Vector => span[0]),
  );
  const handles: C.Vector[][] = generated.map(
    (sample: ReturnType<typeof generateAutoMovieHumanSection64>): C.Vector[] =>
      sample.curve.spans.map((span: C.Span): C.Vector => [
        span[1][0]-span[0][0], span[1][1]-span[0][1], span[1][2]-span[0][2],
      ]),
  );
  const nodeJets: [number, number, number][][] = AutoMoviePchip64.fieldSlopes(stations, nodes);
  const handleJets: [number, number, number][][] = AutoMoviePchip64.fieldSlopes(stations, handles);
  /** Shared nodes/handles imply equal angular derivatives on both incident spans. */
  function spans(points: readonly C.Vector[], offsets: readonly C.Vector[]): C.Span[] {
    return points.map((point: C.Vector, i: number): C.Span => {
      const next: number = (i+1)%points.length;
      return [point, [point[0]+offsets[i]![0], point[1]+offsets[i]![1], point[2]+offsets[i]![2]],
        [points[next]![0]-offsets[next]![0], points[next]![1]-offsets[next]![1], points[next]![2]-offsets[next]![2]],
        points[next]!];
    });
  }
  for (let i: number = 0; i < generated.length; ++i)
    generated[i]!.curve.spans = spans(nodes[i]!, handles[i]!);
  const fullJ: C.Span[][] = nodeJets.map(
    (row: [number, number, number][], i: number): C.Span[] => spans(row, handleJets[i]!),
  );
  const builder: AutoMovieHumanSurfaceBuilder64 = new AutoMovieHumanSurfaceBuilder64({
    domain: "human.rest", revision: "physical-rest-field-1",
    toleranceMm: 0.5, maxCells: 32768, maxVertices: 131072,
  });
  for (let i: number = 0; i < generated.length-1; ++i)
    builder.strip({
      id: `trunk/${named[i]}-${named[i+1]}`,
      start: {id: `trunk/${named[i]}`, curve: generated[i]!.curve, fullJ: fullJ[i]!},
      end: {id: `trunk/${named[i+1]}`, curve: generated[i+1]!.curve, fullJ: fullJ[i+1]!},
      lengthMm: stations[i+1]!-stations[i]!,
      owner: {
        part: "trunk", side: null, branch: null, skinRole: "ordinary",
        bones: ["hips", "spine", "chest", "upperChest"],
        textureRectangle: [0, i/2, 1, (i+1)/2], headChart: null,
      },
    });
  for (let i: number = 0; i < generated.length; ++i)
    builder.boundary({
      id: `trunk/${named[i]}`, curve: generated[i]!.curve,
      fullJ: fullJ[i]!, longitudinalAxis: [0, -1, 0],
      incidents: [
        { chart: i === 0 ? "shoulder-axilla" : `trunk/${named[i-1]}-${named[i]}`,
          status: i === 0 ? "missing" : "generated" },
        { chart: i === generated.length-1 ? "pelvis-groin" : `trunk/${named[i]}-${named[i+1]}`,
          status: i === generated.length-1 ? "missing" : "generated" },
      ],
    });
  return builder.finish([
    `Input qualification: ${input.qualification}; no clinical-to-T-posture conversion was inferred.`,
    "Partial Human exterior: open chest and buttock cycles. Shoulder/axilla, neck/head, pelvis/groin, arms, hands, legs, feet and ears are not yet emitted.",
    "Convex symmetric envelope only; independently located chest masses, recesses and asymmetric envelope features are not represented.",
    "The skeletal support axis uses PCHIP between spinal centres and linear continuation of its terminal segment outside them; it is a frame convention, not a measured skin centre.",
    "Physical C1 coefficient interpolation is shared across the waist cut; global immersion, embedding and population coverage are unverified.",
    ...generated.map((sample: ReturnType<typeof generateAutoMovieHumanSection64>): string =>
      `${sample.curve.name}: perimeter residual ${sample.perimeterResidualMm} mm; quadrature agreement ${sample.quadratureAgreementMm} mm; tolerance ${sample.numericalToleranceMm} mm (not a certified integration error bound).`),
  ]);
}
