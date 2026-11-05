import { AutoMovieLoftChain, AutoMovieLoftFrameSource, type IAutoMovieLoftChain, type AutoMovieLoftFrame } from "@automovie/engine";

/**
 * The neck's internal overlap ring as the remaining old shoulders read it.
 * The actual head source owns this ring; it is not the public base tape or
 * named side-neck point. The old solver reads sampled world supports and a
 * finite-difference lateral jet, while the chain boundary copies the actual
 * layer's coefficient/frame jets. Those are different reading contracts.
 *
 * @evidence contracts/common.md#principled-implementation Reads the actual ring in world space and preserves the regular boundary's coefficient/frame product-rule data, separately from the old sampled support estimate.
 * @evidence contracts/common.md#clear-and-simple-design One transitional reader exposes the old solver's support record and the chain's distinct boundary copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No independent neck skin, fitted landmark, coordinate-dropping copy or invented pole station derivative replaces the actual owner.
 * @evidence contracts/common.md#meaningful-documentation Names the internal overlap, sampled legacy derivative, regular source boundary, coordinate premises and unfinished public neck tapes.
 * @evidence contracts/performance.md#efficient-algorithms Uses four fixed 512-phase ring reads for legacy supports and linear coefficient/lift copying for the boundary; it builds no additional neck or body.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the existing chain's bounded sampler owner and immutable actual frame source instead of reconstructing that axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fixed support records and copied coefficient/lift arrays; the receiving definition borrows frame/source records until it is released, without a new global cache.
 */
export namespace AutoMovieHumanTrunkNeckSeat {
  /** The ring's lateral outline: the left extreme as a function of height at the ring's bottom. */
  export interface ILateral {
    /** Height of the ring, mm. */
    y: number;

    /** Half width: the left extreme's lateral place, mm. */
    z: number;

    /** First derivative of the extreme with respect to height, mm per mm. */
    slope: number;

    /** Second derivative of the extreme with respect to height, mm per mm squared. */
    curvature: number;
  }

  /** The neck's bottom ring. */
  export interface ISeat {
    /** Mean height, mm. */
    y: number;

    /** Half width: the left side neck point's lateral place, mm. */
    width: number;

    /** Forward place of the widest point, mm. */
    middle: number;

    /** The ring's point on the front midline. */
    front: [number, number, number];

    /** The ring's point on the back midline. */
    back: [number, number, number];

    /** Internal overlap ring's left lateral support; not a recovered public side-neck landmark. */
    side: [number, number, number];

    /** The lateral outline's jet at the ring's bottom. */
    lateral: ILateral;
  }

  /** Phases the ring is sampled at. */
  const COUNT: number = 512;

  /** Spacing of the heights the lateral outline's derivatives are read over, mm: wide enough to stay clear of the sampling, narrow against the 20 mm flare. */
  const STEP: number = 1.5;

  /**
   * Read the neck's bottom ring.
   *
   * @param neck The neck chain, named `head`.
   * @returns Its landmarks and lateral outline.
   */
  export function read(neck: IAutoMovieLoftChain): ISeat {
    const y: number = neck.layers[0]!.y;
    const ring: [number, number, number][] = ringAt(neck, y);

    // This internal ring's side support is its most lateral point on +z.
    let side: [number, number, number] = ring[0]!;
    for (const p of ring) if (p[2] > side[2]) side = p;

    return {
      y,
      width: side[2],
      middle: side[0],
      front: ring[0]!,
      back: ring[COUNT / 2]!,
      side,
      lateral: lateral(neck, y),
    };
  }

  /**
   * The lateral outline's value and its first two derivatives at a height,
   * by one-sided differences over three heights `STEP` apart (second order),
   * since the ring is the chain's first and the outline is read upward.
   *
   * @param neck The neck chain.
   * @param y Height of the ring's bottom, mm.
   * @returns The outline's jet.
   */
  export function lateral(neck: IAutoMovieLoftChain, y: number): ILateral {
    const extreme = (h: number): number => Math.max(...ringAt(neck, h).map((p: [number, number, number]): number => p[2]));
    const z0: number = extreme(y);
    const z1: number = extreme(y + STEP);
    const z2: number = extreme(y + 2 * STEP);

    return {
      y,
      z: z0,
      slope: (-3 * z0 + 4 * z1 - z2) / (2 * STEP),
      curvature: (z0 - 2 * z1 + z2) / (STEP * STEP),
    };
  }

