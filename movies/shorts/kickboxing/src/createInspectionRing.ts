import * as THREE from "three";

/**
 * Build visible scenery from the same metre-valued layout used by film staging.
 *
 * @evidence contracts/common.md#implementation-and-ownership Shared native primitives represent the canvas, four ropes per side, connecting bands, posts and corner cushions. Canvas top remains world Y zero. Disposal retires once, attempts removal and every owned geometry/material independently, then reports all failures together. The caller owns scene attachment. Rigid scenery does not simulate rope compliance or certify competition equipment.
 * @evidence contracts/common.md#authoring-interface layout exposes physical bounds separately from the authored six-metre route area and corner holding points. Red and cyan-blue assigned corners and white neutral corners are film art direction, differing from GLORY's specified white/black athlete posts. Actual actor containment and screen readability require consumer inspection.
 */
export function createInspectionRing(): createInspectionRing.Result {
  const layout: createInspectionRing.Layout = createInspectionRing.layout();
  const object: THREE.Group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  object.name = "kickboxing-ring";

  const mat: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xc6c4bd, roughness: 0.98 });
  const dark: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x171e27, roughness: 0.9 });
  const rope: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d9df, roughness: 0.8 });
  materials.push(mat, dark, rope);

  const floorGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(layout.matBounds.max[0] - layout.matBounds.min[0], layout.matBounds.max[1] - layout.matBounds.min[1], layout.matBounds.max[2] - layout.matBounds.min[2]);
  geometries.push(floorGeometry);
  const floor: THREE.Mesh = new THREE.Mesh(floorGeometry, mat);
  floor.name = "canvas";
  floor.position.y = (layout.matBounds.min[1] + layout.matBounds.max[1]) / 2;
  floor.receiveShadow = true;
  object.add(floor);

  const apronGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(layout.apronBounds.max[0] - layout.apronBounds.min[0], layout.apronBounds.max[1] - layout.apronBounds.min[1], layout.apronBounds.max[2] - layout.apronBounds.min[2]);
  geometries.push(apronGeometry);
  const apron: THREE.Mesh = new THREE.Mesh(apronGeometry, dark);
  apron.name = "apron";
  apron.position.y = (layout.apronBounds.min[1] + layout.apronBounds.max[1]) / 2;
  object.add(apron);

  const postGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(layout.postRadius, layout.postRadius, layout.postHeight, 10);
  const padGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(...layout.padSize);
  geometries.push(postGeometry, padGeometry);
  const cornerMaterials: Map<number, THREE.MeshStandardMaterial> = new Map();
  for (const corner of layout.corners) {
    let material: THREE.MeshStandardMaterial | undefined = cornerMaterials.get(corner.color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color: corner.color, roughness: 0.86 });
      cornerMaterials.set(corner.color, material);
      materials.push(material);
    }
    const post: THREE.Mesh = new THREE.Mesh(postGeometry, material);
    post.name = `post:${corner.id}`;
    post.position.set(...corner.postCentre);
    const pad: THREE.Mesh = new THREE.Mesh(padGeometry, material);
    pad.name = `pad:${corner.id}`;
    pad.position.set(...corner.padCentre);
    object.add(post, pad);
  }

  const ropeGeometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(layout.ropeRadius, layout.ropeRadius, layout.ropeSpan, 8);
  geometries.push(ropeGeometry);
  for (const boundary of layout.ropes) {
    const mesh: THREE.Mesh = new THREE.Mesh(ropeGeometry, rope);
    mesh.name = boundary.id;
    if (boundary.axis === "x") mesh.rotation.z = Math.PI / 2;
    else mesh.rotation.x = Math.PI / 2;
    mesh.position.set(...boundary.centre);
    object.add(mesh);
  }

  // Two bands per edge connect all four elevations without changing the span.
  const lowest: number = layout.ropeHeights[0];
  const highest: number = layout.ropeHeights[3];
  const bandGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(0.035, highest - lowest, 0.035);
  geometries.push(bandGeometry);
  for (const axis of ["x", "z"] as const) for (const edge of [-layout.ropeSpan / 2, layout.ropeSpan / 2]) for (const along of [-layout.ropeSpan / 6, layout.ropeSpan / 6]) {
    const band: THREE.Mesh = new THREE.Mesh(bandGeometry, rope);
    band.name = `rope-band:${axis}:${edge}:${along}`;
    band.position.set(axis === "x" ? along : edge, (lowest + highest) / 2, axis === "z" ? along : edge);
    object.add(band);
  }

  let disposed: boolean = false;
  return { object, layout, dispose: (): void => {
    if (disposed) return;

    // Native removal and disposal listeners may reenter; retire before invoking them.
    disposed = true;
    const failures: unknown[] = [];
    try { object.removeFromParent(); } catch (error: unknown) { failures.push(error); }
    for (const geometry of geometries) try { geometry.dispose(); } catch (error: unknown) { failures.push(error); }
    for (const material of materials) try { material.dispose(); } catch (error: unknown) { failures.push(error); }
    if (failures.length) throw new AggregateError(failures, "Ring retirement failed");
  } };
}

