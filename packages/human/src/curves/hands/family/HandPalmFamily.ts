import { HandCurveDecode as D } from "./HandCurveDecode";
import { HandCurveMath as M } from "./HandCurveMath";

/** Continue the owned collar through closed palm sections and anatomically matched branch supports.
 *
 * Palm quarter phase is dorsal, radial, volar, ulnar. Digit-root quarter phase
 * is radial, dorsal, ulnar, volar. Branch attachment therefore resolves a
 * transverse position rather than equating these different phase numbers.
 */
export namespace HandPalmFamily {
  /** Invert the emitted cubic's radial projection and choose its dorsal or volar intersection.
   *
   * Split at derivative roots before bisection, retaining the actual cubic
   * operator. An outlying root uses the section's radial support, not an
   * extrapolated ellipse or independently fitted display guide.
   */
  function attachment(
    section: M.Curve,
    point: M.V,
    radial: M.V,
    dorsal: M.V,
    positive: boolean,
  ): number {
    const low: number = -M.dot(
      M.support(section, M.mul(radial, -1)).point,
      M.mul(radial, -1),
    );
    const high: number = M.dot(M.support(section, radial).point, radial);
    const target: number = Math.max(low, Math.min(high, M.dot(point, radial)));
    const candidates: number[] = [];
    for (let i: number = 0; i < section.spans.length; i++) {
      const span: M.S = section.spans[i]!;
      const p: number[] = span.map((v: M.V): number => M.dot(v, radial));
      const a: number = -p[0]! + 3 * p[1]! - 3 * p[2]! + p[3]!;
      const b: number = 2 * (p[0]! - 2 * p[1]! + p[2]!);
      const c: number = p[1]! - p[0]!;
      const cuts: number[] = [0, 1];
      const discriminant: number = b * b - 4 * a * c;
      if (a !== 0 && discriminant >= 0)
        cuts.push(
          (-b - Math.sqrt(discriminant)) / (2 * a),
          (-b + Math.sqrt(discriminant)) / (2 * a),
        );
      else if (a === 0 && b !== 0) cuts.push(-c / b);
      const intervals: number[] = [
        ...new Set(cuts.filter((t: number): boolean => t >= 0 && t <= 1)),
      ].sort((x: number, y: number): number => x - y);
      const value: (t: number) => number = (t: number): number =>
        M.dot(M.bez(span, t), radial) - target;
      for (let j: number = 0; j < intervals.length - 1; j++) {
        let left: number = intervals[j]!,
          right: number = intervals[j + 1]!;
        const vl: number = value(left),
          vr: number = value(right);
        if (Math.abs(vl) < 1e-9) candidates.push(i + left);
        if (Math.abs(vr) < 1e-9) candidates.push(i + right);
        if (vl * vr >= 0) continue;
        for (let iteration: number = 0; iteration < 60; iteration++) {
          const middle: number = (left + right) / 2;
          if (value(middle) < 0 === vl < 0) left = middle;
          else right = middle;
        }
        candidates.push(i + (left + right) / 2);
      }
    }
    if (candidates.length === 0)
      throw new Error("Palm cubic projection has no resolved attachment");
    return candidates.reduce((best: number, phase: number): number => {
      const score: number =
        M.dot(M.phase(section, phase), dorsal) * (positive ? 1 : -1);
      return score > M.dot(M.phase(section, best), dorsal) * (positive ? 1 : -1)
        ? phase
        : best;
    });
  }

  /** Emit one closed section family, its eight longitudinal guides, and ten individual branch continuations. */
  export function construct(
    data: D.Decoded,
    roots: Record<string, M.Curve>,
    fields: Record<string, M.S[]>,
  ): M.Curve[] {
    const net: M.Curve[] = [];
    const sections: M.Curve[] = [
      M.section(data.wristTensor, 1, "hand_wristCollar_1"),
    ];
    for (const station of ["0.45", "0.65"]) {
      const supports: Record<string, M.V> = data.palm[station]!;
      sections.push(
        M.sourceSection(
          "hand_palmSection_" + station,
          [supports["X+"]!, supports["Z+"]!, supports["X-"]!, supports["Z-"]!],
          data.proximal.u,
          data.proximal.v,
        ),
      );
    }
    // One constant transverse field per station preserves the section's angular
    // C1 relation at every longitudinal address. Independently normalizing the
    // sixteen coefficient trajectories would break that relation.
    const centers: M.V[] = sections.map(
      (section: M.Curve): M.V =>
        M.mul(
          section.spans.reduce(
            (sum: M.V, span: M.S): M.V => M.add(sum, span[0]),
            [0, 0, 0],
          ),
          0.25,
        ),
    );
    const jets: M.V[] = centers.map(
      (center: M.V, i: number): M.V =>
        i === 0
          ? data.h1
          : M.mul(
              M.unit(data.proximal.n),
              0.25 *
                Math.min(
                  M.norm(M.sub(center, centers[i - 1]!)),
                  i < centers.length - 1
                    ? M.norm(M.sub(centers[i + 1]!, center))
                    : Infinity,
                ),
            ),
    );
    const tensors: M.Tensor[] = [data.wristTensor];
    for (let interval: number = 0; interval < sections.length - 1; interval++) {
      tensors.push(
        M.tensor(
          sections[interval]!,
          sections[interval + 1]!,
          jets[interval]!,
          jets[interval + 1]!,
        ),
      );
    }
    for (const t of [0, 0.5, 1])
      net.push(M.section(data.wristTensor, t, "hand_wristCollar_" + t));
    net.push(...sections.slice(1));
    const names: readonly string[] = [
      "XPositive",
      "dorsalRadial",
      "ZPositive",
      "radialVolar",
      "XNegative",
      "volarUlnar",
      "ZNegative",
      "ulnarDorsal",
    ];
    for (let i: number = 0; i < 8; i++)
      net.push({
        name: "hand_palm_" + names[i],
        closed: false,
        spans: tensors.map(
          (tensor: M.Tensor): M.S => M.longitudinal(tensor, i / 2),
        ),
      });
    const axis: M.V = M.unit(data.proximal.n);
    for (const digit of D.digits)
      for (const rootPhase of [1, 3]) {
        const q: M.V = M.phase(roots[digit]!, rootPhase);
        // An opposed thumb can branch before the distal palm section. Select the
        // last preceding physical section; do not run distally and turn back.
        let end: number = sections.length - 1;
        while (
          end > 0 &&
          M.dot(M.sub(q, M.phase(sections[end]!, 0)), axis) <= 0
        )
          end--;
        const phase: number = attachment(
          sections[end]!,
          q,
          data.directions[0],
          data.directions[1],
          rootPhase === 1,
        );
        const course: M.S[] = tensors
          .slice(0, end + 1)
          .map((tensor: M.Tensor): M.S => M.longitudinal(tensor, phase));
        const last: M.S = course.at(-1)!;
        const startH: M.V = M.sub(last[3], last[2]);
        const endH: M.V = M.bez(fields[digit]![rootPhase]!, 0);
        net.push({
          name: `hand_palm_MCP_${digit}_${rootPhase === 1 ? "dorsal" : "volar"}`,
          closed: false,
          spans: [
            ...course,
            [last[3], M.add(last[3], startH), M.sub(q, endH), q],
          ],
        });
      }
    return net;
  }
}
