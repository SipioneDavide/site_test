# CONTENT.md — Content specification for the new Davide Sipione research website

> This file is the **single source of truth for site content** (Code1 deliverable).
> It describes *what* must appear on the new site — **content only, no styling**.
> It was extracted read-only from the existing `sipionedavide.github.io` (academicpages/Jekyll)
> repository, keeping every piece of real content and discarding all template boilerplate.
> The Hugo build (Code2) consumes this file.

---

## 0. Data-quality corrections applied here

The source had a few obvious defects. Corrections adopted for the new site (all conservative — no facts invented):

- `Poltiecnico` → **Politecnico di Torino** (typo fix).
- Preprint title had a stray newline (`Atomic Congestion\nGames`) → normalized to one line.
- The teaching-course description in the source ends mid-sentence. It is kept **verbatim** and simply closed with an ellipsis; no new topics were invented. Flagged for the author to finish.
- Empty `citation:` fields → no citation strings are fabricated; publications simply omit a formatted citation until the author supplies one.

---

## 1. Site identity & metadata

| Field | Value |
|---|---|
| Owner / site title | **Davide Sipione** |
| Role | PhD Student in Mathematical Sciences |
| Affiliation | Department of Mathematical Sciences, Politecnico di Torino |
| Location | Torino, Italy |
| Email | davide.sipione@polito.it |
| Tagline | *Controlling Traffic* |
| Site description (meta) | Research website of Davide Sipione — PhD candidate at Politecnico di Torino working on dynamical systems, optimization and control for networked and transportation systems. |
| Canonical published URL | https://sipionedavide.github.io/site_test/ (GitHub project Pages) |
| Language | English |

> Note: the old site's `description` (`"Your Name's academic portfolio"`) was placeholder and is **not** reused.

---

## 2. Navigation & page structure

Top navigation (in order):

1. **Home / About** → `/`
2. **Research** → `/research/`  *(research interests + narrative; new consolidated page)*
3. **Publications** → `/publications/`
4. **Talks** → `/talks/`
5. **Teaching** → `/teaching/`
6. **CV** → `/cv/`

This mirrors the real nav of the old site (Publications, Talks, Teaching, CV) plus a proper **Home/About** landing and a **Research** page that gives the interests room to breathe. **No** Portfolio, Blog, or CV-JSON pages (all were disabled/placeholder on the old site).

---

## 3. Home / About page  (`/`)

**Headline:** Davide Sipione
**Subhead:** PhD Student in Mathematical Sciences · Department of Mathematical Sciences, Politecnico di Torino

**Profile photo:** `Sipione.jpg` (carried over from the old site — the configured avatar).

**About (verbatim real prose):**

> I am a PhD researcher in Mathematics at Politecnico di Torino. My work focuses on mathematical modeling, dynamical systems, and optimization, with applications to networked systems and transportation.

**Primary calls-to-action on the landing page:** links to Publications, and contact (email) + academic profiles (Google Scholar, ORCID).

**Research interests (short list — full version on Research page):**
- Dynamical systems
- Optimization and control theory
- Multi-commodity network-flow models

---

## 4. Research page  (`/research/`)

