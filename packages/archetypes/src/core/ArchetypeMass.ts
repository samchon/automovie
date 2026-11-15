import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The mass properties of an archetype built from primitive parts: its centre of mass and its inertia about that centre, from the parts' own solids under one total mass.
 *
 * Each part is a uniform solid whose share of the total mass is its volume times a relative density, 1 unless the producer states another, so a hollow or light part can weigh less than its outline suggests; a producer whose segment masses are measured states each part's share instead. A producer states the total mass from its cited band; the distribution follows from the geometry, which is what lets a test compare the result with a published balance point or moment of inertia instead of reading a copied number back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the density rule, who supplies the total mass and why the distribution is computed.
 * @evidence contracts/development/design.md#principled-representation Rigid-body mass properties in SI units in the model's axes: a centre in metres and the six distinct components of the symmetric inertia tensor about it in kg m squared.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The archetypes own it because `IAutoMovieBody` carries a mass and a centre but no inertia; acts that swing or carry a thing read the tensor (#3202 decision 6).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No per-archetype constant: every result is the composite of the parts' closed-form solids.
 */
export namespace ArchetypeMass {
  /**
   * The symmetric inertia tensor about the centre of mass, in the model's axes, kg m squared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The six independent components of the symmetric inertia tensor about the centre of mass in the model's axes, kg m squared; symmetry is carried by storing each product once.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; computed by `of` and read by `about` and by tests of mass properties.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; no redundant lower triangle.
   */
  export interface IInertia {
    /** Moment about the model's X axis through the centre of mass. */
    xx: number;

    /** Moment about the model's Y axis through the centre of mass. */
    yy: number;

    /** Moment about the model's Z axis through the centre of mass. */
    zz: number;

    /** Product of inertia, the tensor's XY component (minus the integral of x y dm). */
    xy: number;

    /** Product of inertia, the tensor's XZ component. */
    xz: number;

    /** Product of inertia, the tensor's YZ component. */
    yz: number;
  }

