import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSurface } from "../internal/HumanSurface";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";
import type { HumanHeadFrame } from "./HumanHeadFrame";
import type { HumanMouthFeatures } from "./HumanMouthFeatures";

/** Common nasal semantic curves retain a shared authority for skin and construction. */
export namespace HumanNoseFeatures {
  /** A side pair names geometric reflection; anatomical labels remain unqualified. */
  export interface Pair<T> {
    /** Independent left geometric feature authority. */
    left: T;
    /** Independent right geometric feature authority. */
    right: T;
  }

  /** Curves alone do not establish surrounding skin or internal cavity orientation. */
  export interface Result {
    /** Closed nonplanar degree-nine rims, posterior corner toward the medial rim. */
    nostrils: Pair<HumanSurface.Boundary>;
    /** Open upper-to-lower degree-three cheek creases, without invented rim contacts. */
    nasolabial: Pair<HumanSurface.Boundary>;
    /** Exact parameter means of the generated rims, in world mm. */
    rimCentroidsMm: Pair<HumanCurve.Vector>;
    /** Source approximation, measurement definitions and ungenerated domains. */
    limitations: string[];
  }

  /**
   * Generate two source-derived nasal rim and crease authorities in one head frame.
   * Eight complete Recovery rim courses identify the common degree-nine profile.
   * Physical source phase is normalized around each actual posterior corner and
   * reflected toward the medial rim. Its two one-sided corner derivatives remain
   * independent. The original Hermite artifacts and all their widths remain intact.
   * The bilateral span and lowest rim Y follow the requested geometric dimensions;
   * source proxy meanings differ from the clinical meanings of the typed inputs.
   * Nasolabial endpoints consume these exact rim means and the supplied mouth
   * corner authorities. No endpoint contact, transverse jet or skin is invented.
   */
  export function build(
    parameters: IAutoMovieHumanHeadIdentity,
    frame: HumanHeadFrame.Result,
    mouth: HumanMouthFeatures.Result,
  ): Result {
    const width: number = positive(parameters.face.nose.width, "nasal width");
    const height: number = positive(parameters.face.nose.height, "nasal height");
    const projection: number = positive(parameters.face.nose.protrusion, "nasal projection");
    const mouthWidth: number = positive(mouth.widthMm, "generated mouth width");
    if (![frame.innerEyeForwardMm, frame.eyeY, frame.supportMm[2]].every(Number.isFinite))
      throw new Error("Nasal features require the caller's finite common head frame");
    const forward: number = frame.innerEyeForwardMm + 0.6525087657705508 * width + 0.6174784829862807 * projection;
    const up: number = frame.eyeY - height - rimMinimumY * width;
    const nostrils: Partial<Pair<HumanSurface.Boundary>> = {};
    const nasolabial: Partial<Pair<HumanSurface.Boundary>> = {};
    const rimCentroidsMm: Partial<Pair<HumanCurve.Vector>> = {};
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? -1 : 1;
      // The exact common profile's maximum lateral support fixes the bilateral
      // span directly. This is a generated measurement constraint, not rounding.
      const lateral: number = frame.supportMm[2] + sign * width * (0.5 - rimMaximumZ);
      const center: HumanCurve.Vector = [forward, up, lateral];
      const reflection: HumanCurve.Vector = [1, 1, sign];
      const rim: HumanSurface.Boundary = {
        id: "head.nose.nostril." + side, unit: "normalized", start: 0, end: 1,
        evaluate: (u: number): HumanCurve.Vector => {
          admit(u);
          return center.map((value: number, axis: number): number =>
            value + width * reflection[axis]! * closedProfile(rimProfile[axis]!, u)[0]) as HumanCurve.Vector;
        },
        derivative: (u: number): HumanCurve.Vector => {
          admit(u);
          return reflection.map((value: number, axis: number): number =>
            width * value * closedProfile(rimProfile[axis]!, u)[1]) as HumanCurve.Vector;
        },
      };
      const mean: HumanCurve.Vector = center.map((value: number, axis: number): number =>
        value + width * reflection[axis]! * rimMeans[axis]!) as HumanCurve.Vector;
      const upper: HumanCurve.Vector = mean.map((value: number, axis: number): number =>
        value + width * reflection[axis]! * creaseUpperOffset[axis]!) as HumanCurve.Vector;
      const lower: HumanCurve.Vector = mouth.cornersMm[side].map((value: number, axis: number): number =>
        value + mouthWidth * reflection[axis]! * creaseLowerOffset[axis]!) as HumanCurve.Vector;
      const chord: number = Math.hypot(...upper.map((value: number, axis: number): number => lower[axis]! - value));
      if (!(chord > 0 && upper[1] > lower[1] && lower.every(Number.isFinite)))
        throw new Error("Nasal and mouth dimensions cannot order the identified nasolabial course");
      const crease: HumanSurface.Boundary = {
        id: "head.nose.nasolabial." + side, unit: "normalized", start: 0, end: 1,
        evaluate: (u: number): HumanCurve.Vector => {
          admit(u);
          return upper.map((value: number, axis: number): number => value + u * (lower[axis]! - value) +
            chord * reflection[axis]! * residual(creaseProfile[axis]!, u)[0]) as HumanCurve.Vector;
        },
        derivative: (u: number): HumanCurve.Vector => {
          admit(u);
          return upper.map((value: number, axis: number): number => lower[axis]! - value +
            chord * reflection[axis]! * residual(creaseProfile[axis]!, u)[1]) as HumanCurve.Vector;
        },
      };
      nostrils[side] = rim; nasolabial[side] = crease; rimCentroidsMm[side] = mean;
    }
    return { nostrils: nostrils as Pair<HumanSurface.Boundary>, nasolabial: nasolabial as Pair<HumanSurface.Boundary>,
      rimCentroidsMm: rimCentroidsMm as Pair<HumanCurve.Vector>, limitations: [
        "The eight recovered nonplanar rim courses identify a common degree-nine approximation with coordinate RMS 0.908 mm and sampled maximum positional residual 3.284 mm, conditioned on observed means and achieved width proxies",
        "The posterior rim corner has independent one-sided derivatives; the additional medial corner in one source remains unsupported by this common profile",
        "Width is the generated bilateral lateral rim span and height is inner-eye Y minus lowest rim Y; their observed reference proxies are not certified alare or nasion/subnasale clinical measurements",
        "Projection moves the shared forward nasal axis through a pooled source-proxy placement fit; the observed nose-anchor-to-rim-centroid projection is 2.865–10.975 mm and differs from the typed clinical chord",
        "Source-conditioned rim leave-one-reference-out coordinate RMS is 0.305–1.644 mm with maximum sampled positional residual 4.317 mm; shared-frame placement and unobserved morphology remain unverified",
        "The common cubic nasolabial residual has coordinate RMS 0.742 mm and sampled maximum positional residual 2.836 mm conditioned on actual endpoints; endpoint placement remains less accurate and is not a shared contact constraint",
        "All returned boundaries are actual generating function objects for future incident skin and construction consumers; ridge, alar exterior, columella, nasal sheets and transverse derivatives require their separate source observations",
        "Source geometric proxy conditioning does not identify independent clinical parameter derivatives, asymmetry, expressions, tissue thickness or valid extrapolation to unobserved shapes",
      ] };
  }

  // P(u) = a0 + u(1-u) sum(a[k+1](2u-1)^k), preserving degree nine.
  const rimProfile: readonly (readonly number[])[] = [
    [-0.187138971064026,1.4845364543589838,0.44561097447852505,-3.634061342126757,0.9768056081514519,7.5655756505880545,-3.7460966668678592,-5.95602419320744,2.751110791184563],
    [-0.07362500571276782,0.4254716681846421,1.1029010600515687,0.5890128633525155,-2.085894793526377,-2.1122705321374053,2.6229459605382033,1.671520104369188,-1.3354774932045315],
    [0.14082969391481867,-1.0739724325022135,1.9391990948671578,1.1083485636390344,-3.586689455029067,0.7055924047443538,5.55100478667055,-1.1171189598013032,-3.025330291840417],
  ];
  // Analytic polynomial extrema and integral over u in [0,1], from the same
  // common coefficients; these constants are shared derived scalar rules.
  const rimMinimumY: number = -0.07528113342968183;
  const rimMaximumZ: number = 0.18897807168125813;
  const rimMeans: readonly number[] = [-0.00004198786996167936,0.000011440354514433149,-0.00000689137502005166];
  const creaseUpperOffset: readonly number[] = [-0.3908142248506184,0.34189216872291406,0.3250644637566847];
  const creaseLowerOffset: readonly number[] = [-0.04735740943353336,0.005618818281423661,0.21653457908843143];
  const creaseProfile: readonly (readonly number[])[] = [
    [0.003251881361907511,0.026896928364129633],
    [0.04426083169735935,0.0972316070095467],
    [0.13963800303719484,0.26020953266894803],
  ];

  /** Horner evaluation preserves every coefficient and the actual normalized derivative. */
  function residual(coefficients: readonly number[], u: number, offset: number = 0): [number, number] {
    const x: number = 2 * u - 1;
    let value: number = 0, derivative: number = 0;
    for (let index: number = coefficients.length - 1; index >= offset; index--) {
      derivative = derivative * x + value; value = value * x + coefficients[index]!;
    }
    return [u * (1 - u) * value, (1 - 2 * u) * value + 2 * u * (1 - u) * derivative];
  }

  /** A closed position retains distinct left and right corner derivatives. */
  function closedProfile(coefficients: readonly number[], u: number): [number, number] {
    const pair: [number, number] = residual(coefficients, u, 1);
    return [coefficients[0]! + pair[0], pair[1]];
  }

  /** Explicit finite parameter domains prevent accidental polynomial extrapolation. */
  function admit(u: number): void {
    if (!(Number.isFinite(u) && u >= 0 && u <= 1)) throw new Error("Nasal curve parameter must lie in [0,1]");
  }

  /** Physical input admission retains units and rejects collapsed axes. */
  function positive(value: number, name: string): number {
    if (!(Number.isFinite(value) && value > 0)) throw new Error("A positive physical " + name + " is required");
    return value;
  }
}
