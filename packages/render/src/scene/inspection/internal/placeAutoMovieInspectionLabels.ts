import type {
  IAutoMovieInspectionLabel,
  IAutoMovieInspectionLabelPlacement,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

/*
 * Place labels on a picture: project each labelled path's centre through the
 * camera into pixels and keep a label only where its box overlaps no label kept
 * before it.
 *
 * Each path is given as its world box, and its label reads the path's last
 * name, `(root)` for the empty path. A label's anchor is the pixel the centre
 * of its box projects to, with the top-left of the picture at (0, 0), x to the
 * right and y down, and its box is the box `AutoMovieRenderPicture.stampRasterLabel` stamps
 * at `scale` with its top-left corner on the anchor: `scale * (4 * length + 3)`
 * pixels wide and `9 * scale` high. Labels are taken in the order given; one
 * whose box overlaps a kept box, or whose anchor lies behind the camera or
 * outside the picture, is listed in `dropped` with its projected anchor
 * instead, so a reader knows it was asked for.
 *
 * The camera's world matrix and projection must be current.
 *
 * It throws for a size or scale that is not a positive integer.
 */
export function placeAutoMovieInspectionLabels(props: {
  /*
   * What to label: each path with its world box in metres.
   */
  boxes: readonly {
    path: string;
    min: IAutoMovieVector3;
    max: IAutoMovieVector3;
  }[];

  /*
   * The camera the picture is drawn through.
   */
  camera: THREE.Camera;

  /*
   * Picture width in pixels.
   */
  width: number;

  /*
   * Picture height in pixels.
   */
  height: number;

  /*
   * Size of one font pixel of the stamp, in picture pixels.
   */
  scale: number;
}): IAutoMovieInspectionLabelPlacement {
  for (const [name, value] of [
    ["width", props.width],
    ["height", props.height],
    ["scale", props.scale],
  ] as const)
    if (!(value > 0))
      throw new Error(`Label ${name} ${value} is not a positive integer`);

  const labels: IAutoMovieInspectionLabel[] = [];
  const dropped: IAutoMovieInspectionLabel[] = [];
  const boxes: [number, number, number, number][] = [];
  const point: THREE.Vector3 = new THREE.Vector3();
  for (const box of props.boxes) {
    point
      .set(
        (box.min.x + box.max.x) / 2,
        (box.min.y + box.max.y) / 2,
        (box.min.z + box.max.z) / 2,
      )
      .project(props.camera);
    const label: IAutoMovieInspectionLabel = {
      path: box.path,
      text: box.path.split("/").at(-1) || "(root)",
      x: Math.round(((point.x + 1) / 2) * props.width),
      y: Math.round(((1 - point.y) / 2) * props.height),
    };
    const area: [number, number, number, number] = [
      label.x,
      label.y,
      label.x + props.scale * (4 * label.text.length + 3),
      label.y + 9 * props.scale,
    ];
    const visible: boolean =
      point.z >= -1 &&
      point.z <= 1 &&
      label.x >= 0 &&
      label.x < props.width &&
      label.y >= 0 &&
      label.y < props.height;
    if (
      !visible ||
      boxes.some(
        (kept: [number, number, number, number]): boolean =>
          area[0] < kept[2] &&
          kept[0] < area[2] &&
          area[1] < kept[3] &&
          kept[1] < area[3],
      )
    ) {
      dropped.push(label);
      continue;
    }
    boxes.push(area);
    labels.push(label);
  }
  return { labels, dropped };
}
