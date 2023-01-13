import assert from 'assert';
import {version} from "./index";

describe('version', () => {
  it('get current version', () => {
    const result = version();
    assert.deepStrictEqual(result, '1.0.0');
  })
})
