import type { IAutoMovieHumanLegIdentity } from "../structures/body/IAutoMovieHumanLegIdentity";
import type { HumanCurve } from "../internal/HumanCurve";
import { HumanCurveFamily } from "../internal/HumanCurveFamily";

/** Common open foot-body family identified from source-bound foot charts.
 * This partial candidate ends before observed toe-web radial ambiguity and
 * supplies one coefficient authority to skin and construction.
 */
export namespace HumanFootBody {
  /** Existing independent foot dimensions, expressed in millimetres. Positive
   * breadth and support height require height/breadth in the declared domain.
   * Source comparison uses geometric proxies, not clinical equivalent landmarks. */
  export type Dimensions = Pick<IAutoMovieHumanLegIdentity, "footLength" | "footBreadth" | "ankleHeight">;

  /** Generated body and geometric support branches, with absent domains explicit. */
  export interface Result {
    /** One actual generating curve family; neither end is capped. */
    family: HumanCurveFamily.Family;
    /** Admitted support-height/breadth interval, dimensionless. */
    admittedHeightBreadthRatio: readonly [number, number];
    /** Research lower bound throughout that ratio and complete curve domain,
     * millimetres in real arithmetic; binary64 is not interval-certified. */
    continuousRadiusLowerBoundMm: number;
    /** Locally owned forefoot supports; the caller owns the ankle support. */
    supports: ReadonlyMap<string, HumanCurve.Vector>;
    /** Missing surface and unsupported dimensions remain visible. */
    unsupported: string[];
    /** Conditional fitting and source-domain qualifications. */
    limitations: string[];
  }

