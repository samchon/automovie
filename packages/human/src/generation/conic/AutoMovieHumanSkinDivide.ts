import {
  AutoMovieConstructionSeeds,
  AutoMovieLoftViewFullSource,
} from "@automovie/engine";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanJoinLoop,
  IAutoMovieHumanLandmarkSurface,
  IAutoMovieHumanSkinDivide,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanGlutealParent } from "../trunk/AutoMovieHumanGlutealParent";
import { AutoMovieHumanJoinLoop } from "./AutoMovieHumanJoinLoop";
import { AutoMovieHumanSkinCutLoop } from "./AutoMovieHumanSkinCutLoop";

/**
 * Every surface that divides the body's skin between two neighbouring parts,
 * each declared once as a rule on joint centres.
 *
 * Where two parts meet, one skin is described by two families. Each point of
 * that skin is one part's: a surface fixed in the skeleton parts it, the family
 * on either side is fitted to its own side alone, and the construction joins
 * the two on that surface (a split's seam plane, a parent's end plane, a join's
 * loop). The surface is therefore read three times, by the fit of each
 * neighbour and by the tree, and all three read this module: a rule here is a
 * function of joint centres, so a person whose joints move gets her own
 * surfaces and a posed limb carries its own
 * (`packages/human/docs/techniques/joints-one-shot.md`, The hypotheses).
 *
 * The rules, on the declared side (+Z):
 *
 * - `armscye`: the landmark surface and scope supplied by the caller around the
 *   shoulder joint; the trunk medial of it, the arm lateral.
 * - `mammary`, `ear.root`: a landmark surface each, supplied as the armscye's is,
 *   within its own reach of its centre; the trunk on the near side, the breast
 *   and the auricle's plate on the far side. A figure without one of them
 *   declares none.
 * - `wrist`: the arm's section plane where its face ends; the arm proximal, the
 *   hand distal.
 * - `thumb.root`: a landmark surface about the thumb's metacarpophalangeal
 *   centre, supplied as the armscye's is, within its own reach of that centre;
 *   the hand and the four fingers on the near side, the thumb on the far side.
 *   The thumb leaves the hand's side: a plane through the wrist and the thumb's
 *   first joint ran along the thumb's sections and left the first web's sheet
 *   on the thumb.
 * - `heads.hand`, `heads.foot`: the parent's section plane where its digits part
 *   from it; the parent proximal, the digits distal.
 * - `web.<a>.<b>` between neighbouring digits of a row: the plane through the
 *   midpoint of their two first joints that holds the bisector of their first
 *   segments and the row's normal (the palm's, from the wrist and the row's two
 *   outer knuckles; the sole's, which the caller supplies).
 * - `hip`: the level plane midway between the hip centre's height and the trunk's
 *   foot; the trunk above, the legs below.
 * - `crotch`: the median plane; one leg either side.
 *
 * The three section planes are their parent family's own (a split's end is a
 * section of its host), so the caller reads them off the families and hands
 * them in (`IEnd`).
 */
export namespace AutoMovieHumanSkinDivide {
  /** A point or a direction, mm. */
  export type V = [number, number, number];

  /** A surface owned by the interface package. */
  export type ISurface = IAutoMovieHumanSkinDivide.ISurface;

  /** Its parent's exact section plane. */
  export type IEnd = IAutoMovieHumanSkinDivide.IEnd;

  /** One measured digit course in a row. */
  export type IDigit = IAutoMovieHumanSkinDivide.IDigit;

  /** A carried landmark divider and where it applies. */
  export type ILandmarked = IAutoMovieHumanSkinDivide.ILandmarked;

  /** The placed inputs to the divider registry. */
  export type IInput = IAutoMovieHumanSkinDivide.IInput;

  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = (a: V): V => {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    if (!(l > 0)) throw new Error("divide: a direction has no length");
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const middle = (a: V, b: V): V => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2,
  ];
  const plane = (point: V, normal: V): ((p: V) => number) => {
    const n: V = unit(normal);
    return (p: V): number => dot(sub(p, point), n);
  };
  const toward = (normal: V, direction: V): V =>
    dot(normal, direction) > 0 ? normal : [-normal[0], -normal[1], -normal[2]];

