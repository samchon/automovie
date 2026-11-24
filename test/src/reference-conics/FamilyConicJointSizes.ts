import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanF1,
  AutoMovieHumanF1Armscye,
  AutoMovieHumanF1Divide,
  AutoMovieHumanF1NativeSites,
  AutoMovieHumanF1ThumbRoot,
  AutoMovieHumanJoinLoop,
} from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieHumanF1, IAutoMovieViewPart } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The sizes f1's joint widths are shares of, read on f1 as stored (joints-one-shot.md, "Joint widths as shares"): each child's mean
 * root reach at its first knot (`AutoMovieHumanConicLoft.meanReach`), each composed end's parent ring at its end station, the
 * armscye's master loop's extent in trunk station and the thumb's master loop's length. A width's share is today's millimetres over
 * the size read here, frozen as a named constant in the declaration.
 *
 * Usage: `FamilyConicJointSizes.cjs --out=<file>`; writes the sizes as JSON and prints them.
 */
namespace FamilyConicJointSizes {
  type V = AutoMovieVector3Tuple;

  /** Read every size and write it. */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv.find((arg): boolean => arg.startsWith("--out="))?.slice("--out=".length);
    if (out === undefined) throw new Error("usage: --out=<file>");
    const figure: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const root = (family: IAutoMovieHumanConicLoft.IFamily): number => AutoMovieHumanConicLoft.meanReach(family, family.knots[0]!);
    const digit = (name: string): IAutoMovieHumanConicLoft.IFamily => {
      const found = figure.digits.find((d): boolean => d.family.name === name);
      if (found === undefined) throw new Error("no digit " + name);
      return found.family;
    };
    const station = (family: IAutoMovieHumanConicLoft.IFamily, point: readonly number[]): number => {
      const domain: [number, number] = [family.knots[0]!, family.knots.at(-1)!];
      return AutoMovieHumanJoinLoop.address({ name: family.name, axis: AutoMovieHumanConicLoft.axis(family) }, domain, point, (domain[0] + domain[1]) / 2)[0];
    };
    const fingers = ["finger.pinky", "finger.ring", "finger.middle", "finger.index"].map((n) => ({ name: n, reach: root(digit(n)) }));
    const toes = ["toe.little", "toe.ring", "toe.middle", "toe.index", "toe.big"].map((n) => ({ name: n, reach: root(digit(n)) }));
    const mean = (rows: { reach: number }[]): number => rows.reduce((s, r): number => s + r.reach, 0) / rows.length;
    const body = figure.body;
    const handEnd: number = station(body.hand, figure.point("middle1"));
    const footEnd: number = AutoMovieHumanF1NativeSites.footStation(body.leg, figure.point("footBall"));
    const trunkFoot = AutoMovieHumanConicLoft.axis(body.trunk).at(body.trunk.knots[0]!).origin;
    const pelvisEnd: number = station(body.trunk, [trunkFoot[0], (trunkFoot[1] + figure.point("thigh")[1]) / 2, trunkFoot[2]]);

    // The side masters as the declaration traces them (`AutoMovieHumanF1.ts`, `armscyeCut`, `thumbCut`, `bind`).
    const sources: ReadonlyMap<string, IAutoMovieViewPart> = AutoMovieHumanF1.originalSources(figure, new Set([body.trunk.name, body.hand.name]));
    const frame = (name: string) => {
      const found = figure.frames.get(name);
      if (found === undefined) throw new Error("frame " + name + " is absent");
      return found;
    };
    const masterSize = (host: IAutoMovieViewPart, count: number, landmarks: V[], divider: ReturnType<typeof AutoMovieHumanF1Armscye.surface>,
      owns: ReturnType<typeof AutoMovieHumanF1Divide.landmarkOwner>) => {
      try {
        const master = AutoMovieHumanJoinLoop.master(host, count, landmarks, divider, owns, 1e-3, 0.2);
        const clocks: number[] = Array.from({ length: 2 * count }, (_, k: number): number => (Math.PI * k) / count);
        const stations: number[] = clocks.map((c: number): number => master.hostAt(c).point[0]);
        const points: V[] = clocks.map((c: number): V => master.at(c).point as V);
        const length: number = points.reduce((sum: number, p: V, i: number): number => {
          const q: V = points[(i + 1) % points.length]!;
          return sum + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        }, 0);
        return { stationExtentMm: Math.max(...stations) - Math.min(...stations), stations: [Math.min(...stations), Math.max(...stations)], lengthMm: length };
      } catch (error: unknown) {
        return { refused: error instanceof Error ? error.message.slice(0, 600) : String(error) };
      }
    };
    const thorax = frame("thorax"), shoulder: V = figure.point("upperarm"), elbow: V = figure.point("lowerarm");
    const armLandmarks: V[] = AutoMovieHumanF1Armscye.landmarks(thorax);
    const armscye = masterSize(sources.get(body.trunk.name)!, 192, armLandmarks, AutoMovieHumanF1Armscye.surface(thorax, shoulder, elbow),
      AutoMovieHumanF1Divide.landmarkOwner(shoulder, [shoulder, elbow, figure.point("hand")], armLandmarks, AutoMovieHumanF1Divide.ARMSCYE_MM));
    const metacarpal = frame("thumb.metacarpal"), thumbRoot: V = figure.point("thumb2"), thumbNext: V = figure.point("thumb3");
    const thumbLandmarks: V[] = [...AutoMovieHumanF1ThumbRoot.knuckleSeeds(metacarpal), AutoMovieHumanF1ThumbRoot.webFloor(metacarpal)];
    const thumb = masterSize(sources.get(body.hand.name)!, 48, thumbLandmarks, AutoMovieHumanF1ThumbRoot.surface(metacarpal, thumbRoot, thumbNext),
      AutoMovieHumanF1Divide.landmarkOwner(thumbRoot, [thumbRoot, thumbNext], thumbLandmarks));

    const sizes = {
      fingers, fingerMean: mean(fingers), toes, toeMean: mean(toes),
      leg: root(body.leg), hand: root(body.hand),
      helix: root(figure.helix), antihelix: root(figure.antihelix), plate: root(body.ear), nostril: root(figure.nostril),
      ends: {
        hand: { station: handEnd, reach: AutoMovieHumanConicLoft.meanReach(body.hand, handEnd) },
        leg: { station: footEnd, reach: AutoMovieHumanConicLoft.meanReach(body.leg, footEnd) },
        trunk: { station: pelvisEnd, reach: AutoMovieHumanConicLoft.meanReach(body.trunk, pelvisEnd) },
      },
      armscye, thumb,
    };
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, JSON.stringify(sizes, null, 2));
    process.stdout.write(JSON.stringify(sizes) + "\n");
  }
}

void FamilyConicJointSizes.main();
