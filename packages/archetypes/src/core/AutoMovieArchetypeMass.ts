import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeMassArithmetic } from "./internal/ArchetypeMassArithmetic";
import { ArchetypeMassLocal } from "./internal/ArchetypeMassLocal";
import { ArchetypeMassRecord } from "./internal/ArchetypeMassRecord";
import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/**
 * The mass properties of primitive or convex-cell parts under one total mass.
 *
 * Each part is a uniform solid whose share of the total mass is its volume
 * times a relative density, 1 unless the producer states another, so a hollow
 * or light part can weigh less than its outline suggests; a producer whose
 * segment masses are measured states each part's share instead. A producer
 * states the total mass from its cited band; the distribution follows from the
 * geometry, which is what lets a test compare the result with a published
 * balance point or moment of inertia instead of reading a copied number back.
 */
export namespace AutoMovieArchetypeMass {
  /**
   * The symmetric inertia tensor about the centre of mass, in the model's axes,
   * kg m squared.
   */
  export interface IInertia {
    /** Moment about the model's X axis through the centre of mass. */
    xx: number;

    /** Moment about the model's Y axis through the centre of mass. */
    yy: number;

    /** Moment about the model's Z axis through the centre of mass. */
    zz: number;

    /**
     * Product of inertia, the tensor's XY component (minus the integral of x y
     * dm).
     */
    xy: number;

    /** Product of inertia, the tensor's XZ component. */
    xz: number;

    /** Product of inertia, the tensor's YZ component. */
    yz: number;
  }

  /** The mass properties of a whole archetype. */
  export interface IProperties {
    /** Total mass, kilograms. */
    mass: number;

    /** Centre of mass in the model's space, metres. */
    centerOfMass: IAutoMovieVector3;

    /** Inertia about the centre of mass. */
    inertia: IInertia;
  }

  /**
   * The mass properties of parts under a total mass.
   *
   * @param parts The model's parts at rest; a part without volume (a plane)
   *   weighs nothing.
   * @param mass The finite positive total mass, kilograms.
   * @param density Finite positive relative densities by part id; 1 for a part
   *   not listed.
   * @param shares Finite nonnegative weights replacing volume times density;
   *   when used, every part should be listed. At least one solid must have
   *   positive weight.
   * @param cells Explicit convex cells by part id; omitted for primitive-only
   *   inputs. Each record must identify its visible geometry.
   * @returns The centre of mass and the inertia about it.
   * @throws {Error} For invalid mass, density, share or dimensions, no positive
   *   solid weight, or unrepresentable local/derived mass properties.
   */
  export function of(
    parts: readonly IAutoMovieModelPart[],
    mass: number,
    density: Readonly<Record<string, number>> = {},
    shares: Readonly<Record<string, number>> = {},
    cells: AutoMovieArchetypeConvexCell.Table = new Map(),
  ): IProperties {
    ArchetypeMassRecord.mass(mass);
    // Each part's weight share, centroid in the model and central inertia per unit mass in its own axes.
    const solids: ISolid[] = [];
    for (const part of parts) {
      const solid: ILocal | null = ArchetypeMassLocal(part, cells);
      if (solid === null) continue;
      const share: number = weightOf(part.id, solid.volume, density, shares);
      const rotation: IAutoMovieQuaternion = part.transform?.rotation ?? {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      };
      const origin: IAutoMovieVector3 = part.transform?.translation ?? {
        x: 0,
        y: 0,
        z: 0,
      };
      const principalRotation: IAutoMovieQuaternion =
        solid.inertiaRotation === undefined
          ? rotation
          : Quaternion.multiply(rotation, solid.inertiaRotation);
      solids.push({
        share,
        centre: Vector3.add(
          origin,
          Quaternion.rotateVector(rotation, solid.centroid),
        ),
        axes: [
          Quaternion.rotateVector(principalRotation, { x: 1, y: 0, z: 0 }),
          Quaternion.rotateVector(principalRotation, { x: 0, y: 1, z: 0 }),
          Quaternion.rotateVector(principalRotation, { x: 0, y: 0, z: 1 }),
        ],
        unit: solid.unit,
      });
    }
    const weights: number[] = solids.map(
      (solid: ISolid): number => solid.share,
    );
    const normalized: { scale: number; total: number } =
      ArchetypeMassArithmetic.normalization(weights);
    const centre: IAutoMovieVector3 = ArchetypeMassArithmetic.vectorMean(
      solids.map((solid: ISolid): IAutoMovieVector3 => solid.centre),
      weights,
    );

    // I = sum of R diag(i) R^T m + m (|d|^2 E - d d^T), d from the common centre.
    const tensor: Record<keyof IInertia, number[]> = contributions();
    for (const solid of solids) {
      if (solid.share === 0) continue;
      const product: (a: number, b?: number, c?: number) => number =
        ArchetypeMassArithmetic.weightedProduct(
          mass,
          solid.share,
          normalized.scale,
          normalized.total,
        );
      const d: IAutoMovieVector3 = Vector3.subtract(solid.centre, centre);
      const principal: readonly number[] = [
        solid.unit.x,
        solid.unit.y,
        solid.unit.z,
      ];
      const entry: (a: Axis, b: Axis) => number = (
        a: Axis,
        b: Axis,
      ): number => {
        const terms: number[] = principal.map(
          (value: number, k: number): number =>
            product(value, solid.axes[k]![a], solid.axes[k]![b]),
        );
        if (a === b) {
          for (const axis of AXES)
            if (axis !== a) terms.push(product(d[axis], d[axis]));
        } else terms.push(product(-d[a], d[b]));
        return ArchetypeMassArithmetic.sum(terms);
      };
      tensor.xx.push(entry("x", "x"));
      tensor.yy.push(entry("y", "y"));
      tensor.zz.push(entry("z", "z"));
      tensor.xy.push(entry("x", "y"));
      tensor.xz.push(entry("x", "z"));
      tensor.yz.push(entry("y", "z"));
    }
    return ArchetypeMassRecord.finish(mass, centre, tensor);
  }

