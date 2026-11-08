import {
  AutoMovieLoftFrame,
  AutoMovieViewCurves,
  AutoMovieViewOutline,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadVault } from "../AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadMassProfile } from "./AutoMovieHumanHeadMassProfile";
import { AutoMovieHumanHeadMassSource } from "./AutoMovieHumanHeadMassSource";

/**
 * The head mass and its neck (cranium, face and neck without the nose,
 * lips and ears) as a part drawn from its three views, the input of the
 * view-to-section operator (`AutoMovieViewLoft`).
 *
 * - Side view: the actual upper front source and lower conic-template band
 *   share their endpoint value and parameter jets through one root-clock
 *   bridge. A clinical cohort's C is not a skin point or flat skin jet.
 *   B, the median back profile
 *   (`AutoMovieHumanHeadBackProfile`), down the nape to the neck ring.
 * - Front view: L, the head's front-view silhouette, one outline through
 *   the vertex, the eurion's level (half the head breadth), the tragion's
 *   (half the cranial base width t-t), the gonion's (half go-go) and the
 *   neck's original radius source, whose normal plane and named base course
 *   have distinct measurement definitions.
 * - Axis: parallel level planes whose source origin drifts from the neck
 *   centre to the skull's centre. An axis leaning to the neck tilted
 *   the sections under the tragion, so the lowest ran from behind the ear to
 *   under the chin and their outlines flared out past the jaw.
 * - Fullness: the vault's quarters take the conic shoulder of the
 *   retained horizontal super-ellipse proxy
 *   (`AutoMovieHumanHeadVault.closing`, `r = 2^(1 - 1/n) - 1`, the share of
 *   the diagonal point of `|x/a|^n + |z/b|^n = 1`); the face's front quarters
 *   depart to the face plan's exponent under the nasion and return to the
 *   vault's over the forehead.
 *
 * The vertex is a pole. The actual lower domain starts at the supplied
 * regular neck boundary. Original support controls below it preserve the
 * same scalar functions without exposing an overlap. Public head-tape closure on the actual oblique source course
 * remains distinct from the horizontal proxy and the final joined skin.
 *
 * @evidence contracts/common.md#principled-implementation Authors the four signed original scalar fields and level-plane axis; the lower actual neck source and upper head share a root-clock bridge with their available endpoint jets.
 * @evidence contracts/common.md#clear-and-simple-design One mass part feeds source readers, raw lofting and the invocation-bound production leaf.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical C is diagnostic, not a skin clamp; no mesh, reference fit, private loft or fabricated pole derivative supplies the original fields.
 * @evidence contracts/common.md#meaningful-documentation Separates anatomical inputs, explicit fairing, horizontal proxy, actual tape debt, intended overlap and downstream assembly.
 * @evidence contracts/performance.md#efficient-algorithms Source preparation is linear in retained stations; bounded native-section inversions solve the named calipers and attachments.
 * @evidence contracts/performance.md#reuse-equivalent-work One original front source supplies emitted knots and section constraints; neck scalar and axis preparations are borrowed unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned knot arrays and source-axis closures; no geometry or person cache is global.
 */
export namespace AutoMovieHumanHeadMassPart {
  /**
   * Control points per rendered section, a multiple of four.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the engine loft's representation order without changing original scalar inputs.
   * @evidence contracts/common.md#clear-and-simple-design One numeric policy is passed as part.order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This is not a fitted anatomical dimension or an admission tolerance.
   * @evidence contracts/common.md#meaningful-documentation States the section representation role and multiple-of-four requirement.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A constant executes no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One module scalar owns no resources.
   */
  export const ORDER: number = 64;

  /**
   * Ring samples of the emitted chain, distinct from original source knots.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the existing engine's rendering sample policy.
   * @evidence contracts/common.md#clear-and-simple-design Passed once as part.samples.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Samples neither redefine the source nor establish anatomical acceptance.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes rendered rings from authored scalar data.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A constant executes no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One module scalar owns no resources.
   */
  export const SAMPLES: number = 256;

