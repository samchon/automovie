import type { ITemplePartBound as PartBound } from "./ITemplePartBound.mjs";
import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
type Axis = "X" | "Y" | "Z";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { escape, mentions } = templeBoundSyntax;
import { modelParts } from "./modelParts.mjs";
import { readTemplePartClauseBounds } from "./readTemplePartClauseBounds.mjs";
import { extendTempleSweptClauseBounds } from "./extendTempleSweptClauseBounds.mjs";
import { completeTempleSupportedBounds } from "./completeTempleSupportedBounds.mjs";
import { completeTempleFurnitureBounds } from "./completeTempleFurnitureBounds.mjs";
import { completeTempleLandscapeBounds } from "./completeTempleLandscapeBounds.mjs";
import { completeTempleRoofAssemblyBounds } from "./completeTempleRoofAssemblyBounds.mjs";
/** Recover part construction bounds in authored clause order.
 * This owner resolves subjects, admits finite measurements and owns the mutable
 * state. Clause and sweep phases precede relative assembly completion; summary
 * claims are retained separately and never repair missing construction. */
export const partBounds = (body: string, width: number = NaN) => {
  const parts = modelParts(body);
    const result: Record<string, PartBound> = Object.fromEntries(
    parts.map(({ key }) => [
      key,
      {
        X: [],
        Y: [],
        Z: [],
        summary: { X: [], Y: [], Z: [] },
      },
    ]),
  );
    const explicitSeen: Record<string, Record<Axis, boolean>> = Object.fromEntries(parts.map(({ key }) => [key, { X: false, Y: false, Z: false }]));
  const prose = body.split(/^부재 대응:/m)[0].replace(
    /\[[^\]]+\]\([^)]*\)/g,
    "",
  );
  const origin = prose.search(/(?:로컬 )?원점은/);
  const construction = origin < 0 ? prose : prose.slice(origin);
  const names = parts.map(({ noun }) => escape(noun)).sort((a, b) => b.length - a.length).join(
    "|",
  );
  const partClause = names
    ? new RegExp(
        "(?:, |이고 )(?=(?:두 |네 )?(?:" + names + ")(?: [가-힣]+)?(?:은|는|의|가|이) )",
        "g",
      )
    : null;
  const sentences = construction.replace(/이고, (?=[가-힣]+(?:은|는) Z=)/g, "다. ")
    .replace(/이고, 그 위 /g, "다. 그 위 ")
    .replace(/이고 그 위 /g, "다. 그 위 ")
    .replace(/, 그 위 /g, "\n그 위 ")
    .replace(/, (?=`[^`]+`)/g, "\n")
    .replace(partClause ?? /(?!) /g, "\n")
    .split(/(?<=다\.)\s+|\n+/).filter(Boolean);
  const ground = /원점[^.\n]*(?:바닥|지면|아래면)/.test(construction);
  const backOrigin = /원점[^.\n]*뒷변/.test(construction) && /앞은[^.\n]*\+Z/.test(construction);
    const partDimensions: Record<string, Record<string, number>> = Object.fromEntries(parts.map(({ key }) => [key, {}]));
  const widthW = Number(prose.match(/(?:기본 폭 W|\bW)=([\d.]+)m/)?.[1]);
  const depthD = Number(prose.match(/\bD=([\d.]+)m/)?.[1]);
  const thickT = Number(prose.match(/\bT=([\d.]+)m/)?.[1]);
    const add = (part: string, axis: Axis, a: number, b: number) => {
    if (part && Number.isFinite(a) && Number.isFinite(b)) result[part][axis].push(
      a,
      b,
    );
  };
  const context: ITemplePartBoundsContext = { parts, result, explicitSeen, construction, ground, backOrigin, partDimensions, width, widthW, depthD, thickT, add };
  let previous = "";
  for (let sentence of sentences) {
    // A sentence comparing two faces is a claim about the shapes, not a
    // source of extra vertices. In particular a restated datum must not
    // repair a moved support, ash disc, or lamp stem.
    if (/사이는.*?(?:잇는다|연결|메운다)/.test(sentence)) {
      const start = sentence.search(/중심 \((?:X,Z|X,Y,Z)\)=/);
      if (start < 0) continue;
      sentence = sentence.slice(start);
    }
    if (/^\s*(?:윗면|아랫면) Y=.*?(?:닿|접촉)/.test(sentence) ||
      /사이의 .*?틈/.test(sentence) ||
      /뒷면.*벽과 (?:닿|[\d.]+m 떨어)/.test(sentence)) continue;
    const shape = sentence.replace(new RegExp("(?<=m)로 (?=(?:" + names + "))(?=[^\\n]*(?:닿|접촉))[^\\n]*$"), "")
      .replace(/윗끝 Y=.*?(?:받친|닿).*$/, "")
      .replace(/(?:라 |에 |와 |과 )?(?:닿|접촉|접해|받친|받치).*$/, "");
    if (!shape.trim()) continue;
    const firstGeometry = shape.search(
      /(?:[XYZ]=|반지름|지름|폭 |깊이 |높이 |두께 |중심)/,
    );
    const prefix = firstGeometry < 0 ? shape : shape.slice(0, firstGeometry);
    const named = parts.filter(({ key, noun }) => {
      const first = noun.split(" ")[0];
      const shortSubject = first !== noun && new RegExp("(?<![\\p{L}\\p{N}])" + escape(first) + "(?:은|는|이|가)", "u").test(prefix);
      return mentions(prefix, noun) || shortSubject || prefix.includes("`" + key + "`");
    });
    const afterCentre = shape.match(/중심 \(X,Z\).*?([가-힣]+) 두 개가/);
    const located = afterCentre && parts.find(({ noun }) => mentions(afterCentre[1], noun));
    const later = /^(?:[XYZ]=|반지름 |t=)/.test(shape) ?
      parts.map((p) => ({ ...p, at: shape.indexOf(p.noun) }))
        .filter((p) => p.at >= 0).sort((a, b) => a.at - b.at) : [];
    const explicit = parts.map((part) => ({ ...part,
      at: Math.max(prefix.lastIndexOf(part.noun + "은"), prefix.lastIndexOf(part.noun + "는")),
    })).filter(({ at }) => at >= 0).sort((a, b) => b.at - a.at)[0];
    const firstNamed = named.sort(
      (a, b) => prefix.indexOf(a.noun.split(" ")[0]) - prefix.indexOf(b.noun.split(" ")[0]),
    )[0];
    const subject = /끝의 점유 높이/.test(prefix) && previous ? previous :
      (located?.key ?? explicit?.key ?? firstNamed?.key ?? later[0]?.key ??
        (previous || parts[0]?.key));
    const preceding = previous;
    if (subject && firstGeometry >= 0) previous = subject;
    const part = subject || (/^중심선|^관의 바깥|^t=/.test(shape) ? previous : "");
    if (!part) continue;
    // The remaining shape readers below consume only the defining clause.
    sentence = shape;
    const measurements = readTemplePartClauseBounds({ context, part, sentence, preceding });
    extendTempleSweptClauseBounds({ context, part, sentence, measurements });
  }
  completeTempleSupportedBounds(context);
  completeTempleFurnitureBounds(context);
  completeTempleLandscapeBounds(context);
  completeTempleRoofAssemblyBounds(context);
  return result;
};