  function tubed(p: V, course: readonly V[]): number {
    let least: number = Infinity;
    for (let i: number = 0; i + 1 < course.length; ++i) {
      const [a, e]: V[] = [course[i]!, sub(course[i + 1]!, course[i]!)];
      // The last stretch runs on past its end: the part's skin goes on to its tip along it.
      const t: number = Math.max(
        0,
        Math.min(
          i + 2 === course.length ? Infinity : 1,
          dot(sub(p, a!), e!) / (dot(e!, e!) || 1),
        ),
      );
      least = Math.min(
        least,
        Math.hypot(
          p[0] - a![0] - t * e![0],
          p[1] - a![1] - t * e![1],
          p[2] - a![2] - t * e![2],
        ),
      );
    }
    return least;
  }

  /**
   * Original observation open set, with the named limiting source landmarks
   * admitted in its closure.
   */
  export function landmarkOwner(
    centre: V,
    course: readonly V[],
    landmarks: readonly V[],
    reach?: number,
  ): IAutoMovieHumanJoinLoop.IRegisteredOwner {
    if (course.length < 2 || landmarks.length === 0)
      throw new Error(
        "a registered material owner needs source landmarks and one course segment",
      );
    const axis = sub(course[1]!, course[0]!);
    const norm = dot(axis, axis);
    if (!(norm > 0 && Number.isFinite(norm)))
      throw new Error("degenerate initial material axis");
    const distance = (p: V): number => Math.hypot(...sub(p, centre));
    const radius = reach ?? Math.max(...landmarks.map(distance));
    const tube = Math.max(
      ...landmarks.map((p): number => {
        const q = sub(p, course[0]!);
        const t = dot(q, axis) / norm;
        return Math.hypot(
          q[0] - t * axis[0],
          q[1] - t * axis[1],
          q[2] - t * axis[2],
        );
      }),
    );
    const owns = (p: readonly number[], closure = false): boolean => {
      const v: V = [p[0]!, p[1]!, p[2]!];
      return closure
        ? distance(v) <= radius || tubed(v, course) <= tube
        : distance(v) < radius || tubed(v, course) < tube;
    };
    // Every point of this divider lies in the normal slab bounded by the original periodic cubic's Bernstein controls.
    // A finite course segment and its tube have a finite radius. Its final axial ray is bounded here only by that actual slab.
    const extent = (
      divider: IAutoMovieHumanLandmarkSurface.ISurface,
    ): number => {
      const n = divider.normal,
        origin = divider.origin;
      const knots = landmarks
        .map((p) => {
          const [r, theta] = divider.address(p);
          const jet = divider.jet(r, theta);
          return { theta, h: dot(sub(p, origin), n), dh: dot(jet.v, n) };
        })
        .sort((a, b): number => a.theta - b.theta);
      const controls = knots.flatMap((a, j): number[] => {
        const b = knots[(j + 1) % knots.length]!;
        const span: number =
          b.theta - a.theta + (j + 1 === knots.length ? 2 * Math.PI : 0);
        return [a.h, a.h + (span * a.dh) / 3, b.h - (span * b.dh) / 3, b.h];
      });
      const base = course[course.length - 2]!,
        last = unit(sub(course.at(-1)!, base));
      const speed: number = Math.abs(dot(last, n)),
        off = dot(sub(base, origin), n);
      if (!(speed > 0))
        throw new Error(
          "the registered terminal tube has no finite radial limit on the landmark divider",
        );
      const travel: number =
        (Math.max(...controls.map((h): number => Math.abs(h - off))) + tube) /
        speed;
      const from = (p: V): number => Math.hypot(...sub(p, origin));
      return Math.max(
        from(centre) + radius,
        ...course.map((p): number => from(p) + tube),
        from(base) + travel + tube,
      );
    };
    return Object.assign(owns, { extent });
  }

