/**
 * @module pattern-detector
 * @description Detects recurring patterns in completed tasks (memories).
 * Used to surface productivity insights to the user.
 */

/**
 * @typedef {Object} Pattern
 * @property {'project_cluster'|'time_of_day'|'energy_mismatch'|'recurring_block'} type
 * @property {string}   description - Human-readable description
 * @property {number}   confidence  - 0–1
 * @property {Object[]} samples     - Supporting memories
 */

const MIN_SAMPLES = 3;

/**
 * Analyses an array of memories and returns detected patterns.
 *
 * @param {Object[]} memories - Array of completed/archived tasks
 * @returns {Pattern[]}
 */
export const detectPatterns = (memories) => {
  if (!memories || memories.length < MIN_SAMPLES) return [];

  const patterns = [
    ..._detectProjectClusters(memories),
    ..._detectTimeOfDayPatterns(memories),
    ..._detectEnergyMismatches(memories),
  ];

  // Sort by confidence descending
  return patterns.sort((a, b) => b.confidence - a.confidence);
};

// ── Private detectors ─────────────────────────────────────

/**
 * Detects projects with a high completion rate recently.
 */
const _detectProjectClusters = (memories) => {
  const projectCounts = {};
  const recent = memories.filter(m => {
    const age = Date.now() - new Date(m.completedAt).getTime();
    return age <= 7 * 24 * 60 * 60 * 1000; // last 7 days
  });

  for (const m of recent) {
    if (!m.projectId) continue;
    projectCounts[m.projectId] = (projectCounts[m.projectId] ?? 0) + 1;
  }

  return Object.entries(projectCounts)
    .filter(([, count]) => count >= MIN_SAMPLES)
    .map(([projectId, count]) => ({
      type: 'project_cluster',
      description: `High activity in project ${projectId} this week`,
      confidence: Math.min(1, count / 10),
      samples: recent.filter(m => m.projectId === projectId),
    }));
};

/**
 * Detects preferred work times (morning vs afternoon vs evening).
 */
const _detectTimeOfDayPatterns = (memories) => {
  const buckets = { morning: 0, afternoon: 0, evening: 0 };

  for (const m of memories) {
    if (!m.completedAt) continue;
    const hour = new Date(m.completedAt).getHours();
    if (hour >= 5  && hour < 12) buckets.morning++;
    else if (hour >= 12 && hour < 18) buckets.afternoon++;
    else buckets.evening++;
  }

  const total = memories.length;
  if (!total) return [];

  return Object.entries(buckets)
    .filter(([, count]) => count / total >= 0.5)
    .map(([time, count]) => ({
      type: 'time_of_day',
      description: `You tend to complete tasks in the ${time}`,
      confidence: count / total,
      samples: [],
    }));
};

/**
 * Detects tasks marked "high energy" that were mostly completed in evenings
 * (potential energy mismatch).
 */
const _detectEnergyMismatches = (memories) => {
  const highEnergy = memories.filter(m => m.energy === 'high');
  if (highEnergy.length < MIN_SAMPLES) return [];

  const lateCompletions = highEnergy.filter(m => {
    const hour = new Date(m.completedAt).getHours();
    return hour >= 21 || hour < 5;
  });

  const ratio = lateCompletions.length / highEnergy.length;
  if (ratio < 0.4) return [];

  return [{
    type: 'energy_mismatch',
    description: 'You often complete high-energy tasks late at night — consider scheduling them in the morning',
    confidence: ratio,
    samples: lateCompletions,
  }];
};