  /**
   * Construct the observed foot-body domain from an independently supplied ankle.
   * Source cross-sectional area moments identify the skin centre curve separately
   * from the geometric foot-to-ball support axis. Transverse breadth and support
   * height determine its common centre offsets and radial coefficients; foot
   * length determines the independently generated forward support reach.
   *
   * Five principal stations identify the proximal plane, the first breadth
   * maximum, the following minimum, the distal global maximum and the last
   * common observed radial domain. Eight coefficient equalities impose the
   * distal maximum's width, angular extrema and longitudinal width tangent.
   * Whole-domain width inequalities across the admitted height/breadth interval
   * are fitted with the source observations by an active-set QR solve. This is
   * one common shape law, without a later whole-foot scale correction.
   *
   * The added centre descriptor is an exact restriction of the original centre
   * cubic. The shared natural-cubic kernel retains that same centre function and
   * provides analytic Fss, Fphasephase and mixed jets from the complete Fourier
   * order. Recursive restriction changes no feature or coefficient authority.
   *
   * Calibrating foot-length proxies used the observed body's forward extent,
   * breadth used its maximum observed transverse span, and height used the rig
   * support above the observed plantar extent. These partial geometric proxies
   * are not a clinical full-foot measurement. The constrained source radial fit
   * retains 2.32598 mm RMS and 14.95197 mm maximum error; centre-fit maxima remain
   * 4.18 and 6.74 mm. Source-conditioned leave-one-reference-out radial fits of
   * the defining-equality model retain 2.81 to 5.18 mm RMS and up to 24.47 mm.
   * The added whole-domain inequality model has no separate held-out fidelity
   * qualification. Shared ankle attachment and actual-render fidelity remain
   * unaccepted until the common boundary owner completes the neighbor round.
   */
  export function build(ankleMm: HumanCurve.Vector, side: "l" | "r", dimensions: Dimensions): Result {
    if (ankleMm.length !== 3 || !ankleMm.every(Number.isFinite) || ![dimensions.footLength, dimensions.footBreadth, dimensions.ankleHeight].every((x: number): boolean => x > 0 && Number.isFinite(x)))
      throw new Error("A finite ankle and positive independent foot dimensions are required");
    const ratio: number = dimensions.ankleHeight / dimensions.footBreadth;
    if (!(ratio >= ratioDomain[0] && ratio <= ratioDomain[1]))
      throw new Error("Foot support-height/breadth is outside the admitted common width-law domain");
    const supports: Map<string, HumanCurve.Vector> = new Map();
    for (const name of ["ball", "bigtoe_01", "littletoe_01"] as const) {
      const c: HumanCurve.Vector = supportRules[name];
      supports.set(name + "_" + side, [ankleMm[0] + c[0] * dimensions.footLength, ankleMm[1] + c[1] * dimensions.ankleHeight, ankleMm[2] + c[2] * dimensions.footBreadth * (side === "l" ? 1 : -1)]);
    }
    const delta: HumanCurve.Vector = sub(supports.get("ball_" + side)!, ankleMm);
    const lengthMm: number = Math.hypot(...delta);
    const axis: HumanCurve.Vector = unit(delta);
    const reference: HumanCurve.Vector = unit(cross(sub(supports.get("bigtoe_01_" + side)!, ankleMm), sub(supports.get("littletoe_01_" + side)!, ankleMm)));
    const axisU: HumanCurve.Vector = unit(cross(reference, axis)), axisV: HumanCurve.Vector = unit(cross(axis, axisU));
    const sign: number = side === "l" ? 1 : -1;
    const count: number = 2 * order + 1;
    const principal: HumanCurve.Section[] = knots.map((t: number, station: number): HumanCurve.Section => {
      const u: number = centreRules[0]![station]! * dimensions.footBreadth + centreRules[0]![knots.length + station]! * dimensions.ankleHeight;
      const v: number = sign * (centreRules[1]![station]! * dimensions.footBreadth + centreRules[1]![knots.length + station]! * dimensions.ankleHeight);
      const coefficientsMm: number[] = Array.from({ length: count }, (_: unknown, k: number): number =>
        (radialRules[0]![station]![k]! * dimensions.footBreadth + radialRules[1]![station]![k]! * dimensions.ankleHeight) * (side === "r" && k > 0 && k % 2 === 0 ? -1 : 1));
      positive(coefficientsMm);
      return { id: "foot." + side + ".body." + station, stationMm: t * lengthMm, originMm: [
        ankleMm[0] + t * delta[0] + u * axisU[0] + v * axisV[0],
        ankleMm[1] + t * delta[1] + u * axisU[1] + v * axisV[1],
        ankleMm[2] + t * delta[2] + u * axisU[2] + v * axisV[2],
      ], axisU: [...axisU], axisV: [...axisV], coefficientsMm };
    });
    return { family: HumanCurveFamily.build(principal), supports,
      admittedHeightBreadthRatio: [...ratioDomain],
      continuousRadiusLowerBoundMm: minimumRadiusOverBreadth * dimensions.footBreadth,
      unsupported: [
      "The full posterior heel, shared ankle skin boundary and transverse derivative",
      "The remaining forefoot-to-toe web domain and every toe surface",
      "Independent heel breadth, heel reach, pad, arch, instep and toe supplement responses",
      "Clinical full-foot length, plantar contact and unseen shape prediction",
    ], limitations: [
      "The family ends at the last common observed radial domain; missing toe-web concavity is not filled",
      "Four references identify conditional pooled coefficients, not independently intervened foot-parameter effects",
      "Source radial error remains 2.32598 mm RMS and up to 14.95197 mm; source-centre maxima remain 4.18 and 6.74 mm",
      "The source-conditioned defining-equality model has person-held-out radial RMS 2.81 to 5.18 mm and maximum 24.47 mm; the whole-domain inequality model has no separate held-out qualification",
      "Source calibration used partial geometric measurement proxies rather than clinical full-foot landmarks",
      "Calibration proxy ranges were foot extent 176.16 to 218.92 mm, breadth 85.27 to 109.88 mm and support height 74.58 to 95.09 mm; other absolute sizes are empirical extrapolation",
      "The admitted support-height/breadth interval is 0.7437613374036736 to 0.9671564692141552; positive dimensions outside it are explicitly unsupported",
      "The distal maximum enforces breadth within binary64 coefficient residual; the complete-domain width search is numerical, not an interval certificate or a clinical full-foot measurement",
      "Continuous radial positivity has a real-arithmetic lower bound of 0.06885794228225672 times breadth throughout the admitted ratio interval",
      "Generated normals and skin must derive from this same family; no original mesh or normal field is available",
    ] };
  }