  /**
   * Every dividing surface of the stored side.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each plane is a point and a normal built from joint centres by the rule its name states; the armscye is the supplied landmark surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list, one entry a surface; one rule serves both rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate is read off a fit or a render and no digit is named; a degenerate direction is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per surface.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The landmark surface is built once by the caller that also joins by it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closures retain a point and a normal each.
   * @evidence contracts/development/common.md#meaningful-documentation The namespace text states each rule.
   */
  export function create(input: IInput): ISurface[] {
    const { parts, reaches } = input;
    if (
      !Object.values(reaches).every(
        (reach): boolean => Number.isFinite(reach) && reach > 0,
      )
    )
      throw new Error(
        "divide: comparison reaches must be finite positive millimetres",
      );
    // A landmark surface divides inside the ball about its joint and, past it, inside the tube about its part's course.
    const landmarked = (
      name: string,
      group: string,
      near: string[],
      surface: ILandmarked,
    ): ISurface => ({
      name,
      group,
      near,
      far: [surface.part],
      side: surface.side,
      within: (p: V): boolean =>
        Math.hypot(...sub(p, surface.centre)) < surface.reach ||
        tubed(p, surface.course) < surface.tube,
      anchor: surface.centre,
      reach: surface.reach,
    });
    const out: ISurface[] = [
      landmarked("armscye", "shoulder", [parts.trunk], input.armscye),
    ];
    if (input.mammary !== undefined)
      out.push(landmarked("mammary", "chest", [parts.trunk], input.mammary));
    if (input.ear !== undefined)
      out.push(landmarked("ear.root", "ear", [parts.trunk], input.ear));
    // The hand: the arm's end plane, and the surface at the thumb's root.
    out.push({
      name: "wrist",
      group: "hand",
      near: [parts.arm],
      far: [parts.hand],
      side: plane(input.ends.wrist.point, input.ends.wrist.normal),
      anchor: input.ends.wrist.point,
      reach: reaches.wrist,
    });
    out.push(
      landmarked(
        "thumb.root",
        "hand",
        [parts.hand, ...input.fingers.map((d: IDigit): string => d.part)],
        input.thumb,
      ),
    );

    const row = (
      digits: readonly IDigit[],
      parent: string,
      end: IEnd,
      up: V,
      label: "hand" | "foot",
      web: number,
    ): void => {
      const axes: V[] = digits.map(
        (d: IDigit): V => unit(sub(d.second, d.first)),
      );
      out.push({
        name: "heads." + label,
        group: label,
        near: [parent],
        far: digits.map((d: IDigit): string => d.part),
        side: plane(end.point, end.normal),
        anchor: end.point,
        reach: reaches[label],
      });
      for (let i: number = 0; i + 1 < digits.length; ++i) {
        const [a, b]: IDigit[] = [digits[i]!, digits[i + 1]!];
        const centre: V = middle(a!.first, b!.first);
        out.push({
          name: `web.${a!.part}.${b!.part}`,
          group: label,
          near: [a!.part],
          far: [b!.part],
          side: plane(
            centre,
            toward(
              cross(unit(add(axes[i]!, axes[i + 1]!)), up),
              sub(b!.first, a!.first),
            ),
          ),
          anchor: centre,
          reach: web,
        });
      }
    };
    row(
      input.fingers,
      parts.hand,
      input.ends.hand,
      unit(
        cross(
          sub(input.fingers.at(-1)!.first, input.wrist),
          sub(input.fingers[0]!.first, input.wrist),
        ),
      ),
      "hand",
      reaches.fingerWeb,
    );
    row(
      input.toes,
      parts.leg,
      input.ends.foot,
      input.sole,
      "foot",
      reaches.toeWeb,
    );

    // The hip and the crotch.
    const level: number = (input.hip[1] + input.foot) / 2;
    out.push({
      name: "hip",
      group: "hip",
      near: [parts.trunk],
      far: [parts.leg],
      side: plane([0, level, 0], [0, -1, 0]),
      anchor: [0, level, input.hip[2]],
      reach: reaches.hip,
    });
    out.push({
      name: "crotch",
      group: "hip",
      near: [parts.twin],
      far: [parts.leg],
      side: plane([0, 0, 0], [0, 0, 1]),
      anchor: [0, input.foot, 0],
      reach: reaches.crotch,
    });
    return out;
  }

  /** A sampled boundary of the host's coverage by the original side source. */
  interface IFieldSide {
    kind: "start-plane" | "end-plane" | "wall" | "both-planes" | "no-section";
    value: number;
    before: number;
    after: number;
    child?: [number, number];
    addresses?: readonly { child: [number, number]; margin: number }[];
  }

  /** Direct diagnostic: one clock's observed sign boundaries, with both charts. */
  interface IFieldContactTrace {
    host: string;
    part: string;
    hostDomain: readonly [number, number];
    partDomain: readonly [number, number];
    centre: [number, number];
    semi: [number, number];
    clock: number;
    origin: IFieldSample;
    changes: readonly { left: IFieldSample; right: IFieldSample }[];
    limit: IFieldSample;
  }

  /** One exact diagnostic query on the host's skin. */
  interface IFieldSample {
    share: number;
    host: [number, number];
    world: V | null;
    side: IFieldSide | { kind: "host-start" | "host-end"; value: null };
  }

