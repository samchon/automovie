import type { IAutoMovieHumanConstructionNet } from "@automovie/human";
import * as THREE from "three";

/**
 * Draw the construction nets of a person's lofted parts as lines: every construction curve in its explicit design role's colour when present, otherwise its existing kind's colour and every control cage's edges and vertices in navy, in the model frame at rest.
 *
 * `occluded` decides whether the surface hides the lines behind it: on for an overlay on the opaque surface, off for a net seen through a ghosted body. `showControls=false` omits cage edges and vertices while preserving every generated course. The group owns its geometries and materials; dispose them with the group.
 *
 * @param props The nets, surface occlusion, and optional cage visibility; hiding controls leaves the generated curves unchanged
 * @returns A group of line objects, one per curve and two per cage
 *
 * @evidence contracts/common.md#principled-implementation Each polyline becomes one line with a fixed role/kind colour, and each cage one segment set over its own vertex buffer; nothing is resampled.
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
  showControls?: boolean;
}): THREE.Group {
  const group: THREE.Group = new THREE.Group();
  group.name = "construction";
  const material: (color: number) => THREE.LineBasicMaterial = (
    color: number,
  ): THREE.LineBasicMaterial =>
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
      const entry: drawHumanViewerConstruction.Entry =
        curve.designRole === "section"
          ? "station"
          : curve.designRole === "guide"
            ? "guide"
            : curve.designRole === "feature"
              ? "feature"
              : curve.designRole === "engineering-closure" ||
                  curve.designRole === "atlas-boundary" ||
                  curve.designRole === "connection-rail"
                ? curve.designRole
                : curve.kind;
      if (!materials.has(entry))
        materials.set(
          entry,
          material(drawHumanViewerConstruction.COLORS[entry]),
        );
      const line: THREE.Line = curve.closed
        ? new THREE.LineLoop(geometry, materials.get(entry)!)
        : new THREE.Line(geometry, materials.get(entry)!);
      line.renderOrder = 2;
      line.name = curve.name;
      line.userData.designRole = curve.designRole ?? null;
      line.userData.designQualification = curve.designQualification ?? null;
      group.add(line);
    }
    if (props.showControls === false) continue;
    const positions: THREE.Float32BufferAttribute =
      new THREE.Float32BufferAttribute(net.cage.positions, 3);
    const edges: THREE.BufferGeometry = new THREE.BufferGeometry();
    edges.setAttribute("position", positions);
    edges.setIndex(net.cage.edges);
    const controlEntry: drawHumanViewerConstruction.Entry =
      net.cage.controlRole === "bezier-controls" ? "bezier-controls" : "cage";
    if (!materials.has(controlEntry))
      materials.set(
        controlEntry,
        material(drawHumanViewerConstruction.COLORS[controlEntry]),
      );
    const cage: THREE.LineSegments = new THREE.LineSegments(
      edges,
      materials.get(controlEntry)!,
    );
    cage.renderOrder = 1;
    cage.name = "control-polygon";
    cage.userData.controlRole = net.cage.controlRole ?? null;
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
  export type Entry =
    | IAutoMovieHumanConstructionNet.Kind
    | "cage"
    | "bezier-controls"
    | "engineering-closure"
    | "atlas-boundary"
    | "connection-rail";

  /** Colour of each construction curve kind and of the cage. */
  export const COLORS: Record<Entry, number> = {
    station: 0xd62728,
    guide: 0x1f77b4,
    feature: 0x2ca02c,
    spine: 0x7f3fbf,
    ring: 0xff7f0e,
    curve: 0x8c564b,
    relief: 0xe377c2,
    cage: 0x203050,
    "bezier-controls": 0x203050,
    "engineering-closure": 0x808080,
    "atlas-boundary": 0x9467bd,
    "connection-rail": 0x17becf,
  };

  /** Label of each legend entry. */
  export const LABELS: Record<Entry, string> = {
    station: "station (section)",
    guide: "guide",
    feature: "feature curve",
    spine: "spine",
    ring: "junction ring",
    curve: "network curve",
    relief: "relief (centre, half-height border)",
    cage: "control cage",
    "bezier-controls": "Bezier control polygon",
    "engineering-closure": "engineering closure (not exterior)",
    "atlas-boundary": "atlas boundary",
    "connection-rail": "connection rail",
  };

  /** Korean labels of the separate design view; historical skin-capture keys retain their original labels. */
  const designLabels: Record<Entry, string> = {
    ...LABELS,
    station: "단면 관찰선",
    guide: "생성 가이드",
    feature: "형상 관찰선",
    curve: "설계 곡선",
    "bezier-controls": "베이지어 제어다각형",
    "engineering-closure": "내부 연결 구성선 (외피 아님)",
    "atlas-boundary": "차트 경계 (피부 주름 아님)",
    "connection-rail": "연결 레일",
  };

  /**
   * Draw the legend in the top-left corner of a 2D canvas.
   *
   * @param context The canvas to draw on
   * @param design Whether to use the Korean curve-design key
   * @param controls Whether control edges and vertices are actually displayed
   */
  export const key: (
    context: CanvasRenderingContext2D,
    design?: boolean,
    controls?: boolean,
  ) => void = (
    context: CanvasRenderingContext2D,
    design: boolean = false,
    controls: boolean = true,
  ): void => {
    const entries: Entry[] = (
      design
        ? ([
            "station",
            "guide",
            "feature",
            "curve",
            "bezier-controls",
            "engineering-closure",
            "atlas-boundary",
            "connection-rail",
          ] as Entry[])
        : ([
            "station",
            "guide",
            "feature",
            "spine",
            "ring",
            "curve",
            "relief",
            "cage",
          ] as Entry[])
    ).filter(
      (entry: Entry): boolean =>
        controls || (entry !== "cage" && entry !== "bezier-controls"),
    );
    const line: number = 22;
    context.save();
    context.fillStyle = "rgba(255, 255, 255, 0.9)";
    context.fillRect(10, 10, 350, 16 + line * entries.length);
    context.font = "15px sans-serif";
    context.textBaseline = "middle";
    entries.forEach((entry: Entry, i: number): void => {
      const y: number = 18 + line * i + line / 2;
      context.fillStyle = `#${COLORS[entry].toString(16).padStart(6, "0")}`;
      context.fillRect(20, y - 3, 28, 6);
      context.fillStyle = "#222222";
      context.fillText(design ? designLabels[entry] : LABELS[entry], 58, y);
    });
    context.restore();
  };
}
