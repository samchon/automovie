# Pending specifications

Specification tests that fail on a real defect the current code still has. The test program discovers tests only under `src/features`, so these are type checked but not run, and CI stays a gate on what is delivered.

A test here asserts what the act must look like when really performed, with cited bounds, never what the code produces. It moves back to `src/features/motion` in the same pull request that fixes its defect, and it is never edited to pass. The issue that owns each defect is listed in the master campaign #3379 and the composition campaign #3354.
