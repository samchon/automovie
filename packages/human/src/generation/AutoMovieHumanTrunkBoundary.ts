import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";

/** Preserve the neck's entire shared periodic boundary without a second inverse filter. */
export namespace AutoMovieHumanTrunkBoundary {
  /** Upper column with the original neck position coefficients and axial lift at its top. */
  export function attach(neck: Chain, upper: Chain): Chain {
    if (neck.basis !== "spline" || upper.basis !== "spline" || neck.order !== upper.order || neck.layers[0]!.frame !== undefined || upper.layers.at(-1)!.frame !== undefined)
      throw new Error("The upper column needs the neck's shared unframed spline basis", { cause: { stage: "full neck boundary", chains: [neck.name, upper.name], observed: { basis: neck.basis, order: neck.order }, expected: { basis: "spline", order: upper.order } } });
    const source: Chain.ILayer = neck.layers[0]!;
    const end: Chain.ILayer = upper.layers.at(-1)!;
    const joined: Chain.ILayer = { ...end, coefficients: [...source.coefficients], lift: Array.from({ length: upper.order }, (_: unknown, index: number): number => (source.lift?.[index] ?? 0) + source.y - end.y), liftSlopes: end.liftSlopes ?? new Array<number>(upper.order).fill(0) };
    if (end.curvatures !== undefined) joined.liftCurvatures ??= new Array<number>(upper.order).fill(0);
    return { ...upper, layers: [...upper.layers.slice(0, -1), joined] };
  }
}
