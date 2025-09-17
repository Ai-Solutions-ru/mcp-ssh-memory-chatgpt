const HOME_DIR = '/home/mcp';

const sshSetupScript = [
  'set -euo pipefail',
  `export HOME="${HOME_DIR}"`,
  'mkdir -p "$HOME/.ssh"',
  'chmod 700 "$HOME/.ssh"',
  'printf "%s\\n" "$SSH_PRIVATE_KEY" > "$HOME/.ssh/id_ed25519"',
  'printf "%s\\n" "$SSH_PUBLIC_KEY" > "$HOME/.ssh/id_ed25519.pub"',
  'printf "%s\\n" "$SSH_KNOWN_HOSTS" > "$HOME/.ssh/known_hosts"',
  'chmod 600 "$HOME/.ssh/id_ed25519" "$HOME/.ssh/id_ed25519.pub" "$HOME/.ssh/known_hosts"',
  'touch "$HOME/.ssh/config"',
  'exec npx --yes @aiondadotcom/mcp-ssh@1.1.0 --silent'
].join(' && ');

const memoryBankScript = [
  'set -euo pipefail',
  `export HOME="${HOME_DIR}"`,
  'mkdir -p "$HOME/workspace"',
  'exec npx --yes @aakarsh-sasi/memory-bank-mcp --path "$HOME/workspace" --folder memory-bank'
].join(' && ');

export const buildProxyConfig = ({ baseUrl, authToken, username }) => ({
  mcpProxy: {
    baseURL: baseUrl,
    addr: ':8080',
    name: `${username}-proxy`,
    version: '1.0.0',
    type: 'sse',
    options: {
      logEnabled: false,
      authTokens: [authToken]
    }
  },
  mcpServers: {
    ssh: {
      command: '/bin/sh',
      args: ['-c', sshSetupScript],
      env: {
        HOME: HOME_DIR,
        MCP_SILENT: 'true',
        SSH_PRIVATE_KEY: '${SSH_PRIVATE_KEY}',
        SSH_PUBLIC_KEY: '${SSH_PUBLIC_KEY}',
        SSH_KNOWN_HOSTS: '${SSH_KNOWN_HOSTS}'
      },
      options: {
        logEnabled: false
      }
    },
    memory: {
      command: '/bin/sh',
      args: ['-c', memoryBankScript],
      env: {
        HOME: HOME_DIR,
        MCP_SILENT: 'true'
      }
    }
  }
});
