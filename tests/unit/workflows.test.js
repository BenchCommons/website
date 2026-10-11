import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');

describe('deploy workflow', () => {
  it('runs only after the ci workflow succeeds', () => {
    expect(deploy).toMatch(/workflow_run:\s*\n\s*workflows: \[ci\]\s*\n\s*types: \[completed\]/);
    expect(deploy).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(deploy).not.toMatch(/^\s{2}(push|pull_request):/m);
  });

  it('never deploys code from a fork with the repository secrets', () => {
    expect(deploy).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
  });

  it('deploys the commit that ci tested', () => {
    expect(deploy).toContain('ref: ${{ github.event.workflow_run.head_sha }}');
  });
});
