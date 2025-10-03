import { assert } from './tests.deps.ts';
import OICorePack from '../src/.pack.ts';

Deno.test('oi-core pack default export exists', () => {
  assert(typeof OICorePack === 'object' || typeof OICorePack === 'function');
});
