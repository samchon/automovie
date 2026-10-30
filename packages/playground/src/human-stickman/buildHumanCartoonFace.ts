import * as THREE from "three";

import type { IAutoMovieHumanExpression } from "../../../human/src/structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanHeadPose } from "../../../human/src/structures/pose/IAutoMovieHumanHeadPose";

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
 * @evidence contracts/common.md#principled-implementation Dimensionless drawing conventions scale with actual head bounds and consume its triangle front; sided AU intensities drive brows, eyelids and mouth corners, while admitted gaze degrees and jaw millimetres convert once without another clinical clamp.
 * @evidence contracts/common.md#clear-and-simple-design One group attaches to the head's existing placement; no skeleton, expression schema or renderer is duplicated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No specimen, fitted face or texture supplies geometry; unsupported public actions are returned rather than silently claimed.
 * @evidence contracts/common.md#meaningful-documentation States frames, units, supported actions, visual exaggeration and caller ownership.
 * @evidence contracts/performance.md#efficient-algorithms A fixed small set of low-segment primitives uses O(A) input processing and bounded front sampling per vertex, only when the face is rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work Three shared materials serve both eyes and all facial strokes; each AU is resolved once per side.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned disposer releases every recorded geometry and material; no renderer or retained task is acquired.
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
  expression?: IAutoMovieHumanExpression,
  pose?: IAutoMovieHumanHeadPose,
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
  const dispose: () => void = (): void => {
    geometries.forEach((geometry: THREE.BufferGeometry): void =>
      geometry.dispose(),
    );
    ink.dispose();
    white.dispose();
    noseMaterial.dispose();
  };
  const au: (unit: string, side: number) => number = (
    unit: string,
    side: number,
  ): number => actions.get(unit)?.[side] ?? 0;
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
      new THREE.SphereGeometry(1, 12, 8),
      white,
    );
    eye.position.set(front, eyeY, eyeZ);
    eye.scale.set(
      extent.x * 0.025,
      extent.y * 0.082 * aperture,
      extent.z * 0.135,
    );
    const gaze:
      | NonNullable<IAutoMovieHumanHeadPose["eyes"]>["left"]
      | undefined = side === 0 ? pose?.eyes?.left : pose?.eyes?.right;
    const pupil: THREE.Mesh = mesh(
      "pupil." + name,
      new THREE.SphereGeometry(1, 10, 6),
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
    for (const child of object.children) {
      const part: THREE.Mesh = child as THREE.Mesh;
      part.updateMatrix();
      part.geometry.applyMatrix4(part.matrix);
      const positions: THREE.BufferAttribute = part.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      for (let i: number = 0; i < positions.count; i++) {
        if (
          !Number.isFinite(positions.getX(i)) ||
          !Number.isFinite(positions.getY(i)) ||
          !Number.isFinite(positions.getZ(i))
        )
          throw new Error("Cartoon mark exceeds finite geometry coordinates");
        const y: number = THREE.MathUtils.clamp(
          positions.getY(i),
          head.min[1],
          head.max[1],
        );
        const requestedZ: number = positions.getZ(i);
        let z: number = requestedZ;
        let x: number | undefined = head.frontAt(y, z);
        if (x === undefined) {
          x = head.frontAt(y, centreZ);
          if (x === undefined)
            throw new Error(
              "Polygon front has no centre support for a cartoon mark",
            );
          z = centreZ;
          let inside: number = 0;
          let outside: number = 1;
          // Resolve the projected silhouette to one part in 2^16 of mark width.
          for (let step: number = 0; step < 16; step++) {
            const fraction: number = (inside + outside) / 2;
            const candidateZ: number =
              centreZ + (requestedZ - centreZ) * fraction;
            const candidateX: number | undefined = head.frontAt(y, candidateZ);
            if (candidateX === undefined) outside = fraction;
            else {
              inside = fraction;
              z = candidateZ;
              x = candidateX;
            }
          }
        }
        if (!Number.isFinite(x))
          throw new Error(
            "Polygon front returned a non-finite cartoon attachment",
          );
        const mountedX: number = x + positions.getX(i) - head.max[0];

        // Refuse numeric storage overflow without restoring clinical pose limits.
        if (
          !Number.isFinite(Math.fround(mountedX)) ||
          !Number.isFinite(Math.fround(y)) ||
          !Number.isFinite(Math.fround(z))
        )
          throw new Error(
            "Cartoon attachment exceeds finite Float32 coordinates",
          );
        positions.setXYZ(i, mountedX, y, z);
      }
      positions.needsUpdate = true;
      part.geometry.computeVertexNormals();
      part.geometry.computeBoundingBox();
      part.geometry.computeBoundingSphere();
      part.position.set(0, 0, 0);
      part.quaternion.identity();
      part.scale.set(1, 1, 1);
      part.updateMatrix();
    }
  } catch (error: unknown) {
    dispose();
    throw error;
  }
  return { object, unsupported, dispose };
}