  /**
   * The neck's bottom layer as the shoulders' top layer (rule J3): its
   * coefficients, lift and slopes, and as its curvatures the second station
   * derivative of the neck's own first interval at its start, so the
   * shoulders' last interval meets the neck's first with the same curvature.
   * The current neck's coefficients are frame-relative, whereas old trunk
   * coefficients are world-horizontal. Its level frame, both station jets
   * and actual owner must therefore survive beside the coefficients. The
   * receiving family explicitly frames its old rows before its Hermite solve.
   * This regular boundary uses physical-station jets, not singular pole jets.
   * The +X/+Z basis must be fixed through both derivative orders and world
   * height must advance one mm per station mm. Existing frame/source/view
   * records are borrowed immutably for the receiving definition's lifetime;
   * coefficient and lift arrays are copied. A stale owner or an unsupported
   * chart throws before any alternate geometry is built. The source validator
   * owns snapshot consistency; these checks own the old trunk's chart premise.
   *
   * @param neck The neck chain.
   * @returns A layer carrying the neck's jets at its bottom.
   * @evidence contracts/common.md#principled-implementation Retains the same regular station, coefficients, frame, first/second station jets and actual axis owner; only an originally unframed world-horizontal layer receives its exact identity-plane interpretation.
   * @evidence contracts/common.md#clear-and-simple-design Returns one explicit boundary record for the receiver's identity-framed horizontal family.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The central source validator checks snapshot ownership; unsupported coordinates or incomplete lift jets throw instead of being dropped, levelled or zero-filled as measured data.
   * @evidence contracts/common.md#meaningful-documentation States root versus physical jets, fixed-plane derivative premises, immutable borrowing and changed old-family interpolation.
   * @evidence contracts/performance.md#efficient-algorithms Copies O(N) coefficients and optional lift arrays with constant frame validation; no mesh or complete source is rebuilt.
   * @evidence contracts/performance.md#reuse-equivalent-work Borrows the unchanged frame/source snapshots and keeps the owner's existing coefficient curvatures when supplied.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned numeric arrays and borrows immutable geometry records for the receiver's definition lifetime, without retaining the input chain globally.
   */
  export function layer(neck: IAutoMovieLoftChain): IAutoMovieLoftChain.ILayer {
    const a: IAutoMovieLoftChain.ILayer = neck.layers[0]!;
    const b: IAutoMovieLoftChain.ILayer = neck.layers[1]!;
    const H: number = b.y - a.y;
    AutoMovieLoftFrameSource.validate(a);
    if (a.frame !== undefined && (a.frame.origin[1] !== a.y || a.frame.u.some((v: number, i: number): boolean => v !== [1, 0, 0][i]) || a.frame.v.some((v: number, i: number): boolean => v !== [0, 0, 1][i]) || a.frameSlopes === undefined || a.frameCurvatures === undefined)) throw new Error("The old trunk needs a regular level +X/+Z neck boundary at the same world height");
    const frame: AutoMovieLoftFrame.IFrame = a.frame ?? { origin: [0, a.y, 0], u: [1, 0, 0], v: [0, 0, 1] };
    const frameSlopes: AutoMovieLoftFrame.IFrame = a.frameSlopes ?? { origin: [0, 1, 0], u: [0, 0, 0], v: [0, 0, 0] };
    const frameCurvatures: AutoMovieLoftFrame.IFrame = a.frameCurvatures ?? { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] };
    if (frameSlopes.origin[1] !== 1 || frameCurvatures.origin[1] !== 0 || [...frameSlopes.u, ...frameSlopes.v, ...frameCurvatures.u, ...frameCurvatures.v].some((value: number): boolean => value !== 0)) throw new Error("The old trunk needs unit world-height station speed and a fixed +X/+Z boundary basis through second order");
    if ((a.lift !== undefined && a.liftSlopes === undefined) || (a.lift === undefined && a.liftCurvatures !== undefined)) throw new Error("The neck boundary has incomplete lift station jets");

    // A cubic Hermite interval of width H with end values f0, f1 and slopes
    // m0, m1 has f'' at its start of (6 (f1 - f0) / H - 4 m0 - 2 m1) / H.
    const curvatures: number[] = a.coefficients.map((f0: number, i: number): number =>
      a.curvatures !== undefined
        ? a.curvatures[i]!
        : (6 * (b.coefficients[i]! - f0)) / (H * H) - (4 * a.slopes[i]! + 2 * b.slopes[i]!) / H,
    );

    return {
      y: a.y,
      coefficients: [...a.coefficients],
      slopes: [...a.slopes],
      curvatures,
      frame,
      frameSlopes,
      frameCurvatures,
      ...(a.frameSource === undefined ? {} : { frameSource: a.frameSource }),
      ...(a.coefficientSource === undefined ? {} : { coefficientSource: a.coefficientSource }),
      ...(a.view === undefined ? {} : { view: a.view }),
      ...(a.lift !== undefined ? { lift: [...a.lift], liftSlopes: [...a.liftSlopes!] } : {}),
      ...(a.liftCurvatures === undefined ? {} : { liftCurvatures: [...a.liftCurvatures] }),
    };
  }

  /**
   * The ring at a height at uniform phases.
   *
   * @param neck The neck chain.
   * @param y Height, mm.
   * @returns The ring's points.
   */
  function ringAt(neck: IAutoMovieLoftChain, y: number): [number, number, number][] {
    return AutoMovieLoftChain.ring(
      neck,
      y,
      Array.from({ length: COUNT }, (_: unknown, i: number): number => (2 * Math.PI * i) / COUNT),
    );
  }
}