  /**
   * Locate the bust meridian on the actual relieved host from both original
   * chart-owned AP chord endpoints.
   */
  export function anteriorFeet(host: IAutoMovieViewPart, tolerance: number) {
    const bare = AutoMovieHumanGlutealParent.trunkOnly(host);
    if (typeof bare === "string") throw new Error(bare);
    const full = AutoMovieLoftViewFullSource.create(host);
    return (apex: V): { address: [number, number]; x: number } => {
      const chord = bare.chord(apex[1], apex[2]);
      if (typeof chord === "string" || chord.length !== 1)
        throw new Error(
          typeof chord === "string"
            ? chord
            : "the independent bust apex has no unique original parent AP chord",
        );
      const foot = (
        side: 1 | -1,
        s: number,
        phi: number,
      ): { address: [number, number]; x: number } => {
        for (let i = 0; i < AutoMovieConstructionSeeds.STEPS; ++i) {
          if (
            !(
              s > full.domain[0] &&
              s < full.domain[1] &&
              side * Math.cos(phi) > 0
            )
          )
            throw new Error(
              "the AP foot reaches its original material chart boundary",
            );
          const jet = full.jet(s, phi),
            y = jet.p[1] - apex[1],
            z = jet.p[2] - apex[2];
          const jacobian = jet.u[1] * jet.v[2] - jet.u[2] * jet.v[1];
          if (!(side * jacobian > 0 && Number.isFinite(jacobian)))
            throw new Error(
              "the full parent AP foot leaves its regular oriented source branch",
            );
          const miss = Math.hypot(y, z);
          if (miss <= tolerance) return { address: [s, phi], x: jet.p[0] };
          const ds = (z * jet.v[1] - y * jet.v[2]) / jacobian;
          const dp = (y * jet.u[2] - z * jet.u[1]) / jacobian;
          let moved = false;
          for (let step = 1; step >= Number.EPSILON; step /= 2) {
            const next = s + step * ds,
              angle = phi + step * dp;
            if (
              !(
                next > full.domain[0] &&
                next < full.domain[1] &&
                Math.abs(step * dp) < Math.PI &&
                side * Math.cos(angle) > 0
              )
            )
              continue;
            const p = full.point(next, angle);
            if (!(Math.hypot(p[1] - apex[1], p[2] - apex[2]) < miss)) continue;
            s = next;
            phi = angle;
            moved = true;
            break;
          }
          if (!moved)
            throw new Error(
              "the full parent wall has no decreasing AP correction on this material branch",
            );
        }
        throw new Error(
          "the bounded AP localization did not converge on the full parent wall",
        );
      };
      const back = foot(-1, chord[0]!.back.station, chord[0]!.back.phase);
      const front = foot(1, chord[0]!.front.station, chord[0]!.front.phase);
      if (!(back.x < front.x))
        throw new Error("the full parent has no ordered anterior AP foot");
      return front;
    };
  }

  /**
   * Locate the registered bust apex on the forward full AP wall and measure its
   * positive projection.
   */
  export function apGerm(
    host: IAutoMovieViewPart,
    apex: V,
    tolerance: number,
  ): [number, number] {
    const front = anteriorFeet(host, tolerance)(apex);
    if (!(front.x < apex[0]))
      throw new Error(
        "the full parent wall has no positive projection to the authored bust apex",
      );
    return front.address;
  }

