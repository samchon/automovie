# Browser launch observations

The [lossless archive](launch-observations.zip) retains the original failed-launch record, the independent diagnosis, both launch logs, Node 22 and Node 24 comparison results and two original PNGs. Its [manifest](manifest.json) identifies all eight expanded files and the archive by byte count and SHA-256. Every expanded member was verified after packaging.

All four independent comparisons rendered the current cart frame using AMD Direct3D11, with the same original PNG bytes and zero page errors. They covered the original workspace TEMP and default TEMP under both Node hosts. The same cached-policy warning occurred in successful sessions, so it does not establish the initial exit's cause. The Node 24 structured results were extracted from retained original stdout after its initial JSON was replaced; that limitation remains in the archived record.

The failed launch remains an isolated nonreproduced browser-process exit. No machine-policy mutation, renderer fallback or source repair was adopted. The subsequent formal 132-sample production probe passed with the original Chrome configuration. These diagnostics establish those launch and rendering observations, not continuous whole-film viewing, hearing or final delivery approval.
