import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
type Axis = "X" | "Y" | "Z";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { scalar, escape } = templeBoundSyntax;
/** Resolve supported stacks, basins, raised tops and shelf assemblies.
 * Runs after all clause measurements so relative supports use their resolved
 * heights. Mutates only the caller's bound map; no source or filesystem IO. */
export function completeTempleSupportedBounds(context: ITemplePartBoundsContext): void {
  const { parts, result, explicitSeen, construction, backOrigin } = context;
  // A vertical stack can name finer construction pieces than its surface
  // parts: the final mapped part owns the remaining neck, bell and top pieces.
  const componentLine = construction.split("\n")[0];
  const pieces = [...componentLine.matchAll(/([가-힣 ]+?)\(([^()]*)\)/g)].map((match) => ({
    label: match[1].trim(), description: match[2],
  }));
  if (pieces.length > parts.length && parts.length >= 2 &&
    pieces[0].label.endsWith(parts[0].noun) &&
    pieces[1].label.endsWith(parts[1].noun)) {
    let y = 0;
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i], key = parts[Math.min(i, parts.length - 1)].key;
      const square = piece.description.match(/정방 ([\d.]+)(?:×([\d.]+))?m/);
      const radii = [...piece.description.matchAll(/반지름 ([\d.]+)m?|([\d.]+)m→([\d.]+)m/g)]
        .flatMap((match) => match.slice(1).filter(Boolean).map(Number));
      const half = square ? Math.max(Number(square[1]), Number(square[2] ?? square[1])) / 2 :
        radii.length ? Math.max(...radii) : NaN;
      const stated = piece.description.match(/높이 ([\d.]+)m/);
      const shaft = construction.match(/몸통 높이는[^\n]*?뺀 ([\d.]+)m/);
      const height = stated ? Number(stated[1]) :
        i === 2 && shaft ? Number(shaft[1]) : NaN;
      if (!Number.isFinite(half) || !Number.isFinite(height)) break;
      const bounds = result[key];
      for (const axis of (["X", "Z"] as Axis[])) {
        const lo = Math.min(...bounds[axis], -half), hi = Math.max(...bounds[axis], half);
        bounds[axis] = [lo, hi];
      }
      const lo = bounds.Y.length ? Math.min(...bounds.Y, y) : y;
      const hi = bounds.Y.length ? Math.max(...bounds.Y, y + height) : y + height;
      bounds.Y = [lo, hi];
      y += height;
    }
  }
  const elevated = construction.match(/그 위 ([가-힣 ]+?)(?:은|는) 폭 ([\d.]+)m·깊이 ([\d.]+)m·높이 ([\d.]+)m/);
  if (elevated) {
    const index = parts.findIndex(({ noun }) => noun.startsWith(elevated[1].trim()));
    if (index > 0) {
      const key = parts[index].key, below = result[parts[index - 1].key].Y;
      if (below.length) {
        const y = Math.max(...below), height = Number(elevated[4]);
        result[key].Y = [y, y + height];
      }
    }
  }
  const topPiece = construction.match(/꼭대기에는 폭 ([\d.]+)m·깊이 ([\d.]+)m·높이 ([\d.]+)m의 ([가-힣]+)/);
  if (topPiece) {
    const index = parts.findIndex(({ noun }) => topPiece[4].startsWith(noun));
    if (index > 0) {
      const key = parts[index].key;
      const below = parts.slice(0, index).flatMap(({ key: lower }) => result[lower].Y);
      const [w, d, h] = topPiece.slice(1, 4).map(Number);
      result[key].X = [-w / 2, w / 2];
      if (!explicitSeen[key].Z) result[key].Z = backOrigin ? [0, d] : [-d / 2, d / 2];
      if (below.length) {
        const y = Math.max(...below);
        result[key].Y = [y, y + h];
      }
    }
  }
  const annularWall = construction.match(/그 위 ([가-힣 ]+?) 벽은 바깥 지름 ([\d.]+)m·두께 ([\d.]+)m의 원환 벽으로 바닥에서 ([\d.]+)m까지/);
  if (annularWall) {
    const ringPart = parts.find(({ noun }) => annularWall[1].includes(noun));
    const insidePart = parts.find(({ noun }) => noun === "안쪽 바닥");
    const outer = Number(annularWall[2]) / 2, inner = outer - Number(annularWall[3]);
    if (ringPart) {
      const support = result[parts[0].key].Y;
      result[ringPart.key].X = [-outer, outer];
      result[ringPart.key].Z = [-outer, outer];
      if (support.length) result[ringPart.key].Y = [Math.max(...support), Number(annularWall[4])];
    }
    if (insidePart) {
      result[insidePart.key].X = [-inner, inner];
      result[insidePart.key].Z = [-inner, inner];
    }
  }
  const ripple = construction.match(/중심선 반지름 ([\d.]+)m의 낮은 ([가-힣 ]+) 고리/);
  if (ripple) {
    const part = parts.find(({ noun }) => ripple[2].includes(noun));
    const cross = construction.match(/(?:수평 폭 ([\d.]+)m|\(r\/([\d.]+)m\)²)/);
    const surface = construction.match(/수면 Y=([\d.]+)m에서 시작해 꼭대기 Y=([\d.]+)m/);
    if (part && cross && surface) {
      const radius = Number(ripple[1]) + Number(cross[1] ?? cross[2]) / (cross[1] ? 2 : 1);
      result[part.key].X = [-radius, radius];
      result[part.key].Z = [-radius, radius];
      result[part.key].Y = [Number(surface[1]), Number(surface[2])];
    }
  }
  const risingCylinder = construction.match(/([가-힣 ]+?)은 반지름 ([\d.]+)m 원통으로 안쪽 바닥에서 물면 위 ([\d.]+)m까지/);
  if (risingCylinder) {
    const part = parts.find(({ noun }) => risingCylinder[1].includes(noun));
    const floor = parts.find(({ noun }) => noun === "안쪽 바닥");
    const water = parts.find(({ noun }) => noun === "물면");
    if (part && floor && water && result[floor.key].Y.length && result[water.key].Y.length) {
      const radius = Number(risingCylinder[2]);
      result[part.key].X = [-radius, radius];
      result[part.key].Z = [-radius, radius];
      result[part.key].Y = [Math.max(...result[floor.key].Y),
        Math.max(...result[water.key].Y) + Number(risingCylinder[3])];
    }
  }
  const jet = construction.match(/([가-힣 ]+?)는 노즐 윗면 Y=([\d.]+)m에서 시작해 물면 위 ([\d.]+)m까지 오르는 원뿔대\(아래 반지름 ([\d.]+)m, 위 ([\d.]+)m\)/);
  if (jet) {
    const part = parts.find(({ noun }) => jet[1].includes(noun));
    const water = parts.find(({ noun }) => noun === "물면");
    if (part && water && result[water.key].Y.length) {
      const radius = Math.max(Number(jet[4]), Number(jet[5]));
      result[part.key].X = [-radius, radius];
      result[part.key].Z = [-radius, radius];
      result[part.key].Y = [Number(jet[2]), Math.max(...result[water.key].Y) + Number(jet[3])];
    }
  }
  const raisedAssembly = construction.match(/윗면에서 높이 ([\d.]+)m, 폭 ([\d.]+)m, 깊이 ([\d.]+)m/);
  const topThickness = construction.match(/상판은 두께 ([\d.]+)m/);
  const overhang = construction.match(/받침보다 사방으로 ([\d.]+)m/);
  if (raisedAssembly && topThickness && overhang) {
    const basePart = parts[0], topPart = parts.find(({ noun }) => noun === "상판");
    const supportPart = parts.find(({ noun }) => noun === "받침");
    const baseHeight = construction.match(new RegExp(escape(basePart.noun) + "(?:은|는) 폭 [\\d.]+m·깊이 [\\d.]+m·높이 ([\\d.]+)m"));
    if (baseHeight && topPart && supportPart) {
      const base = Number(baseHeight[1]), assembly = Number(raisedAssembly[1]);
      const [w, d, t, lip] = [raisedAssembly[2], raisedAssembly[3], topThickness[1], overhang[1]].map(Number);
      const backward = Number(construction.match(/중앙에서 뒤로 ([\d.]+)m/)?.[1] ?? 0);
      result[basePart.key].Y = [0, base];
      result[topPart.key].X = [-w / 2, w / 2];
      result[topPart.key].Y = [base + assembly - t, base + assembly];
      result[topPart.key].Z = [-backward - d / 2, -backward + d / 2];
      result[supportPart.key].X = [-w / 2 + lip, w / 2 - lip];
      result[supportPart.key].Y = [base, base + assembly - t];
      result[supportPart.key].Z = [-backward - d / 2 + lip, -backward + d / 2 - lip];
    }
  }
  const shelfSize = construction.match(/폭 ([\d.]+)m·깊이 ([\d.]+)m·높이 ([\d.]+)m/);
  const sideGauge = construction.match(/측판(?:·위판·아래판)? 두께 ([\d.]+)m/);
  const shelfSides = parts.find(({ noun }) => noun.includes("측판"));
  const shelfBoards = parts.find(({ noun }) => noun.includes("판") && !noun.includes("측판"));
  if (shelfSize && sideGauge && shelfSides && shelfBoards) {
    const [w, d, h] = shelfSize.slice(1).map(Number), side = Number(sideGauge[1]);
    const innerHalf = w / 2 - side;
    result[shelfSides.key].X = [-w / 2, w / 2];
    result[shelfSides.key].Y = [0, h];
    result[shelfSides.key].Z = backOrigin ? [0, d] : [-d / 2, d / 2];
    result[shelfBoards.key].X = [-innerHalf, innerHalf];
    result[shelfBoards.key].Z = [...result[shelfSides.key].Z];
    const panelSource = construction.match(/(?:아래판은|선반 판 네 장의 아랫면은)([^\n]*?)(?:세 세로 칸막이|뒤판은|관리실 변형|$)/)?.[1] ?? "";
    const ranges = [...panelSource.matchAll(/Y=([\d.]+)~([\d.]+)m/g)]
      .flatMap((match) => [Number(match[1]), Number(match[2])]);
    const bottoms = [...panelSource.split("에 있어")[0].matchAll(/Y=([\d.]+)m/g)].map((match) => Number(match[1]));
    const boardGauge = Number(construction.match(/선반 판 두께 ([\d.]+)m|두께 ([\d.]+)m인 선반 판/)?.slice(1).find(Boolean));
    if (ranges.length) result[shelfBoards.key].Y = [Math.min(...ranges), Math.max(...ranges)];
    else if (bottoms.length && Number.isFinite(boardGauge))
      result[shelfBoards.key].Y = [Math.min(...bottoms), Math.max(...bottoms) + boardGauge];
    const dividers = parts.find(({ noun }) => noun.includes("칸막이"));
    const centres = construction.match(/칸막이의 중심 X는 ([+−-]?[\d.]+)m, ([+−-]?[\d.]+)m, \+([\d.]+)m/);
    if (dividers && centres && Number.isFinite(boardGauge)) {
      const x = centres.slice(1).map(scalar), half = boardGauge / 2;
      result[dividers.key].X = [Math.min(...x) - half, Math.max(...x) + half];
      result[dividers.key].Z = [...result[shelfSides.key].Z];
      const span = construction.match(/칸막이는[^\n]*?Y=([\d.]+)~[\d.]+m[^\n]*?([\d.]+)~([\d.]+)m마다/);
      if (span) result[dividers.key].Y = [Number(span[1]), Number(span[3])];
    }
  }

}