/**
 * Immutable source-owned ring geometry, independent of a browser or actor.
 *
 * @evidence contracts/common.md#implementation-and-ownership The established 6.4-metre canvas and 6.2-metre rope span remain unchanged. GLORY Rules 2026 v2.2 section 4.06 supports the canvas size, 3.6-centimetre rope diameter, four elevations and two connecting bands per side. Corner colours and the six-metre route area remain explicit fictional choices.
 * @evidence contracts/common.md#authoring-interface World coordinates use metres, Y up and the ring centred at X/Z zero. Bounds describe scenery rather than collision admission. Holding points are route intentions, requiring actual anatomy and support inspection before use.
 */
export namespace createInspectionRing {
  /**
   * World X/Y/Z positions or extents in metres, in the ring's Y-up frame.
   */
  export type Point = readonly [number, number, number];

  /**
   * Closed axis-aligned scenery limits in world metres, with both endpoints included.
   *
   * These static extents do not establish collision admission.
   */
  export interface Bounds {
    /** Minimum coordinate on each world axis. */
    readonly min: Point;

    /** Maximum coordinate on each world axis. */
    readonly max: Point;
  }

  /**
   * Straight capped cylindrical rope with radius-inclusive analytic bounds.
   *
   * The visible mesh is inscribed in this static envelope; rope deflection is not modeled.
   */
  export interface Rope {
    /** Stable visible mesh identity. */
    readonly id: string;

    /** Horizontal cylinder axis. */
    readonly axis: "x" | "z";

    /** World cylinder midpoint. */
    readonly centre: Point;

    /** Analytic cylinder AABB; polygonal tessellation is inscribed. */
    readonly bounds: Bounds;
  }

  /**
   * Visible corner role, equipment placement and standing-root destination.
   *
   * Holding points require separate whole-body clearance checks; counting and movement belong to the film.
   */
  export interface Corner {
    /** Stable identity independent of camera position. */
    readonly id: "red" | "blue" | "neutral-nw" | "neutral-se";

    /** Assigned athlete colour or neutral white. */
    readonly role: "red" | "blue" | "neutral";

    /** Neutral corners belong to neither fighter. */
    readonly actorId: "a" | "b" | null;

    /** Native RGB value shared by the post and cushion. */
    readonly color: number;

    /** Cylinder centre, not its floor contact point. */
    readonly postCentre: Point;

    /** Axis-aligned cushion centre, shifted inward from the post. */
    readonly padCentre: Point;

    /** Physical cushion limits including its thickness. */
    readonly padBounds: Bounds;

    /** Standing-root destination; whole-body clearance is not implied. */
    readonly holdingPoint: Point;
  }

  /**
   * Shared immutable dimensions for scenery and staging.
   *
   * Physical scenery, analytic rope envelopes and the narrower route area have separate bounds. They do not certify actor support or containment.
   */
  export interface Layout {
    /** Canvas top and Grounding support plane. */
    readonly floorY: number;

    /** Actual 6.4-metre canvas slab, including thickness. */
    readonly matBounds: Bounds;

    /** Dark lower slab, including its physical thickness. */
    readonly apronBounds: Bounds;

    /** Authored six-metre route area, distinct from the rope boundary. */
    readonly usableBounds: Bounds;

    /** Rope cylinder radius in metres. */
    readonly ropeRadius: number;

    /** Distance between post centre lines on either horizontal axis. */
    readonly ropeSpan: number;

    /** Four rope centre elevations above the canvas. */
    readonly ropeHeights: readonly [number, number, number, number];

    /** Post cylinder radius in metres. */
    readonly postRadius: number;

    /** Post extent from the canvas upwards. */
    readonly postHeight: number;

    /** Axis-aligned cushion width, height and depth. */
    readonly padSize: Point;

    /** Four ropes on each of four sides. */
    readonly ropes: readonly Rope[];

