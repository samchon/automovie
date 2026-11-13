import * as THREE from "three";

import { createAutoMovieClosedSphereGeometry } from "../createAutoMovieClosedSphereGeometry.js";
import type { AutoMovieHumanCartoon } from "./AutoMovieHumanCartoon.js";
import { mountHumanCartoonFace } from "./mountHumanCartoonFace.js";

/**
 * Build a deliberately exaggerated cartoon face for a posed polygon head.
 * The caller adds the returned object to the already posed head group once.
 * Bounds use that group's metres, +X forward, +Y up and +Z anatomical left.
 * Eyes, brows, nose and mouth are dimensioned marks, not anatomical skin.
 * Supported units are AU1/2/4/5/6/7/12/15/20/23/24/25/26/27/41/43;
 * named lip fields reuse those units. Other actions, tongue and visemes are
 * reported as unsupported. Head orientation stays with the parent; gaze
 * moves pupils and jaw millimetres move the mouth marks. Marks follow the
 * actual polygon front; the silhouette limits exaggerated brow and jaw travel.
 * Pose values must be finite and already admitted by the caller; this drawing
 * applies no second clinical range limit, including when clamping is disabled.
 *
 * @param head Actual local bounds of the polygon head, metres.
 * @param expression Existing public action-unit input; omission means neutral.
 * @param pose Admitted finite eye/jaw pose; neck motion is already on the parent.
 * @returns Owned face geometry, explicit unsupported fields and its disposer.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Dimensionless drawing conventions scale with actual head bounds and consume its triangle front; sided AU intensities drive brows, eyelids and mouth corners, while admitted gaze degrees and jaw millimetres convert once without another clinical clamp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One group attaches to the head's existing placement; no skeleton, expression schema or renderer is duplicated.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No specimen, fitted face or texture supplies geometry; unsupported public actions are returned rather than silently claimed.
 * @evidence contracts/development/common.md#meaningful-documentation States frames, units, supported actions, visual exaggeration and caller ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed small set of low-segment primitives uses O(A) input processing and bounded front sampling per vertex, only when the face is rebuilt.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Three shared materials serve both eyes and all facial strokes; each AU is resolved once per side.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned disposer releases every recorded geometry and material; no renderer or retained task is acquired.
 */
