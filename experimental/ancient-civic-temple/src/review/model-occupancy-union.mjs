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
  "(?<![\\p{L}\\p{N}])" + escape(noun) + "(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에서|으로|로)", "u",
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
    .replace(/이고 그 위 /g, "다. 그 위 ")
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
    const shape = sentence.replace(/윗끝 Y=.*?(?:받친|닿).*$/, "")
      .replace(/(?:라 |에 |와 |과 )?(?:닿|접촉|접해|받친|받치).*$/, "")
      .replace(new RegExp("(?<=m)로 (?=(?:" + names + ")).*$"), "");
    if (!shape.trim()) continue;
    const firstGeometry = shape.search(
      /(?:[XYZ]=|반지름|지름|폭 |깊이 |높이 |두께 |중심)/,
    );
    const prefix = firstGeometry < 0 ? shape : shape.slice(0, firstGeometry);
    const named = parts.filter(({ key, noun }) =>
      mentions(prefix, noun) || mentions(prefix, noun.split(" ")[0]) || prefix.includes("`" + key + "`"));
    const afterCentre = shape.match(/중심 \(X,Z\).*?([가-힣]+) 두 개가/);
    const located = afterCentre && parts.find(({ noun }) => mentions(afterCentre[1], noun));
    const later = /^(?:[XYZ]=|반지름 |t=)/.test(shape) ?
      parts.map((p) => ({ ...p, at: shape.indexOf(p.noun) }))
        .filter((p) => p.at >= 0).sort((a, b) => a.at - b.at) : [];
    const explicit = parts.map((part) => ({ ...part,
      at: Math.max(prefix.lastIndexOf(part.noun + "은"), prefix.lastIndexOf(part.noun + "는")),
    })).filter(({ at }) => at >= 0).sort((a, b) => b.at - a.at)[0];
    const firstNamed = named.sort(
      (a, b) => prefix.indexOf(a.noun) - prefix.indexOf(b.noun),
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
      else add(part, axis, a, b);
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
  return result;
};

/** Each recoverable part must fit; if all parts resolve, their union must fill. */
/** @param {string} id @param {string} body */
export const occupancyUnionRows = (id, body) => {
  if (/(?:점유 상자는|점유 상자(?:는)?)[^\n]*?\bA [\d.]+×[\d.]+×[\d.]+m, B /.test(
    body,
  )) return [];
  const match = body.match(
    /(?:기본형 |닫힌 전체 )?점유 상자는[^\d\n]*?([\d.]+)×([\d.]+)×([\d.]+)m/,
  );
  if (!match) return [];
  const box = match.slice(1).map(Number);
  const ground = /원점[^.\n]*(?:바닥|지면|아래면)/.test(body);
  const backOrigin = /원점[^.\n]*뒷변/.test(body) && /앞은[^.\n]*\+Z/.test(body);
  const width = Number(body.match(/기본 폭 W=([\d.]+)m/)?.[1]);
  // A variant paragraph can state several boxes. The first box governs only
  // the construction before the second named variant begins.
  const lineEnd = body.indexOf("\n", match.index);
  const boxSentence = body.slice(match.index, lineEnd < 0 ? undefined : lineEnd);
  const nextVariant = boxSentence.match(/,\s*([가-힣 ]+?)\s+[\d.]+×/);
  let construction = body;
  if (nextVariant) {
    const beforeBox = body.slice(0, match.index);
    const variant = new RegExp("(?:^|[.!?]\\s+)[^\\n]*?" + escape(nextVariant[1].trim()) + "(?:은|는)", "gm").exec(beforeBox);
    const mapping = body.match(/^부재 대응:.*$/m)?.[0] ?? "";
    if (variant && mapping) construction = beforeBox.slice(0, variant.index) + "\n" + mapping;
  }
  const parts = partBounds(construction, width);
  /** @type {{ id:string;part:string;axis:string;kind:string;box:number;union:number;pass:boolean }[]} */
  const rows = [];
  for (const [part, bounds] of Object.entries(
    parts,
  )) for (let i = 0; i < 3; i++) {
    const axis = axes[i], points = bounds[axis];
    if (!points.length) continue;
    const lo = Math.min(...points), hi = Math.max(...points);
    rows.push({
      id,
      part,
      axis,
      kind: "containment",
      box: box[i],
      union: hi - lo,
      pass: axis === "Y" && ground
        ? lo >= -1e-6 && hi <= box[i] + 1e-6
        : axis === "Z" && backOrigin
          ? lo >= -1e-6 && hi <= box[i] + 1e-6
          : hi - lo <= box[i] + 1e-6,
    });
    for (const [a, b] of bounds.summary[axis])
      rows.push({
        id,
        part,
        axis,
        kind: "summary",
        box: box[i],
        union: b - a,
        pass: near(lo, a) && near(hi, b),
      });
  }
  for (let i = 0; i < 3; i++) {
    const axis = axes[i], all = Object.values(parts);
    if (!all.length || all.some((part) => part[axis].length < 2 ||
      near(Math.max(...part[axis]), Math.min(...part[axis])))) continue;
    const points = all.flatMap((part) => part[axis]);
    const extent = Math.max(...points) - Math.min(...points);
    rows.push({
      id,
      part: "all",
      axis,
      kind: "union",
      box: box[i],
      union: extent,
      pass: near(extent, box[i]),
    });
  }
  return rows;
};
