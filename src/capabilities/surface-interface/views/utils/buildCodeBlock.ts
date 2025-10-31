import type { EaCInterfaceCodeBlock } from '../../../../.deps.ts';

export function buildCodeBlock(
  base: EaCInterfaceCodeBlock | undefined,
  code: string,
  description: string,
  messages: string[],
  messageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): EaCInterfaceCodeBlock | undefined {
  const trimmedCode = code.trim();
  const trimmedDescription = description.trim();
  const hasMessages = messages.length > 0;
  const hasGroups = messageGroups && messageGroups.length > 0;

  if (!trimmedCode && !trimmedDescription && !hasMessages && !hasGroups) {
    return undefined;
  }

  return {
    ...(base ?? {}),
    ...(trimmedCode ? { Code: code } : { Code: undefined }),
    ...(trimmedDescription ? { Description: description } : { Description: undefined }),
    ...(hasMessages ? { Messages: messages } : { Messages: undefined }),
    ...(hasGroups ? { MessageGroups: messageGroups } : { MessageGroups: undefined }),
  };
}
