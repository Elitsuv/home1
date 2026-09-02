---
title: Can a Python List Learn? Building CYLA
date: September 2, 2026
description: Building a self-organizing adaptive list with online SGD and Move-to-Front.
tags: Research
banner: assets/blog2.png
---

*A deep dive into classical Move-to-Front, the pitfalls of naive ML re-ranking, and building CYLA with AI pair programming.*

> <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:-2px; margin-right:6px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>**Source Code:** Implementation and benchmarks available at [github.com/Elitsuv/cyla](https://github.com/Elitsuv/cyla).

---

## 1. The Classic Problem: Self-Organizing Lists

In 1980 Boris Ryabko invented the **Move-to-Front (MTF)** algorithm, and in 1986 Jon Bentley, Daniel Sleator, Robert Tarjan, and Victor Wei popularized it.

MTF is a simple, intuitive algorithm used to organize items to minimize search time:

When searching for items in a linear list under skewed access patterns (like Zipfian distributions, where 20% of items receive 80% of queries), moving the most recently accessed item to position `0` ensures the list dynamically adapts over time.

```text
Initial State:   [ A, B, C, D, E ]  
Search for 'D':  Found at index 3 -> Move to Front
Resulting State: [ D, A, B, C, E ]
```

Sleator and Tarjan proved MTF is **2-competitive** against the optimal static ordering. In practice, however, it has two major blind spots:

- **Zero predictive power on cold items:** MTF can only react *after* an item is accessed. It has no way of prioritizing items that have never been seen before.
- **Noise pollution (cache churn):** A single, one-off query for an obscure item displaces genuinely popular items from index `0`.

I wondered: *Can we augment MTF with a lightweight, online neural model to predict item priority without sacrificing MTF’s theoretical guarantees?*

This question led to the creation of **CYLA** using AI pair programming.

---

## 2. CYLA: The Hybrid Architecture

CYLA combines the simplicity and proven bounds of Move-to-Front with the predictive power of a lightweight neural network.

I wanted CYLA to run inside low-latency environments without dragging in heavy framework dependencies like PyTorch or TensorFlow. I paired with AI to implement the core scoring engine in pure NumPy with hand-derived backpropagation, momentum, and weight clipping.

We extract 5 real-time features (frequency, recency, item age, etc.) and pass them through a lightweight neural network:

- **Architecture:** Linear (5 → 12) → Tanh → Linear (12 → 1)
- **Training:** Online SGD with non-linear reward feedback triggered after every search hit.

---

## 3. The Failure of CYLA v1: Why Naive ML Fails

In my first prototype, the neural network was called periodically to re-sort the prefix window of the list.

The result was a disaster on heavy Zipf distributions (α = 1.6):

- **Classic MTF:** `19.5` average search steps
- **CYLA v1:** `56.7` average search steps (*almost 5× worse than the theoretical optimum!*)

The neural network kept thrashing already-converged hot items. It constantly reshuffled items that MTF had already placed in near-optimal positions, injecting destructive noise into the critical path.

---

## 4. The Breakthrough: Cold-Gated Re-ranking

To fix v1, we formulated a strict invariant called **Cold-Gated Re-ranking**:

1. **Hot items (`count > 0`):** Completely untouchable by the neural net. Their positions are governed strictly by MTF's proven mechanics.
2. **Cold items (`count == 0`):** Candidates for neural scoring within the prefix window, precisely where classical MTF has zero historical signal.
3. **Noise Guard:** Items are only promoted on subsequent accesses if they accumulate sufficient hits, preventing singleton noise pollution.

---

## 4.1 Benchmark: 8.1 Million Queries

I used AI to build an automated benchmark harness testing 6 algorithms across 3 distinct workload regimes alongside 10 random seeds:

### Regime 1: Stationary Zipf (Static Skew)

When popular items never change, simple frequency counting is hard to beat. However, CYLA v2 completely eliminated the instability of v1, matching MTF's optimal baseline.

![CYLA v2 Benchmark 1](assets/cy-blg-b1.png)
*Figure 1: Stationary Zipf regime — CYLA v2 (purple) drops down to match MTF (green), eliminating the spike of CYLA v1.*

---

### Regime 2: Drifting Workloads (Hot-Set Phase Shifts)

In real systems, access patterns drift. I simulated 3 phases of 10,000 queries where the set of popular items suddenly shifts.

This is where classical Frequency Count algorithms fail—they suffer from historical inertia and cling to outdated counts. Both MTF and CYLA v2 adapt to workload shifts.

![CYLA v2 Benchmark 2](assets/cy-blg-b2.png)
*Figure 2: Drifting workload — Frequency Count (blue) degrades during phase shifts, while MTF and CYLA v2 stay flat and fast.*

---

### Regime 3: Noisy Access Patterns

Injecting up to 30% uniform random noise showed that while all adaptive algorithms experience minor degradation, Transpose and MTF remain resilient baselines compared to static ordering.

![CYLA v2 Benchmark 3](assets/cy-blg-b3.png)
*Figure 3: Performance across increasing noise ratios.*

---

## 5. Conclusion & Takeaways

Building this project with AI pair programming was a great learning experience:

- **Faster Experimentation Cycles:** Moving from theoretical CS papers to a fully vectorized NumPy implementation with statistical confidence intervals in just a couple of hours.
- **Finding Failure Modes:** When CYLA v1 underperformed, stepping through the mathematical invariants with AI helped isolate the cold-gating bug immediately.
- **Respect Classical Baselines:** It's tempting to assume machine learning can improve everything. In practice, classical algorithms are remarkably hard to beat without rich, external semantic features.

On uniform synthetic IDs, CYLA v2 safely falls back to MTF because cold items look identical. The next step is testing semantic features on real-world datasets (like document retrieval and search query logs) with precomputed sentence embeddings.
