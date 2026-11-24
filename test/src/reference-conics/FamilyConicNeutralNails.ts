import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vec,
} from "@automovie/engine";
import {
  AutoMovieHumanBodyLaw as Body,
  AutoMovieHumanDigitNails as Nails,
  AutoMovieHumanNailContact as Paired,
} from "@automovie/human";
import { AutoMovieHumanNeutralParameters } from "@automovie/human/capture";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanNail,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieViewPart,
  IAutoMovieHumanBodyLane as Lane,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicMpfbNailJoin as Join } from "./FamilyConicMpfbNailJoin";
import { FamilyConicNeutralNailCapture as Capture } from "./FamilyConicNeutralNailCapture";

/** Native contact observations on the actual arm/foot source factories. */
export namespace FamilyConicNeutralNails {
  /** The two distal measures together with the actual original they place. */
  interface IInput {
    original: IAutoMovieHumanDigitNails.IOriginal;
    frame: IAutoMovieHumanNail.IFrame;
  }

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
          await record(hand.digit.name, (): IInput => finger(hand), directory),
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
              return toe(row, joints, index);
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

  /** Read the named IP/DIP section of the actual transported finger walk. */
  function finger({ digit, definition }: Lane.IDigit): IInput {
    const source: IAutoMovieViewPart = part(definition);
    const number: number = digit.centres.length - 2;
    const joint: number | undefined = source.front.positive.knots.find(
      (k): boolean => k.site === `joint ${number}`,
    )?.station;
    if (joint === undefined)
      throw new Error("Missing named distal joint in " + source.name);
    const ray: string = source.name.split(".").at(-1)!;
    const anatomy: string = source.name.startsWith("thumb.")
      ? "finger.thumb"
      : `finger.${ray === "little" ? "pinky" : ray}`;
    return {
      original: {
        digit: anatomy,
        source,
        jointDistance: (s): number => s - joint,
      },
      frame: frame(digit.centres, source.axis.at(joint).u),
    };
  }

  /** Project the actual distal bone into the toe's owned fixed plane clock. */
  function toe(
    { toe, definition }: Lane.IToe,
    joints: P3[],
    index: number,
  ): IInput {
    const source: IAutoMovieViewPart = part(definition);
    const placed = frame(joints, [0, 1, 0]);
    const centre: number = Vec.dot(
      Vec.sub(placed.origin, toe.centres[0]!),
      toe.along,
    );
    const projection: number = Vec.dot(placed.distal, toe.along);
    if (!(projection > 0))
      throw new Error("Distal bone reverses the toe's section planes");
    const digit: string = Nails.ROWS.filter(({ digit }): boolean =>
      digit.startsWith("toe."),
    )[index]!.digit;
    return {
      original: {
        digit,
        source,
        jointDistance: (s): number => (s - centre) / projection,
      },
      frame: placed,
    };
  }

  /** The actual distal joint, bone direction and its section's dorsal hint. */
  function frame(points: readonly P3[], hint: P3): IAutoMovieHumanNail.IFrame {
    const origin: P3 = points.at(-2)!;
    const distal: P3 | null = Vec.unit(Vec.sub(points.at(-1)!, origin));
    const dorsal: P3 | null =
      distal === null
        ? null
        : Vec.unit(Vec.sub(hint, Vec.scale(distal, Vec.dot(hint, distal))));
    if (distal === null || dorsal === null)
      throw new Error("Distal nail frame is singular");
    return { origin, distal, dorsal };
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
      const digit = Nails.addReliefs(original, {}, [nail.bed, nail.strip]);
      const plate = Nails.attachmentPlate(nail.plate, nail.bed);
      const paired = Paired.prepare(
        nail,
        plate,
        digit,
        fitted.support.domain[1],
      );
      const host = Full.create(digit);
      const crown = Full.create(plate);
      const bare = Full.create(original);
      const aside: P3 = Vec.cross(nail.frame.distal, nail.frame.dorsal);
      // Twice the native contact guide density also exercises its interval interiors.
      const count: number = 32;
      const measured = Array.from({ length: count }, (_, index) => {
        const clock: number = (2 * Math.PI * index) / count;
        const h = paired.at(clock),
          p = paired.partAt(clock);
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
      const closure: number = Math.max(
        Vec.norm(
          Vec.sub(
            host.point(...paired.at(0).point),
            host.point(...paired.at(2 * Math.PI).point),
          ),
        ),
        Vec.norm(
          Vec.sub(
            crown.point(...paired.partAt(0).point),
            crown.point(...paired.partAt(2 * Math.PI).point),
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
      mesh = Join.observePatch(fitted, (built): void => {
        exterior = built;
      });
      const capture =
        directory === undefined || exterior === undefined
          ? undefined
          : await Capture.write(directory, fitted, exterior, prepared.frame);
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

  /** Save the isolated native observations; the full body is never requested. */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv[2];
    if (out === undefined)
      throw new Error(
        "Usage: FamilyConicNeutralNails <receipt.json> [--side=left|right] [--views=directory] [--site=finger.left.index]",
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
    const start: number = performance.now();
    const sites = await observe(side, directory, selected);
    const result = {
      scope: "independent neutral originals",
      milliseconds: performance.now() - start,
      sites,
    };
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
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
