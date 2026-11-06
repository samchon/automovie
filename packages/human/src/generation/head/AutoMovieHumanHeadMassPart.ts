import { AutoMovieLoftFrame, AutoMovieNaturalSpline, AutoMovieViewCurves, AutoMovieViewOutline, type AutoMovieViewAxis, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanHeadBackProfile } from "../AutoMovieHumanHeadBackProfile";
import { AutoMovieHumanHeadMedianProfile } from "../AutoMovieHumanHeadMedianProfile";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import { AutoMovieHumanHeadMath } from "../AutoMovieHumanHeadMath";
import { AutoMovieHumanHeadVault } from "../AutoMovieHumanHeadVault";
import type { IAutoMovieHumanHeadLandmarks } from "../IAutoMovieHumanHeadLandmarks";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadSourceAxis } from "./AutoMovieHumanHeadSourceAxis";
import { AutoMovieHumanHeadSectionConstraints } from "./AutoMovieHumanHeadSectionConstraints";

/**
 * The head mass and its neck (cranium, face and neck without the nose,
 * lips and ears) as a part drawn from its three views, the input of the
 * view-to-section operator (`AutoMovieViewLoft`).
 *
 * - Side view: P, the median front profile of the skull and face
 *   (`AutoMovieHumanHeadMedianProfile`), continued under the menton along
 *   the submental line at the lower face-throat angle (Sn-Gn'-C, 100
 *   degrees) to the cervical point C, whose depth from the gnathion is the
 *   lower face's height over the lower vertical height-depth ratio
 *   (Sn-Gn' / C-Gn' = 1.2; Legan and Burstone 1980), and under C the neck's
 *   front handed over from its adopted conic-template band. The retained
 *   posterior skin secant defines that band's pose proxy, not a measured
 *   neck axis. B, the median back profile
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
 *   super-ellipse whose exponent closes the head circumference
 *   (`AutoMovieHumanHeadVault.closing`, `r = 2^(1 - 1/n) - 1`, the share of
 *   the diagonal point of `|x/a|^n + |z/b|^n = 1`); the face's front quarters
 *   depart to the face plan's exponent under the nasion and return to the
 *   vault's over the forehead.
 *
 * The top is a pole at the vertex, every outline reaching 0 there. The
 * bottom is open at the neck's base, inside the trunk: the neck is the head
 * mass's own lower stretch, not a part merged under it, since a neck tube
 * merged under the head met it along the nape and the jaw's underside,
 * where the two skins are one, and traced no clean loop. A submental line
 * carried on below C put P within a few millimetres of the axis and turned
 * the sections concave. Its lower supports now come directly from one
 * radius source; the C2 world-profile handover begins above the band.
 * Legan and Burstone's clinical constructed Gn' is the intersection of
 * Sn-Pg' and C-Me' (1980, p745, Fig1 landmark definitions). It is distinct
 * from the contour Gn used by the public FaceBase face-height input. The
 * population angle and ratio locate a clinical tangent intersection; they
 * do not specify a skin derivative. The curve below uses an explicitly
 * geometric C2 handover through that location, with a flat junction jet.
 */
export namespace AutoMovieHumanHeadMassPart {
  /** Control points per section, a multiple of 4. */
  export const ORDER: number = 64;

  /** Ring samples of the emitted chain. */
  export const SAMPLES: number = 256;

  /** Largest station step between layers, mm. */
  export const SPACING: number = 2;

