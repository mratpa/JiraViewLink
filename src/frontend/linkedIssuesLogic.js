const PROPERTY_KEY = 'com.forge.linked-work-item';

function getCurrentIssueKey(context) {
  return context?.issueKey || context?.issue?.key || 'unknown';
}

function getLinkedIssueCandidates(issuePayload) {
  return (issuePayload?.issuelinks || [])
    .map((link) => link.outwardIssue || link.inwardIssue)
    .filter(Boolean)
    .map((linkedIssue) => linkedIssue.key)
    .filter(Boolean);
}

function createLinkedIssueItem(linkedIssue, issueDetail, propertyValue) {
  let storedValues = {};

  if (typeof propertyValue === 'string') {
    try {
      storedValues = JSON.parse(propertyValue);
    } catch (error) {
      storedValues = {};
    }
  } else if (propertyValue) {
    storedValues = propertyValue;
  }

  return {
    key: linkedIssue.key,
    summary: issueDetail?.fields?.summary || 'Untitled issue',
    functionalRequirement: storedValues.functionalRequirement || '',
    userStory: storedValues.userStory || '',
  };
}

function createPropertyPayload(item) {
  return {
    method: 'PUT',
    path: `/rest/api/3/issue/${item.key}/properties/${PROPERTY_KEY}`,
    body: JSON.stringify({
      functionalRequirement: item.functionalRequirement,
      userStory: item.userStory,
    }),
  };
}

module.exports = {
  PROPERTY_KEY,
  getCurrentIssueKey,
  getLinkedIssueCandidates,
  createLinkedIssueItem,
  createPropertyPayload,
};
