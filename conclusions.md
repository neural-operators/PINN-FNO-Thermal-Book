# Summary, Limitations and Outlook

*What the book set out to answer, what the experiments showed, and what remains open.*

---

## 1. The question

Can a neural operator learn the solution map of a nonlinear, heterogeneous heat-conduction problem accurately enough to replace repeated finite-element solves? Can it do so from the physics alone, without labeled solutions? And does it generalize to inputs and grids it was never trained on? All experiments use one benchmark, a rod with conductivity $k(x,T)=\alpha(x)(0.5+T^2)$ (see [The Benchmark Problem](benchmark_problem.ipynb)). Every model is graded against the same fine, fully implicit finite-element reference.

**Training setup.** Within each comparison the models share the data, the optimizer and the training budget, and differ only in the quantity under study (the training loss, the architecture, or the training signal), so differences in the results can be attributed to it. The FNO settings are not the same in every chapter (4 Fourier modes in the steady baseline and in the transient chapters, 16 in the loss comparison, 8–12 in the architecture comparison), so absolute errors should be compared within a chapter rather than across chapters.

## 2. Findings, chapter by chapter

The values below are taken from the executed chapters. Errors are measured against the fine reference on the 100 held-out samples, or on the 300 out-of-distribution (OOD) evaluations: 50 unseen shapes on 6 grids from $N=64$ to $256$.

**Foundations.**

| Chapter | Result |
| :--- | :--- |
| [Classical solvers and PINNs](1D_Thermal_PINN_FEM_FDM.ipynb) | On a problem with an exact solution, FEM (≈$10^{-7}$) and FDM (≈$10^{-6}$) far outperform a small PINN (≈$10^{-2}$). On this problem FDM and FEM lead to the same discrete equations; the gap between them comes from the nonlinear solver (BFGS vs. Newton–Raphson). A PINN also solves only one instance per training run. |
| [The benchmark problem](benchmark_problem.ipynb) | The discretization floor on the training grid is ≈$5\times10^{-5}$ (steady). In the transient case it is $5.4\times10^{-3}$ at the first step of $\Delta t=0.02$, about $6\times10^{-3}$ at step 2, and $2.1\times10^{-3}$ at step 19. |

**Steady state.**

| Chapter | Result |
| :--- | :--- |
| [Steady-state FNO](FNO_STEADY_STATE.ipynb) | Relative $L^2$ error ≈0.2% on held-out materials. OOD error stays within about 4× of it; sawtooth materials are hardest. The steady reference is exactly the long-time limit of the transient problem. |
| [Loss comparison](FNO_loss_comparison.ipynb) | Weighted residual ≈0.02%, data-driven ≈0.03%, MSE residual ≈0.09% (relative $L^2$). The label-free weighted residual is also best out of distribution. |
| [Architecture comparison](architecture_comparison.ipynb) | iFOL (small and medium tiers) and the Transformer (large tier) lead in distribution. The FNO has the lowest OOD error of the affordable models at every tier and trains 5–16× faster than the Transformer, which matches it out of distribution at the small and medium tiers and beats it at the large tier. |

**Transient.**

| Chapter | Result |
| :--- | :--- |
| [Data-driven transient FNO](FNO_transient_data_driven.ipynb) | Accurate rollouts in distribution; OOD error several times larger. Longer training improves OOD accuracy too, so the training budget needs no cap. |
| [Weighted-residual transient FNO](FNO_transient_weighted_residual.ipynb) | Trained without labels and on initial states only, it follows the reference over all 19 steps, with a first-step error close to the floor. |
| [PITI-FNO](FNO_transient_PITI.ipynb) | A $\Delta t$-free loss: one set of weights runs at $\Delta t=0.001$–$0.02$ with Euler or RK4, but diverges at $\Delta t=0.1$. Its error is about twice that of WR at $\Delta t=0.02$. |
| [Transient comparison](transient_comparison.ipynb) | In distribution: data-driven < WR < PITI. Out of distribution: **WR best** (≈3×10⁻² mean), then data-driven (≈5×10⁻²), then PITI (≈8×10⁻²). |

## 3. Conclusions

1. **Labels are not required.** The finite-element residual, used in weighted-residual form with a stop-gradient, trains neural operators without a single labeled solution. In the steady case it is the most accurate objective. In the transient case, the fully discrete form (WR) gives up little in-distribution accuracy relative to supervised training.
2. **Which residual is weighted matters for generalization.** Out of distribution, the weighted-residual loss built on the *fully discrete* equations beats supervised training, in the steady and in the transient problem alike (WR in the transient case). PITI uses the same weighted-residual form, but on the *semi-discrete* equation $M\dot T + K(T)T = 0$, and has the largest out-of-distribution error of the three transient operators. Being label-free is therefore not enough on its own; with both operators trained on the same states and backbone, the results point to the residual that contains the full implicit time step, not just the instantaneous rate, as what helps. Super-resolution costs every model about the same; the separation between training signals comes from unseen shapes.
3. **The FNO is the practical architecture.** It gives the best out-of-distribution accuracy per unit of training cost. Architectures that are more accurate in distribution (iFOL, Transformer) either generalize worse (iFOL) or cost up to an order of magnitude more (Transformer).
4. **Where the time step lives is a design choice with a price.** Building the implicit step into the loss (WR) gives stable, accurate rollouts but ties the model to one $\Delta t$. Learning the time derivative (PITI) frees $\Delta t$, but inherits the stiffness of heat conduction at inference and loses accuracy.
5. **Grade against a converged reference.** Solving the reference once on a fine mesh and interpolating it, instead of re-solving on each coarse grid, separates model error from discretization error. It revealed a first-step floor of about $5\times10^{-3}$ on the transient training grid, which the best operators nearly reach.

## 4. Limitations

- **One training run per configuration.** No results are averaged over random seeds. The PITI MODES ablation shows that run-to-run variation can change qualitative conclusions for intermediate settings.
- **One dimension and modest material contrast.** The in-distribution materials vary by a factor of about 1.9, and all problems are 1-D.
- **Single-precision training.** The networks run in float32; only the references are float64.
- **Demanding transient OOD set.** Most out-of-distribution initial fields jump at one or both boundaries, which no training field does; the largest out-of-distribution errors occur at these jumps.
- **Model selection and the OOD set.** In the data-driven transient chapter, the decision not to cap the training budget was based on out-of-distribution error, so that chapter's out-of-distribution results are not fully independent of model selection.

## 5. Outlook

- A **transient Transformer** operator, excluded here on runtime grounds, as a dedicated study.
- **Seed-averaged** ablations, and a direct analysis of the learned operator's Jacobian eigenvalues to explain its stability limits.
- **Implicit or stabilized integrators** for PITI at inference, to recover large time steps.
- **Higher material contrast and 2-D domains**, where the advantage of label-free, resolution-independent training should matter most.
