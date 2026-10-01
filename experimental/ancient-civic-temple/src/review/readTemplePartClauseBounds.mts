import type { ITemplePartBoundsContext } from "./ITemplePartBoundsContext.mjs";
type Axis = "X" | "Y" | "Z";
import { templeBoundSyntax } from "./templeBoundSyntax.mjs";
const { number, scalar, near, escape, mentions, expression } = templeBoundSyntax;
/** Read explicit axes, dimensions, centres and primitive extents of one clause.
 * Called after subject resolution, before swept constructions and assembly
 * completion. Writes only the caller-owned mapped part and dimension state;
 * returns centre and widths for the immediately following sweep phase. */
export function readTemplePartClauseBounds(props: {
  context: ITemplePartBoundsContext; part: string; sentence: string; preceding: string;
}) {
  const { context, part, sentence, preceding } = props;
  const { parts, result, explicitSeen, construction, ground, backOrigin, partDimensions, width, widthW, add } = context;
  const bounds = result[part];
    for (const match of sentence.matchAll(
      new RegExp("([XYZ])=(" + number + ")~(" + number + ")m", "g"),
    )) {
      const axis = (match[1] as Axis), a = scalar(
        match[2],
      ), b = scalar(match[3]);
      const noun = parts.find(({ key }) => key === part)?.noun ?? "";
      if ((new RegExp("^(?:두 )?" + escape(noun) + "(?:은|는) " + axis + "=" + number + "~" + number + "m다\\.$").test(sentence) &&
        bounds[axis].length && !near(Math.min(...bounds[axis]), Math.max(...bounds[axis])))
        || (axis === "Y" && /중심선은/.test(construction.slice(construction.indexOf(sentence) + sentence.length)) &&
          mentions(sentence, noun) && /(?:각재|이어지고)/.test(sentence)))
        bounds.summary[axis].push([Math.min(a, b), Math.max(a, b)]);
      else {
        if (!explicitSeen[part][axis]) bounds[axis] = [];
        explicitSeen[part][axis] = true;
        add(part, axis, a, b);
      }
    }
    for (const match of sentence.matchAll(
      new RegExp("([XYZ]) 범위는 (" + number + ")~(" + number + ")m", "g"),
    ))
      add(part, (match[1] as Axis), scalar(match[2]), scalar(match[3]));
    for (const match of sentence.matchAll(
      new RegExp("([XYZ])=(" + number + ")m", "g"),
    ))
      if (!new RegExp(match[1] + "=" + match[2] + "~").test(sentence))
        add(part, (match[1] as Axis), scalar(match[2]), scalar(match[2]));
    const widths: Record<string, number> = Object.fromEntries([...sentence.matchAll(new RegExp(
      "(폭|깊이|높이|두께|연직 두께) (" + number + ")m", "g",
    ))].reverse().map((match) => [match[1], scalar(match[2])]));
    Object.assign(partDimensions[part], widths);
    const rectangle = sentence.match(
      new RegExp("(" + number + ")×(" + number + ")m·두께 (" + number + ")m"),
    );
    if (rectangle) {
      const [x, z, thickness] = rectangle.slice(1).map(scalar);
      add(part, "X", -x / 2, x / 2);
      add(part, "Z", -z / 2, z / 2);
      widths.두께 = thickness;
    }
    const stackedHeights = [...sentence.matchAll(new RegExp("높이 (" + number + ")m", "g"))].map((m) => scalar(m[1]));
    if (/그 위/.test(sentence) && stackedHeights.length === 2 && ground)
      add(part, "Y", 0, stackedHeights[0] + stackedHeights[1]);
    const plate = sentence.match(new RegExp("(" + number + ")×(" + number + ")m·두께"));
    if (plate && !rectangle) {
      add(part, "X", -scalar(plate[1]) / 2, scalar(plate[1]) / 2);
      add(part, "Z", -scalar(plate[2]) / 2, scalar(plate[2]) / 2);
    }
    const center = sentence.match(
      /중심(?:은|\s*)\s*\((X,Y,Z|X,Z)\)=\(([^)]+)\)m/,
    );
    if (center) {
      const labels = (center[1].split(
        ",",
      ) as Axis[]), entries = center[2].split(",");
      if (labels.length === entries.length) labels.forEach((axis, i) => {
        const entry = entries[i], v = scalar(entry.replace("±", ""));
        add(part, axis, entry.startsWith("±") ? -v : v, v);
      });
    }
    const symbolic = sentence.match(/X=±\((W\/2[+−-]\d+(?:\.\d+)?)\)m/);
    if (symbolic) {
      const x = expression(symbolic[1], width);
      add(part, "X", -x, x);
    }
    const simpleX = sentence.match(new RegExp("X=±(" + number + ")m"));
    if (simpleX) add(part, "X", -scalar(simpleX[1]), scalar(simpleX[1]));
    const seriesX = sentence.match(
      new RegExp("X=(" + number + ")m, 0, \\+(" + number + ")m"),
    );
    if (seriesX) add(part, "X", scalar(seriesX[1]), scalar(seriesX[2]));
    const centreSeries = sentence.match(
      new RegExp(
        "중심 X=±(" + number + ")m·Y=(" + number + ")m·Z=(" + number + ")",
      ),
    );
    if (centreSeries) {
      add(part, "X", -scalar(centreSeries[1]), scalar(centreSeries[1]));
      add(part, "Y", scalar(centreSeries[2]), scalar(centreSeries[2]));
      add(part, "Z", scalar(centreSeries[3]), scalar(centreSeries[3]));
    }
    const line = sentence.match(new RegExp(
      "\\(Y,Z\\)=\\((" + number + "),(" + number + ")\\)m에서 \\(("+ number + "),(" + number + ")\\)m",
    ));
    if (line) {
      const y0 = scalar(line[1]), z0 = scalar(line[2]), y1 = scalar(line[3]), z1 = scalar(line[4]);
      const halfY = (partDimensions[part]["연직 두께"] ?? 0) / 2;
      add(part, "Y", Math.min(y0, y1) - halfY, Math.max(y0, y1) + halfY);
      add(part, "Z", Math.min(z0, z1), Math.max(z0, z1));
    }
    const pointProfile = sentence.match(/\((?:Y|높이),반지름\)=/);
    if (pointProfile) {
      for (const p of sentence.matchAll(/\(([\d.]+),([\d.]+)\)/g)) {
        add(part, "Y", Number(p[1]), Number(p[1]));
        add(part, "X", -Number(p[2]), Number(p[2]));
        add(part, "Z", -Number(p[2]), Number(p[2]));
      }
      explicitSeen[part].Y = true;
    }
    if (/\(반지름,Y\)=/.test(sentence)) {
      for (const p of sentence.matchAll(/\(([\d.]+),([\d.]+)\)/g)) {
        add(part, "X", -Number(p[1]), Number(p[1]));
        add(part, "Y", Number(p[2]), Number(p[2]));
        add(part, "Z", -Number(p[1]), Number(p[1]));
      }
      explicitSeen[part].Y = true;
    }
    const ellipse = sentence.match(
      /\(X,Y,Z\)=\(([\d.]+) cos t,([\d.]+)\+([\d.]+) sin t,0\)/,
    );
    if (ellipse) {
      const tube = construction.match(/관 반지름 ([\d.]+)m/);
      if (tube) {
        const [horizontal, bottom, rise, radius] = [ellipse[1], ellipse[2], ellipse[3], tube[1]].map(
          Number,
        );
        add(part, "X", -horizontal - radius, horizontal + radius);
        add(part, "Y", bottom - radius, bottom + rise + radius);
        add(part, "Z", -radius, radius);
      }
    }
    const outerFrustum = sentence.match(
      /Y=([\d.]+)에서 반지름 [\d.]+m, Y=([\d.]+)m에서 반지름/,
    );
    if (outerFrustum) add(
      part,
      "Y",
      Number(outerFrustum[1]),
      Number(outerFrustum[2]),
    );
    const crossSection = /단면은 폭/.test(sentence);
    if (widths.폭 && !bounds.X.length && !crossSection) add(
      part,
      "X",
      -widths.폭 / 2,
      widths.폭 / 2,
    );
    if (widths.깊이 && !bounds.Z.length && !crossSection) add(
      part,
      "Z",
      backOrigin ? 0 : -widths.깊이 / 2,
      backOrigin ? widths.깊이 : widths.깊이 / 2,
    );
    if (widths.두께 && widths.폭 && widths.높이 && !widths.깊이 && !bounds.Z.length)
      add(part, "Z", -widths.두께 / 2, widths.두께 / 2);
    if (Number.isFinite(widthW) && /(?:상판|좌판)/.test(sentence) && !bounds.X.length)
      add(part, "X", -widthW / 2, widthW / 2);
    if (crossSection) {
      const length = construction.match(
        new RegExp("길이는[^.]*?(" + number + ")m"),
      );
      if (length) add(part, "X", -scalar(length[1]) / 2, scalar(length[1]) / 2);
      if (widths.폭) add(part, "Z", -widths.폭 / 2, widths.폭 / 2);
      if (widths.깊이) add(part, "Y", 0, widths.깊이);
    }
    if (widths.높이 && !bounds.Y.length && /그 위/.test(sentence) && preceding) {
      const support = result[preceding].Y;
      if (support.length) {
        const bottom = Math.max(...support);
        add(part, "Y", bottom, bottom + widths.높이);
      }
    }
    if (widths.높이 && !bounds.Y.length && ground && !/윗면 높이|그 위/.test(sentence))
      add(part, "Y", 0, widths.높이);
    const topHeight = sentence.match(new RegExp("윗면 높이 (" + number + ")m"));
    if (topHeight && widths.두께) {
      const top = scalar(topHeight[1]);
      add(part, "Y", top - widths.두께, top);
    }
    const lengthFrom = sentence.match(
      new RegExp("Y=(" + number + ")m부터 길이 (" + number + ")m"),
    );
    if (lengthFrom) {
      const y = scalar(lengthFrom[1]);
      add(part, "Y", y, y + scalar(lengthFrom[2]));
    }
    const fromSupport = sentence.match(
      new RegExp("(?:윗면에서|윗면부터) 높이 (" + number + ")m"),
    );
    if (fromSupport && preceding) {
      const support = result[preceding].Y;
      if (support.length) {
        const bottom = Math.max(...support);
        add(part, "Y", bottom, bottom + scalar(fromSupport[1]));
      }
    }
    if (widths.폭 && bounds.X.length === 2 && /두 중심은 X=±/.test(sentence)) {
      const points = [...bounds.X];
      add(
        part,
        "X",
        Math.min(...points) - widths.폭 / 2,
        Math.max(...points) + widths.폭 / 2,
      );
    }
    const upper = sentence.match(new RegExp("윗면 Y=(" + number + ")m"));
    if (upper && widths.두께)
      add(part, "Y", scalar(upper[1]) - widths.두께, scalar(upper[1]));
    const upperHeight = sentence.match(new RegExp("윗면 높이 (" + number + ")m"));
    if (upperHeight && widths.두께 && !bounds.Y.length)
      add(part, "Y", scalar(upperHeight[1]) - widths.두께, scalar(upperHeight[1]));
    if (ground && widths.두께 && !bounds.Y.length && /(?:바닥|아래면)/.test(sentence))
      add(part, "Y", 0, widths.두께);
    const radii = [...sentence.matchAll(new RegExp(
      "(?:(?:바깥|외|아래|위|바닥|윗입)\\s*)?반지름(?:은)?\\s*(" + number + ")(?:→(" + number + "))?m", "g",
    ))].flatMap((match) => [match[1], match[2]].filter(Boolean).map(scalar));
    if (radii.length && (/원판|원통|원환|원뿔|회전체|컵|몸체|발/.test(sentence) ||
      /Y=[+−-]?[\d.]+~[+−-]?[\d.]+m/.test(sentence) || /아랫면 Y=.*반지름/.test(sentence))) {
      const radius = Math.max(...radii);
      const alongX = /X축|YZ 평면/.test(sentence) ||
        (/X=/.test(sentence) && /원통|원뿔/.test(sentence) && !/Y=.{0,8}~/.test(sentence)) ||
        (/^끝은 X=/.test(sentence) && /원뿔/.test(sentence));
      for (const axis of (alongX
        ? ["Y", "Z"]
        : ["X", "Z"] as Axis[])) {
        const axisCenter = alongX
          ? sentence.match(new RegExp(axis + "=(" + number + ")m"))
          : null;
        const centers = axisCenter
          ? [scalar(axisCenter[1])]
          : /중심(?:은|\s*)\s*\((?:X,Y,Z|X,Z)\)=|중심 X=|중심은 모두 \(|바퀴 중심은 \(|^향 세 가닥은 X=/.test(sentence) && bounds[axis].length
            ? [...bounds[axis]]
            : [0];
        add(
          part,
          axis,
          Math.min(...centers) - radius,
          Math.max(...centers) + radius,
        );
      }
      if (alongX && widths.두께) {
        const centers = bounds.X.length ? [...bounds.X] : [0];
        add(
          part,
          "X",
          Math.min(...centers) - widths.두께 / 2,
          Math.max(...centers) + widths.두께 / 2,
        );
      }
    }
    const dia = sentence.match(
      new RegExp("(?:바깥 |아래 )?(?<!반)지름 (" + number + ")m"),
    );
    const upperDia = sentence.match(new RegExp("윗지름 (" + number + ")m"));
    if (dia) {
      const r = Math.max(scalar(dia[1]), upperDia ? scalar(upperDia[1]) : 0) / 2;
      add(part, "X", -r, r);
      add(part, "Z", -r, r);
      if (!bounds.Y.length && widths.높이 && ground) add(
        part,
        "Y",
        0,
        widths.높이,
      );
    }
    const xWidth = sentence.match(new RegExp("X 폭 (" + number + ")m"));
    if (xWidth && bounds.X.length) {
      const lo = Math.min(...bounds.X), hi = Math.max(...bounds.X), half = scalar(xWidth[1]) / 2;
      add(part, "X", lo - half, hi + half);
    }
    const localLength = sentence.match(
      new RegExp(
        "길이 (" + number + ")m·폭 (" + number + ")m·두께 (" + number + ")m",
      ),
    );
    if (localLength) {
      const [length, cross] = localLength.slice(1, 3).map(scalar);
      const longZ = /긴 변은 (?:로컬 )?Z/.test(construction);
      add(part, longZ ? "Z" : "X", -length / 2, length / 2);
      add(part, longZ ? "X" : "Z", -cross / 2, cross / 2);
    }

  return { widths, center };
}
