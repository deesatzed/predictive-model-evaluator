export interface SimulationParams {
  totalPatients: number;
  positiveCases: number;
  truePositives: number;
  falsePositives: number;
  userContext?: string;
  // Capacity planning (optional)
  cohortSize?: number; // size of the real-world cohort for outreach
  dailyCapacity?: number; // contacts per day (e.g., 40)
  workdaysPerWeek?: number; // e.g., 5
  slaDays?: number; // e.g., contact all flagged within 10 days
}

export interface DerivedMetrics {
    negativeCases: number;
    falseNegatives: number;
    trueNegatives: number;
    precision: number;
    recall: number;
    specificity: number;
}