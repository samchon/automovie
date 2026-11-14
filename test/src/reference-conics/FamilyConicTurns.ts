import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";

/**
 * Where a stored family's surface turns sharply, read on its realized chain: along the station at fixed phases (a level line) and round the
 * section at fixed stations (an upright line), on the whole surface, on the bare wall, and with each named relief alone and left out.
 *
 * A crease the eye reads on the clay is a turn of the surface's tangent far above its neighbours'. Read on the chain itself, every 0.25 mm
 * along and 0.0025 rad round, it is the surface's own and not the tessellation's, and the variants name the relief or the wall that draws it
 * (construction.md, Repair: own it first).
 *
 * Usage, from `test`: `node <bundle> <part> --family=stored|<directory> --box=<s0>,<s1>,<t0>,<t1> [--nets=<name>,...] [--out=<file>]`.
 * `stored` reads the Human package's family; a directory reads `<part>.family.json` from a fit run.
 */
namespace FamilyConicTurns {
  type V3 = [number, number, number];

  /** A turn far above its neighbours': its rate, the mean of the readings 3 mm or 0.03 rad either side, and where it is. */
  interface IPeak {
    /** Turn of the tangent, degrees per mm. */
    turn: number;

    /** Mean turn of the readings 12 samples either side. */
    around: number;

    /** Station, mm. */
    s: number;

    /** Phase, radians. */
    t: number;
  }

  /** A peak is reported when its turn exceeds its neighbours' mean by this factor. */
  const RATIO: number = 1.6;

  /** Least turn reported, degrees per mm: below it a crease does not read on the clay. */
  const LEAST: number = 0.6;