  /**
   * The mass properties of a whole archetype.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Total mass in kilograms, the centre of mass in the model's space in metres and the inertia about it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; computed once per archetype by `of` and published as `Archetype.properties`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; all three members are required.
   */
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
   * @param parts The model's parts at rest; a part without volume (a plane) weighs nothing.
   * @param mass The total mass, kilograms.
   * @param density Relative densities by part id; 1 for a part not listed.
   * @param shares Weights by part id that replace volume times density for the parts listed, for a body whose segment masses are measured, such as an animal's; when used, every part should be listed so the weights are shares of one total.
   * @returns The centre of mass and the inertia about it.
   * @throws {Error} When no part has volume or a share, a producer's defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units, the default density and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation Each primitive's volume, centroid and central inertia in closed form (box, sphere, cylinder, cone and a capsule as a cylinder with two hemispheres), turned into the model's axes by the part's rotation and gathered at the common centre by the parallel-axis theorem; parts carry unit scale by the builder's premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass for the masses and centre, one for the tensor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Overlapping parts are counted twice, a stated limit of composing solids without a boolean union; producers keep overlaps to joints.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computed once per produced archetype.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    parts: readonly IAutoMovieModelPart[],
    mass: number,
    density: Readonly<Record<string, number>> = {},
    shares: Readonly<Record<string, number>> = {},
  ): IProperties {
    // Each part's weight share, centroid in the model and central inertia per unit mass in its own axes.
    const solids: ISolid[] = [];
    let weight: number = 0;
    for (const part of parts) {
      if (part.geometry.type !== "primitive") continue;
      const solid: ILocal | null = local(part.geometry.shape);
      if (solid === null) continue;
      const share: number =
        shares[part.id] ?? solid.volume * (density[part.id] ?? 1);
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
      solids.push({
        share,
        centre: Vector3.add(
          origin,
          Quaternion.rotateVector(rotation, solid.centroid),
        ),
        axes: [
          Quaternion.rotateVector(rotation, { x: 1, y: 0, z: 0 }),
          Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
          Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 }),
        ],
        unit: solid.unit,
      });
      weight += share;
    }
    if (!(weight > 0))
      throw new Error(
        "An archetype needs a part with volume or a mass share to have mass properties",
      );

    let centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const solid of solids)
      centre = Vector3.add(
        centre,
        Vector3.scale(solid.centre, solid.share / weight),
      );

    // I = sum of R diag(i) R^T m + m (|d|^2 E - d d^T), d from the common centre.
    const inertia: IInertia = { xx: 0, yy: 0, zz: 0, xy: 0, xz: 0, yz: 0 };
    for (const solid of solids) {
      const m: number = (mass * solid.share) / weight;
      const d: IAutoMovieVector3 = Vector3.subtract(solid.centre, centre);
      const dd: number = Vector3.dot(d, d);
      const principal: readonly number[] = [
        solid.unit.x,
        solid.unit.y,
        solid.unit.z,
      ];
      const entry = (a: "x" | "y" | "z", b: "x" | "y" | "z"): number => {
        let value: number = 0;
        for (let k: number = 0; k < 3; k++)
          value += principal[k]! * solid.axes[k]![a] * solid.axes[k]![b];
        return m * (value + (a === b ? dd : 0) - d[a] * d[b]);
      };
      inertia.xx += entry("x", "x");
      inertia.yy += entry("y", "y");
      inertia.zz += entry("z", "z");
      inertia.xy += entry("x", "y");
      inertia.xz += entry("x", "z");
      inertia.yz += entry("y", "z");
    }
    return { mass, centerOfMass: centre, inertia };
  }

  /**
   * A rigid body's mass properties placed in a common space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Mass properties in the body's own space and a rigid placement in metres with a unit quaternion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the input of `combine`, written by `ArchetypeAssembly`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The placement carries no scale, which mass properties cannot follow.
   */
  export interface IPlaced {
    /** The body's mass properties in its own space. */
    properties: IProperties;

    /** Where its space sits in the common one. */
    placement: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
  }

  /**
   * The mass properties of rigid bodies placed together, such as the members of an assembly.
   *
   * @param bodies Each body's mass properties in its own space and its placement in the common space, with unit scale.
   * @returns The total mass, the common centre of mass and the inertia about it, in the common space.
   * @throws {Error} When the list is empty, a caller's defect.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' spaces, the result and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation The centre is the mass-weighted mean of the placed centres; each body's tensor about its own centre is turned into the common axes as R I R transposed, then gathered at the common centre by the parallel-axis theorem, m (|d| squared E - d d transposed), the same law `of` applies to parts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass for the mass and centre, one for the tensor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Bodies that overlap are counted twice, as `of` counts overlapping parts.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bodies.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Computed once per assembly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function combine(bodies: readonly IPlaced[]): IProperties {
    if (bodies.length === 0)
      throw new Error("Mass properties combine at least one body");
    let mass: number = 0;
    let weighted: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
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
    bodies.forEach((body: IPlaced, k: number): void => {
      mass += body.properties.mass;
      weighted = Vector3.add(
        weighted,
        Vector3.scale(centres[k]!, body.properties.mass),
      );
    });
    const centre: IAutoMovieVector3 = Vector3.scale(weighted, 1 / mass);

    // I = sum of R I_k R^T + m_k (|d|^2 E - d d^T), d from the common centre.
    const keys: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];
    const inertia: IInertia = { xx: 0, yy: 0, zz: 0, xy: 0, xz: 0, yz: 0 };
    bodies.forEach((body: IPlaced, k: number): void => {
      const own: IInertia = body.properties.inertia;
      const rows: Record<"x" | "y" | "z", Record<"x" | "y" | "z", number>> = {
        x: { x: own.xx, y: own.xy, z: own.xz },
        y: { x: own.xy, y: own.yy, z: own.yz },
        z: { x: own.xz, y: own.yz, z: own.zz },
      };
      const tensor = (a: "x" | "y" | "z", b: "x" | "y" | "z"): number =>
        rows[a][b];
      const axes: IAutoMovieVector3[] = keys.map(
        (axis: "x" | "y" | "z"): IAutoMovieVector3 =>
          Quaternion.rotateVector(body.placement.rotation, {
            x: axis === "x" ? 1 : 0,
            y: axis === "y" ? 1 : 0,
            z: axis === "z" ? 1 : 0,
          }),
      );
      const d: IAutoMovieVector3 = Vector3.subtract(centres[k]!, centre);
      const dd: number = Vector3.dot(d, d);
      const m: number = body.properties.mass;
      const entry = (a: "x" | "y" | "z", b: "x" | "y" | "z"): number => {
        let turned: number = 0;
        keys.forEach((p: "x" | "y" | "z", i: number): void =>
          keys.forEach((q: "x" | "y" | "z", j: number): void => {
            turned += axes[i]![a] * tensor(p, q) * axes[j]![b];
          }),
        );
        return turned + m * ((a === b ? dd : 0) - d[a] * d[b]);
      };
      inertia.xx += entry("x", "x");
      inertia.yy += entry("y", "y");
      inertia.zz += entry("z", "z");
      inertia.xy += entry("x", "y");
      inertia.xz += entry("x", "z");
      inertia.yz += entry("y", "z");
    });
    return { mass, centerOfMass: centre, inertia };
  }

  /**
   * The moment of inertia about a line, such as the axis a bat is swung about through the hands.
   *
   * @param properties The mass properties.
   * @param through A point of the line, in the model's space, metres.
   * @param direction The line's direction; any length.
   * @returns The moment, kg m squared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the line's inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The tensor's quadratic form along the unit direction gives the moment about the parallel line through the centre of mass; the parallel-axis theorem adds the mass times the squared distance between the two lines.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One quadratic form and one distance.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function about(
    properties: IProperties,
    through: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ): number {
    const n: IAutoMovieVector3 = Vector3.normalize(direction);
    const i: IInertia = properties.inertia;
    const central: number =
      i.xx * n.x * n.x +
      i.yy * n.y * n.y +
      i.zz * n.z * n.z +
      2 * (i.xy * n.x * n.y + i.xz * n.x * n.z + i.yz * n.y * n.z);
    const offset: IAutoMovieVector3 = Vector3.subtract(
      properties.centerOfMass,
      through,
    );
    const across: IAutoMovieVector3 = Vector3.subtract(
      offset,
      Vector3.scale(n, Vector3.dot(offset, n)),
    );
    return central + properties.mass * Vector3.dot(across, across);
  }
}

/** A primitive in its own axes: volume, centroid and central principal inertia per unit mass. */
interface ILocal {
  /** Volume, cubic metres. */
  volume: number;

