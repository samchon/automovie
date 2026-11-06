import * as THREE from "three";

import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import { HumanDebugViewCurves } from "../compare/HumanDebugViewCurves";
import { HumanDebugPattern } from "../contracts/HumanDebugPattern";
import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";

/** Curve id namespace a pattern may leave out. */
const PREFIX: string = "human.construction.";

/** Vertices round each tube point. */
const SIDES: number = 8;

/**
 * Default colour of each curve kind, `rrggbb`: the sRGB of the generator's linear construction
 * colours (sections 0.1, 0.35, 0.9; axes 0.9, 0.15, 0.1; guides 0.1, 0.6, 0.25), and purple for
 * other paths such as webs.
 */
const COLOURS: Readonly<Record<IHumanDebugOptions.CurveKind, string>> = {
  section: "59a0f4",
  axis: "f36c59",
  guide: "59cb89",
  path: "a05cd6",
};

/**
 * Generating curves drawn as tubes, each with its own visibility, radius and colour.
 *
 * WebGL draws lines one pixel wide whatever their width, so a curve that must read thick is a tube:
 * a ring of eight vertices round every supplied point in the plane normal to the local tangent,
 * the ring frame carried from point to point by projecting the previous normal onto the new plane
 * so the tube does not twist. The tube passes through the supplied points exactly; nothing is
 * refitted. A tube is built on first show and rebuilt only when its radius changes. Curves are
 * unlit so the light never washes them out; chain axes, which lie inside the body, and every curve
 * under `xray` draw through the surface. A curve's own colour, when its document gives one, stands
 * over its kind's, and a compared part's curve (`HumanDebugViewCurves`) shows only while `part`
 * names its part and `views` its view (`axis` its axis).
 *
 * Through-surface tubes keep opacity 1 but enter Three.js's transparent list, after ordinary
 * surfaces and reference clay. Opaque and transparent lists sort independently, so renderOrder
 * alone cannot place an opaque tube above a transparent reference:
 * https://threejs.org/docs/pages/Object3D.html#renderOrder.
 *
 * @evidence contracts/common.md#principled-implementation Parallel-transports eight-vertex tube rings through admitted finite metre points without refitting the centreline. Through-surface tubes use the transparent list at full opacity with depth testing/writes disabled; the Human scene's surface groups share groupOrder 0 and default renderOrder 0, below the tubes' 10.
 * @evidence contracts/common.md#clear-and-simple-design Keeps curve selection, tube ownership and through-surface material state in the existing Human debug display owner; the generic renderer keeps its ordinary Three.js pass ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No reference opacity, source geometry, renderer method or selector is replaced. The same policy applies to source curves, ordinary construction and always-visible axes.
 * @evidence contracts/common.md#meaningful-documentation Gives metre input, millimetre radius conversion, centreline preservation, lazy geometry rebuild and the separate transparent-list ordering premise.
 * @evidence contracts/performance.md#efficient-algorithms Apply scans C curves and builds eight-vertex rings only for newly visible or resized point sequences; changing through-surface state adds fixed material writes and marks that material for a program update only when its queue changes. Actual drawing still follows selected geometry and overdraw.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing holders and tube geometry survive visibility, colour and xray changes when radius is equal; unchanged transparent state adds no material-version update, while Three.js owns program reuse for all renderer inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one material/holder per supplied curve and one geometry per constructed tube; replacement disposes the previous geometry, and dispose releases all geometry/materials and detaches the group. GPU release is not established by CPU disposal alone.
 */
export class HumanDebugCurves {
  /** Root of every tube. */
  public readonly object: THREE.Group = new THREE.Group();

  /** Tubes by curve id. */
  private readonly tubes: Map<
    string,
    {
      curve: IHumanDebugDocument.ICurve;
      kind: IHumanDebugOptions.CurveKind;
      mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
      radius: number;
    }
  > = new Map();

