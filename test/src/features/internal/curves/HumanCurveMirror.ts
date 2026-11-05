import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyMirror } from "../HumanAnatomyMirror";
import type { HumanCurveRings } from "./HumanCurveRings";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Left against right on the composed chains (catalog rule SYM-1 at the
 * composed-curve level): every paired chain's girth profile, station by
 * station, agrees with its mirror chain's within what the mirror bound and
 * the person's own left-right input differences allow.
 *
 * The bound is the anatomy audits' mirror distance, 0.5 mm of skin
 * (`HumanAnatomyMirror.MIRROR`), round the whole ring, `2 pi 0.5` = 3.1 mm
 * of girth, plus `pi` times the largest left-right difference of the
 * person's paired inputs (a breadth difference d changes an elliptical
 * section's girth by about `pi d / 2` per axis, so `pi d` bounds both), so a
 * person whose sides differ by input is read against that difference, never
 * against the average.
 */
export namespace HumanCurveMirror {
  /** The mirror rows of one person's paired chains. */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration, params: IAutoMovieHumanParameters, read: (chain: string) => HumanCurveRings.IProfile): IRow[] {
    const out: IRow[] = [];
    const bound: number = 2 * Math.PI * HumanAnatomyMirror.MIRROR + Math.PI * difference(params);
    for (const chain of body.chains) {
      if (!chain.name.includes(".left")) continue;
      const other: string = chain.name.replace(".left", ".right");
      if (!body.chains.some((c: IAutoMovieLoftChain): boolean => c.name === other)) continue;
      const a: number[] = read(chain.name).girth;
      const b: number[] = read(other).girth;
      const n: number = Math.min(a.length, b.length);
      let worst: number = Math.abs(a.length - b.length) > 1 ? Infinity : 0;
      let at: number = 0;
      for (let i: number = 0; i < n; i++) {
        const d: number = Math.abs(a[i]! - b[i]!);
        if (d > worst) {
          worst = d;
          at = i;
        }
      }
      out.push({ person, site: `${chain.name} against ${other}: largest girth difference station by station, at sample ${at} (SYM-1)`, value: worst, low: 0, high: bound, unit: "mm" });
    }
    return out;
  }

  /** The largest left-right difference of a person's paired inputs: hands, feet and ears, mm. */
  export function difference(p: IAutoMovieHumanParameters): number {
    let d: number = 0;
    const pair: (l: Record<string, number> | undefined, r: Record<string, number> | undefined) => void = (l: Record<string, number> | undefined, r: Record<string, number> | undefined): void => {
      if (l === undefined || r === undefined) return;
      for (const key of Object.keys(l)) if (typeof l[key] === "number" && typeof r[key] === "number") d = Math.max(d, Math.abs(l[key]! - r[key]!));
    };
    pair(p.extremities?.hands?.left as unknown as Record<string, number>, p.extremities?.hands?.right as unknown as Record<string, number>);
    pair(p.extremities?.feet?.left as unknown as Record<string, number>, p.extremities?.feet?.right as unknown as Record<string, number>);
    pair(p.head.earPair.left as unknown as Record<string, number>, p.head.earPair.right as unknown as Record<string, number>);
    pair(p.head.face.eyePair.left as unknown as Record<string, number>, p.head.face.eyePair.right as unknown as Record<string, number>);
    return d;
  }
}
