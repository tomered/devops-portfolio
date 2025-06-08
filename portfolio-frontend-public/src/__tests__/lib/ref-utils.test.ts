import { describe, it, expect } from 'vitest';
import { castToHTMLDivRef } from '../../lib/ref-utils';
import { createRef } from 'react';

describe('castToHTMLDivRef', () => {
  it('casts a ref to HTMLDivElement', () => {
    const ref = createRef<HTMLButtonElement>();
    const divRef = castToHTMLDivRef(ref);
    // The casted ref should be the same object
    expect(divRef).toBe(ref);
  });
}); 