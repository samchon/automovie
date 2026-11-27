import type { AutoMovieArchetype } from "@automovie/archetypes";
import { Quaternion, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { nclose } from "./nclose";

/** Actual primitive observations for the independently transcribed cohort unit. */
export namespace AnimalCohortObservation {
  /** Published SI fields shared by the whole-reference expectations. */
  interface IBody {
    /** Source withers apex, metres. */
    height: number;
    /** Source chest circumference, metres. */
    girth: number;
    /** Shoulder-to-rump reference length, metres. */
    body: number;
    /** Complete coarse head capsule length and diameter proxy, metres. */
    head: number;
    /** Diameter of the source skull/tape-breadth construction proxy, metres. */
    headWidth: number;
  }

  /** Distinct directly measured camel controls and sex-matched deer skeletons. */
  export type Expected = IBody &
    (
      | {
          /** Camel neck traits are part of the selected whole source row. */
          kind: "camel";
          neck: number;
          neckGirth: number;
        }
      | {
          /** Deer body mass and these skeletal controls come from distinct cited samples. */
          kind: "deer";
          mass: number;
          fore: readonly [number, number, number];
          hind: readonly [number, number, number];
          antlers: boolean;
        }
    );

  /** Read actual displayed primitives rather than a constructor's source table. */
  export function observe(
    findings: string[],
    label: string,
    animal: AutoMovieArchetype,
    expected: Expected,
    authoredMass?: number,
  ): void {
    if (!AutoMovieEngineValidation.validateModel({ model: animal }).success)
      findings.push(`${label}: actual model admission failed`);
    near(
      findings,
      `${label} height`,
      animal.dimensions.withersHeight!,
      expected.height,
    );
    near(findings, `${label} girth`, animal.dimensions.girth!, expected.girth);
    near(
      findings,
      `${label} complete mass`,
      animal.body.mass,
      authoredMass ?? (expected.kind === "deer" ? expected.mass : NaN),
    );
    if (
      animal.provenance.bands.withersHeight !== undefined ||
      animal.provenance.bands.girth !== undefined
    )
      findings.push(`${label}: group means were recorded as population bands`);

    const withers: IAutoMovieModelPart = part(animal, "withers");
    const head: IAutoMovieModelPart = part(animal, "head");
    const trunk: IAutoMovieModelPart = part(animal, "trunk");
    const rear: IAutoMovieModelPart = part(animal, "hindquarters");
    if (
      withers.geometry.type !== "primitive" ||
      withers.geometry.shape.type !== "sphere"
    )
      throw new Error(
        "The actual withers observation requires its source sphere",
      );
    near(
      findings,
      `${label} displayed withers apex`,
      withers.transform!.translation.y + withers.geometry.shape.radius,
      expected.height,
    );
    if (
      head.geometry.type !== "primitive" ||
      head.geometry.shape.type !== "capsule"
    )
      throw new Error(
        "The actual head observation requires its source capsule",
      );
    near(
      findings,
      `${label} displayed complete head`,
      head.geometry.shape.height + 2 * head.geometry.shape.radius,
      expected.head,
    );
    near(
      findings,
      `${label} displayed head diameter proxy`,
      2 * head.geometry.shape.radius,
      expected.headWidth,
    );
    if (
      trunk.geometry.type !== "primitive" ||
      trunk.geometry.shape.type !== "capsule" ||
      rear.geometry.type !== "primitive" ||
      rear.geometry.shape.type !== "capsule"
    )
      throw new Error(
        "The actual body landmarks require their source capsules",
      );
    near(
      findings,
      `${label} displayed chest circumference`,
      2 * Math.PI * trunk.geometry.shape.radius,
      expected.girth,
    );

    // The source body length starts at the shoulder axis, not the trunk's
    // rounded front surface, and ends at the hindquarters' rear cap.
    const shoulder: number = Math.max(
      endpoint(trunk, -1).z,
      endpoint(trunk, 1).z,
    );
    const buttock: number =
      Math.min(endpoint(rear, -1).z, endpoint(rear, 1).z) -
      rear.geometry.shape.radius;
    near(
      findings,
      `${label} displayed shoulder-to-rump length`,
      shoulder - buttock,
      expected.body,
    );
    const fore: readonly number[] =
      expected.kind === "camel"
        ? [0.3863, 0.5229, 0.2779, 0.1523].map(
            (length: number): number => (length * expected.height) / 1.847,
          )
        : expected.fore;
    const hind: readonly number[] =
      expected.kind === "camel"
        ? [0.4534, 0.4683, 0.4192, 0.1337].map(
            (length: number): number => (length * expected.height) / 1.847,
          )
        : expected.hind;
    for (const [names, lengths] of [
      [["Humerus", "Radius", "Cannon", "Pastern"], fore],
      [["Femur", "Tibia", "Cannon", "Pastern"], hind],
    ] as const)
      for (let index: number = 0; index < lengths.length; index++) {
        const end: "Fore" | "Hind" = names[0] === "Humerus" ? "Fore" : "Hind";
        for (const side of ["left", "right"] as const) {
          const bar: IAutoMovieModelPart = part(
            animal,
            `${side}${end}${names[index]}`,
          );
          if (
            bar.geometry.type !== "primitive" ||
            (bar.geometry.shape.type !== "cylinder" &&
              bar.geometry.shape.type !== "capsule")
          )
            throw new Error(
              "The actual limb observation requires a rigid source bar",
            );
          near(
            findings,
            `${label} ${bar.id} actual control length`,
            bar.geometry.shape.height,
            lengths[index]!,
          );
        }
      }
    if (expected.kind === "camel") {
      const neck: IAutoMovieModelPart = part(animal, "neck");
      if (
        neck.geometry.type !== "primitive" ||
        neck.geometry.shape.type !== "cylinder"
      )
        throw new Error(
          "The camel neck observation requires its source cylinder",
        );
      near(
        findings,
        `${label} displayed neck length`,
        neck.geometry.shape.height,
        expected.neck,
      );
      near(
        findings,
        `${label} displayed neck circumference`,
        2 * Math.PI * neck.geometry.shape.radius,
        expected.neckGirth,
      );
    } else if (
      animal.parts.some(
        (candidate: IAutoMovieModelPart): boolean =>
          candidate.id === "leftAntler",
      ) !== expected.antlers
    )
      findings.push(
        `${label}: antler geometry disagrees with the selected sex and request`,
      );
  }

  /** Floating observations use a metre-scale allowance far below an input-table digit. */
  function near(
    findings: string[],
    label: string,
    actual: number,
    expected: number,
  ): void {
    if (!nclose(actual, expected, 1e-9))
      findings.push(`${label}: ${actual} != ${expected}`);
  }

  /** Require the actual produced part instead of manufacturing a test representation. */
  function part(animal: AutoMovieArchetype, id: string): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = animal.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (found === undefined) throw new Error(`Missing actual ${id} part`);
    return found;
  }

  /** Recover a rigid bar's actual axis endpoint from its primitive and transform. */
  function endpoint(bar: IAutoMovieModelPart, sign: -1 | 1): IAutoMovieVector3 {
    if (
      bar.geometry.type !== "primitive" ||
      (bar.geometry.shape.type !== "capsule" &&
        bar.geometry.shape.type !== "cylinder")
    )
      throw new Error("A body landmark requires its actual rigid bar");
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      bar.transform!.rotation,
      { x: 0, y: (sign * bar.geometry.shape.height) / 2, z: 0 },
    );
    return {
      x: bar.transform!.translation.x + offset.x,
      y: bar.transform!.translation.y + offset.y,
      z: bar.transform!.translation.z + offset.z,
    };
  }
}
