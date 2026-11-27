import type { AutoMovieArchetype } from "@automovie/archetypes";
import { Quaternion, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieCylinderShape,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { nclose } from "./nclose";

/** Independent actual-primitive observations of a head and its real appendage joins. */
export namespace AnimalHeadAppendageObservation {
  /** Literal source dimensions and explicitly authored construction controls. */
  export interface IExpected {
    /** Complete axial length of the actual generated head capsule, metres. */
    head: number;

    /** Complete diameter of the actual generated head capsule, metres. */
    diameter: number;
    /** Appendage ids whose entire actual base disk belongs inside the head. */
    roots: readonly string[];
    /** Actual straight cylindrical lengths, metres. */
    lengths: Readonly<Record<string, number>>;
    /** Actual circular cross-section radii, metres. */
    radii: Readonly<Record<string, number>>;
    /** Branch root-centre owner, an actual main-beam cylinder. */
    branches?: Readonly<Record<string, string>>;
    /** Preserved main-beam axis-tip spacing; this is not an outer tip-surface width. */
    tips?: readonly [string, string, number];
  }

  /** Read actual capsule/cylinder frames without any production attachment/proximity helper. */
  export function observe(
    findings: string[],
    label: string,
    animal: AutoMovieArchetype,
    expected: IExpected,
  ): void {
    if (!AutoMovieEngineValidation.validateModel({ model: animal }).success)
      findings.push(`${label}: actual model admission failed`);
    const head: IAutoMovieModelPart = part(animal, "head");
    if (
      head.geometry.type !== "primitive" ||
      head.geometry.shape.type !== "capsule"
    )
      throw new Error("The actual head must be its generated capsule");
    const shape: typeof head.geometry.shape = head.geometry.shape;
    near(
      findings,
      `${label} complete source head`,
      shape.height + 2 * shape.radius,
      expected.head,
    );
    near(
      findings,
      `${label} source head diameter`,
      2 * shape.radius,
      expected.diameter,
    );

    for (const id of expected.roots) {
      const stem: IAutoMovieModelPart = part(animal, id);
      const root: IAutoMovieVector3 = end(stem, -1);
      const local: IAutoMovieVector3 = localPoint(head, root);
      const distance: number = Math.hypot(
        local.x,
        Math.max(0, Math.abs(local.y) - shape.height / 2),
        local.z,
      );
      if (
        !(distance < shape.radius) ||
        distance + cylinder(stem).radius > shape.radius + 1e-9
      )
        findings.push(
          `${label}/${id}: actual complete root disk is not inside the actual head capsule`,
        );
    }
    for (const [id, length] of Object.entries(expected.lengths)) {
      const stem: IAutoMovieCylinderShape = cylinder(part(animal, id));
      near(findings, `${label}/${id} preserved length`, stem.height, length);
      near(
        findings,
        `${label}/${id} preserved radius`,
        stem.radius,
        expected.radii[id]!,
      );
    }
    for (const [child, parent] of Object.entries(expected.branches ?? {})) {
      const main: IAutoMovieModelPart = part(animal, parent);
      const local: IAutoMovieVector3 = localPoint(
        main,
        end(part(animal, child), -1),
      );
      if (
        Math.hypot(local.x, local.z) > 1e-9 ||
        Math.abs(local.y) > cylinder(main).height / 2 + 1e-9
      )
        findings.push(
          `${label}/${child}: branch left its actual main-beam axis`,
        );
    }
    if (expected.tips !== undefined) {
      const left: IAutoMovieVector3 = end(part(animal, expected.tips[0]), 1);
      const right: IAutoMovieVector3 = end(part(animal, expected.tips[1]), 1);
      near(
        findings,
        `${label} preserved axis-tip spacing`,
        Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z),
        expected.tips[2],
      );
    }
  }

  /** Preserve explicit neutral ear/horn/tine directions and the already embedded ox horn roots. */
  export function neutral(
    findings: string[],
    label: string,
    animal: AutoMovieArchetype,
    expected: IExpected,
  ): void {
    for (const [id, length] of Object.entries(expected.lengths)) {
      const from: IAutoMovieVector3 = end(part(animal, id), -1);
      const to: IAutoMovieVector3 = end(part(animal, id), 1);
      const sign: number = id.startsWith("left") ? 1 : -1;
      let wanted: IAutoMovieVector3 | undefined;
      if (animal.archetype === "dog") wanted = { x: 0, y: length, z: 0 };
      else if (animal.archetype === "ox")
        wanted = id.endsWith("Ear")
          ? { x: sign * length, y: 0, z: 0 }
          : { x: sign * length * Math.SQRT1_2, y: length * Math.SQRT1_2, z: 0 };
      else if (id.includes("Tine"))
        wanted = { x: 0, y: length * Math.SQRT1_2, z: length * Math.SQRT1_2 };
      if (wanted !== undefined)
        for (const axis of ["x", "y", "z"] as const)
          near(
            findings,
            `${label}/${id} preserved ${axis} direction`,
            to[axis] - from[axis],
            wanted[axis],
          );
    }
    if (animal.archetype !== "ox") return;
    const head: IAutoMovieModelPart = part(animal, "head");
    if (
      head.geometry.type !== "primitive" ||
      head.geometry.shape.type !== "capsule"
    )
      throw new Error("The actual ox head must retain its generated capsule");
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      head.transform!.rotation,
      { x: 0, y: -head.geometry.shape.height / 2, z: 0 },
    );
    const poll: IAutoMovieVector3 = {
      x: head.transform!.translation.x + offset.x,
      y: head.transform!.translation.y + offset.y,
      z: head.transform!.translation.z + offset.z,
    };
    for (const [id, sign] of [
      ["leftHorn", 1],
      ["rightHorn", -1],
    ] as const) {
      const root: IAutoMovieVector3 = end(part(animal, id), -1);
      near(
        findings,
        `${label}/${id} unchanged root X`,
        root.x - poll.x,
        (sign * 0.1693) / 4,
      );
      near(
        findings,
        `${label}/${id} unchanged root Y`,
        root.y - poll.y,
        0.1693 / 4,
      );
      near(findings, `${label}/${id} unchanged root Z`, root.z - poll.z, 0);
    }
  }

  /** Read one genuinely transformed source part. */
  export function part(
    animal: Pick<AutoMovieArchetype, "parts">,
    id: string,
  ): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = animal.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (found === undefined || found.transform === null)
      throw new Error(`Missing actual ${id}`);
    return found;
  }

  /** Read the actual closed cylinder rather than substituting a round-ended bound. */
  export function cylinder(part: IAutoMovieModelPart): IAutoMovieCylinderShape {
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "cylinder"
    )
      throw new Error(`${part.id} must retain its actual closed cylinder`);
    return part.geometry.shape;
  }

  /** Transform an actual primitive's signed axial endpoint into model space. */
  export function end(
    part: IAutoMovieModelPart,
    sign: -1 | 1,
  ): IAutoMovieVector3 {
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: (sign * cylinder(part).height) / 2, z: 0 },
    );
    return {
      x: part.transform!.translation.x + offset.x,
      y: part.transform!.translation.y + offset.y,
      z: part.transform!.translation.z + offset.z,
    };
  }

  /** Invert the real primitive-centre frame; no reconstructed skeleton origin is used. */
  export function localPoint(
    parent: IAutoMovieModelPart,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(parent.transform!.rotation),
      {
        x: point.x - parent.transform!.translation.x,
        y: point.y - parent.transform!.translation.y,
        z: point.z - parent.transform!.translation.z,
      },
    );
  }

  /** Binary64 observation allowance below every source or authored input digit. */
  function near(
    findings: string[],
    label: string,
    actual: number,
    expected: number,
  ): void {
    if (!nclose(actual, expected, 1e-9))
      findings.push(`${label}: ${actual} != ${expected}`);
  }
}
