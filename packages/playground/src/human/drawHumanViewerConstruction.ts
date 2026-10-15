import type { IAutoMovieHumanConstructionNet } from "@automovie/human";
import * as THREE from "three";

/**
 * Draw the construction nets of a person's lofted parts as lines: every construction curve in its kind's colour and every control cage's edges and vertices in navy, in the model frame at rest.
 *
 * `occluded` decides whether the surface hides the lines behind it: on for an overlay on the opaque surface, off for a net seen through a ghosted body. The group owns its geometries and materials; dispose them with the group.
 *
 * @param props The nets and whether the surface occludes them
 * @returns A group of line objects, one per curve and two per cage
 *
 * @evidence contracts/common.md#principled-implementation Each polyline of the debug output becomes one line object with its kind's fixed colour, and each cage one segment set over its own vertex buffer; nothing is resampled.
 * @evidence contracts/common.md#clear-and-simple-design One function turns the package's typed nets into scene objects; the page owns when they are shown and how the body is drawn under them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The colours are a fixed legend shared with the capture's key, not tuned per person; depth testing follows the requested mode rather than a per-part exception.
 * @evidence contracts/common.md#meaningful-documentation States the colours, the frame, the occlusion choice and the ownership of the created resources.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the nets' points and edges; each curve's points are copied once into a typed buffer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call draws its nets; the page caches the group per person.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Geometries and materials belong to the returned group, and the page disposes them when it replaces or hides it.
 */
export function drawHumanViewerConstruction(props: {
  nets: IAutoMovieHumanConstructionNet[];
  occluded: boolean;
}): THREE.Group {
  const group: THREE.Group = new THREE.Group();
  group.name = "construction";
  const material = (color: number): THREE.LineBasicMaterial =>
    new THREE.LineBasicMaterial({
      color,
      depthTest: props.occluded,
      transparent: !props.occluded,
    });
  const materials: Map<string, THREE.LineBasicMaterial> = new Map();
  for (const net of props.nets) {
    for (const curve of net.curves) {
      const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(curve.points, 3),
      );
      if (!materials.has(curve.kind))
        materials.set(
          curve.kind,
          material(drawHumanViewerConstruction.COLORS[curve.kind]),
        );
      const line: THREE.Line = curve.closed
        ? new THREE.LineLoop(geometry, materials.get(curve.kind)!)
        : new THREE.Line(geometry, materials.get(curve.kind)!);
      line.renderOrder = 2;
      group.add(line);
    }
    const positions: THREE.Float32BufferAttribute =
      new THREE.Float32BufferAttribute(net.cage.positions, 3);
    const edges: THREE.BufferGeometry = new THREE.BufferGeometry();
    edges.setAttribute("position", positions);
    edges.setIndex(net.cage.edges);
    if (!materials.has("cage"))
      materials.set("cage", material(drawHumanViewerConstruction.COLORS.cage));
    const cage: THREE.LineSegments = new THREE.LineSegments(
      edges,
      materials.get("cage")!,
    );
    cage.renderOrder = 1;
    group.add(cage);
    const vertices: THREE.BufferGeometry = new THREE.BufferGeometry();
    vertices.setAttribute("position", positions);
    group.add(
      new THREE.Points(
        vertices,
        new THREE.PointsMaterial({
          color: drawHumanViewerConstruction.COLORS.cage,
          size: 3,
          sizeAttenuation: false,
          depthTest: props.occluded,
        }),
      ),
    );
  }
  return group;
}
/**
 * The legend of {@link drawHumanViewerConstruction}.
 *
 * @evidence contracts/common.md#principled-implementation The colour table is keyed by the package's closed curve kinds plus the cage, so a new kind without a colour does not compile.
 * @evidence contracts/common.md#clear-and-simple-design The legend lives beside the drawing that uses it, and the capture draws its key from the same table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The colours follow the scratch tooling the trunk's net was first judged with, so earlier captures read the same.
 * @evidence contracts/common.md#meaningful-documentation Names every entry's meaning in the key's label.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A constant table and a fixed key perform no computation of note.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A constant table coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A constant table of seven entries owns no resource.
 */
export namespace drawHumanViewerConstruction {
  /** What the legend names. */
  export type Entry = IAutoMovieHumanConstructionNet.Kind | "cage";

  /** Colour of each construction curve kind and of the cage. */
  export const COLORS: Record<Entry, number> = {
    station: 0xd62728,
    guide: 0x1f77b4,
    feature: 0x2ca02c,
    spine: 0x7f3fbf,
    ring: 0xff7f0e,
    curve: 0x8c564b,
    cage: 0x203050,
  };

  /** Label of each legend entry. */
  export const LABELS: Record<Entry, string> = {
    station: "station (section)",
    guide: "guide",
    feature: "feature curve",
    spine: "spine",
    ring: "junction ring",
    curve: "network curve",
    cage: "control cage",
  };

  /**
   * Draw the legend in the top-left corner of a 2D canvas.
   *
   * @param context The canvas to draw on
   */
  export const key = (context: CanvasRenderingContext2D): void => {
    const entries: Entry[] = Object.keys(COLORS) as Entry[];
    const line: number = 22;
    context.save();
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.fillRect(10, 10, 220, 16 + line * entries.length);
    context.font = "15px sans-serif";
    context.textBaseline = "middle";
    entries.forEach((entry: Entry, i: number): void => {
      const y: number = 18 + line * i + line / 2;
      context.fillStyle = `#${COLORS[entry].toString(16).padStart(6, "0")}`;
      context.fillRect(20, y - 3, 28, 6);
      context.fillStyle = "#222222";
      context.fillText(LABELS[entry], 58, y);
    });
    context.restore();
  };
}
