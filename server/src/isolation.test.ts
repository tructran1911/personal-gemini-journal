import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createJournal, listJournals, getJournalById } from './services/firestore';

describe('Data Isolation Test: Zero Cross-User Leakage', () => {
  it('should isolate entries between Alice and Bob', async () => {
    const userAlice = 'user_alice_test_1';
    const userBob = 'user_bob_test_2';

    // Alice tạo nhật ký bảo mật
    const aliceEntry = await createJournal(userAlice, {
      title: 'Alice Security Thoughts',
      content: 'Confidential thoughts of Alice.',
      turns: []
    });

    // Bob tạo nhật ký của riêng mình
    const bobEntry = await createJournal(userBob, {
      title: 'Bob Frontend Insights',
      content: 'Confidential thoughts of Bob.',
      turns: []
    });

    // Kiểm tra danh sách nhật ký của Alice: chỉ thấy bài của Alice
    const aliceJournals = await listJournals(userAlice);
    assert.equal(aliceJournals.some(j => j.id === aliceEntry.id), true);
    assert.equal(aliceJournals.some(j => j.id === bobEntry.id), false, 'VIOLATION: Alice can see Bob data!');

    // Kiểm tra danh sách nhật ký của Bob: chỉ thấy bài của Bob
    const bobJournals = await listJournals(userBob);
    assert.equal(bobJournals.some(j => j.id === bobEntry.id), true);
    assert.equal(bobJournals.some(j => j.id === aliceEntry.id), false, 'VIOLATION: Bob can see Alice data!');

    // Bob cố tình truy cập trực tiếp ID của Alice
    const bobAccessAliceDirect = await getJournalById(userBob, aliceEntry.id!);
    assert.equal(bobAccessAliceDirect, null, 'VIOLATION: Direct ID lookup leak across user boundary!');
  });
});
