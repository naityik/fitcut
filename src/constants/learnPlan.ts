/**
 * The 21-day Bayes → simulation-based inference plan.
 *
 * Every day carries a real ISO date rather than a display string, so the page can use
 * the same clock as the rest of the app: what is due today, what has slipped, and how
 * far ahead or behind the plan you are.
 *
 * Inline markup in `buildSteps` and `claim` uses `backticks` for code and *asterisks*
 * for emphasis, rendered by <RichText>. Deliberately not HTML — nothing here needs to
 * reach the DOM unescaped.
 */
import type { ISODate } from "@/lib/date";

export interface LearnResource {
  title: string;
  href: string;
  duration: string;
}

export interface LearnDay {
  date: ISODate;
  title: string;
  resources: LearnResource[];
  buildIntro: string;
  buildSteps: string[];
  claim: string;
}

export interface LearnWeek {
  tag: string;
  title: string;
  note: string;
  days: LearnDay[];
}

export const LEARN_META = {
  start: "2026-08-11" as ISODate,
  end: "2026-09-01" as ISODate,
  hoursPerDay: "~3.5 h/day",
  title: "From Bayes to simulation-based inference",
  lede:
    "Video-led, build-first. Every day ends in code you wrote, not a video you watched. " +
    "On 1 September the repo goes public and the first ten emails go out.",
};

