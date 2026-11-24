import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import { AutoMovieHumanConicLoft as Loft } from "@automovie/human";
import type {
  IAutoMovieLoftSectionFrame,
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicMpfbFamilies as Families } from "./FamilyConicMpfbFamilies";
import { FamilyConicMpfbSource as Mpfb } from "./FamilyConicMpfbSource";

/** Measured HM08 hand and foot control rows, separate from the fan fit. */
export namespace FamilyConicMpfbDigits {
  /** Side labels used by the asset's anatomical joint groups. */
  export type Side = "l" | "r";

  /** Palm or forefoot and the digits carried by that region. */
  export type Kind = "hand" | "foot";

  /** A measured cross-section or its source refusal on the same chart. */
  export type Section = {
    /** Bony marker or the intervening phalanx's midpoint. */
    label: string;
    /** Distance along the marker polyline, in millimetres. */
    station: number;
    /** World-millimetre chart of the requested skin cut. */
    frame: IAutoMovieLoftSectionFrame;
  } & (
    | { refusal: string }
    | {
        /** Unmodified closed contour in the requested section plane, mm. */
        outline: P2[];
        /** Signed boundary turn, in radians, at each outline point. */
        turns: number[];
        /** Bare limb guide fields in their recentered chart. */
        controls: { origin: P2; values: number[] } | { refusal: string };
      }
  );

  /** One digit's anatomical path, independent skin cuts and course verdict. */
  export interface IDigit {
    /** Anatomical name in the Human digit vocabulary. */
    name: string;
    /** Ordered source rig markers from the root to the terminal phalanx. */
    joints: string[];
    /** Rig marker centres, in world millimetres. */
    centres: P3[];
    /** Fixed marker, midpoint and distal probe observations in station order. */
    sections: Section[];
    /** A local open-to-closed or shared-to-independent skin transition. */
    transitions: {
      /** The shape immediately on the independent side of the bracket. */
      measured: Section;
      /** The adjacent frame for which the diagnostic cut was refused. */
      refused: Section;
    }[];
    /**
     * Rounded course constrained by observed section radii, or the course
     * refusal.
     */
    course: Families.Course | { refusal: string };
  }

  /** One hand or foot measurement in the asset's rest pose. */
  export interface IRead {
    /** Anatomical side of the hand or foot. */
    side: Side;
    /** Region that owns the host sections and its digit chart. */
    kind: Kind;
    /** Host rig landmarks and the palm or forefoot sections in station order. */
    host: { joints: string[]; sections: Section[] };
    /** Digits in anatomical order, including the side-attached thumb for a hand. */
    digits: IDigit[];
  }

  const FINGERS: readonly string[] = [
    "thumb",
    "index",
    "middle",
    "ring",
    "pinky",
  ];
  const TOES: readonly string[] = ["big", "index", "middle", "ring", "little"];

  function unit(value: P3): P3 {
    const normalized: P3 | null = Vec.unit(value);
    if (normalized === null)
      throw new Error("Degenerate HM08 landmark direction");
    return normalized;
  }

  function mid(a: P3, b: P3): P3 {
    return Vec.scale(Vec.add(a, b), 0.5);
  }

  function point(source: Mpfb.IGeometry, key: string): P3 {
    const value: P3 | undefined = source.joints.get(key);
    if (value === undefined) throw new Error(`Missing HM08 rig marker ${key}`);
    return value;
  }

  function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  function planar(origin: P3, tangent: P3, up: P3): IAutoMovieLoftSectionFrame {
    return Loft.axis({
      centres: [origin, Vec.add(origin, tangent)],
      halves: [],
      up,
    }).at(0);
  }