  /**
   * Largest retained source-station interval, calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Subdivides anatomical spans before the engine loft; named source sites remain included.
   * @evidence contracts/common.md#clear-and-simple-design One physical spacing supplies mass stations and the neck source builder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is not a continuity tolerance, source measurement or per-person fit.
   * @evidence contracts/common.md#meaningful-documentation States physical units and retained-station ownership.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A constant executes no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One module scalar owns no resources.
   */
  export const SPACING: number = 2;

  /**
   * The head mass as a view part.
   *
   * @param plan The landmark skeleton, the vault exponent solved.
   * @param faceExponent The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`); absent, the head prior's row.
   * @param bottom The neck base's station, inside the trunk; absent, the neck ring's height.
   * @returns The part, chain name `head.mass`.
   *
   * @evidence contracts/common.md#principled-implementation Prepares actual level-plane coordinate sources, signed outlines and per-quarter native fullness; named lateral constraints read the same original front field emitted to production.
   * @evidence contracts/common.md#clear-and-simple-design Returns one original view part and delegates every loft, join and skin to the engine.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses nonpositive supports and failed scalar admission; it neither pins clinical C nor moves the head onto a realized trunk.
   * @evidence contracts/common.md#meaningful-documentation States source units, proxy fullness, axis drift, open overlap and the separate actual tape obligation.
   * @evidence contracts/performance.md#efficient-algorithms Sorted anatomical sites and spacing produce N stations; preparation and knot emission use O(N) storage with fixed-size named section solves.
   * @evidence contracts/performance.md#reuse-equivalent-work Neck radius and axis are prepared once; one front preparation supplies all source values and named width constraints.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only the caller-owned part, its knot arrays and coordinate-source closures; temporary readers have no global lifetime.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    faceExponent?: number,
    bottom?: number,
  ): IAutoMovieViewPart {
    return AutoMovieHumanHeadMassSource.of(
      plan,
      { spacing: SPACING, order: ORDER, samples: SAMPLES },
      faceExponent,
      bottom,
    );
  }

  /**
   * The conic shoulder of a quarter super-ellipse of exponent `n`: its
   * diagonal point `2^(-1/n) (a, b)` written as `(1 + r)(a, b) / 2`.
   *
   * @param n The exponent, 2 for the ellipse.
   *
   * @evidence contracts/common.md#principled-implementation Transfers a Lame diagonal to the existing conic shoulder convention.
   * @evidence contracts/common.md#clear-and-simple-design One scalar conversion is shared by the mass's vault and face quarters.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared shoulder bounds are representation policy, not actual tape closure or measured curvature.
   * @evidence contracts/common.md#meaningful-documentation Gives the transfer equation and ellipse reference.
   * @evidence contracts/performance.md#efficient-algorithms Constant scalar arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar.
   */
  export function shoulder(n: number): number {
    return AutoMovieHumanHeadMassProfile.shoulder(n);
  }

