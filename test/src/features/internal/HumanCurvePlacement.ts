import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { HumanCurveFinding } from "./HumanCurveFinding";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
type IHumanCurveFinding = HumanCurveFinding.IHumanCurveFinding;
const { centre, encloses, perimeter, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { ANATOMY, PHASES, STATURE_DAY, THIGH_GIRTH, THIGH_TOP }: typeof HumanCurveConstants = HumanCurveConstants;

/** Where the thigh and every part of the body stand. */
export namespace HumanCurvePlacement {
  /**
   * The thigh above its tape, against the tape.
   *
   * The crotch ring is the skin's way into the trunk, not a section of the thigh.
   * A law that lets the ring set the thigh's top keeps its tape exact at the tape's
   * own station and fills the fold under the buttock above it.
   *
   * @param person Name in the findings.
   * @param body The generated body.
   * @param height Stature input, to read the tape in the body's millimetres.
   * @param tape Thigh tape input.
   */
  export function auditHumanThigh(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
    height: number,
    tape: number,
  ): IHumanCurveFinding[] {
    return ["leg.left", "leg.right"].flatMap(
      (name: string): IHumanCurveFinding[] => {
        const leg: IAutoMovieLoftChain = body.chains.find(
          (c: IAutoMovieLoftChain): boolean => c.name === name,
        )!;
        const station: number =
          leg.layers[leg.layers.length - 1]!.y - THIGH_TOP * body.stature;
        const ring: V3[] = AutoMovieLoftChain.ring(
          leg,
          station,
          uniform(PHASES),
        );
        const value: number =
          perimeter(ring) / ((tape * body.stature) / height);
        return value > THIGH_GIRTH
          ? [
              {
                person,
                region: name,
                rule: "thigh",
                where: `at ${Math.round(station)}`,
                value,
                limit: THIGH_GIRTH,
                count: 1,
                point: centre(ring),
              },
            ]
          : [];
      },
    );
  }

  /**
   * Where a standing body's parts are, read against anatomy and the stature
   * input, never against an earlier figure.
   *
   * - `part`: a side lacks an arm, a palm, a thumb, four fingers, a leg, a foot,
   *   five toes or an ear, or the trunk, neck or head is gone.
   * - `stature`: the crown does not stand at the stature input, or the sole is
   *   off the floor, by more than a day changes a person's stature.
   * - `order`: the lowest skin is not a foot's, or the highest is not the head's.
   * - `inside`: an arm's axis runs inside the trunk's section at its height.
   *
   * @param person Name in the findings.
   * @param body The generated body.
   * @param height Stature input, to read the body in its own millimetres.
   */
  export function auditHumanPlacement(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
    height: number,
  ): IHumanCurveFinding[] {
    const out: IHumanCurveFinding[] = [];

    // A finding the body's placement reports.
    const add: (region: string, rule: string, where: string, value: number, limit: number, point?: readonly number[]) => void = (
      region: string,
      rule: string,
      where: string,
      value: number,
      limit: number,
      point: readonly number[] = [],
    ): void => {
      out.push({ person, region, rule, where, value, limit, count: 1, point: [...point] });
    };
    const k: number = height / body.stature;

    // A chain counts as a part only while some ring of it encloses skin.
    const present: IAutoMovieLoftChain[] = body.chains.filter(
      (c: IAutoMovieLoftChain): boolean =>
        c.layers.some(
          (l: IAutoMovieLoftChain.ILayer): boolean =>
            perimeter(AutoMovieLoftChain.ring(c, l.y, uniform(PHASES))) > 0,
        ),
    );
    for (const [label, pattern, least, most] of ANATOMY)
      for (const side of pattern.source.includes("<side>") ? ["left", "right"] : [""]) {
        const own: RegExp = new RegExp(pattern.source.replace("<side>", side));
        const count: number = present.filter((c: IAutoMovieLoftChain): boolean =>
          own.test(c.name),
        ).length;
        if (count < least || count > most)
          add(
            `${side === "" ? "" : `${side} `}${label}`,
            "part",
            `${count} found`,
            count,
            count < least ? least : most,
          );
      }
    if (present.length === 0) return out;

    // The crown and the sole, with the chain that holds each.
    let top: { y: number; chain: string; at: V3 } = { y: -Infinity, chain: "", at: [0, 0, 0] };
    let bottom: { y: number; chain: string; at: V3 } = { y: Infinity, chain: "", at: [0, 0, 0] };
    const visit: (chain: string, p: V3) => void = (chain: string, p: V3): void => {
      if (p[1] > top.y) top = { y: p[1], chain, at: p };
      if (p[1] < bottom.y) bottom = { y: p[1], chain, at: p };
    };
    for (const chain of present) {
      for (const l of chain.layers)
        for (const p of AutoMovieLoftChain.ring(chain, l.y, uniform(PHASES)))
          visit(chain.name, p);
      if (chain.pole !== undefined) visit(chain.name, chain.pole.point);
    }
    for (const pole of body.poles) visit(pole.chain, pole.point);
    const day: number = STATURE_DAY * height;
    const crown: number = Math.abs(top.y * k - height);
    const sole: number = Math.abs(bottom.y * k);
    if (crown > day) add(top.chain, "stature", "crown against the stature input", crown, day, top.at);
    if (sole > day) add(bottom.chain, "stature", "sole against the floor", sole, day, bottom.at);
    if (!/^head\./.test(top.chain)) add(top.chain, "order", "highest skin", 1, 0, top.at);
    if (!/^(foot|forefoot|toe)\./.test(bottom.chain))
      add(bottom.chain, "order", "lowest skin", 1, 0, bottom.at);

    // Below the armpit an arm hangs beside the trunk. The trunk's sections are
    // horizontal, so its station at a height is the section there.
    const trunk: IAutoMovieLoftChain | undefined = present.find(
      (c: IAutoMovieLoftChain): boolean => c.name === "trunk",
    );
    if (trunk === undefined) return out;
    const low: number = trunk.layers[0]!.y;
    const high: number = trunk.layers[trunk.layers.length - 1]!.y;
    for (const arm of present.filter((c: IAutoMovieLoftChain): boolean =>
      /^arm\.(left|right)$/.test(c.name),
    )) {
      const within: V3[] = [];
      for (const l of arm.layers) {
        const c: V3 = centre(AutoMovieLoftChain.ring(arm, l.y, uniform(PHASES)));
        if (c[1] < low || c[1] > high) continue;
        const section: [number, number][] = AutoMovieLoftChain.ring(
          trunk,
          c[1],
          uniform(PHASES),
        ).map((p: V3): [number, number] => [p[0], p[2]]);
        if (encloses(section, [c[0], c[2]])) within.push(c);
      }
      if (within.length !== 0)
        out.push({
          person,
          region: arm.name,
          rule: "inside",
          where: "rings in the trunk",
          value: within.length,
          limit: 0,
          count: within.length,
          point: [...within[0]!],
        });
    }
    return out;
  }
}
