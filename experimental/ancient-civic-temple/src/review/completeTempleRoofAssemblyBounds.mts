import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { near } = templeBoundSyntax;
/** Resolve truss cut-prism endpoints and wall/roof/recess envelopes.
 * Runs after all clause measurements so relative supports use their resolved
 * heights. Mutates only the caller's bound map; no source or filesystem IO. */
export function completeTempleRoofAssemblyBounds(context: ITemplePartBoundsContext): void {
  const { parts, result, construction } = context;
  // A pitched truss is a set of cut prisms. Resolve the named endpoints and
  // section sizes before considering the overall box: the box is only a claim.
  const tie = parts.find(({ noun }) => noun === "평보");
  const principal = parts.find(({ noun }) => noun === "경사재");
  const king = parts.find(({ noun }) => noun === "가운데 기둥");
  const strut = parts.find(({ noun }) => noun === "버팀재");
  if (tie && principal && king && strut) {
    const tieSize = construction.match(/평보는 길이 ([\d.]+)m[^\n]*?단면 ([\d.]+)×([\d.]+)m이며 아랫면 Y=([\d.]+)m, 윗면 ([\d.]+)m/);
    const pitch = construction.match(/두 경사재는 단면 ([\d.]+)×([\d.]+)m[^\n]*?X=±([\d.]+)m/);
    const kingSize = construction.match(/가운데 기둥\(([\d.]+)×([\d.]+)m\)/);
    const strutSize = construction.match(/두 버팀재\(([\d.]+)×([\d.]+)m\)/);
    const strutEnd = construction.match(/X=±([\d.]+)m·Y=([\d.]+)m이며[^\n]*?X=±([\d.]+)m[^\n]*?Y≈([\d.]+)m/);
    const roofFormula = construction.match(/Yprincipal\(\|X\|\)=([\d.]+)\+\(([\d.]+)−\|X\|\)tan\(([\d.]+)°\)−([\d.]+)\/cos\(([\d.]+)°\)/);
    const crownHeight = roofFormula ? Number(roofFormula[1]) + Number(roofFormula[2]) *
      Math.tan(Number(roofFormula[3]) * Math.PI / 180) - Number(roofFormula[4]) /
      Math.cos(Number(roofFormula[5]) * Math.PI / 180) - Number(pitch?.[2] ?? 0) /
      Math.cos(Number(roofFormula[3]) * Math.PI / 180) : NaN;
    if (tieSize) {
      const [length, gauge, height, bottom, top] = tieSize.slice(1).map(Number);
      result[tie.key] = { X: [-length / 2, length / 2], Y: [bottom, top], Z: [-gauge / 2, gauge / 2], summary: result[tie.key].summary };
      if (!near(top - bottom, height)) result[tie.key].Y.push(bottom + height);
    }
    if (pitch && tieSize && Number.isFinite(crownHeight) && roofFormula) {
      const [gauge, depth, endX] = pitch.slice(1).map(Number);
      const base = Number(tieSize[5]), apex = crownHeight;
      result[principal.key] = { X: [-endX, endX], Y: [base, apex + depth / Math.cos(Number(roofFormula[3]) * Math.PI / 180)],
        Z: [-gauge / 2, gauge / 2], summary: result[principal.key].summary };
    }
    if (kingSize && tieSize && Number.isFinite(crownHeight)) {
      const [gauge, depth] = kingSize.slice(1).map(Number);
      result[king.key] = { X: [-gauge / 2, gauge / 2], Y: [Number(tieSize[5]), crownHeight],
        Z: [-depth / 2, depth / 2], summary: result[king.key].summary };
    }
    if (strutSize && strutEnd) {
      const [gauge, depth] = strutSize.slice(1).map(Number);
      const [inner, bottom, outer, top] = strutEnd.slice(1).map(Number);
      result[strut.key] = { X: [-outer - gauge / 2, outer + gauge / 2], Y: [bottom - gauge / 2, top + gauge / 2],
        Z: [-depth / 2, depth / 2], summary: result[strut.key].summary };
      if (inner <= 0) result[strut.key].X = [];
    }
  }
  const houseWall = parts.find(({ noun }) => noun === "벽");
  const housePlinth = parts.find(({ noun }) => noun === "기단 띠");
  const houseRoof = parts.find(({ noun }) => noun === "지붕");
  const houseRecess = parts.find(({ noun }) => noun === "문·창 자리");
  if (houseWall && housePlinth && houseRoof && houseRecess) {
    const footprint = construction.match(/벽 바닥(?:은|이) X=±([\d.]+)m·Z=±([\d.]+)m/);
    const lip = construction.match(/(?:벽 밖으로|네 변에) ([\d.]+)m (?:나오며|처마)/);
    const plinthHeight = construction.match(/바닥에서 ([\d.]+)m 높이의 기단 띠/);
    const slab = construction.match(/(?:slab 두께는 연직|연직) ([\d.]+)m/);
    const roofTop = construction.match(/중심에서[^\n]*?=([\d.]+)m|뒤 처마 끝 Z=[^\n]*?는 ([\d.]+)m/);
    const eave = construction.match(/(?:처마 끝 Z=±[\d.]+m에서 Y=|앞 처마 끝 Z=\+[\d.]+m는 )([\d.]+)m/);
    const wallTop = construction.match(/중심 높이[^=]*=([\d.]+)m|뒤벽은 Y=([\d.]+)m/);
    const windows = construction.match(/(?:두 창은|네 창은) X=±([\d.]+)m[^\n]*?하단 Y=([\d.]+)m[^\n]*?각 ([\d.]+)×([\d.]+)m/);
    const depth = construction.match(/앞면에서 안쪽으로 ([\d.]+)m/);
    if (footprint && lip && plinthHeight && slab && roofTop && eave) {
      const [hx, hz, overhang, plinthH, thickness, top, bottom] =
        [footprint[1], footprint[2], lip[1], plinthHeight[1], slab[1], roofTop[1] ?? roofTop[2], eave[1]].map(Number);
      result[houseWall.key].X = [-hx, hx];
      result[houseWall.key].Y = [0, Number(wallTop?.[1] ?? wallTop?.[2])];
      result[houseWall.key].Z = [-hz, hz];
      result[housePlinth.key].X = [-hx, hx];
      result[housePlinth.key].Y = [0, plinthH];
      result[housePlinth.key].Z = [-hz, hz];
      result[houseRoof.key].X = [-hx - overhang, hx + overhang];
      result[houseRoof.key].Y = [bottom - thickness, top];
      result[houseRoof.key].Z = [-hz - overhang, hz + overhang];
      if (windows && depth) {
        const [cx, sill, w, h, inset] = [windows[1], windows[2], windows[3], windows[4], depth[1]].map(Number);
        const extraSill = construction.match(/하단 Y=[\d.]+m·([\d.]+)m의 모든 조합/);
        result[houseRecess.key].X = [-cx - w / 2, cx + w / 2];
        result[houseRecess.key].Y = [0, Math.max(sill, Number(extraSill?.[1] ?? sill)) + h];
        result[houseRecess.key].Z = [hz - inset, hz];
      }
    }
  }

}
