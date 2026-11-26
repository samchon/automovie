import {
  AutoMovieHumanArmBones,
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanBodyLaw,
} from "@automovie/human";
import {
  AutoMovieHumanNeutralParameters,
  buildHumanNeutralCapture,
} from "@automovie/human/capture";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanExtremityDimensions,
  IAutoMovieHumanParameters,
} from "@automovie/interface";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { FamilyConicBodyCases as Cases } from "./FamilyConicBodyCases";
import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicNeutralForm as Form } from "./FamilyConicNeutralForm";
import { FamilyConicNeutralNailAssembly as Nails } from "./FamilyConicNeutralNailAssembly";
import { FamilyConicNeutralViews as Views } from "./FamilyConicNeutralViews";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";

/**
 * Exact input changes for the independent neutral body and its verification
 * round.
 */
export namespace FamilyConicNeutralCases {
  type Lengths = NonNullable<IAutoMovieHumanExtremityDimensions["legBones"]>;
  type Hands = NonNullable<IAutoMovieHumanExtremityDimensions["hands"]>;
  type Feet = NonNullable<IAutoMovieHumanExtremityDimensions["feet"]>;
  type Sources = ReturnType<typeof AutoMovieHumanBodyLaw.prepareSources>;
  type Reader = (row: ICase) => IAutoMovieHumanParameters;

  /** The unchanged neutral, a length variant, or a tissue input variant. */
  export interface ICase {
    /** Exact case name used in the receipt. */
    id: string;
    /** Input to modify. */
    field: "baseline" | "tissue" | Cases.Length;
    /** Multiplier of the supplied or live baseline value. */
    ratio: number;
  }

  /** Cases requested for whole-body verification. */
  export const CASES: readonly ICase[] = [
    { id: "baseline", field: "baseline", ratio: 1 },
    ...Cases.LENGTH_CASES,
    ...[0.8, 1.2].map(
      (ratio: number): ICase => ({
        id: "tissue-" + ratio,
        field: "tissue",
        ratio,
      }),
    ),
  ];

