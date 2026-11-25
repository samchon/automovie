import {
  AutoMovieArchetypeQuadrupedJoints,
  type createQuadruped,
} from "@automovie/archetypes";
import { Quaternion, validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AnimalNeutralReferences } from "./AnimalNeutralReferences";
import { animalAttachmentObserver } from "./animalAttachmentObserver";
import { nclose } from "./nclose";

/**
 * Observe neutral physical geometry without using attachment construction as an
 * oracle.
 *
 * The shared independent observer owns actual bar closure, solid membership and
 * terminal support. This owner adds source-literal lengths, source-grounded
 * dimensions, exact full-primitive floor bounds and actual public read-query
 * comparisons. The production read is the operation tested, never an expected
 * value provider; no conform/attachment calculator or source table is called.
 */
export namespace AnimalNeutralObservation {
  /** Actual public eight-kind model; no proxy body is substituted. */
  export type Model = ReturnType<typeof createQuadruped>;

  /** Actual public query returned for subsequent output-isolation checks. */
  export type Query = ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read>;

  /**
   * In-memory identity root makes the source's declared floor exactly world
   * Y=0.
   */
  const IDENTITY: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };

  /**
   * Compare source-defined dimensions and lengths with real solids and the
   * actual read query.
   */
  export function inspect(
    model: Model,
    reference: AnimalNeutralReferences.ICase,
    label: string,
    findings: string[],
  ): Query {
    if (!validateModel({ model }).success)
      findings.push(`${label}: actual model admission failed`);
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      model.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const withers: IAutoMovieModelPart = need(parts, "withers");
    if (
      withers.geometry.type !== "primitive" ||
      withers.geometry.shape.type !== "sphere"
    )
      throw new Error(`${label}: actual withers must remain a sphere`);
    const height: number =
      frame(withers).translation.y + withers.geometry.shape.radius;
    const expected: AnimalNeutralReferences.IExpected =
      reference.expected(height);
    near("withers metadata", height, model.dimensions.withersHeight!, 1e-9);
    if (expected.height !== null)
      near("source withers height", height, expected.height, 1e-9);
    const trunk: IAutoMovieModelPart = need(parts, "trunk");
    const trunkShape: { height: number; radius: number } = bar(trunk);
    near(
      "source chest circumference",
      2 * Math.PI * trunkShape.radius,
      expected.girth,
      1e-9,
    );
    near(
      "chest metadata",
      2 * Math.PI * trunkShape.radius,
      model.dimensions.girth!,
      1e-9,
    );
    const query: Query = AutoMovieArchetypeQuadrupedJoints.read(model.parts);
    const feet: ReturnType<typeof animalAttachmentObserver> =
      animalAttachmentObserver(
        model,
        { archetype: model, placement: IDENTITY },
        label,
        findings,
      );
    for (const limb of [
      "leftFore",
      "rightFore",
      "leftHind",
      "rightHind",
    ] as const) {
      const fore: boolean = limb.endsWith("Fore");
      const ids: readonly string[] = fore
        ? [`${limb}Humerus`, `${limb}Radius`, `${limb}Cannon`, `${limb}Pastern`]
        : [`${limb}Femur`, `${limb}Tibia`, `${limb}Cannon`, `${limb}Pastern`];
      const lengths: AnimalNeutralReferences.Four = fore
        ? expected.fore
        : expected.hind;
      const tolerance: AnimalNeutralReferences.Four = fore
        ? expected.foreTolerance
        : expected.hindTolerance;
      for (let index: number = 0; index < 4; index++) {
        const actual: IAutoMovieModelPart = need(parts, ids[index]!);
        const shape: { height: number; radius: number } = bar(actual);
        near(
          `${ids[index]} source control length`,
          shape.height,
          lengths[index]!,
          tolerance[index]!,
        );
        point(
          `${ids[index]} read upper endpoint`,
          query.limbs[limb][index]!,
          endpoint(actual, -1),
        );
        point(
          `${ids[index]} read lower endpoint`,
          query.limbs[limb][index + 1]!,
          endpoint(actual, 1),
        );
      }
      const parentId: "trunk" | "hindquarters" = fore
        ? "trunk"
        : "hindquarters";
      const parent: IAutoMovieModelPart = need(parts, parentId);
      const proximal: IAutoMovieVector3 = endpoint(need(parts, ids[0]!), -1);
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame(parent).rotation),
        {
          x: proximal.x - frame(parent).translation.x,
          y: proximal.y - frame(parent).translation.y,
          z: proximal.z - frame(parent).translation.z,
        },
      );
      if (query.attachments[limb].parent !== parentId)
        findings.push(`${label}: ${limb} lost its actual parent identity`);
      point(
        `${limb} public source attachment`,
        query.attachments[limb].point,
        proximal,
      );
      point(
        `${limb} public parent-centre local attachment`,
        query.attachments[limb].parentLocal,
        local,
      );
      const parentShape: { height: number; radius: number } = bar(parent);
      const capDistance: number = Math.max(
        0,
        Math.abs(local.y) - parentShape.height / 2,
      );
      if (Math.hypot(local.x, local.z, capDistance) > parentShape.radius + 1e-9)
        findings.push(
          `${label}: ${limb} proximal endpoint is outside its actual parent capsule`,
        );
      const foot: animalAttachmentObserver.IFoot | undefined = feet.get(limb);
      if (foot === undefined)
        findings.push(`${label}: missing actual ${limb} foot observation`);
      else {
        near(`${limb} actual terminal solid sole`, foot.soleY, 0, 1e-9);
        const terminal: IAutoMovieModelPart = need(parts, ids[3]!);
        const terminalShape: { height: number; radius: number } = bar(terminal);
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(
          frame(terminal).rotation,
          { x: 0, y: 1, z: 0 },
        );
        const round: boolean =
          terminal.geometry.type === "primitive" &&
          terminal.geometry.shape.type === "capsule";
        const endpointHeight: number =
          terminalShape.radius * (round ? 1 : Math.hypot(axis.x, axis.z)) +
          terminalShape.height * Math.max(0, axis.y);
        near(
          `${limb} terminal centre respects actual support geometry`,
          foot.point.y,
          endpointHeight,
          1e-9,
        );
        if (foot.point.y < -1e-9)
          findings.push(
            `${label}: ${limb} terminal centre is below the source floor`,
          );
      }
    }
    for (const part of model.parts) {
      const low: number = lowest(part);
      if (low < -1e-9)
        findings.push(
          `${label}: actual ${part.id} solid penetrates ground by ${-low} m`,
        );
    }
    for (const parent of ["trunk", "hindquarters"] as const)
      if (!(lowest(need(parts, parent)) > 0))
        findings.push(`${label}: neutral ${parent} has no standing floor gap`);
    return query;

    /** Float assertions use the shared independent finite-number comparison. */
    function near(
      id: string,
      actual: number,
      value: number,
      tolerance: number,
    ): void {
      if (!nclose(actual, value, tolerance))
        findings.push(
          `${label}: ${id}: ${actual} expected ${value} within ${tolerance}`,
        );
    }

    /** The read query is compared against actual geometry in source metres. */
    function point(
      id: string,
      actual: IAutoMovieVector3,
      value: IAutoMovieVector3,
    ): void {
      for (const axis of ["x", "y", "z"] as const)
        near(`${id}.${axis}`, actual[axis], value[axis], 1e-9);
    }
  }

  /** Directed actual bar endpoint from its own primitive height and frame. */
  export function endpoint(
    part: IAutoMovieModelPart,
    sign: -1 | 1,
  ): IAutoMovieVector3 {
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      frame(part).rotation,
      { x: 0, y: (sign * bar(part).height) / 2, z: 0 },
    );
    return {
      x: frame(part).translation.x + offset.x,
      y: frame(part).translation.y + offset.y,
      z: frame(part).translation.z + offset.z,
    };
  }

  /**
   * Exact primitive support in -Y, independent of production floor/bounds
   * helpers.
   */
  function lowest(part: IAutoMovieModelPart): number {
    if (part.geometry.type !== "primitive")
      throw new Error(`Neutral part ${part.id} must be an actual primitive`);
    const shape: typeof part.geometry.shape = part.geometry.shape;
    const at: IAutoMovieTransform = frame(part);
    const axisY: IAutoMovieVector3 = Quaternion.rotateVector(at.rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    if (shape.type === "sphere") return at.translation.y - shape.radius;
    if (shape.type === "capsule")
      return (
        at.translation.y - (Math.abs(axisY.y) * shape.height) / 2 - shape.radius
      );
    if (shape.type === "cylinder")
      return (
        at.translation.y -
        (Math.abs(axisY.y) * shape.height) / 2 -
        shape.radius * Math.hypot(axisY.x, axisY.z)
      );
    if (shape.type === "cone")
      return (
        at.translation.y +
        Math.min(
          (axisY.y * shape.height) / 2 -
            shape.radius * Math.hypot(axisY.x, axisY.z),
          (-axisY.y * shape.height) / 2,
        )
      );
    if (shape.type === "box") {
      const axisX: IAutoMovieVector3 = Quaternion.rotateVector(at.rotation, {
        x: 1,
        y: 0,
        z: 0,
      });
      const axisZ: IAutoMovieVector3 = Quaternion.rotateVector(at.rotation, {
        x: 0,
        y: 0,
        z: 1,
      });
      return (
        at.translation.y -
        (Math.abs(axisX.y) * shape.width +
          Math.abs(axisY.y) * shape.height +
          Math.abs(axisZ.y) * shape.depth) /
          2
      );
    }
    return Number.POSITIVE_INFINITY;
  }

  /**
   * A real named part is required, never replaced by a fixture or producer
   * table.
   */
  function need(
    parts: ReadonlyMap<string, IAutoMovieModelPart>,
    id: string,
  ): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = parts.get(id);
    if (found === undefined)
      throw new Error(`Missing actual neutral part ${id}`);
    return found;
  }

  /**
   * Each observed source transform is finite, rigid, root-local and
   * independently admitted.
   */
  function frame(part: IAutoMovieModelPart): IAutoMovieTransform {
    if (part.transform === null || part.attachedBone !== null)
      throw new Error(`Missing actual root-local ${part.id} frame`);
    const at: IAutoMovieTransform = part.transform;
    if (
      at.scale.x !== 1 ||
      at.scale.y !== 1 ||
      at.scale.z !== 1 ||
      !nclose(
        Math.hypot(at.rotation.x, at.rotation.y, at.rotation.z, at.rotation.w),
        1,
        1e-10,
      )
    )
      throw new Error(
        `Actual neutral ${part.id} has a nonrigid or nonfinite frame`,
      );
    return at;
  }

  /**
   * Positive real bar extents distinguish physical controls from invisible or
   * degenerate markers.
   */
  function bar(part: IAutoMovieModelPart): { height: number; radius: number } {
    if (
      part.geometry.type !== "primitive" ||
      (part.geometry.shape.type !== "cylinder" &&
        part.geometry.shape.type !== "capsule") ||
      ![part.geometry.shape.height, part.geometry.shape.radius].every(
        (value: number): boolean => value > 0,
      )
    )
      throw new Error(
        `Actual neutral ${part.id} must be a positive finite rigid bar`,
      );
    return {
      height: part.geometry.shape.height,
      radius: part.geometry.shape.radius,
    };
  }
}
