/** Freeze only strictly violated inequality rows for finite-difference probes. Exact one-sided boundaries remain free to depart into slack; equal finite sides use one signed row selected to match the current nonlinear error. Nonlinear merit remains clamped separately. */
export function linearizePhysicalInterval(
  value: number,
  minimum?: number,
  maximum?: number,
): (probe: number) => number[] {
  const equality: boolean = minimum !== undefined && minimum === maximum;
  return (probe: number): number[] => [
    ...(minimum !== undefined
      ? [
          (equality && value <= minimum) || value < minimum
            ? probe - minimum
            : 0,
        ]
      : []),
    ...(maximum !== undefined ? [value > maximum ? probe - maximum : 0] : []),
  ];
}
