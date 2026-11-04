import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftAperture } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveConstants } from "./HumanCurveConstants";
import { HumanCurveVector } from "./HumanCurveVector";

type V3 = [number, number, number];
const { faceProfile, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { BASE_STATURE, FACET, FACET_ACROSS, FACET_BACK, FACET_BELOW, FACET_MOUTH, JAW_ABOVE_NECK, JAW_BAND, JAW_PLACES, JAW_SAMPLE, JAW_SPAN, JAW_TURN, PIT }: typeof HumanCurveConstants = HumanCurveConstants;
const { clamp, distance, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;

/** The rules of the jaw and the head's mesh. */
export namespace HumanCurveJaw {
  /**
   * The mandible's border is an edge the skin turns under, toward the neck: at the
   * face's steepest fall below the cheek, the profile turns within a radius. A
   * lower face rolling into the neck over a wide radius is a bag with no jaw.
   *
   * The places are shares of the mandible's own half-width, as a jaw is
   * measured: a share of the head's width read a jaw narrower than the cheeks
   * outside its own angle, on the cheek's taper.
   */
  export function auditJaw(
    body: IAutoMovieHumanBodyCalibration,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
    mandible: number | undefined,
  ): void {
    const lower: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head.lower",
    );
    if (lower === undefined) return;
    const bottom: number = lower.layers[0]!.y;
    const top: number = lower.layers[lower.layers.length - 1]!.y;
    const half: number =
      mandible ??
      Math.max(...AutoMovieHumanLoftChain.ring(lower, top, uniform(720)).map((p: V3): number => Math.abs(p[2])));
    const from: number = bottom + JAW_ABOVE_NECK * (top - bottom);
    for (const share of JAW_PLACES) {
      const line: [number, number][] = faceProfile(body, share * half, from, top);

      // The turn under is where the skin falls back fastest with height.
      let turn: number = -1;
      let steepest: number = 0;
      for (let i: number = 0, j: number = 0; i < line.length; i++) {
        while (line[i]![0] - line[j]![0] > JAW_SPAN) j++;
        const dy: number = line[i]![0] - line[j]![0];
        if (dy <= 0) continue;
        const slope: number = (line[i]![1] - line[j]![1]) / dy;
        if (slope > steepest) {
          steepest = slope;
          turn = j;
        }
      }
      if (turn < 0) continue;

      // The border's own radius: the sharpest convex turn about the turn under.
      const k: number = body.stature / BASE_STATURE;
      const centre: number = line[turn]![0];
      const points: [number, number][] = [];
      for (const p of line) {
        if (Math.abs(p[0] - centre) > JAW_BAND * k) continue;
        const last: [number, number] | undefined = points[points.length - 1];
        if (last === undefined || Math.hypot(p[0] - last[0], p[1] - last[1]) >= JAW_SAMPLE * k) points.push(p);
      }
      let least: number = Infinity;
      let at: [number, number] = line[turn]!;
      for (let i: number = 1; i + 1 < points.length; i++) {
        const a: [number, number] = points[i - 1]!;
        const b: [number, number] = points[i]!;
        const c: [number, number] = points[i + 1]!;
        const d1: [number, number] = [b[0] - a[0], b[1] - a[1]];
        const d2: [number, number] = [c[0] - b[0], c[1] - b[1]];
        const bend: number = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
        if (bend >= 0) continue;
        const radius: number = (Math.hypot(...d1) + Math.hypot(...d2)) / 2 / -bend;
        if (radius < least) {
          least = radius;
          at = b;
        }
      }
      const limit: number = JAW_TURN * k;
      if (least > limit) report("head.lower", "jaw", `under the jaw at ${share} of its half-width`, least, limit, [at[1], at[0], share * half]);
    }
  }

  /**
   * The head's skin as the viewer shades it, about the jaw and the nostrils.
   *
   * - `facet`: across one cell of the skin along the mandible's border, the
   *   shading normal turns by more than {@link FACET}. Where the sections run
   *   nearly along the jaw's underside, a turn the layers cannot carry falls
   *   between two of them and shades as a row of facets, though every curve
   *   rule reads the layers themselves as sound.
   * - `pit`: across one cell of a nostril's closure where it shows through the
   *   opening, or from it to the skin round it, the shading normal turns by
   *   more than {@link PIT}: the walls shade as the white streaks of a fringe.
   */
  export function auditHeadMesh(
    body: IAutoMovieHumanBodyCalibration,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
    mandible: number | undefined,
  ): void {
    const owned: RegExp = /^head\.(lower|middle)$/;
    const nostrils: IAutoMovieHumanLoftAperture[] = body.apertures.filter((a: IAutoMovieHumanLoftAperture): boolean =>
      /^nostril\./.test(a.name),
    );
    const lower: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head.lower",
    );
    if (lower === undefined || nostrils.length === 0) return;
    const out: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate({
      ...body,
      chains: body.chains.filter((c: IAutoMovieHumanLoftChain): boolean => owned.test(c.name)),
      events: body.events
        .filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned.test(e.parent))
        .map((e: IAutoMovieHumanBodyCalibration.IEvent): IAutoMovieHumanBodyCalibration.IEvent => ({
          ...e,
          splits: e.splits.filter((s: IAutoMovieHumanBodyCalibration.ISplit): boolean => owned.test(s.child)),
        })),
      poles: [],
      apertures: nostrils,
      eyes: [],
      appendages: undefined,
    });
    const p: number[] = out.mesh.positions;
    const n: number[] = out.normals;
    const c: number[] = out.coordinates;
    const size: number = p.length / 3;

    // A vertex's position, whether it is skin (it has surface coordinates), and
    // the angle between two vertices' normals, degrees.
    const at: (v: number) => V3 = (v: number): V3 => [p[3 * v]!, p[3 * v + 1]!, p[3 * v + 2]!];
    const skin: (v: number) => boolean = (v: number): boolean => Number.isFinite(c[3 * v]!);
    const turn: (a: number, b: number) => number = (a: number, b: number): number =>
      (Math.acos(clamp(n[3 * a]! * n[3 * b]! + n[3 * a + 1]! * n[3 * b + 1]! + n[3 * a + 2]! * n[3 * b + 2]!)) * 180) / Math.PI;

    // The jaw's border: below the nose, about the mandible's own half-width,
    // ahead of the lower head's axis.
    const step: number = 2 * nostrils[0]!.order + 1;
    const nose: number = nostrils[0]!.coefficients[step]!;
    const k: number = body.stature / BASE_STATURE;
    const half: number =
      mandible ??
      Math.max(
        ...AutoMovieHumanLoftChain.ring(lower, lower.layers[lower.layers.length - 1]!.y, uniform(720)).map(
          (q: V3): number => Math.abs(q[2]),
        ),
      );
    const bottom: number = lower.layers[0]!.y;
    const top: number = lower.layers[lower.layers.length - 1]!.y;
    const jaw: (v: number) => boolean = (v: number): boolean => {
      const q: V3 = at(v);
      if (q[1] < nose - FACET_BELOW[1]! * k || q[1] > nose - FACET_BELOW[0]! * k) return false;
      if (Math.abs(q[2]) < FACET_ACROSS[0]! * half || Math.abs(q[2]) > FACET_ACROSS[1]! * half) return false;

      // The lips turn sharply by design.
      if (Math.abs(q[2]) < FACET_MOUTH[0]! * half && q[1] > nose - FACET_MOUTH[1]! * k) return false;

      // Back to the angle, which stands about the lower head's axis.
      const axis: V3 = AutoMovieHumanLoftChain.axis(lower, Math.min(top, Math.max(bottom, q[1])));
      return q[0] > axis[0] - FACET_BACK * half;
    };

    // A nostril's closure: the vertices it added in the half of its pocket that
    // shows through the opening. The skin's shading darkens the pocket fully
    // by half its depth, and the pole's fan lies past it.
    const centres: { centre: V3; forward: V3; reach: number; depth: number }[] = nostrils.map((a: IAutoMovieHumanLoftAperture): { centre: V3; forward: V3; reach: number; depth: number } => {
      const s: number = 2 * a.order + 1;
      const radius: number = Math.hypot(
        ...[1, 2, s + 1, s + 2, 2 * s + 1, 2 * s + 2].map((h: number): number => a.coefficients[h]!),
      );
      return {
        centre: [a.coefficients[0]!, a.coefficients[s]!, a.coefficients[2 * s]!],
        forward: unit([a.forward[0]!, a.forward[1]!, a.forward[2]!]),
        reach: (a.pocket ?? 0) + 2 * radius,
        depth: (a.pocket ?? 0) / 2,
      };
    });
    const closure: (v: number) => boolean = (v: number): boolean =>
      !skin(v) &&
      centres.some(
        (o: { centre: V3; forward: V3; reach: number; depth: number }): boolean =>
          distance(at(v), o.centre) < o.reach && dot(sub(o.centre, at(v)), o.forward) < o.depth,
      );

    const seen: Set<number> = new Set();
    const ix: number[] = out.mesh.indices;
    for (let t: number = 0; t < ix.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number = ix[t + e]!;
        const b: number = ix[t + ((e + 1) % 3)]!;
        const key: number = Math.min(a, b) * size + Math.max(a, b);
        if (seen.has(key)) continue;
        seen.add(key);
        if (skin(a) && skin(b) && jaw(a) && jaw(b)) {
          const value: number = turn(a, b);
          if (value > FACET) report("head.lower", "facet", "along the jaw's border", value, FACET, at(a));
        } else if (closure(a) || closure(b)) {
          if (!(closure(a) || skin(a)) || !(closure(b) || skin(b))) continue;
          const value: number = turn(a, b);
          if (value > PIT) report("head", "pit", "nostril closure", value, PIT, at(a));
        }
      }
  }
}
