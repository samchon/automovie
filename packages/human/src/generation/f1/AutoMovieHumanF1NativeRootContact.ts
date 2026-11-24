import {
  AutoMovieHumanNativeRadialContact as Radial,
} from "../conic/AutoMovieHumanNativeRadialContact";
import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidVector as Vector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPointSeed,
  IAutoMovieConstructionSeed,
  IAutoMovieHumanF1NativeRoot,
  IAutoMovieHumanNativeRadialContact,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The seeds of the native path's dependent cutters (the armpit's slit and the nostrils) once their root or source has changed. A literal
 * unchanged root keeps its original search. A cutter whose host is a source face (the nostrils, cut from the nose) is seeded where its
 * declared seed line enters that source, derived from both sources (`AutoMovieHumanNativeRadialContact`). A cutter whose host is a band
 * (the armpit's slit on `band.arm`) has no host chart before the band is realized; its stored contact chart stays until the armpit
 * worker's measurement of the slit's trace decides that seed.
 */
export namespace AutoMovieHumanF1NativeRootContact {
  /** A stored contact in kernel mm/radians and its actual face names. */
  interface IPrior {
    /** Exact original source name and host chart owner. */
    host: string;
    /** Cutter material coordinate, mm/radians. */
    part: readonly [number, number];
    /** Host source or mean-chord band chart coordinate, mm/radians. */
    hostAt: readonly [number, number];
  }

  /**
   * PENDING the armpit worker's report on the slit's trace failure, which decides this seed: f1's operator contact observations for the
   * armpit's slit on its band, copied from human/.shots/native-round-20261117-0404/f1.json, operators.rows[owner,kind=diff-seed].actual
   * (SHA256 68f77cc5a906ecbc4641c39c162a10fef162310633a7952973a16ef25f4659f3; also in f1.operator-inputs.json meet-end events, SHA256
   * f6a58805543598b1e7894da4221543ee8d0ca3cf040e3dc4b6ede602af506c61). Coordinates read from an output, kept unchanged on purpose until
   * that report; not a law.
   */
  const priors: Readonly<Record<string, IPrior>> = {
    axilla: {
      host: "band.arm",
      part: [60.08331920799109, 4.6173],
      hostAt: [4.765832185216082, 2.624174206673892],
    },
    "axilla.mirror": {
      host: "band.arm.mirror",
      part: [60.22930831330246, 1.665885307179586],
      hostAt: [4.725353630062723, 2.621805885270596],
    },
  };

  /** One emitted seed and detached observations of the input prior's source scope. */
  export interface IResult {
    /** Closed existing engine search/point input, with one mm-to-m conversion. */
    seed: IAutoMovieConstructionSeed;
    /** Source-addressed observations, not proof that Newton finds a contact. */
    observation: IAutoMovieHumanF1NativeRoot.ISeedTransport;
  }

  /**
   * The seed of a changed or unchanged dependent cutter. `host`, the host's own source, is present exactly when the host face is a source
   * (the nose for the nostrils): its seed is derived. Absent, the host is a band and the stored chart applies (the armpit's slit, pending).
   *
   * @evidence contracts/development/implementation.md#principled-implementation An unchanged root keeps its transported original search; a source host is seeded where the declared seed line (its phase and material window) enters the host's current source; a band host keeps its declared pending chart.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three explicit branches decided by the root's identity and by whether the host is a source, not by a cutter's name.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact is read from an output for a source host; a seed outside either current domain is refused without clipping, widening or retry.
   * @evidence contracts/development/common.md#meaningful-documentation States units (mm and radians here, metres in the emitted seed) and the pending armpit scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms One reader per source and one radial scan of 64 steps plus a bracketed root.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call serves one cutter.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Readers live for the call; the result holds plain numbers.
   */
  export function create(
    spec: IAutoMovieHumanF1NativeRoot.IRootSpec,
    before: IAutoMovieViewPart,
    current: IAutoMovieViewPart,
    old: IAutoMovieHumanF1NativeRoot.ISeed,
    hostFace: string,
    host?: IAutoMovieViewPart,
  ): IResult {
    if (spec.unchanged) {
      const observation: IAutoMovieHumanF1NativeRoot.ISeedTransport = spec.seed(before, current, old);
      if (observation.unchanged)
        return {
          seed: { type: "search", partFace: current.name, hostFace, ...observation.seed },
          observation,
        };
    }
    const source: IAutoMovieLoftViewFullSource.IReader = Full.create(current);
    const oldSource: IAutoMovieLoftViewFullSource.IReader = Full.create(before);
    if (host !== undefined) {
      if (host.name !== hostFace)
        throw new Error("named contact host source identity mismatch");
      return derived(current, source, oldSource, old, hostFace, host);
    }
    const prior: IPrior | undefined = priors[current.name];
    if (prior === undefined || prior.host !== hostFace)
      throw new Error("named original contact chart absent or host mismatch: " + current.name);
    if (!(prior.part[0] >= source.domain[0] && prior.part[0] <= source.domain[1]))
      throw new Error("named point prior leaves the current cutter material domain: " + current.name);
    const point: AutoMovieVector3Tuple = source.point(...prior.part);
    const target: AutoMovieVector3Tuple = oldSource.point(...prior.part);
    const seed: IAutoMovieConstructionPointSeed = {
      type: "point", partFace: current.name, hostFace,
      part: [prior.part[0] / 1000, prior.part[1]],
      host: [prior.hostAt[0] / 1000, prior.hostAt[1]],
    };
    return {
      seed,
      observation: {
        seed: { ...old }, unchanged: false, pointSeed: seed,
        controls: [{
          original: [...prior.part], actual: [...prior.part],
          target, point, residual: Vector.sub(point, target), sourceClock: null,
        }],
        qualification: "PENDING armpit report: stored contact-chart copied from an output; band host coordinate is the actual band's mean-chord cross chart, not physical arclength; actual band domain by source operator admission before Newton; convergence/contact remains independently observed",
      },
    };
  }

  /** The seed where the cutter's declared seed line, its phase over its material window shares, enters the host source. */
  function derived(
    current: IAutoMovieViewPart,
    source: IAutoMovieLoftViewFullSource.IReader,
    oldSource: IAutoMovieLoftViewFullSource.IReader,
    old: IAutoMovieHumanF1NativeRoot.ISeed,
    hostFace: string,
    host: IAutoMovieViewPart,
  ): IResult {
    if (!(Number.isFinite(old.phase) && old.from >= 0 && old.to <= 1 && old.to > old.from))
      throw new Error("cutter seed window/phase must be finite and ordered");
    const hostSource: IAutoMovieLoftViewFullSource.IReader = Full.create(host);
    const span: number = source.domain[1] - source.domain[0];
    const found: IAutoMovieHumanNativeRadialContact.IResult = Radial.seed(
      (s: number): readonly number[] => source.point(s, old.phase),
      source.domain[0] + old.from * span,
      source.domain[0] + old.to * span,
      {
        at: (s: number) => host.axis.at(s),
        point: (s: number, t: number): readonly number[] => hostSource.point(s, t),
        domain: hostSource.domain,
      },
    );
    const seed: IAutoMovieConstructionPointSeed = {
      type: "point", partFace: current.name, hostFace,
      part: [found.part / 1000, old.phase],
      host: [found.host[0] / 1000, found.host[1]],
    };
    const original: AutoMovieVector3Tuple = oldSource.point(found.part, old.phase);
    return {
      seed,
      observation: {
        seed: { ...old }, unchanged: false, pointSeed: seed,
        controls: [{
          original: [found.part, old.phase], actual: [found.part, old.phase],
          target: found.target, point: found.point, residual: Vector.sub(found.point, found.target), sourceClock: null,
        }, {
          original: [found.part, old.phase], actual: [found.part, old.phase],
          target: original, point: found.point, residual: Vector.sub(found.point, original), sourceClock: null,
        }],
        qualification: "derived radial seed: the cutter's declared seed line (phase, material window shares) entering the host source's star-shaped sections about its straight course; first control residual = part point minus host chart point, second = current minus original cutter point at the same material coordinate; convergence/contact remains independently observed",
      },
    };
  }
}
