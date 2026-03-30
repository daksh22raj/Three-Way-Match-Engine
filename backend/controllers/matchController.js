import { performThreeWayMatch } from '../services/matchService.js';

export async function getMatchResult(req, res) {
  try {
    const poNumber = req.params.poNumber;
    if (!poNumber) return res.status(400).json({ error: 'poNumber is required' });

    const matchResult = await performThreeWayMatch(poNumber);
    res.json(matchResult);
  } catch (error) {
    console.error('Match Error:', error);
    res.status(500).json({ error: 'Failed to perform matching', details: error.message });
  }
}
