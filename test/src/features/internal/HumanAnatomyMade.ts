import { HumanInputs } from "./HumanInputs";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyAudit } from "./HumanAnatomyAudit";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * Made subjects that a region audit must fail, the red proofs of
 * `assertHumanAnatomy`: f1 read against inputs it does not honour, and f1's
 * skin warped where a region's anatomy forbids it. A made subject never
 * enters a person cache; its skins are new objects, so every observer's
 * per-skin cache reads them afresh.
 */
export namespace HumanAnatomyMade {
  /** Share every measured input is raised by: 15 % moves a 900 mm hip tape 135 mm and a 10 mm nasal breadth 1.5 mm, past every allowable error. */
  export const RAISE: number = 1.15;

  /**
   * f1's own skins read against its inputs raised by {@link RAISE}: every
   * numeric leaf of the body controls but stature, of the head and of the
   * body's anatomy. Each identity row that reads an input must fail.
   */
  export function inputs(): HumanAnatomyAudit.ISubject {
    const base: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
    const params: IAutoMovieHumanParameters = structuredClone(base.params);
    const height: number = HumanInputs.stature(params);
    raise(params.head);
    raise(params.body.anatomy);
    params.body.anatomy.stature = height;
    return { ...base, name: "f1 made inputs", params };
  }

  /**
   * f1 with both skins warped by one vertex map.
   *
   * @param label What the warp makes.
   * @param warp The vertex map, given each vertex and the skin's joints.
   */
  export function warped(label: string, warp: (p: V3, skin: HumanAnatomy.ISkin) => V3): HumanAnatomyAudit.ISubject {
    const base: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
    const map: (skin: HumanAnatomy.ISkin) => HumanAnatomy.ISkin = (skin: HumanAnatomy.ISkin): HumanAnatomy.ISkin => {
      const P: Float64Array = new Float64Array(skin.P.length);
      for (let v: number = 0; v < skin.P.length / 3; v++) P.set(warp(A.point(skin, v), skin), 3 * v);
      return { ...skin, P };
    };
    let bind: HumanAnatomy.ISkin | undefined;
    let neutral: HumanAnatomy.ISkin | undefined;
    return {
      ...base,
      name: `f1 made ${label}`,
      bind: (): HumanAnatomy.ISkin => (bind ??= map(base.bind())),
      neutral: (): HumanAnatomy.ISkin => (neutral ??= map(base.neutral())),
    };
  }

  /**
   * A horizontal widening by `1 + amount * w(y)` about a vertical axis, where
   * w rises from 0 at `from` to 1 at the band's middle and falls to 0 at `to`
   * (a raised cosine), so the warp is smooth and leaves the skin outside the
   * band where it was.
   */
  export function widen(axis: V3, from: number, to: number, amount: number, x: boolean, z: boolean): (p: V3) => V3 {
    return (p: V3): V3 => {
      if (p[1] <= from || p[1] >= to) return p;
      const w: number = 0.5 * (1 - Math.cos((2 * Math.PI * (p[1] - from)) / (to - from)));
      const k: number = 1 + amount * w;
      return [x ? axis[0] + k * (p[0] - axis[0]) : p[0], p[1], z ? axis[2] + k * (p[2] - axis[2]) : p[2]];
    };
  }

  /** Multiply every positive numeric leaf of an object, in place. */
  function raise(value: unknown): void {
    if (value === null || typeof value !== "object") return;
    const record: Record<string, unknown> = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(record)) {
      if (typeof v === "number" && v > 0) record[k] = v * RAISE;
      else raise(v);
    }
  }
}
