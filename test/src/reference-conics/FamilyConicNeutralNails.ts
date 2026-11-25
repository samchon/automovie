import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import {
  AutoMovieHumanBodyLaw as Body,
  AutoMovieHumanDigitNails as Nails,
  AutoMovieHumanNailSource as Source,
} from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicMpfbNailJoin as Join } from "./FamilyConicMpfbNailJoin";
import { FamilyConicMpfbNailPatch as Patch } from "./FamilyConicMpfbNailPatch";
import { FamilyConicNeutralNailAssembly as Assembly } from "./FamilyConicNeutralNailAssembly";
import { FamilyConicNeutralNailCapture as Capture } from "./FamilyConicNeutralNailCapture";

/** Native contact observations on the actual arm/foot source factories. */
export namespace FamilyConicNeutralNails {
  /** The two distal measures together with the actual original they place. */
  type IInput = IAutoMovieHumanDigitNails.IPlaced;

  /** Closure and cross-chart agreement in the native world frame. */
  interface IContact {
    count: number;
    gap: number;
    tangent: number;
    closure: number;
  }

  /** One native material outline and its scale in the plate frame, mm. */
  interface IPlanReading {
    planned: { length: number; width: number };
    paired: { length: number; width: number; relief: [number, number] };
    pitch: number;
  }

  /** Observe selected neutral digit originals without requesting their fan. */
  export async function observe(
    selected?: "left" | "right",
    directory?: string,
    sites: readonly string[] = [],
  ) {
    const prepared = Body.prepareSources(AutoMovieHumanNeutralParameters);
    const rest = prepared.limbRest();
    const limbs = prepared.limbSources(rest);
    const results: Awaited<ReturnType<typeof record>>[] = [];
    const requested = (name: string): boolean =>
      sites.length === 0 || sites.includes(name);
    for (const side of ["left", "right"] as const) {
      if (selected !== undefined && side !== selected) continue;
      const arm = limbs.arm(side);
      const leg = rest.leg(side);
      const foot = limbs.leg(side).prepareFoot();
      for (const hand of arm.fingers()) {
        if (!requested(hand.digit.name)) continue;
        results.push(
          await record(
            hand.digit.name,
            (): IInput =>
              Source.finger(part(hand.definition), hand.digit.centres),
            directory,
          ),
        );
      }
      for (const [index, row] of foot.toes().entries()) {
        if (!requested(row.toe.name)) continue;
        results.push(
          await record(
            row.toe.name,
            (): IInput => {
              const joints: P3[] = leg.foot.toes[index]!.map(
                (p): P3 => Vec.add(p, [leg.shift[0], 0, leg.shift[1]]),
              );
              return Source.toe(part(row.definition), joints, index);
            },
            directory,
          ),
        );
      }
    }
    if (sites.length > 0 && results.length !== sites.length)
      throw new Error(
        "Unknown, repeated or out-of-side neutral nail site in " +
          sites.join(", "),
      );
    return results;
  }

  /** Keep a failed original's diagnostics without creating alternate skin. */
  function part(
    definition: IAutoMovieHumanSourceDefinition,
  ): IAutoMovieViewPart {
    if (definition.part === null)
      throw new Error(JSON.stringify(definition.diagnostics));
    return definition.part;
  }