    /** Two assigned and two diagonally opposite neutral corners. */
    readonly corners: readonly Corner[];
  }

  /**
   * One caller-mounted subtree with shared geometries and materials.
   *
   * Disposal attempts removal and every resource once, even after a failure. If any attempt fails, it throws an AggregateError containing every original cause. Reentrant and later calls have no effects; layout remains readable.
   */
  export interface Result {
    /** Caller-mounted visible scenery. */
    readonly object: THREE.Group;

    /** Descriptor consumed to construct this exact subtree. */
    readonly layout: Layout;

    /** Retire all resources once; aggregate failures after every attempt. */
    readonly dispose: () => void;
  }

  /**
   * Resolve deep-frozen world-metre dimensions without creating scene resources.
   *
   * The 6.4-metre canvas, 6.2-metre rope span and six-metre route area serve different purposes.
   *
   * Dimensions cite https://glory.pinkyellow.network/assets/rules/glory-rules-2026-v2.pdf section 4.06. Colours, cushion size and holding points are authored choices; they do not establish athlete clearance.
   */
  export function layout(): Layout {
    const halfSpan: number = 3.1;
    const ropeRadius: number = 0.018;
    const postRadius: number = 0.065;
    const postHeight: number = 1.55;
    const padY: number = 0.95;
    const padSize: Point = Object.freeze([0.24, 1.2, 0.24]);
    const ropeHeights: readonly [number, number, number, number] = Object.freeze([0.4, 0.8, 1.2, 1.5]);
    const ropes: Rope[] = [];
    for (const axis of ["x", "z"] as const) for (const edge of [-halfSpan, halfSpan]) for (const height of ropeHeights) {
      const centre: Point = Object.freeze([axis === "x" ? 0 : edge, height, axis === "z" ? 0 : edge]);
      ropes.push(Object.freeze({ id: `rope:${axis}:${edge}:${height}`, axis, centre, bounds: Object.freeze({
        min: Object.freeze([axis === "x" ? -halfSpan : edge - ropeRadius, height - ropeRadius, axis === "z" ? -halfSpan : edge - ropeRadius]) as Point,
        max: Object.freeze([axis === "x" ? halfSpan : edge + ropeRadius, height + ropeRadius, axis === "z" ? halfSpan : edge + ropeRadius]) as Point,
      }) }));
    }

    const assignments: readonly (readonly [Corner["id"], Corner["role"], Corner["actorId"], number, number, number])[] = [
      ["red", "red", "a", 0xc72c3b, -1, 1],
      ["blue", "blue", "b", 0x159fc4, 1, -1],
      ["neutral-nw", "neutral", null, 0xf1f0e8, -1, -1],
      ["neutral-se", "neutral", null, 0xf1f0e8, 1, 1],
    ];
    const corners: readonly Corner[] = Object.freeze(assignments.map(([id, role, actorId, color, xSign, zSign]: (typeof assignments)[number]): Corner => {
      const padX: number = xSign * (halfSpan - postRadius);
      const padZ: number = zSign * (halfSpan - postRadius);
      return Object.freeze({ id, role, actorId, color,
        postCentre: Object.freeze([xSign * halfSpan, postHeight / 2, zSign * halfSpan]) as Point,
        padCentre: Object.freeze([padX, padY, padZ]) as Point,
        padBounds: Object.freeze({ min: Object.freeze([padX - padSize[0] / 2, padY - padSize[1] / 2, padZ - padSize[2] / 2]) as Point, max: Object.freeze([padX + padSize[0] / 2, padY + padSize[1] / 2, padZ + padSize[2] / 2]) as Point }),
        holdingPoint: Object.freeze([xSign * 2.65, 0, zSign * 2.65]) as Point,
      });
    }));
    return Object.freeze({ floorY: 0,
      matBounds: Object.freeze({ min: Object.freeze([-3.2, -0.15, -3.2]) as Point, max: Object.freeze([3.2, 0, 3.2]) as Point }),
      apronBounds: Object.freeze({ min: Object.freeze([-3.3, -0.4, -3.3]) as Point, max: Object.freeze([3.3, -0.15, 3.3]) as Point }),
      usableBounds: Object.freeze({ min: Object.freeze([-3, 0, -3]) as Point, max: Object.freeze([3, 0, 3]) as Point }),
      ropeRadius, ropeSpan: halfSpan * 2, ropeHeights, postRadius, postHeight, padSize,
      ropes: Object.freeze(ropes), corners,
    });
  }
}