export const LEARN_PLAN: LearnWeek[] = [
  {
    tag: "Week one · 11–17 Aug",
    title: "Bayes, and samplers you wrote yourself",
    note:
      "No libraries doing the thinking. By Sunday you will have written a Metropolis sampler and " +
      "diagnosed a broken one, which is what separates people who use Bayesian methods from people " +
      "who trust them.",
    days: [
      {
        date: "2026-08-11",
        title: "What the posterior actually is",
        resources: [
          {
            title: "3Blue1Brown — Bayes' theorem + the medical test paradox",
            href: "https://www.youtube.com/results?search_query=3blue1brown+bayes+theorem",
            duration: "20 min",
          },
          {
            title: "Statistical Rethinking — Lectures 1 & 2 (Golem of Prague; Garden of Forking Data)",
            href: "https://github.com/rmcelreath/stat_rethinking_2026",
            duration: "2 h",
          },
        ],
        buildIntro: "Grid approximation, in NumPy, from nothing.",
        buildSteps: [
          "Globe-tossing: posterior over `p` from binomial data on a 200-point grid.",
          "Plot the posterior after 1, 2, 5, 10, 20 observations on one axis.",
          "Redo it with three different priors and put them side by side.",
        ],
        claim:
          "I can show, with my own plot, exactly how much the prior still matters after twenty data points.",
      },
      {
        date: "2026-08-12",
        title: "Conjugacy, and where it runs out",
        resources: [
          {
            title: "Ben Lambert — conjugate priors and the Beta-Binomial",
            href: "https://www.youtube.com/results?search_query=Ben+Lambert+conjugate+priors+beta+binomial",
            duration: "70 min",
          },
        ],
        buildIntro: "Derive on paper first, then verify numerically.",
        buildSteps: [
          "Beta-Binomial update by hand; confirm against your day-1 grid.",
          "Normal-Normal with known variance — derive the posterior mean as a precision-weighted average.",
          "Write down, in the notebook, the exact reason conjugacy fails for any model you'd care about.",
        ],
        claim:
          "I can derive the two standard conjugate updates without notes, and say why nobody's real problem is conjugate.",
      },
      {
        date: "2026-08-13",
        title: "Metropolis-Hastings from scratch",
        resources: [
          {
            title: "Statistical Rethinking — Lecture 8, Markov chain Monte Carlo",
            href: "https://github.com/rmcelreath/stat_rethinking_2026",
            duration: "1 h",
          },
        ],
        buildIntro: "About forty lines of NumPy. No PyMC today.",
        buildSteps: [
          "Metropolis-Hastings on a 2D banana (Rosenbrock) density.",
          "Plot the chain path over a contour of the target.",
          "Sweep the proposal width across three orders of magnitude and watch the acceptance rate and the picture change.",
        ],
        claim: "I have written an MCMC sampler and I know what the proposal width does to it.",
      },
      {
        date: "2026-08-14",
        title: "Diagnostics — how chains lie to you",
        resources: [
          {
            title: "Betancourt — Conceptual Introduction to HMC, §1–3",
            href: "https://arxiv.org/abs/1701.02434",
            duration: "60 min",
          },
          {
            title: "ArviZ diagnostics documentation",
            href: "https://python.arviz.org/",
            duration: "30 min",
          },
        ],
        buildIntro: "Break it deliberately, then detect the break.",
        buildSteps: [
          "Run four chains from dispersed starts; compute R-hat and effective sample size yourself before checking against ArviZ.",
          "Trace plots, running means, autocorrelation functions.",
          "Tune the proposal so the chain looks fine over 1,000 steps but is badly wrong. Show which diagnostic catches it.",
        ],
        claim:
          "I can produce a chain that looks converged and isn't, and I know which diagnostic exposes it.",
      },
      {
        date: "2026-08-15",
        title: "Hamiltonian Monte Carlo",
        resources: [
          {
            title: "Betancourt — HMC talk (any recorded version)",
            href: "https://www.youtube.com/results?search_query=Michael+Betancourt+Hamiltonian+Monte+Carlo+talk",
            duration: "60 min",
          },
          {
            title: "Betancourt paper, §4 onward",
            href: "https://arxiv.org/abs/1701.02434",
            duration: "45 min",
          },
        ],
        buildIntro: "Gradients change everything.",
        buildSteps: [
          "Implement leapfrog integration and a basic HMC sampler on the same banana.",
          "Compare effective samples per second against your Metropolis version.",
          "Show what happens when the step size is too large — divergences, and why they're a feature.",
        ],
        claim:
          "I understand why gradient-based samplers dominate in high dimensions, and I've measured the difference.",
      },
      {
        date: "2026-08-16",
        title: "Probabilistic programming",
        resources: [
          { title: "NumPyro getting-started tutorials", href: "https://num.pyro.ai/", duration: "90 min" },
        ],
        buildIntro: "Now let the library do it, having earned the right.",
        buildSteps: [
          "Refit your day-3 and day-5 models in NumPyro; check they agree with your hand-rolled versions.",
          "Fit a linear regression with explicit priors; run prior predictive checks *before* looking at data.",
          "Posterior predictive checks afterwards.",
        ],
        claim:
          "I can go from a model written in maths to a fitted posterior with checks on both ends in under an hour.",
      },
      {
        date: "2026-08-17",
        title: "Consolidate — notebook one",
        resources: [],
        buildIntro: "Buffer and write-up day.",
        buildSteps: [
          "Clean everything into `01_bayes_basics.ipynb`: runs top to bottom, no dead cells, every figure labelled.",
          "Catch up on anything that slipped.",
        ],
        claim: "Week one exists as one notebook someone else could run.",
      },
    ],
  },
  {
    tag: "Week two · 18–24 Aug",
    title: "Inverse problems, and flows as posteriors",
    note:
      "This is the week the two halves of your interest fuse. The Bayesian view of an inverse problem " +
      "is the idea your whole autumn semester rests on, and a conditional flow is a posterior wearing " +
      "a neural network.",
    days: [
      {
        date: "2026-08-18",
        title: "The linear inverse problem",
        resources: [
          {
            title: "Steve Brunton — SVD, pseudo-inverse, ill-conditioned systems",
            href: "https://www.youtube.com/results?search_query=Steve+Brunton+singular+value+decomposition+least+squares",
            duration: "75 min",
          },
        ],
        buildIntro: "Deconvolve a blurred 1D signal.",
        buildSteps: [
          "Build a blur operator, add noise, and try naive least squares. Watch it explode.",
          "Add Tikhonov regularisation; sweep λ; plot the L-curve.",
          "Look at the singular value spectrum and connect the blow-up to the small singular values.",
        ],
        claim: "I can explain ill-posedness in terms of the singular value spectrum, with my own plot.",
      },
      {
        date: "2026-08-19",
        title: "The Bayesian view — the key identity",
        resources: [
          {
            title: "Statistical Rethinking — regularising priors",
            href: "https://github.com/rmcelreath/stat_rethinking_2026",
            duration: "45 min",
          },
        ],
        buildIntro: "The most important derivation of the fortnight.",
        buildSteps: [
          "Show on paper that Tikhonov regularisation is exactly the MAP estimate under a Gaussian prior with Gaussian noise, and that λ is a ratio of variances.",
          "Compute the full posterior covariance for the linear-Gaussian case in closed form.",
          "Redo yesterday's deconvolution with credible bands instead of a point estimate.",
        ],
        claim: "Regularisation isn't a hack I picked — it's a prior I chose, and I can name which one.",
      },
      {
        date: "2026-08-20",
        title: "PyTorch, properly",
        resources: [
          { title: "PyTorch official 60-minute blitz", href: "https://pytorch.org/tutorials/", duration: "2 h" },
        ],
        buildIntro:
          "Your Deep Learning course is running in parallel — use it, but get fluent now.",
        buildSteps: [
          "Tensors, autograd, a training loop written by hand.",
          "Fit an MLP to a 1D regression; overfit it deliberately, then regularise.",
          "Set up habits you'll keep: fixed seeds, device handling, saved checkpoints, a config dict at the top.",
        ],
        claim: "I can write a training loop from a blank file without looking anything up.",
      },
      {
        date: "2026-08-21",
        title: "Change of variables, and why flows work",
        resources: [
          {
            title: "Berkeley CS294-158 — flow models lecture",
            href: "https://www.youtube.com/results?search_query=CS294-158+deep+unsupervised+learning+flow+models",
            duration: "90 min",
          },
          {
            title: "Papamakarios et al. — Normalizing Flows review, §1–3",
            href: "https://arxiv.org/abs/1912.02762",
            duration: "60 min",
          },
        ],
        buildIntro: "Get the maths in your hands before the code.",
        buildSteps: [
          "Derive the change-of-variables density formula in 1D, then in n dimensions.",
          "Work out by hand why a coupling layer's Jacobian is triangular, and therefore why its determinant is cheap.",
          "Implement a 1D flow with a single invertible transform and verify numerically that the density integrates to one.",
        ],
        claim:
          "I can explain why the log-det Jacobian is the entire design constraint on flow architectures.",
      },
      {
        date: "2026-08-22",
        title: "Build a flow from scratch",
        resources: [
          {
            title: "RealNVP paper, skim the architecture section",
            href: "https://arxiv.org/abs/1605.08803",
            duration: "40 min",
          },
        ],
        buildIntro: "No library. This is the piece that proves you're not just calling functions.",
        buildSteps: [
          "Coupling layers with alternating masks, stacked six deep.",
          "Train on 2D two-moons; sample from it; plot samples over the true density.",
          "Visualise the learned transformation by pushing a grid through it.",
        ],
        claim:
          "I have implemented a normalizing flow from scratch and I can show what the transformation does to space.",
      },
      {
        date: "2026-08-23",
        title: "Conditional flows — the leap to inference",
        resources: [
          {
            title: "Practical Guide, §2 — the SBI workflow",
            href: "https://arxiv.org/abs/2508.12939",
            duration: "60 min",
          },
        ],
        buildIntro: "One change of shape turns a generative model into a posterior estimator.",
        buildSteps: [
          "Condition your coupling layers on a context vector `x`.",
          "Write a toy simulator, sample (θ, x) pairs from the prior, and train the conditional flow on them.",
          "Compare the learned q(θ|x) against the analytic posterior for a case where you know it.",
        ],
        claim:
          "I have trained a neural network to output a posterior distribution, and I checked it against the truth.",
      },
      {
        date: "2026-08-24",
        title: "Consolidate — notebook two",
        resources: [],
        buildIntro: "Buffer and write-up.",
        buildSteps: [
          "`02_flows.ipynb`, clean and runnable.",
          "The pushed-grid transformation figure is your best visual so far — make it good.",
        ],
        claim:
          "I can hand someone a notebook that goes from change of variables to a working conditional density estimator.",
      },
    ],
  },
  {
    tag: "Week three · 25–31 Aug",
    title: "SBI, and the result that gets you replies",
    note:
      "You already built the machinery. This week is about using the real toolkit, and then about the " +
      "thing most people skip: checking whether the posterior is telling the truth. That check is your " +
      "headline result.",
    days: [
      {
        date: "2026-08-25",
        title: "The map of the field",
        resources: [
          {
            title: "Cranmer, Brehmer & Louppe — The frontier of simulation-based inference",
            href: "https://arxiv.org/abs/1911.01429",
            duration: "2 h",
          },
          { title: "Practical Guide, §1–2", href: "https://arxiv.org/abs/2508.12939", duration: "60 min" },
        ],
        buildIntro: "Reading day, with an output.",
        buildSteps: [
          "Write a one-page summary in your own words: what problem SBI solves, the three method families, where each is preferred.",
          "Keep it. Half of it becomes the second paragraph of your cold emails.",
        ],
        claim: "I can describe any SBI group's work in the field's own vocabulary.",
      },
      {
        date: "2026-08-26",
        title: "The sbi package",
        resources: [
          { title: "sbi tutorials, in order", href: "https://sbi-dev.github.io/sbi/latest/", duration: "2 h" },
        ],
        buildIntro: "Install it, then earn a comparison.",
        buildSteps: [
          "Run neural posterior estimation on the two-moons benchmark.",
          "Put its posterior beside the one from your own day-23 conditional flow. Where do they differ, and why?",
          "Read the source for the NPE loss and match it to the equation in the review paper.",
        ],
        claim: "I use the standard toolkit and I've read enough of its source to know what it's doing.",
      },
      {
        date: "2026-08-27",
        title: "The three families",
        resources: [
          {
            title: "Practical Guide — method comparison sections",
            href: "https://arxiv.org/abs/2508.12939",
            duration: "75 min",
          },
        ],
        buildIntro: "Posterior, likelihood, and ratio estimation on one problem.",
        buildSteps: [
          "Run NPE, NLE and NRE on the same task with the same simulation budget.",
          "Tabulate: accuracy, wall-clock, number of simulations, and whether the result is amortized.",
          "Write two sentences on when you'd pick each. This is a question you will be asked on a call.",
        ],
        claim: "I can say which of the three families fits a given problem and defend the choice.",
      },
      {
        date: "2026-08-28",
        title: "Calibration — the part almost everyone skips",
        resources: [
          {
            title: "Talts et al. — Simulation-Based Calibration",
            href: "https://arxiv.org/abs/1804.06788",
            duration: "60 min",
          },
          {
            title: "Practical Guide — diagnostics section",
            href: "https://arxiv.org/abs/2508.12939",
            duration: "45 min",
          },
        ],
        buildIntro: "Implement it yourself before calling the library version.",
        buildSteps: [
          "Draw θ from the prior, simulate x, infer, and compute the rank of the true θ among posterior samples. Repeat a few hundred times.",
          "Histogram the ranks. Uniform means calibrated; a U-shape means overconfident; a hump means the opposite.",
          "Check your implementation against the package's.",
        ],
        claim:
          "I don't just produce posteriors, I test whether they're honest — and I wrote the test.",
      },
      {
        date: "2026-08-29",
        title: "Misspecification — your headline result",
        resources: [
          {
            title: "Practical Guide — model misspecification",
            href: "https://arxiv.org/abs/2508.12939",
            duration: "45 min",
          },
        ],
        buildIntro: "The experiment that makes the repo worth reading.",
        buildSteps: [
          "Train NPE on simulator A, then feed it observations generated by a slightly different simulator B.",
          "Show the posterior is narrow, confident, and wrong.",
          "Run your SBC on it and show the rank histogram catching what the pretty posterior plot hid.",
          "Sweep the size of the mismatch and plot how fast calibration degrades.",
        ],
        claim:
          "I can demonstrate a posterior being confidently wrong, and diagnose it. This is the figure at the top of my README.",
      },
      {
        date: "2026-08-30",
        title: "Sequential versus amortized",
        resources: [
          {
            title: "sbi tutorials — multi-round inference",
            href: "https://sbi-dev.github.io/sbi/latest/",
            duration: "75 min",
          },
        ],
        buildIntro: "Simulation budget is the real currency in this field.",
        buildSteps: [
          "Run sequential NPE for several rounds on a single observation.",
          "Plot accuracy against number of simulations, sequential versus amortized.",
          "Note the trade-off: sequential is cheaper for one observation and useless for the next one.",
        ],
        claim:
          "I understand the amortization trade-off, which is the first thing any SBI group will discuss with me.",
      },
      {
        date: "2026-08-31",
        title: "Ship the repo",
        resources: [],
        buildIntro: "Writing day. Treat it as seriously as the code.",
        buildSteps: [
          "README: the problem, your figure, what's in each notebook, how to reproduce.",
          "Move the from-scratch flow into `flows/` as importable code, not notebook cells.",
          "Lock the environment. Fix seeds. Clone into a fresh directory and run it to prove it works.",
        ],
        claim:
          "There is a public repository with my name on it that a professor could evaluate in ninety seconds.",
      },
    ],
  },
  {
    tag: "1 September",
    title: "Send",
    note: "The learning was the means. This is the point of it.",
    days: [
      {
        date: "2026-09-01",
        title: "First ten emails",
        resources: [],
        buildIntro: "The day the work leaves your machine.",
        buildSteps: [
          "Finish the target spreadsheet: 25 names surviving the filters.",
          "Draft the one-page project proposal template you'll send within 24 hours of any interested reply.",
          "Send the first ten emails, Tuesday morning European time.",
        ],
        claim: "The repo is live, the list is built, and ten professors have read my name.",
      },
    ],
  },
];

