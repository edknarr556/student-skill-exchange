import { describe, it, expect, beforeEach } from 'vitest';
import * as state from '../src/store/state.js';

const { CURRENT_USER_ID } = state;

describe('store / session business logic', () => {
  beforeEach(() => {
    localStorage.clear();
    state.initStore();
  });

  it('seeds realistic sample data', () => {
    expect(state.getTutors().length).toBeGreaterThanOrEqual(6);
    expect(state.getCurrentUser().id).toBe(CURRENT_USER_ID);
    expect(state.getConversations().length).toBeGreaterThan(0);
  });

  it('new request starts pending with only the requester approved', () => {
    const tutor = state.getTutors()[0];
    const s = state.createSessionRequest({
      tutorId: tutor.id,
      skill: tutor.skillsTeach[0].skill,
      subject: tutor.skillsTeach[0].subject,
      datetime: new Date(Date.now() + 86400000).toISOString(),
      type: 'money',
      price: 20,
    });
    expect(s.status).toBe('pending');
    expect(s.approvals[CURRENT_USER_ID]).toBe(true);
    expect(s.approvals[tutor.id]).toBe(false);
  });

  it('BUSINESS RULE: confirms only when BOTH students approve', () => {
    const tutor = state.getTutors()[0];
    const s = state.createSessionRequest({
      tutorId: tutor.id,
      skill: 'X',
      subject: 'Y',
      datetime: new Date().toISOString(),
      type: 'money',
      price: 10,
    });
    // Requester re-approving does not confirm.
    expect(state.approveSession(s.id, CURRENT_USER_ID).status).toBe('pending');
    // Counterpart approval flips to confirmed.
    expect(state.approveSession(s.id, tutor.id).status).toBe('confirmed');
  });

  it('declined cannot be flipped to confirmed by approval', () => {
    const tutor = state.getTutors()[0];
    const s = state.createSessionRequest({
      tutorId: tutor.id,
      skill: 'X',
      subject: 'Y',
      datetime: new Date().toISOString(),
      type: 'money',
      price: 10,
    });
    expect(state.declineSession(s.id, tutor.id).status).toBe('declined');
    expect(state.approveSession(s.id, tutor.id).status).toBe('declined');
  });

  it('restoreSession reverts to a prior snapshot (powers Undo)', () => {
    const tutor = state.getTutors()[0];
    const s = state.createSessionRequest({
      tutorId: tutor.id,
      skill: 'X',
      subject: 'Y',
      datetime: new Date().toISOString(),
      type: 'money',
      price: 10,
    });
    const before = state.getSession(s.id); // pending snapshot
    state.approveSession(s.id, tutor.id); // -> confirmed
    expect(state.getSession(s.id).status).toBe('confirmed');
    state.restoreSession(before);
    expect(state.getSession(s.id).status).toBe('pending');
    expect(state.getSession(s.id).approvals[tutor.id]).toBe(false);
  });

  it('notificationLink resolves an explicit link or a sensible fallback', () => {
    expect(state.notificationLink({ link: '/messages/c-x' })).toBe(
      '/messages/c-x'
    );
    expect(
      state.notificationLink({ text: 'Diego approved the agreement' })
    ).toBe('/requests');
    expect(
      state.notificationLink({ text: 'Priya replied about your request' })
    ).toBe('/messages');
  });
});
