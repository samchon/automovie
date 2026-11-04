import { AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadEarFrame } from "./AutoMovieHumanHeadEarFrame";
import { AutoMovieHumanHeadEarPlate } from "./AutoMovieHumanHeadEarPlate";
import { AutoMovieHumanHeadEarRidge } from "./AutoMovieHumanHeadEarRidge";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";

/**
 * Each auricle and the parts inside it, in the ear's own frame
 * (`AutoMovieHumanHeadEarFrame`):
 *
 * | Part | Parent | Join | Size from |
 * | --- | --- | --- | --- |
 * | auricle | head mass | merge | `ear.length` along the long axis, `ear.breadth` across, `ear.protrusion` out |
 * | helix | auricle | merge | curved course through the source plate's attachment, top and posterior guides; retained breadth-scaled ridge section |
 * | antihelix and two crura | auricle | merge | three source courses with an explicit fork; retained breadth-scaled sections and inward distances |
 * | concha | auricle | diff | Cho g-h/b-k reference means and Zhu rim-plane depth, placed in the source plate's own plane |
 *
 * Retained relief/course offsets use breadth/31, as their original consumer
 * did. The source courses, oval conchal rim and along placement remain
 * declared modelling conventions, not individual survey predictions.
 * Zhu's female depth means are not a sex-specific law for all adults.
 * Tragus, antitragus, canal trim and lining remain unbuilt requirements.
 */
export namespace AutoMovieHumanHeadEarParts {
  /** Depth of a part's base inside its parent, mm. */
  export const INSET: number = 1.5;

