import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import { AutoMovieHumanDigitNails as Nails } from "@automovie/human";
import type {
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanNail,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import { FamilyConicMpfbDigitWalls as Walls } from "./FamilyConicMpfbDigitWalls";
import { FamilyConicMpfbDigits as Digits } from "./FamilyConicMpfbDigits";
import { FamilyConicMpfbNailCapture as Capture } from "./FamilyConicMpfbNailCapture";
import { FamilyConicMpfbNailJoin as Join } from "./FamilyConicMpfbNailJoin";
import { FamilyConicMpfbNailPatch as Patch } from "./FamilyConicMpfbNailPatch";
import { FamilyConicMpfbNailStock as Stock } from "./FamilyConicMpfbNailStock";
import { FamilyConicMpfbNailSupport as Support } from "./FamilyConicMpfbNailSupport";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/** The original per-digit skin and nail fitting observations on HM08. */
export namespace FamilyConicMpfbNails {
  /** Two independently specified directions on a distal articulation. */
  export interface IView {
    /** Dorsal or lateral view identity. */
    name: "dorsal" | "lateral";
    /** World unit vector toward the eye. */
    back: P3;
    /** World unit vector defining vertical in the image. */
    up: P3;
  }

  /** An inspection site from an independently measured hand or foot. */
  export interface ISite {
    /** Side named by the source marker groups. */
    side: Digits.Side;
    /** Anatomical key into the published and estimated nail rows. */
    digit: string;
  }

  /** Visit each bilateral anatomy site exactly once without reflecting results. */
  export function sites(
    reads: readonly {
      side: Digits.Side;
      digits: readonly Pick<Digits.IDigit, "name">[];
    }[],
  ): ISite[] {
    const sites: ISite[] = reads.flatMap(({ side, digits }): ISite[] =>
      digits.map(({ name }): ISite => ({ side, digit: name })),
    );
    const actual: Set<string> = new Set(
      sites.map(({ side, digit }): string => `${side}.${digit}`),
    );
    for (const side of ["l", "r"] as const)
      for (const { digit } of Nails.ROWS)
        if (!actual.has(`${side}.${digit}`))
          throw new Error(`Missing nail site ${side}.${digit}`);
    if (sites.length !== 2 * Nails.ROWS.length || actual.size !== sites.length)
      throw new Error(
        "The bilateral site catalog contains a duplicate or unknown digit",
      );
    return sites;
  }

  /** Choose the anatomical dorsal and side cameras on the same source axis. */
  export function views({
    dorsal,
    distal,
  }: IAutoMovieHumanNail.IFrame): [IView, IView] {
    const lateral: P3 | null = Vec.unit(Vec.cross(dorsal, distal));
    if (lateral === null)
      throw new Error("The digit frame has no lateral view");
    return [
      { name: "dorsal", back: dorsal, up: distal },
      { name: "lateral", back: lateral, up: distal },
    ];
  }

  /** Write explicit per-site endpoint, support and clipping observations. */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv[2];
    if (out === undefined)
      throw new Error(
        "Usage: FamilyConicMpfbNails <receipt.json> [exact-hm08-obj] [--views=directory] [--attach|--paired|--skin-patch] [--anchors] [--support] [--measured] [--walls] [--toe-support=observe|fit] [--site=l.finger.index]",
      );
    const args: string[] = process.argv.slice(3);
    const asset: string | undefined = args.find(
      (value): boolean => !value.startsWith("--"),
    );
    const directory: string | undefined = args
      .find((value): boolean => value.startsWith("--views="))
      ?.slice("--views=".length);
    const paired: boolean = args.includes("--paired");
    const skinPatch: boolean = args.includes("--skin-patch");
    const attach: boolean = skinPatch || paired || args.includes("--attach");
    const anchors: boolean = args.includes("--anchors");
    const supportProfile: boolean = args.includes("--support");
    const fromStock: boolean = args.includes("--measured");
    const toeSupport: "observe" | "fit" | undefined = args.includes(
      "--toe-support=fit",
    )
      ? "fit"
      : args.includes("--toe-support=observe")
        ? "observe"
        : undefined;
    const scope: string[] = args
      .filter((value): boolean => value.startsWith("--site="))
      .map((value): string => value.slice("--site=".length));
    const source: Mpfb.ISource = await Mpfb.load(asset);
    const observed: Digits.IRead[] = Digits.measure(source);
    const reference = await Stock.prepare(source);
    const claimed: Set<Stock.IPatch> = new Set();
    const prepare = Tips.prepare(
      source,
      observed,
      Walls.build(source, observed),
      toeSupport,
    );
    const capture =
      directory === undefined
        ? undefined
        : Capture.prepare(source, args.includes("--walls"));
    if (directory !== undefined) await mkdir(directory, { recursive: true });
    const receipts = [];
    const selected: ISite[] = sites(observed).filter(
      ({ side, digit }): boolean =>
        scope.length === 0 || scope.includes(`${side}.${digit}`),
    );
    if (scope.length > 0 && selected.length !== scope.length)
      throw new Error("Unknown or repeated nail site in " + scope.join(", "));
    for (const site of selected) {
      const start: number = performance.now();
      let cap: Tips.ICap | null = null;
      let patch: Stock.IPatch | null = null;
      let cameras: [IView, IView] | null = null;
      try {
        cap = prepare(site.side, site.digit);
        patch = reference(site.digit, cap.pole);
        if (claimed.has(patch))
          throw new Error("The same original material patch names two digits");
        claimed.add(patch);
        const { distal } = cap.frame;
        const dorsal: P3 | null = Vec.unit(
          Vec.sub(
            patch.outward,
            Vec.scale(distal, Vec.dot(patch.outward, distal)),
          ),
        );
        if (dorsal === null)
          throw new Error("Source nail normal does not face across its digit");
        const frame: IAutoMovieHumanNail.IFrame = { ...cap.frame, dorsal };
        cameras = views(frame);
        const made: IAutoMovieHumanDigitNails.IMade = Nails.createFrom(
          { family: cap.family, digit: site.digit },
          frame,
          cap.view,
          {
            attached: attach || anchors || supportProfile,
            ...(fromStock
              ? {
                  measured: patch.points,
                  measuredFaces: patch.faces,
                  groove: patch.margins,
                }
              : {}),
          },
        );
        let join:
          | ReturnType<typeof Join.observe>
          | ReturnType<typeof Join.observePatch>
          | { refusal: string }
          | null = null;
        let mesh: Join.IExterior | undefined;
        if (attach) {
          try {
            join = skinPatch
              ? Join.observePatch(
                  Patch.prepare(made, cap.family),
                  (result): void => {
                    mesh = result;
                  },
                  fromStock ? patch : undefined,
                )
              : Join.observe(
                  cap,
                  made,
                  (retained): void => {
                    mesh = { mesh: retained };
                  },
                  paired,
                );
          } catch (error: unknown) {
            join = {
              refusal: error instanceof Error ? error.message : String(error),
            };
          }
        }
        receipts.push({
          ...site,
          cap: endpoint(cap),
          views: cameras,
          patch: describePatch(patch, made.nail.frame),
          support: made.support,
          readings: made.nail.readings,
          join,
          anchors: anchors ? Join.anchors(cap, made) : null,
          supportProfile: supportProfile
            ? Support.observe(source, patch, cap, made)
            : null,
          preview:
            directory === undefined
              ? null
              : await capture!(directory, cap, made, cameras, patch, mesh),
          refusal: null,
          milliseconds: performance.now() - start,
        });
      } catch (error: unknown) {
        receipts.push({
          ...site,
          cap: cap === null ? null : endpoint(cap),
          views: cameras,
          patch:
            patch === null
              ? null
              : { triangles: patch.indices.length / 3, outward: patch.outward },
          support: null,
          readings: null,
          join: null,
          anchors: null,
          supportProfile: null,
          preview: null,
          refusal: error instanceof Error ? error.message : String(error),
          milliseconds: performance.now() - start,
        });
      }
    }
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(
      out,
      JSON.stringify(
        { asset: source.source, pose: "HM08 rest", receipts },
        null,
        2,
      ) + "\n",
    );
    console.log(
      JSON.stringify(
        receipts.map(
          ({ side, digit, cap, support, join, refusal, milliseconds }) => ({
            side,
            digit,
            endpointGap: cap?.endpointGap,
            clipped: support?.clipped,
            admitted: support?.admitted ?? false,
            retained:
              join !== null && "retained" in join ? join.retained : undefined,
            refusal,
            milliseconds,
          }),
        ),
      ),
    );
  }

  /** Read the labelled reference patch in the candidate's actual nail frame. */
  function describePatch(
    patch: Stock.IPatch,
    frame: IAutoMovieHumanNail.IFrame,
  ) {
    const bounds = (direction: P3): [number, number] => {
      const values: number[] = patch.points.map((p): number =>
        Vec.dot(Vec.sub(p, frame.origin), direction),
      );
      return [Math.min(...values), Math.max(...values)];
    };
    return {
      triangles: patch.indices.length / 3,
      outward: patch.outward,
      span: bounds(frame.distal),
      breadth: bounds(Vec.cross(frame.dorsal, frame.distal)),
    };
  }

  /** Retain facts about the exact source pole without writing the candidate. */
  function endpoint(cap: Tips.ICap) {
    return {
      from: cap.from,
      tip: cap.tip,
      held: cap.held,
      endpointGap: cap.endpointGap,
      protectedGap: cap.protectedGap,
      distalDatumGap: cap.distalDatumGap,
      pole: cap.pole,
      referenceTriangles: cap.sourceIndices.length / 3,
      profileTriangles:
        (cap.profileSourceIndices?.length ?? cap.sourceIndices.length) / 3,
      extents: cap.extents,
    };
  }
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicMpfbNails"
)
  FamilyConicMpfbNails.main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
