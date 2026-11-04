# Production tests

## Observable behavior

What operation does the test execute, what promised behavior does it observe, and what defect would its assertions catch? Reach the real implementation without replacing globals or foreign methods. State the execution layer and any real-host behavior it cannot prove.

## Independent cases

Where do the expectations and tolerances come from independently of the implementation? Explain the positive, negative, boundary, and intended-exception cases this test owns, and which other checks own the remainder. Arrangement checks and output copied into expectations do not prove behavior.
