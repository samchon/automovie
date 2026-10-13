"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synchronizeHumanBuild = synchronizeHumanBuild;
/**
 * Synchronize complete file membership while keeping the output root stable.
 *
 * Equal bytes need no write. Completed replacements precede obsolete-file
 * removal; an effect failure propagates to the publication owner's rollback.
 * An undefined source restores an originally absent output to empty membership.
 */
function synchronizeHumanBuild(host, source, output) {
    const previous = host.files(output);
    const next = source === undefined ? [] : host.files(source);
    const digests = new Map(previous.map((entry) => [
        entry.file,
        entry.digest,
    ]));
    const membership = new Set(next.map((entry) => entry.file));
    for (const { file, digest } of next)
        if (source !== undefined && digests.get(file) !== digest)
            host.replace(source, output, file);
    for (const { file } of previous)
        if (!membership.has(file))
            host.remove(output, file);
}
//# sourceMappingURL=synchronizeHumanBuild.js.map