  /** Normalize the sign of the polygon turn by the closed cut's orientation. */
  function turns(outline: readonly P2[]): number[] {
    const area: number = outline.reduce((sum, [x, y], i): number => {
      const [a, b] = outline[(i + 1) % outline.length]!;
      return sum + x * b - y * a;
    }, 0);
    return outline.map(([x, y], i): number => {
      const [ax, ay] = outline[(i + outline.length - 1) % outline.length]!;
      const [bx, by] = outline[(i + 1) % outline.length]!;
      const [u, v]: P2 = [x - ax, y - ay];
      const [p, q]: P2 = [bx - x, by - y];
      return Math.sign(area) * Math.atan2(u * q - v * p, u * p + v * q);
    });
  }

  function section(
    base: Pick<Section, "label" | "station" | "frame">,
    cut: Families.Cut,
  ): Section {
    let outline: P2[];
    try {
      outline = cut(base.frame);
    } catch (error: unknown) {
      return { ...base, refusal: reason(error) };
    }
    const centred = Families.centred(outline, false);
    const values: number[] = Families.fields(centred.points, false);
    return {
      ...base,
      outline,
      turns: turns(outline),
      controls: values.every(Number.isFinite)
        ? { origin: centred.origin, values }
        : { refusal: "An observed outline has no finite conic guide reading" },
    };
  }

  /** Refine only intervals whose sampled endpoint verdicts differ. */
  function transitions(
    rows: readonly Section[],
    up: P3,
    cut: Families.Cut,
  ): IDigit["transitions"] {
    const brackets: IDigit["transitions"] = [];
    for (let i: number = 1; i < rows.length; ++i) {
      let a: Section = rows[i - 1]!,
        b: Section = rows[i]!;
      const firstRefused: boolean = "refusal" in a;
      const lastRefused: boolean = "refusal" in b;
      if (firstRefused === lastRefused) continue;
      // One millimetre is the ordinary Human capture chord. This locates a
      // diagnostic interval, leaving the original sampled verdicts intact.
      while (b.station - a.station > 1) {
        const af = a.frame,
          bf = b.frame;
        const following: Section = section(
          {
            label: `${rows[i - 1]!.label} – ${rows[i]!.label}`,
            station: (a.station + b.station) / 2,
            frame: planar(
              mid([...af.origin], [...bf.origin]),
              unit(Vec.add(Vec.cross(af.v, af.u), Vec.cross(bf.v, bf.u))),
              up,
            ),
          },
          cut,
        );
        const followingRefused: boolean = "refusal" in following;
        if (followingRefused === firstRefused) a = following;
        else b = following;
      }
      brackets.push(
        firstRefused
          ? { measured: b, refused: a }
          : { measured: a, refused: b },
      );
    }
    return brackets;
  }

  /** Rig endpoints and one interior control plane per source phalanx. */
  function digit(
    name: string,
    joints: string[],
    centres: P3[],
    up: P3,
    individual: Families.Cut,
  ): IDigit {
    const normals: P3[] = centres
      .slice(1)
      .map((b, i): P3 => unit(Vec.sub(b, centres[i]!)));
    let station: number = 0;
    const sections: Section[] = [];
    for (let i: number = 0; i < centres.length; ++i) {
      const before: P3 | undefined = normals[i - 1],
        after: P3 | undefined = normals[i];
      const tangent: P3 =
        before === undefined
          ? after!
          : after === undefined
            ? before
            : unit(Vec.add(before, after));
      const a: P3 = centres[i]!;
      sections.push(
        section(
          { label: joints[i]!, station, frame: planar(a, tangent, up) },
          individual,
        ),
      );
      const b: P3 | undefined = centres[i + 1];
      if (b !== undefined && after !== undefined) {
        const length: number = Math.hypot(...Vec.sub(b, a));
        sections.push(
          section(
            {
              label: `${joints[i]} to ${joints[i + 1]}`,
              station: station + length / 2,
              frame: planar(mid(a, b), after, up),
            },
            individual,
          ),
        );
        station += length;
      }
    }
    const terminal: P3 = centres.at(-1)!;
    const span: number = Math.hypot(...Vec.sub(terminal, centres.at(-2)!));
    const tangent: P3 = normals.at(-1)!;
    // ESTIMATE: probe by one measured distal bone span to bracket the external
    // tip wherever skin continues past the last rig marker.
    sections.push(
      section(
        {
          label: "distal probe",
          station: station + span,
          frame: planar(
            Vec.add(terminal, Vec.scale(tangent, span)),
            tangent,
            up,
          ),
        },
        individual,
      ),
    );
    let course: IDigit["course"];
    try {
      course = Families.roundedCourse(centres, individual, up);
      Loft.axis(course);
    } catch (error: unknown) {
      course = { refusal: reason(error) };
    }
    return {
      name,
      joints,
      centres,
      sections,
      transitions: transitions(sections, up, individual),
      course,
    };
  }