export function buildHumanCartoonFace(
  head: {
    /** Actual head-local minimum in metres. */
    min: [number, number, number];

    /** Actual head-local maximum in metres. */
    max: [number, number, number];

    /** Most anterior local triangle X at Y/Z; undefined outside its silhouette. */
    frontAt: (y: number, z: number) => number | undefined;
  },
  expression?: AutoMovieHumanCartoon.IExpression,
  pose?: AutoMovieHumanCartoon.IHeadPose,
): {
  /** Add once to the polygon head's already posed group. */
  object: THREE.Group;

  /** Requested fields outside this cartoon's supported subset. */
  unsupported: readonly string[];

  /** Release every created geometry and material. */
  dispose: () => void;
} {
  const extent: THREE.Vector3 = new THREE.Vector3(...head.max).sub(
    new THREE.Vector3(...head.min),
  );
  if (
    ![...head.min, ...head.max].every(Number.isFinite) ||
    Math.min(extent.x, extent.y, extent.z) <= 0 ||
    typeof head.frontAt !== "function"
  )
    throw new Error("Cartoon face needs finite positive polygon head bounds");

  // Admission belongs to the pose evaluator; direct calls still need finite
  // scalars before any geometry or material is acquired.
  const poseValues: (number | undefined)[] = [
    pose?.eyes?.left?.vertical,
    pose?.eyes?.left?.horizontal,
    pose?.eyes?.right?.vertical,
    pose?.eyes?.right?.horizontal,
    pose?.jaw?.opening,
    pose?.jaw?.protrusion,
    pose?.jaw?.lateralExcursion,
  ];
  if (
    poseValues.some(
      (value: number | undefined): boolean =>
        value !== undefined && !Number.isFinite(value),
    )
  )
    throw new Error("Cartoon face requires finite admitted eye and jaw values");

  const centreY: number = (head.min[1] + head.max[1]) / 2;
  const centreZ: number = (head.min[2] + head.max[2]) / 2;
  const front: number = head.max[0] + extent.x * 0.012;
  const actions: Map<string, [number, number]> = new Map();
  const used: Set<string> = new Set();
  const unsupported: string[] = [];
  const supported: Set<string> = new Set([
    "innerBrowRaiser",
    "outerBrowRaiser",
    "browLowerer",
    "upperLidRaiser",
    "cheekRaiser",
    "lidTightener",
    "lipCornerPuller",
    "lipCornerDepressor",
    "lipStretcher",
    "lipTightener",
    "lipPressor",
    "lipsPart",
    "jawDrop",
    "mouthStretch",
    "lidDroop",
    "eyesClosed",
  ]);

  /**
   * Admit one sided action and preserve explicit unsupported reporting.
   *
   * Principled implementation: Enforces finite [0,1] intensity and unique unit/side, writes the original bilateral lookup and records unsupported nonzero unit names once.
   * Clear and simple design: One admission seam serves activation lists and named lip fields.
   * Prohibited implementation shortcuts: Unsupported requests are reported rather than converted to invented marks.
   * Meaningful documentation: States sided admission and unsupported handling.
   * Efficient algorithms: Constant lookup plus a scan of the bounded unsupported-name list.
   * Reuse equivalent work: Reuses one bilateral intensity pair per action.
   * Bound retention and release resources: Plain action records live only through this face build.
   */
  const set: (unit: string, side: "left" | "right", value: number) => void = (
    unit: string,
    side: "left" | "right",
    value: number,
  ): void => {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error("Cartoon AU intensity must be in [0, 1]");
    const address: string = unit + "/" + side;
    if (used.has(address))
      throw new Error("Cartoon expression repeats an action unit and side");
    used.add(address);
    const pair: [number, number] = actions.get(unit) ?? [0, 0];
    pair[side === "left" ? 0 : 1] = value;
    actions.set(unit, pair);
    if (value !== 0 && !supported.has(unit) && !unsupported.includes(unit))
      unsupported.push(unit);
  };
  for (const action of expression?.units ?? [])
    for (const side of ["left", "right"] as const)
      if (action.side === "both" || action.side === side)
        set(action.unit, side, action.intensity);
  for (const [unit, value] of Object.entries(expression?.mouth?.lips ?? {})) {
    if (value === undefined) continue;
    if (typeof value === "number") {
      set(unit, "left", value);
      set(unit, "right", value);
    } else {
      set(unit, "left", value.left);
      set(unit, "right", value.right);
    }
  }
  if (expression?.mouth?.tongue !== undefined) unsupported.push("mouth.tongue");
  if (expression?.mouth?.visemes !== undefined)
    unsupported.push("mouth.visemes");
  const object: THREE.Group = new THREE.Group();
  object.name = "human.cartoon.face";
  const geometries: THREE.BufferGeometry[] = [];
  const ink: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0x15202a,
    side: THREE.DoubleSide,
  });
  const white: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: 0xfffbf0,
  });
  const noseMaterial: THREE.MeshStandardMaterial =
    new THREE.MeshStandardMaterial({
      color: 0xd99a63,
      roughness: 0.9,
      flatShading: true,
    });

  /**
   * Release the original face's geometry and three shared materials.
   *
   * Principled implementation: Disposes every recorded geometry and the original ink/white/nose materials without claiming its borrowed head.
   * Clear and simple design: The returned face owner retains its independent lifetime.
   * Prohibited implementation shortcuts: No caller head geometry or materials are released.
   * Meaningful documentation: States owned resource roles and borrowed-head exclusion.
   * Efficient algorithms: O(G) calls for G created face geometries and three materials.
   * Reuse equivalent work: Shared materials are each disposed once per call, matching original one-owner use.
   * Bound retention and release resources: The caller invokes this disposer once when retiring its face; returned object references remain caller-owned.
   */
  const dispose: () => void = (): void => {
    geometries.forEach((geometry: THREE.BufferGeometry): void =>
      geometry.dispose(),
    );
    ink.dispose();
    white.dispose();
    noseMaterial.dispose();
  };

  /**
   * Read an admitted sided action, with omitted units neutral.
   *
   * Principled implementation: Reads the existing bilateral pair or zero, preserving original neutral semantics.
   * Clear and simple design: One lookup serves all original mark formulas.
   * Prohibited implementation shortcuts: No emotion preset or inferred activation is added.
   * Meaningful documentation: Gives omitted-unit zero semantics.
   * Efficient algorithms: Constant map/tuple access.
   * Reuse equivalent work: Reads the resolved action table instead of rescanning expression inputs.
   * Bound retention and release resources: Acquires no resource or retained result.
   */
  const au: (unit: string, side: number) => number = (
    unit: string,
    side: number,
  ): number => actions.get(unit)?.[side] ?? 0;

  /**
   * Record one original face mark and its owned geometry.
   *
   * Principled implementation: Creates a mesh over the supplied original primitive/mark buffer, assigns its stable drawing name and mounts it in the owned face group.
   * Clear and simple design: One seam records every face geometry for cleanup.
   * Prohibited implementation shortcuts: No shape selection, skeleton or body geometry is introduced.
   * Meaningful documentation: States owned-buffer recording and face-group mounting.
   * Efficient algorithms: Constant registry/object work beyond supplied geometry creation.
   * Reuse equivalent work: Reuses the three borrowed-within-face shared materials.
   * Bound retention and release resources: Geometry transfers to the face's disposal inventory and remains bounded by its fixed mark population.
   */
  const mesh: (
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ) => THREE.Mesh = (
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
  ): THREE.Mesh => {
    geometries.push(geometry);
    const part: THREE.Mesh = new THREE.Mesh(geometry, material);
    part.name = "human.cartoon." + name;
    object.add(part);
    return part;
  };

  /**
   * Preserve the original Catmull-Rom tubular brow/lip stroke.
   *
   * Principled implementation: Uses the original curve, at least eight longitudinal segments and five radial segments with supplied metric radius.
   * Clear and simple design: One drawing primitive serves brows and closed lips.
   * Prohibited implementation shortcuts: Segment counts and radii are unchanged drawing conventions, without anatomical fitting.
   * Meaningful documentation: States curve primitive and preserved display sampling.
   * Efficient algorithms: Geometry work scales with the fixed supplied stroke point count and segment formula.
   * Reuse equivalent work: Reuses the face ink material and common mesh recorder.
   * Bound retention and release resources: The created geometry transfers immediately to the face inventory.
   */
  const stroke: (
    name: string,
    points: THREE.Vector3[],
    radius: number,
  ) => void = (name: string, points: THREE.Vector3[], radius: number): void => {
    const curve: THREE.CatmullRomCurve3 = new THREE.CatmullRomCurve3(points);
    mesh(
      name,
      new THREE.TubeGeometry(
        curve,
        Math.max(8, points.length * 2),
        radius,
        5,
        false,
      ),
      ink,
    );
  };

  // White eye marks contract with closure; a separate pupil expresses gaze.
  for (const side of [0, 1]) {
    const sign: number = side === 0 ? 1 : -1;
    const name: string = side === 0 ? "left" : "right";
    const eyeY: number = centreY + extent.y * 0.115;
    const eyeZ: number = centreZ + sign * extent.z * 0.235;
    const aperture: number = Math.max(
      0.025,
      (1 +
        0.8 * au("upperLidRaiser", side) -
        0.5 * au("cheekRaiser", side) -
        0.65 * au("lidTightener", side) -
        0.6 * au("lidDroop", side)) *
        (1 - au("eyesClosed", side)),
    );
    const eye: THREE.Mesh = mesh(
      "eye." + name,
      createAutoMovieClosedSphereGeometry(1, 12, 8),
      white,
    );
    eye.position.set(front, eyeY, eyeZ);
    eye.scale.set(
      extent.x * 0.025,
      extent.y * 0.082 * aperture,
      extent.z * 0.135,
    );
    const gaze:
      | NonNullable<AutoMovieHumanCartoon.IHeadPose["eyes"]>["left"]
      | undefined = side === 0 ? pose?.eyes?.left : pose?.eyes?.right;
    const pupil: THREE.Mesh = mesh(
      "pupil." + name,
      createAutoMovieClosedSphereGeometry(1, 10, 6),
      ink,
    );
    pupil.position.set(
      front + extent.x * 0.028,
      eyeY +
        Math.sin(THREE.MathUtils.degToRad(gaze?.vertical ?? 0)) *
          extent.y *
          0.055 *
          aperture,
      eyeZ +
        Math.sin(THREE.MathUtils.degToRad(gaze?.horizontal ?? 0)) *
          extent.z *
          0.085,
    );
    pupil.scale.set(
      extent.x * 0.012,
      extent.y * 0.048 * Math.min(1.3, aperture),
      extent.z * 0.05,
    );
    const browPoints: THREE.Vector3[] = Array.from(
      { length: 5 },
      (_: unknown, i: number): THREE.Vector3 => {
        const u: number = i / 4;
        const inner: number =
          0.13 * au("innerBrowRaiser", side) - 0.12 * au("browLowerer", side);
        const outer: number =
          0.13 * au("outerBrowRaiser", side) + 0.025 * au("browLowerer", side);
        return new THREE.Vector3(
          front + extent.x * 0.018,
          eyeY +
            extent.y *
              (0.145 +
                inner * (1 - u) +
                outer * u +
                0.018 * Math.sin(Math.PI * u)),
          centreZ + sign * extent.z * (0.095 + 0.285 * u),
        );
      },
    );
    stroke("brow." + name, browPoints, extent.y * 0.018);
  }

  const nose: THREE.Mesh = mesh(
    "nose",
    new THREE.ConeGeometry(extent.z * 0.055, extent.x * 0.13, 4),
    noseMaterial,
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(
    front + extent.x * 0.04,
    centreY - extent.y * 0.045,
    centreZ,
  );

  // A sided centreline carries the corners; opening adds a dark mouth mark.
  const jawOpen: number = (pose?.jaw?.opening ?? 0) / 1000;
  const jawForward: number = (pose?.jaw?.protrusion ?? 0) / 1000;
  const jawSide: number = (pose?.jaw?.lateralExcursion ?? 0) / 1000;
  const opening: number =
    jawOpen +
    extent.y *
      Math.max(
        ...[0, 1].map(
          (side: number): number =>
            0.22 * au("jawDrop", side) +
            0.3 * au("mouthStretch", side) +
            0.09 * au("lipsPart", side),
        ),
      );
  const mouthY: number = centreY - extent.y * 0.235;
  const halfWidths: number[] = [0, 1].map(
    (side: number): number =>
      extent.z *
      (0.19 +
        0.065 * au("lipCornerPuller", side) +
        0.07 * au("lipStretcher", side)),
  );

  /**
   * Preserve the sided quadratic mouth-corner displacement.
   *
   * Principled implementation: Uses the original head-height-scaled puller/depressor intensities and u squared for each anatomical side.
   * Clear and simple design: One scalar curve serves the existing mouth marks.
   * Prohibited implementation shortcuts: Original exaggeration coefficients are unchanged and are not anatomical measurements.
   * Meaningful documentation: States sided quadratic displacement and drawing convention.
   * Efficient algorithms: Constant action lookups and arithmetic.
   * Reuse equivalent work: Reads the existing action table and head extent.
   * Bound retention and release resources: Returns one scalar and retains nothing.
   */
  const corner: (u: number) => number = (u: number): number => {
    const side: number = u >= 0 ? 0 : 1;
    return (
      extent.y *
      (0.17 * au("lipCornerPuller", side) -
        0.13 * au("lipCornerDepressor", side)) *
      u *
      u
    );
  };

  /**
   * Preserve one original local mouth mark point before front mounting.
   *
   * Principled implementation: Combines the original front offset, sided half-width/corner curve and converted jaw displacements in head-local metres.
   * Clear and simple design: One point formula serves open-mouth columns and the closed-mouth stroke.
   * Prohibited implementation shortcuts: No extra clinical clamp or replacement head surface is used.
   * Meaningful documentation: States pre-mount head-local point and jaw displacement use.
   * Efficient algorithms: Constant arithmetic and one vector per requested point.
   * Reuse equivalent work: Reuses resolved widths, jaw values and corner function.
   * Bound retention and release resources: Temporary points transfer to primitive geometry construction and are not retained independently.
   */
  const mouthPoint: (u: number, vertical: number) => THREE.Vector3 = (
    u: number,
    vertical: number,
  ): THREE.Vector3 =>
    new THREE.Vector3(
      front + extent.x * 0.028 + jawForward,
      mouthY + corner(u) + vertical,
      centreZ + u * halfWidths[u >= 0 ? 0 : 1]! + jawSide,
    );
  if (opening > 0) {
    // Paired columns preserve the front's central ridge instead of spanning it
    // with an outline-only triangulation that could sink through the head.
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i: number = 0; i <= 16; i++) {
      const u: number = i / 8 - 1;
      const radius: number = Math.sqrt(Math.max(0, 1 - u * u));
      for (const direction of [-1, 1]) {
        const p: THREE.Vector3 = mouthPoint(
          u,
          direction * radius * opening * 0.5 - opening * 0.25,
        );
        positions.push(p.x, p.y, p.z);
      }
      if (i < 16) {
        const a: number = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(indices);
    mesh("mouth.open", geometry, ink);
  } else {
    const points: THREE.Vector3[] = Array.from(
      { length: 13 },
      (_: unknown, i: number): THREE.Vector3 => mouthPoint(i / 6 - 1, 0),
    );
    const tighten: number = Math.max(
      au("lipTightener", 0),
      au("lipTightener", 1),
      au("lipPressor", 0),
      au("lipPressor", 1),
    );
    stroke("mouth.closed", points, extent.y * (0.015 - 0.007 * tighten));
  }
  // Bake drawing transforms before mounting each vertex on the actual front.
  // Bound marks to the silhouette rather than leave raised brows in empty space.
  try {
    mountHumanCartoonFace(object, head);
  } catch (error: unknown) {
    dispose();
    throw error;
  }
  return { object, unsupported, dispose };
}
