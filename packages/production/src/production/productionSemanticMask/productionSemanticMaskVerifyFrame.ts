

/**
 * Refuse any frame identity that is not a non-negative safe integer; no frame-rate conversion or current-plan membership is performed.
 *
 * @evidence contracts/common.md#principled-implementation Number.isSafeInteger and a non-negative range check encode the portable integer identity used by receipt and expected frame records.
 * @evidence contracts/common.md#clear-and-simple-design One scalar guard is shared by receipt creation/reopen while plan scheduling remains with its separate predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rounding, clamping or fixture offset changes a claimed frame to make it admissible.
 * @evidence contracts/common.md#meaningful-documentation Documents safe-integer range, identity-only scope and thrown invalid-frame error; the frame is not a seconds measurement.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of scalar checks and invalid-value formatting have constant field count; no frame list or payload is visited.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The scalar check coordinates no completed or in-flight work and needs no cache for a single identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It acquires no resources or retained state; only a rejected invocation creates its ordinary Error record.
 */
export const productionSemanticMaskVerifyFrame: (frame: number) => void = (frame: number): void => {
    if (Number.isSafeInteger(frame) === false || frame < 0)
        throw new Error(`invalid semantic receipt frame ${String(frame)}; expected a non-negative safe integer`);
};