  /**
   * Palm chart through the axial MCP span. Forefoot ball section through the
   * first and fifth MTP markers in a ground-vertical plane.
   *
   * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC11531770/
   * @see https://standards.ieee.org/wp-content/uploads/import/governance/iccom/3DBP-Foot_Measurements_Terminology.pdf
   */
  function host(
    source: Mpfb.IGeometry,
    side: Side,
    kind: Kind,
    roots: string[],
    cut: Families.Cut,
  ): IRead["host"] & { up: P3 } {
    const startName: string = `joint-${side}-${kind === "hand" ? "hand" : "foot-1"}`;
    const start: P3 = point(source, startName);
    const axial: string[] = kind === "hand" ? roots.slice(1) : roots;
    const medial: P3 = point(source, axial[0]!);
    const lateral: P3 = point(source, axial.at(-1)!);
    const breadth: P3 = Vec.sub(lateral, medial);
    const centre: P3 = mid(medial, lateral);
    const advance: P3 = Vec.sub(centre, start);
    const across: P3 =
      kind === "hand" ? unit(breadth) : unit([breadth[0], 0, breadth[2]]);
    const normal: P3 =
      kind === "hand"
        ? unit(Vec.sub(advance, Vec.scale(across, Vec.dot(advance, across))))
        : unit(
            Vec.scale(
              Vec.cross(across, [0, 1, 0]),
              Math.sign(Vec.dot(advance, Vec.cross(across, [0, 1, 0]))),
            ),
          );
    const up: P3 =
      kind === "hand"
        ? unit(Vec.scale(Vec.cross(normal, across), side === "l" ? 1 : -1))
        : [0, 1, 0];
    const end: number = Vec.dot(advance, normal);
    const joints: string[] = [startName, ...axial];
    const sections: Section[] = [
      { label: startName, station: 0 },
      { label: "midpoint", station: end / 2 },
      { label: "axial root span", station: end },
    ].map(
      (s): Section =>
        section(
          {
            ...s,
            frame: planar(
              Vec.add(start, Vec.scale(normal, s.station)),
              normal,
              up,
            ),
          },
          cut,
        ),
    );
    return { joints, sections, up };
  }

  /**
   * Carry the finite proximal ray to the already measured parent start. A
   * slanted root cut can cross its neighbour's territory before reaching that
   * neighbour's first phalanx, so actual bone segments alone miss the shared
   * forefoot on a lateral toe.
   */
  export function supportedSegments(
    source: Mpfb.IGeometry,
    joints: readonly string[],
    parent: IAutoMovieLoftSectionFrame,
  ): Families.Segment[] {
    const segments: Families.Segment[] = Families.segments(source, joints);
    const first: Families.Segment | undefined = segments[0];
    if (first === undefined) return segments;
    const [a, b]: Families.Segment = first;
    const tangent: P3 = Vec.sub(b, a);
    const normal: P3 = Vec.cross(parent.v, parent.u);
    const advance: number = Vec.dot(tangent, normal);
    if (!(advance > 0)) return segments;
    const along: number = Vec.dot(Vec.sub(parent.origin, a), normal) / advance;
    return along < 0
      ? [[Vec.add(a, Vec.scale(tangent, along)), a], ...segments]
      : segments;
  }

