import type {
  EaCInterfaceCodeBlock,
  EaCInterfaceDetails,
  EaCInterfacePageDataType,
} from '../../../../.deps.ts';
import { clonePageDataType } from '../interfaceDefaults.ts';
import { buildCodeBlock } from './buildCodeBlock.ts';
import { parseMessages } from './parseMessages.ts';

export function buildInterfaceDetailsPatch(
  baseHandler: EaCInterfaceCodeBlock | undefined,
  basePage: EaCInterfaceCodeBlock | undefined,
  imports: string[],
  pageDataType: EaCInterfacePageDataType,
  handlerBody: string,
  handlerDescription: string,
  handlerMessages: string,
  handlerMessageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
  pageBody: string,
  pageDescription: string,
  pageMessages: string,
  pageMessageGroups: EaCInterfaceCodeBlock['MessageGroups'] | undefined,
): Partial<EaCInterfaceDetails> {
  return {
    Imports: imports.length ? imports : undefined,
    PageDataType: clonePageDataType(pageDataType),
    PageHandler: buildCodeBlock(
      baseHandler,
      handlerBody,
      handlerDescription,
      parseMessages(handlerMessages),
      handlerMessageGroups,
    ),
    Page: buildCodeBlock(
      basePage,
      pageBody,
      pageDescription,
      parseMessages(pageMessages),
      pageMessageGroups,
    ),
  };
}
