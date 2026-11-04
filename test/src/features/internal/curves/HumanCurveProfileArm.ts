import type { AutoMovieHumanSkeletonLaw } from "../../../../../packages/human/src/generation/AutoMovieHumanSkeletonLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanCurveProfile } from "./HumanCurveProfile";
import { HumanCurveRings } from "./HumanCurveRings";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;
const A: typeof HumanAnatomy = HumanAnatomy;
const P: typeof HumanCurveProfile = HumanCurveProfile;
const { SMALL, LARGE } = HumanAnatomyShared;

/**
 * The arm's girth profile on its composed chain, from the shoulder root to
 * the wrist, read against the person's intrinsic arm profile
 * (`packages/human/docs/testing/consistency.md`, section 3.2): the root at
 * least the mid upper arm, the upper arm tapering to its supracondylar waist,
 * the elbow and the forearm's root rising or holding, one forearm belly
 * falling to the wrist with at most one inflection, and the wrist the
 * narrowest of the arm's sites.
 *
 * Sites are found by the bind skeleton's joints and the profile's own
 * extremes: each station's place is its section centre's nearest point on
 * the bone polyline from the shoulder centre through the elbow to the wrist.
 */
export namespace HumanCurveProfileArm {
  /** de Leva 1996 Table 2: the shoulder centre 33.7 (women) to 34.5 (men) mm below the acromion; the mean. */
  export const ACROMION: number = 34.1;

  /** Where the forearm's belly is sought, as shares of the elbow-to-wrist length (the arm audit's window). */
  export const BELLY: readonly [number, number] = [0.1, 0.6];

  /** The inflection window, a tenth of the forearm. */
  export const WINDOW: number = 0.1;

  /**
   * The arm rows of one person's composed chains, both sides.
   *
   * @param person Name in the rows.
   * @param body The person's delivered body.
   * @param k Input millimetres per calibration millimetre.
   * @param read A side's profile.
   */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration, k: number, read: (chain: string) => HumanCurveRings.IProfile): IRow[] {
    const out: IRow[] = [];
    for (const side of HumanAnatomyShared.SIDES) {
      const profile: HumanCurveRings.IProfile = read(`arm.${side}`);
      const g: number[] = profile.girth;
      const joint: (bone: string) => V3 = (bone: string): V3 => {
        const b: AutoMovieHumanSkeletonLaw.IBone | undefined = body.skeleton?.find((x: AutoMovieHumanSkeletonLaw.IBone): boolean => x.bone === bone);
        if (b === undefined) throw new Error(`the body has no ${bone} joint`);
        return A.scale(b.position, k);
      };
      const shoulder: V3 = joint(`${side}UpperArm`);
      const elbow: V3 = joint(`${side}LowerArm`);
      const wrist: V3 = joint(`${side}Hand`);
      const upper: number = A.dist(shoulder, elbow);
      const fore: number = A.dist(elbow, wrist);

      // Each station's place along the bone polyline, mm from the shoulder centre.
      const along: number[] = profile.centre.map((c: V3): number => {
        const a: number = Math.max(0, Math.min(1, A.dot(A.sub(c, shoulder), A.sub(elbow, shoulder)) / (upper * upper)));
        const b: number = Math.max(0, Math.min(1, A.dot(A.sub(c, elbow), A.sub(wrist, elbow)) / (fore * fore)));
        const pa: V3 = A.lerp(shoulder, elbow, a);
        const pb: V3 = A.lerp(elbow, wrist, b);
        return A.dist(c, pa) <= A.dist(c, pb) ? a * upper : upper + b * fore;
      });
      const nearest: (s: number) => number = (s: number): number => along.reduce((best: number, v: number, i: number): number => (Math.abs(v - s) < Math.abs(along[best]! - s) ? i : best), 0);
      const within: (lo: number, hi: number) => [number, number] = (lo: number, hi: number): [number, number] => [nearest(lo), nearest(hi)];
      const span: (a: number, b: number) => number[] = (a: number, b: number): number[] => g.slice(Math.min(a, b), Math.max(a, b) + 1);
      const row: (site: string, value: number, low: number, high: number, unit: string) => void = (site: string, value: number, low: number, high: number, unit: string): void => {
        out.push({ person, site: `arm.${side} composed chain: ${site}`, value, low, high, unit });
      };

      // Sites: the upper arm midway acromion to olecranon (the elbow centre),
      // the supracondylar waist the least girth between it and the elbow, the
      // forearm's belly, and the wrist at the chain's last station before the
      // wrist centre.
      const root: number = 0;
      const bicep: number = nearest((upper - ACROMION) / 2);
      const elbowAt: number = nearest(upper);
      const waist: number = P.argmin(g, ...ordered(bicep, elbowAt));
      const belly: number = P.argmax(g, ...ordered(...within(upper + BELLY[0] * fore, upper + BELLY[1] * fore)));
      const wristAt: number = nearest(upper + fore - 1.5);

      // ORD-AR-1: the wrist is the narrowest of the arm's sites.
      row("forearm belly girth over wrist girth, mm (ORD-AR-1)", g[belly]! - g[wristAt]!, Number.MIN_VALUE, Infinity, "mm");
      row("elbow girth over wrist girth, mm (ORD-AR-1)", g[elbowAt]! - g[wristAt]!, Number.MIN_VALUE, Infinity, "mm");

      // ORD-AR-4: the arm's root is narrower round than half the trunk at the
      // axilla, where the trunk chain ends: the arm root wraps the deltoid and
      // the axillary folds (the scye), the trunk the whole chest, so a root as
      // wide as half the torso is a lobe swallowing the shoulder.
      const trunk: number[] = read("trunk").girth;
      row("arm root girth under half the trunk's girth at the axilla, mm (ORD-AR-4)", trunk[trunk.length - 1]! / 2 - g[root]!, Number.MIN_VALUE, Infinity, "mm");

      // ORD-AR-3: the root is at least the mid upper arm.
      row("root girth over mid upper arm girth, mm (ORD-AR-3)", g[root]! - g[bicep]!, -SMALL, Infinity, "mm");

      // PRO-AR-1, PRO-AR-2: the upper arm tapers from the root to the supracondylar waist.
      row("root to mid upper arm: excess variation, mm (PRO-AR-1)", P.excess(span(root, bicep)), 0, LARGE, "mm");
      row("mid upper arm to supracondylar waist: excess variation, mm (PRO-AR-2)", P.excess(span(bicep, waist)), 0, SMALL, "mm");

      // PRO-AR-3: from the supracondylar waist to the forearm's belly the girth rises or holds.
      row("supracondylar waist to forearm belly: excess variation, mm (PRO-AR-3)", P.excess(span(waist, belly)), 0, SMALL, "mm");

      // PRO-AR-4: one belly falling to the wrist with at most one inflection.
      const fall: number[] = span(belly, wristAt);
      row("forearm belly to wrist: excess variation, mm (PRO-AR-4)", P.excess(fall), 0, SMALL, "mm");
      row("forearm belly to wrist: inflections over a tenth of the forearm (PRO-AR-4)", P.inflections(fall, HumanCurveRings.STEP, WINDOW * fore, SMALL), 0, 1, "inflections");
    }
    return out;
  }

  /** Two indices as an ascending pair. */
  function ordered(a: number, b: number): [number, number] {
    return a <= b ? [a, b] : [b, a];
  }
}
