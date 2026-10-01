import { explicitRangeRows } from "./explicitRangeRows.mjs";
/** Compare paragraph declarations with their one unambiguous occupancy box.
 * Box order is X/Y/Z while authored width/depth/height is X/Z/Y, all metres.
 * Components need containment; one whole-object declaration needs equality.
 * Shelf thickness is acquired once per H2 and supplied to each paragraph.
 * Ambiguous boxes produce no rows, preserving the existing census meaning. */
/** Check dimension declarations against the one unambiguous occupancy box of an H2. */
const declaredBoundRowsInParagraph = (id: string, body: string, sideThickness: number | null) => {
  const boxes = [...body.matchAll(/점유 상자는 (?:약 )?(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)×(\d+(?:\.\d+)?)m/g)];
  if (boxes.length !== 1) return [];
  const box = boxes[0].slice(1).map(Number);
  const rows = [];
  const dimensionsInParagraph = [...body.matchAll(/폭 (\d+(?:\.\d+)?)m·깊이 (\d+(?:\.\d+)?)m·높이 (\d+(?:\.\d+)?)m/g)];
  for (const match of dimensionsInParagraph) {
    const dimensions = match.slice(1).map(Number);
    const component = /(?:받침|몸체|꼭대기|석단)(?:은|는|에는)?[^.\n]*$/.test(body.slice(0, match.index));
    const exactWhole = dimensionsInParagraph.length === 1 && !component;
    rows.push({ id, kind: "width/depth/height", dimensions, box,
      pass: exactWhole
        ? Math.abs(dimensions[0] - box[0]) < 1e-6 &&
          Math.abs(dimensions[1] - box[2]) < 1e-6 && Math.abs(dimensions[2] - box[1]) < 1e-6
        : dimensions[0] <= box[0] + 1e-6 && dimensions[1] <= box[2] + 1e-6 && dimensions[2] <= box[1] + 1e-6 });
  }
  for (const match of body.matchAll(/지름 (\d+(?:\.\d+)?)m·높이 (\d+(?:\.\d+)?)m[^\n]{0,35}껍질/g)) {
    const diameter = Number(match[1]), height = Number(match[2]);
    rows.push({ id, kind: "diameter/height", dimensions: [diameter, height], box,
      pass: diameter <= box[0] + 1e-6 && diameter <= box[2] + 1e-6 &&
        Math.abs(height - box[1]) < 1e-6 });
  }
  const heights = [...body.matchAll(/(?:전체 높이|수관 꼭대기) (\d+(?:\.\d+)?)m/g)];
  for (const match of heights.slice(-1)) {
    const height = Number(match[1]);
    rows.push({ id, kind: "overall height", dimensions: [height], box,
      pass: Math.abs(height - box[1]) < 1e-6 });
  }
  for (const range of explicitRangeRows(id, body)) {
    const dimension = box[range.axis === "X" ? 0 : range.axis === "Y" ? 1 : 2];
    rows.push({ id, kind: `${range.axis} interval width`, dimensions: [Math.abs(range.to - range.from)], box,
      pass: Math.abs(range.to - range.from) <= dimension + 1e-6 });
  }
  const shelfInside = body.match(/측판[^\n]*?X=−(\d+(?:\.\d+)?)~\+(\d+(?:\.\d+)?)m/);
  if (shelfInside && sideThickness !== null) {
    const [, left, right] = shelfInside.map(Number);
    rows.push({ id, kind: "paired side panels and clear shelf", dimensions: [left, right, sideThickness], box,
      pass: Math.abs(left - right) < 1e-6 && Math.abs(left + right + 2 * sideThickness - box[0]) < 1e-6 });
  }
  return rows;
};

/** Compare each paragraph independently while sharing the H2's explicit panel
 * thickness. A box cannot migrate across paragraph boundaries; a missing
 * thickness prevents the paired-panel relation rather than inventing a value.
 */
export const declaredBoundRows = (id: string, body: string) => {
  const sideThickness = body.match(/측판 두께 (\d+(?:\.\d+)?)m/);
  return body.split(/\n\s*\n/).flatMap((paragraph) =>
    declaredBoundRowsInParagraph(id, paragraph, sideThickness ? Number(sideThickness[1]) : null));
};