  /**
   * Each part's own mass under a total mass, by the same weights `of` shares it
   * by.
   *
   * @param parts The model's parts at rest.
   * @param mass The total mass, kilograms.
   * @param density Relative densities by part id; 1 for a part not listed.
   * @param shares Finite nonnegative weights replacing volume times density, as
   *   `of` takes them.
   * @param cells Explicit convex cells bound to their visible parts, as of
   *   takes them.
   * @returns Each part's mass by id, kilograms; a part without solid volume
   *   weighs nothing, including an inventory with no solids.
   * @throws {Error} For invalid mass/weights/dimensions, solids with no
   *   positive weight or unrepresentable local properties.
   */
  export function parts(
    parts: readonly IAutoMovieModelPart[],
    mass: number,
    density: Readonly<Record<string, number>> = {},
    shares: Readonly<Record<string, number>> = {},
    cells: AutoMovieArchetypeConvexCell.Table = new Map(),
  ): Record<string, number> {
    ArchetypeMassRecord.mass(mass);
    let solids: number = 0;
    const weights: [string, number][] = parts.map(
      (part: IAutoMovieModelPart): [string, number] => {
        const solid: ILocal | null = ArchetypeMassLocal(part, cells);
        if (solid !== null) solids++;
        return [
          part.id,
          solid === null ? 0 : weightOf(part.id, solid.volume, density, shares),
        ];
      },
    );
    if (solids === 0)
      return Object.fromEntries(
        weights.map(([id]: [string, number]): [string, number] => [id, 0]),
      );
    const normalized: { scale: number; total: number } =
      ArchetypeMassArithmetic.normalization(
        weights.map(([, value]: [string, number]): number => value),
      );
    return Object.fromEntries(
      weights.map(([id, w]: [string, number]): [string, number] => [
        id,
        ArchetypeMassArithmetic.ratio(
          mass,
          w,
          normalized.scale,
          normalized.total,
        ),
      ]),
    );
  }

  /** A rigid body's mass properties placed in a common space. */
  export interface IPlaced {
    /** The body's mass properties in its own space. */
    properties: IProperties;

    /** Where its space sits in the common one. */
    placement: IPlacedPlacement;
  }

  /** The placement object of {@link IPlaced}. */
  export type IPlacedPlacement = {
    translation: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
  };

