import {
  type AutoMovieLoftFrame,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  type AutoMovieViewOutline,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";

/**
 * Original material plane, regular contact and transverse curvature for regional caps.
 *
 * @evidence contracts/common.md#principled-implementation One original native field supplies actual plane inversion, bracketed contact and local curvature independently of anatomical placement anchors.
 * @evidence contracts/common.md#clear-and-simple-design The cap author retains one material datum while this owner handles its original-source queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no realized mesh, domain extension, seed relocation or invented derivative; local contact does not certify the whole footprint.
 * @evidence contracts/common.md#meaningful-documentation Queries use calibration mm and preserve the distinction between plane incidence, regular contact and point poles.
 * @evidence contracts/performance.md#efficient-algorithms Original scalar admission and source-site ordering precede bounded native/axis queries at their owners' costs; the individual factories state their query budgets.
 * @evidence contracts/performance.md#reuse-equivalent-work Each contact search shares its one source admission and reuses a fixed-plane native preparation when available.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned original sources and contact frames survive; no global registry or cache is retained.
 */
export namespace AutoMovieHumanHeadDomeHost {
  /**
   * An original parent section selected by a plane query or actual cap contact.
   *
   * @evidence contracts/common.md#principled-implementation Carries the complete admitted source, query point, actual station/frame and an explicit distinction between plane incidence and a bracketed surface contact.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the parent-plane datum separate from the child's nominal base and embedding offset.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts World height and a buried child-base coordinate are not implicitly parent stations.
   * @evidence contracts/common.md#meaningful-documentation All positions and physical source stations use calibration mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The factory owns source admission and plane inversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns the actual parent and original scalar preparation.
   */
  export interface IHost {
    /** Identical original parent, never a realized mesh. */
    part: IAutoMovieViewPart;
    /** Complete original signed-support/fullness/cap family. */
    source: AutoMovieLoftViewSource.ISource;
    /** World query point; only a non-null parameter certifies a bracketed native surface contact. */
    point: [number, number, number];
    /** Actual parent source station whose plane contains that attachment. */
    station: number;
    /** The actual parent plane at that station. */
    frame: AutoMovieLoftFrame.IFrame;
    /** Distance along the unchanged nominal child axis, mm; null for a plane-only query. */
    parameter: number | null;
  }

  /**
   * Original transverse curvature in the supplied query point's radial direction.
   *
   * @param host Actual parent source, original station, plane and supplied query point.
   * @returns Native transverse radius in calibration mm.
   *
   * @evidence contracts/common.md#principled-implementation Prepares the actual parent's four signed original supports, effective fullness and cap laws, then reads native phase derivatives in its actual section frame.
   * @evidence contracts/common.md#clear-and-simple-design The complete parent datum owns station and frame; no child-base coordinate selects them.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No output mesh, size proxy, reflected positive quarter or fabricated derivative supplies this radius; a broken native source throws.
   * @evidence contracts/common.md#meaningful-documentation A local transverse radius is not a whole-footprint containment or principal-curvature certificate.
   * @evidence contracts/performance.md#efficient-algorithms Fixed-count extent/fullness queries retain each already-prepared scalar owner's knot-search cost, followed by fixed-size native-quarter preparation and one phase/curvature reading; no scalar admission occurs here.
   * @evidence contracts/performance.md#reuse-equivalent-work One prepared complete source supplies the selected native section and its phase derivatives.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Native query geometry and local vectors are transient; only the radius escapes while the source/frame remain borrowed from IHost.
   */
  export function radius(host: IHost): number {
    const inputs: AutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(host.source, host.station);
    if (typeof inputs === "string")
      throw new Error(`Dome parent ${host.part.name}: ${inputs}`);
    const frame: AutoMovieLoftFrame.IFrame = host.frame;
    const local: [number, number] = [frame.u, frame.v].map(
      (direction: [number, number, number]): number =>
        direction.reduce(
          (sum: number, value: number, i: number): number =>
            sum + value * (host.point[i]! - frame.origin[i]!),
          0,
        ),
    ) as [number, number];
    const read: ReturnType<
      ReturnType<typeof AutoMovieLoftSectionNative.phase>
    > = AutoMovieLoftSectionNative.phase(inputs)(
      Math.atan2(local[1], local[0]),
    );
    const speed: number = Math.hypot(...read.t);
    const turn: number = Math.abs(
      read.t[0] * read.tt[1] - read.t[1] * read.tt[0],
    );
    const radius: number = speed ** 3 / turn;
    if (!(radius > 0 && Number.isFinite(radius)))
      throw new Error(
        `Dome parent ${host.part.name} has no finite positive transverse curvature`,
      );
    return radius;
  }

  /**
   * Locate a supplied placement point in the original source's parallel planes.
   *
   * @param parent Identical original parent source.
   * @param point World placement point, calibration mm, which may lie off the parent surface.
   * @returns Complete parent-plane datum in its own physical source station clock.
   *
   * @evidence contracts/common.md#principled-implementation Inverts the original axis plane equation over its declared source domain, then retains that exact frame and original scalar preparation.
   * @evidence contracts/common.md#clear-and-simple-design Explicit parallel-plane admission and one bracketed source-plane inverse precede native curvature reading.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No world-Y/station equivalence, child relocation, domain clamp, mesh footpoint or proxy fallback is assumed.
   * @evidence contracts/common.md#meaningful-documentation Parallel planes must bracket the supplied point; the result establishes its plane but not surface incidence. A missing plane is an explicit premise failure.
   * @evidence contracts/performance.md#efficient-algorithms Original scalar admission takes linear time/retained storage in parent knots. Constant endpoint reads and at most fifty-six inverse iterations retain the axis owner's at-query cost; each iteration uses fixed temporary storage.
   * @evidence contracts/performance.md#reuse-equivalent-work The shared plane inverse receives the identical admitted source; it performs no second admission.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned caller-owned parent datum survives; no global cache or emitted surface is retained.
   */
  export function attachment(
    parent: IAutoMovieViewPart,
    point: [number, number, number],
  ): IHost {
    const admitted: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(parent);
    if (admitted === null || admitted.source === null)
      throw new Error(
        `Dome parent ${parent.name} has no admitted original direct field`,
      );
    return locate(parent, admitted.source, point);
  }

  /**
   * First bracketed regular contact of the unchanged nominal cap axis and its original material parent.
   *
   * @evidence contracts/common.md#principled-implementation Searches the declared axis segment on original knot-plane intervals, using the complete signed native field and actual parallel planes. Exact endpoints remain authoritative; a missing bracket, point pole or unresolved 1e-8 mm radial residual is rejected rather than moved.
   * @evidence contracts/common.md#clear-and-simple-design One original admission and one contact owner serve every regional cap; placement anchors remain independent metadata.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No output mesh, domain extension, seed clamp, alternate parent or missing derivative supplies contact. Bracket detection does not certify unbracketed tangencies or the complete footprint.
   * @evidence contracts/common.md#meaningful-documentation The parameter is physical mm from the original nominal base toward its original apex; the first regular bracket is the explicit selection convention.
   * @evidence contracts/performance.md#efficient-algorithms Linear scalar admission, O(n) actual-axis site queries and O(n log n) source-site sorting precede endpoint/final readings and at most forty-eight bisections per bracket. A plane inverse retains up to fifty-six actual-axis queries and scalar lookup costs; fixed-plane readers reuse their located station.
   * @evidence contracts/performance.md#reuse-equivalent-work One admitted source serves the entire search and returned datum; fixed-plane frame and native phase preparation are shared by every residual query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources O(n) sites and local search readings are call-owned; only the selected original source/frame/contact survive in IHost.
   */
  export function contact(
    parent: IAutoMovieViewPart,
    dome: Omit<AutoMovieHumanHeadDome.IDome, "host">,
  ): IHost {
    const admitted: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(parent);
    if (admitted === null || admitted.source === null)
      throw new Error(
        `Dome parent ${parent.name} has no admitted original direct field`,
      );
    const source: AutoMovieLoftViewSource.ISource = admitted.source;
    const first: AutoMovieLoftFrame.IFrame = parent.axis.at(source.domain[0]);
    const normal: [number, number, number] = [
      first.v[1] * first.u[2] - first.v[2] * first.u[1],
      first.v[2] * first.u[0] - first.v[0] * first.u[2],
      first.v[0] * first.u[1] - first.v[1] * first.u[0],
    ];
    const dot: (value: readonly number[]) => number = (
      value: readonly number[],
    ): number =>
      normal.reduce(
        (sum: number, x: number, i: number): number => sum + x * value[i]!,
        0,
      );
    const rate: number = dot(dome.outward);
    const fixed: IHost | null =
      rate === 0 ? locate(parent, source, dome.origin) : null;
    const fields: readonly AutoMovieViewOutline.IOutline[] = [
      ...source.extents,
      ...(source.fullness.kind === "top"
        ? source.fullness.shoulders
        : [source.fullness.owner, ...(source.fullness.departures ?? [])]),
    ];
    const stations: number[] = [
      ...new Set([
        ...source.domain,
        ...parent.stations,
        ...fields.flatMap((outline: AutoMovieViewOutline.IOutline): number[] =>
          outline.knots.map(
            (knot: IAutoMovieViewPart.IKnot): number => knot.station,
          ),
        ),
        ...source.caps.flatMap(
          (cap: AutoMovieLoftViewSource.ISource["caps"][number]): number[] =>
            cap.near === null ? [cap.pole] : [cap.pole, cap.near],
        ),
      ]),
    ].filter(
      (station: number): boolean =>
        station >= source.domain[0] && station <= source.domain[1],
    );
    const parameters: Map<number, number> = new Map(
      rate === 0
        ? []
        : stations.map((station: number): [number, number] => [
            dot(
              parent.axis
                .at(station)
                .origin.map(
                  (value: number, i: number): number => value - dome.origin[i]!,
                ),
            ) / rate,
            station,
          ]),
    );
    const ends: number[] =
      rate === 0
        ? [0, dome.height]
        : source.domain.map(
            (station: number): number =>
              dot(
                parent.axis
                  .at(station)
                  .origin.map(
                    (value: number, i: number): number =>
                      value - dome.origin[i]!,
                  ),
              ) / rate,
          );
    const low: number = Math.max(0, Math.min(...ends));
    const high: number = Math.min(dome.height, Math.max(...ends));
    if (!(high > low))
      throw new Error(
        `Dome ${dome.name} has no nominal-axis interval in original parent ${parent.name}`,
      );
    const sites: number[] = [
      ...new Set([
        low,
        ...(rate === 0 ? [dome.height / 2] : [...parameters.keys()]).filter(
          (value: number): boolean => value > low && value < high,
        ),
        high,
      ]),
    ].sort((a: number, b: number): number => a - b);
    const values: AutoMovieLoftViewRead.IValues | string | null =
      fixed === null
        ? null
        : AutoMovieLoftViewRead.values(source, fixed.station);
    if (typeof values === "string")
      throw new Error(`Dome parent ${parent.name}: ${values}`);
    const phase: ReturnType<typeof AutoMovieLoftSectionNative.phase> | null =
      values === null ||
      values.extents.some((extent: number): boolean => extent === 0)
        ? null
        : AutoMovieLoftSectionNative.phase(values);
    const read: (parameter: number) => {
      host: IHost;
      residual: number;
      regular: boolean;
    } = (
      parameter: number,
    ): { host: IHost; residual: number; regular: boolean } => {
      const point: [number, number, number] = dome.origin.map(
        (value: number, i: number): number =>
          value + parameter * dome.outward[i]!,
      ) as [number, number, number];
      const known: number | undefined = parameters.get(parameter);
      const host: IHost =
        fixed !== null
          ? { ...fixed, point, parameter }
          : known === undefined
            ? { ...locate(parent, source, point), parameter }
            : {
                part: parent,
                source,
                point,
                station: known,
                frame: parent.axis.at(known),
                parameter,
              };
      if (
        Math.hypot(
          ...host.frame.u.map(
            (value: number, i: number): number => value - first.u[i]!,
          ),
          ...host.frame.v.map(
            (value: number, i: number): number => value - first.v[i]!,
          ),
        ) > 1e-9
      )
        throw new Error(
          `Dome parent ${parent.name} has nonparallel contact planes`,
        );
      if (
        Math.abs(
          dot(
            point.map(
              (value: number, i: number): number =>
                value - host.frame.origin[i]!,
            ),
          ),
        ) > 1e-8
      )
        throw new Error(
          `Dome ${dome.name} contact has no resolved original parent plane`,
        );
      const inputs: AutoMovieLoftViewRead.IValues | string =
        values ?? AutoMovieLoftViewRead.values(source, host.station);
      if (typeof inputs === "string")
        throw new Error(`Dome parent ${parent.name}: ${inputs}`);
      const local: [number, number] = [host.frame.u, host.frame.v].map(
        (axis: [number, number, number]): number =>
          axis.reduce(
            (sum: number, x: number, i: number): number =>
              sum + x * (point[i]! - host.frame.origin[i]!),
            0,
          ),
      ) as [number, number];
      if (inputs.extents.every((extent: number): boolean => extent === 0))
        return { host, residual: Math.hypot(...local), regular: false };
      if (inputs.extents.some((extent: number): boolean => extent === 0))
        throw new Error(`Dome ${dome.name} reached a singular parent section`);
      const native: ReturnType<
        ReturnType<typeof AutoMovieLoftSectionNative.phase>
      > = (phase ?? AutoMovieLoftSectionNative.phase(inputs))(
        Math.atan2(local[1], local[0]),
      );
      return {
        host,
        residual: Math.hypot(...local) - Math.hypot(...native.p),
        regular: true,
      };
    };
    for (let index: number = 1; index < sites.length; index++) {
      let a: number = sites[index - 1]!;
      let b: number = sites[index]!;
      const start: ReturnType<typeof read> = read(a);
      const end: ReturnType<typeof read> = read(b);
      if (start.regular && start.residual === 0) return start.host;
      if (end.regular && end.residual === 0) return end.host;
      if (
        (!start.regular && start.residual === 0) ||
        (!end.regular && end.residual === 0)
      )
        throw new Error(
          `Dome ${dome.name} contact bracket reaches a point pole`,
        );
      if (start.residual > 0 === end.residual > 0) continue;
      for (let iteration: number = 0; iteration < 48; iteration++) {
        const middle: number = (a + b) / 2;
        const value: ReturnType<typeof read> = read(middle);
        if (!value.regular)
          throw new Error(`Dome ${dome.name} contact reached a point pole`);
        if (value.residual > 0 === start.residual > 0) a = middle;
        else b = middle;
      }
      const selected: ReturnType<typeof read> = read((a + b) / 2);
      if (
        selected.regular &&
        Number.isFinite(selected.residual) &&
        Math.abs(selected.residual) <= 1e-8
      )
        return selected.host;
      throw new Error(
        `Dome ${dome.name} regular contact residual did not resolve within 1e-8 mm`,
      );
    }
    throw new Error(
      `Dome ${dome.name} has no bracketed regular contact with original parent ${parent.name}`,
    );
  }

  /**
   * Locate a plane using an already-admitted identical parent source.
   *
   * @evidence contracts/common.md#principled-implementation Uses original parallel-plane bracketing and preserves exact domain endpoint incidence.
   * @evidence contracts/common.md#clear-and-simple-design Plane-only and surface-contact factories share one inverse without another admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An unbracketed point throws rather than clamping or assuming a world-coordinate station.
   * @evidence contracts/common.md#meaningful-documentation Returns parameter null because plane incidence alone is not a surface contact.
   * @evidence contracts/performance.md#efficient-algorithms At most fifty-six actual-axis queries, each retaining its owner's cost, with fixed vector storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Borrows its caller's original source admission.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns only the caller-owned source/frame query datum.
   */
  function locate(
    parent: IAutoMovieViewPart,
    source: AutoMovieLoftViewSource.ISource,
    point: [number, number, number],
  ): IHost {
    const first: AutoMovieLoftFrame.IFrame = parent.axis.at(source.domain[0]);
    const normal: [number, number, number] = [
      first.v[1] * first.u[2] - first.v[2] * first.u[1],
      first.v[2] * first.u[0] - first.v[0] * first.u[2],
      first.v[0] * first.u[1] - first.v[1] * first.u[0],
    ];
    const plane: (station: number) => number = (station: number): number => {
      const frame: AutoMovieLoftFrame.IFrame = parent.axis.at(station);
      if (
        Math.hypot(
          ...frame.u.map(
            (value: number, i: number): number => value - first.u[i]!,
          ),
          ...frame.v.map(
            (value: number, i: number): number => value - first.v[i]!,
          ),
        ) > 1e-9
      )
        throw new Error(
          `Dome parent ${parent.name} requires an explicit attachment for its nonparallel source planes`,
        );
      const value: number = normal.reduce(
        (sum: number, component: number, i: number): number =>
          sum + component * (point[i]! - frame.origin[i]!),
        0,
      );
      if (!Number.isFinite(value))
        throw new Error(
          `Dome parent ${parent.name} has a nonfinite attachment plane`,
        );
      return value;
    };
    let low: number = source.domain[0];
    let high: number = source.domain[1];
    const start: number = plane(low);
    const end: number = plane(high);
    if (start !== 0 && end !== 0 && start > 0 === end > 0)
      throw new Error(
        `Dome parent ${parent.name} source planes [${low}, ${high}] do not bracket anatomical attachment [${point}]`,
      );
    let station: number;
    if (start === 0) station = low;
    else if (end === 0) station = high;
    else {
      let value: number = start;
      for (let i: number = 0; i < 56; i++) {
        const middle: number = (low + high) / 2;
        const next: number = plane(middle);
        if (next > 0 === value > 0) {
          low = middle;
          value = next;
        } else high = middle;
      }
      station = (low + high) / 2;
    }
    return {
      part: parent,
      source,
      point: [...point],
      station,
      frame: parent.axis.at(station),
      parameter: null,
    };
  }
}
