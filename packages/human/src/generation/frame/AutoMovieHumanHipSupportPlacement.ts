import type {
  IAutoMovieHumanBodyIdentity,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * Place a supplied hip-support separation before skin construction.
 * In the fixed bilateral pelvis frame z=0, the stored-side support is B/2
 * and the existing reflection supplies -B/2. AP, height, reference rotations
 * and every other relative record are independent inputs and remain unchanged.
 * The caller supplies a complete valid chain with exactly one selected support
 * joint and the stated pelvis-frame convention; this function does not infer
 * clinical joints, validate arbitrary topology or pin a distal world stance.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Bilateral separation in the declared pelvis frame gives the signed support half-span B/2; only the selected joint's lateral offset changes and descendants follow the actual chain composer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure model places the supplied skeleton and supports made-input verification.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires an explicit finite-positive breadth within the existing BodyIdentity field's 800mm maximum; no clinical regression, missing-input prior, skin displacement or distal compensation is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation Names frame, signed sides, independent preserved inputs and the trusted topology/frame premises separately from clinical identity.
 * @evidence contracts/development/implementation.md#efficient-algorithms One joint lookup and at most one chain copy use linear work/storage in joint count; an identical half-span returns the original chain.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The unchanged input preserves chain identity for the existing reference-frame reuse; changed input borrows every unchanged record and rotation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A changed result owns one chain array, one joint and its three-component offset; all remaining immutable records are borrowed for reader lifetime, without a cache or process.
 */
export function AutoMovieHumanHipSupportPlacement(
  inputs: Required<Pick<IAutoMovieHumanBodyIdentity, "hipJointCentreBreadth">>,
  chain: readonly IAutoMovieHumanSegmentJoint[],
  joint: string,
): readonly IAutoMovieHumanSegmentJoint[] {
  const breadth: number = inputs.hipJointCentreBreadth;
  if (
    !(
      Number.isFinite(breadth) &&
      breadth > 0 &&
      breadth <= 800 &&
      breadth / 2 > 0
    )
  )
    throw new Error(
      "hipJointCentreBreadth must be finite and in (0,800] mm with a representable positive half-span",
    );
  const selected: number = chain.findIndex(
    (entry: IAutoMovieHumanSegmentJoint): boolean => entry.name === joint,
  );
  if (selected < 0) throw new Error("Hip support joint is absent: " + joint);
  const half: number = breadth / 2;
  const original: IAutoMovieHumanSegmentJoint = chain[selected]!;
  if (original.offset[2] === half) return chain;
  return chain.map(
    (entry: IAutoMovieHumanSegmentJoint, index: number): IAutoMovieHumanSegmentJoint =>
      index === selected
        ? { ...entry, offset: [entry.offset[0], entry.offset[1], half] }
        : entry,
  );
}
