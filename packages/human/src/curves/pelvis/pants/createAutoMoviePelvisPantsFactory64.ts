import {
  AutoMovieBernstein64 as B,
  type IAutoMovieCurve64 as C,
  type AutoMovieCurveParentContext as Context,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as H } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as S } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import { createPelvisCurveFactory } from "../family/createPelvisCurveFactory";
import type { IAutoMoviePelvisIdentityBridge64 as Extra } from "../parameters/IAutoMoviePelvisIdentityBridge64";
import { PelvisBranchComplement64 } from "./PelvisBranchComplement64";
import { PelvisBranchCorrespondence64 } from "./PelvisBranchCorrespondence64";
import { PelvisBranchMedian64 } from "./PelvisBranchMedian64";
import { PelvisBranchPrimitive64 as Primitive } from "./PelvisBranchPrimitive64";
import { PelvisCompatibleBranch64 } from "./PelvisCompatibleBranch64";
import { assertActualPantsSeparation64 } from "./assertActualPantsSeparation64";
import { resolveAutoMoviePelvisPants64 } from "./resolveAutoMoviePelvisPants64";

/** A new curve-only public pants owner with one shared waist/thigh pipeline.
 * Upper paired closed rings are not exterior outputs. Exact trim, roof entry
 * and level complements share their generating C/full-J. No skin is emitted.
 * Native V17 and external R6b observations do not approve this new shape epoch.
 * Proximal support measurements use the crown/body-floor/midpoint rule rather
 * than extending the distal girth convention into a merged circular tube.
 * Their actual internal station directions feed the shared moving entry;
 * legacy vertical endpoint jets are not imposed on this public pants path.
 *
 * @author Samchon
 */
