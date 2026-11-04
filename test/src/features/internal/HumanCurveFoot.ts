import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { HumanCurveFinding } from "./HumanCurveFinding";
import { HumanCurveHand } from "./HumanCurveHand";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveVector } from "./HumanCurveVector";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
type IHumanCurveFinding = HumanCurveFinding.IHumanCurveFinding;
const { auditHandMesh }: typeof HumanCurveHand = HumanCurveHand;
const { centre, perimeter, side, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { clamp, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;
const { BALL, BALL_BACK, BALL_CHAIN, BALL_PHASES, BALL_SIDE, BALL_STEP, DOME, DOME_FLOOR, NORMAL_STATION, PHASES, RIB, RIB_PHASES, RIB_RADIUS, RIB_SEGMENT, RIB_STEP }: typeof HumanCurveConstants = HumanCurveConstants;

/** The rules of a foot: its ribs, ball and tips. */
export namespace HumanCurveFoot {
  /**
   * A foot's skin as it is meshed: `crumple`, sharp edges crowding one small
   * patch of skin, which shows at the webs between the toes and no curve rule
   * reads. Only the foot's own chains are lofted, and the ankle's closing fan,
   * which has no leg here, is not read.
   *
   * @param person Name in the findings.
   * @param body The generated body.
   */
  export function auditHumanFoot(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
  ): IHumanCurveFinding[] {
    return (["left", "right"] as const).flatMap(
      (side: "left" | "right"): IHumanCurveFinding[] => {
        const root: string = `foot.${side}`;
        const layers: number =
          body.chains.find((c: IAutoMovieLoftChain): boolean => c.name === root)?.layers
            .length ?? 0;
        return auditHandMesh(
          person,
          body,
          new RegExp(`^(foot|forefoot|toe)\\.${side}`),
          (name: string): boolean => name !== `${root}/${layers - 2}`,
        ).filter((f: IHumanCurveFinding): boolean => f.rule === "crumple");
      },
    );
  }

  /**
   * A rib is a sharp turn along a foot's or toe's longitudinal curve, in degrees
   * per radius of the ring it crosses so a toe and a heel read alike. Sampled at
   * even steps of skin, not per layer: `crease` reads a turn between samples, and
   * a turn spread over a few samples of a short layer slips under it.
   */
  export function auditRibs(
    chain: IAutoMovieLoftChain,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    if (!/^(foot|forefoot|toe)\./.test(chain.name)) return;
    const low: number = chain.layers[0]!.y;
    const high: number = chain.layers[chain.layers.length - 1]!.y;
    const count: number = Math.floor((high - low) / RIB_STEP);
    if (count < 2) return;
    const grid: V3[][] = Array.from(
      { length: count + 1 },
      (_: unknown, i: number): V3[] =>
        AutoMovieLoftChain.ring(chain, low + i * RIB_STEP, uniform(RIB_PHASES)),
    );
    for (let j: number = 0; j < RIB_PHASES; j++)
      for (let i: number = 1; i < count; i++) {
        const radius: number = perimeter(grid[i]!) / (2 * Math.PI);
        if (radius < RIB_RADIUS) continue;
        const a: V3 = sub(grid[i]![j]!, grid[i - 1]![j]!);
        const b: V3 = sub(grid[i + 1]![j]!, grid[i]![j]!);
        const la: number = Math.hypot(...a);
        const lb: number = Math.hypot(...b);
        if (la < RIB_SEGMENT || lb < RIB_SEGMENT) continue;
        const turn: number = (Math.acos(clamp(dot(a, b) / (la * lb))) * 180) / Math.PI;
        const value: number = (turn / ((la + lb) / 2)) * radius;
        if (value > RIB)
          report(chain.name, "rib", `at ${Math.round(low + i * RIB_STEP)}`, value, RIB, grid[i]![j]!);
      }
  }

  /**
   * The ball of the foot is one padded surface: a web may shape the top of the
   * foot and the web itself, and a toe's crease is short. So the plantar skin a
   * little behind a web's lower end stands no higher than the skin beside it. The
   * skin is read off the chains, in axes along and across the foot from that end,
   * so a groove reads whatever the chains' stations are.
   */
  export function auditBall(
    body: IAutoMovieHumanBodyCalibration,
    generated: RegExp,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    for (const sign of ["left", "right"]) {
      const skin: V3[] = body.chains
        .filter(
          (c: IAutoMovieLoftChain): boolean =>
            new RegExp(`^(foot|forefoot)\\.${sign}`).test(c.name) && generated.test(c.name),
        )
        .flatMap((c: IAutoMovieLoftChain): V3[] => {
          const low: number = c.layers[0]!.y;
          const high: number = Math.min(c.layers[c.layers.length - 1]!.y, low + BALL_CHAIN);
          const count: number = Math.ceil((high - low) / BALL_STEP);
          return Array.from({ length: count + 1 }, (_: unknown, i: number): V3[] =>
            AutoMovieLoftChain.ring(c, Math.min(high, low + i * BALL_STEP), uniform(BALL_PHASES)),
          ).flat();
        });
      if (skin.length === 0) continue;
      const ankle: IAutoMovieLoftChain = body.chains.find(
        (c: IAutoMovieLoftChain): boolean => c.name === `foot.${sign}`,
      )!;
      const heel: V3 = centre(
        AutoMovieLoftChain.ring(
          ankle,
          ankle.layers[ankle.layers.length - 1]!.y,
          uniform(PHASES),
        ),
      );
      for (const event of body.events) {
        if (!new RegExp(`^(foot|forefoot)\\.${sign}`).test(event.parent)) continue;
        const parent: IAutoMovieLoftChain | undefined = body.chains.find(
          (c: IAutoMovieLoftChain): boolean => c.name === event.parent,
        );
        if (parent === undefined) continue;
        for (const split of event.splits) {
          if (split.arcs.length !== 1 || !/^toe\./.test(split.child)) continue;
          const ends: V3[] = AutoMovieLoftChain.ring(
            parent,
            parent.layers[0]!.y,
            [split.arcs[0]![0], split.arcs[0]![1]],
          );
          const web: V3 = ends[0]![1] < ends[1]![1] ? ends[0]! : ends[1]!;
          const along: V3 = unit([web[0] - heel[0], 0, web[2] - heel[2]]);
          const across: V3 = [-along[2], 0, along[0]];

          // The lowest skin at an offset across the foot, behind the web.
          const lowest: (offset: number) => number = (offset: number): number => {
            let y: number = Infinity;
            for (const p of skin) {
              const d: V3 = sub(p, web);
              if (
                Math.abs(dot(d, along) + BALL_BACK) < 1 &&
                Math.abs(dot(d, across) - offset) < 1
              )
                y = Math.min(y, p[1]);
            }
            return y;
          };
          const here: number = lowest(0);
          const beside: number = Math.min(lowest(BALL_SIDE), lowest(-BALL_SIDE));
          if (Number.isFinite(here) && Number.isFinite(beside) && here - beside > BALL)
            report(`${event.parent} > ${split.child}`, "ball", `${BALL_BACK} mm behind the web`, here - beside, BALL, web);
        }
      }
    }
  }

  /**
   * A toe closed by a rounded dome: the surface lays that dome on the first ring
   * that is no point ring, leaving it along the line to the pole, so the skin
   * kinks wherever the tube is still tapering. A toe's own cap carries no such
   * pole, so this reads nothing on one.
   */
  export function auditTips(
    body: IAutoMovieHumanBodyCalibration,
    chains: readonly IAutoMovieLoftChain[],
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    for (const pole of body.poles) {
      if (!pole.critical || !/^(toe|finger|thumb)\./.test(pole.chain)) continue;
      const chain: IAutoMovieLoftChain | undefined = chains.find(
        (c: IAutoMovieLoftChain): boolean => c.name === pole.chain,
      );
      if (chain === undefined) continue;
      const radii: number[] = chain.layers.map(
        (l: IAutoMovieLoftChain.ILayer): number =>
          perimeter(AutoMovieLoftChain.ring(chain, l.y, uniform(PHASES))) / (2 * Math.PI),
      );
      const median: number = [...radii].sort((p: number, q: number): number => p - q)[radii.length >> 1]!;
      const k: number = radii.findIndex((r: number): boolean => r >= DOME_FLOOR * median);
      if (k < 0) continue;
      const station: number = chain.layers[k]!.y;
      const ring: V3[] = AutoMovieLoftChain.ring(chain, station, uniform(PHASES));

      // A chain that ends on the dome's own ring has no skin past it, so its tube
      // is read coming down to the ring.
      const last: boolean = k === 0;
      const inner: V3[] = AutoMovieLoftChain.ring(
        chain,
        last ? station + NORMAL_STATION : station - NORMAL_STATION,
        uniform(PHASES),
      );
      const along: V3 = unit(sub(pole.point, centre(ring)));
      ring.forEach((p: V3, j: number): void => {
        const run: V3 = last ? sub(p, inner[j]!) : sub(inner[j]!, p);
        const kink: number = (Math.acos(clamp(dot(unit(run), along))) * 180) / Math.PI;
        if (kink > DOME) report(pole.chain, "dome", side(ring, j), kink, DOME, p);
      });
    }
  }
}