  const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);

  /** Read the turns of the named part's surface and write them. */
  export async function main(): Promise<void> {
    const part: string = process.argv.slice(2).find((a: string): boolean => !a.startsWith("--")) ?? "trunk";
    const source: string = argument("family") ?? "stored";
    const family: AutoMovieHumanConicLoft.IFamily =
      source === "stored"
        ? (Object.values(AutoMovieHumanF1.BODY) as AutoMovieHumanConicLoft.IFamily[]).find((candidate: AutoMovieHumanConicLoft.IFamily): boolean => candidate.name === part)!
        : (JSON.parse(await fs.readFile(path.join(source, part + ".family.json"), "utf8")) as AutoMovieHumanConicLoft.IFamily);
    if (family === undefined) throw new Error("no family " + part);
    const [s0, s1, t0, t1] = (argument("box") ?? "0,0,0,0").split(",").map(Number) as [number, number, number, number];
    const nets: string[] = (argument("nets") ?? "").split(",").filter((name: string): boolean => name.length > 0);
    const stations: number[] = [];
    for (let s: number = Math.floor(family.knots[0]!); s <= family.knots.at(-1)!; s += 1) stations.push(s);
    const full: IAutoMovieLoftChain | null = AutoMovieHumanConicLoft.create(family, stations).chain;
    if (full === null) throw new Error(part + " does not loft");
    const reliefs = full.reliefs ?? [];
    const variants: [string, IAutoMovieLoftChain][] = [
      ["full", full],
      ["bare", { ...full, reliefs: [] }],
      ...nets.flatMap((name: string): [string, IAutoMovieLoftChain][] => [
        [name + " only", { ...full, reliefs: reliefs.filter((r) => r.name === name) }],
        ["less " + name, { ...full, reliefs: reliefs.filter((r) => r.name !== name) }],
      ]),
    ];
    const point = (c: IAutoMovieLoftChain, s: number, t: number): V3 => AutoMovieLoftChain.point(c, s, t) as V3;
    const turn = (a: V3, b: V3, d: V3): number => {
      const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const w: V3 = [d[0] - b[0], d[1] - b[1], d[2] - b[2]];
      const lu: number = Math.hypot(...u);
      const lw: number = Math.hypot(...w);
      const cosine: number = Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (lu * lw)));
      return ((Math.acos(cosine) * 180) / Math.PI) / (0.5 * (lu + lw));
    };
    const peaks = (values: number[], at: (i: number) => [number, number]): IPeak[] => {
      const found: IPeak[] = [];
      for (let i: number = 12; i + 12 < values.length; ++i) {
        const around: number = (values[i - 12]! + values[i + 12]!) / 2;
        if (values[i]! > RATIO * around && values[i]! >= values[i - 1]! && values[i]! >= values[i + 1]! && values[i]! > LEAST) found.push({ turn: values[i]!, around, s: at(i)[0], t: at(i)[1] });
      }
      return found;
    };
    const lines: string[] = [part + " from " + source + ": box s " + s0 + ".." + s1 + ", t " + t0 + ".." + t1 + "; turns in deg/mm as peak / neighbours' mean, top 8"];
    // `--at=<s>,<t>;<s>,<t>...`: the turn along the station and round the section at exactly those points, on every variant, with the mean
    // of the readings 3 mm and 0.03 rad either side, so two runs compare at the same place.
    for (const pair of (argument("at") ?? "").split(";").filter((text: string): boolean => text.length > 0)) {
      const [s, t] = pair.split(",").map(Number) as [number, number];
      const cells: string[] = variants.map(([name, chain]): string => {
        const along = (x: number): number => turn(point(chain, x - 0.25, t), point(chain, x, t), point(chain, x + 0.25, t));
        const round = (y: number): number => turn(point(chain, s, y - 0.0025), point(chain, s, y), point(chain, s, y + 0.0025));
        return name + " " + along(s).toFixed(2) + "/" + ((along(s - 3) + along(s + 3)) / 2).toFixed(2) + " along, " + round(t).toFixed(2) + "/" + ((round(t - 0.03) + round(t + 0.03)) / 2).toFixed(2) + " round";
      });
      lines.push("at s " + s + " t " + t + " [" + point(full, s, t).map((x: number): string => x.toFixed(1)).join(", ") + "]: " + cells.join(" | "));
    }
    for (const [name, chain] of variants) {
      const along: IPeak[] = [];
      for (let t: number = t0; t <= t1 + 1e-9; t += 0.025) {
        const ss: number[] = [];
        for (let s: number = s0; s <= s1 + 1e-9; s += 0.25) ss.push(s);
        along.push(...peaks(ss.map((s: number): number => turn(point(chain, s - 0.25, t), point(chain, s, t), point(chain, s + 0.25, t))), (i: number): [number, number] => [ss[i]!, t]));
      }
      const round: IPeak[] = [];
      for (let s: number = s0; s <= s1 + 1e-9; s += 1) {
        const ts: number[] = [];
        for (let t: number = t0; t <= t1 + 1e-9; t += 0.0025) ts.push(t);
        round.push(...peaks(ts.map((t: number): number => turn(point(chain, s, t - 0.0025), point(chain, s, t), point(chain, s, t + 0.0025))), (i: number): [number, number] => [s, ts[i]!]));
      }
      const show = (list: IPeak[]): string =>
        list
          .sort((a: IPeak, b: IPeak): number => b.turn - a.turn)
          .slice(0, 8)
          .map((p: IPeak): string => p.turn.toFixed(2) + "/" + p.around.toFixed(2) + " at s " + p.s.toFixed(2) + " t " + p.t.toFixed(3) + " [" + point(chain, p.s, p.t).map((x: number): string => x.toFixed(1)).join(", ") + "]")
          .join(" | ") || "none";
      lines.push("  " + name + " along the station (" + along.length + "): " + show(along));
      lines.push("  " + name + " round the section (" + round.length + "): " + show(round));
    }
    const out: string | undefined = argument("out");
    if (out !== undefined) await fs.writeFile(out, lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\n");
  }

}

void FamilyConicTurns.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