  /**
   * The mass properties of rigid bodies placed together, such as the members of
   * an assembly.
   *
   * @param bodies Each body's mass properties in its own space and its
   *   placement in the common space, with unit scale.
   * @returns The total mass, the common centre of mass and the inertia about
   *   it, in the common space.
   * @throws {Error} For an empty list, invalid source records or an
   *   unrepresentable total mass, placed centre or tensor.
   */
  export function combine(bodies: readonly IPlaced[]): IProperties {
    if (bodies.length === 0)
      throw new Error("Mass properties combine at least one body");
    for (const body of bodies) ArchetypeMassRecord.admit(body.properties);
    const mass: number = ArchetypeMassArithmetic.sum(
      bodies.map((body: IPlaced): number => body.properties.mass),
    );
    const centres: IAutoMovieVector3[] = bodies.map(
      (body: IPlaced): IAutoMovieVector3 =>
        Vector3.add(
          body.placement.translation,
          Quaternion.rotateVector(
            body.placement.rotation,
            body.properties.centerOfMass,
          ),
        ),
    );
    ArchetypeMassRecord.mass(mass);
    const centre: IAutoMovieVector3 = ArchetypeMassArithmetic.vectorMean(
      centres,
      bodies.map((body: IPlaced): number => body.properties.mass),
    );

    // I = sum of R I_k R^T + m_k (|d|^2 E - d d^T), d from the common centre.
    const keys: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];
    const tensor: Record<keyof IInertia, number[]> = contributions();
    bodies.forEach((body: IPlaced, k: number): void => {
      const own: IInertia = body.properties.inertia;
      const rows: Record<"x" | "y" | "z", Record<"x" | "y" | "z", number>> = {
        x: { x: own.xx, y: own.xy, z: own.xz },
        y: { x: own.xy, y: own.yy, z: own.yz },
        z: { x: own.xz, y: own.yz, z: own.zz },
      };
      const ownTensor: (a: Axis, b: Axis) => number = (
        a: Axis,
        b: Axis,
      ): number => rows[a][b];
      const axes: IAutoMovieVector3[] = keys.map(
        (axis: "x" | "y" | "z"): IAutoMovieVector3 =>
          Quaternion.rotateVector(body.placement.rotation, {
            x: axis === "x" ? 1 : 0,
            y: axis === "y" ? 1 : 0,
            z: axis === "z" ? 1 : 0,
          }),
      );
      const d: IAutoMovieVector3 = Vector3.subtract(centres[k]!, centre);
      const m: number = body.properties.mass;
      const entry: (a: Axis, b: Axis) => number = (
        a: Axis,
        b: Axis,
      ): number => {
        const terms: number[] = [];
        keys.forEach((p: "x" | "y" | "z", i: number): void =>
          keys.forEach((q: "x" | "y" | "z", j: number): void => {
            terms.push(
              ArchetypeMassArithmetic.product(
                axes[i]![a],
                ownTensor(p, q),
                axes[j]![b],
              ),
            );
          }),
        );
        if (a === b) {
          for (const axis of AXES)
            if (axis !== a)
              terms.push(ArchetypeMassArithmetic.product(m, d[axis], d[axis]));
        } else terms.push(ArchetypeMassArithmetic.product(-m, d[a], d[b]));
        return ArchetypeMassArithmetic.sum(terms);
      };
      tensor.xx.push(entry("x", "x"));
      tensor.yy.push(entry("y", "y"));
      tensor.zz.push(entry("z", "z"));
      tensor.xy.push(entry("x", "y"));
      tensor.xz.push(entry("x", "z"));
      tensor.yz.push(entry("y", "z"));
    });
    return ArchetypeMassRecord.finish(mass, centre, tensor);
  }

  /**
   * The refusal for the moment of a visual-only model.
   *
   * @param archetype The producer's name.
   * @returns The refusal to throw.
   */
  export function visualOnly(archetype: string): AutoMovieArchetypeRefusal {
    return new AutoMovieArchetypeRefusal({
      archetype,
      kind: "parameter",
      axis: "body",
      value: null,
      reason: "a visual-only model has no moment of inertia",
      fix: "select a model with physical mass properties",
    });
  }

  /**
   * The moment of inertia about a line, such as the axis a bat is swung about
   * through the hands.
   *
   * @param properties The mass properties.
   * @param through A point of the line, in the model's space, metres.
   * @param direction The finite nonzero direction, normalized after
   *   largest-component scaling.
   * @returns The moment, kg m squared.
   * @throws {Error} For invalid mass properties, point or direction, or an
   *   unrepresentable line moment.
   */
  export function about(
    properties: IProperties,
    through: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): number {
    ArchetypeMassRecord.admit(properties);
    const scale: number = Math.max(
      Math.abs(direction.x),
      Math.abs(direction.y),
      Math.abs(direction.z),
    );
    if (!(scale > 0))
      throw new Error(
        "A moment needs a finite point and finite nonzero line direction",
      );
    const scaled: IAutoMovieVector3 = {
      x: direction.x / scale,
      y: direction.y / scale,
      z: direction.z / scale,
    };
    const length: number = Math.hypot(scaled.x, scaled.y, scaled.z);
    const n: IAutoMovieVector3 = {
      x: scaled.x / length,
      y: scaled.y / length,
      z: scaled.z / length,
    };
    const i: IInertia = properties.inertia;
    const central: number = ArchetypeMassArithmetic.sum([
      ArchetypeMassArithmetic.product(i.xx, n.x, n.x),
      ArchetypeMassArithmetic.product(i.yy, n.y, n.y),
      ArchetypeMassArithmetic.product(i.zz, n.z, n.z),
      ArchetypeMassArithmetic.product(2, i.xy, n.x, n.y),
      ArchetypeMassArithmetic.product(2, i.xz, n.x, n.z),
      ArchetypeMassArithmetic.product(2, i.yz, n.y, n.z),
    ]);
    const offset: IAutoMovieVector3 = Vector3.subtract(
      properties.centerOfMass,
      through,
    );
    const across: IAutoMovieVector3 = Vector3.cross(offset, n);
    const result: number = ArchetypeMassArithmetic.sum([
      central,
      ArchetypeMassArithmetic.product(properties.mass, across.x, across.x),
      ArchetypeMassArithmetic.product(properties.mass, across.y, across.y),
      ArchetypeMassArithmetic.product(properties.mass, across.z, across.z),
    ]);
    if (!(result >= 0))
      throw new Error("A line moment must have finite nonnegative inertia");
    return result;
  }
}

