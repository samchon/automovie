import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import {
  f1,
  f2,
  m1,
  m2,
} from "../../../../packages/playground/src/human-parameters/index";
import { HUMAN_SLICE_BASELINE } from "./HUMAN_SLICE_BASELINE";
import { HumanCurveAudit } from "./HumanCurveAudit";

/** A person of the audit. */
interface IPerson {
  name: string;
  params: IAutoMovieHumanParameters;
  body: IAutoMovieHumanBodyCalibration;
}

let cache: IPerson[] | null = null;

/** Every person's body, generated once per run: parts share them. */
function people(): IPerson[] {
  cache ??= (
    [["f1", f1], ["f2", f2], ["m1", m1], ["m2", m2], ...extremes()] as [
      string,
      IAutoMovieHumanParameters,
    ][]
  ).map(
    ([name, params]: [string, IAutoMovieHumanParameters]): IPerson => ({
      name,
      params,
      body: AutoMovieHumanBodyLaw.calibrate(params).body,
    }),
  );
  return cache;
}

/**
 * Audit one part, or where every part stands, on every person, and fail with
 * the whole list.
 *
 * @param chains Chains of the part; omitted, the slice bound of the whole body.
 * @throws {Error} Listing every unsound region.
 */
export function assertHumanCurves(chains?: RegExp): void {
  const findings: HumanCurveAudit.IHumanCurveFinding[] = people().flatMap(
    (p: IPerson): HumanCurveAudit.IHumanCurveFinding[] => {
      if (chains !== undefined)
        return HumanCurveAudit.auditHumanCurves(p.name, p.body, chains);
      const before: HumanCurveAudit.IHumanSlice[] | undefined =
        HUMAN_SLICE_BASELINE[p.name];
      return before === undefined
        ? []
        : HumanCurveAudit.auditHumanSlices(
            p.name,
            p.body,
            p.params.body.controls.height.value!,
            before,
          );
    },
  );
  if (findings.length === 0) return;
  const lines: string[] = findings
    .sort(
      (
        a: HumanCurveAudit.IHumanCurveFinding,
        b: HumanCurveAudit.IHumanCurveFinding,
      ): number =>
        a.rule.localeCompare(b.rule) ||
        a.region.localeCompare(b.region) ||
        a.where.localeCompare(b.where),
    )
    .map(
      (f: HumanCurveAudit.IHumanCurveFinding): string =>
        `${f.rule.padEnd(10)} ${f.region.padEnd(28)} ${f.where.padEnd(26)} ${f.person.padEnd(10)} ${f.value.toFixed(2)} over ${f.limit} at ${f.count} points${f.point.length === 0 ? "" : ` near ${f.point.map((v: number): string => v.toFixed(0)).join(" ")}`}`,
    );
  throw new Error(
    `${findings.length} unsound regions in the generated curves:\n${lines.join("\n")}`,
  );
}

/**
 * People at the ends of the public controls, from one person's inputs. Each is
 * a whole person: tapes move together, as a body's do, since a chest of 1300 mm
 * over an underbust of 740 mm is no body at all.
 */
function extremes(): [string, IAutoMovieHumanParameters][] {
  const change = (
    label: string,
    edits: Record<string, number>,
  ): [string, IAutoMovieHumanParameters] => {
    const out: IAutoMovieHumanParameters = structuredClone(f1);
    const controls = out.body.controls as unknown as Record<
      string,
      { value: number | null }
    >;
    for (const [key, value] of Object.entries(edits))
      controls[key]!.value = value;
    return [label, out];
  };
  return [
    change("tall", { height: 2000, inseam: 920 }),
    change("short", { height: 1450, inseam: 640 }),
    change("wide", {
      hip: 1350,
      highHip: 1290,
      waist: 1200,
      underbust: 1190,
      chest: 1300,
      thigh: 780,
      knee: 480,
      calf: 520,
      bicep: 430,
      elbow: 330,
      forearm: 340,
      wrist: 190,
      neck: 440,
      neckBase: 480,
      acrossShoulder: 345,
    }),
    change("narrow", {
      hip: 800,
      highHip: 690,
      waist: 560,
      underbust: 640,
      chest: 720,
      thigh: 440,
      knee: 295,
      calf: 285,
      bicep: 215,
      elbow: 195,
      forearm: 195,
      wrist: 130,
      neck: 295,
      neckBase: 320,
      acrossShoulder: 270,
    }),
    change("masculine", { masculineFeminine: -1 }),
  ];
}