  /**
   * Both auricles and their parts.
   *
   * @param plan The landmark skeleton.
   * @param ears The two auricles' inputs, world mm.
   * @param tops Each auricle's top height, calibration mm, from its published place over the tragion.
   */
  export function of(
    plan: IAutoMovieHumanHeadLayout,
    mass: IAutoMovieViewPart,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    tops?: { left: number; right: number },
  ): AutoMovieHumanHeadFeatures.IFeature[] {
    const prior: AutoMovieHumanHeadPrior.IEar = AutoMovieHumanHeadPrior.PRIOR.ear;
    const k: number = plan.scale;
    const out: AutoMovieHumanHeadFeatures.IFeature[] = [];
    for (const sign of [1, -1] as const) {
      const side: string = sign > 0 ? "left" : "right";
      const f: AutoMovieHumanHeadEarFrame.IFrame = AutoMovieHumanHeadEarFrame.of(plan, mass, sign, sign > 0 ? ears.left : ears.right, tops === undefined ? undefined : sign > 0 ? tops.left : tops.right);
      const s: number = f.scale * k;
      const auricle: string = `auricle.${side}`;

      const plate: AutoMovieHumanHeadEarPlate.IOutput = AutoMovieHumanHeadEarPlate.of(plan, mass, f, side);
      out.push({ part: plate.part, view: plate.view, join: "merge", seed: plate.point(plate.tragion, false), contact: plate.tragion, size: [f.length, f.breadth / 2], parent: "head.mass", elongated: true });
      const low: number = plate.bottom;
      const high: number = plate.top;
      const end: number = low + prior.lobeFrom * (high - low) / 2;
      const helixCourse: [number, number, number][] = insetHelix([plate.point(plate.attachment, false), plate.point(high, true), plate.point(plate.attachment, true), plate.point(plate.tragion, true), plate.point((plate.tragion + end) / 2, true), plate.point(end, true)], plate, prior.helix[0]! * s / 2);
      /** A ridge follows the source course; its attachment failure remains visible to the tree. */
      const ridge: (name: string, course: [number, number, number][], row: readonly number[], ports?: { start?: string; end?: string }) => void = (name: string, course: [number, number, number][], row: readonly number[], ports: { start?: string; end?: string } = {}): void => {
        const height: number = row[0]! * s / 2;
        const width: number = row[2]! * s / 2;
        out.push({ part: AutoMovieHumanHeadEarRidge.of(`${name}.${side}`, course, plate.normal, height, width, ports), join: "merge", seed: course[Math.floor(course.length / 2)]!, contact: 0, size: [height * 2, width], parent: auricle, elongated: true });
      };
      ridge("ear.helix", helixCourse, prior.helix);
      /** The retained inward distance is a breadth-scaled offset from the posterior course, not a shortened straight oval. */
      const inner: (a: number, inward: number) => [number, number, number] = (a: number, inward: number): [number, number, number] => plate.point(a, true).map((v: number, i: number): number => v - inward * plate.across[i]!) as [number, number, number];
      const offset: number = prior.antihelix[1]! * s;
      const fork: number = (plate.tragion + plate.attachment) / 2;
      const forkPoint: [number, number, number] = inner(fork, offset);
      ridge("ear.antihelix", [inner(end, offset), inner(plate.tragion, offset), forkPoint], prior.antihelix, { end: `ear.fork.${side}` });
      ridge("ear.crus.superior", [forkPoint, inner((fork + high) / 2, offset), inner(high - prior.helix[1]! * s, offset)], prior.antihelix, { start: `ear.fork.${side}` });
      ridge("ear.crus.inferior", [forkPoint, inner(plate.attachment, offset + prior.helix[1]! * s), plate.point(plate.attachment, false)], prior.antihelix, { start: `ear.fork.${side}` });

      // The concha's rim plane belongs to this source plate. Cho's g-h/b-k
      // dimensions are separate from ear breadth; Zhu's rim-plane-to-floor
      // depth is separate from scalp protrusion. The oval rim and the
      // retained along/width placement below are modelling conventions.
      const c: readonly number[] = prior.concha;
      const along: number = (low + high) / 2 + c[2]! * (high - low);
      const front: [number, number, number] = plate.point(along, false);
      const back: [number, number, number] = plate.point(along, true);
      const outward: [number, number, number] = plate.normal.map((v: number): number => v * (plate.normal.reduce((sum: number, x: number, i: number): number => sum + x * f.n[i]!, 0) > 0 ? 1 : -1)) as [number, number, number];
      const dot: number = f.a.reduce((sum: number, value: number, i: number): number => sum + value * outward[i]!, 0);
      const projected: [number, number, number] = f.a.map((value: number, i: number): number => value - dot * outward[i]!) as [number, number, number];
      const norm: number = Math.hypot(...projected);
      if (!(norm > 0 && Number.isFinite(norm))) throw new Error("Concha long direction has no projection into its own rim plane");
      const conchalAlong: [number, number, number] = projected.map((value: number): number => value / norm) as [number, number, number];
      const rim: [number, number, number] = front.map((v: number, i: number): number => v + c[1]! * (back[i]! - v) + prior.rim * s * outward[i]!) as [number, number, number];
      const feminine: boolean = plan.sex === 1;
      const length: number = (feminine ? sign > 0 ? 27.0 : 27.4 : 28.0) * k;
      const breadth: number = (feminine ? sign > 0 ? 18.2 : 18.1 : sign > 0 ? 18.7 : 18.8) * k;
      const depth: number = (sign > 0 ? 9.65 : 9.53) * k;
      out.push(
        part(`ear.concha.${side}`, auricle, "diff", rim.map((v: number, i: number): number => v + INSET * outward[i]!) as [number, number, number], outward.map((v: number): number => -v) as [number, number, number], conchalAlong,
          [length / 2, breadth / 2, length / 2, breadth / 2], INSET + depth, 2, rim),
      );
    }
    return out;
  }