  /**
   * Select a closed physical breast contact on the original anterior host,
   * registered by the lower-lateral breast fan.
   */
  export function mammaryGerm(
    host: IAutoMovieViewPart,
    child: IAutoMovieViewPart,
    root: V,
    tip: V,
    fan: V,
    count: number,
    tolerance: number,
    grazing: number,
  ) {
    const front = anteriorFeet(host, tolerance);
    if (!(front(tip).x < tip[0]))
      throw new Error(
        "the actual front wall has no positive projection to the registered apex",
      );
    const axis = unit(sub(tip, root)),
      datum = sub(fan, root);
    const radial = unit(
      sub(datum, [
        axis[0] * dot(datum, axis),
        axis[1] * dot(datum, axis),
        axis[2] * dot(datum, axis),
      ]),
    );
    const transverse = cross(axis, radial);
    const p = AutoMovieLoftViewFullSource.create(child),
      h = AutoMovieLoftViewFullSource.create(host);
    const mid: number = (p.domain[0] + p.domain[1]) / 2,
      frame = child.axis.at(mid);
    const phase: number = Math.atan2(
      dot(radial, frame.v),
      dot(radial, frame.u),
    );
    const phases: number[] = [0, 1, 2, 3].map(
      (k): number => phase + (Math.PI * k) / 2,
    );
    const anterior = (q: V): boolean =>
      Math.abs(q[0] - front(q).x) <= tolerance;
    try {
      return AutoMovieHumanJoinLoop.originalGerm(
        host,
        child,
        phases,
        count,
        tolerance,
        grazing,
        (seed): boolean => anterior(h.point(seed.y, seed.theta)),
        (curve): boolean => {
          if (!curve.points.every((q): boolean => anterior(q.point)))
            return false;
          // A fan meridian selects a material side. The skin datum itself need not be an intersection point.
          return curve.points.some((a, i): boolean => {
            const b = curve.points[(i + 1) % curve.points.length]!;
            const side = (q: V): number => dot(sub(q, root), transverse);
            let lo: number = a.t,
              hi: number =
                i + 1 === curve.points.length
                  ? curve.points[0]!.t + 2 * Math.PI
                  : b.t;
            let left = a,
              right = b;
            if (side(left.point) * side(right.point) > 0) return false;
            for (let j: number = 0; j < AutoMovieConstructionSeeds.STEPS; ++j) {
              const t: number = lo + (hi - lo) / 2;
              if (!(t > lo && t < hi)) break;
              const middle = curve.at(t);
              if (middle === null) return false;
              if (side(left.point) * side(middle.point) <= 0) {
                right = middle;
                hi = t;
              } else {
                left = middle;
                lo = t;
              }
            }
            const q =
              Math.abs(side(left.point)) <= Math.abs(side(right.point))
                ? left
                : right;
            return (
              Math.abs(side(q.point)) <= tolerance &&
              dot(sub(q.point, root), radial) > 0
            );
          });
        },
      );
    } catch (error: unknown) {
      const axial = [
        ...new Set([
          p.domain[0],
          ...child.stations.filter(
            (s): boolean => s > p.domain[0] && s < p.domain[1],
          ),
          p.domain[1],
        ]),
      ]
        .sort((a, b): number => a - b)
        .map((s) => {
          const q = child.axis.at(s).origin;
          try {
            return { s, gapMm: q[0] - front(q).x };
          } catch (fault: unknown) {
            return {
              s,
              unavailable:
                fault instanceof Error ? fault.message : String(fault),
            };
          }
        });
      throw new Error(
        (error instanceof Error ? error.message : String(error)) +
          "; registered root/apex/fan and sampled anterior axial gaps " +
          JSON.stringify({ root, tip, fan, axial }),
      );
    }
  }

