function normalizeIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(
    values
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  )];
}

function normalizePreferredSelections(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const criteriaId = Number(item.criteriaId);
      const yearsExperience = Number(item.yearsExperience);

      if (!Number.isInteger(criteriaId) || criteriaId <= 0) {
        return null;
      }

      if (!Number.isFinite(yearsExperience) || yearsExperience < 0) {
        return null;
      }

      return {
        criteriaId,
        yearsExperience,
      };
    })
    .filter(Boolean);
}

function computeMandatoryMet(selectedMandatoryIds, mustHaveCriteria) {
  const selectedSet = new Set(selectedMandatoryIds);
  return mustHaveCriteria.every((criteria) => selectedSet.has(criteria.id));
}

function computePreferredScore(preferredSelections, niceToHaveCriteria) {
  const weightMap = new Map(niceToHaveCriteria.map((criteria) => [criteria.id, criteria.weight ?? 0]));

  const score = preferredSelections.reduce((total, selection) => {
    if (!weightMap.has(selection.criteriaId)) {
      return total;
    }

    const weight = Number(weightMap.get(selection.criteriaId)) || 0;
    return total + weight * selection.yearsExperience;
  }, 0);

  return Number(score.toFixed(2));
}

function parseJsonField(rawValue, fallback) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  if (typeof rawValue === 'object') {
    return rawValue;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return fallback;
  }
}

module.exports = {
  normalizeIds,
  normalizePreferredSelections,
  computeMandatoryMet,
  computePreferredScore,
  parseJsonField,
};