export const LEARN_DELIVERABLE = {
  title: "What “done” means on 1 September",
  lede:
    "One public repository. Not five. A PI will spend ninety seconds on it, so the top of the README " +
    "has to do the work.",
  items: [
    "A README opening with *one* figure: your rank histogram showing a well-calibrated posterior beside a confidently wrong one.",
    "Three notebooks — `01_bayes_basics`, `02_flows`, `03_sbi_calibration` — that run top to bottom without edits.",
    "A from-scratch coupling-layer flow in `flows/`, so it's visible you didn't only call a library.",
    "Your own SBC implementation next to the library one, agreeing with it.",
    "A misspecification experiment with a paragraph on what it means. This is the part people remember.",
    "`environment.yml` or `pyproject.toml`, fixed seeds, and a one-command reproduction script.",
  ],
};

export interface LibraryEntry {
  title: string;
  href: string;
  why: string;
}

export const LEARN_LIBRARY: { heading: string; entries: LibraryEntry[] }[] = [
  {
    heading: "Video courses — the spine",
    entries: [
      {
        title: "Statistical Rethinking — Richard McElreath",
        href: "https://github.com/rmcelreath/stat_rethinking_2026",
        why: "The best Bayesian course that exists, and it's free. Course repo links the current lecture playlist and every problem set. Book examples are in R; Python conversions (NumPyro, PyMC) are linked from the repo. Watch the lectures, do the problem sets in Python.",
      },
      {
        title: "Statistical Rethinking 2022 playlist",
        href: "https://www.youtube.com/playlist?list=PLDcUM9US4XdMROZ57-OIRtIK0aOynbgZN",
        why: "A complete recorded run if you want one uninterrupted playlist to work through.",
      },
      {
        title: "Ben Lambert — A Student's Guide to Bayesian Statistics",
        href: "https://www.youtube.com/results?search_query=Ben+Lambert+A+Student%27s+Guide+to+Bayesian+Statistics",
        why: "More mechanical than McElreath: he derives things and opens up the sampler internals. Use it when Rethinking's intuition-first style leaves you wanting the algebra.",
      },
      {
        title: "3Blue1Brown — Bayes' theorem, and the medical test paradox",
        href: "https://www.youtube.com/results?search_query=3blue1brown+bayes+theorem",
        why: "Twenty minutes total. Watch on day one to fix the picture, then move on.",
      },
      {
        title: "Steve Brunton — SVD, regression, ill-posed systems",
        href: "https://www.youtube.com/results?search_query=Steve+Brunton+singular+value+decomposition+regression",
        why: "Short, clean, visual. This is your fastest route into the linear inverse problem and regularisation, which is the backbone of your DS3143 course.",
      },
      {
        title: "Berkeley CS294-158 — Deep Unsupervised Learning, flow models lecture",
        href: "https://www.youtube.com/results?search_query=Berkeley+CS294-158+deep+unsupervised+learning+flow+models",
        why: "The clearest lecture on normalizing flows: change of variables, coupling layers, why the Jacobian has to be cheap.",
      },
    ],
  },
  {
    heading: "The SBI core — read these three properly",
    entries: [
      {
        title: "Deistler et al. — Simulation-Based Inference: A Practical Guide (2025)",
        href: "https://arxiv.org/abs/2508.12939",
        why: "Your single most important text. Written by the group behind the `sbi` package, and organised as a workflow with diagnostics at every step.",
      },
      {
        title: "Cranmer, Brehmer & Louppe — The frontier of simulation-based inference (PNAS 2020)",
        href: "https://arxiv.org/abs/1911.01429",
        why: "The map of the field. Read it before you write a single cold email — it gives you the vocabulary to describe what a group does.",
      },
      {
        title: "Papamakarios et al. — Normalizing Flows for Probabilistic Modeling and Inference",
        href: "https://arxiv.org/abs/1912.02762",
        why: "The reference on flows. Sections 1–3 are enough for now; the rest is a lookup table.",
      },
    ],
  },
  {
    heading: "Sampling and calibration",
    entries: [
      {
        title: "Betancourt — A Conceptual Introduction to Hamiltonian Monte Carlo",
        href: "https://arxiv.org/abs/1701.02434",
        why: "Why MCMC fails in high dimensions and how geometry rescues it. Read §1–3; the rest can wait.",
      },
      {
        title: "Talts et al. — Validating Bayesian Inference Algorithms with Simulation-Based Calibration",
        href: "https://arxiv.org/abs/1804.06788",
        why: "Short, and the basis of your headline result. If your ranks aren't uniform, your posterior is wrong.",
      },
      {
        title: "Gelman et al. — Bayesian Data Analysis (free PDF)",
        href: "http://www.stat.columbia.edu/~gelman/book/",
        why: "Reference, not a read-through. Look things up in it when Rethinking gestures at something and you want the details.",
      },
    ],
  },
  {
    heading: "Software",
    entries: [
      {
        title: "sbi — documentation and tutorials",
        href: "https://sbi-dev.github.io/sbi/latest/",
        why: "The field's standard toolkit, PyTorch-based. Work through the tutorials in order rather than skipping to your problem.",
      },
      {
        title: "sbi on GitHub",
        href: "https://github.com/sbi-dev/sbi",
        why: "Read the issues and discussions. Seeing what people get stuck on is how you learn where the field's real problems are — and it's material for a cold email.",
      },
      {
        title: "NumPyro",
        href: "https://num.pyro.ai/",
        why: "Probabilistic programming in JAX. Fast, and the syntax is close enough to the Rethinking examples to translate directly.",
      },
      {
        title: "ArviZ",
        href: "https://python.arviz.org/",
        why: "Diagnostics and plots — trace plots, R-hat, ESS, posterior predictive checks. Don't hand-roll what this already does well.",
      },
    ],
  },
];

export const LEARN_FOOTNOTE =
  "Days 7, 14 and 21 are deliberately light. Something will overrun — a flow that won't train, a week " +
  "where coursework eats your evenings — and those days are where it goes. If nothing overruns, use " +
  "them to go back and make a figure genuinely good.";