  /**
   * Derive each case from one prepared anatomical baseline before any skin
   * work.
   */
  export function prepare(
    base: IAutoMovieHumanParameters = AutoMovieHumanNeutralParameters,
  ): Reader {
    const source: Sources = AutoMovieHumanBodyLaw.prepareSources(base);
    const rest: ReturnType<Sources["limbRest"]> = source.limbRest();
    const limb = source.limbs;
    const upper: ReturnType<typeof rest.arm> = rest.arm("left");
    const lengths = (side: AutoMovieHumanSide): Lengths["left"] => {
      const leg: ReturnType<typeof rest.leg> = rest.leg(side);
      return {
        femur: distance(leg.hip, leg.knee) / limb.legs.scale,
        tibia: distance(leg.knee, leg.ankle) / limb.legs.scale,
      };
    };
    const legBones: Lengths = {
      left: lengths("left"),
      right: lengths("right"),
    };
    const humerus: number = distance(upper.bones.shoulder, upper.bones.elbow);
    const forearm: number = distance(upper.bones.elbow, upper.bones.wrist);
    const hand = (side: AutoMovieHumanSide): Hands["left"] => {
      const { length, palm, breadth, thumb } = limb.arms[side];
      return {
        handLength: length / limb.arms.scale,
        palmLength: palm / limb.arms.scale,
        handBreadth: breadth / limb.arms.scale,
        thumbLength: thumb / limb.arms.scale,
      };
    };
    const foot = (side: AutoMovieHumanSide): Feet["left"] => {
      const { length, breadth, ankle } = limb.feet[side];
      return {
        footLength: length / limb.feet.scale,
        footBreadth: breadth / limb.feet.scale,
        ankleHeight: ankle / limb.feet.scale,
      };
    };
    const hands: Hands = { left: hand("left"), right: hand("right") };
    const feet: Feet = { left: foot("left"), right: foot("right") };

    return ({ field, ratio }: ICase): IAutoMovieHumanParameters => {
      if (!(Number.isFinite(ratio) && ratio > 0))
        throw new Error("A verification case needs a finite positive ratio");
      if (field === "baseline") return base;
      const anatomy = { ...base.body.anatomy };
      const extremities: IAutoMovieHumanExtremityDimensions = {
        ...base.extremities,
      };

      if (field === "tissue") {
        const measured = AutoMovieHumanBodyAnatomy.resolve(base);
        anatomy.bodyFatPercentage = measured.bodyFatPercentage * ratio;
      }
      if (field === "upperArm" || field === "forearm" || field === "limbs") {
        const upperFactor: number = field === "forearm" ? 1 : ratio;
        const lowerFactor: number = field === "upperArm" ? 1 : ratio;

        // The production arm uses surface calipers. Invert the same
        // joint-centre equations to move a bone while holding its neighbour.
        const ar: number =
          (humerus * upperFactor + upper.projection) /
          (1 - AutoMovieHumanArmBones.RADIALE);
        const rs: number =
          forearm * lowerFactor -
          AutoMovieHumanArmBones.RADIALE * ar -
          AutoMovieHumanArmBones.STYLION_WRIST;
        anatomy.upperArmLength = ar / limb.arms.scale;
        anatomy.forearmLength = rs / limb.arms.scale;
      }

      if (field === "thigh" || field === "shank" || field === "limbs") {
        const change = ({
          femur,
          tibia,
        }: Lengths["left"]): Lengths["left"] => ({
          femur: femur * (field === "shank" ? 1 : ratio),
          tibia: tibia * (field === "thigh" ? 1 : ratio),
        });
        extremities.legBones = {
          left: change(legBones.left),
          right: change(legBones.right),
        };
      }

      if (field === "handLength" || field === "handBreadth") {
        const change = (value: Hands["left"]): Hands["left"] => ({
          ...value,
          [field]: value[field] * ratio,
        });
        extremities.hands = {
          left: change(hands.left),
          right: change(hands.right),
        };
      }
      if (field === "footLength" || field === "footBreadth") {
        const change = (value: Feet["left"]): Feet["left"] => ({
          ...value,
          [field]: value[field] * ratio,
        });
        extremities.feet = {
          left: change(feet.left),
          right: change(feet.right),
        };
      }
      if (field === "phalanges")
        extremities.phalangealLengthScale =
          (base.extremities?.phalangealLengthScale ?? 1) * ratio;
      return { ...base, body: { ...base.body, anatomy }, extremities };
    };
  }

  /**
   * Measure the leg/arm spans and original floor registration without a full
   * body.
   */
  export function distance(
    left: readonly number[],
    right: readonly number[],
  ): number {
    return Math.hypot(
      left[0]! - right[0]!,
      left[1]! - right[1]!,
      left[2]! - right[2]!,
    );
  }