  /**
   * The actual host-chart attachment of a side part whose own axial chart can
   * cross the host more than once, such as the plate of an ear.
   *
   * The supplied landmark names the medial component. Its chart address must
   * stand inside the actual part. Each radial host ray must leave that same
   * covered component once within the projected part footprint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the authored seed, the source charts and the covered component premise.
   * @evidence contracts/development/implementation.md#principled-implementation The host ray crosses the radial inside test of the actual part, with its station solved on that part's own section frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The seed, bounded chart and single-interval coverage must admit; the routine does not substitute a recorded perimeter.
   */
  export function fieldContact(
    host: IAutoMovieViewPart,
    part: IAutoMovieViewPart,
    site: V,
    count: number,
    trace?: (row: IFieldContactTrace) => void,
    placedCourse?: { family: IAutoMovieHumanConicLoft.IFamily; translation: V },
    tolerance: number = 1e-3,
    observe?: (host: [number, number], child: [number, number]) => void,
    germ?: [number, number],
    grazing?: number,
    onComponent?: (world: V, child: [number, number]) => boolean,
  ): AutoMovieHumanJoinLoop.IContact {
    const h = AutoMovieLoftViewFullSource.create(host);
    const p = AutoMovieLoftViewFullSource.create(part);
    const certified =
      placedCourse === undefined
        ? undefined
        : AutoMovieHumanJoinLoop.certifiedAddresses(
            part,
            p.domain,
            placedCourse.family,
            placedCourse.translation,
          );
    if (certified !== undefined && (part.reliefs?.length ?? 0) > 0)
      throw new Error(
        part.name +
          " attachment needs a certified radial section, without displaced rays",
      );
    const middle = (domain: readonly [number, number]): number =>
      (domain[0] + domain[1]) / 2;
    const centre =
      germ ??
      AutoMovieHumanJoinLoop.address(host, h.domain, site, middle(h.domain));
    if (
      !(
        centre[0] > h.domain[0] &&
        centre[0] < h.domain[1] &&
        centre.every(Number.isFinite)
      )
    )
      throw new Error(
        part.name + " attachment has no interior source chart germ",
      );
    const near = (angle: number): number =>
      Math.atan2(Math.sin(angle - centre[1]), Math.cos(angle - centre[1]));
    const semi: [number, number] = [0, 0];
    let guess: number = centre[0];
    // Bound the chart search by projections of the part's own outlines.
    // The measured crossing and its uniqueness are still checked on the host.
    for (let i: number = 0; i <= 8; ++i) {
      const s: number = p.domain[0] + ((p.domain[1] - p.domain[0]) * i) / 8;
      for (let j: number = 0; j < 16; ++j) {
        const world: number[] = p.point(s, (2 * Math.PI * j) / 16);
        const [station, phase] = AutoMovieHumanJoinLoop.address(
          host,
          h.domain,
          world,
          guess,
        );
        guess = station;
        semi[0] = Math.max(semi[0], Math.abs(station - centre[0]));
        semi[1] = Math.max(semi[1], Math.abs(near(phase)));
      }
    }
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI / 2))
      throw new Error(part.name + " attachment has no bounded host chart");
    const outward = (at: number, world: V): number => {
      const frame: IAutoMovieLoftSectionFrame = part.axis.at(at);
      return dot(
        sub(world, [...frame.origin]),
        cross([...frame.v], [...frame.u]),
      );
    };
    const partAddress = (world: V): [number, number] =>
      AutoMovieHumanJoinLoop.address(part, p.domain, world, middle(p.domain));
    const margin = (world: V, child: [number, number]): number => {
      const origin: V = [...part.axis.at(child[0]).origin];
      const boundary: V = p.point(...child);
      return (
        Math.hypot(...sub(world, origin)) - Math.hypot(...sub(boundary, origin))
      );
    };
    const read = (world: V): IFieldSide => {
      const before: number = outward(p.domain[0], world);
      const after: number = outward(p.domain[1], world);
      if (certified !== undefined) {
        const rows: { child: [number, number]; margin: number }[] = certified(
          world,
        ).map((child): { child: [number, number]; margin: number } => ({
          child,
          margin: margin(world, child),
        }));
        const occupied = rows.filter((row): boolean => row.margin <= 0);
        if (occupied.length > 1)
          throw new Error(
            part.name +
              " attachment has competing occupied sections at [" +
              world.join(", ") +
              "] mm: " +
              occupied
                .map(
                  (row): string =>
                    row.child.join(",") + " margin " + row.margin + " mm",
                )
                .join("; "),
          );
        if (rows.length === 0)
          return {
            kind: "no-section",
            value: 1,
            before,
            after,
            addresses: rows,
          };
        const addresses = trace === undefined ? {} : { addresses: rows };
        const own = occupied[0];
        return own === undefined
          ? {
              kind: "wall",
              value: Math.min(...rows.map((row): number => row.margin)),
              before,
              after,
              ...addresses,
            }
          : {
              kind: "wall",
              value: own.margin,
              before,
              after,
              child: own.child,
              ...addresses,
            };
      }
      if (before < 0 || after > 0)
        return {
          kind:
            before < 0 && after > 0
              ? "both-planes"
              : before < 0
                ? "start-plane"
                : "end-plane",
          value: Math.max(-before, after),
          before,
          after,
        };
      const child = partAddress(world);
      return {
        kind: "wall",
        value: margin(world, child),
        before,
        after,
        child,
      };
    };
    const side = (world: V): number => read(world).value;
    if (!(Number.isFinite(tolerance) && tolerance > 0))
      throw new Error(
        part.name +
          " attachment needs its existing positive boundary tolerance",
      );

    /**
     * At the actual crossing require one direct source boundary, not an
     * endpoint-domain sign change.
     */
    function boundary(world: V, clock: number): [number, number] {
      const addresses: [number, number][] =
        certified === undefined ? [partAddress(world)] : certified(world);
      const candidates: [number, number][] = addresses.filter(
        (child): boolean =>
          child[0] > p.domain[0] &&
          child[0] < p.domain[1] &&
          Math.hypot(...sub(world, p.point(...child))) <= tolerance,
      );
      if (candidates.length !== 1)
        throw new Error(
          part.name +
            " attachment has " +
            candidates.length +
            " regular source boundaries at clock " +
            clock,
        );
      if (onComponent !== undefined && !onComponent(world, candidates[0]!))
        throw new Error(
          part.name +
            " attachment leaves its registered connected source branch at clock " +
            clock,
        );
      return candidates[0]!;
    }

    if (certified !== undefined) {
      const inside = read(h.point(...centre));
      if (
        !(
          inside.kind === "wall" &&
          inside.value < 0 &&
          inside.child !== undefined
        )
      )
        throw new Error(
          part.name + " attachment has no uniquely occupied regular host germ",
        );
    }
    const shape: number[] | string = AutoMovieHumanSkinCutLoop.shares({
      point: (s: number, phase: number): V => h.point(s, phase) as V,
      centre,
      semi,
      sense: 1,
      count,
      side,
      reach: 2,
    });
    if (trace !== undefined) {
      for (let k: number = 0; k < count; ++k) {
        const clock: number = (2 * Math.PI * k) / count;
        const sample = (share: number): IFieldSample => {
          const host: [number, number] = [
            centre[0] + semi[0] * share * Math.cos(clock),
            centre[1] + semi[1] * share * Math.sin(clock),
          ];
          if (host[0] < h.domain[0] || host[0] > h.domain[1])
            return {
              share,
              host,
              world: null,
              side: {
                kind: host[0] < h.domain[0] ? "host-start" : "host-end",
                value: null,
              },
            };
          const world: V = h.point(...host) as V;
          return { share, host, world, side: read(world) };
        };
        const start: IFieldSample = sample(0);
        const changes: { left: IFieldSample; right: IFieldSample }[] = [];
        const first: number | undefined =
          typeof shape === "string" ? undefined : shape[k];
        // Keep the regular first-crossing grid, the exact chosen share, and the ordinary post-crossing guard stations.
        const shares: number[] = Array.from(
          { length: 256 },
          (_: unknown, i: number): number => (2 * (i + 1)) / 256,
        );
        if (first !== undefined)
          shares.push(
            first,
            ...Array.from(
              { length: 128 },
              (_: unknown, i: number): number =>
                first + ((2 - first) * (i + 1)) / 128,
            ),
          );
        const state = (row: IFieldSample): string =>
          row.side.kind +
          ":" +
          (row.side.value === null
            ? "unavailable"
            : Math.sign(row.side.value).toString());
        let prior: IFieldSample = start;
        for (const share of [...new Set(shares)].sort(
          (a: number, b: number): number => a - b,
        )) {
          const next: IFieldSample = sample(share);
          if (state(prior) !== state(next)) {
            let [left, right]: [IFieldSample, IFieldSample] = [prior, next];
            const initial: string = state(left);
            for (let i: number = 0; i < 40; ++i) {
              const middle: number = (left.share + right.share) / 2;
              if (middle === left.share || middle === right.share) break;
              const at: IFieldSample = sample(middle);
              if (state(at) === initial) left = at;
              else right = at;
            }
            changes.push({ left, right });
          }
          prior = next;
        }
        trace({
          host: host.name,
          part: part.name,
          hostDomain: h.domain,
          partDomain: p.domain,
          centre,
          semi,
          clock,
          origin: start,
          changes,
          limit: prior,
        });
      }
    }
    if (typeof shape === "string")
      throw new Error(part.name + " attachment: " + shape);
    for (let k: number = 0; k < count; ++k) {
      const clock: number = (2 * Math.PI * k) / count;
      for (let step: number = 1; step <= 128; ++step) {
        const share: number = shape[k]! + ((2 - shape[k]!) * step) / 128;
        if (
          side(
            h.point(
              centre[0] + semi[0] * share * Math.cos(clock),
              centre[1] + semi[1] * share * Math.sin(clock),
            ) as V,
          ) < 0
        )
          throw new Error(
            part.name +
              " attachment has a second covered interval at clock " +
              clock,
          );
      }
    }
    const hostSeed: [number, number] = [
      centre[0] + shape[0]! * semi[0],
      centre[1],
    ];
    const world: number[] = h.point(...hostSeed);
    const partSeed: [number, number] = boundary(world as V, 0);
    const usedPhases: number[] = [];
    const materialFeet: [number, number][] = [];
    const gap: number = Math.hypot(...sub(world as V, p.point(...partSeed)));
    for (let k: number = 0; k < count; ++k) {
      const clock: number = (2 * Math.PI * k) / count;
      const hostAddress: [number, number] = [
        centre[0] + semi[0] * shape[k]! * Math.cos(clock),
        centre[1] + semi[1] * shape[k]! * Math.sin(clock),
      ];
      const childAddress: [number, number] =
        k === 0 ? partSeed : boundary(h.point(...hostAddress), k);
      const distance: number = AutoMovieHumanJoinLoop.columnGap(
        h,
        p,
        hostAddress,
        childAddress,
      );
      if (!(distance <= tolerance))
        throw new Error(
          part.name + " physical gap at clock " + k + " is " + distance + " mm",
        );
      usedPhases.push(childAddress[1]);
      materialFeet.push(childAddress);
      if (grazing === undefined) observe?.(hostAddress, childAddress);
    }
    const contact: AutoMovieHumanJoinLoop.IContact = {
      loop: {
        centre: [centre[0] / 1000, centre[1]],
        semi: [semi[0] / 1000, semi[1]],
        sense: 1,
        shape,
      },
      host: [hostSeed[0] / 1000, hostSeed[1]],
      part: [partSeed[0] / 1000, partSeed[1]],
      gap,
      stations: [],
    };
    if (grazing !== undefined) {
      // A side patch may close in one local child chart without winding once around the entire child.
      // The actual mixed operator determines its closed material feet and their fold/smooth sector.
      return AutoMovieHumanJoinLoop.shared(
        host,
        part,
        contact,
        count,
        tolerance,
        grazing,
        (a, _b, k, actual): void => {
          const expected = Number.isInteger(k)
            ? materialFeet[k]!
            : boundary(a, k);
          const jet = p.jet(...expected);
          const ds = actual[0] - expected[0],
            dt = Math.atan2(
              Math.sin(actual[1] - expected[1]),
              Math.cos(actual[1] - expected[1]),
            );
          if (
            !(
              Math.hypot(
                ...jet.u.map((v, i): number => ds * v + dt * jet.v[i]!),
              ) <= tolerance
            )
          )
            throw new Error(
              part.name +
                " lost the unique occupied child chart along its traced component at clock " +
                k,
            );
        },
        observe,
      );
    }
    const increments: number[] = usedPhases.map(
      (phase: number, k: number): number => {
        const difference: number = usedPhases[(k + 1) % count]! - phase;
        return Math.atan2(Math.sin(difference), Math.cos(difference));
      },
    );
    const direction: number = Math.sign(increments[0]!);
    const turns: number =
      increments.reduce(
        (sum: number, delta: number): number => sum + delta,
        0,
      ) /
      (2 * Math.PI);
    if (
      direction === 0 ||
      increments.some(
        (delta: number): boolean =>
          direction * delta <= 0 || Math.abs(delta) >= Math.PI,
      ) ||
      Math.round(turns) !== direction
    )
      throw new Error(
        part.name + " physical child phases do not make one directed turn",
      );
    return contact;
  }

  /**
   * How far a point stands outside a part's own skin, mm, positive outside: the
   * greatest of the part's surfaces' distances past them on the neighbour's
   * side, each read inside its region; outside a surface's region its near
   * parts keep the point and its far parts do not. A part no surface names
   * keeps everything.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A part keeps the intersection of its sides; the greatest signed distance to a neighbour's side is positive exactly outside that intersection.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and one maximum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same closures serve both neighbours, with opposite signs and no margin.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the surfaces that name the part.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The surfaces are filtered once per part.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure borrows the surfaces.
   * @evidence contracts/development/common.md#meaningful-documentation States the sign and the unit.
   */
  export function outside(
    surfaces: readonly ISurface[],
    name: string,
  ): (p: V) => number {
    const mine: { surface: ISurface; sign: number }[] = surfaces.flatMap(
      (surface: ISurface): { surface: ISurface; sign: number }[] =>
        surface.near.includes(name)
          ? [{ surface, sign: 1 }]
          : surface.far.includes(name)
            ? [{ surface, sign: -1 }]
            : [],
    );
    return (p: V): number =>
      Math.max(
        -Infinity,
        ...mine.map(
          ({ surface, sign }: { surface: ISurface; sign: number }): number =>
            surface.within === undefined || surface.within(p)
              ? sign * surface.side(p)
              : sign < 0
                ? Infinity
                : -Infinity,
        ),
      );
  }
}
