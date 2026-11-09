import {
  AutoMovieIllinois,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
  AutoMovieSolidVector as V,
} from "@automovie/engine";

import { AutoMovieHumanFootSource } from "../foot/AutoMovieHumanFootSource";
import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";

/** A world calibration-mm vector. */
type Vec3 = V.Vec3;
/** The actual public axis's separately available frame derivatives. */
type FrameJet = NonNullable<
  ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>>
>;

/**
 * An unmeasured proximal leg outline constrained by its actual parent field.
 *
 * @evidence contracts/common.md#principled-implementation The canonical parent section intersects the actual femur's lateral ray plane; implicit native total2 differentiates that same parent exit along the unchanged child course.
 * @evidence contracts/common.md#clear-and-simple-design Returns one original outline and its complete parent/contact record; the caller retains all other source functions and performs its existing loft once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No public-width clamp, independent ellipse, moved bone, changed tape or mesh readback supplies the contact. Missing physical jets remain failures.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes a declared lateral source transfer from equality of the entire child ring or final world C2, and requires the actual trial/final parent identity at the caller.
 * @evidence contracts/performance.md#efficient-algorithms One bounded Illinois section root and a fixed two-by-two implicit solve precede an O(n) original-knot pass.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the existing native source wrapper and public parameter/outline owners; no section meshing, raw loft or independent root algorithm is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The definition owns its finite outline and borrowed parent/contact records; no global cache or process is retained.
 */
export namespace AutoMovieHumanLegProximal {
  /** The identical parent definition and its authoritative named hip station. */
  export interface IParent {
    /** Actual trial/final parent, not an independently reconstructed hip box. */
    definition: AutoMovieHumanSiteViewPart.IDefinition;
    /** Named canonical parent station, calibration mm. */
    station: number;
  }

  /** Actual parent/child coordinates and separately qualified transfer jets. */
  export interface IContact {
    /** Definition consumed by this exact source transfer. */
    parent: IParent;
    /** Complete original parent field, including fullness and parameter owners. */
    owner: AutoMovieHumanFootSource.ISource;
    /** Original parent phase, radians. */
    phase: number;
    /** Actual world contact, calibration mm. */
    point: Vec3;
    /** Actual source station on the unchanged child course, mm. */
    station: number;
    /** Signed native v direction of the outward guide. */
    outward: 1 | -1;
    /** Positive ray radius and first/second derivatives in child station. */
    radius: [number, number, number];
    /** The available parent frame jets in its actual physical parameter. */
    parentFrame: FrameJet;
    /** The available child frame jets at the actual contact. */
    childFrame: FrameJet;
  }

  /** New proximal outward original, with its actual complete parent authority. */
  export interface IResult {
    /** Reauthored prefix; all named-thigh-and-later scalar spans replay unchanged. */
    outline: IAutoMovieViewPart.IOutline;
    /** Contact retained by both construction and independent source readers. */
    contact: IContact;
  }