  /**
   * Evaluate exactly one public Human case and persist its observed whole-body
   * gate.
   */
  async function run(
    id: string,
    output: string,
    nailOutput?: string,
    viewOutput?: string,
  ): Promise<void> {
    const row: ICase | undefined = CASES.find(
      (candidate: ICase): boolean => candidate.id === id,
    );
    if (row === undefined) throw new Error("Unknown neutral case " + id);
    const parameters: IAutoMovieHumanParameters = prepare()(row);
    const started: number = performance.now();
    const observe = (phase: string): void => {
      console.log(
        JSON.stringify({
          id,
          phase,
          milliseconds: performance.now() - started,
          heapBytes: process.memoryUsage().heapUsed,
        }),
      );
    };
    const report: ReturnType<typeof buildHumanNeutralCapture.inspect> =
      buildHumanNeutralCapture.inspect(parameters, observe);
    let nails: Awaited<ReturnType<typeof Nails.observeBody>> | undefined;
    if (nailOutput !== undefined) {
      const directory: string = path.resolve(nailOutput);
      await mkdir(directory, { recursive: true });
      NodeCanvasRaster.initialize();
      nails = await Nails.observeBody(report, undefined, [], directory);
      observe("nail-views");
    }
    const form: Form.IReport = Form.measure(report, observe);
    const pelvicContacts = [
      ["groin.leg.left", "groin.leg.right"],
      ["groin.leg.left", "leg.left"],
      ["groin.leg.left", "trunk"],
      ["groin.leg.right", "leg.right"],
      ["groin.leg.right", "trunk"],
    ] as const;
    for (const name of ["groin.leg.left", "groin.leg.right"])
      if (
        !report.trianglesByOwner.some(
          (part) => part.name === name && part.triangles > 0,
        )
      )
        form.unavailable.push(`skin retains no triangles for ${name}`);
    for (const [a, b] of pelvicContacts)
      if (
        !form.measurements?.contacts.some(
          ({ first, second }) => first === a && second === b,
        )
      )
        form.unavailable.push(`skin has no measured shared boundary ${a} / ${b}`);
    let views: Awaited<ReturnType<typeof Views.write>> | undefined;
    if (viewOutput !== undefined) {
      try {
        views = await Views.write(report, path.resolve(viewOutput), id);
      } catch (error: unknown) {
        views = {
          frames: [],
          preparations: [],
          unavailable: [error instanceof Error ? error.message : String(error)],
        };
      }
      observe("body-views");
    }
    const floorMetres: number = report.mesh.positions.reduce(
      (lowest: number, value: number, index: number): number =>
        index % 3 === 1 ? Math.min(lowest, value) : lowest,
      Infinity,
    );
    const file: string = path.resolve(output);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(
      file,
      JSON.stringify(
        {
          schema: "human-neutral-case/v1",
          bodySource: "ANSUR neutral survey inputs",
          row,
          parameters,
          parametersHash: Identity.dataHash(parameters),
          floorMm: Number.isFinite(floorMetres) ? floorMetres * 1000 : null,
          topology: report.topology,
          pieces: report.pieces,
          diagnostics: report.diagnostics,
          form,
          nails,
          views,
          triangleGroups: report.triangleGroups,
          trianglesByOwner: report.trianglesByOwner,
          milliseconds: report.milliseconds,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(file);
    if (
      report.diagnostics.length !== 0 ||
      form.measurements === null ||
      form.measurements.findings.length !== 0 ||
      form.unavailable.length !== 0 ||
      (views !== undefined &&
        (views.frames.length === 0 || views.unavailable.length !== 0)) ||
      (nails !== undefined &&
        (nails.sites.length !== 20 ||
          nails.sites.some(
            (site): boolean => !site.retained || site.capture?.length !== 4,
          )))
    )
      process.exitCode = 1;
  }

  /** List exact invocations or evaluate one explicit case. */
  export async function main(args: readonly string[]): Promise<void> {
    if (args.length === 1 && args[0] === "--list") {
      console.log(JSON.stringify(CASES, null, 2));
      return;
    }
    const id: string | undefined = args
      .find((arg: string): boolean => arg.startsWith("--case="))
      ?.slice(7);
    const output: string | undefined = args
      .find((arg: string): boolean => arg.startsWith("--out="))
      ?.slice(6);
    const nailOutput: string | undefined = args
      .find((arg: string): boolean => arg.startsWith("--nails="))
      ?.slice(8);
    const viewOutput: string | undefined = args
      .find((arg: string): boolean => arg.startsWith("--views="))
      ?.slice(8);
    if (
      !id ||
      !output ||
      nailOutput === "" ||
      viewOutput === "" ||
      args.length !==
        2 + Number(nailOutput !== undefined) + Number(viewOutput !== undefined)
    )
      throw new Error(
        "Use --list or supply --case=<id> --out=<report.json> with optional --nails=<directory> and --views=<directory>",
      );
    await run(id, output, nailOutput, viewOutput);
  }
}

if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module &&
  path.parse(process.argv[1] ?? "").name === "FamilyConicNeutralCases"
)
  void FamilyConicNeutralCases.main(process.argv.slice(2)).catch(
    (error: unknown): void => {
      console.error(error);
      process.exitCode = 1;
    },
  );
