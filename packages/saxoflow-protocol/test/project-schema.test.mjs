import test from 'node:test';
import assert from 'node:assert/strict';
import { Schemas } from '../dist/index.js';

test('valid minimal project parses', () => {
  const cfg = {
    project: {
      name: 'demo',
      top: 'top',
      language: 'systemverilog',
      pdk: 'sky130',
      clock: { name: 'clk', period_ns: 10 }
    },
    paths: { rtl: 'rtl/', build: '.saxoflow/build' },
    flow: { profile: 'asic-sky130-default', stages: ['synth'] }
  };
  assert.doesNotThrow(() => Schemas.ProjectSchema.parse(cfg));
});

test('missing project.top fails', () => {
  const bad = {
    project: {
      name: 'demo',
      language: 'systemverilog',
      pdk: 'sky130',
      clock: { name: 'clk', period_ns: 10 }
    },
    paths: { rtl: 'rtl/', build: '.saxoflow/build' },
    flow: { profile: 'asic-sky130-default', stages: ['synth'] }
  };
  assert.throws(() => Schemas.ProjectSchema.parse(bad));
});