  /** Proximal plane, first breadth maximum, waist minimum, distal global breadth
   * maximum and pre-web end. The distal feature repairs an omitted shape event;
   * recursive tessellation neither adds nor moves these principal stations. */
  const knots: number[] = [0,0.12419648785485467,0.33089108098401504,0.862,0.9317675140376587];
  /** Positive dimensions are admitted only in this geometric ratio interval;
   * it covers the eight source dimensions and independent +/-5% breadth/height
   * combinations under both exploratory polygon proxies and exact cubic-extrema
   * comparison inputs. It does not assert observed independent source responses. */
  const ratioDomain: [number, number] = [0.7437613374036736,0.9671564692141552];
  /** Longitudinal cubic extrema and an angular derivative-gap bound identify
   * this continuous lower bound at both ratio ends. Linearity extends it across
   * the interval, in real arithmetic without directed binary64 rounding. */
  const minimumRadiusOverBreadth: number = 0.06885794228225672;
  /** Radial order six improved both RMS and worst error over order four.
   * Order eight reduced RMS but worsened the maximum, so it was rejected. */
  const order: number = 6;
  /** Physical basis (breadth, support height), then five principal stations,
   * then c0,cos1,sin1 through cos6,sin6. Constrained QR fits all 130 common
   * coefficients to 7680 source observations. Eight equalities and an active-set
   * solve of complete-domain width inequalities retain the original harmonic
   * order. There is no source curve, per-person row or final scale correction. */
  const radialRules: number[][][] = [
    [
      [0.2575788274380778,-0.014724304197743227,-0.13130410257148797,-0.6037006676086093,-0.1181694092613902,0.0592562001052006,-0.22475488365972723,0.31509648769977805,-0.14572802438776655,-0.16440911603273323,0.0124600762024019,-0.24459619194765128,0.052280790355703],
      [0.3914842253264496,0.0769312586071874,-0.07948598524546138,-0.09316770453708743,0.03798443053722201,0.22696941460579745,-0.0721439609541928,0.15659336638026697,-0.0479544588917677,-0.08527658483816843,0.05706036522288025,-0.11278963889630228,-0.05589014964612335],
      [0.28014641089428916,0.023003553940888703,-0.0010469125024783433,0.0216697339159247,0.21677243019626596,0.10597688874272328,-0.016998528224209483,0.08019760236657444,0.00548612577690622,0.03879340669521278,0.030424958161712007,-0.01683034105576006,-0.009513627564077058],
      [-0.08385458994902323,-0.06850238186965206,0.047011596450885436,0.30726362976566934,0.15344199133662612,0.04695654098100694,-0.016364928670406766,0.201704329180901,0.0463021248565786,0.07093393664241766,0.0004166379120669724,0.07488663100245288,-0.0820154136832611],
      [-0.10283087715464033,-0.08078529979402155,0.064100082709064,0.2381113582656221,0.1770360393255244,-0.01911064465737096,-0.01703785949542192,0.2535494253684872,0.037722699091999,0.034565995617656824,-0.0017371013012948584,0.10124675018789464,-0.0966103699469877],
    ],
    [
      [0.29179066089183975,0.008782156040179328,0.16602470120427693,0.4506613748201674,-0.01849548982282792,-0.09188987609923441,0.28596301902347676,-0.3024713733095566,0.26952494590769815,0.19980124118005008,0.006108248208444372,0.28131300956578364,-0.08731265338521617],
      [0.11482963012156051,-0.09534830722547152,0.08893905126341853,-0.05678432098245773,-0.17850134288613476,-0.26402385753222846,0.07524212667645135,-0.17837469404791717,0.08723686057721024,0.07122302258484965,-0.05237296630134335,0.12682351124223049,0.0745318785192886],
      [0.170424922397485,-0.03249496527876658,-0.0021636085668325722,-0.05052771414821215,-0.32815303159569703,-0.10357709201558941,-0.013228193508295058,-0.10766764874256006,-0.01632245265153765,-0.061743313833284415,-0.04229841454411266,0.012381399531563276,0.01294264507860131],
      [0.47529564225572757,0.06371418027073038,-0.04888145518922404,-0.19813383736568868,-0.17594852836369476,-0.022593767754528406,0.015272085641205637,-0.1987666000889809,-0.053646694400510654,-0.05717431252372501,0.000613039653121426,-0.07839520480105805,0.09441397238823868],
      [0.4739725837977328,0.07629504055073827,-0.06857746360697689,-0.09914931674175001,-0.18762301097869458,0.05168029212799284,0.01975978519387723,-0.25340180772226384,-0.03911748636783324,-0.007570221644919252,0.010634838862863434,-0.11257424506195415,0.11003661045811663],
    ],
  ];
  /** The two source area-centre channels, each a breadth block followed by
   * support-height coefficients at five stations. Values at the added distal
   * feature are exact restrictions of the original four-knot natural cubic,
   * so the same natural endpoint solve preserves that entire centre function. */
  const centreRules: number[][] = [[-0.32620458064257896,-0.3487085743905825,-0.09212214709696978,-0.24962412426551983,-0.33329112664119204,0.41709196092034967,0.44500654342178425,0.172799523972537,0.3673460736840035,0.46167852099882434],[0.2880418658037863,0.4992008352269714,0.23965038331308755,-0.08680231750554303,-0.079987590080686,-0.44170400991194547,-0.8358720701117969,-0.5666682760915842,0.09895037028820365,0.1404087508860407]];
  /** Through-origin pooled source-support fits use forward body extent,
   * support height and transverse breadth for the corresponding components. */
  const supportRules: Record<"ball" | "bigtoe_01" | "littletoe_01", HumanCurve.Vector> = {"ball":[0.7037501767587339,-0.8750602852266345,-0.24342758060070638],"bigtoe_01":[0.7740114343707004,-0.7169935832288126,0.02322659156205614],"littletoe_01":[0.6123020350846697,-0.79420222255837,-0.6943534785808698]};

