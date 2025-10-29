import { GoogleGenAI, Type } from "@google/genai";
// @ts-ignore
import moreStatsPrompt from '../more_stats_prompt.md?raw';
import type { SimulationParams } from '../types';

const getApiKey = (): string | undefined => {
    const viteKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) ? (import.meta as any).env.VITE_GEMINI_API_KEY : undefined;
    const nodeKey = (typeof process !== 'undefined' ? ((process as any).env?.GEMINI_API_KEY || (process as any).env?.API_KEY) : undefined);
    return viteKey || nodeKey;
};

export const analyzeMoreStats = async (params: SimulationParams): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("GEMINI API key not set. Provide VITE_GEMINI_API_KEY (Vite) or GEMINI_API_KEY/API_KEY (env).");
    }
    const ai = new GoogleGenAI({ apiKey });

    const { totalPatients, positiveCases, truePositives, falsePositives } = params;
    const negativeCases = totalPatients - positiveCases;
    const falseNegatives = Math.max(0, positiveCases - truePositives);
    const trueNegatives = Math.max(0, negativeCases - falsePositives);

    const dataBlock = `N: ${totalPatients}\nP: ${positiveCases}\nTP: ${truePositives}\nFP: ${falsePositives}\nFN: ${falseNegatives}\nTN: ${trueNegatives}`;
    const fullPrompt = `${moreStatsPrompt}\n\nDATA\n${dataBlock}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                temperature: 0.2,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing more stats:", error);
        return "An error occurred while generating more statistics.";
    }
};


export const parseScenarioWithGemini = async (context: string): Promise<Partial<SimulationParams>> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("GEMINI API key not set. Provide VITE_GEMINI_API_KEY (Vite) or GEMINI_API_KEY/API_KEY (env).");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        From the following user-provided clinical scenario, extract the specified numerical parameters.
        If a value isn't mentioned, leave it out of the JSON.

        SCENARIO:
        ---
        ${context}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        totalPatients: {
                            type: Type.INTEGER,
                            description: 'The total number of patients or scans in the sample. e.g., "1000 scans"'
                        },
                        positiveCases: {
                            type: Type.INTEGER,
                            description: 'The number of actual positive cases for the disease. e.g., "10 positive ICH cases"'
                        },
                        truePositives: {
                            type: Type.INTEGER,
                            description: 'The number of positive cases correctly identified by the model. e.g., "identified 8 of those cases"'
                        },
                        falsePositives: {
                            type: Type.INTEGER,
                            description: 'The number of healthy patients incorrectly flagged by the model. e.g., "flagged 50 healthy patients"'
                        },
                        cohortSize: {
                            type: Type.INTEGER,
                            description: 'Operational cohort size for outreach (if stated).'
                        },
                        dailyCapacity: {
                            type: Type.INTEGER,
                            description: 'Capacity per day (e.g., 42 per day).'
                        },
                        workdaysPerWeek: {
                            type: Type.INTEGER,
                            description: 'Work days per week (e.g., 5 for weekdays only).'
                        },
                        slaDays: {
                            type: Type.INTEGER,
                            description: 'SLA days within which flags should be cleared.'
                        },
                        horizonDays: {
                            type: Type.INTEGER,
                            description: 'Planning horizon in days (e.g., 365 for 1 year).'
                        }
                    },
                },
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as Partial<SimulationParams>;

    } catch (error) {
        console.error("Error parsing scenario with Gemini:", error);
        throw new Error("Failed to parse scenario. The model response may have been invalid.");
    }
};


export const analyzeClinicalImpact = async (params: SimulationParams): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("GEMINI API key not set. Provide VITE_GEMINI_API_KEY (Vite) or GEMINI_API_KEY/API_KEY (env).");
    }
    const ai = new GoogleGenAI({ apiKey });

    const { totalPatients, positiveCases, truePositives, falsePositives, userContext, cohortSize, dailyCapacity, workdaysPerWeek, slaDays } = params;
    const negativeCases = totalPatients - positiveCases;
    const falseNegatives = positiveCases - truePositives;
    const trueNegatives = negativeCases - falsePositives;
    const prevFrac = totalPatients > 0 ? (positiveCases / totalPatients) : 0;
    const precisionFrac = (truePositives + falsePositives > 0) ? (truePositives / (truePositives + falsePositives)) : 0;
    const recallFrac = (positiveCases > 0) ? (truePositives / positiveCases) : 0;
    const prevalence = (prevFrac * 100).toFixed(2);
    const precision = (precisionFrac * 100).toFixed(1);
    const recall = (recallFrac * 100).toFixed(1);

    // Operational fit calculations (if capacity provided)
    const N = (cohortSize && cohortSize > 0) ? cohortSize : totalPatients;
    const Cday = dailyCapacity ?? 0;
    const L = slaDays ?? 0;
    const allowedFraction = (N > 0 && Cday > 0 && L > 0) ? (Cday * L) / N : 0;
    const flaggedRateCurrent = totalPatients > 0 ? ((truePositives + falsePositives) / totalPatients) : 0;
    const flaggedCohortCurrent = Math.round(flaggedRateCurrent * (N || 0));
    const daysToClearCurrent = (Cday > 0) ? Math.ceil(flaggedCohortCurrent / Cday) : 0;
    const backlogAtSlaCurrent = Math.max(0, flaggedCohortCurrent - Cday * L);
    const tpPerDayCurrent = Math.round(Math.min(Cday, flaggedCohortCurrent) * (precisionFrac || 0));
    const fpPerDayCurrent = Math.round(Math.min(Cday, flaggedCohortCurrent) * (1 - (precisionFrac || 0)));

    // Recommended within-capacity operating point on PR plane
    let recRecall = recallFrac;
    let recPrecision = precisionFrac;
    if (allowedFraction > 0 && prevFrac > 0) {
        const rCap = Math.min(1, allowedFraction / prevFrac);
        const requiredPAtCurrentR = (recallFrac * prevFrac) / allowedFraction;
        if (precisionFrac + 1e-9 < requiredPAtCurrentR) {
            if (recallFrac > rCap) {
                recRecall = rCap;
                recPrecision = Math.min(1, (recRecall * prevFrac) / allowedFraction);
            } else {
                recRecall = recallFrac;
                recPrecision = Math.min(1, requiredPAtCurrentR);
            }
        }
    }
    const flaggedRateRec = (allowedFraction > 0 && prevFrac > 0) ? Math.min(allowedFraction, (recRecall * prevFrac) / Math.max(recPrecision, 1e-9)) : 0;
    const flaggedCohortRec = Math.round(flaggedRateRec * (N || 0));
    const daysToClearRec = (Cday > 0) ? Math.ceil(flaggedCohortRec / Cday) : 0;
    const backlogAtSlaRec = Math.max(0, flaggedCohortRec - Cday * L);
    const tpPerDayRec = Math.round(Math.min(Cday, flaggedCohortRec) * (recPrecision || 0));
    const fpPerDayRec = Math.round(Math.min(Cday, flaggedCohortRec) * (1 - (recPrecision || 0)));


    const prompt = `
        Act as an expert in clinical biostatistics and epidemiology, drafting a compelling, plain-language memo for a hospital's predictive models committee. The audience includes clinicians and administrators who are data-science aware but not statisticians. Be authoritative, clear, and practical.

        Important: This memo is based on a simulation to explain concepts. Do not imply these numbers come from real patients or a deployed system.

        **User's Context & Concern:**
        ${userContext || "The user is evaluating an AI model for a clinical use case."}

        **Current Simulation Numbers:**
        - Total Scans Considered: ${totalPatients}
        - Actual Positive Cases (Prevalence): ${positiveCases} (${prevalence}%)
        - True Positives: ${truePositives}
        - False Positives: ${falsePositives}
        - True Negatives: ${trueNegatives}
        - False Negatives: ${falseNegatives}
        - Precision (PPV): ${precision}%
        - Recall (Sensitivity): ${recall}%

        Do not format as a letter. Do not include To, From, Date, Subject, salutations, or signatures.

        **Your Task:**
        1) Executive Summary: One sentence with the take‑home.

        2) Simulation Caveat: One sentence that this is a didactic simulation, not real patient data.

        3) First Principles Delta vs Baseline (per 1000 patients):
           - Baseline (All Negative): 0 TP, 0 FP, ${positiveCases} FN scaled per 1000.
           - Added Benefit: +TP per 1000 achieved by the simulated AI.
           - Failures to get that benefit: remaining FN per 1000.
           - Cost to get that benefit: FP per 1000 (follow‑ups, anxiety, capacity).

        4) Real‑World Impact (So What?):
           - Short bullets for patient burden (FP) and clinical risk (FN).

        5) Metric Trap (AUROC vs AUPRC):
           - AUROC can look good in low prevalence due to many easy TN (${trueNegatives}).
           - AUPRC focuses on PPV/Recall; better for imbalanced data.

        6) Actionable Recommendation:
           - Require AUPRC, operating‑point PPV/Recall under acceptable FP rates, prevalence‑adjusted reporting, and per‑1000 summaries.

        7) Operational Fit (if capacity provided):
           - Use the inputs below to summarize capacity impact and recommend an operating point that meets capacity.
           - Inputs:
             - Cohort Size: ${N || 0}
             - Daily Capacity: ${Cday || 0}
             - SLA (days): ${L || 0}
           - Current threshold:
             - Flagged in cohort: ${flaggedCohortCurrent}
             - Days to clear: ${daysToClearCurrent}
             - Backlog at SLA: ${backlogAtSlaCurrent}
             - Expected per day: TP ${tpPerDayCurrent}, FP ${fpPerDayCurrent}
           - Recommended within-capacity operating point (precision/recall): ${(recPrecision * 100).toFixed(1)}% PPV @ ${(recRecall * 100).toFixed(1)}% recall
             - Flagged in cohort: ${flaggedCohortRec}
             - Days to clear: ${daysToClearRec}
             - Backlog at SLA: ${backlogAtSlaRec}
             - Expected per day: TP ${tpPerDayRec}, FP ${fpPerDayRec}

        Use markdown headings, bold emphasis, and bulleted lists for readability.
        Keep it concise: prefer bullets over paragraphs, ≤1 short sentence per bullet, total text ≈200 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.4,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing clinical impact:", error);
        return "An error occurred while analyzing the scenario. Please check the console for details.";
    }
};