"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHumanBuild = runHumanBuild;
const publishHumanBuild_1 = require("./publishHumanBuild");
/**
 * Compile the ordinary Node and browser outputs in one owned stage before
 * publication.
 *
 * Failure in either pass leaves the current runtime untouched. Disposal errors
 * accompany the original failure rather than hiding it.
 */
async function runHumanBuild(host) {
    const stage = host.createStage();
    const failures = [];
    try {
        await host.compile(stage, "node");
        await host.compile(stage, "browser");
        (0, publishHumanBuild_1.publishHumanBuild)(host, stage);
    }
    catch (error) {
        failures.push(error);
    }
    try {
        host.discardStage(stage);
    }
    catch (error) {
        failures.push(error);
    }
    if (failures.length === 1)
        throw failures[0];
    if (failures.length > 1)
        throw new AggregateError(failures, "Human compilation or publication failed, and stage disposal also failed.");
}
//# sourceMappingURL=runHumanBuild.js.map