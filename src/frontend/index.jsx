import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Heading, SectionMessage, Stack, Text, TextArea, Textfield } from '@forge/react';
import { view, requestJira } from '@forge/bridge';
import { createLinkedIssueItem, createPropertyPayload, getCurrentIssueKey, getLinkedIssueCandidates } from './linkedIssuesLogic';

const App = () => {
  const [issueKey, setIssueKey] = useState('');
  const [linkedIssues, setLinkedIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadLinkedIssues = async () => {
      setIsLoading(true);
      setMessage(null);

      try {
        debugger;
        const context = await view.getContext();
        const currentIssueKey = getCurrentIssueKey(context);
        setIssueKey(currentIssueKey);

        const issuePayload = await requestJira(`/rest/api/3/issue/${currentIssueKey}`, {
          headers: {
            Accept: 'application/json',
          },
        });

        const linkedIssueCandidates = getLinkedIssueCandidates(issuePayload);
        const linkedIssueDetails = await Promise.all(
          linkedIssueCandidates.map(async (linkedIssueKey) => {
            const issueDetail = await requestJira(`/rest/api/3/issue/${linkedIssueKey}`, {
              headers: {
                Accept: 'application/json',
              },
            });

            let propertyValue = {};
            try {
              propertyValue = await requestJira(`/rest/api/3/issue/${linkedIssueKey}/properties/com.forge.linked-work-item`, {
                headers: {
                  Accept: 'application/json',
                },
              });
            } catch (error) {
              propertyValue = {};
            }

            return createLinkedIssueItem({ key: linkedIssueKey }, issueDetail, propertyValue);
          })
        );
        setLinkedIssues(linkedIssueDetails);
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Unable to load the linked work items right now',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadLinkedIssues();
  }, []);

  const handleFieldChange = (issueKeyToEdit, fieldName, value) => {
    setLinkedIssues((current) =>
      current.map((item) => (item.key === issueKeyToEdit ? { ...item, [fieldName]: value } : item))
    );
  };

  const handleSave = async (item) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const propertyPayload = createPropertyPayload(item);
      await requestJira(propertyPayload.path, {
        method: propertyPayload.method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: propertyPayload.body,
      });

      setMessage({
        type: 'success',
        text: `Saved requirements for ${item.key}.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Unable to save updates for ${item.key}.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack space="space.200">
      <Heading size="medium">Linked Jira work items</Heading>
      <Text>Review the linked work items and capture the functional requirement and user story together.</Text>
      {issueKey ? <Text>Current issue: {issueKey}</Text> : null}
      {message ? (
        <SectionMessage title={message.type === 'success' ? 'Saved' : 'Update needed'}>
          {message.text}
        </SectionMessage>
      ) : null}
      {isLoading ? (
        <Text>Loading linked work items...</Text>
      ) : linkedIssues.length === 0 ? (
        <Text>No linked work items were found for this issue.</Text>
      ) : (
        linkedIssues.map((item) => (
          <SectionMessage key={item.key} title={`${item.key} · ${item.summary}`}>
            <Stack space="space.100">
              <Textfield
                label="Functional requirement"
                value={item.functionalRequirement}
                onChange={(event) => handleFieldChange(item.key, 'functionalRequirement', event.target.value)}
              />
              <TextArea
                label="User story"
                value={item.userStory}
                onChange={(event) => handleFieldChange(item.key, 'userStory', event.target.value)}
              />
              <Button onClick={() => handleSave(item)}>{isSaving ? 'Saving...' : 'Save details'}</Button>
            </Stack>
          </SectionMessage>
        ))
      )}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
