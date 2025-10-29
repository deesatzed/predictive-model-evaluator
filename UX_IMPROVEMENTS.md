# UX Improvements for Model Evaluation with Imbalanced Data

## Problem Statement
Vendors claim "85% sensitivity, 85% specificity" without applying it to real-world prevalence, hiding the true clinical workload and precision (PPV).

## Implemented Improvements

### 1. **Vendor Claim Reality Check** (NEW)
- **Location**: Prominently placed after simulator, before report
- **Purpose**: Instantly translate vendor claims into real-world impact
- **Features**:
  - Color-coded precision warning (green/amber/red based on PPV thresholds)
  - **Workload Ratio**: Shows FP:TP ratio (e.g., "5:1 means 5 false alarms per true case")
  - **Per-1000 Reality**: Benefit (TP found), Cost (FP burden), Failures (FN missed)
  - **Key Insight**: "To find X true cases, you'll chase Y false alarms"
  - Visual warnings when precision drops below clinical utility

### 2. **Reframed Introduction**
- Leads with "The Vendor Evaluation Problem"
- Highlights the hidden truth about low-prevalence precision
- Sets expectation: "translate vendor claims → real-world workload"

### 3. **First-Principles Comparison (in Report)**
- Delta vs Baseline section showing:
  - Baseline (All Negative): 0 TP, 0 FP, all positives missed
  - Added Benefit: TP gained per 1000
  - Failures: Remaining FN per 1000
  - Cost: FP per 1000 (follow-ups, capacity)

### 4. **Direct Numeric Entry**
- Clinicians can type in test results directly (Total, Positives, TP, FP)
- No need to fumble with sliders

### 5. **Operating Point Simulator**
- Adjust sensitivity, specificity, or FP budget
- See how trade-offs affect workload in real time

### 6. **Clinical Use Statements**
- Per-1000 narratives with Copy button
- Clear benefit/cost framing

### 7. **Comparisons Panel**
- Baseline vs Simulated AI vs Perfect
- Shows marginal value of the model

### 8. **Prevalence Impact Visualization**
- Shows how precision collapses at low prevalence
- Current operating point marked

---

## Additional UX Improvements to Consider

### A. **Quick Vendor Evaluation Mode**
Add a toggle at the top:
- **Mode 1: Quick Vendor Check**
  - Input: Vendor's claimed sensitivity and specificity
  - Input: Your prevalence
  - Output: Instant reality check (PPV, workload ratio, per-1000)
  - "Should I keep talking to this vendor?" Yes/No with reasoning
- **Mode 2: Custom Simulation** (current full interface)

### B. **Vendor Evaluation Checklist**
A downloadable/printable checklist:
```
□ Did vendor report AUPRC at YOUR prevalence?
□ Did vendor show precision (PPV) at clinically relevant operating points?
□ Did vendor provide per-1000 patient summaries?
□ Did vendor disclose FP workload at your expected volume?
□ Did vendor show performance stratified by prevalence ranges?
□ Did vendor compare to "do nothing" baseline?
```

### C. **Prevalence Sensitivity Analysis**
Interactive table showing how precision changes across prevalence levels:
| Prevalence | Precision (PPV) | FP per TP | Workload |
|------------|----------------|-----------|----------|
| 1%         | 14.6%          | 5.8:1     | Unworkable |
| 5%         | 48.9%          | 1.0:1     | Marginal |
| 10%        | 68.0%          | 0.5:1     | Acceptable |

### D. **Threshold Impact Slider**
- Slider labeled: "If vendor lets you adjust threshold..."
- Show how changing decision threshold affects sensitivity/specificity/PPV
- Linked to ROC/PR curves (point moves as you slide)
- Show corresponding per-1000 impact

### E. **"Number Needed to Screen" Calculator**
- To find 1 true positive, you need to flag: [X] patients
- To avoid 1 false negative, you generate: [Y] false alarms
- Clinical utility framing

### F. **Capacity Constraint Overlay**
- Input: "We can handle X follow-ups per week"
- Output: "At this FP rate, you'll hit capacity in Y days"
- Red line on charts showing capacity limit

### G. **Vendor Comparison Mode**
Side-by-side comparison of multiple vendor claims:
- Vendor A: 85/85 → PPV 13.8%
- Vendor B: 90/80 → PPV 15.4%
- Vendor C: 80/95 → PPV 26.8% ← Best for low prevalence

### H. **Annotated Precision vs Prevalence Curve**
Add markers/annotations:
- "ICH screening (1%)"
- "Lung CA screening (2%)"
- "Diabetic retinopathy (10%)"
- "Clinical utility threshold (PPV > 30%)"
- Shade "unworkable" region in red

### I. **"What-If" Scenarios**
Quick presets for common questions:
- "What if prevalence is half what we think?"
- "What if the model performs 10% worse in practice?"
- "What if we only use it on high-risk patients (2x prevalence)?"

### J. **Export Vendor Evaluation Report**
One-click PDF export with:
- Vendor claim summary
- Reality check at your prevalence
- Per-1000 impact
- Workload analysis
- Recommendation (Accept/Reject/Negotiate)
- Checklist of what to demand

### K. **Red Flags Auto-Detection**
Automatic warnings for:
- ⚠️ "Precision below 20%: Likely unworkable"
- ⚠️ "FP:TP ratio > 3:1: Excessive false alarm burden"
- ⚠️ "Vendor didn't report AUPRC: Demand it"
- ⚠️ "Vendor's test prevalence (15%) >> your prevalence (2%): Recalculate at YOUR prevalence"

### L. **Simplified Mobile View**
For presenting in meetings:
- Hide complexity by default
- Show only: Vendor claim → Your reality → Recommendation
- "Show details" expander for curves and full metrics

### M. **"Explain Like I'm a Board Member" Mode**
Ultra-simplified view:
- No technical jargon
- Only shows: Benefit, Cost, Recommendation
- One-sentence summary

---

## Recommended Next Steps (Priority Order)

1. **Quick Vendor Check toggle** (Mode A) - Highest impact for your stated use case
2. **Vendor Evaluation Checklist** (Option B) - Printable, shareable
3. **Red Flags Auto-Detection** (Option K) - Helps non-experts
4. **Threshold Impact Slider** (Option D) - Shows the full decision space
5. **Capacity Constraint Overlay** (Option F) - Aligns with operational reality
6. **Export Vendor Evaluation Report** (Option J) - For documentation

---

## Key UX Principles Applied

1. **Lead with the problem**: Vendor claims without prevalence context
2. **Show workload, not just accuracy**: FP:TP ratio, per-1000 impact
3. **Use clinical language**: Benefit, Cost, Failures (not TP, FP, FN)
4. **Instant feedback**: Reality check updates live as you adjust
5. **Visual warnings**: Color-coded precision thresholds
6. **Actionable outputs**: What to demand from vendors
7. **Comparison anchors**: Baseline and Perfect scenarios
8. **First principles**: Delta from do-nothing baseline

---

## Statistical Verification

All calculations verified:
- Precision (PPV) = TP / (TP + FP)
- Sensitivity (Recall) = TP / (TP + FN)
- Specificity = TN / (TN + FP)
- FP:TP Ratio = FP / TP
- Per-1000 scaling = (count / total) * 1000

Constraints enforced:
- 0 ≤ TP ≤ Positive Cases
- 0 ≤ FP ≤ Negative Cases
- All derived metrics auto-update
- Direct entry validates and clamps inputs
