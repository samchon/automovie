import type { IAutoMovieHumanMeasurements } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanIdentity } from "../../../structures/IAutoMovieHumanIdentity";
import { HandCurveDecode as D } from "../family/HandCurveDecode";
import { HandCurveMath as M } from "../family/HandCurveMath";
import type { IHandCurveMeasurements as P } from "../family/IHandCurveMeasurements";
import { HandIdentityRules as R } from "./HandIdentityRules";

/** Derive both semantic hand recipes from public millimetre measurements and their matching generated neutral-rest skeleton.
 *
 * Actual joint chains supply lengths and directions; shared ratios infer unmeasured section widths, depths and web positions. The bridge requires Human's straight model-axis Hand frame and checks hand landmarks against the identity within 1e-7 mm. It does not admit an arbitrary articulated skeleton or independently measured skin surface.
 */
export function deriveHandCurveMeasurements(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
  options: deriveHandCurveMeasurements.Options = {},
): P.Bilateral {
  const joints: Map<string, IAutoMovieHumanSkeleton.IJoint> = new Map(
    skeleton.joints.map(
      (
        j: IAutoMovieHumanSkeleton.IJoint,
      ): [string, IAutoMovieHumanSkeleton.IJoint] => [j.bone, j],
    ),
  );
  if (joints.size !== 55 || skeleton.joints.length !== 55)
    throw new Error(
      "The actual unique 55-bone Human rest skeleton is required",
    );
  const get: (name: string) => IAutoMovieHumanSkeleton.IJoint = (
    name: string,
  ): IAutoMovieHumanSkeleton.IJoint => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined = joints.get(name);
    if (found === undefined) throw new Error("Missing actual bone " + name);
    return found;
  };
  const vec: (v: { x: number; y: number; z: number }) => M.V = (v: {
    x: number;
    y: number;
    z: number;
  }): M.V => [v.x, v.y, v.z];
  const result: P.Bilateral = {} as P.Bilateral;
  for (const side of ["left", "right"] as const) {
    const arm: IAutoMovieHumanIdentity.IArm =
      measurements.identity.body[side === "left" ? "leftArm" : "rightArm"];
    const width: number = arm.handBreadth,
      palm: number = arm.palmLength,
      length: number = arm.handLength;
    if (
      ![
        width,
        palm,
        length,
        arm.wristCircumference,
        arm.thumbLength,
        arm.dorsalHandFat,
      ].every(Number.isFinite) ||
      !(
        width > 0 &&
        width < length &&
        palm > 0 &&
        palm < length &&
        arm.thumbLength > 0 &&
        arm.dorsalHandFat >= 0
      )
    )
      throw new Error(
        "Living positive hand dimensions and a shorter palm are required",
      );
    // Infer a gross ellipse depth, then apply the public dorsal-fat difference;
    // this is a construction inference, not a measured local tissue thickness.
    const baseDepth: number = R.depthFromGirth(
      width,
      width * R.palmGirthPerBreadth,
    );
    const depth: number =
      options.palmThicknessMm?.[side] ??
      baseDepth + arm.dorsalHandFat - R.referenceDorsalFatMm;
    if (!(depth > 0 && depth < width && Number.isFinite(depth)))
      throw new Error("Palm thickness must be positive and less than breadth");
    const depthScale: number = depth / baseDepth;
    const origin: M.V = vec(get(side + "Hand").position),
      sign: number = side === "left" ? 1 : -1;
    // Semantic dimensions use distal/radial/palmar components; the registration
    // rotates these to a minus-Y-distal gauge where the frozen plane rule is
    // nonsingular and its positive-Z angular phase stays anatomically radial.
    const local: (v: M.V) => M.V = (v: M.V): M.V => {
      const d: M.V = M.sub(v, origin);
      return [sign * d[0], d[2], -d[1]];
    };
    const actual: Record<P.Digit, M.V[]> = {} as Record<P.Digit, M.V[]>;
    const stems: Record<P.Digit, readonly string[]> = {
      thumb: ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"],
      index: ["IndexProximal", "IndexIntermediate", "IndexDistal"],
      middle: ["MiddleProximal", "MiddleIntermediate", "MiddleDistal"],
      ring: ["RingProximal", "RingIntermediate", "RingDistal"],
      pinky: ["LittleProximal", "LittleIntermediate", "LittleDistal"],
    };
    for (const digit of D.digits) {
      const chain: IAutoMovieHumanSkeleton.IJoint[] = stems[digit].map(
        (stem: string): IAutoMovieHumanSkeleton.IJoint => get(side + stem),
      );
      for (let i: number = 0; i < chain.length; i++) {
        if (chain[i]!.parent !== (i === 0 ? side + "Hand" : chain[i - 1]!.bone))
          throw new Error("The actual digit parent chain is inconsistent");
        if (
          i < 2 &&
          M.norm(M.sub(vec(chain[i]!.tail), vec(chain[i + 1]!.position))) > 1e-7
        )
          throw new Error("A digit tail does not meet its actual child");
      }
      actual[digit] = [
        ...chain.map(
          (j: IAutoMovieHumanSkeleton.IJoint): M.V => local(vec(j.position)),
        ),
        local(vec(chain[2]!.tail)),
      ];
      if (
        actual[digit].flat().some((x: number): boolean => !Number.isFinite(x))
      )
        throw new Error("Actual digit coordinates must be finite");
    }
    const mid: M.V[] = actual.middle,
      knuckle: number = mid[0]![0];
    if (
      !(knuckle > 0) ||
      Math.abs(mid[0]![1]) > 1e-7 ||
      Math.abs(mid[0]![2]) > 1e-7
    )
      throw new Error(
        "This bridge requires Human's declared straight model-axis neutral Hand frame",
      );
    // These are landmarks emitted by this actual Human skeleton, never native
    // reference landmarks. Refuse a stale skeleton from a different identity.
    const marks: IAutoMovieHumanSkeleton["landmarks"]["left"] =
      skeleton.landmarks[side];
    if (
      Math.abs(
        M.norm(M.sub(mid[3]!, local(vec(marks.stylion.position)))) - length,
      ) > 1e-7 ||
      Math.abs(
        M.norm(M.sub(mid[3]!, local(vec(marks.middleFingerCrease.position)))) -
          (length - palm),
      ) > 1e-7 ||
      Math.abs(
        M.norm(M.sub(actual.thumb[3]!, actual.thumb[1]!)) - arm.thumbLength,
      ) > 1e-7 ||
      Math.abs(
        M.norm(
          M.sub(
            vec(marks.metacarpaleII.position),
            vec(marks.metacarpaleV.position),
          ),
        ) - width,
      ) > 1e-7
    )
      throw new Error(
        "Actual skeleton hand lengths/breadth do not match the resolved public identity",
      );
    const creaseOrigin: number = mid[3]![0] - length;
    const middleReach: number = M.norm(M.sub(mid[3]!, mid[0]!));
    const creaseFraction: number =
      (middleReach - (length - palm)) / M.norm(M.sub(mid[1]!, mid[0]!));
    if (!(creaseFraction > 0 && creaseFraction < R.freeProximalFraction))
      throw new Error("The shared palmar crease must precede the free shaft");
    const wristWidth: number = width * R.wristBreadthPerHandBreadth;
    const wristDepth: number = R.depthFromGirth(
      wristWidth,
      arm.wristCircumference,
    );
    // The gauge-plane u axis is dorsal here, so full anatomical depth occupies
    // its first cardinal pair and full anatomical breadth occupies the second.
    const section: (along: number, w: number, t: number) => P.Section = (
      along: number,
      w: number,
      t: number,
    ): P.Section => ({
      origin: { longitudinalMm: along, breadthMm: 0, thicknessMm: 0 },
      normalAngles: { azimuthRad: 0, elevationRad: 0 },
      cardinalDimensions: {
        breadthPositiveBreadthMm: t / 2,
        breadthPositiveDepthMm: 0,
        depthPositiveBreadthMm: 0,
        depthPositiveDepthMm: w / 2,
        breadthNegativeBreadthMm: -t / 2,
        breadthNegativeDepthMm: 0,
        depthNegativeBreadthMm: 0,
        depthNegativeDepthMm: -w / 2,
      },
      majorRadiusMm: Math.max(w, t) / 2,
      minorRadiusMm: Math.min(w, t) / 2,
    });
    const proximalAlong: number =
      creaseOrigin + R.proximalPalmFraction * (knuckle - creaseOrigin);
    const p: P.Detailed = {
      version: 1,
      region: "hands",
      gate: "public-identity-derived-r1",
      registration: {
        wristWorldXmm: 0,
        wristWorldYmm: 0,
        wristWorldZmm: 0,
        rotationXrad: Math.PI / 2,
        rotationYrad: 0,
        rotationZrad: -Math.PI / 2,
      },
      palmLengthMm: palm,
      traits: {
        handBreadthScale: 1,
        handDepthScale: 1,
        digitLengthScale: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1 },
        webHeightOffsetMm: {
          "thumb-index": 0,
          "index-middle": 0,
          "middle-ring": 0,
          "ring-pinky": 0,
        },
      },
      wristSection: section(creaseOrigin, wristWidth, wristDepth),
      proximalPalmSection: section(
        proximalAlong,
        wristWidth + (width - wristWidth) * R.proximalPalmFraction,
        wristDepth + (depth - wristDepth) * R.proximalPalmFraction,
      ),
      palmSteering: {},
      digits: {} as Record<P.Digit, P.Finger>,
      webs: {} as P.Detailed["webs"],
    };
    // Sinusoidal widening is a shared shape convention between wrist and palm.
    for (const fraction of R.palmStations) {
      const widening: number = Math.sin((fraction * Math.PI) / 2);
      const w: number = wristWidth + (width - wristWidth) * widening;
      const t: number = wristDepth + (depth - wristDepth) * widening;
      p.palmSteering[fraction.toFixed(2)] = {
        fraction,
        measures: {
          dorsalBreadthMm: t * R.dorsalShare,
          dorsalDepthMm: 0,
          thenarBreadthMm: -t * (1 - R.dorsalShare),
          thenarDepthMm: 0,
          radialThumbBreadthMm: 0,
          radialThumbDepthMm: w / 2,
          ulnarBreadthMm: 0,
          ulnarDepthMm: -w / 2,
        },
      };
    }
    for (const digit of D.digits) {
      const points: M.V[] = actual[digit];
      const vectors: M.V[] = [0, 1, 2].map(
        (i: number): M.V => M.sub(points[i + 1]!, points[i]!),
      );
      const angles: (v: M.V) => P.Angles = (v: M.V): P.Angles => {
        const u: M.V = M.unit(v);
        if (M.norm(v) <= 0)
          throw new Error("A digit segment must have positive length");
        return {
          azimuthRad: Math.atan2(u[1], u[0]),
          elevationRad: Math.asin(Math.max(-1, Math.min(1, u[2]))),
        };
      };
      const pipW: number = width * R.pipBreadth[digit],
        dipW: number = width * R.dipBreadth[digit];
      const pipD: number =
        pipW *
        (digit === "thumb" ? R.jointDepthRatio.thumb : R.jointDepthRatio.pip) *
        depthScale;
      const dipD: number =
        dipW *
        (digit === "thumb" ? R.jointDepthRatio.thumb : R.jointDepthRatio.dip) *
        depthScale;
      const tube: (
        name: string,
        segment: 0 | 1 | 2,
        fraction: number,
        w: number,
        t: number,
      ) => P.TubeSection = (
        name: string,
        segment: 0 | 1 | 2,
        fraction: number,
        w: number,
        t: number,
      ): P.TubeSection => ({
        name,
        segment,
        fraction,
        ellipseMajorRadiusMm: Math.max(w, t) / 2,
        ellipseMinorRadiusMm: Math.min(w, t) / 2,
        ellipseRollRad: w >= t ? Math.PI / 2 : 0,
        centerAcrossMm: (R.fingerDorsalShare - 0.5) * t,
        centerDepthMm: 0,
        centerAxialMm: 0,
      });
      const tubes: P.TubeSection[] =
        digit === "thumb"
          ? [
              tube(
                "proximalFree",
                1,
                R.freeProximalFraction,
                width * R.shaftBreadth.thumb,
                width * R.shaftDepth.thumb * depthScale,
              ),
              tube("proximalNearJoint", 1, R.thumbNearIpFraction, pipW, pipD),
            ]
          : [
              tube(
                "proximalFree",
                0,
                R.freeProximalFraction,
                width * R.shaftBreadth[digit],
                width * R.shaftDepth[digit] * depthScale,
              ),
              tube("PIP", 1, 0, pipW, pipD),
            ];
      tubes.push(
        tube(
          digit === "thumb" ? "IP" : "middleShaft",
          digit === "thumb" ? 2 : 1,
          digit === "thumb" ? 0 : R.middleShaftFraction,
          (pipW + dipW) / 2,
          (pipD + dipD) / 2,
        ),
        tube(
          digit === "thumb" ? "distalShaft" : "DIP",
          2,
          digit === "thumb" ? R.thumbDistalShaftFraction : 0,
          dipW,
          dipD,
        ),
        tube("pulp", 2, R.pulpFraction, dipW * R.pulpWidthShare, dipD),
        tube(
          "nearTip",
          2,
          R.nearTipFraction,
          dipW * R.nearTipWidthShare,
          dipD * R.nearTipWidthShare,
        ),
      );
      // MCP depth is an unmeasured skin proxy: reuse the larger adjacent shaft
      // or PIP depth, rather than extending the full palm pad onto every digit.
      // This shared construction inference does not change the measured palm.
      const t: number =
        digit === "thumb"
          ? pipD
          : Math.max(width * R.shaftDepth[digit] * depthScale, pipD);
      p.digits[digit] = {
        rootLongitudinalRatio: points[0]![0] / palm,
        rootBreadthRatio: points[0]![1] / palm,
        rootDepthRatio: points[0]![2] / palm,
        segments: vectors
          .slice(0, 2)
          .map((v: M.V): P.Angles & { lengthMm: number } => ({
            ...angles(v),
            lengthMm: M.norm(v),
          })),
        tubeSections: tubes,
        skinTip: {
          distalAxisAngles: angles(vectors[2]!),
          reachMm: M.norm(vectors[2]!),
          offsetAcrossMm: 0,
          offsetDepthMm: 0,
        },
        rootThickness: {
          segment: digit === "thumb" ? 1 : 0,
          fraction: 0,
          dorsalReachMm: t * R.dorsalShare,
          volarReachMm: t * (1 - R.dorsalShare),
        },
      };
    }
    for (let i: number = 0; i < 4; i++) {
      const a: P.Digit = D.digits[i]!,
        b: P.Digit = D.digits[i + 1]!;
      const pa: M.V[] = actual[a],
        pb: M.V[] = actual[b],
        ai: number = a === "thumb" ? 1 : 0;
      const midpoint: M.V = M.mul(M.add(pa[ai]!, pb[0]!), 0.5);
      const scale: number =
        (M.norm(M.sub(pa[ai + 1]!, pa[ai]!)) + M.norm(M.sub(pb[1]!, pb[0]!))) /
        2;
      const creaseA: M.V = M.add(
        pa[ai]!,
        M.mul(M.sub(pa[ai + 1]!, pa[ai]!), creaseFraction),
      );
      const creaseB: M.V = M.add(
        pb[0]!,
        M.mul(M.sub(pb[1]!, pb[0]!), creaseFraction),
      );
      const web: M.V = M.mul(M.add(creaseA, creaseB), 0.5);
      web[0] =
        i === 0
          ? creaseOrigin + R.thumbWebPerHandLength * length
          : web[0] + R.nonThumbWebOffsets[i - 1]! * length;
      web[2] = midpoint[2] + R.webPalmarShare * (1 - R.dorsalShare) * depth;
      const delta: M.V = M.mul(M.sub(web, midpoint), 1 / scale);
      p.webs[`${a}-${b}` as P.Web] = {
        longitudinalRatio: delta[0],
        breadthRatio: delta[1],
        thicknessRatio: delta[2],
      };
    }
    result[side] = p;
  }
  return result;
}
/** Optional physical measurements supplementing the resolved identity before detailed construction. */
export namespace deriveHandCurveMeasurements {
  /** Additional measurements accepted by this converter, independently per side.
   *
   * @author Samchon
   */
  export interface Options {
    /** Optional unloaded dorsal-to-palmar caliper thickness at the metacarpal heads, hand flat, in millimetres; require 0 < thickness < hand breadth. Omission uses the shared girth/ellipse inference adjusted by public dorsal fat. This is a converter input, not a curve-handle or source-landmark override. */
    palmThicknessMm?: Partial<Record<P.Side, number>>;
  }
}