  /** Centroid in the primitive's coordinates, metres. */
  centroid: IAutoMovieVector3;

  /** Central moments about the primitive's axes per unit mass, square metres. */
  unit: IAutoMovieVector3;
}

/** A part as a solid in the model: its weight share, centre, axes and central inertia per unit mass. */
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

/**
 * A primitive's solid in its own axes, or null for a shape without volume.
 *
 * @param shape The primitive.
 * @returns Its volume, centroid and central inertia per unit mass.
 */
function local(shape: AutoMoviePrimitiveShape): ILocal | null {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  switch (shape.type) {
    case "box":
      return {
        volume: shape.width * shape.height * shape.depth,
        centroid: zero,
        unit: {
          x: (shape.height ** 2 + shape.depth ** 2) / 12,
          y: (shape.width ** 2 + shape.depth ** 2) / 12,
          z: (shape.width ** 2 + shape.height ** 2) / 12,
        },
      };
    case "sphere":
      return {
        volume: (4 / 3) * Math.PI * shape.radius ** 3,
        centroid: zero,
        unit: {
          x: 0.4 * shape.radius ** 2,
          y: 0.4 * shape.radius ** 2,
          z: 0.4 * shape.radius ** 2,
        },
      };
    case "cylinder": {
      const across: number = (3 * shape.radius ** 2 + shape.height ** 2) / 12;
      return {
        volume: Math.PI * shape.radius ** 2 * shape.height,
        centroid: zero,
        unit: { x: across, y: shape.radius ** 2 / 2, z: across },
      };
    }
    case "cone": {
      // Apex at -h/2 and base at +h/2: the centroid lies a quarter of the height from the base.
      const across: number =
        (3 / 80) * (4 * shape.radius ** 2 + shape.height ** 2);
      return {
        volume: (Math.PI * shape.radius ** 2 * shape.height) / 3,
        centroid: { x: 0, y: shape.height / 4, z: 0 },
        unit: { x: across, y: 0.3 * shape.radius ** 2, z: across },
      };
    }
    case "capsule": {
      // A cylinder of length h and two hemispheres, each with its centroid 3r/8 beyond the cylinder's end and a transverse central moment of 83/320 m r^2.
      const r: number = shape.radius;
      const h: number = shape.height;
      const cylinder: number = Math.PI * r * r * h;
      const hemisphere: number = (2 / 3) * Math.PI * r ** 3;
      const volume: number = cylinder + 2 * hemisphere;
      const across: number =
        (cylinder * ((3 * r * r + h * h) / 12) +
          2 * hemisphere * ((83 / 320) * r * r + (h / 2 + (3 * r) / 8) ** 2)) /
        volume;
      const along: number =
        (cylinder * ((r * r) / 2) + 2 * hemisphere * (0.4 * r * r)) / volume;
      return {
        volume,
        centroid: zero,
        unit: { x: across, y: along, z: across },
      };
    }
    case "plane":
      return null;
  }
}
