import { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { AutoMovieLoftViewFullSource, AutoMovieSolidIntersection, AutoMovieSolidVector as V3, realizeAutoMovieConstruction } from "@automovie/engine";
import {
  AutoMovieHumanF1,
  AutoMovieHumanF1Armscye,
  AutoMovieHumanF1Divide,
  AutoMovieHumanF1ThumbRoot,
  AutoMovieHumanJoinLoop,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Where a side join's divider meets its host, read loop by loop.
 *
 * The side joins' master (`AutoMovieHumanJoinLoop.master`) requires one registered closed component of the host cut by its landmark
 * divider. The production survey (`FamilyConicJoints.ts --survey`) records, when that premise fails, each branch's seed on the divider
 * and the host. This tool traces each recorded seed again on the same placed sources, with the same divider, landmarks and owner, and
 * reports every loop in world millimetres: its divider radius and host stations, and how far each registered landmark stands from it,
 * together with each landmark's own divider and host addresses. A trace is also repeated with the divider's radial domain widened, to
 * read where a loop the owned extent cuts off would run.
 *
 * Usage: `FamilyConicSideLoops.cjs --survey=<joints-survey.json> --out=<directory>`; writes `side-loops.json`.
 */
namespace FamilyConicSideLoops {
  type V = AutoMovieVector3Tuple;
  type Surface = IAutoMovieSolidSurface & { point(u: number, v: number): V };

  /** One side's placed divider, landmarks, owner and host source. */
  interface ISide {
    name: string;
    host: IAutoMovieViewPart;
    divider: ReturnType<typeof AutoMovieHumanF1Armscye.surface>;
    landmarks: V[];
    owns: ReturnType<typeof AutoMovieHumanF1Divide.landmarkOwner>;
    count: number;
    child?: { view: IAutoMovieViewPart; family: IAutoMovieHumanConicLoft.IFamily; reference: IAutoMovieHumanConicLoft.IFamily };
  }

  /** The host's full source as the master's walk reads it (`AutoMovieHumanJoinLoop.sourceSurface`). */
  function hostSurface(view: IAutoMovieViewPart): { surface: Surface; reader: IAutoMovieLoftViewFullSource.IReader } {
    const reader: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(view);
    const middle: number = (reader.domain[0] + reader.domain[1]) / 2;
    const jet: IAutoMovieSolidSurface.IJet = reader.jet(middle, 0);
    const facing: number = V3.dot(V3.cross(jet.u, jet.v), V3.sub(jet.p, view.axis.at(middle).origin));
    return {
      reader,
      surface: { name: view.name, domain: [reader.domain[0], reader.domain[1]], period: 2 * Math.PI,
        orientation: facing > 0 ? 1 : -1, point: reader.point, jet: reader.jet },
    };
  }

  /** The divider as the master's walk reads it, over a stated radial domain. */
  function dividerSurface(side: ISide, limit: number): Surface {
    return { name: side.host.name + ".divider", domain: [0, limit], orientation: -1, period: 2 * Math.PI,
      jet: side.divider.jet, point: (r: number, theta: number): V => side.divider.jet(r, theta).p };
  }

  /** Trace one recorded seed and describe the loop it gives. */
  function loop(side: ISide, host: Surface, limit: number, seed: { part: [number, number]; host: [number, number] }) {
    const traced: IAutoMovieSolidIntersection.IResult = AutoMovieSolidIntersection.trace({
      part: dividerSurface(side, limit), host, parameter: { kind: "arc" }, count: side.count, tolerance: 1e-3, grazing: 0.2,
      seed: { s: seed.part[0], phi: seed.part[1], y: seed.host[0], theta: seed.host[1], face: 0 },
    });
    if (traced.curve === null)
      return { seed, closed: false, diagnostics: traced.diagnostics.map((d): string => d.detail.slice(0, 600)) };
    const points = traced.curve.points;
    const nearest = (target: V): number => Math.min(...points.map((q): number => V3.norm(V3.sub(q.point, target))));
    return {
      seed, closed: true, winding: [traced.curve.winding, traced.curve.partWinding], points, curve: traced.curve,
      leastAngle: Math.min(...points.map((q): number => q.angle)),
      dividerRadius: [Math.min(...points.map((q): number => q.s)), Math.max(...points.map((q): number => q.s))],
      hostStation: [Math.min(...points.map((q): number => q.y)), Math.max(...points.map((q): number => q.y))],
      owned: points.filter((q): boolean => side.owns(q.point, true)).length, count: points.length,
      landmarkDistanceMm: side.landmarks.map(nearest),
      world: points.filter((_, i: number): boolean => i % 8 === 0).map((q): V => q.point),
    };
  }

  /** Read every recorded branch of both sides. */
  export async function main(): Promise<void> {
    const survey: string | undefined = process.argv.find((arg): boolean => arg.startsWith("--survey="))?.slice("--survey=".length);
    const out: string | undefined = process.argv.find((arg): boolean => arg.startsWith("--out="))?.slice("--out=".length);
    if (survey === undefined || out === undefined) throw new Error("usage: --survey=<joints-survey.json> --out=<directory>");
    const recorded = JSON.parse(await fs.readFile(survey, "utf8")) as { sides: Record<string, { actual: { reason?: string } }> };
    const figure: IAutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const sources: ReadonlyMap<string, IAutoMovieViewPart> = AutoMovieHumanF1.originalSources(figure,
      new Set([figure.body.trunk.name, figure.body.hand.name, figure.body.arm.name]));
    const frame = (name: string) => {
      const found = figure.frames.get(name);
      if (found === undefined) throw new Error("frame " + name + " is absent");
      return found;
    };
    const thorax = frame("thorax"), metacarpal = frame("thumb.metacarpal");
    const shoulder: V = figure.point("upperarm"), elbow: V = figure.point("lowerarm");
    const armLandmarks: V[] = AutoMovieHumanF1Armscye.landmarks(thorax);
    const root: V = figure.point("thumb2"), tip: V = figure.point("thumb3");
    const thumbLandmarks: V[] = [...AutoMovieHumanF1ThumbRoot.knuckleSeeds(metacarpal), AutoMovieHumanF1ThumbRoot.webFloor(metacarpal)];
    const sides: ISide[] = [
      { name: "armscye", host: sources.get(figure.body.trunk.name)!, landmarks: armLandmarks, count: 192,
        child: { view: sources.get(figure.body.arm.name)!, family: figure.body.arm, reference: figure.reference(figure.body.arm.name) },
        divider: AutoMovieHumanF1Armscye.surface(thorax, shoulder, elbow),
        owns: AutoMovieHumanF1Divide.landmarkOwner(shoulder, [shoulder, elbow, figure.point("hand")], armLandmarks, AutoMovieHumanF1Divide.ARMSCYE_MM) },
      { name: "thumb", host: sources.get(figure.body.hand.name)!, landmarks: thumbLandmarks, count: 48,
        divider: AutoMovieHumanF1ThumbRoot.surface(metacarpal, root, tip),
        owns: AutoMovieHumanF1Divide.landmarkOwner(root, [root, tip], thumbLandmarks) },
    ];
    await fs.mkdir(out, { recursive: true });
    const report = await Promise.all(sides.map(async (side) => {
      const { surface, reader } = hostSurface(side.host);
      const limit: number = side.owns.extent(side.divider);
      const reason: string = recorded.sides[side.name]?.actual.reason ?? "";
      const detail = JSON.parse(reason.slice(reason.indexOf("{"))) as { branches: { part: [number, number]; host: [number, number]; result: string }[] };
      const landmarks = side.landmarks.map((world: V) => {
        const [r, theta] = side.divider.address(world);
        const address = AutoMovieHumanJoinLoop.address(side.host, reader.domain, world, (reader.domain[0] + reader.domain[1]) / 2);
        return { world, divider: [r, theta], host: address, hostGapMm: V3.norm(V3.sub(reader.point(...address), world)),
          owned: side.owns(world, true) };
      });
      const loops = detail.branches.map((branch) => ({ recorded: branch.result, owned: loop(side, surface, limit, branch),
        widened: loop(side, surface, 3 * limit, branch) }));

      // Each later seed read against each earlier closed loop by the alias test's own quantities (`connected.owns`): the world gap
      // from the seed's divider point to the loop's nearest point, that point's chart offsets from the seed and its surface angle, and
      // the largest distance from either loop's points to the other's, which is zero for one loop traced twice.
      const aliases = loops.flatMap((later, j: number) => loops.slice(0, j).flatMap((earlier, i: number) => {
        const a = earlier.owned, b = later.owned;
        if (!("points" in a) || !("points" in b) || a.points === undefined || b.points === undefined) return [];
        const wrap = (x: number): number => Math.atan2(Math.sin(x), Math.cos(x));
        const target: V = side.divider.jet(b.seed.part[0], b.seed.part[1]).p;
        const foot = a.points.reduce((best, q) => V3.norm(V3.sub(q.point, target)) < V3.norm(V3.sub(best.point, target)) ? q : best);
        const apart = (from: typeof a.points, to: typeof a.points): number => Math.max(...from.map((q): number =>
          Math.min(...to.map((r): number => V3.norm(V3.sub(q.point, r.point))))));
        // The alias test's own walk (`connected.owns`): Newton along the traced curve from the nearest sample toward the seed.
        let walked = foot;
        for (let k: number = 0; k < 64; ++k) {
          const delta: V = V3.sub(walked.point, target), square: number = V3.dot(walked.tangent, walked.tangent);
          if (!(square > 0)) break;
          const next = a.curve!.at(walked.t - V3.dot(walked.tangent, delta) / square);
          if (next === null || !(V3.norm(V3.sub(next.point, target)) < V3.norm(delta))) break;
          walked = next;
        }
        return [{ earlier: i, later: j, seedGapMm: V3.norm(V3.sub(foot.point, target)), footAngle: foot.angle,
          footMm: V3.norm(V3.sub(walked.point, target)), walkedAngle: walked.angle, seedMeetingMm: V3.norm(V3.sub(target,
            surface.point(b.seed.host[0], b.seed.host[1]))),
          chart: { ds: foot.s - b.seed.part[0], dphi: wrap(foot.phi - b.seed.part[1]), dy: foot.y - b.seed.host[0],
            dtheta: wrap(foot.theta - b.seed.host[1]) },
          hausdorffMm: Math.max(apart(a.points, b.points), apart(b.points, a.points)) }];
      }));
      // On each closed loop, how many of the child's section planes hold each traced point (`bind`'s premise of one address).
      const childAddresses = side.child === undefined ? null : loops.map(({ owned }) => {
        if (!("points" in owned) || owned.points === undefined) return null;
        const child = side.child!;
        const read = AutoMovieHumanJoinLoop.materialAddresses(child.view, AutoMovieLoftViewFullSource.create(child.view).domain,
          child.family, child.reference);
        const counts = owned.points.map((q): number => read(q.point).length);

        // Where an unreached point's plane lies: the same course read over the family's whole knot span.
        const whole = wideAddresses(child);
        const unreached = owned.points.flatMap((q, k: number) => counts[k] !== 0 ? [] : [{ clock: k, world: q.point,
          stations: (() => { try { return whole(q.point).map(([s]) => s); } catch (error: unknown) { return String(error); } })() }]);
        return { domain: AutoMovieLoftViewFullSource.create(child.view).domain, none: counts.filter((n) => n === 0).length,
          one: counts.filter((n) => n === 1).length, several: counts.filter((n) => n > 1).length, unreached };
      });
      // Whether an unregistered closed loop lies inside the registered loop on the host's chart, the region the join's trim removes
      // (`AutoMovieSolidClip.trim` cuts the host along its rail cycle on the host's chart).
      const ring = loops.find((l) => l.recorded === "registered" && "points" in l.owned && l.owned.points !== undefined);
      const islands = loops.flatMap((l, k: number) => {
        if (l.recorded !== "unregistered" || !("points" in l.owned) || l.owned.points === undefined || ring === undefined ||
            !("points" in ring.owned) || ring.owned.points === undefined) return [];
        const polygon: [number, number][] = ring.owned.points.map((q): [number, number] => [q.y, q.theta]);
        const inside = (y: number, theta: number): boolean => {
          let crossings: number = 0;
          for (let i: number = 0; i < polygon.length; ++i) {
            const [ya, ta] = polygon[i]!, [yb, tb] = polygon[(i + 1) % polygon.length]!;
            if ((ta > theta) !== (tb > theta) && y < ya + ((theta - ta) * (yb - ya)) / (tb - ta)) ++crossings;
          }
          return crossings % 2 === 1;
        };
        const points = l.owned.points;
        return [{ trace: k, inside: points.filter((q): boolean => inside(q.y, q.theta)).length, count: points.length }];
      });
      await draw(side, loops.map((l) => ("points" in l.owned && l.owned.points !== undefined ? { recorded: l.recorded, points: l.owned.points.map((q): V => q.point) } : null)), out);
      return { side: side.name, extentMm: limit, landmarks, aliases, childAddresses, islands,
        loops: loops.map(({ recorded, owned, widened }) => ({ recorded, owned: strip(owned), widened: strip(widened) })) };
    }));
    await fs.writeFile(path.join(out, "side-loops.json"), JSON.stringify(report, null, 1));
    process.stdout.write(JSON.stringify(report.map((side) => ({ side: side.side, extentMm: side.extentMm, aliases: side.aliases, childAddresses: side.childAddresses, islands: side.islands,
      landmarks: side.landmarks.map((l) => ({ divider: l.divider, hostGapMm: l.hostGapMm, owned: l.owned })),
      loops: side.loops.map((l) => ({ recorded: l.recorded, owned: summary(l.owned), widened: summary(l.widened) })) }))) + "\n");
  }

  let reference: R.ISource | undefined;

  /**
   * Curves over clay: the reference's skin and the host's own generated skin near the loops, each with every traced loop and the
   * landmarks drawn over it, under the same fitted orthographic cameras.
   */
  async function draw(side: ISide, loops: ({ recorded: string; points: V[] } | null)[], out: string): Promise<void> {
    reference ??= await R.load(path.resolve(process.cwd(), ".."));
    NodeCanvasRaster.initialize();
    const near: V[] = [...side.landmarks, ...loops.flatMap((l): V[] => l?.points ?? [])];
    const low: V = [0, 1, 2].map((k: number): number => Math.min(...near.map((p): number => p[k]!)) - 40) as V;
    const high: V = [0, 1, 2].map((k: number): number => Math.max(...near.map((p): number => p[k]!)) + 40) as V;
    const keep = (positions: ArrayLike<number>, indices: ArrayLike<number>, scale: number): number[] => {
      const kept: number[] = [];
      for (let t: number = 0; t < indices.length; t += 3)
        if ([0, 1, 2].every((j: number): boolean => [0, 1, 2].every((k: number): boolean => {
          const x: number = positions[indices[t + j]! * 3 + k]! * scale;
          return x >= low[k]! && x <= high[k]!;
        }))) kept.push(indices[t]!, indices[t + 1]!, indices[t + 2]!);
      return kept;
    };
    const generated = realizeAutoMovieConstruction({ name: "side." + side.name, root: { type: "source", name: side.host.name, source: side.host.name }, fills: [] },
      { chord: 0.001, sources: new Map([[side.host.name, side.host]]) }).mesh;
    const clay: [number, number, number] = [0.64, 0.65, 0.67];
    const passes: [string, N.Mesh[]][] = [
      ["reference", [{ id: "reference", positions: Array.from(reference.body.positions, (x: number): number => x / 1000), indices: keep(reference.body.positions, reference.body.indices, 1), colour: clay }]],
      ["generated", generated === null ? [] : [{ id: "generated", positions: generated.positions, indices: keep(generated.positions, generated.indices, 1000), colour: clay }]],
    ];
    const metre = (p: V): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000];
    const curves: N.Curve[] = [
      ...loops.flatMap((l, k: number): N.Curve[] => l === null ? [] : [{ id: side.name + ".trace." + k + "." + l.recorded,
        points: l.points.map(metre), closed: true, xray: true, colour: l.recorded === "registered" ? "b52653" : "2e6fd8" }]),
      ...side.landmarks.flatMap((p: V, k: number): N.Curve[] => [0, 1, 2].map((axis: number): N.Curve => ({
        id: side.name + ".landmark." + k + "." + axis, closed: false, xray: true, colour: "1a8f3a",
        points: [-1.5, 1.5].map((d: number): N.Point => metre([0, 1, 2].map((j: number): number => p[j]! + (j === axis ? d : 0)) as V)) }))),
    ];
    const n: V = side.divider.normal as V;
    const views: [string, V, V][] = side.name === "armscye"
      ? [["front", [1, 0, 0], [0, 1, 0]], ["lateral", [0, 0, 1], [0, 1, 0]], ["back", [-1, 0, 0], [0, 1, 0]], ["armpit", [0.2, -0.6, 1], [0, 1, 0]]]
      : [["divider", n, [0, 1, 0]], ["divider-back", [-n[0], -n[1], -n[2]], [0, 1, 0]], ["front", [1, 0, 0], [0, 1, 0]], ["lateral", [0, 0, 1], [0, 1, 0]]];
    const limits: V[] = Capture.NailEvidence.points(passes.flatMap(([, meshes]): N.Mesh[] => meshes));
    for (const [name, back, top] of views) {
      const length: number = Math.hypot(...back);
      const camera: N.Camera = Capture.NailEvidence.fit(name, back.map((x: number): number => x / length) as V, top, limits, 900, 900);
      for (const [pass, meshes] of passes)
        await fs.writeFile(path.join(out, side.name + "." + name + "." + pass + ".png"),
          NodeCanvasRaster.render(camera, meshes, curves, "xray", side.name + " | " + pass + " | " + name).png);
    }
  }

  /** The child's plane addresses over its family's whole knot span, to read where an unreached point's plane stands. */
  function wideAddresses(child: NonNullable<ISide["child"]>): (world: V) => [number, number][] {
    // The first straight run extends back past the course's start (`certifiedAddresses` carries it to the domain's lower end), so a
    // point proximal of the first knot reads the station it would need; 120 mm reaches past the shoulder's top from the humerus lead.
    return AutoMovieHumanJoinLoop.materialAddresses(child.view, [child.family.knots[0]! - 120, child.family.knots.at(-1)!],
      child.family, child.reference);
  }

  /** The loop without its traced points, for the file. */
  function strip(row: ReturnType<typeof loop>): object {
    const { points: _points, curve: _curve, ...rest } = row as { points?: unknown; curve?: unknown };
    return rest;
  }

  /** The loop's numbers without its points, for the console. */
  function summary(row: object): object {
    const { world: _world, seed: _seed, diagnostics, ...rest } = row as { world?: unknown; seed?: unknown; diagnostics?: string[] };
    return { ...rest, ...(diagnostics === undefined ? {} : { diagnostics: diagnostics.map((d) => d.slice(0, 160)) }) };
  }
}

void FamilyConicSideLoops.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