  /**
   * Constrain only the unmeasured pole-to-thigh outward source. The canonical
   * parent is level in its actual declared X/Z chart; the child reference and
   * contact must lie on the same unchanged straight femur run. The contact
   * matches a local parent exit, not the parent's global half breadth.
   *
   * @evidence contracts/common.md#principled-implementation Uses the parent's full native phase and physical total2, the actual child frame and exact original pole parameter; copies all original scalar values/two parameter jets from the public thigh onward.
   * @evidence contracts/common.md#clear-and-simple-design One source-authoring result precedes the existing common definition/loft path.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses unsupported charts, missing jets, invalid contact order or nonzero ray/plane residuals instead of moving inputs or shrinking measured sections.
   * @evidence contracts/common.md#meaningful-documentation Reports the limited lateral transfer and preserves the caller's responsibility to consume the same final parent after coupled tape solving.
   * @evidence contracts/performance.md#efficient-algorithms At most one hundred fixed-size root evaluations and O(n) knot reads; no raw geometry is built.
   * @evidence contracts/performance.md#reuse-equivalent-work The prepared native field serves the root, final point and both implicit derivatives; the old outline supplies all retained spans.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the authored outline and its finite ownership record escape synchronous preparation.
   */
  export function create(
    child: IAutoMovieViewPart,
    thigh: number,
    parent: IParent,
    outward: 1 | -1,
  ): IResult {
    const definition: AutoMovieHumanSiteViewPart.IDefinition =
      parent.definition;
    if (definition.part === null || definition.view === null)
      throw new Error("Proximal leg needs its actual parent definition");
    const axis: typeof definition.view.axis = definition.view.axis;
    if (
      axis.type !== "parallel" ||
      axis.u.x !== 1 ||
      axis.u.y !== 0 ||
      axis.u.z !== 0 ||
      axis.v.x !== 0 ||
      axis.v.y !== 0 ||
      axis.v.z !== 1 ||
      axis.origin.y.parameter !== undefined ||
      axis.origin.y.knots.some(
        (knot: (typeof axis.origin.y.knots)[number]): boolean =>
          knot.value !== knot.station,
      )
    )
      throw new Error(
        "Proximal leg transfer needs the actual level X/Z parent with its identity height clock",
      );
    const owner: AutoMovieHumanFootSource.ISource =
      AutoMovieHumanFootSource.prepare(definition.part);
    const section: AutoMovieHumanFootSource.IStation =
      AutoMovieHumanFootSource.at(owner, parent.station);
    const frame: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
      owner.part.axis.at(parent.station);
    if (
      Math.abs(frame.origin[1] - parent.station) > 1e-9 ||
      frame.u.some(
        (value: number, index: number): boolean => value !== [1, 0, 0][index],
      ) ||
      frame.v.some(
        (value: number, index: number): boolean => value !== [0, 0, 1][index],
      )
    )
      throw new Error(
        "Actual proximal parent frame differs from its level source declaration",
      );
    const reference: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
      child.axis.at(thigh);
    const advance: Vec3 = V.cross(reference.v, reference.u);
    const direction: Vec3 = V.scale(reference.v, outward);
    if (direction[2] === 0)
      throw new Error("Proximal lateral guide has no world lateral direction");
    const point: (phi: number) => Vec3 = (phi: number): Vec3 => {
      const local: ReturnType<AutoMovieHumanFootSource.IStation["phase"]> =
        section.phase(phi);
      return V.add(
        frame.origin,
        V.add(V.scale(frame.u, local.p[0]), V.scale(frame.v, local.p[1])),
      );
    };
    const residual: (phi: number) => number = (phi: number): number =>
      V.dot(V.sub(point(phi), reference.origin), reference.u);
    const start: number = direction[2] > 0 ? 0 : Math.PI;
    const phase: number | null = AutoMovieIllinois.root(
      residual,
      start,
      start + Math.PI,
      1e-9,
      100,
    );
    if (
      phase === null ||
      !Number.isFinite(phase) ||
      Math.abs(residual(phase)) > 1e-9
    )
      throw new Error(
        "Canonical hip section has no residual-checked femur lateral-plane contact",
      );
    const contactPoint: Vec3 = point(phase);
    const station: number =
      thigh + V.dot(V.sub(contactPoint, reference.origin), advance);
    const childFrame: FrameJet | null = child.axis.jet?.(station) ?? null;
    const parentFrame: FrameJet | null =
      owner.part.axis.jet?.(parent.station) ?? null;
    if (childFrame === null || parentFrame === null || section.jet === null)
      throw new Error(
        "Proximal local parent transfer needs available physical2, not zero replacements",
      );
    const actual: ReturnType<IAutoMovieViewPart["axis"]["at"]> =
      child.axis.at(station);
    const d: Vec3 = V.scale(actual.v, outward);
    const radius: number = V.dot(V.sub(contactPoint, actual.origin), d);
    if (
      !(station > child.stations[0]! && station < thigh && radius > 0) ||
      Math.hypot(
        ...V.sub(contactPoint, V.add(actual.origin, V.scale(d, radius))),
      ) > 1e-9
    )
      throw new Error(
        "Actual hip contact is outside the unmeasured straight proximal leg interval",
      );
    const jet: ReturnType<
      NonNullable<AutoMovieHumanFootSource.IStation["jet"]>
    > = section.jet(phase);
    const pp: Vec3 = V.add(parentFrame.first.origin, [jet.s[0], 0, jet.s[1]]);
    const ppp: Vec3 = V.add(parentFrame.second.origin, [
      jet.ss[0],
      0,
      jet.ss[1],
    ]);
    const pt: Vec3 = [jet.t[0], 0, jet.t[1]];
    const pst: Vec3 = [jet.st[0], 0, jet.st[1]];
    const ptt: Vec3 = [jet.tt[0], 0, jet.tt[1]];
    const ds: Vec3 = V.scale(childFrame.first.v, outward);
    const dss: Vec3 = V.scale(childFrame.second.v, outward);
    const qs: Vec3 = V.add(childFrame.first.origin, V.scale(ds, radius));
    const fr: Vec3 = V.sub(V.scale(pp, d[1]), d);
    const fs: Vec3 = V.sub(V.scale(pp, qs[1]), qs);
    const first: [number, number] = solve(fr, pt, V.scale(fs, -1));
    const yFirst: number = qs[1] + d[1] * first[0];
    const known: Vec3 = V.add(
      V.add(childFrame.second.origin, V.scale(dss, radius)),
      V.scale(ds, 2 * first[0]),
    );
    const parentKnown: Vec3 = V.add(
      V.add(V.scale(ppp, yFirst * yFirst), V.scale(pst, 2 * yFirst * first[1])),
      V.add(V.scale(ptt, first[1] * first[1]), V.scale(pp, known[1])),
    );
    const second: [number, number] = solve(fr, pt, V.sub(known, parentKnown));
    const contact: IContact = {
      parent,
      owner,
      phase,
      point: contactPoint,
      station,
      outward,
      radius: [radius, first[0], second[0]],
      parentFrame,
      childFrame,
    };
    const original:
      | AutoMovieViewOutline.IOutline
      | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
      outward === 1 ? child.side.positive : child.side.negative,
      { bottom: child.stations[0]!, top: child.stations.at(-1)! },
    );
    if ("detail" in original) throw new Error(original.detail);
    if (
      original.knots.some(
        (knot: IAutoMovieViewPart.IKnot): boolean =>
          knot.station > child.stations[0]! && knot.station < thigh,
      )
    )
      throw new Error(
        "Proximal authoring cannot discard an existing named input before the thigh",
      );
    const change: [number, number] | null = AutoMovieViewParameter.jet(
      original.parameter,
      station,
    );
    if (change === null)
      throw new Error(
        "Proximal contact has no regular source-parameter change",
      );
    const span: number = original.spline.xs.at(-1)! - original.spline.xs[0]!;
    const firstParameter: number = (outward * first[0]) / change[0];
    const knots: IAutoMovieViewPart.IKnot[] = [
      original.knots[0]!,
      {
        site: "actual hip parent lateral contact",
        station,
        value: outward * radius,
        jet: {
          first: firstParameter * span,
          second:
            ((outward * second[0] - firstParameter * change[1]) /
              (change[0] * change[0])) *
            span *
            span,
        },
      },
    ];
    for (const knot of original.knots.filter(
      (value: IAutoMovieViewPart.IKnot): boolean => value.station >= thigh,
    )) {
      const reading: AutoMovieViewOutline.IReading | string =
        AutoMovieViewOutline.at(original, knot.station);
      if (typeof reading === "string") throw new Error(reading);
      knots.push({
        ...knot,
        value: reading.value,
        jet: {
          first: reading.parameterJet[0] * span,
          second: reading.parameterJet[1] * span * span,
        },
      });
    }
    return { outline: { knots, parameter: original.parameter }, contact };
  }
}

/** Solve the same implicit X/Z contact equations, rejecting degeneracy. */
function solve(a: Vec3, b: Vec3, rhs: Vec3): [number, number] {
  const determinant: number = a[0] * b[2] - a[2] * b[0];
  const result: [number, number] = [
    (rhs[0] * b[2] - rhs[2] * b[0]) / determinant,
    (a[0] * rhs[2] - a[2] * rhs[0]) / determinant,
  ];
  if (
    determinant === 0 ||
    !Number.isFinite(determinant) ||
    !result.every(Number.isFinite)
  )
    throw new Error(
      "Actual parent lateral contact has no finite implicit physical2",
    );
  return result;
}
