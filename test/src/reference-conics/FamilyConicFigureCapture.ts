import { FamilyConicCaptureContext as Capture } from "./FamilyConicCaptureContext";
import { FamilyConicCaptureFrame as Frame } from "./FamilyConicCaptureFrame";
import { FamilyConicCaptureViews as Views } from "./FamilyConicCaptureViews";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

import { AutoMovieHumanF1 } from "@automovie/human";
import type { IAutoMovieHumanF1 } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The whole generated f1 beside its reference: the figure comes from
 * the original create() path in legacy mode or the shared native context; the reference is only
 * drawn in the neighbouring frame under the same camera, light and material.
 */
export namespace FamilyConicFigureCapture {
  /**
   * Render the comparison frames and write their receipt.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The legacy create path or the admitted shared native mesh supplies comparison frames under fixed reference-fitted cameras.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Generation precedes reference loading; whole views and selected close ROIs write through the existing raster boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Native mode adds no second assembly or realization; legacy bare behavior is retained only in the legacy branch.
   * @evidence contracts/development/implementation.md#efficient-algorithms Raster work scales with selected views and mesh/curve count; native mode retains one case mesh and releases each PNG after writing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Native owners, original/raw passes and Deviation borrow the same context and complete camera records.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited writes retain scalar identities; no PNG cache or collection of native cases is held.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and receipt distinguish legacy/default output and shared native observations.
   */
  export async function run(
    context: Capture.IContext | null = null,
  ): Promise<void> {
    const root: string =
      context?.input.root ?? path.resolve(process.cwd(), "..");
    const out: string = path.join(
      root,
      "packages/human/.shots/family-conic-figure",
      context === null
        ? new Date().toISOString().replaceAll(":", "-")
        : path.join(
            context.round,
            "case-" + encodeURIComponent(context.input.selected.id),
          ),
    );
    await fs.mkdir(out, { recursive: true });
    if (context !== null) context.outputs.figure = out;

    // `--bare=<name,...>` drops the named reliefs from the body's families, to see what the wall alone draws under them.
    const bare: string[] = (
      process.argv
        .find((arg: string): boolean => arg.startsWith("--bare="))
        ?.slice("--bare=".length) ?? ""
    )
      .split(",")
      .filter((name: string): boolean => name.length > 0);
    if (context === null && bare.length > 0)
      for (const family of Object.values(AutoMovieHumanF1.BODY))
        family.reliefs = family.reliefs?.filter(
          (relief): boolean => !bare.includes(relief.name),
        );

    // Generation first, timed, before any reference byte is read.
    const started: number = performance.now();
    const pieces: IAutoMovieHumanF1.IPiece[] =
      context?.pieces ?? AutoMovieHumanF1.create();
    const generationMs: number =
      context?.generationMs ?? performance.now() - started;
    const diagnosticCount: number | null = context !== null
      ? context.diagnostics.length
      : pieces.length === 0 ? null : pieces.reduce(
          (count: number, piece: IAutoMovieHumanF1.IPiece): number => count + piece.diagnostics.length,
          0,
        );

    // Legacy `--owners` realizes the skin again; native mode borrows the same context mesh. Each triangle is coloured by its owner (two corners agree; else the
    // middle one's), so a close frame shows which part, band or blend draws what it sees. The colours are listed in the receipt.
    const owned: {
      meshes: N.Mesh[];
      legend: { name: string; rgb: number[] }[];
    } | null = !(context === null
      ? process.argv.includes("--owners")
      : process.argv.some(
          (arg: string): boolean =>
            arg === "--owners" || arg.startsWith("--owners="),
        ))
      ? null
      : ((): {
          meshes: N.Mesh[];
          legend: { name: string; rgb: number[] }[];
        } => {
          const declared =
            context === null ? AutoMovieHumanF1.construction() : null;
          const mesh =
            context?.mesh ??
            AutoMovieEngineConstruction.realize(
              { name: "f1.body", root: declared!.root, fills: declared!.fills },
              { chord: 0.001, sources: declared!.sources },
            ).mesh;
          const owner = (v: number): string =>
            mesh.owners[mesh.coordinates[v * 3]!]!;
          const palette: [number, number, number][] = [
            [0.85, 0.25, 0.25],
            [0.25, 0.7, 0.3],
            [0.25, 0.4, 0.9],
            [0.95, 0.8, 0.2],
            [0.7, 0.3, 0.8],
            [0.2, 0.75, 0.8],
            [0.95, 0.5, 0.15],
            [0.6, 0.85, 0.3],
            [0.9, 0.4, 0.65],
            [0.5, 0.3, 0.15],
            [0.1, 0.45, 0.35],
            [0.55, 0.6, 0.95],
          ];
          const groups: Map<
            string,
            { positions: number[]; indices: number[] }
          > = new Map();
          for (let t: number = 0; t < mesh.indices.length / 3; ++t) {
            const names: string[] = [0, 1, 2].map((k: number): string =>
              owner(mesh.indices[t * 3 + k]!),
            );
            const name: string =
              names[0] === names[1] || names[0] === names[2]
                ? names[0]!
                : names[1]!;
            const group = groups.get(name) ?? { positions: [], indices: [] };
            for (let k: number = 0; k < 3; ++k) {
              const v: number = mesh.indices[t * 3 + k]!;
              group.positions.push(
                mesh.positions[v * 3]!,
                mesh.positions[v * 3 + 1]!,
                mesh.positions[v * 3 + 2]!,
              );
            }
            const n: number = group.positions.length / 3;
            group.indices.push(n - 3, n - 2, n - 1);
            groups.set(name, group);
          }
          const names: string[] = [...groups.keys()].sort(
            (a: string, b: string): number => a.localeCompare(b),
          );
          const colour = (name: string): [number, number, number] =>
            name === "trunk"
              ? [0.64, 0.65, 0.67]
              : palette[
                  names
                    .filter((n: string): boolean => n !== "trunk")
                    .indexOf(name) % palette.length
                ]!;
          return {
            meshes: names.map(
              (name: string): N.Mesh => ({
                id: name,
                ...groups.get(name)!,
                colour: colour(name),
              }),
            ),
            legend: names.map((name: string) => ({
              name,
              rgb: colour(name).map((x: number): number => Math.round(x * 255)),
            })),
          };
        })();
    const faults: { name: string; diagnostics: unknown }[] = pieces
      .filter(
        (piece: IAutoMovieHumanF1.IPiece): boolean =>
          piece.diagnostics.length > 0,
      )
      .map(
        (
          piece: IAutoMovieHumanF1.IPiece,
        ): { name: string; diagnostics: unknown } => ({
          name: piece.name,
          diagnostics: piece.diagnostics,
        }),
      );
    const generated: N.Mesh[] = pieces
      .filter(
        (piece: IAutoMovieHumanF1.IPiece): boolean => piece.positions.length > 0,
      )
      .map(
        (piece: IAutoMovieHumanF1.IPiece): N.Mesh => ({
          id: piece.name,
          positions: piece.positions,
          indices: piece.indices,
          colour: [0.64, 0.65, 0.67],
        }),
      );
    const source: R.ISource = context?.reference ?? (await R.load(root));
    const reference: N.Mesh[] =
      context?.referenceMeshes ??
      [source.body, source.head].map(
        (mesh, i: number): N.Mesh => ({
          id: "reference." + i,
          positions: Array.from(
            mesh.positions,
            (x: number): number => x / 1000,
          ),
          indices: Array.from(mesh.indices),
          colour: [0.64, 0.65, 0.67],
        }),
      );
    const bounds: N.Point[] = [];
    for (const mesh of reference)
      for (let i: number = 0; i < mesh.positions.length; i += 3)
        bounds.push([
          mesh.positions[i]!,
          mesh.positions[i + 1]!,
          mesh.positions[i + 2]!,
        ]);
    NodeCanvasRaster.initialize();
    const frames: {
      file: string;
      sha256: string;
      pass?: string;
      view?: string;
      camera?: N.Camera;
    }[] = [];
    for (const view of context === null
      ? ["front", "back", "left", "right", "high-oblique", "low-oblique"]
      : Views.whole(true)) {
      const camera: N.Camera = Capture.camera(
        context,
        "figure",
        view,
        bounds,
        900,
        1500,
      );
      for (const [stage, shown] of Capture.stages(
        context,
        reference,
        generated,
        owned?.meshes ?? null,
        true,
      )) {
        const file: string = "figure." + view + "." + stage + ".png";
        const frame: { file: string; sha256: string } = await Frame.write(
          context,
          out,
          file,
          camera,
          shown,
          Capture.curves(context, stage),
          stage === "curves" || stage === "raw-loft-curves" ? "xray" : "depth",
          (context === null ? "f1" : context.input.selected.id) +
            " | " +
            stage +
            " | " +
            view,
          stage,
          "figure",
          { stage, realization: "mesh-returned", diagnosticCount },
        );
        frames.push({
          ...frame,
          ...(context === null ? {} : { pass: stage, view, camera }),
        });
      }
    }

    // Within `radius` metres of a reference joint, taken on the +Z side.
    const near = (joint: string, radius: number): ((p: N.Point) => boolean) => {
      const at: number[] | undefined = source.joints.get(joint);
      if (at === undefined) throw new Error("no joint " + joint);
      const c: number[] = [
        at[0]! / 1000,
        at[1]! / 1000,
        Math.abs(at[2]!) / 1000,
      ];
      return (p: N.Point): boolean =>
        Math.hypot(p[0] - c[0]!, p[1] - c[1]!, p[2] - c[2]!) < radius;
    };
    // Within `radius` metres of the midpoint of two reference joints, taken on the +Z side: a web between two digits, a row of knuckles.
    const between = (
      a: string,
      b: string,
      radius: number,
    ): ((p: N.Point) => boolean) => {
      const [p, q]: (number[] | undefined)[] = [
        source.joints.get(a),
        source.joints.get(b),
      ];
      if (p === undefined || q === undefined)
        throw new Error("no joint " + (p === undefined ? a : b));
      const c: number[] = [
        (p[0]! + q[0]!) / 2000,
        (p[1]! + q[1]!) / 2000,
        (Math.abs(p[2]!) + Math.abs(q[2]!)) / 2000,
      ];
      return (x: N.Point): boolean =>
        Math.hypot(x[0] - c[0]!, x[1] - c[1]!, x[2] - c[2]!) < radius;
    };
    // Close frames: the same pair framed on the reference's points inside one zone of the figure, metres.
    const zones: [string, (p: N.Point) => boolean][] = [
      ["head", (p: N.Point): boolean => p[1] > 1.45],
      [
        "hand",
        (p: N.Point): boolean => p[2] > 0.38 && p[1] > 0.84 && p[1] < 1.04,
      ],
      ["foot", (p: N.Point): boolean => p[2] > 0 && p[1] < 0.13],
      [
        "shoulder",
        (p: N.Point): boolean => p[2] > 0.06 && p[1] > 1.2 && p[1] < 1.45,
      ],
      [
        "shoulder.twin",
        (p: N.Point): boolean => p[2] < -0.06 && p[1] > 1.2 && p[1] < 1.45,
      ],
      [
        "ear",
        (p: N.Point): boolean =>
          p[2] > 0.07 &&
          p[1] > 1.535 &&
          p[1] < 1.61 &&
          p[0] > -0.02 &&
          p[0] < 0.035,
      ],
      [
        "neck",
        (p: N.Point): boolean =>
          p[1] > 1.42 && p[1] < 1.53 && Math.abs(p[2]) < 0.09,
      ],
      [
        "hip",
        (p: N.Point): boolean =>
          p[1] > 0.72 && p[1] < 0.98 && Math.abs(p[2]) < 0.22,
      ],
      [
        "chest",
        (p: N.Point): boolean =>
          p[1] > 1.14 && p[1] < 1.42 && Math.abs(p[2]) < 0.2,
      ],
      ["knee", (p: N.Point): boolean => p[2] > 0 && p[1] > 0.38 && p[1] < 0.6],
      [
        "eyes",
        (p: N.Point): boolean =>
          p[0] > 0.08 && p[1] > 1.565 && p[1] < 1.62 && Math.abs(p[2]) < 0.06,
      ],
      [
        "mouth",
        (p: N.Point): boolean =>
          p[0] > 0.09 && p[1] > 1.5 && p[1] < 1.55 && Math.abs(p[2]) < 0.035,
      ],
      // The nose's base: its wings, the alar grooves and the nostrils, with a view from below, which the face's zones lack.
      [
        "nose",
        (p: N.Point): boolean =>
          p[0] > 0.105 &&
          p[1] > 1.538 &&
          p[1] < 1.568 &&
          Math.abs(p[2]) < 0.024,
      ],
      [
        "fold",
        (p: N.Point): boolean =>
          p[1] > 1.19 && p[1] < 1.27 && p[2] > 0 && p[2] < 0.13 && p[0] > 0,
      ],
      ["toes", (p: N.Point): boolean => p[2] > 0 && p[1] < 0.05 && p[0] > 0.16],
      // The armpit, within 110 mm of the +Z shoulder joint, and the elbow, within 70 mm of the +Z elbow joint, with views from behind and
      // below, which the armscye's folds and the cubital fossa need.
      ["armpit", near("upperarm_l", 0.11)],
      ["elbow", near("lowerarm_l", 0.07)],
      // The hand's close frames: the web between the thumb and the index finger (30 mm round the midpoint of the thumb's second joint and
      // the index finger's first), the back of the hand over the knuckles (45 mm round the middle and ring fingers' first joints), and the
      // finger roots where the hand's end splits (32 mm round the same point).
      ["hand.web", between("thumb_02_l", "index_01_l", 0.03)],
      ["hand.dorsum", between("middle_01_l", "ring_01_l", 0.045)],
      ["hand.roots", between("middle_01_l", "ring_01_l", 0.032)],
    ];
    const views = (zone: string): string[] =>
      zone.startsWith("shoulder")
        ? [
            "front",
            "back",
            zone === "shoulder" ? "left" : "right",
            "high-oblique",
          ]
        : zone === "nose"
          ? ["front", "left", "high-oblique", "low-oblique"]
          : zone === "armpit" || zone === "hand"
            ? ["front", "back", "left", "high-oblique", "low-oblique"]
            : zone === "elbow"
              ? ["front", "back", "left", "high-oblique"]
              : zone === "hand.web"
                ? ["front", "high-oblique", "left"]
                : zone === "hand.dorsum"
                  ? ["left", "back", "high-oblique"]
                  : zone === "hand.roots"
                    ? ["left", "high-oblique", "low-oblique", "front"]
                    : ["front", "left", "high-oblique"];
    // `--zones=<zone,...>`: only those close frames.
    const only: string[] = (
      process.argv
        .find((arg: string): boolean => arg.startsWith("--zones="))
        ?.slice("--zones=".length) ?? ""
    )
      .split(",")
      .filter((name: string): boolean => name.length > 0);
    for (const [zone, inside] of context === null
      ? zones
      : Capture.pairedZones(zones)) {
      if (
        only.length > 0 &&
        !only.includes(zone) &&
        !(context !== null && only.includes(zone.replace(/\.twin$/, "")))
      )
        continue;
      const near: N.Point[] = bounds.filter(inside);
      const zoneViews: string[] =
        context === null ? views(zone) : Capture.views(zone, views);
      if (context !== null)
        context.zones.push({ id: zone, points: near, views: zoneViews });
      for (const view of zoneViews) {
        const camera: N.Camera = Capture.camera(
          context,
          zone,
          view,
          near,
          900,
          900,
        );
        for (const [stage, shown] of Capture.stages(
          context,
          reference,
          generated,
          owned?.meshes ?? null,
          false,
        )) {
          const file: string = zone + "." + view + "." + stage + ".png";
          const frame: { file: string; sha256: string } = await Frame.write(
            context,
            out,
            file,
            camera,
            shown,
            Capture.curves(context, stage),
            stage === "curves" || stage === "raw-loft-curves"
              ? "xray"
              : "depth",
            (context === null ? "f1" : context.input.selected.id) +
              " | " +
              stage +
              " | " +
              zone +
              " " +
              view,
            stage,
            zone,
            { stage, realization: "mesh-returned", diagnosticCount },
          );
          frames.push({
            ...frame,
            ...(context === null ? {} : { pass: stage, view, camera }),
          });
        }
      }
    }
    const receipt = {
      ...(context === null ? {} : { native: Capture.metadata(context) }),
      schema: "f1-family-conic-figure-v1",
      generationMs: Math.round(generationMs),
      pieces: pieces.map(
        (
          piece: IAutoMovieHumanF1.IPiece,
        ): { name: string; vertices: number; triangles: number } => ({
          name: piece.name,
          vertices: piece.positions.length / 3,
          triangles: piece.indices.length / 3,
        }),
      ),
      faults,
      frames,
      ...(owned === null ? {} : { owners: owned.legend }),
    };
    await fs.writeFile(
      path.join(out, "receipt.json"),
      JSON.stringify(receipt, null, 2),
    );
    process.stdout.write(
      JSON.stringify({
        out,
        generationMs: receipt.generationMs,
        pieces: pieces.length,
        faults,
      }) + "\n",
    );
  }
}
