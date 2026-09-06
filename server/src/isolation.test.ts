import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, listJournals, getJournalById } from './services/firestore';

describe('Data Isolation Test: Zero Cross-User Leakage', () => {
  it('should isolate entries between Alice and Bob', async () => {
    const userAlice = 'user_alice_test_1';
    const userBob = 'user_bob_test_2';

    // Alice creates secure personal journal
    const aliceEntry = await createJournal(userAlice, {
      title: 'Alice Security Thoughts',
      content: 'Confidential thoughts of Alice.',
      turns: []
    });

    // Bob creates his own journal
    const bobEntry = await createJournal(userBob, {
      title: 'Bob Frontend Insights',
      content: 'Confidential thoughts of Bob.',
      turns: []
    });

    // Verify Alice's journal list: only Alice's records appear
    const aliceJournals = await listJournals(userAlice);
    assert.equal(aliceJournals.some(j => j.id === aliceEntry.id), true);
    assert.equal(aliceJournals.some(j => j.id === bobEntry.id), false, 'VIOLATION: Alice can see Bob data!');

    // Verify Bob's journal list: only Bob's records appear
    const bobJournals = await listJournals(userBob);
    assert.equal(bobJournals.some(j => j.id === bobEntry.id), true);
    assert.equal(bobJournals.some(j => j.id === aliceEntry.id), false, 'VIOLATION: Bob can see Alice data!');

    // Bob attempts direct ID access on Alice's entry
    const bobAccessAliceDirect = await getJournalById(userBob, aliceEntry.id!);
    assert.equal(bobAccessAliceDirect, null, 'VIOLATION: Direct ID lookup leaked across user boundary!');
  });
});
