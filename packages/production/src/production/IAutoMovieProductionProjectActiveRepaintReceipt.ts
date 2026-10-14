

/**
 * Stored active-selection pointer resolved through the verified repaint lineage.
 *
 * @evidence contracts/common.md#principled-implementation Carries version, shot and the selected record/receipt/output addresses; the consuming inspector verifies their lineage and resident bytes instead of accepting the pointer as self-authenticating evidence.
 * @evidence contracts/common.md#clear-and-simple-design Keeps the active pointer separate from immutable candidate receipts and historical selection records so reversal can choose another admitted lineage without rewriting candidate bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts String paths have no branded trust or digest proof in this shape; inspectors and current receipt gates own schema, routing and byte admission for all shots.
 * @evidence contracts/common.md#meaningful-documentation Documents each address's role and version two storage contract, distinguishing active author selection from verified media identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record chooses no algorithm; selection publication and verified inspectors own JSON, path, lineage and byte-check costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stored pointer is data rather than a coordinator; changing the active selection invalidates dependent lineage decisions in its consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One active record per selected shot remains repository-owned; parsed records transfer to inspectors, with no handle, task or byte payload stored by this type.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectActiveRepaintReceipt {
    /** Active pointer schema version. */
    version: 2;

    /** Shot addressed by this selection. */
    shot: string;

    /** Production-state relative immutable selection record path. */
    selection: string;

    /** Production-state relative candidate receipt path. */
    receipt: string;

    /** Render-root relative output payload path. */
    output: string;
}