  /** Angular derivative bounds extend samples to a positive radius lower
   * bound in real arithmetic; unsupported dimensional ratios refuse. */
  function positive(c: number[]): void {
    let minimum: number = Infinity, bound: number = 0;
    for (let k: number = 1; 2 * k < c.length; k++) bound += k * (Math.abs(c[2 * k - 1]!) + Math.abs(c[2 * k]!));
    for (let i: number = 0; i < 512; i++) { const phase: number = 2 * Math.PI * i / 512; let r: number = c[0]!; for (let k: number = 1; 2 * k < c.length; k++) r += c[2 * k - 1]! * Math.cos(k * phase) + c[2 * k]! * Math.sin(k * phase); minimum = Math.min(minimum, r); }
    if (!(minimum - bound * Math.PI / 512 > 0)) throw new Error("The foot dimensional ratio has no admitted positive radial bound");
  }
  /** A physical chord in the shared registered chart. */
  function sub(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** The actual generated support triangle owns orientation. */
  function cross(a: HumanCurve.Vector, b: HumanCurve.Vector): HumanCurve.Vector { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  /** Refuse degenerate and nonfinite support geometry without fallback. */
  function unit(a: HumanCurve.Vector): HumanCurve.Vector { const n: number = Math.hypot(...a); if (!(n > 0 && Number.isFinite(n))) throw new Error("A finite nonzero foot direction is required"); return [a[0] / n, a[1] / n, a[2] / n]; }
}
