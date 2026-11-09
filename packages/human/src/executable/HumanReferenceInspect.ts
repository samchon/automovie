import type { IAutoMovieCurve64 as C } from "@automovie/engine";
import type { IAutoMovieRecoveryHermiteCurve } from "@automovie/recovery";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { HumanInspectionCurveScaffold as S } from "../inspection/HumanInspectionCurveScaffold";
import { NodeCanvasCamera } from "../inspection/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeCanvasRaster } from "./NodeCanvasRaster";

/**
 * Inspect an explicitly selected saved reference span through existing Node display adapters.
 * Arguments are basis, relative JSON file, section/station index, kind, curve ordinal and span index.
 * Both horizontal and limb packs retain their actual source frame, phase widths and identities.
 * This command never generates a Human, opens a browser, or claims a reference as generated skin.
 */
export async function HumanReferenceInspect(
  argv: readonly string[],
): Promise<void> {
  if (argv.length === 6 && argv[0] === "both") {
    for (const basis of ["hermite", "bezier"])
      await HumanReferenceInspect([basis, ...argv.slice(1)]);
    return;
  }
  const [basis, relative, sectionText, kind, ordinalText, spanText]: readonly (
    | string
    | undefined
  )[] = argv;
  if (
    argv.length !== 6 ||
    !["hermite", "bezier"].includes(basis ?? "") ||
    relative === undefined ||
    !relative.endsWith(".json") ||
    kind === undefined ||
    !/^[a-z]+$/.test(kind)
  )
    throw new Error(
      "Usage: node:reference <hermite|bezier|both> <relative.json> <section-or-station-index> <kind> <curve-ordinal> <span-index>",
    );
  const indices: number[] = [sectionText, ordinalText, spanText].map(
    (value: string | undefined): number => Number(value),
  );
  if (
    indices.some(
      (value: number): boolean => !Number.isSafeInteger(value) || value < 0,
    )
  )
    throw new Error("Select nonnegative actual source indices");
  const root: string = HumanNodePaths.resolve(
    ".references/curves/" + basis + "/f1",
  );
  const file: string = path.resolve(root, relative);
  const inside: string = path.relative(root, file);
  if (inside.startsWith("..") || path.isAbsolute(inside))
    throw new Error("Select a file inside the private f1 basis pack");
  const bytes: Buffer = await fs.readFile(file);
  const document: {
    sections?: {
      index: number;
      curves: { kind: string; ordinal: number; curve: S.Curve }[];
    }[];
    stations?: {
      station: number;
      loops: { kind: string; ordinal: number; curve: S.Curve }[];
    }[];
  } = JSON.parse(bytes.toString("utf8"));
  const rows: { kind: string; ordinal: number; curve: S.Curve }[] | undefined =
    document.sections?.find(
      (section: NonNullable<typeof document.sections>[number]): boolean =>
        section.index === indices[0],
    )?.curves ??
    document.stations?.find(
      (station: NonNullable<typeof document.stations>[number]): boolean =>
        station.station === indices[0],
    )?.loops;
  const selected: { kind: string; ordinal: number; curve: S.Curve }[] =
    rows?.filter(
      (row: { kind: string; ordinal: number; curve: S.Curve }): boolean =>
        row.kind === kind && row.ordinal === indices[1],
    ) ?? [];
  const curve: C.Cubic | IAutoMovieRecoveryHermiteCurve | undefined =
    selected[0]?.curve;
  if (
    selected.length !== 1 ||
    curve === undefined ||
    curve.type !== (basis === "hermite" ? "cubicHermite" : "cubicBezier")
  )
    throw new Error("Requested actual curve/basis is unavailable");
  const drawn: S.Result = S.of(curve, indices[2]!);

  // Draw the actual curve last so coincident box edges cannot hide a straight source span.
  const curves: N.Curve[] = [...drawn.aids, drawn.curve];
  const startedUtc: string = new Date().toISOString();
  const out: string = HumanNodePaths.resolve(
    "packages/human/.shots/reference_aids_xhigh/" +
      basis +
      "-" +
      startedUtc.replaceAll(/[:.]/g, "-"),
  );
  await fs.mkdir(out, { recursive: true });
  const frames: {
    file: string;
    sha256: string;
    camera: N.Camera;
    milliseconds: { canvas: number; raster: number; encode: number };
    pixels: { surface: number; line: number; hiddenLine: number };
  }[] = [];
  for (const name of ["front", "left", "top", "high-oblique"]) {
    const camera: N.Camera = NodeCanvasCamera.fit(
      name,
      curves.flatMap((value: N.Curve): N.Point[] => [...value.points]),
      1000,
      900,
    );
    const rendered: ReturnType<typeof NodeCanvasRaster.render> =
      NodeCanvasRaster.render(
        camera,
        [],
        curves,
        "xray",
        "REFERENCE cubic | blue source | gold controls | teal tangents | grey hull box",
      );
    const frameFile: string = name + ".png";
    await fs.writeFile(path.join(out, frameFile), rendered.png);
    frames.push({
      file: frameFile,
      sha256: hash(rendered.png),
      camera,
      milliseconds: rendered.milliseconds,
      pixels: rendered.pixels,
    });
  }
  if (hash(await fs.readFile(file)) !== hash(bytes))
    throw new Error("Selected private source changed during inspection");
  const receipt: Record<string, unknown> = {
    stage: "saved-reference-authoring-aids",
    generatedHuman: "not-run",
    finalSkin: "not-run",
    startedUtc,
    completedUtc: new Date().toISOString(),
    source: {
      file,
      sha256: hash(bytes),
      basis,
      sectionOrStation: indices[0],
      kind,
      ordinal: indices[1],
      curveName: curve.name,
      closed: curve.closed,
      phaseUnit: curve.phaseUnit,
      phaseIntervals: curve.phaseIntervals,
      span: indices[2],
      phaseWidth: drawn.phaseWidth,
    },
    controlsMm: drawn.controlsMm,
    boundsMm: drawn.boundsMm,
    conditions:
      "Original mm coefficients; display metres. Four actual cubic controls, not interpolation points. Box bounds this polynomial frame only. Fixed 64 display chords have no approximation bound. No native mesh or anatomical acceptance is requested.",
    lineIds: curves.map((value: N.Curve): string => value.id),
    frames,
  };
  await fs.writeFile(
    path.join(out, "manifest.json"),
    JSON.stringify(receipt, null, 2),
  );
  process.stdout.write(
    JSON.stringify({
      event: "reference-inspection-complete",
      out,
      frames: frames.length,
      utc: receipt.completedUtc,
    }) + "\n",
  );
}

/** Exact source and PNG byte identity, separate from numerical equivalence. */
function hash(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

if (require.main === module)
  HumanReferenceInspect(process.argv.slice(2)).catch((error: unknown): void => {
    process.stderr.write(
      (error instanceof Error
        ? (error.stack ?? error.message)
        : String(error)) + "\n",
    );
    process.exitCode = 1;
  });
