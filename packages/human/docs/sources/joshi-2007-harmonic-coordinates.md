# Joshi et al. 2007, harmonic coordinates

Joshi P, Meyer M, DeRose T, Green B, Sanocki T. "Harmonic Coordinates for Character Articulation." SIGGRAPH 2007. Read from the presentation notes at https://www.cs.jhu.edu/~misha/Fall07/Notes/Joshi07.pdf, not from the paper.

## Licence

Paper and slides copyright the authors and ACM. Read for technique comparison only.

## What it says

- Mean value coordinates do not respect visibility inside the cage, and "if a cage vertex has a negative weight associated with it, then the object vertex and cage vertex will move in opposite directions".
- Harmonic coordinates average over Brownian paths, which is solving Laplace's equation inside the cage with each cage vertex's boundary function; they respect visibility, which is essential for concave cages.
- The results table lists solve times of 0.83 to 57.4 (units not stated in the notes) and an error below 0.005; future work names multigrid alternatives and localized re-solves.
