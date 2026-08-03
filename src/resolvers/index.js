import Resolver from '@forge/resolver';

const resolver = new Resolver();


resolver.define('getIssueKey', async ({ context }) => {
  // Extract issueKey from the extension context
  const { issueKey } = context.extensionContext;
  return issueKey;
});


export const handler = resolver.getDefinitions();
