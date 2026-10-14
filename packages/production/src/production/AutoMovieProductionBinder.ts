import * as fs from "node:fs/promises";
import * as path from "node:path";
import { productionBinderGroupedDocumentLayers } from "./binder/productionBinderGroupedDocumentLayers";
import { AutoMovieAuthoredDocumentLayer } from "./binder/AutoMovieAuthoredDocumentLayer";
import { AutoMovieProductionDocumentPass } from "./binder/AutoMovieProductionDocumentPass";
import { IAutoMovieProductionBindRequest } from "./binder/IAutoMovieProductionBindRequest";
import { IAutoMovieProductionBinderAuthoredDocument } from "./binder/IAutoMovieProductionBinderAuthoredDocument";
import { IAutoMovieProductionBinderAuthoredDocumentGroup } from "./binder/IAutoMovieProductionBinderAuthoredDocumentGroup";
import { productionBinderLayers } from "./binder/productionBinderLayers";
import { validateAutoMovieProductionDocumentAncestors } from "./binder/validateAutoMovieProductionDocumentAncestors";
import { productionBinderPublishEdition } from "./binder/productionBinderPublishEdition";
import { productionBinderProspectiveRealpath } from "./binder/productionBinderProspectiveRealpath";
import { productionBinderReadFlatLayer } from "./binder/productionBinderReadFlatLayer";
import { productionBinderReadGroupedLayer } from "./binder/productionBinderReadGroupedLayer";
import { productionBinderRebaseHeadings } from "./binder/productionBinderRebaseHeadings";
import { productionBinderStem } from "./binder/productionBinderStem";
import { productionBinderAssertOutputSeparatedFromDocs } from "./binder/productionBinderAssertOutputSeparatedFromDocs";

/**
 * Bind one authored production layer into a deterministic reader-facing Markdown edition.
 *
 * @evidence contracts/common.md#principled-implementation Constructor admission chooses the authored layer/pass and separated output, then markdown assembles deterministically ordered reader text and bind publishes it through an exclusive temporary and no-clobber link. Ordinary Node filesystem observations are not an atomic source snapshot.
 * @evidence contracts/common.md#clear-and-simple-design The public constructor, readonly fields and markdown/bind methods remain the same; file-named internal helpers own path, document, marker and publication behavior. The repository currently has no application invocation of this reader API beyond tests and its exported surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported layer/pass and output separation checks are uniform; existing different output bytes refuse instead of overwriting. The supported heading/fence/comment transformations are not a complete CommonMark parser or a hostile-writer filesystem sandbox.
 * @evidence contracts/common.md#meaningful-documentation Documents selected docs tree, grouped versus flat reader topology, exact output naming, optional construction default, transformation limits and propagated native/refusal failures. No PDF or other converter is owned here.
 * @evidence contracts/performance.md#efficient-algorithms Includes full selected directory enumeration/sorting and total Markdown-byte reads/transforms, edition concatenation, output-path observations and final write/sync/link or existing-byte comparison; total population and text length drive work and memory.
 * @evidence contracts/performance.md#reuse-equivalent-work One instance retains its validated routing fields and shares module patterns/layer sets; every markdown or bind call rereads current source and no source snapshot or in-flight publication cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance owns only routing strings; parsed document populations and complete edition strings are per invocation. Publication attempts close their temporary/reader handles and remove temporaries in finally; cleanup failures can mask earlier failures or leave already linked output, so host release and rollback are not certified.
 */
export class AutoMovieProductionBinder {
    /** Absolute generated-project root this binder reads. */
    public readonly root: string;

    /** Reader-facing title written as the edition's sole H1. */
    public readonly title: string;

    /** Authored layer this binder reads. */
    public readonly layer: AutoMovieAuthoredDocumentLayer;

    /** Physical authored pass this binder reads. */
    public readonly pass: AutoMovieProductionDocumentPass;

    /** Absolute physical authored tree selected by {@link pass}. */
    public readonly source: string;

    /** Stable filename used when the derived edition is published. */
    public readonly filename: string;

    /** Absolute directory the derived Markdown file is written beneath. */
    public readonly output: string;