  /**
   * The head mass as a view part.
   *
   * @param plan The landmark skeleton, the vault exponent solved.
   * @param faceExponent The face plan's super-ellipse exponent (`AutoMovieHumanFacePlan.exponent`); absent, the head prior's row.
   * @param bottom The neck base's station, inside the trunk; absent, the neck ring's height.
   * @returns The part, chain name `head.mass`.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, faceExponent?: number, bottom?: number): IAutoMovieViewPart {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const g: number = m.glabella[1];
    const neck: typeof plan.neck.curves = plan.neck.curves;
    const preparedRadius: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure | null = neck === undefined ? null : AutoMovieViewOutline.create(neck.radius);
    if (preparedRadius !== null && "detail" in preparedRadius) throw new Error(`Head neck radius: ${preparedRadius.detail}`);
    const radius: AutoMovieViewOutline.IOutline | null = preparedRadius;

    // The bottom: open at the neck's base, inside the trunk the head mass
    // and its neck are merged onto; the neck is this part's lower stretch.
    // It reaches a neck radius under the neck base, so the trunk's open top
    // stands inside it and the trunk crosses it there: opening at the neck
    // base itself, the head met the trunk nowhere and the body left it out.
    const throat: number = neck?.bottom ?? Math.min((bottom ?? plan.y0) - plan.neck.radius, cervical(plan)[1] - SPACING);
    const top: number = plan.vertex - g;

    // The sites the outlines carry knots at, by station: the profile's
    // turns (the chin's front at the pogonion and its turn at the gnathion
    // among them, which a spline from the stomion to the menton cut across)
    // and the vault's; by station (the axis point's
    // height, the axis being near vertical).
    const sites: [string, number][] = [
      ["throat", throat],
      ...(neck === undefined ? [] : [...neck.radius.knots.map((k: IAutoMovieViewPart.IKnot): [string, number] => [k.site, k.station]), ...neck.height.knots.slice(0, -1).map((k: IAutoMovieViewPart.IKnot): [string, number] => [k.site, k.value])]),
      ["cervical", cervical(plan)[1]],
      ["cervicale", plan.neck.backLevel],
      ["menton", plan.menton],
      ["gnathion", m.gnathion[1]],
      ["pogonion", m.pogonion[1]],
      ["gonion", m.gonion[1]],
      ["zygion", m.zygion[1]],
      ["stomion", plan.stomion],
      ["subnasale", plan.subnasale],
      ["tragion", m.tragion[1]],
      ["nasion", plan.nasion],
      ["glabella", g],
      ["vault.lower", g + 0.35 * top],
      ["vault.upper", g + 0.7 * top],
      ["vertex", plan.vertex],
    ];
    sites.sort((a: [string, number], b: [string, number]): number => a[1] - b[1]);
    const knotted: [string, number][] = sites.filter(
      (site: [string, number], i: number): boolean => i === 0 || site[1] > sites[i - 1]![1],
    );

    // Layers: every site and as many even steps between as keep them within
    // the spacing.
    const first: number = knotted[0]![1];
    const last: number = knotted[knotted.length - 1]![1];
    const stations: number[] = [];
    for (let i: number = 0; i + 1 < knotted.length; i++) {
      const a: number = knotted[i]![1];
      const b: number = knotted[i + 1]![1];
      const n: number = Math.max(1, Math.ceil((b - a) / SPACING));
      for (let k: number = 0; k < n; k++) stations.push(a + ((b - a) * k) / n);
    }
    stations.push(last);

    const coordinate: (component: 0 | 1 | 2) => IAutoMovieViewPart.IOutline = (component: 0 | 1 | 2): IAutoMovieViewPart.IOutline => ({
      knots: stations.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({ site: `head.axis.${i}`, station, value: component === 0 ? centreAt(plan, station) : component === 1 ? station : 0, ...(component === 0 && station >= m.tragion[1] ? { jet: { first: 0, second: 0 } } : {}) })),
    });
    const axis: AutoMovieViewAxis.IAxis = AutoMovieHumanHeadSourceAxis.of({ x: neck?.centre ?? coordinate(0), y: coordinate(1), z: coordinate(2) }, [1, 0, 0], [0, 0, 1]);
    const profile: AutoMovieHumanHeadBackProfile.IProfile = AutoMovieHumanHeadVault.backProfile(plan);

    // Named caliper points constrain the actual section at their own X/Y.
    // A lateral maximum at the axis is not that point's breadth.
    const vault: number = shoulder(plan.vault);
    const face: number = shoulder(faceExponent ?? AutoMovieHumanHeadPrior.PRIOR.frame.plan);
    const extentsAt: (y: number) => [number, number, number, number] = (y: number): [number, number, number, number] => {
      const centre: number = axis.at(y).origin[0];
      return [median(plan, y, axis, radius) - centre, plan.breadth / 2, centre - AutoMovieHumanHeadBackProfile.at(profile, y), plan.breadth / 2];
    };
    const widths: number[] = [m.gonion, m.zygion].map((site: [number, number], i: number): number => AutoMovieHumanHeadSectionConstraints.lateral(extentsAt(site[1]), [face, vault, vault, face], site[0] - axis.at(site[1]).origin[0], i === 0 ? plan.mandibularWidth : plan.faceWidth));
    const frontal: number = AutoMovieHumanHeadSectionConstraints.frontal(extentsAt(g), vault, m.frontal[0] - axis.at(g).origin[0], plan.frontalWidth);
    const widthAt: (y: number) => number = (y: number): number => {
      if (y >= g) return plan.breadth / 2 * AutoMovieHumanHeadVault.cranialWidth(plan, y);
      if (y >= m.zygion[1]) return widths[1]! + (plan.breadth / 2 - widths[1]!) * smooth((y - m.zygion[1]) / (g - m.zygion[1]));
      if (y >= m.gonion[1]) return widths[0]! + (widths[1]! - widths[0]!) * smooth((y - m.gonion[1]) / (m.zygion[1] - m.gonion[1]));
      const lower: number = neck?.band[1] ?? plan.y0;
      return plan.neck.radius + (widths[0]! - plan.neck.radius) * smooth((y - lower) / (m.gonion[1] - lower));
    };

    // Every layer's plane and the outlines' values there, so each outline
    // follows P, B and L at the layers' spacing: knots at the sites alone let
    // the spline swing across the jaw's turn to the neck and carried the
    // neck's front behind the axis.
    const front: IAutoMovieViewPart.IKnot[] = [];
    const back: IAutoMovieViewPart.IKnot[] = [];
    const left: IAutoMovieViewPart.IKnot[] = [];
    const right: IAutoMovieViewPart.IKnot[] = [];
    const named: Map<number, string> = new Map(knotted.map(([site, station]: [string, number]): [number, string] => [station, site]));
    const rootSpan: number = Math.sqrt(plan.vertex - first);
    for (const [k, station] of stations.entries()) {
      const site: string = named.get(station) ?? `head.${k}`;
      const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
      const atPole: boolean = site === "vertex";
      const radial: AutoMovieViewOutline.IReading | string | null = radius !== null && station <= neck!.band[1] ? AutoMovieViewOutline.at(radius, station) : null;
      if (typeof radial === "string") throw new Error(`Head neck radial source: ${radial}`);
      const p: number = atPole ? 0 : radial === null ? median(plan, station, axis, radius) - frame.origin[0] : neck!.extents[0] * radial.value / neck!.lateral;
      const b: number = atPole ? 0 : radial === null ? frame.origin[0] - AutoMovieHumanHeadBackProfile.at(profile, station) : neck!.extents[2] * radial.value / neck!.lateral;
      const l: number = atPole ? 0 : radial === null ? widthAt(frame.origin[1]) : radial.value;
      if (!atPole && ![p, b, l].every((value: number): boolean => value > 0 && Number.isFinite(value)))
        throw new Error(`Head source ${site}@${station}: level axis is outside front/back/side supports [${p},${b},${l}]`);
      front.push({ site, station, value: p });
      back.push({ site, station, value: -b });
      left.push({ site, station, value: l });
      right.push({ site, station, value: -l });
      if (radial !== null) {
        const first: number = radial.parameterJet[0] * rootSpan;
        const second: number = radial.parameterJet[1] * rootSpan * rootSpan;
        front.at(-1)!.jet = { first: neck!.extents[0] * first / neck!.lateral, second: neck!.extents[0] * second / neck!.lateral };
        back.at(-1)!.jet = { first: -neck!.extents[2] * first / neck!.lateral, second: -neck!.extents[2] * second / neck!.lateral };
        left.at(-1)!.jet = { first, second };
        right.at(-1)!.jet = { first: -first, second: -second };
      }
      if (neck !== undefined && station === cervical(plan)[1]) {
        const turn: ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> = axis.jet?.(station, { type: "root", end: "top", pole: plan.vertex }) ?? null;
        if (turn === null) throw new Error("Clinical C has no regular source-origin parameter jet");
        front.at(-1)!.jet = { first: -turn.first.origin[0] * rootSpan, second: -turn.second.origin[0] * rootSpan * rootSpan };
      }
    }
    if (front.length) {
      front[front.length - 1]!.value = 0;
      back[back.length - 1]!.value = 0;
      left[left.length - 1]!.value = 0;
      right[right.length - 1]!.value = 0;
    }

    // The quarters' fullness: the vault's shoulder, the face's in front
    // under the nasion, returning to the vault's over the forehead.
    const flatAt = (value: number): IAutoMovieViewPart.IOutline => ({
      knots: [
        { site: knotted[0]![0], station: first, value },
        { site: knotted[knotted.length - 1]![0], station: last, value },
      ],
    });
    const faceDeparture: IAutoMovieViewPart.IOutline = {
      knots: [
        { site: knotted[0]![0], station: first, value: neck === undefined ? face - vault : 0 },
        ...(neck === undefined ? [] : [{ site: "neck.cylinder.upper", station: neck.band[1], value: 0 }]),
        { site: "gonion", station: m.gonion[1], value: face - vault },
        { site: "zygion", station: m.zygion[1], value: face - vault },
        { site: "nasion", station: plan.nasion, value: face - vault },
        { site: "frontotemporale", station: g, value: frontal - vault },
        { site: "vault.lower", station: g + 0.35 * top, value: 0 },
        { site: knotted[knotted.length - 1]![0], station: last, value: 0 },
      ].filter((k: IAutoMovieViewPart.IKnot, i: number, all: IAutoMovieViewPart.IKnot[]): boolean => i === 0 || k.station > all[i - 1]!.station).map((k: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => ({ ...k, jet: { first: 0, second: 0 } })),
    };


    return {
      name: "head.mass",
      axis,
      stations,
      front: { positive: { knots: front }, negative: { knots: back } },
      side: { positive: { knots: left, range: { minimum: 0, maximum: plan.breadth / 2 } }, negative: { knots: right, range: { minimum: -plan.breadth / 2, maximum: 0 } } },
      fullness: {
        kind: "shoulder",
        shoulder: neck === undefined ? flatAt(vault) : { knots: [[first, AutoMovieViewSection.ELLIPSE], [neck.band[1], AutoMovieViewSection.ELLIPSE], [m.gonion[1], vault], [last, vault]].map(([station, value]: number[], i: number): IAutoMovieViewPart.IKnot => ({ site: `head.shoulder.${i}`, station: station!, value: value!, jet: { first: 0, second: 0 } })) },
        departures: [faceDeparture, flatAt(0), flatAt(0), faceDeparture],
      },
      pole: "top",
      order: ORDER,
      samples: SAMPLES,
    };
  }

  /**
   * The conic shoulder of a quarter super-ellipse of exponent `n`: its
   * diagonal point `2^(-1/n) (a, b)` written as `(1 + r)(a, b) / 2`.
   *
   * @param n The exponent, 2 for the ellipse.
   */
  export function shoulder(n: number): number {
    return Math.max(AutoMovieViewSection.ELLIPSE / 4, Math.min(0.95, 2 ** (1 - 1 / n) - 1));
  }