  /**
   * Create one hidden tube holder per curve.
   *
   * @param curves Curves in metres, ids unique.
   */
  public constructor(curves: readonly IHumanDebugDocument.ICurve[]) {
    for (const curve of curves) {
      const mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshBasicMaterial(),
      );
      mesh.name = curve.id;
      mesh.visible = false;
      this.object.add(mesh);
      this.tubes.set(curve.id, { curve, kind: HumanDebugOptions.kind(curve.id), mesh, radius: 0 });
    }
  }

  /**
   * Show, size and colour every curve as the options say.
   *
   * @param options Frame options; the curve fields are read.
   * @returns Ids of the curves now shown.
   *
   * @evidence contracts/common.md#principled-implementation Applies the existing view/kind/glob admission, millimetre radius and colour rules. xray curves and axes join the transparent list at opacity 1/order 10, without depth testing/writes; ordinary curves return to the opaque depth-tested list/order 5.
   * @evidence contracts/common.md#clear-and-simple-design The existing through predicate controls queue, depth and ordering together; no second draw, new overlay scene or reference-specific branch is needed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not lower reference opacity or alter curve points to reveal an occluded curve; hidden selections stay hidden and axes retain their existing always-through contract.
   * @evidence contracts/common.md#meaningful-documentation States the displayed-id return, selected option scope and why queue admission is required in addition to renderOrder.
   * @evidence contracts/performance.md#efficient-algorithms Scans the curve map once; geometry work is linear in the points of radius-changed tubes. Only a change of transparent state requests a material-program update; actual compilation/reuse belongs to Three.js.
   * @evidence contracts/performance.md#reuse-equivalent-work Retains matching-radius geometry and existing material identity across xray toggles and display changes; a queue transition increments only that material's version for the renderer to resolve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates the returned shown-id list and any required replacement geometry, retiring the previous geometry immediately; retained tubes remain owned by this display instance until dispose.
   */
  public apply(options: IHumanDebugOptions): string[] {
    const shown: string[] = [];
    for (const [id, tube] of this.tubes) {
      const view: ReturnType<typeof HumanDebugViewCurves.view> = HumanDebugViewCurves.view(id);
      tube.mesh.visible =
        (view === null ||
          (HumanDebugPattern.matches(view.part, options.part, "") &&
            (view.view === "axis" ? options.axis : options.views.includes(view.view)))) &&
        options.kinds.includes(tube.kind) &&
        HumanDebugPattern.matches(id, options.curves, PREFIX) &&
        !HumanDebugPattern.matches(id, options.curveHide, PREFIX);
      if (!tube.mesh.visible) continue;
      shown.push(id);
      const radius: number = (HumanDebugPattern.last(id, options.thick, PREFIX)?.radius ?? options.curveWidth) / 1000;
      if (radius !== tube.radius) {
        tube.mesh.geometry.dispose();
        tube.mesh.geometry = tubeGeometry(tube.curve.points, tube.curve.closed, radius);
        tube.radius = radius;
      }
      tube.mesh.material.color.set(
        "#" + (HumanDebugPattern.last(id, options.curveColor, PREFIX)?.colour ?? tube.curve.colour ?? COLOURS[tube.kind]),
      );
      const through: boolean = options.xray || tube.kind === "axis";

      // Transparent surfaces draw after every opaque tube, regardless of renderOrder.
      // Keep through-surface tubes fully opaque within that later list instead.
      if (tube.mesh.material.transparent !== through) {
        tube.mesh.material.transparent = through;
        tube.mesh.material.needsUpdate = true;
      }
      tube.mesh.material.depthTest = !through;
      tube.mesh.material.depthWrite = !through;
      tube.mesh.renderOrder = through ? 10 : 5;
    }
    return shown;
  }

  /**
   * Label anchors of the shown curves the options label: the middle point of each, and every
   * compared curve's own label (`HumanDebugViewCurves.label`) while `viewLabels` holds.
   *
   * @param options Frame options; `labels`, `viewLabels`, `thick` and `curveColor` are read.
   * @returns Id without its namespace, anchor in metres and CSS colour.
   */
  public labels(options: IHumanDebugOptions): { id: string; at: THREE.Vector3; colour: string }[] {
    const out: { id: string; at: THREE.Vector3; colour: string }[] = [];
    for (const [id, tube] of this.tubes) {
      if (!tube.mesh.visible) continue;

      // A compared part's curve carries its part and view, at the place its view names.
      const compared: { text: string; index: number } | null = HumanDebugViewCurves.label(id, tube.curve.points.length);
      if (compared !== null || HumanDebugViewCurves.view(id) !== null) {
        if (compared !== null && options.viewLabels)
          out.push({ id: compared.text, at: new THREE.Vector3(...tube.curve.points[compared.index]!), colour: "#" + tube.mesh.material.color.getHexString() });
        continue;
      }
      if (options.labels === "0") continue;
      if (
        options.labels === "marked" &&
        HumanDebugPattern.last(id, options.thick, PREFIX) === undefined &&
        HumanDebugPattern.last(id, options.curveColor, PREFIX) === undefined
      )
        continue;
      const point: IHumanDebugDocument.Point = tube.curve.points[Math.floor(tube.curve.points.length / 2)]!;
      out.push({
        id: id.slice(PREFIX.length),
        at: new THREE.Vector3(...point),
        colour: "#" + tube.mesh.material.color.getHexString(),
      });
    }
    return out;
  }

  /** Bounds of the shown curves in metres; empty when none is shown. */
  public bounds(): THREE.Box3 {
    const box: THREE.Box3 = new THREE.Box3();
    for (const tube of this.tubes.values())
      if (tube.mesh.visible) for (const p of tube.curve.points) box.expandByPoint(new THREE.Vector3(...p));
    return box;
  }

  /** Release every tube geometry and material. */
  public dispose(): void {
    for (const tube of this.tubes.values()) {
      tube.mesh.geometry.dispose();
      tube.mesh.material.dispose();
    }
    this.object.removeFromParent();
  }
}