  /**
   * The plate boundary is the outside rim, not a tube centreline. Offset
   * the retained circular helix inward by its existing radius. The upper
   * source control then solves the exact natural-axis height bound T-R;
   * this is a public anatomical envelope, never a reference or mesh fit.
   * Original guide observations still judge the whole resulting course.
   *
   * @evidence contracts/common.md#principled-implementation Places the circular ridge inside its supplied rim and bounds its original natural course against the selected superaurale height minus that same radius.
   * @evidence contracts/common.md#clear-and-simple-design One source-control solve uses the engine's actual scalar owner and the ridge's cumulative-chord parameter.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no radius, skin patch, reference displacement, endpoint clamp or new spline implementation.
   * @evidence contracts/common.md#meaningful-documentation Separates outer boundary, offset centreline, prior radius and source-envelope constraint from final join success.
   * @evidence contracts/performance.md#efficient-algorithms At most sixty-four fixed-size scalar preparations and bounded-degree critical-point reads; no loft or mesh is used by the solve.
   * @evidence contracts/performance.md#reuse-equivalent-work Uses the same engine natural source and cumulative chord convention as the ridge axis.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned small course survives; scalar preparations are call-local.
   */
  function insetHelix(boundary: [number, number, number][], plate: AutoMovieHumanHeadEarPlate.IOutput, radius: number): [number, number, number][] {
    const middle: number = (plate.top + plate.bottom) / 2;
    const front: [number, number, number] = plate.point(middle, false);
    const back: [number, number, number] = plate.point(middle, true);
    const inside: [number, number, number] = front.map((value: number, i: number): number => (value + back[i]!) / 2) as [number, number, number];
    const course: [number, number, number][] = boundary.map((point: [number, number, number], i: number): [number, number, number] => {
      if (i === 1) return [point[0], point[1] - radius, point[2]];
      const before: [number, number, number] = boundary[Math.max(0, i - 1)]!;
      const after: [number, number, number] = boundary[Math.min(boundary.length - 1, i + 1)]!;
      const tangent: [number, number, number] = after.map((value: number, k: number): number => value - before[k]!) as [number, number, number];
      const n: [number, number, number] = plate.normal;
      const inward: [number, number, number] = [n[1] * tangent[2] - n[2] * tangent[1], n[2] * tangent[0] - n[0] * tangent[2], n[0] * tangent[1] - n[1] * tangent[0]];
      const length: number = Math.hypot(...inward);
      if (!(length > 0)) throw new Error("Helix boundary has no inward course direction");
      const sign: number = inward.reduce((sum: number, value: number, k: number): number => sum + value * (inside[k]! - point[k]!), 0) >= 0 ? 1 : -1;
      return point.map((value: number, k: number): number => value + sign * radius * inward[k]! / length) as [number, number, number];
    });
    const maximum: () => number = (): number => {
      const stations: number[] = [0];
      for (let i: number = 1; i < course.length; i++) stations.push(stations[i - 1]! + Math.hypot(...course[i]!.map((value: number, k: number): number => value - course[i - 1]![k]!)));
      const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({ knots: course.map((point: [number, number, number], i: number): IAutoMovieViewPart.IKnot => ({ site: `helix.course.${i}`, station: stations[i]!, value: point[1] })) });
      if ("detail" in source) throw new Error(`Helix height source: ${source.detail}`);
      return Math.max(...[...stations, ...AutoMovieViewOutline.criticalStations(source)].map((station: number): number => {
        const value: number | string = AutoMovieViewOutline.value(source, station);
        if (typeof value === "string") throw new Error(`Helix height source: ${value}`);
        return value;
      }));
    };
    const limit: number = plate.top - radius;
    if (maximum() > limit) {
      let high: number = course[1]![1];
      let low: number = Math.max(...course.filter((_: [number, number, number], i: number): boolean => i !== 1).map((point: [number, number, number]): number => point[1]));
      course[1]![1] = low;
      if (maximum() > limit) throw new Error("Helix source cannot fit its declared upper envelope with the retained neighbours");
      for (let i: number = 0; i < 64; i++) {
        const middle: number = (low + high) / 2;
        course[1]![1] = middle;
        if (maximum() > limit) high = middle;
        else low = middle;
      }
      course[1]![1] = low;
    }
    return course;
  }

  /** One ear part. */
  function part(
    name: string,
    parent: string,
    join: "merge" | "diff",
    origin: [number, number, number],
    outward: [number, number, number],
    along: [number, number, number],
    extents: [number, number, number, number],
    height: number,
    profile: number,
    seed: [number, number, number],
    host?: number,
  ): AutoMovieHumanHeadFeatures.IFeature {
    const h: number = Math.max(INSET + 0.5, height);
    const e: [number, number, number, number] = extents.map((x: number): number => Math.max(0.5, Math.abs(x))) as [number, number, number, number];
    return {
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents: e, height: h, profile, shoulder: AutoMovieViewSection.ELLIPSE, ...(host === undefined ? {} : { host }) }),
      join,
      seed,
      contact: INSET,
      size: [h - INSET, Math.min(...e)],
      parent,
      elongated: Math.max(...e) > 2 * Math.min(...e),
    };
  }
}