A short narrative expanding the About statement, followed by the interest list. Use only material grounded in the real content (the About text + the two papers' abstracts). Suggested framing (grounded, not invented):

> My research sits at the intersection of **dynamical systems, optimization, and control theory**, applied to **networked and transportation systems**. I study how flows evolve across networks — modeling traffic as multi-commodity dynamical systems — and how distributed control mechanisms (such as tolling schemes) can steer these systems toward efficient, stable operating points.

**Research interests:**
- Dynamical systems and stability analysis
- Optimization and control theory
- Multi-commodity network-flow models
- Transportation networks and congestion games
- Distributed control and tolling / pricing mechanisms

*(The last two bullets are directly evidenced by the two publications below; the first three are the author's own stated interests.)*

---

## 5. Publications  (`/publications/`)

Group by category, in this order (only non-empty groups render): **Journal Articles**, **Conference Papers**, **Preprints**. Within a group, newest first. A link to the Google Scholar profile appears at the top of the page.

### 5.1 Conference Papers

**On the Stability of Dynamical Multi-Commodity Flow Networks**
- **Venue:** 2025 IEEE 64th Conference on Decision and Control (CDC)
- **Date:** 2025-12-09
- **Excerpt:** We study dynamical multi-commodity flows in transportation networks and establish conditions for the existence and stability of free-flow equilibria.
- **Abstract (verbatim):**
  > We study a class of dynamical multi-commodity flows in transportation networks. These are modeled as dynamical systems describing the evolution of the densities of a number of different commodities across the cells of a transportation network. Each cell is characterized by commodity-specific increasing demand functions returning the maximum outflow of each commodity from the cell as a function of the current density of that commodity, as well as a decreasing supply function returning the total maximum inflow that is allowed in the cell as a function of the current aggregate density in the cell. Every commodity is characterized by a different routing matrix, whose entries describe the turning ratios between adjacent cells. We identify a (typically convex) capacity region: for exogenous inflow vectors belonging to that region, we prove the existence of a locally asymptotically stable free-flow equilibrium point. Building on a contraction argument, we also provide an estimate of the basin of attraction of such free-flow equilibrium point. Finally, we analyze a simple special case showing that, when the exogenous inflow vector does not belong to the region of stability, non-free flow equilibrium points might arise.
- **Links:** none provided on the old site (no PDF/slides/bibtex). Leave link area empty — do not fabricate URLs.

### 5.2 Preprints

**Noise-Robust Tolls in Atomic Congestion Games**
- **Venue:** Preprint (CPHS — IFAC Workshop on Cyber-Physical & Human Systems context, per the `CPHSfinal.pdf` filename; label simply as "Preprint")
- **Date:** 2026-06-14
- **Excerpt:** We propose a distributed tolling scheme for logit-based congestion games and prove convergence to optimal expected travel time.
- **Abstract (verbatim):**
  > We consider a congestion game with a finite number of agents selecting paths according to a logit dynamics with fixed noise level. We propose an iterative distributed tolling scheme and prove its convergence to a toll vector that minimizes the expected total travel time for every noise level.
- **Links:** PDF → `CPHSfinal.pdf` (carried over as a downloadable file). No slides/bibtex.

---

## 6. Talks  (`/talks/`)

Flat reverse-chronological list. One real entry:

**Conference proceedings: “On the Stability of Dynamical Multi-Commodity Flow Networks”**
- **Type:** Conference proceedings talk
- **Venue:** 2025 IEEE 64th Conference on Decision and Control (CDC)
- **Date:** 2025-12-10
- **Location:** Rio de Janeiro, Brazil
- **Body:** none (title/venue/date/location only).

---

## 7. Teaching  (`/teaching/`)

Flat reverse-chronological list. One real entry:

**Teaching Assistant — Mathematical Methods**
- **Type:** Undergraduate course
- **Institution:** Politecnico di Torino, Department of Mathematical Sciences  *(typo "Poltiecnico" corrected)*
- **Date:** 2026-03-01
- **Location:** Torino, Italy
- **Description (verbatim, source ends mid-sentence — closed with ellipsis, nothing invented):**
  > This course aims at completing the students’ education in basic mathematics. It introduces the theory of complex and analytic functions, distributions, Fourier and Laplace transforms …

---

## 8. CV  (`/cv/`)

The old `cv.json` was 100% template placeholder — **discarded**. The only real CV data is the Education block from `_pages/cv.md`, plus the collections above. Assemble the CV page from real content:

**Education**
- **Ph.D. in Mathematical Sciences**, Politecnico di Torino — *2027 (expected)*
- **M.S. in Computer Engineering** (Automation and Intelligent Cyber-Physical Systems), Politecnico di Torino — *2024*
- **B.S. in Computer Engineering**, Politecnico di Torino — *2022*

**Publications** — reference the two papers in §5.
**Talks** — reference the talk in §6.
**Teaching** — reference the entry in §7.

**Optional CV download:** there is currently **no** `cv.pdf` in the source (the old `/cv-json/` page linked to a nonexistent file). Do **not** add a broken "Download CV" button. `CPHSfinal.pdf` is the preprint, not a CV, so it is linked only from the publication.

---

## 9. Contact & academic profiles

Only real, verified links (every other social field on the old site was blank/commented placeholder):

| Label | URL |
|---|---|
| Email | davide.sipione@polito.it |
| Google Scholar | https://scholar.google.com/citations?hl=it&user=SnmPtB0AAAAJ |
| ORCID | https://orcid.org/0009-0007-1061-1293 |

No LinkedIn / GitHub / Twitter / ResearchGate / personal-website links exist — **do not invent any.**

---

## 10. Assets to carry forward

Copy these real assets from the old repo into the new site:

| Asset | New role |
|---|---|
| `images/Sipione.jpg` | Profile / avatar photo (home + CV) |
| `files/CPHSfinal.pdf` | Downloadable PDF for the "Noise-Robust Tolls" preprint |

Also generate a standard favicon/PWA icon set (the old site's icons were generic template icons; a fresh minimal favicon derived from initials or a simple mark is fine — no personal photo required).

---

## 11. Explicitly EXCLUDED (academicpages boilerplate — do NOT migrate)

- `_data/cv.json` — fake "GitHub University", "Paper Title Number 1–4", etc.
- `_data/authors.yml` — fake "Name Name" authors.
- All 5 `_posts/*` sample blog posts + `_drafts/post-draft.md` (lorem/monocle ipsum). **No blog on the new site** unless the author later adds real posts.
- `/cv-json/` page and its broken `files/cv.pdf` link.
- Placeholder images: `bio-photo.jpg`, `bio-photo-2.jpg`, `500x300.png`, `editing-talk.png`, `images/themes/*`.
- `images/profile.png` — unverified/ambiguous; **not** used (the configured avatar is `Sipione.jpg`).
- All blank/commented social fields; the old README (academicpages install docs); default `ui-text.yml`.

---

## 12. Content inventory summary

| Section | Real entries |
|---|---|
| Publications | 2 (1 conference, 1 preprint) |
| Talks | 1 |
| Teaching | 1 |
| Education (CV) | 3 degrees |
| Verified external links | 2 (Scholar, ORCID) + email |
| Real assets | 2 (profile photo, preprint PDF) |
