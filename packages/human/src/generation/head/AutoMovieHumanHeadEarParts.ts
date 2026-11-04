import { AutoMovieHumanViewSection } from "../../lofting/AutoMovieHumanViewSection";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import { AutoMovieHumanHeadPrior } from "../AutoMovieHumanHeadPrior";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadEarFrame } from "./AutoMovieHumanHeadEarFrame";
import type { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";

/**
 * Each auricle and the parts inside it, in the ear's own frame
 * (`AutoMovieHumanHeadEarFrame`):
 *
 * | Part | Parent | Join | Size from |
 * | --- | --- | --- | --- |
 * | auricle | head mass | merge | `ear.length` along the long axis, `ear.breadth` across, `ear.protrusion` out |
 * | helix | auricle | merge | the rim ring (`ear.helix`: height, distance in from the rim, width) along the back of the chord |
 * | antihelix | auricle | merge | its ring (`ear.antihelix`) inside the helix |
 * | concha | auricle | diff | its depth, places along the chord and the ear, and widths (`ear.concha`) |
 *
 * The rows are the head prior's, written for a 31 mm ear and scaled with the
 * ear's length; the ear's own laws (#3056) replace them, and the helix's
 * course becomes the curve the style layer swaps. First pass: compile-only.
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
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    tops?: { left: number; right: number },
  ): AutoMovieHumanHeadFeatures.IFeature[] {
    const prior: AutoMovieHumanHeadPrior.IEar = AutoMovieHumanHeadPrior.PRIOR.ear;
    const k: number = plan.scale;
    const out: AutoMovieHumanHeadFeatures.IFeature[] = [];
    for (const sign of [1, -1] as const) {
      const side: string = sign > 0 ? "left" : "right";
      const f: AutoMovieHumanHeadEarFrame.IFrame = AutoMovieHumanHeadEarFrame.of(plan, sign, sign > 0 ? ears.left : ears.right, tops === undefined ? undefined : sign > 0 ? tops.left : tops.right);
      const s: number = f.scale * k;
      const at = (along: number, back: number, out_: number): [number, number, number] => [
        f.centre[0] + along * f.a[0] - back * f.b[0] + out_ * f.n[0],
        f.centre[1] + along * f.a[1] - back * f.b[1] + out_ * f.n[1],
        f.centre[2] + along * f.a[2] - back * f.b[2] + out_ * f.n[2],
      ];
      const auricle: string = `auricle.${side}`;

      // The auricle: a fin standing out of the head.
      out.push(
        part(auricle, "head.mass", "merge", at(0, 0, -INSET), f.n, f.a, [f.length / 2, f.breadth / 2, f.length / 2, f.breadth / 2], INSET + f.protrusion, 4, at(0, 0, 0)),
      );

      // The rims along the chord's back, each its ring's distance in.
      const rim = (name: string, row: readonly number[]): void => {
        const back: number = f.breadth / 2 - row[1]! * s;
        const half: number = Math.max(1, f.length / 2 - row[1]! * s);
        const width: number = (row[2]! * s) / 2;
        out.push(part(`${name}.${side}`, auricle, "merge", at(0, back, f.protrusion - INSET), f.n, f.a, [half, width, half, width], INSET + row[0]! * s, 2, at(0, back, f.protrusion)));
      };
      rim("ear.helix", prior.helix);
      rim("ear.antihelix", prior.antihelix);

      // The concha: cut into the auricle's face from its rim's height.
      const c: readonly number[] = prior.concha;
      const along: number = c[2]! * f.length;
      const back: number = (0.5 - c[1]!) * f.breadth;
      const depth: number = -c[0]! * s;
      out.push(
        part(`ear.concha.${side}`, auricle, "diff", at(along, back, f.protrusion + INSET), [-f.n[0], -f.n[1], -f.n[2]], f.a,
          [(c[3]! * f.length) / 2, (c[4]! * f.breadth) / 2, (c[3]! * f.length) / 2, (c[4]! * f.breadth) / 2], INSET + depth, 2, at(along, back, f.protrusion)),
      );
    }
    return out;
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
  ): AutoMovieHumanHeadFeatures.IFeature {
    const h: number = Math.max(INSET + 0.5, height);
    const e: [number, number, number, number] = extents.map((x: number): number => Math.max(0.5, Math.abs(x))) as [number, number, number, number];
    return {
      part: AutoMovieHumanHeadDome.of({ name, origin, outward, along, extents: e, height: h, profile, shoulder: AutoMovieHumanViewSection.ELLIPSE }),
      join,
      seed,
      contact: INSET,
      size: [h - INSET, Math.min(...e)],
      parent,
      elongated: Math.max(...e) > 2 * Math.min(...e),
    };
  }
}
