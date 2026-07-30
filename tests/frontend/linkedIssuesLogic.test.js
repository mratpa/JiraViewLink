const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getCurrentIssueKey,
  getLinkedIssueCandidates,
  createLinkedIssueItem,
  createPropertyPayload,
} = require('../../src/frontend/linkedIssuesLogic');

test('getCurrentIssueKey prefers issueKey from context', () => {
  const context = { issueKey: 'ABC-123', issue: { key: 'ABC-999' } };
  assert.equal(getCurrentIssueKey(context), 'ABC-123');
});

test('getCurrentIssueKey falls back to nested issue key', () => {
  const context = { issue: { key: 'ABC-456' } };
  assert.equal(getCurrentIssueKey(context), 'ABC-456');
});

test('getLinkedIssueCandidates extracts linked issues from issue links', () => {
  const issuePayload = {
    issuelinks: [
      { outwardIssue: { key: 'ABC-100' } },
      { inwardIssue: { key: 'ABC-200' } },
      { unrelated: true },
    ],
  };

  assert.deepEqual(getLinkedIssueCandidates(issuePayload), ['ABC-100', 'ABC-200']);
});

test('createLinkedIssueItem maps fetched issue and property data into editable state', () => {
  const item = createLinkedIssueItem(
    { key: 'ABC-300' },
    { fields: { summary: 'Implement onboarding flow' } },
    '{"functionalRequirement":"Users can sign in","userStory":"As a user, I want to sign in"}'
  );

  assert.deepEqual(item, {
    key: 'ABC-300',
    summary: 'Implement onboarding flow',
    functionalRequirement: 'Users can sign in',
    userStory: 'As a user, I want to sign in',
  });
});

test('createPropertyPayload serializes editable values for save requests', () => {
  const payload = createPropertyPayload({
    key: 'ABC-300',
    functionalRequirement: 'Users can sign in',
    userStory: 'As a user, I want to sign in',
  });

  assert.deepEqual(payload, {
    method: 'PUT',
    path: '/rest/api/3/issue/ABC-300/properties/com.forge.linked-work-item',
    body: JSON.stringify({
      functionalRequirement: 'Users can sign in',
      userStory: 'As a user, I want to sign in',
    }),
  });
});