export function createAutoMoviePelvisPantsFactory64(props: {
  /** Previously resolved physical Human measurements; identity is not resolved again. */
  measurements: H;

  /** The same admitted 55-bone rest skeleton owning every construction origin. */
  skeleton: S;

  /** Optional seven physical observations; explicitly present values must be finite numbers. */
  additional?: Partial<Extra.Independent>;
}): {
  /** Assembly region identity used for dependency ordering. */
  region: string;

  /** Resolve physical stations and validate scalar/domain admission before construction. */
  resolve(
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMoviePelvisPants64>;

  /** Consume the actual torso waist and publish both thigh operators with the same roof/complement family. */
  construct(
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result & {
    /** Actual consumed upstream twelve-span position and full physical derivative operator. */
    evaluatedWaist: C.Boundary;

    /** Actual merged and paired coefficient family in its owned construction chart. */
    nativeFamily: ReturnType<
      ReturnType<typeof createPelvisCurveFactory>["construct"]
    >["nativeFamily"];

    /** Shared roof position and first/mixed derivative owner. */
    roof: PelvisCompatibleBranch64;

    /** Exterior level-course consumer of the exact shared roof entry. */
    complement: PelvisBranchComplement64;

    /** Named measurements and explicit admission observations used by this construction. */
    resolved: ReturnType<typeof resolveAutoMoviePelvisPants64>;

    /** Scope limits retained separately from identity validity and curve coefficients. */
    qualification: string;
  };
} {
  const input: typeof props = structuredClone(props);
  const resolve: (
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ) => ReturnType<typeof resolveAutoMoviePelvisPants64> = (
    context: Context,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ReturnType<typeof resolveAutoMoviePelvisPants64> =>
    resolveAutoMoviePelvisPants64({ ...input, context, upstream });
  return {
    region: "pelvis",
    resolve,
    /** Build exact curves and full boundary fields after actual parent-placement admission. */
    construct(
      context: Context,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): ReturnType<
      ReturnType<typeof createAutoMoviePelvisPantsFactory64>["construct"]
    > {
      const resolved: ReturnType<typeof resolve> = resolve(context, upstream);
      const generated: ReturnType<
        ReturnType<typeof createPelvisCurveFactory>["construct"]
      > = createPelvisCurveFactory({
        measurements: resolved.measurements,
        epoch: "interior-v17",
        interiorEndpointPolicy: "crown-direction",
        waistId: "waist.midTube",
        thighIds: { left: "left.thigh.midTube", right: "right.thigh.midTube" },
        bones: {
          construction: "hips",
          left: "leftUpperLeg",
          right: "rightUpperLeg",
        },
        nativeBoneOriginsMm: resolved.nativeBoneOriginsMm,
      }).construct(context, upstream);
      const actualPlacedSeparation: ReturnType<
        typeof assertActualPantsSeparation64
      > = assertActualPantsSeparation64(generated.nativeFamily);
      resolved.diagnostics = {
        ...resolved.diagnostics,
        actualPlacedSeparation,
      };
      const median: PelvisBranchMedian64 = new PelvisBranchMedian64(
        generated.nativeFamily,
        resolved.measurements,
      );
      const correspondence: PelvisBranchCorrespondence64 =
        new PelvisBranchCorrespondence64(median);
      const roof: PelvisCompatibleBranch64 = new PelvisCompatibleBranch64(
        correspondence,
      );
      roof.addCornerBasis();
      const complement: PelvisBranchComplement64 = new PelvisBranchComplement64(
        roof,
      );
      const root: V.V = resolved.nativeBoneOriginsMm.construction;
      const world: (p: C.Vector) => V.V = (p: C.Vector): V.V =>
        V.clone(context.point("hips", V.sub(p, root)));
      const transport: (piece: C.Piece) => C.Piece = (
        piece: C.Piece,
      ): C.Piece => {
        if (piece.primitive === "polynomialBezier")
          return { ...piece, controls: piece.controls.map(world) };
        let numerator: B.Poly = piece.homogeneousNumerator.map(V.clone),
          weights: number[] = [...piece.weights];
        if (piece.primitive === "rationalXZPolynomialYBezier") {
          const y: number[] = B.product(weights, piece.polynomialYControls),
            degree: number = Math.max(y.length, numerator.length) - 1;
          numerator = B.elevate(numerator, degree);
          weights = B.elevateScalar(weights, degree);
          const yy: number[] = B.elevateScalar(y, degree);
          numerator.forEach((p: V.V, k: number): void => {
            p[1] = yy[k]!;
          });
        }
        const offset: V.V = V.sub(
          context.point("hips", [0, 0, 0]),
          context.direction("hips", root),
        );
        const commonDegree: number =
          Math.max(numerator.length, weights.length) - 1;
        numerator = B.elevate(numerator, commonDegree);
        weights = B.elevateScalar(weights, commonDegree);
        const transformed: B.Poly = numerator.map(
          (n: V.V, i: number): V.V =>
            V.add(context.direction("hips", n), V.scale(offset, weights[i]!)),
        );
        return {
          primitive: "rationalBezier",
          degree: commonDegree,
          homogeneousNumerator: transformed,
          weights,
          ...(piece.qInterval ? { qInterval: piece.qInterval } : {}),
        };
      };
      const curves: C.Primitive[] = generated.groups
        .flatMap((group: R.Result["groups"][number]): C.Primitive[] => [
          ...group.primitives,
        ])
        .filter(
          (curve: C.Primitive): boolean =>
            !curve.name.includes("section.nearCrotch"),
        );
      const add: (name: string, pieces: C.Piece[], widths: number[]) => void = (
        name: string,
        pieces: C.Piece[],
        widths: number[],
      ): void => {
        const normalized: number[] = [...widths];
        normalized[normalized.length - 1] =
          1 -
          normalized
            .slice(0, -1)
            .reduce((a: number, b: number): number => a + b, 0);
        curves.push({
          type: "bernstein",
          name,
          closed: false,
          unit: "mm",
          phaseUnit: "normalized",
          phaseIntervals: normalized,
          pieces: pieces.map(transport),
        });
      };
      for (const [name, q] of Object.entries(correspondence.semanticRows))
        add(
          "roof.arch." + name,
          Primitive.arch(roof, q, true),
          new Array(6).fill(1 / 6),
        );
      for (const side of ["left", "right"] as const) {
        const widths: number[] = correspondence.intervals[side].map(
          ([a, b]: [number, number]): number => (b - a) / 4,
        );
        if (side === "left")
          add("roof.median", Primitive.fixedGuide(roof, side, 0), widths);
        add("roof.entry." + side, Primitive.fixedGuide(roof, side, 1), widths);
        add(
          "roof.worldQuarter." + side,
          Primitive.worldGuide(roof, side),
          widths,
        );
        complement.sides[side].rails.forEach(
          (rail: B.Poly, i: number): void => {
            add(
              "roof.rail." + side + "." + i,
              [Primitive.polynomial(rail)],
              [1],
            );
          },
        );
        for (const fraction of [0, 0.25, 0.5, 0.75]) {
          const level: ReturnType<PelvisBranchComplement64["level"]> =
            complement.level(side, median.near + fraction * median.height);
          add(
            "roof.exteriorComplement." + side + "." + fraction,
            level.controls.map(Primitive.polynomial),
            new Array(4).fill(0.25),
          );
        }
      }
      return {
        groups: [{ part: "pelvis", side: null, primitives: curves }],
        boundaries: generated.boundaries,
        evaluatedWaist: generated.evaluatedWaist,
        nativeFamily: generated.nativeFamily,
        roof,
        complement,
        resolved,
        qualification:
          "New public crown-owned proximal pants epoch. The midpoint tube and upstream waist retain their physical operators; proximal open-arc supports derive from the independent body envelope and median crown. Shared roof equations own entries/full-J and complements; composed rational world guides retain their true degree. Upper near closed rings are not exterior emissions. Sampled root brackets are not Python Sturm certificates. Complete critical connectivity, global injectivity, public source adequacy, arbitrary parent contexts and completed author viewer verification remain unestablished. Old V17 numerical interior coincidences remain a separate preserved risk, not automatically proved or removed here.",
      };
    },
  };
}
