import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
const { band, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { MIDLINE, MIRROR, PHASES }: typeof HumanCurveConstants = HumanCurveConstants;

/** The two sides mirror each other and no limb crosses the midline. */
export namespace HumanCurveSides {
  /**
   * The two sides mirror each other, each right ring reflected and, with
   * `rebuild`, rebuilt to the left side's own inputs, and no limb crosses the
   * midline.
   */
  export function auditSides(
    body: IAutoMovieHumanBodyCalibration,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
    rebuild?: (chain: string, q: V3) => V3,
  ): void {
    for (const left of body.chains.filter(
      (c: IAutoMovieLoftChain): boolean => /^(arm|leg)\.left$/.test(c.name),
    )) {
      const right: IAutoMovieLoftChain | undefined = body.chains.find(
        (c: IAutoMovieLoftChain): boolean =>
          c.name === left.name.replace("left", "right"),
      );
      if (right === undefined || right.layers.length !== left.layers.length) {
        report(left.name, "mirror", "layer count", 1, 0);
        continue;
      }
      left.layers.forEach(
        (l: IAutoMovieLoftChain.ILayer, k: number): void => {
          const a: V3[] = AutoMovieLoftChain.ring(left, l.y, uniform(PHASES));
          const b: V3[] = AutoMovieLoftChain.ring(
            right,
            right.layers[k]!.y,
            uniform(PHASES),
          ).map((q: V3): V3 => {
            const reflected: V3 = [q[0], q[1], -q[2]];
            return rebuild === undefined ? reflected : rebuild(right.name, reflected);
          });
          let square: number = 0;
          for (const p of a) {
            let near: number = Infinity;
            for (const q of b)
              near = Math.min(
                near,
                (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2,
              );
            square = Math.max(square, near);
          }
          const off: number = Math.sqrt(square);
          if (off > MIRROR) report(left.name, "mirror", `layer ${band(k)}`, off, MIRROR);
          const across: number = -Math.min(...a.map((p: V3): number => p[2]));
          if (across > MIDLINE)
            report(left.name, "midline", `layer ${band(k)}`, across, MIDLINE);
        },
      );
    }
  }
}
