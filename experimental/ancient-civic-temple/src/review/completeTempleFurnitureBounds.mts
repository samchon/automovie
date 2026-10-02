import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
/** Resolve basin surfaces and furniture leg/brace placements.
 * Runs after all clause measurements so relative supports use their resolved
 * heights. Mutates only the caller's bound map; no source or filesystem IO. */
export function completeTempleFurnitureBounds(context: ITemplePartBoundsContext): void {
  const { parts, result, construction } = context;
  const circularWells = construction.match(/두 원형 홈은 중심 X=±([\d.]+)m·Z=0, 반지름 ([\d.]+)m/);
  const wellSurface = parts.find(({ noun }) => noun.includes("홈 바닥"));
  if (circularWells && wellSurface) {
    const radius = Number(circularWells[2]), centre = Number(circularWells[1]);
    result[wellSurface.key].X = [-centre - radius, centre + radius];
    result[wellSurface.key].Z = [-radius, radius];
  }
  const leg = parts.find(({ noun }) => noun === "다리");
  const brace = parts.find(({ noun }) => noun === "가로 지지재");
  const squareLeg = construction.match(/다리는 정방 ([\d.]+)m/);
  if (leg && brace && squareLeg && parts.length >= 3) {
    const top = result[parts[0].key], gauge = Number(squareLeg[1]);
    const deskSize = construction.match(/폭 ([\d.]+)m·깊이 ([\d.]+)m·높이 ([\d.]+)m/);
    const stoolSize = construction.match(/([\d.]+)×([\d.]+)m·두께 ([\d.]+)m/);
    if (deskSize) {
      const [w, d, h] = deskSize.slice(1).map(Number);
      const topGauge = Number(construction.match(/상판 두께 ([\d.]+)m/)?.[1]);
      if (Number.isFinite(topGauge)) {
        top.X = [-w / 2, w / 2]; top.Z = [-d / 2, d / 2]; top.Y = [h - topGauge, h];
      }
    } else if (stoolSize) {
      const [w, d, t] = stoolSize.slice(1).map(Number);
      const height = Number(construction.match(/윗면 높이 ([\d.]+)m/)?.[1]);
      if (Number.isFinite(height)) {
        top.X = [-w / 2, w / 2]; top.Z = [-d / 2, d / 2]; top.Y = [height - t, height];
      }
    }
    const fixed = construction.match(/\(X,Z\)=\(±([\d.]+)m,±([\d.]+)m\)/);
    const symbolicCentres = construction.match(/\(X,Z\)=\(±\(폭\/2−([\d.]+)m\), ±\(깊이\/2−([\d.]+)m\)\)/);
    const cx = fixed ? Number(fixed[1]) : symbolicCentres && top.X.length
      ? Math.max(...top.X) - Number(symbolicCentres[1]) : NaN;
    const cz = fixed ? Number(fixed[2]) : symbolicCentres && top.Z.length
      ? Math.max(...top.Z) - Number(symbolicCentres[2]) : NaN;
    if (Number.isFinite(cx) && Number.isFinite(cz) && top.Y.length) {
      result[leg.key].X = [-cx - gauge / 2, cx + gauge / 2];
      result[leg.key].Y = [0, Math.min(...top.Y)];
      result[leg.key].Z = [-cz - gauge / 2, cz + gauge / 2];
      const cross = Number(construction.match(/수평 (?:폭|두께)(?:은)? ([\d.]+)m/)?.[1]);
      const vertical = Number(construction.match(/연직 높이는? ([\d.]+)m/)?.[1]);
      const bottom = Number(construction.match(/아랫면(?:\*\*)?이 바닥 위(?: Y=)? ?([\d.]+)m/)?.[1]);
      if ([cross, vertical, bottom].every(Number.isFinite)) {
        result[brace.key].X = [-cx - cross / 2, cx + cross / 2];
        result[brace.key].Y = [bottom, bottom + vertical];
        result[brace.key].Z = [-cz - cross / 2, cz + cross / 2];
      }
    }
  }

}