  /**
   * Median support through the contour menton and separately constructed
   * clinical C. Legan and Burstone's Sn-Gn'-C angle locates that junction;
   * it is not a skin derivative. The adopted flat C jet and the lower
   * band's slope define the explicit C2 profile handover.
   */
  function median(plan: IAutoMovieHumanHeadLayout, y: number, axis: AutoMovieViewAxis.IAxis, radius: AutoMovieViewOutline.IOutline | null): number {
    if (y >= plan.menton) return AutoMovieHumanHeadMedianProfile.profileAt(plan, y);
    const c: [number, number] = cervical(plan);
    if (!(c[1] < plan.menton)) throw new Error("Head level-section neck handover requires its clinical C below menton; that ordering is not supplied by the clinical measurements alone");
    const neck: typeof plan.neck.curves = plan.neck.curves;
    if (neck !== undefined && radius !== null && y <= neck.band[1]) {
      const r: number | string = AutoMovieViewOutline.value(radius, y);
      if (typeof r === "string") throw new Error(`Median neck radius: ${r}`);
      return axis.at(y).origin[0] + neck.extents[0] * r / neck.lateral;
    }
    const bottom: number = neck?.band[1] ?? Math.min(plan.y0 - plan.neck.radius, c[1] - SPACING);
    const front: number = neck === undefined ? plan.neck.x + plan.neck.radius : axis.at(bottom).origin[0] + neck.extents[0];
    if (y <= bottom) return front;
    // The clinical Sn-Gn'-C angle is between landmark chords, not a skin
    // derivative. A shared flat jet is the stated geometric handover.
    const turn = AutoMovieHumanHeadMath.flat(c[0]);
    if (y < c[1]) return AutoMovieHumanHeadMath.joined({ value: front, slope: neck?.slope ?? 0, curvature: 0 }, turn, bottom, c[1], y);
    const g: number = plan.landmarks.glabella[1];
    const top: number = plan.vertex - g;
    const d: [number, number] = AutoMovieNaturalSpline.derivative(plan.profile, plan.menton);
    return AutoMovieHumanHeadMath.joined(turn, {
      value: AutoMovieHumanHeadMedianProfile.profileAt(plan, plan.menton),
      slope: d[0] - (plan.length / 2) * (plan.menton - g) / (top * top),
      curvature: d[1] - (plan.length / 2) / (top * top),
    }, c[1], plan.menton, y);
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
   */
  export function cervical(plan: IAutoMovieHumanHeadLayout): [number, number] {
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const dx: number = m.subnasale[0] - m.pogonion[0];
    const dy: number = m.subnasale[1] - m.pogonion[1];
    const up: number = Math.atan2(dy, dx);
    const throat: number = up + (AutoMovieHumanHeadPrior.PRIOR.mandible.throatAngle * Math.PI) / 180;
    const ux: number = Math.cos(throat);
    const uy: number = Math.sin(throat);
    const determinant: number = dx * uy - dy * ux;
    if (determinant === 0 || !Number.isFinite(determinant)) throw new Error("Head clinical Gn' has no finite Sn-Pg'/C-Me' intersection");
    const t: number = ((m.menton[0] - m.pogonion[0]) * uy - (m.menton[1] - m.pogonion[1]) * ux) / determinant;
    const gn: [number, number] = [m.pogonion[0] + t * dx, m.pogonion[1] + t * dy];
    const depth: number = Math.hypot(m.subnasale[0] - gn[0], m.subnasale[1] - gn[1]) / HEIGHT_DEPTH;
    return [gn[0] + depth * ux, gn[1] + depth * uy];
  }

  /** Sagittal segment-length ratio `Sn-Gn' / C-Gn'`, not a vertical projection (Legan and Burstone 1980). */
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
   */
  export function frontAt(part: IAutoMovieViewPart, y: number, z: number): number {
    return frontReading(part, y, z).forward;
  }

  /** Local transverse radius of the same original source section, not a footprint-wide minimum or a measured tissue radius. */
  export function frontRadiusAt(part: IAutoMovieViewPart, y: number, z: number): number {
    return frontReading(part, y, z).radius;
  }

  /** One actual front point and its analytic planar curvature share the original section and inverse. */
  function frontReading(part: IAutoMovieViewPart, y: number, z: number): { forward: number; radius: number } {
    const { section, frame, extents } = sectionAt(part, y);
    const centre: number = frame.origin[0];
    const side: number = extents[1];
    const target: number = Math.abs(z - frame.origin[2]);
    if (target > side) throw new Error(`Head attachment lateral place ${z} is outside its source section at ${y}`);
    const lateral: (phi: number) => number = (phi: number): number => AutoMovieViewSection.radius(section, phi)[0] * Math.sin(phi);
    let lo: number = 0;
    let hi: number = Math.PI / 2;
    for (let k: number = 0; k < 50; k++) {
      const mid: number = (lo + hi) / 2;
      if (lateral(mid) < target) lo = mid;
      else hi = mid;
    }
    const phi: number = target === side ? Math.PI / 2 : (lo + hi) / 2;
    const [r, first, second]: [number, number, number] = AutoMovieViewSection.radius(section, phi);
    const turn: number = r * r + 2 * first * first - r * second;
    if (!(turn > 0)) throw new Error(`Head attachment has no positive transverse curvature at ${y}/${z}`);
    return { forward: centre + r * Math.cos(phi), radius: (r * r + first * first) ** 1.5 / turn };
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
  export function sideAt(part: IAutoMovieViewPart, y: number, x: number, sign: 1 | -1): [number, number, number] {
    const { section, frame, extents } = sectionAt(part, y);
    const target: number = x - frame.origin[0];
    if (target > extents[0] || target < -extents[2]) throw new Error(`Ear scalp datum X ${x} is outside its original section at ${y}`);
    let lo: number = target >= 0 ? 0 : Math.PI / 2;
    let hi: number = target >= 0 ? Math.PI / 2 : Math.PI;
    for (let k: number = 0; k < 50; k++) {
      const mid: number = (lo + hi) / 2;
      const phi: number = sign * mid;
      if (AutoMovieViewSection.radius(section, phi)[0] * Math.cos(phi) > target) lo = mid;
      else hi = mid;
    }
    const phi: number = sign * (lo + hi) / 2;
    return [x, y, frame.origin[2] + AutoMovieViewSection.radius(section, phi)[0] * Math.sin(phi)];
  }

  /** Prepare the original source section shared by anatomical point readers. */
  function sectionAt(part: IAutoMovieViewPart, y: number): { section: AutoMovieViewSection.ISection; frame: AutoMovieLoftFrame.IFrame; extents: [number, number, number, number] } {
    const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(part);
    const scalar: (index: number) => number = (index: number): number => {
      const outline: AutoMovieViewOutline.IOutline | null = source.curves[index]!.outline;
      if (outline === null) throw new Error(`Head attachment: ${source.diagnostics.map((d: AutoMovieViewCurves.IResult["diagnostics"][number]): string => d.detail).join("; ")}`);
      const value: number | string = AutoMovieViewOutline.value(outline, y);
      if (typeof value === "string") throw new Error(`Head attachment: ${value}`);
      return value;
    };
    const extents: [number, number, number, number] = [scalar(0), scalar(2), -scalar(1), -scalar(3)];
    if (!extents.every((value: number): boolean => value > 0)) throw new Error(`Head attachment: source axis outside its box [${extents}] at ${y}`);
    if (part.fullness.kind !== "shoulder") throw new Error("Head attachment requires the head mass's stated shoulder source");
    const read: (outline: IAutoMovieViewPart.IOutline) => number = (outline: IAutoMovieViewPart.IOutline): number => {
      const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
      if ("detail" in prepared) throw new Error(`Head attachment fullness: ${prepared.detail}`);
      const value: number | string = AutoMovieViewOutline.value(prepared, y);
      if (typeof value === "string") throw new Error(`Head attachment fullness: ${value}`);
      return value;
    };
    const common: number = read(part.fullness.shoulder);
    const departure: (q: number) => number = (q: number): number => part.fullness.kind === "shoulder" && part.fullness.departures !== undefined ? read(part.fullness.departures[q]!) : 0;
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents }, [common + departure(0), common + departure(1), common + departure(2), common + departure(3)]);
    const fault: string | null = AutoMovieViewSection.fault(section);
    if (fault !== null) throw new Error(`Head attachment section at ${y}: ${fault}`);
    return { section, extents, frame: part.axis.at(y) };
  }