  /** Keep original and contact refusals distinct for each anatomical site. */
  async function record(name: string, input: () => IInput, directory?: string) {
    const started: number = performance.now();
    let prepared: IInput | undefined;
    let fitted: IAutoMovieHumanDigitNails.IMade | undefined;
    let contact: IContact | null = null;
    let plan: IPlanReading | null = null;
    let mesh: ReturnType<typeof Join.observePatch> | null = null;
    try {
      prepared = input();
      fitted = Nails.createOn(prepared.original, prepared.frame, {
        attached: true,
      });
      const { nail, original } = fitted;
      const patch: Patch.IPrepared = Patch.prepare(fitted, {});
      const {
        digit,
        contact: {
          host: { surface: host },
          part: { surface: crown },
          pair,
        },
      } = patch;
      const bare = Full.create(original);
      const aside: P3 = Vec.cross(nail.frame.distal, nail.frame.dorsal);
      // Twice the native contact guide density also exercises its interval interiors.
      const count: number = 32;
      const measured = Array.from({ length: count }, (_, index) => {
        const clock: number = (2 * Math.PI * index) / count;
        const { parent: h, plate: p } = pair(clock);
        const a = host.jet(...h.point),
          b = crown.jet(...p.point);
        const local: P3 = Vec.sub(a.p, nail.frame.origin);
        const tangent = (jet: typeof a, rate: readonly [number, number]): P3 =>
          Vec.add(Vec.scale(jet.u, rate[0]), Vec.scale(jet.v, rate[1]));
        return {
          gap: Vec.norm(Vec.sub(a.p, b.p)),
          tangent: Vec.norm(Vec.sub(tangent(a, h.first), tangent(b, p.first))),
          along: Vec.dot(local, nail.frame.distal),
          across: Vec.dot(local, aside),
          relief: Vec.dot(
            Vec.sub(a.p, bare.point(...h.point)),
            nail.frame.dorsal,
          ),
        };
      });
      const first = pair(0);
      const last = pair(2 * Math.PI);
      const closure: number = Math.max(
        Vec.norm(
          Vec.sub(
            host.point!(...first.parent.point),
            host.point!(...last.parent.point),
          ),
        ),
        Vec.norm(
          Vec.sub(
            crown.point!(...first.plate.point),
            crown.point!(...last.plate.point),
          ),
        ),
      );
      contact = {
        count,
        gap: Math.max(...measured.map(({ gap }): number => gap)),
        tangent: Math.max(...measured.map(({ tangent }): number => tangent)),
        closure,
      };
      const length = (values: number[]): number =>
        Math.max(...values) - Math.min(...values);
      const relief: number[] = measured.map((row): number => row.relief);
      plan = {
        planned: {
          length: nail.plan.span[1] - nail.plan.span[0],
          width: nail.readings.width,
        },
        paired: {
          length: length(measured.map((row): number => row.along)),
          width: length(measured.map((row): number => row.across)),
          relief: [Math.min(...relief), Math.max(...relief)],
        },
        pitch: nail.readings.pitch,
      };
      let exterior: Join.IExterior | undefined;
      mesh = Join.observePatch(patch, (built): void => {
        exterior = built;
      });
      const capture =
        directory === undefined || exterior === undefined
          ? undefined
          : await Capture.write(
              directory,
              fitted.original,
              exterior,
              prepared.frame,
            );
      return {
        name,
        anatomy: prepared.original.digit,
        support: fitted.support,
        axisPreserved: original.axis === digit.axis,
        contact,
        plan,
        mesh,
        capture,
        refusal: null,
        milliseconds: performance.now() - started,
      };
    } catch (error: unknown) {
      return {
        name,
        anatomy: prepared?.original.digit ?? null,
        support: fitted?.support ?? null,
        contact,
        plan,
        mesh,
        refusal: error instanceof Error ? error.message : String(error),
        milliseconds: performance.now() - started,
      };
    }
  }

  /** Save isolated originals or explicitly request the final production skin. */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv[2];
    if (out === undefined)
      throw new Error(
        "Usage: FamilyConicNeutralNails <receipt.json> [--assembled] [--side=left|right] [--views=directory] [--site=finger.left.index] [--views-site=finger.left.index]",
      );
    const side: string | undefined = process.argv
      .find((a): boolean => a.startsWith("--side="))
      ?.slice(7);
    if (side !== undefined && side !== "left" && side !== "right")
      throw new Error("Unknown neutral nail side " + side);
    const directory: string | undefined = process.argv
      .find((a): boolean => a.startsWith("--views="))
      ?.slice(8);
    if (directory !== undefined) await mkdir(directory, { recursive: true });
    const selected: string[] = process.argv
      .filter((a): boolean => a.startsWith("--site="))
      .map((a): string => a.slice(7));
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    if (process.argv.includes("--assembled")) {
      const captured: string[] = process.argv
        .filter((a): boolean => a.startsWith("--views-site="))
        .map((a): string => a.slice(13));
      const report = await Assembly.observe(
        side,
        selected,
        directory,
        captured,
      );
      await writeFile(out, JSON.stringify(report, null, 2) + "\n");
      console.log(out);
      if (
        report.sites.length === 0 ||
        report.unavailable.length !== 0 ||
        report.sites.some(({ retained }): boolean => !retained)
      )
        process.exitCode = 1;
      return;
    }
    const start: number = performance.now();
    const sites = await observe(side, directory, selected);
    const result = {
      scope: "independent neutral originals",
      milliseconds: performance.now() - start,
      sites,
    };
    await writeFile(out, JSON.stringify(result, null, 2) + "\n");
    console.log(
      JSON.stringify(
        sites.map(
          ({ name, support, contact, mesh, refusal, milliseconds }) => ({
            name,
            clipping: support?.clipped,
            contact,
            realizedClipping: mesh?.clearance.maximumMm,
            retained: mesh?.retained,
            refusal,
            milliseconds,
          }),
        ),
      ),
    );
  }
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicNeutralNails"
)
  FamilyConicNeutralNails.main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
