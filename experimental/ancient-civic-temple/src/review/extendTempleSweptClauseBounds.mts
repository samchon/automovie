import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
type Axis = "X" | "Y" | "Z";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { number, scalar } = templeBoundSyntax;
/** Extend the current part from profiles, tube sweeps and repeated sections.
 * Earlier clause widths and centres establish the frame used by these sweeps;
 * the phase mutates only the same parser-owned part/dimension state. */
export function extendTempleSweptClauseBounds(props: {
  context: ITemplePartBoundsContext; part: string; sentence: string;
  measurements: { widths: Record<string, number>; center: RegExpMatchArray | null };
}): void {
  const { context, part, sentence } = props;
  const { result, partDimensions, construction, widthW, depthD, thickT, add } = context;
  const { widths, center } = props.measurements;
  const bounds = result[part];
    const frustum = sentence.match(
      new RegExp(
        "(?:바닥 |아래 )?반지름 (" + number + ")m에서 (?:윗입 |위 )?반지름 (" + number + ")m까지 Y=(" + number + ")~(" + number + ")m",
      ),
    );
    if (frustum) {
      const [r0, r1, y0, y1] = frustum.slice(1).map(scalar);
      const radius = Math.max(r0, r1);
      add(part, "X", -radius, radius);
      add(part, "Z", -radius, radius);
      add(part, "Y", y0, y1);
    }
    const outerInner = sentence.match(
      new RegExp("외반지름 (" + number + ")m·내반지름 (" + number + ")m"),
    );
    if (outerInner && /YZ 평면/.test(sentence) && bounds.X.length) {
      const tube = (scalar(outerInner[1]) - scalar(outerInner[2])) / 2;
      const centers = [...bounds.X];
      add(part, "X", Math.min(...centers) - tube, Math.max(...centers) + tube);
    }
    const torus = sentence.match(
      /중심선 반지름[^\n]*?관 반지름[^\n]*?([\d.]+)m/,
    );
    if (torus) {
      const majors = [...torus[0].split("관 반지름")[0].split("중심 높이")[0]
        .matchAll(/([\d.]+)m/g)].map((match) => Number(match[1]));
      const radius = Math.max(...majors) + scalar(torus[1]);
      add(part, "X", -radius, radius);
      add(part, "Z", -radius, radius);
    }
    const centerTriple = sentence.match(/중심은 모두 \(0,([\d.]+),0\)m/);
    if (centerTriple) {
      const tube = construction.match(/관 반지름은 ([\d.]+)m/);
      if (tube) add(
        part,
        "Y",
        Number(centerTriple[1]) - Number(tube[1]),
        Number(centerTriple[1]) + Number(tube[1]),
      );
    }
    const tubeRadius = sentence.match(/관 반지름 (\d+(?:\.\d+)?)m/);
    const majorRadius = sentence.match(/중심선 반지름 (\d+(?:\.\d+)?)m/);
    if (tubeRadius) partDimensions[part]["관 반지름"] = scalar(tubeRadius[1]);
    if (tubeRadius && majorRadius && center?.[1] === "X,Y,Z" && /XY 평면/.test(construction)) {
      const centreX = result[part].X, centreY = result[part].Y;
      const sweep = scalar(tubeRadius[1]) + scalar(majorRadius[1]);
      if (centreX.length && centreY.length) {
        add(part, "X", Math.min(...centreX) - sweep, Math.max(...centreX) + sweep);
        add(part, "Y", Math.min(...centreY) - sweep, Math.max(...centreY) + sweep);
        add(part, "Z", -scalar(tubeRadius[1]), scalar(tubeRadius[1]));
      }
    }
    if (Number.isFinite(partDimensions[part]["관 반지름"]) && /(?:베지어|제어점)/.test(sentence)) {
      const controls = [...sentence.matchAll(/\((±?[\d.]+),([\d.]+),([\d.]+)\)m?/g)];
      if (controls.length >= 2) {
        const x = controls.flatMap((m) => m[1].startsWith("±")
          ? [-scalar(m[1].slice(1)), scalar(m[1].slice(1))] : [scalar(m[1])]);
        const y = controls.map((m) => scalar(m[2]));
        const z = controls.map((m) => scalar(m[3]));
        const r = partDimensions[part]["관 반지름"];
        add(part, "X", Math.min(...x) - r, Math.max(...x) + r);
        add(part, "Y", Math.min(...y) - r, Math.max(...y) + r);
        add(part, "Z", Math.min(...z) - r, Math.max(...z) + r);
      }
    }
    const centreHeight = sentence.match(/중심 Y=([\d.]+)m와 ([\d.]+)m/);
    if (centreHeight && widths.높이) {
      const half = widths.높이 / 2;
      add(part, "Y", scalar(centreHeight[1]) - half, scalar(centreHeight[2]) + half);
    }
    const axisCentre = sentence.match(new RegExp("중심(?:선)?(?:이|은)?[^\\n]*?([XZ])=±(" + number + ")m"));
    const directionalThickness = sentence.match(new RegExp("([XZ]) 방향 두께 (" + number + ")m"));
    if (axisCentre && directionalThickness && axisCentre[1] === directionalThickness[1]) {
      const centre = scalar(axisCentre[2]), half = scalar(directionalThickness[2]) / 2;
      add(part, (axisCentre[1] as Axis), -centre - half, centre + half);
    }
    const section = sentence.match(new RegExp("X·Z 각 (" + number + ")m 단면"));
    if (section) for (const axis of (["X", "Z"] as Axis[])) {
      const centers = [...bounds[axis]], half = scalar(section[1]) / 2;
      if (centers.length) add(
        part,
        axis,
        Math.min(...centers) - half,
        Math.max(...centers) + half,
      );
    }
    const faceRadii = [...sentence.matchAll(new RegExp("(?:아랫면|윗면) Y=(" + number + ")m에서 반지름 (" + number + ")m", "g"))];
    for (const [, y, r] of faceRadii) {
      add(part, "Y", scalar(y), scalar(y));
      add(part, "X", -scalar(r), scalar(r));
      add(part, "Z", -scalar(r), scalar(r));
    }
    if (Number.isFinite(widthW) && Number.isFinite(depthD) && Number.isFinite(thickT) &&
      /(?:아래 겹|위 겹|접힘 띠)/.test(sentence)) {
      add(part, "X", -widthW / 2, widthW / 2);
      add(part, "Y", 0, thickT);
      add(part, "Z", -depthD / 2, depthD / 2);
    }

}