  /**
   * Clinical C from Legan and Burstone 1980 pp745-746, Fig1 and Table1.
   * Their constructed Gn' is Sn-Pg' intersected by the line from Me'
   * making Sn-Gn'-C=100 degrees. C then stands Sn-Gn'/1.2 along that
   * posterior line. The posterior branch and population means are explicit
   * construction assumptions; neither contour Gn nor an individual neck
   * tangent/curvature is supplied by the public inputs. This is a sagittal
   * two-dimensional segment ratio, not a vertical-height projection.
   *
   * @param plan The landmark skeleton.
   * @returns `[x, y]`, mm.
   *
   * @evidence contracts/common.md#principled-implementation Intersects the adopted clinical sagittal construction and applies its cohort segment ratio.
   * @evidence contracts/common.md#clear-and-simple-design A diagnostic datum is separate from production front-source authoring.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not impose that datum, a flat jet or cohort mean as an individual skin target; a singular intersection throws.
   * @evidence contracts/common.md#meaningful-documentation Names the primary clinical construction, population assumption and two-dimensional metric.
   * @evidence contracts/performance.md#efficient-algorithms Constant trigonometry and a two-line intersection.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No prepared source is constructed.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one fresh two-number diagnostic.
   */
  export function cervical(plan: IAutoMovieHumanHeadLayout): [number, number] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const dx: number = m.subnasale[0] - m.pogonion[0];
    const dy: number = m.subnasale[1] - m.pogonion[1];
    const up: number = Math.atan2(dy, dx);
    const throat: number =
      up + (AutoMovieHumanHeadPrior.PRIOR.mandible.throatAngle * Math.PI) / 180;
    const ux: number = Math.cos(throat);
    const uy: number = Math.sin(throat);
    const determinant: number = dx * uy - dy * ux;
    if (determinant === 0 || !Number.isFinite(determinant))
      throw new Error(
        "Head clinical Gn' has no finite Sn-Pg'/C-Me' intersection",
      );
    const t: number =
      ((m.menton[0] - m.pogonion[0]) * uy -
        (m.menton[1] - m.pogonion[1]) * ux) /
      determinant;
    const gn: [number, number] = [
      m.pogonion[0] + t * dx,
      m.pogonion[1] + t * dy,
    ];
    const depth: number =
      Math.hypot(m.subnasale[0] - gn[0], m.subnasale[1] - gn[1]) / HEIGHT_DEPTH;
    return [gn[0] + depth * ux, gn[1] + depth * uy];
  }

  /**
   * Sagittal segment ratio Sn-Gn'/C-Gn', not a vertical projection (Legan and Burstone 1980).
   *
   * @evidence contracts/common.md#principled-implementation The adopted cohort ratio supplies cervical()'s diagnostic construction only.
   * @evidence contracts/common.md#clear-and-simple-design One named clinical constant stays separate from source dimensions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It supplies no individual skin point or derivative constraint.
   * @evidence contracts/common.md#meaningful-documentation Names the metric and primary source.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar executes no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A scalar owns no resources.
   */
  export const HEIGHT_DEPTH: number = 1.2;

  /**
   * Forward attachment on the mass's actual original level-section curves,
   * at a world height and lateral place. Both outlines and quarter fullness
   * use their common engine source owner, including the authored origin.
   * This reads no mesh, completed skin or compensating parent-foot move.
   *
   * @param part The actual head mass source used by this composition.
   * @param y Height, mm.
   * @param z Lateral place, mm; its side does not matter.
   * @returns Forward place, mm. Invalid support or an outside lateral place throws.
   *
   * @evidence contracts/common.md#principled-implementation Inverts the actual mass's native forward conic branch at the requested lateral coordinate.
   * @evidence contracts/common.md#clear-and-simple-design Shares the complete original section reader with frontRadiusAt.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No realized skin, reference fit or output projection supplies the point.
   * @evidence contracts/common.md#meaningful-documentation States calibration units and the current symmetric level-section premise.
   * @evidence contracts/performance.md#efficient-algorithms Original scalar preparation and a bounded fifty-step monotone inversion.
   * @evidence contracts/performance.md#reuse-equivalent-work Point and curvature use the same prepared section and phase reading.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar and retains no source globally.
   */
  export function frontAt(
    part: IAutoMovieViewPart,
    y: number,
    z: number,
  ): number {
    return frontReading(part, y, z).forward;
  }

  /**
   * Local transverse radius, not a footprint minimum or a measured tissue radius.
   *
   * @evidence contracts/common.md#principled-implementation Uses the native radial value and phase derivatives in the analytic planar curvature formula.
   * @evidence contracts/common.md#clear-and-simple-design Borrows frontReading's original section and inverse.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses nonpositive curvature instead of returning a host-size proxy.
   * @evidence contracts/common.md#meaningful-documentation Separates local transverse curvature from complete-footprint containment.
   * @evidence contracts/performance.md#efficient-algorithms Original scalar preparation and a bounded fifty-step inversion.
   * @evidence contracts/performance.md#reuse-equivalent-work Point and curvature share one native reading.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar with no global retention.
   */
  export function frontRadiusAt(
    part: IAutoMovieViewPart,
    y: number,
    z: number,
  ): number {
    return frontReading(part, y, z).radius;
  }

  /** One actual front point and its analytic planar curvature share the original section and inverse. */
  function frontReading(
    part: IAutoMovieViewPart,
    y: number,
    z: number,
  ): { forward: number; radius: number } {
    const { section, frame, extents }: ReturnType<typeof sectionAt> = sectionAt(
      part,
      y,
    );
    const centre: number = frame.origin[0];
    const side: number = extents[1];
    const target: number = Math.abs(z - frame.origin[2]);
    if (target > side)
      throw new Error(
        `Head attachment lateral place ${z} is outside its source section at ${y}`,
      );
    const lateral: (phi: number) => number = (phi: number): number =>
      AutoMovieViewSection.radius(section, phi)[0] * Math.sin(phi);
    let lo: number = 0;
    let hi: number = Math.PI / 2;
    for (let k: number = 0; k < 50; k++) {
      const mid: number = (lo + hi) / 2;
      if (lateral(mid) < target) lo = mid;
      else hi = mid;
    }
    const phi: number = target === side ? Math.PI / 2 : (lo + hi) / 2;
    const [r, first, second]: [number, number, number] =
      AutoMovieViewSection.radius(section, phi);
    const turn: number = r * r + 2 * first * first - r * second;
    if (!(turn > 0))
      throw new Error(
        `Head attachment has no positive transverse curvature at ${y}/${z}`,
      );
    return {
      forward: centre + r * Math.cos(phi),
      radius: (r * r + first * first) ** 1.5 / turn,
    };
  }

  /**
   * Scalp point on the identical original level section, at a chosen X/Y.
   * A lateral line is the explicit geometric direction used for the ear's
   * p2 datum; Cho Figure 1 does not specify a world-space normal formula.
   * This evaluates the authored section, never a realized parent mesh.
   *
   * @evidence contracts/common.md#principled-implementation Solves the selected side of the common original conic section at fixed world X and Y.
   * @evidence contracts/common.md#clear-and-simple-design Shares source/fullness preparation with frontAt and returns the named scalp endpoint.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not translate a finished ear onto a skin or substitute a local normal projection for the scalp endpoint.
   * @evidence contracts/common.md#meaningful-documentation States the lateral-line convention and original-section boundary.
   * @evidence contracts/performance.md#efficient-algorithms A bounded fifty-step monotone quarter inversion follows one source preparation.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same source section as other head attachments.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one tuple and retains no part or source globally.
   */
  export function sideAt(
    part: IAutoMovieViewPart,
    y: number,
    x: number,
    sign: 1 | -1,
  ): [number, number, number] {
    const { section, frame, extents }: ReturnType<typeof sectionAt> = sectionAt(
      part,
      y,
    );
    const target: number = x - frame.origin[0];
    if (target > extents[0] || target < -extents[2])
      throw new Error(
        `Ear scalp datum X ${x} is outside its original section at ${y}`,
      );
    let lo: number = target >= 0 ? 0 : Math.PI / 2;
    let hi: number = target >= 0 ? Math.PI / 2 : Math.PI;
    for (let k: number = 0; k < 50; k++) {
      const mid: number = (lo + hi) / 2;
      const phi: number = sign * mid;
      if (AutoMovieViewSection.radius(section, phi)[0] * Math.cos(phi) > target)
        lo = mid;
      else hi = mid;
    }
    const phi: number = (sign * (lo + hi)) / 2;
    return [
      x,
      y,
      frame.origin[2] +
        AutoMovieViewSection.radius(section, phi)[0] * Math.sin(phi),
    ];
  }

  /** Prepare the original source section shared by anatomical point readers. */
  function sectionAt(
    part: IAutoMovieViewPart,
    y: number,
  ): {
    section: AutoMovieViewSection.ISection;
    frame: AutoMovieLoftFrame.IFrame;
    extents: [number, number, number, number];
  } {
    const source: AutoMovieViewCurves.IResult =
      AutoMovieViewCurves.create(part);
    const scalar: (index: number) => number = (index: number): number => {
      const outline: AutoMovieViewOutline.IOutline | null =
        source.curves[index]!.outline;
      if (outline === null)
        throw new Error(
          `Head attachment: ${source.diagnostics.map((d: AutoMovieViewCurves.IResult["diagnostics"][number]): string => d.detail).join("; ")}`,
        );
      const value: number | string = AutoMovieViewOutline.value(outline, y);
      if (typeof value === "string")
        throw new Error(`Head attachment: ${value}`);
      return value;
    };
    const extents: [number, number, number, number] = [
      scalar(0),
      scalar(2),
      -scalar(1),
      -scalar(3),
    ];
    if (!extents.every((value: number): boolean => value > 0))
      throw new Error(
        `Head attachment: source axis outside its box [${extents}] at ${y}`,
      );
    if (part.fullness.kind !== "shoulder")
      throw new Error(
        "Head attachment requires the head mass's stated shoulder source",
      );
    const read: (outline: IAutoMovieViewPart.IOutline) => number = (
      outline: IAutoMovieViewPart.IOutline,
    ): number => {
      const prepared:
        | AutoMovieViewOutline.IOutline
        | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
      if ("detail" in prepared)
        throw new Error(`Head attachment fullness: ${prepared.detail}`);
      const value: number | string = AutoMovieViewOutline.value(prepared, y);
      if (typeof value === "string")
        throw new Error(`Head attachment fullness: ${value}`);
      return value;
    };
    const common: number = read(part.fullness.shoulder);
    const departure: (q: number) => number = (q: number): number =>
      part.fullness.kind === "shoulder" &&
      part.fullness.departures !== undefined
        ? read(part.fullness.departures[q]!)
        : 0;
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare(
      { extents },
      [
        common + departure(0),
        common + departure(1),
        common + departure(2),
        common + departure(3),
      ],
    );
    const fault: string | null = AutoMovieViewSection.fault(section);
    if (fault !== null)
      throw new Error(`Head attachment section at ${y}: ${fault}`);
    return { section, extents, frame: part.axis.at(y) };
  }

  /**
   * The front-view silhouette L's half width at a height: the parts merged
   * onto the head mass add to it (the zygoma at the zygion).
   *
   * @param plan The landmark skeleton.
   * @param y Height, mm.
   *
   * @evidence contracts/common.md#principled-implementation Reads the retained analytic vault/base/jaw width convention for HeadMasses' separate relief transfer.
   * @evidence contracts/common.md#clear-and-simple-design This template helper is distinct from emitted source constraints and actual native section readers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is neither an actual mesh width nor proof of a named emitted caliper.
   * @evidence contracts/common.md#meaningful-documentation Names template ownership and calibration units.
   * @evidence contracts/performance.md#efficient-algorithms Constant branch and polynomial arithmetic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work No preparation occurs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one scalar with no retained resources.
   */
  export function halfWidth(
    plan: IAutoMovieHumanHeadLayout,
    y: number,
  ): number {
    const base: number = AutoMovieHumanHeadPrior.PRIOR.frame.base;
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const tragion: number = m.tragion[1];
    if (y >= tragion)
      return (plan.breadth / 2) * AutoMovieHumanHeadVault.cranialWidth(plan, y);
    const t: number = (plan.breadth / 2) * base;
    const go: number = m.gonion[1];
    if (y >= go)
      return (
        t +
        (plan.mandibularWidth - t) *
          AutoMovieHumanHeadMassProfile.smooth(
            (tragion - y) / Math.max(1, tragion - go),
          )
      );
    return (
      plan.mandibularWidth +
      (plan.neck.radius - plan.mandibularWidth) *
        AutoMovieHumanHeadMassProfile.smooth(
          (go - y) / Math.max(1, go - plan.y0),
        )
    );
  }
}
