import { getFunctions, httpsCallable } from 'firebase/functions';

export async function getEvents(params = {}) {
  const functions = getFunctions(); // ensure firebase app initialized earlier
  const fetchEvents = httpsCallable(functions, 'fetchEvents');
  const res = await fetchEvents(params);
  return res.data?.events || [];
}