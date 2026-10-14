import { AutoMovieAuthoredDocumentLayer } from "./AutoMovieAuthoredDocumentLayer";
import { AutoMovieProductionDocumentPass } from "./AutoMovieProductionDocumentPass";

/**
 * Routing and presentation inputs for one authored-layer reader edition.
 *
 * @evidence contracts/common.md#principled-implementation The request carries root/title/layer and optional pass/output, leaving native path, title and supported-pass admission with the constructor.
 * @evidence contracts/common.md#clear-and-simple-design One existing input shape controls reader routing without extending project schema or adding a host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Types alone do not certify physical directories or safe output; runtime overlap and supported-layer/pass checks remain required.
 * @evidence contracts/common.md#meaningful-documentation Properties document generated-project root, one-line human title, selected layer/pass and default artifacts output ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface executes no traversal or publication; the binder owns those costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shape coordinates no cached source snapshot or shared effectful request.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No descriptor or task is acquired by the request declaration; the binder borrows its values.
 * @author Samchon
 */
export interface IAutoMovieProductionBindRequest {
    /** Generated-project root the binder reads. */
    root: string;

    /** Human-facing title written as the edition's sole H1. */
    title: string;

    /** Authored Markdown layer to bind. */
    layer: AutoMovieAuthoredDocumentLayer;

    /** Construction tree or the expression-only final screenplay tree. */
    pass?: AutoMovieProductionDocumentPass;

    /**
     * Directory the edition is written beneath.
     *
     * @default `<root>/artifacts`
     */
    output?: string;
}