/**
 * A tube along supplied points with radial normals.
 *
 * @param points Curve points in metres, at least two.
 * @param closed Whether the last point joins the first.
 * @param radius Tube radius in metres.
 */
function tubeGeometry(points: readonly IHumanDebugDocument.Point[], closed: boolean, radius: number): THREE.BufferGeometry {
  const n: number = points.length;
  const at: (i: number) => THREE.Vector3 = (i: number): THREE.Vector3 =>
    new THREE.Vector3(...points[closed ? (i + n) % n : Math.min(n - 1, Math.max(0, i))]!);

  // Central-difference tangents; open ends take one-sided differences.
  const tangent: (i: number) => THREE.Vector3 = (i: number): THREE.Vector3 => {
    const t: THREE.Vector3 = at(i + 1).sub(at(i - 1));
    return t.lengthSq() > 0 ? t.normalize() : new THREE.Vector3(1, 0, 0);
  };
  const first: THREE.Vector3 = tangent(0);
  let normal: THREE.Vector3 = new THREE.Vector3()
    .crossVectors(first, Math.abs(first.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0))
    .normalize();
  const positions: number[] = [];
  const normals: number[] = [];
  for (let i: number = 0; i < n; ++i) {
    const t: THREE.Vector3 = tangent(i);
    const projected: THREE.Vector3 = normal.clone().addScaledVector(t, -normal.dot(t));
    if (projected.lengthSq() > 1e-18) normal = projected.normalize();
    const binormal: THREE.Vector3 = new THREE.Vector3().crossVectors(t, normal);
    for (let k: number = 0; k < SIDES; ++k) {
      const angle: number = (2 * Math.PI * k) / SIDES;
      const radial: THREE.Vector3 = normal.clone().multiplyScalar(Math.cos(angle)).addScaledVector(binormal, Math.sin(angle));
      const p: THREE.Vector3 = at(i).addScaledVector(radial, radius);
      positions.push(p.x, p.y, p.z);
      normals.push(radial.x, radial.y, radial.z);
    }
  }
  const indices: number[] = [];
  for (let i: number = 0; i < (closed ? n : n - 1); ++i) {
    const j: number = (i + 1) % n;
    for (let k: number = 0; k < SIDES; ++k) {
      const l: number = (k + 1) % SIDES;
      indices.push(i * SIDES + k, j * SIDES + k, i * SIDES + l, i * SIDES + l, j * SIDES + k, j * SIDES + l);
    }
  }
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}