    /** Creates a binder for one project-owned authored layer. */
    public constructor(request: IAutoMovieProductionBindRequest) {
        this.root = path.resolve(request.root);
        this.title = request.title.trim();
        this.layer = request.layer;
        this.pass = request.pass ?? "construction";
        this.output = path.resolve(request.output ?? path.join(this.root, "artifacts"));
        if (this.title.length === 0)
            throw new Error("A reader-facing production title is required.");
        if (/\r|\n/u.test(this.title))
            throw new Error("A reader-facing production title must be one line.");
        if (!productionBinderLayers.has(this.layer))
            throw new Error(`Unknown authored document layer: ${String(this.layer)}`);
        if (this.pass !== "construction" && this.pass !== "final")
            throw new Error(`Unknown authored document pass: ${String(this.pass)}`);
        if (this.pass === "final" && this.layer !== "screenplays")
            throw new Error("Only screenplays have an expression-only final authored pass.");
        this.source =
            this.pass === "final"
                ? path.join(this.root, "docs", "final", this.layer)
                : path.join(this.root, "docs", this.layer);
        this.filename = `${productionBinderStem(this.title)}-${this.pass === "final" ? "final-" : ""}${this.layer}.md`;
        productionBinderAssertOutputSeparatedFromDocs(this.output, path.join(this.root, "docs"));
    }
    /**
     * Assemble the selected authored layer into reader Markdown without publishing it.
     *
     * @evidence contracts/common.md#principled-implementation Pass-aware ancestor admission precedes grouped or flat current document reads; root title, group and document headings retain deterministic order and the shared rebaser refuses depth beyond H6.
     * @evidence contracts/common.md#clear-and-simple-design Owns reader assembly while file-named readers, marker removal and heading presentation keep their existing responsibilities.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing document/title receives substitute prose, and sequential source reads are not claimed to be one atomic snapshot or complete CommonMark parsing.
     * @evidence contracts/common.md#meaningful-documentation Returns complete Markdown with one edition H1 and terminal newline; scripts/screenplays preserve H2 groups and H3 units, while other layers use H2 documents. Native/read/heading refusals propagate and no file is written.
     * @evidence contracts/performance.md#efficient-algorithms Includes all directory enumeration/sorting and B source-byte reads/transforms; the complete parsed population, heading/body copies, parts array and joined edition can coexist, so grouping does not avoid full text residency.
     * @evidence contracts/performance.md#reuse-equivalent-work One admitted document population supplies title and body assembly for this invocation; later calls reread current files rather than sharing a stale edition.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Local document/group strings and part arrays release after return/refusal, with the complete edition transferring to the caller; promise readers own temporary handles and no watcher or running renderer is retained.
     */
    public async markdown(): Promise<string> {
        await validateAutoMovieProductionDocumentAncestors(this.root, this.pass, fs.lstat);
        const parts: string[] = [`# ${this.title}`];
        if (productionBinderGroupedDocumentLayers.has(this.layer)) {
            const groups: IAutoMovieProductionBinderAuthoredDocumentGroup[] = await productionBinderReadGroupedLayer(this.source);
            for (const group of groups) {
                parts.push(`## ${group.title}`);
                for (const document of group.documents) {
                    parts.push(`### ${document.title}`);
                    const body: string = productionBinderRebaseHeadings(document.body, 2).trim();
                    if (body !== "")
                        parts.push(body);
                }
            }
        }
        else {
            const documents: IAutoMovieProductionBinderAuthoredDocument[] = await productionBinderReadFlatLayer(this.source);
            for (const document of documents) {
                parts.push(`## ${document.title}`);
                const body: string = productionBinderRebaseHeadings(document.body, 1).trim();
                if (body !== "")
                    parts.push(body);
            }
        }
        return `${parts.join("\n\n")}\n`;
    }
    /**
     * Publish complete reader Markdown and return its lexical stable output path.
     *
     * @evidence contracts/common.md#principled-implementation Renders current Markdown first, resolves docs/prospective output, checks separation, creates output, rechecks its physical path and delegates exclusive temporary/no-clobber publication using the same filename basename.
     * @evidence contracts/common.md#clear-and-simple-design Coordinates source assembly and output separation while the publisher owns temporary/sync/link and existing-edition convergence.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Physical endpoint overlap refuses and different resident edition bytes are not overwritten; observations do not prove every intervening namespace remained unchanged.
     * @evidence contracts/common.md#meaningful-documentation May create output directories and a final edition before later cleanup failure; returns the lexical configured target on success, which can differ from the physical path used for publication through existing aliases.
     * @evidence contracts/performance.md#efficient-algorithms Includes full markdown assembly, missing-ancestor resolution, directory creation/realpath work and B-byte write/sync/link or existing-byte comparison; source and complete rendered edition remain part of total cost.
     * @evidence contracts/performance.md#reuse-equivalent-work One rendered edition serves publication and resident byte comparison within this invocation; independent bind calls repeat source acquisition and do not share effectful publication attempts.
     * @evidence contracts/performance.md#bound-retention-and-release-resources Publisher finally blocks attempt handle close and temporary removal, with failure masking and already-linked output limits retained; this method owns no persistent handle, source cache or running task.
     */
    public async bind(): Promise<string> {
        const markdown: string = await this.markdown();
        const target: string = path.join(this.output, this.filename);
        const physicalDocs: string = await fs.realpath(path.join(this.root, "docs"));
        productionBinderAssertOutputSeparatedFromDocs(await productionBinderProspectiveRealpath(this.output), physicalDocs);
        await fs.mkdir(this.output, { recursive: true });
        const physicalOutput: string = await fs.realpath(this.output);
        productionBinderAssertOutputSeparatedFromDocs(physicalOutput, physicalDocs);
        await productionBinderPublishEdition(physicalOutput, path.join(physicalOutput, path.basename(target)), markdown);
        return target;
    }
}