  /**
   * Prepare the public mesh once. Each digit cut must close around its own axis
   * without a neighbouring digit's bone crossing it. The report keeps every
   * source-plane refusal, including fused webs and uncovered tips.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Source rig markers define the measured frames and an actual closed skin outline owns every reported field row.
   * @evidence contracts/development/implementation.md#efficient-algorithms One prepared skin query serves both sides and the finite joint and midpoint planes.
   * @see https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/data/rigs/standard/rig.default.json
   */
  export function measure(source: Mpfb.IGeometry): IRead[] {
    const read = prepare(source);
    return (["l", "r"] as const).flatMap((side): IRead[] =>
      (["hand", "foot"] as const).map((kind): IRead => read(side, kind)),
    );
  }

  /** Prepare the public skin's section operator and then read one requested anatomical region. */
  export function prepare(source: Mpfb.IGeometry): (side: Side, kind: Kind) => IRead {
    const cut: Families.Cut = Families.prepareCut(source);
    return (side, kind): IRead => {
        const names: readonly string[] = kind === "hand" ? FINGERS : TOES;
        const marker: string = kind === "hand" ? "finger" : "toe";
        const chains: string[][] = names.map((_, i): string[] =>
          // The pinned hallux rig has two bones, while the other rig chains here have three.
          Array.from(
            { length: kind === "foot" && i === 0 ? 3 : 4 },
            (_, j): string => `joint-${side}-${marker}-${i + 1}-${j + 1}`,
          ),
        );
        const { up, ...observed } = host(
          source,
          side,
          kind,
          chains.map((chain): string => chain[0]!),
          cut,
        );
        const segments: Families.Segment[][] = chains.map(
          (chain): Families.Segment[] =>
            supportedSegments(source, chain, observed.sections[0]!.frame),
        );
        const digits: IDigit[] = names.map((name, i): IDigit => {
          const joints: string[] = chains[i]!;
          const foreign: Families.Segment[] = segments.flatMap(
            (rows, j): Families.Segment[] => (i === j ? [] : rows),
          );
          return digit(
            marker + "." + name,
            joints,
            joints.map((key): P3 => point(source, key)),
            up,
            (frame): P2[] => cut(frame, foreign),
          );
        });
        return { side, kind, host: observed, digits };
    };
  }

  /** Produce a self-identifying receipt and list all refused planes by digit. */
  export async function main(): Promise<void> {
    const out: string | undefined = process.argv[2];
    if (out === undefined)
      throw new Error(
        "Usage: FamilyConicMpfbDigits <receipt.json> [exact-hm08-obj]",
      );
    const started: number = performance.now();
    const source: Mpfb.ISource = await Mpfb.load(process.argv[3]);
    const readStarted: number = performance.now();
    const reads: IRead[] = measure(source);
    const milliseconds = {
      source: readStarted - started,
      read: performance.now() - readStarted,
    };
    await mkdir(path.dirname(path.resolve(out)), { recursive: true });
    await writeFile(
      out,
      JSON.stringify(
        {
          asset: source.source,
          pose: "HM08 rest",
          controlBasis:
            "Four measured perimeter guides. The shared MPFB field reader uses a quarter ellipse where a corner ray lacks an observed crossing.",
          milliseconds,
          reads,
        },
        null,
        2,
      ) + "\n",
    );
    for (const { side, kind, host, digits } of reads) {
      for (const { name, sections } of [
        { name: kind, sections: host.sections },
        ...digits,
      ]) {
        const missing = sections.flatMap((row) =>
          "refusal" in row ? [{ label: row.label, reason: row.refusal }] : [],
        );
        console.log(
          JSON.stringify({
            side,
            kind,
            name,
            observed: sections.length - missing.length,
            missing,
          }),
        );
      }
    }
  }
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicMpfbDigits"
)
  FamilyConicMpfbDigits.main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