  /** Level planes drift from the neck's own axis to the skull's; they never tilt across the jaw. */
  function centreAt(plan: IAutoMovieHumanHeadLayout, y: number): number {
    return plan.neck.x + (plan.centre - plan.neck.x) * smooth((y - plan.y0) / (plan.landmarks.tragion[1] - plan.y0));
  }

  /**
   * The front-view silhouette L's half width at a height: the parts merged
   * onto the head mass add to it (the zygoma at the zygion).
   *
   * @param plan The landmark skeleton.
   * @param y Height, mm.
   */
  export function halfWidth(plan: IAutoMovieHumanHeadLayout, y: number): number {
    const base: number = AutoMovieHumanHeadPrior.PRIOR.frame.base;
    const m: IAutoMovieHumanHeadLandmarks = plan.landmarks;
    const tragion: number = m.tragion[1];
    if (y >= tragion) return (plan.breadth / 2) * AutoMovieHumanHeadVault.cranialWidth(plan, y);
    const t: number = (plan.breadth / 2) * base;
    const go: number = m.gonion[1];
    if (y >= go) return t + (plan.mandibularWidth - t) * smooth((tragion - y) / Math.max(1, tragion - go));
    return plan.mandibularWidth + (plan.neck.radius - plan.mandibularWidth) * smooth((go - y) / Math.max(1, go - plan.y0));
  }

  /** The quintic smoothstep, C2 at both ends. */
  function smooth(u: number): number {
    const x: number = Math.min(1, Math.max(0, u));
    return x * x * x * (10 - 15 * x + 6 * x * x);
  }
}