/** The shared local owner supplies primitive or cell principal data. */
type ILocal = NonNullable<ReturnType<typeof ArchetypeMassLocal>>;

/**
 * A part as a solid in the model: its weight share, centre, axes and central
 * inertia per unit mass.
 */
interface ISolid {
  /** Volume times relative density. */
  share: number;

  /** Centroid in the model's space, metres. */
  centre: IAutoMovieVector3;

  /** The primitive's X, Y and Z axes in the model's space. */
  axes: readonly [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];

  /** Central moments about those axes per unit mass, square metres. */
  unit: IAutoMovieVector3;
}

/** One of the model's orthogonal axes. */
type Axis = "x" | "y" | "z";

/** Tensor and parallel-axis terms visit axes in the same fixed order. */
const AXES: readonly Axis[] = ["x", "y", "z"];

/**
 * An explicit share replaces density; otherwise a positive density scales the
 * representable solid volume.
 */
function weightOf(
  id: string,
  volume: number,
  density: Readonly<Record<string, number>>,
  shares: Readonly<Record<string, number>>,
): number {
  const fixed: number | undefined = shares[id];
  const relative: number = density[id] ?? 1;
  if (fixed === undefined && !(relative > 0))
    throw new Error(`Part ${id} needs finite positive relative density`);
  const result: number | null =
    fixed ?? ArchetypeMassArithmetic.localProduct(volume, relative);
  if (!(result !== null && result >= 0))
    throw new Error(
      `Part ${id} needs a representable finite ${fixed === undefined ? "positive local volume-density product" : "nonnegative authored mass weight"}`,
    );
  return result;
}

/**
 * Keep each tensor contribution until its one complete reduction can decide
 * representability.
 */
function contributions(): Record<
  keyof AutoMovieArchetypeMass.IInertia,
  number[]
> {
  return { xx: [], yy: [], zz: [], xy: [], xz: [], yz: [] };
}
