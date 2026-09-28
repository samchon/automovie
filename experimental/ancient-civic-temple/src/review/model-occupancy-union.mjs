/** Recover measurable bounds from the authored part construction, not summaries. */
/** @typedef {"X"|"Y"|"Z"} Axis */
/** @typedef {Record<Axis, number[]> & { summary: Record<Axis, number[][]> }} PartBound */
const number = "[+−-]?\\d+(?:\\.\\d+)?";
/** @param {string} s */
const scalar = (s) => Number(s.replace("−", "-"));
/** @param {number} a @param {number} b */
const near = (a, b) => Math.abs(a - b) < 1e-6;
/** @param {string} s */
const escape = (s) => s.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
/** @type {Axis[]} */
const axes = ["X", "Y", "Z"];

/** @param {string} body */
export const modelParts = (body) => [...(body.match(/^부재 대응: (.+)$/m)?.[1] ?? "")
  .matchAll(/`([^`]+)`=([^;.]+)/g)].map(([, key, noun]) => ({ key, noun: noun.trim() }));
/** @param {string} sentence @param {string} noun */
const mentions = (sentence, noun) => new RegExp(
  "(?<![\\p{L}\\p{N}])" + escape(noun) + "(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에서|으로|로|\\s+[가-힣]+(?:은|는|이|가))", "u",
).test(sentence);
/** @param {string} source @param {number} width */
const expression = (source, width) => {
  const match = source.replaceAll("−", "-").match(/^W\/2([+-]\d+(?:\.\d+)?)?$/);
  return match ? width / 2 + Number(match[1] ?? 0) : NaN;
};

/** @param {string} body @param {number} [width] */
export const partBounds = (body, width = NaN) => {
  const parts = modelParts(body);
  /** @type {Record<string, PartBound>} */
  const result = Object.fromEntries(
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
  /** @type {Record<string, Record<Axis, boolean>>} */
  const explicitSeen = Object.fromEntries(parts.map(({ key }) => [key, { X: false, Y: false, Z: false }]));
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
  /** @type {Record<string, Record<string, number>>} */
  const partDimensions = Object.fromEntries(parts.map(({ key }) => [key, {}]));
  const widthW = Number(prose.match(/(?:기본 폭 W|\bW)=([\d.]+)m/)?.[1]);
  const depthD = Number(prose.match(/\bD=([\d.]+)m/)?.[1]);
  const thickT = Number(prose.match(/\bT=([\d.]+)m/)?.[1]);
  /** @param {string} part @param {Axis} axis @param {number} a @param {number} b */
  const add = (part, axis, a, b) => {
    if (part && Number.isFinite(a) && Number.isFinite(b)) result[part][axis].push(
      a,
      b,
    );
  };
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
    const bounds = result[part];
    // The remaining shape readers below consume only the defining clause.
    sentence = shape;
    for (const match of sentence.matchAll(
      new RegExp("([XYZ])=(" + number + ")~(" + number + ")m", "g"),
    )) {
      const axis = /** @type {Axis} */ (match[1]), a = scalar(
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
      add(part, /** @type {Axis} */ (match[1]), scalar(match[2]), scalar(match[3]));
    for (const match of sentence.matchAll(
      new RegExp("([XYZ])=(" + number + ")m", "g"),
    ))
      if (!new RegExp(match[1] + "=" + match[2] + "~").test(sentence))
        add(part, /** @type {Axis} */ (match[1]), scalar(match[2]), scalar(match[2]));
    const widths = Object.fromEntries([...sentence.matchAll(new RegExp(
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
      const labels = /** @type {Axis[]} */ (center[1].split(
        ",",
      )), entries = center[2].split(",");
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
      for (const axis of /** @type {Axis[]} */ (alongX
        ? ["Y", "Z"]
        : ["X", "Z"])) {
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
      add(part, /** @type {Axis} */ (axisCentre[1]), -centre - half, centre + half);
    }
    const section = sentence.match(new RegExp("X·Z 각 (" + number + ")m 단면"));
    if (section) for (const axis of /** @type {Axis[]} */ (["X", "Z"])) {
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
      for (const axis of /** @type {Axis[]} */ (["X", "Z"])) {
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
  const crown = parts.find(({ noun }) => noun === "수관");
  if (crown) {
    /** @type {number[][]} */
    const ellipsoids = [];
    for (const row of construction.matchAll(/\|[^|\n]+\|\s*\(([^)]+)\)\s*\|\s*\(([^)]+)\)\s*\|/g)) {
      const centre = row[1].split(",").map(scalar), half = row[2].split(",").map(scalar);
      if (centre.length === 3 && half.length === 3 && [...centre, ...half].every(Number.isFinite))
        ellipsoids.push([centre[0] - half[0], centre[0] + half[0],
          centre[1] - half[1], centre[1] + half[1], centre[2] - half[2], centre[2] + half[2]]);
    }
    if (!ellipsoids.length) for (const shape of construction.matchAll(/\(([+−-]?[\d.]+),([+−-]?[\d.]+),([+−-]?[\d.]+)\)m[,·]\s*(?:수평 )?반지름 ([\d.]+)m[,·]\s*(?:전체 )?높이 ([\d.]+)m/g)) {
      const [x, y, z] = shape.slice(1, 4).map(scalar), r = Number(shape[4]), h = Number(shape[5]) / 2;
      ellipsoids.push([x - r, x + r, y - h, y + h, z - r, z + r]);
    }
    if (ellipsoids.length) {
      result[crown.key].X = [Math.min(...ellipsoids.map((e) => e[0])), Math.max(...ellipsoids.map((e) => e[1]))];
      result[crown.key].Y = [Math.min(...ellipsoids.map((e) => e[2])), Math.max(...ellipsoids.map((e) => e[3]))];
      result[crown.key].Z = [Math.min(...ellipsoids.map((e) => e[4])), Math.max(...ellipsoids.map((e) => e[5]))];
    }
  }
  const branch = parts.find(({ noun }) => noun === "가지");
  const branchSource = construction.match(/반지름 ([\d.]+)m인 세 가지는[^\n]*?중심 \(([^)]+)\)m에서 각각 ([^\n]*?)로 뻗으며/);
  if (branch && branchSource) {
    const r = Number(branchSource[1]);
    const endpoints = [branchSource[2], ...[...branchSource[3].matchAll(/\(([^)]+)\)m/g)].map((m) => m[1])]
      .map((tuple) => tuple.split(",").map(scalar)).filter((tuple) => tuple.length === 3 && tuple.every(Number.isFinite));
    if (endpoints.length >= 2) for (let i = 0; i < 3; i++) {
      const axis = axes[i], values = endpoints.map((point) => point[i]);
      result[branch.key][axis] = [Math.min(...values) - r, Math.max(...values) + r];
    }
  }
  const fan = construction.match(/잎 너비는 `([\d.]+)\+([\d.]+)×\(i mod (\d+)\)`m/);
  const leaves = construction.match(/i는 0~(\d+)의 정수/);
  const baseRadius = construction.match(/바닥 중심은 원점에서 θ 방향 ([\d.]+)m/);
  const tipOffset = construction.match(/`([\d.]+)\+([\d.]+)×\(\(i mod (\d+)\)\/(\d+)\)`m/);
  const tipHeight = construction.match(/끝 높이는 `([\d.]+)\+([\d.]+)×\(\((\d+)i mod (\d+)\)\/(\d+)\)`m/);
  const blade = parts.find(({ noun }) => noun === "잎");
  if (fan && leaves && baseRadius && tipOffset && tipHeight && blade) {
    const count = Number(leaves[1]) + 1, base = Number(baseRadius[1]);
    const xs = [], zs = [], ys = [0];
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * i / count, c = Math.cos(theta), s = Math.sin(theta);
      const half = (Number(fan[1]) + Number(fan[2]) * (i % Number(fan[3]))) / 2;
      const tip = base + Number(tipOffset[1]) + Number(tipOffset[2]) *
        (i % Number(tipOffset[3])) / Number(tipOffset[4]);
      xs.push(base * c - half * s, base * c + half * s, tip * c);
      zs.push(base * s - half * c, base * s + half * c, tip * s);
      ys.push(Number(tipHeight[1]) + Number(tipHeight[2]) *
        ((Number(tipHeight[3]) * i) % Number(tipHeight[4])) / Number(tipHeight[5]));
    }
    result[blade.key].X = [Math.min(...xs), Math.max(...xs)];
    result[blade.key].Y = [0, Math.max(...ys)];
    result[blade.key].Z = [Math.min(...zs), Math.max(...zs)];
  }
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
  return result;
};

/**
 * Every resolved part participates in the same axis/union comparison,
 * including alternate shapes of a multi-variant prototype.
 * @param {string} id
 * @param {Record<string, PartBound>} parts
 * @param {number[]} box
 * @param {number[]} tolerance
 * @param {{ground?:boolean;backOrigin?:boolean;conservative?:boolean;zeroSurfaces?:Set<string>}} [options]
 */
const compareBounds = (id, parts, box, tolerance, options = {}) => {
  const { ground = false, backOrigin = false, conservative = false,
    zeroSurfaces = new Set() } = options;
  /** @param {string} part @param {number[]} points */
  const zeroSurface = (part, points) => zeroSurfaces.has(part) && points.length >= 2 &&
    near(Math.min(...points), Math.max(...points));
  /** @type {{ id:string;part:string;axis:string;kind:string;box:number;union:number;pass:boolean }[]} */
  const rows = [];
  for (const [part, bounds] of Object.entries(parts)) for (let i = 0; i < 3; i++) {
    const axis = axes[i], points = bounds[axis];
    if ((points.length < 2 || near(Math.min(...points), Math.max(...points))) && !zeroSurface(part, points)) {
      rows.push({ id, part, axis, kind: "unresolved part axis", box: box[i], union: NaN, pass: false });
      continue;
    }
    const lo = Math.min(...points), hi = Math.max(...points);
    rows.push({
      id, part, axis, kind: "containment", box: box[i], union: hi - lo,
      pass: axis === "Y" && ground ? lo >= -tolerance[i] && hi <= box[i] + tolerance[i]
        : axis === "Z" && backOrigin ? lo >= -tolerance[i] && hi <= box[i] + tolerance[i]
          : hi - lo <= box[i] + tolerance[i],
    });
    for (const [a, b] of bounds.summary[axis]) rows.push({
      id, part, axis, kind: "summary", box: box[i], union: b - a,
      pass: near(lo, a) && near(hi, b),
    });
  }
  for (let i = 0; i < 3; i++) {
    const axis = axes[i], all = Object.entries(parts);
    if (!all.length || all.some(([key, part]) => part[axis].length < 2 ||
      (near(Math.max(...part[axis]), Math.min(...part[axis])) && !zeroSurface(key, part[axis])))) continue;
    const points = all.flatMap(([, part]) => part[axis]);
    const extent = Math.max(...points) - Math.min(...points);
    rows.push({
      id, part: "all", axis, kind: "union", box: box[i], union: extent,
      pass: conservative ? extent <= box[i] + tolerance[i] :
        Math.abs(extent - box[i]) <= tolerance[i],
    });
  }
  return rows;
};

/** @param {number[]} x @param {number[]} y @param {number[]} z @returns {PartBound} */
const prism = (x, y, z) => ({ X: x, Y: y, Z: z, summary: { X: [], Y: [], Z: [] } });

/** Resolve the single, bundled, and open variants of rolled sheet geometry. */
/** @param {string} id @param {string} body */
const rolledSheetRows = (id, body) => {
  const mapping = modelParts(body);
  if (!/말린 한 개, 세 개 묶음, 펼친 한 장/.test(body) ||
    !mapping.some(({ noun }) => noun === "종이") || !mapping.some(({ noun }) => noun === "끈")) return null;
  const fail = () => [{ id, part: "all", axis: "XYZ", kind: "unresolved rolled variants",
    box: NaN, union: NaN, pass: false }];
  const cylinder = body.match(/반지름 ([\d.]+)m·길이 ([\d.]+)m 원통의 양끝 면에 반지름 [\d.]+m의 말림 심이 ([\d.]+)m씩/);
  const ring = body.match(/중심선 반지름 ([\d.]+)m·관 반지름 ([\d.]+)m인 원환/);
  const triangle = body.match(/YZ 중심을 \(0,−([\d.]+)\),\(0,\+([\d.]+)\),\(([\d.]+)√3,0\)m/);
  const flat = body.match(/로컬 X 폭 ([\d.]+)m·Z 길이 ([\d.]+)m·두께 ([\d.]+)m 판으로 Y=([\d.]+)~([\d.]+)m/);
  const endRoll = body.match(/X축 반지름 ([\d.]+)m·길이 ([\d.]+)m 원통이며 그 중심은 `\(Y,Z\)=\(([\d.]+),±\(([\d.]+)\+√\(([\d.]+)²−([\d.]+)²\)\)\)m`/);
  const singleBox = body.match(/말린 것 ([\d.]+)×([\d.]+)×([\d.]+)m/);
  const bundleBox = body.match(/묶음 ([\d.]+)×\(([\d.]+)√3\+([\d.]+)\)×([\d.]+)m/);
  const flatBox = body.match(/펼친 것 `([\d.]+)×([\d.]+)×\(2×\(([\d.]+)\+√\(([\d.]+)²−([\d.]+)²\)\+([\d.]+)\)\)m`/);
  if (!cylinder || !ring || !triangle || !flat || !endRoll || !singleBox || !bundleBox || !flatBox) return fail();
  const [radius, length, core] = cylinder.slice(1).map(Number);
  const [major, tube] = ring.slice(1).map(Number);
  const [sideLo, sideHi, peak] = triangle.slice(1).map(Number);
  const [sheetWidth, sheetLength, thickness, y0, y1] = flat.slice(1).map(Number);
  const [rollRadius, rollLength, rollY, z0, rootA, rootB] = endRoll.slice(1).map(Number);
  const ringRadius = major + tube;
  const bundlePeak = peak * Math.sqrt(3);
  const endOffset = z0 + Math.sqrt(rootA ** 2 - rootB ** 2);
  const sheet = mapping.find(({ noun }) => noun === "종이")?.key;
  const tie = mapping.find(({ noun }) => noun === "끈")?.key;
  const bundle = mapping.filter(({ noun }) => /종이 원통/.test(noun)).map(({ key }) => key);
  if (!sheet || !tie || bundle.length !== 3 || ![radius, length, core, major, tube,
    sideLo, sideHi, peak, sheetWidth, sheetLength, thickness, y0, y1, rollRadius,
    rollLength, rollY, endOffset].every(Number.isFinite)) return fail();
  const single = {
    [sheet]: prism([-length / 2 - core, length / 2 + core], [-radius, radius], [-radius, radius]),
    [tie]: prism([-tube, tube], [-ringRadius, ringRadius], [-ringRadius, ringRadius]),
  };
  const bundled = Object.fromEntries(bundle.map((key, i) => {
    const [y, z] = i === 0 ? [0, -sideLo] : i === 1 ? [0, sideHi] : [bundlePeak, 0];
    return [key, prism([-length / 2 - core, length / 2 + core], [y - radius, y + radius],
      [z - radius, z + radius])];
  }));
  bundled[tie] = prism([-tube, tube], [-ringRadius, bundlePeak + ringRadius],
    [-sideLo - ringRadius, sideHi + ringRadius]);
  const open = {
    [sheet]: prism([-Math.max(sheetWidth, rollLength) / 2, Math.max(sheetWidth, rollLength) / 2],
      [Math.min(y0, rollY - rollRadius), Math.max(y1, rollY + rollRadius)],
      [-Math.max(sheetLength / 2, endOffset + rollRadius),
        Math.max(sheetLength / 2, endOffset + rollRadius)]),
  };
  const singleSize = singleBox.slice(1).map(Number);
  const bundleSize = [Number(bundleBox[1]), Number(bundleBox[2]) * Math.sqrt(3) + Number(bundleBox[3]), Number(bundleBox[4])];
  const openSize = [Number(flatBox[1]), Number(flatBox[2]), 2 * (Number(flatBox[3]) +
    Math.sqrt(Number(flatBox[4]) ** 2 - Number(flatBox[5]) ** 2) + Number(flatBox[6]))];
  return [
    ...compareBounds(`${id}:single`, single, singleSize, [1e-6, 1e-6, 1e-6]),
    ...compareBounds(`${id}:bundle`, bundled, bundleSize, [1e-6, 1e-6, 1e-6]),
    ...compareBounds(`${id}:open`, open, openSize, [1e-6, 1e-6, 1e-6]),
  ];
};

/** Resolve families whose occupancy dimensions are functions of placement inputs. */
/** @param {string} id @param {string} body */
const parameterFamilyRows = (id, body) => {
  const line = body.match(/점유 상자는[^\n]*/)?.[0] ?? "";
  if (!/[×]/.test(line) || !/(?:길이×|L\/cos|유효 폭|벽 두께)/.test(line)) return null;
  const fail = () => [{ id, part: "all", axis: "XYZ", kind: "unresolved parameter family",
    box: NaN, union: NaN, pass: false }];
  const parts = modelParts(body);
  if (/길이×/.test(line)) {
    const section = body.match(/단면은 폭 ([\d.]+)m·깊이 ([\d.]+)m/);
    const box = line.match(/길이×([\d.]+)×([\d.]+)m/);
    const lengths = [...body.matchAll(/(?:약 |길이\()([\d.]+)m/g)].map((m) => Number(m[1]))
      .filter((length) => length > 1);
    if (!section || !box || !lengths.length || parts.length !== 1) return fail();
    const [width, depth] = section.slice(1).map(Number);
    return lengths.map((length, index) => compareBounds(`${id}:length-${index + 1}`,
      { [parts[0].key]: prism([-length / 2, length / 2], [0, depth], [-width / 2, width / 2]) },
      [length, Number(box[1]), Number(box[2])], [1e-6, 1e-6, 1e-6])).flat();
  }
  if (/L\/cos/.test(line)) {
    const section = body.match(/단면은 폭 ([\d.]+)m·깊이 ([\d.]+)m/);
    const box = line.match(/([\d.]+)×([\d.]+)×\(L\/cos\(α\)\+([\d.]+)tan\(α\)\)m/);
    const angles = [...new Set([...body.matchAll(/(\d+)°/g)].map((m) => Number(m[1])))]
      .filter((angle) => angle > 0 && angle < 90);
    if (!section || !box || !angles.length || parts.length !== 1) return fail();
    const [width, depth] = section.slice(1).map(Number);
    return angles.flatMap((degrees) => [1, 2].flatMap((length) => {
      const radians = degrees * Math.PI / 180;
      const extent = length / Math.cos(radians) + depth * Math.tan(radians);
      const claimed = length / Math.cos(radians) + Number(box[3]) * Math.tan(radians);
      return compareBounds(`${id}:L${length}-a${degrees}`,
        { [parts[0].key]: prism([-width / 2, width / 2], [0, depth], [0, extent]) },
        [Number(box[1]), Number(box[2]), claimed], [1e-6, 1e-6, 1e-6]);
    }));
  }
  if (/유효 폭|벽 두께/.test(line)) {
    const aperture = body.match(/유효 ([\d.]+)×([\d.]+)m/);
    const lining = body.match(/(?:각 가장자리|안감 네 조각은 폭) ([\d.]+)m/);
    const surround = body.match(/(?:테\(폭 |외부 면에만 폭 )([\d.]+)m/);
    const projection = body.match(/(?:벽면에서 |돌출 )([\d.]+)m 돌출|돌출 ([\d.]+)m의 테/);
    const box = line.match(/(?:\(유효 폭\+([\d.]+)m\)|([\d.]+))×(?:\(유효 높이\+([\d.]+)m\)|([\d.]+))×\(벽 두께\+([\d.]+)m?\)/);
    const liningPart = parts.find(({ noun }) => noun === "안감");
    const rimPart = parts.find(({ noun }) => noun === "테");
    const frameWidth = Number(lining?.[1]), rim = Number(surround?.[1]);
    const project = Number(projection?.[1] ?? projection?.[2]);
    if (!liningPart || !rimPart || !box || !Number.isFinite(frameWidth) || !Number.isFinite(rim) ||
      !Number.isFinite(project)) return fail();
    const samples = aperture ? [[Number(aperture[1]), Number(aperture[2]), .3],
      [Number(aperture[1]), Number(aperture[2]), .6]] : [[1, 2.2, .3], [1.2, 2.3, .6]];
    return samples.flatMap(([width, height, wall]) => {
      const outerX = width / 2 + frameWidth + rim;
      const aroundAll = /안감 네 조각/.test(body);
      const outerY = height + (aroundAll ? 2 : 1) * (frameWidth + rim);
      const bothSides = /벽 양면/.test(body);
      const partsBounds = {
        [liningPart.key]: prism([-width / 2 - frameWidth, width / 2 + frameWidth],
          [0, height + (aroundAll ? 2 : 1) * frameWidth], [-wall / 2, wall / 2]),
        [rimPart.key]: prism([-outerX, outerX], [0, outerY],
          [-wall / 2 - (bothSides ? project : 0), wall / 2 + project]),
      };
      const claimed = [Number(box[1] ?? box[2]) + (box[1] ? width : 0),
        Number(box[3] ?? box[4]) + (box[3] ? height : 0), wall + Number(box[5])];
      return compareBounds(`${id}:w${width}-h${height}-d${wall}`, partsBounds, claimed,
        [1e-6, 1e-6, 1e-6]);
    });
  }
  return fail();
};

/** Each recoverable part must fit; if all parts resolve, their union must fill. */
/** @param {string} id @param {string} body */
export const occupancyUnionRows = (id, body) => {
  const rolled = rolledSheetRows(id, body);
  if (rolled) return rolled;
  const parameterFamily = parameterFamilyRows(id, body);
  if (parameterFamily) return parameterFamily;
  const prose = body.split(/^부재 대응:/m)[0].replace(/<!--[\s\S]*?-->/g, "");
  const hasBox = /점유 상자/.test(prose);
  if (!hasBox) return [];
  if (!modelParts(body).length) return [];
  const boxLine = prose.slice(prose.indexOf("점유 상자는")).split("\n")[0];
  let match = boxLine.match(/([\d.]+)×(?:약 )?([\d.]+)×([\d.]+)m/);
  const symbolicBox = boxLine.match(/([\d.]+)×([A-Za-z])×([\d.]+)m/);
  if (!match && symbolicBox) {
    const assignment = prose.match(new RegExp("\\b" + symbolicBox[2] + "=([^m\\n]+)m"))?.[1];
    const parameter = assignment?.match(/=([\d.]+)$/)?.[1] ?? assignment?.match(/^([\d.]+)/)?.[1];
    if (parameter) match = [symbolicBox[0], symbolicBox[1], parameter, symbolicBox[3]];
  }
  if (!match && /폭×높이×깊이/.test(boxLine)) {
    const dimensions = prose.match(/폭 ([\d.]+)m·깊이 ([\d.]+)m·높이 ([\d.]+)m/);
    if (dimensions) match = [dimensions[0], dimensions[1], dimensions[3], dimensions[2]];
  }
  if (!match) {
    const ranges = boxLine.match(/X ([+−-]?[\d.]+)~([+−-]?[\d.]+)m, Y ([+−-]?[\d.]+)~([+−-]?[\d.]+)m, Z ([+−-]?[\d.]+)~([+−-]?[\d.]+)m/);
    if (ranges) match = [ranges[0], String(scalar(ranges[2]) - scalar(ranges[1])),
      String(scalar(ranges[4]) - scalar(ranges[3])), String(scalar(ranges[6]) - scalar(ranges[5]))];
  }
  if (!match) return [{ id, part: "all", axis: "XYZ", kind: "unresolved box grammar", box: NaN, union: NaN, pass: false }];
  const box = match.slice(1).map(Number);
  const tolerance = boxLine.includes("약")
    ? match.slice(1).map((value) => 0.5 * 10 ** -(value.split(".")[1]?.length ?? 0) + 1e-6)
    : [1e-6, 1e-6, 1e-6];
  const ground = /원점[^.\n]*(?:바닥|지면|아래면)/.test(body);
  const backOrigin = /원점[^.\n]*뒷변/.test(body) && /앞은[^.\n]*\+Z/.test(body);
  const width = Number(body.match(/기본 폭 W=([\d.]+)m/)?.[1]);
  // A variant paragraph can state several boxes. The first box governs only
  // the construction before the second named variant begins.
  const lineEnd = body.indexOf("\n", body.indexOf(match[0]));
  const boxSentence = body.slice(body.indexOf(match[0]), lineEnd < 0 ? undefined : lineEnd);
  const nextVariant = boxSentence.match(/,\s*([가-힣 ]+?)\s+[\d.]+×/);
  let construction = body;
  if (nextVariant) {
    const beforeBox = body.slice(0, match.index);
    const variant = new RegExp("(?:^|[.!?]\\s+)[^\\n]*?" + escape(nextVariant[1].trim()) + "(?:은|는)", "gm").exec(beforeBox);
    const mapping = body.match(/^부재 대응:.*$/m)?.[0] ?? "";
    if (variant && mapping) construction = beforeBox.slice(0, variant.index) + "\n" + mapping;
  }
  if (/\bA [\d.]+×/.test(boxLine) && /\bB [\d.]+×/.test(boxLine) && !/벽 바닥(?:은|이) X=±/.test(prose)) {
    const marker = prose.search(/변형 B는|\bB는/);
    const mapping = body.match(/^부재 대응:.*$/m)?.[0] ?? "";
    if (marker >= 0 && mapping) construction = prose.slice(0, marker) + "\n" + mapping;
  }
  const parts = partBounds(construction, width);
  const zeroSurfaces = new Set(Object.keys(parts).filter((part) =>
    new RegExp("`" + escape(part) + "`[^\\n]*두께 없는 면").test(construction)));
  const rows = compareBounds(id, parts, box, tolerance, {
    ground, backOrigin, conservative: /여유 있게 감싸는/.test(boxLine), zeroSurfaces,
  });
  const second = boxLine.match(/\bB ([\d.]+×[\d.]+×[\d.]+m)/);
  if (second && /벽 바닥(?:은|이) X=±/.test(prose)) {
    const start = body.indexOf("변형 B는");
    const end = body.indexOf("부재 대응:");
    const mapping = body.slice(end).split("\n")[0];
    if (start >= 0 && end > start) {
      const source = body.slice(start, end).replace(/점유 상자는 A [^\n]+/,
        `점유 상자는 ${second[1]}다.`);
      rows.push(...occupancyUnionRows(`${id}:B`, `${source}\n${mapping}`));
    }
  }
  return rows;
};
