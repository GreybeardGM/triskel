/**
 * Convert active d10 results of 10 to 0 and adjust the roll total accordingly.
 *
 * @param {Roll} roll - The evaluated Foundry roll to adjust.
 * @returns {number} The number of converted die results.
 */
export function convertD10TensToZero(roll) {
  if (!roll?.terms?.length) return 0;

  const DieTerm = foundry?.dice?.terms?.Die;
  const d10Terms = roll.terms.filter(t =>
    (DieTerm && t instanceof DieTerm && (t.faces ?? t._faces) === 10)
    || ((t.faces ?? t._faces) === 10 && Array.isArray(t.results))
  );

  if (!d10Terms.length) return 0;

  let converted = 0;
  d10Terms.forEach(term => {
    term.results?.forEach(result => {
      if (result?.active && result.result === 10) {
        result.result = 0;
        converted += 1;
      }
    });
  });

  if (!converted) return 0;

  const totalAdjustment = 10 * converted;
  const newTotal = (roll.total ?? roll._total ?? 0) - totalAdjustment;

  roll._total = newTotal;
  if (roll._root) roll._root._total = newTotal;
  roll.terms?.forEach(term => {
    if (term?._root) term._root._total = newTotal;
  });

  return converted;
}
