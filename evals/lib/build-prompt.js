/**
 * Promptfoo prompt-function provider.
 *
 * Loads an agent's live system prompt from /agents/<...>.md, strips the
 * HTML comment header, and returns chat messages with {{user_input}}
 * substituted into the user turn.
 *
 * Usage in promptfooconfig.yaml:
 *   prompts:
 *     - id: <agent-id>
 *       label: <agent-id> live prompt
 *       file: file://../lib/build-prompt.js
 *   defaultTest:
 *     vars:
 *       agent_prompt_path: ../../agents/orchestration/ceo-v1.0.0.md
 *
 * The agent_prompt_path is resolved relative to this file's directory.
 */

const fs = require('fs');
const path = require('path');

function stripHeader(content) {
  // Strip the leading <!-- ... --> comment block that brain-repo agent
  // prompts use for metadata (model, temperature, status). The block ends
  // at the first --> that is followed by a blank line.
  return content.replace(/^<!--[\s\S]*?-->\s*\n/, '');
}

module.exports = function buildPrompt(arg1, arg2) {
  // Promptfoo 0.121+ calls prompt functions with a single context object:
  //   { vars, provider, config }
  // Older 0.x versions called with (vars, providerOptions). Accept both.
  const vars = arg1 && typeof arg1 === 'object' && 'vars' in arg1 ? arg1.vars : arg1;
  const promptPath = vars && vars.agent_prompt_path;
  if (!promptPath) {
    throw new Error(
      'evals/lib/build-prompt.js: missing agent_prompt_path in vars. ' +
        'Set it in defaultTest.vars in your promptfooconfig.yaml.'
    );
  }

  const absPath = path.resolve(__dirname, promptPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(
      `evals/lib/build-prompt.js: agent prompt file not found: ${absPath}`
    );
  }

  const raw = fs.readFileSync(absPath, 'utf8');
  const systemPrompt = stripHeader(raw).trim();

  const userInput = vars && vars.user_input;
  if (typeof userInput !== 'string') {
    throw new Error(
      'evals/lib/build-prompt.js: each test case must define vars.user_input.'
    );
  }

  // Promptfoo 0.121+ expects the function to return the chat-messages
  // array directly. Earlier versions accepted a JSON-stringified array;
  // 0.121 treats a string return as a single user message and the chat
  // structure is lost.
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ];
};
