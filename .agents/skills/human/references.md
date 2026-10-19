# References

References are for comparison and calibration outside the package. Their geometry never enters it.

## Sources

- MakeHuman and MPFB code may be read to understand their methods but never copied, because it is AGPL and GPL. MakeHuman's CC0 data may be used.
- The reference meshes the user provides live in `.references`. Never name their source in anything public, such as code, commits, issues, or pull requests; call them reference meshes.

## Use

- Follow [Mesh Recovery](../3d-modeling/recovery.md) for extraction and comparison, then [Reverse Analysis](reverse-analysis.md) to identify shared Human equations. Keep observations outside Human and transfer only the shared rules and coefficients, cited with their reference.
- A reference is not ground truth. Fit on the reference bodies closest to the [calibration bodies](verification.md#calibration-bodies), keep only coefficients that hold across all of them by sex, height, build, and ancestry, and use a reference only for what it models.
- Check a reference's measure against population data before fitting a gap to it, because the gap may be the reference's styling.

## Like For Like

Compare a value only with one taken by the same protocol, scale, level, and posture. Convert first with a cited relation, such as bioimpedance or skinfold body fat onto DXA, arms-down measurements onto the T-pose, landmark distances onto joint centres, or caliper breadths over skin onto bone, and cut comparison sections where the measurement defines them.
